/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SubjectConfig, INITIAL_SUBJECTS } from '../data/defaultSubjects';
import {
  RevisionItem,
  calculateNextInterval,
  computeNextReviewDate,
  isRevisionOverdue,
  deduplicateRevisions,
  ReviewPerformance,
} from '../logic/spacedRepetition';
import { QuizResult } from '../logic/scoring';

export interface StudentProfile {
  name: string;
  enrollmentNo: string;
  collegeName: string;
  branch: string;
  semester: string;
  targetGpa: string;
  dailyStudyTargetHours: number;
  examStartDate: string;
}

export interface QuizAttemptRecord {
  id: string;
  subjectId: string;
  subjectName: string;
  unitTitle?: string;
  topicName?: string;
  difficulty: string;
  timestamp: string;
  result: QuizResult;
}

export interface StudySessionRecord {
  id: string;
  subjectId: string;
  subjectName: string;
  topicName: string;
  durationMinutes: number;
  timestamp: string;
  notes?: string;
}

export interface UploadedMaterial {
  id: string;
  title: string;
  subjectId: string;
  fileName: string;
  fileSizeBytes: number;
  extractedText: string;
  uploadedAt: string;
  unitNumber?: number;
  topicsIdentifiedCount: number;
}

interface StudyOsContextType {
  profile: StudentProfile;
  updateProfile: (updates: Partial<StudentProfile>) => void;
  subjects: SubjectConfig[];
  activeSubject: SubjectConfig;
  setActiveSubjectId: (id: string) => void;
  updateSubject: (subjectId: string, updates: Partial<SubjectConfig>) => void;
  addTopicToUnit: (subjectId: string, unitId: string, topicName: string, subtopics: string[]) => void;
  updateTopicVerification: (subjectId: string, unitId: string, topicId: string, isVerified: boolean) => void;
  updateTopicConfidence: (subjectId: string, unitId: string, topicId: string, confidence: 'low' | 'medium' | 'high') => void;
  revisionQueue: RevisionItem[];
  recordRevisionReview: (revisionId: string, performance: ReviewPerformance) => void;
  rescheduleRevision: (revisionId: string, newDateIso: string) => void;
  quizAttempts: QuizAttemptRecord[];
  recordQuizAttempt: (attempt: Omit<QuizAttemptRecord, 'id' | 'timestamp'>) => void;
  studySessions: StudySessionRecord[];
  recordStudySession: (session: Omit<StudySessionRecord, 'id' | 'timestamp'>) => void;
  uploadedMaterials: UploadedMaterial[];
  addUploadedMaterial: (material: Omit<UploadedMaterial, 'id' | 'uploadedAt'>) => void;
  deleteUploadedMaterial: (materialId: string) => void;
  serverOnline: boolean;
  hasGeminiKey: boolean;
  exportData: () => string;
  importData: (jsonStr: string) => boolean;
  resetAllData: () => void;
}

const STORAGE_KEY = 'studyos_btech_data_v1';

const DEFAULT_PROFILE: StudentProfile = {
  name: 'Aarav Sharma',
  enrollmentNo: 'BT26CSE042',
  collegeName: 'National Institute of Technology',
  branch: 'Computer Science and Engineering',
  semester: 'Semester 1',
  targetGpa: '9.2 / 10',
  dailyStudyTargetHours: 4,
  examStartDate: '2026-11-18',
};

const INITIAL_REVISIONS: RevisionItem[] = [
  {
    id: 'rev-math-1',
    subjectId: 'math',
    subjectName: 'Engineering Mathematics',
    topicId: 'math-t1',
    topicName: 'Eigenvalues & Eigenvectors',
    unitTitle: 'Unit 1: Matrices & Linear Algebra',
    intervalDays: 3,
    repetitionCount: 2,
    lastReviewedAt: '2026-10-25T08:00:00Z',
    nextReviewAt: '2026-10-28', // Due today!
    lastScorePercent: 75,
    confidence: 'medium',
    consecutiveCorrect: 1,
  },
  {
    id: 'rev-bee-1',
    subjectId: 'bee',
    subjectName: 'Basic Electrical Engineering',
    topicId: 'bee-t3',
    topicName: 'Sinusoidal Steady State & RLC Series Circuit',
    unitTitle: 'Unit 2: AC Fundamentals',
    intervalDays: 1,
    repetitionCount: 1,
    lastReviewedAt: '2026-10-26T14:30:00Z',
    nextReviewAt: '2026-10-27', // Overdue
    lastScorePercent: 50,
    confidence: 'low',
    consecutiveCorrect: 0,
  },
  {
    id: 'rev-chem-1',
    subjectId: 'chem',
    subjectName: 'Engineering Chemistry',
    topicId: 'chem-t4',
    topicName: 'Mechanism of Electrochemical Corrosion',
    unitTitle: 'Unit 2: Electrochemistry & Corrosion',
    intervalDays: 7,
    repetitionCount: 3,
    lastReviewedAt: '2026-10-24T18:00:00Z',
    nextReviewAt: '2026-10-31', // Upcoming
    lastScorePercent: 88,
    confidence: 'high',
    consecutiveCorrect: 2,
  },
];

const StudyOsContext = createContext<StudyOsContextType | undefined>(undefined);

export const StudyOsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved state or default
  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_profile`);
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [subjects, setSubjects] = useState<SubjectConfig[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_subjects`);
      return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
    } catch {
      return INITIAL_SUBJECTS;
    }
  });

  const [activeSubjectId, setActiveSubjectId] = useState<string>('math');

  const [revisionQueue, setRevisionQueue] = useState<RevisionItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_revisions`);
      return saved ? JSON.parse(saved) : INITIAL_REVISIONS;
    } catch {
      return INITIAL_REVISIONS;
    }
  });

  const [quizAttempts, setQuizAttempts] = useState<QuizAttemptRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_quizzes`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [studySessions, setStudySessions] = useState<StudySessionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_sessions`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [uploadedMaterials, setUploadedMaterials] = useState<UploadedMaterial[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_materials`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(true);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_profile`, JSON.stringify(profile));
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_subjects`, JSON.stringify(subjects));
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  }, [subjects]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_revisions`, JSON.stringify(revisionQueue));
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  }, [revisionQueue]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_quizzes`, JSON.stringify(quizAttempts));
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  }, [quizAttempts]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_sessions`, JSON.stringify(studySessions));
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  }, [studySessions]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_materials`, JSON.stringify(uploadedMaterials));
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  }, [uploadedMaterials]);

  // Check server health
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setServerOnline(true);
        setHasGeminiKey(Boolean(data.hasGeminiKey));
      })
      .catch((err) => {
        console.warn('Health check notice:', err);
        setServerOnline(false);
      });
  }, []);

  const activeSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0];

  const updateProfile = (updates: Partial<StudentProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const updateSubject = (subjectId: string, updates: Partial<SubjectConfig>) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, ...updates } : s))
    );
  };

  const addTopicToUnit = (
    subjectId: string,
    unitId: string,
    topicName: string,
    subtopics: string[]
  ) => {
    setSubjects((prev) =>
      prev.map((sub) => {
        if (sub.id !== subjectId) return sub;
        return {
          ...sub,
          units: sub.units.map((unit) => {
            if (unit.id !== unitId) return unit;
            return {
              ...unit,
              topics: [
                ...unit.topics,
                {
                  id: `${unit.id}-t${Date.now().toString(36)}`,
                  name: topicName,
                  subtopics,
                  isVerifiedAgainstSyllabus: true,
                  confidence: 'low',
                },
              ],
            };
          }),
        };
      })
    );
  };

  const updateTopicVerification = (
    subjectId: string,
    unitId: string,
    topicId: string,
    isVerified: boolean
  ) => {
    setSubjects((prev) =>
      prev.map((sub) => {
        if (sub.id !== subjectId) return sub;
        return {
          ...sub,
          units: sub.units.map((unit) => {
            if (unit.id !== unitId) return unit;
            return {
              ...unit,
              topics: unit.topics.map((top) =>
                top.id === topicId ? { ...top, isVerifiedAgainstSyllabus: isVerified } : top
              ),
            };
          }),
        };
      })
    );
  };

  const updateTopicConfidence = (
    subjectId: string,
    unitId: string,
    topicId: string,
    confidence: 'low' | 'medium' | 'high'
  ) => {
    setSubjects((prev) =>
      prev.map((sub) => {
        if (sub.id !== subjectId) return sub;
        return {
          ...sub,
          units: sub.units.map((unit) => {
            if (unit.id !== unitId) return unit;
            return {
              ...unit,
              topics: unit.topics.map((top) =>
                top.id === topicId ? { ...top, confidence } : top
              ),
            };
          }),
        };
      })
    );
  };

  const recordRevisionReview = (revisionId: string, performance: ReviewPerformance) => {
    setRevisionQueue((prev) => {
      const now = new Date().toISOString();
      const updated = prev.map((item) => {
        if (item.id !== revisionId) return item;
        const { nextIntervalDays, nextConsecutiveCorrect } = calculateNextInterval(
          item.intervalDays,
          item.consecutiveCorrect,
          performance
        );
        const nextReviewAt = computeNextReviewDate(now, nextIntervalDays);

        return {
          ...item,
          intervalDays: nextIntervalDays,
          consecutiveCorrect: nextConsecutiveCorrect,
          repetitionCount: item.repetitionCount + 1,
          lastReviewedAt: now,
          nextReviewAt,
          lastScorePercent: performance.scorePercent,
          confidence: performance.confidence,
        };
      });
      return deduplicateRevisions(updated);
    });
  };

  const rescheduleRevision = (revisionId: string, newDateIso: string) => {
    setRevisionQueue((prev) =>
      prev.map((item) => (item.id === revisionId ? { ...item, nextReviewAt: newDateIso } : item))
    );
  };

  const recordQuizAttempt = (attempt: Omit<QuizAttemptRecord, 'id' | 'timestamp'>) => {
    const newRecord: QuizAttemptRecord = {
      ...attempt,
      id: `quiz-att-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
    };

    setQuizAttempts((prev) => [newRecord, ...prev]);

    // Automatically update or schedule spaced repetition items for topics evaluated in the quiz
    const targetSubject = subjects.find((s) => s.id === attempt.subjectId);
    if (!targetSubject) return;

    setRevisionQueue((prev) => {
      let currentRevs = [...prev];
      const now = new Date().toISOString();

      for (const ev of attempt.result.evaluations) {
        if (!ev.topicId) continue;
        const existingIdx = currentRevs.findIndex((r) => r.topicId === ev.topicId);
        const scorePct = ev.maxMarks > 0 ? (ev.marksAwarded / ev.maxMarks) * 100 : 0;
        const confidence: 'low' | 'medium' | 'high' = scorePct >= 80 ? 'high' : scorePct >= 60 ? 'medium' : 'low';

        if (existingIdx >= 0) {
          const item = currentRevs[existingIdx];
          const { nextIntervalDays, nextConsecutiveCorrect } = calculateNextInterval(
            item.intervalDays,
            item.consecutiveCorrect,
            { scorePercent: scorePct, confidence }
          );
          currentRevs[existingIdx] = {
            ...item,
            intervalDays: nextIntervalDays,
            consecutiveCorrect: nextConsecutiveCorrect,
            repetitionCount: item.repetitionCount + 1,
            lastReviewedAt: now,
            nextReviewAt: computeNextReviewDate(now, nextIntervalDays),
            lastScorePercent: scorePct,
            confidence,
          };
        } else {
          // Find unit title
          let unitTitle = 'Core Unit';
          for (const u of targetSubject.units) {
            if (u.topics.some((t) => t.id === ev.topicId)) {
              unitTitle = u.title;
              break;
            }
          }

          const { nextIntervalDays } = calculateNextInterval(1, 0, { scorePercent: scorePct, confidence });
          currentRevs.push({
            id: `rev-${ev.topicId}-${Date.now().toString(36)}`,
            subjectId: targetSubject.id,
            subjectName: targetSubject.name,
            topicId: ev.topicId,
            topicName: ev.topicName || 'Topic',
            unitTitle,
            intervalDays: nextIntervalDays,
            repetitionCount: 1,
            lastReviewedAt: now,
            nextReviewAt: computeNextReviewDate(now, nextIntervalDays),
            lastScorePercent: scorePct,
            confidence,
            consecutiveCorrect: scorePct >= 60 ? 1 : 0,
          });
        }
      }

      return deduplicateRevisions(currentRevs);
    });
  };

  const recordStudySession = (session: Omit<StudySessionRecord, 'id' | 'timestamp'>) => {
    const newSession: StudySessionRecord = {
      ...session,
      id: `session-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
    };
    setStudySessions((prev) => [newSession, ...prev]);
  };

  const addUploadedMaterial = (material: Omit<UploadedMaterial, 'id' | 'uploadedAt'>) => {
    const newMat: UploadedMaterial = {
      ...material,
      id: `mat-${Date.now().toString(36)}`,
      uploadedAt: new Date().toISOString(),
    };
    setUploadedMaterials((prev) => [newMat, ...prev]);
  };

  const deleteUploadedMaterial = (materialId: string) => {
    setUploadedMaterials((prev) => prev.filter((m) => m.id !== materialId));
  };

  const exportData = () => {
    const exportBundle = {
      profile,
      subjects,
      revisionQueue,
      quizAttempts,
      studySessions,
      uploadedMaterials,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(exportBundle, null, 2);
  };

  const importData = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.profile) setProfile(data.profile);
      if (data.subjects && Array.isArray(data.subjects)) setSubjects(data.subjects);
      if (data.revisionQueue && Array.isArray(data.revisionQueue)) setRevisionQueue(data.revisionQueue);
      if (data.quizAttempts && Array.isArray(data.quizAttempts)) setQuizAttempts(data.quizAttempts);
      if (data.studySessions && Array.isArray(data.studySessions)) setStudySessions(data.studySessions);
      if (data.uploadedMaterials && Array.isArray(data.uploadedMaterials)) setUploadedMaterials(data.uploadedMaterials);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  };

  const resetAllData = () => {
    setProfile(DEFAULT_PROFILE);
    setSubjects(INITIAL_SUBJECTS);
    setRevisionQueue(INITIAL_REVISIONS);
    setQuizAttempts([]);
    setStudySessions([]);
    setUploadedMaterials([]);
    localStorage.removeItem(`${STORAGE_KEY}_profile`);
    localStorage.removeItem(`${STORAGE_KEY}_subjects`);
    localStorage.removeItem(`${STORAGE_KEY}_revisions`);
    localStorage.removeItem(`${STORAGE_KEY}_quizzes`);
    localStorage.removeItem(`${STORAGE_KEY}_sessions`);
    localStorage.removeItem(`${STORAGE_KEY}_materials`);
  };

  return (
    <StudyOsContext.Provider
      value={{
        profile,
        updateProfile,
        subjects,
        activeSubject,
        setActiveSubjectId,
        updateSubject,
        addTopicToUnit,
        updateTopicVerification,
        updateTopicConfidence,
        revisionQueue,
        recordRevisionReview,
        rescheduleRevision,
        quizAttempts,
        recordQuizAttempt,
        studySessions,
        recordStudySession,
        uploadedMaterials,
        addUploadedMaterial,
        deleteUploadedMaterial,
        serverOnline,
        hasGeminiKey,
        exportData,
        importData,
        resetAllData,
      }}
    >
      {children}
    </StudyOsContext.Provider>
  );
};

export function useStudyOs() {
  const context = useContext(StudyOsContext);
  if (!context) {
    throw new Error('useStudyOs must be used within a StudyOsProvider');
  }
  return context;
}
