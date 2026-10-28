/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  BrainCircuit,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { useStudyOs } from '../context/StudyOsContext';
import { ActiveTab } from './Sidebar';

interface DashboardViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const {
    profile,
    subjects,
    activeSubject,
    setActiveSubjectId,
    revisionQueue,
    quizAttempts,
    studySessions,
  } = useStudyOs();

  const todayStr = new Date().toISOString().split('T')[0];

  // Overdue and today's revisions
  const overdueRevisions = revisionQueue.filter((r) => r.nextReviewAt < todayStr);
  const dueTodayRevisions = revisionQueue.filter((r) => r.nextReviewAt === todayStr);
  const totalDue = overdueRevisions.length + dueTodayRevisions.length;

  // Study hours today
  const todaySessions = studySessions.filter((s) => s.timestamp.startsWith(todayStr));
  const studyMinutesToday = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const studyHoursToday = Math.round((studyMinutesToday / 60) * 10) / 10;
  const targetHours = profile.dailyStudyTargetHours || 4;
  const studyProgressPct = Math.min(100, Math.round((studyHoursToday / targetHours) * 100));

  // Demonstrated quiz score average
  const totalQuizScoreSum = quizAttempts.reduce((acc, q) => acc + q.result.scorePercentage, 0);
  const avgQuizScore = quizAttempts.length > 0 ? Math.round(totalQuizScoreSum / quizAttempts.length) : null;

  // Total topics and verified count across 7 subjects
  let totalTopicsCount = 0;
  let verifiedTopicsCount = 0;
  for (const s of subjects) {
    for (const u of s.units) {
      totalTopicsCount += u.topics.length;
      verifiedTopicsCount += u.topics.filter((t) => t.isVerifiedAgainstSyllabus).length;
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#171f38] via-[#1b2545] to-[#141b31] border border-[#27345b] p-6 lg:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                First-Year BTech Semester 1
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {profile.branch}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {profile.name}
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Your personalized semester prep engine is active. Target GPA:{' '}
              <span className="font-semibold text-violet-300">{profile.targetGpa}</span>.
              Focus on spaced reviews and high-yield problem solving today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setActiveSubjectId(activeSubject.id);
                onNavigateTab('tutor');
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Launch AI Tutor ({activeSubject.code})</span>
            </button>
            <button
              onClick={() => onNavigateTab('quiz')}
              className="px-4 py-2.5 rounded-xl bg-[#1e2846] hover:bg-[#253257] border border-[#303f69] text-slate-200 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-violet-400" />
              <span>Take Assessment</span>
            </button>
          </div>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Study Target */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Today's Study Plan</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-white font-mono">
              {studyHoursToday} <span className="text-sm text-slate-400 font-normal">/ {targetHours} hrs</span>
            </div>
            <div className="w-full bg-[#1b2438] rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${studyProgressPct}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-400">
            {studyProgressPct >= 100 ? (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Target reached for today
              </span>
            ) : (
              <span>{Math.max(0, targetHours - studyHoursToday).toFixed(1)} hrs remaining today</span>
            )}
          </div>
        </div>

        {/* Metric 2: Spaced Revisions Due */}
        <div
          onClick={() => onNavigateTab('revisions')}
          className={`bg-[#111827] border rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all hover:border-violet-500/50 ${
            totalDue > 0 ? 'border-amber-500/30 shadow-xs' : 'border-[#1f293d]'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Due Spaced Revisions</span>
            <CalendarClock className={`w-4 h-4 ${totalDue > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-white font-mono flex items-baseline gap-2">
              {totalDue}
              {overdueRevisions.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {overdueRevisions.length} overdue
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {dueTodayRevisions.length} due today · {revisionQueue.length} queued total
            </div>
          </div>
          <div className="text-[11px] text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1">
            <span>Open Revision Queue</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 3: Demonstrated Quiz Score */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Demonstrated Quiz Score</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-3">
            {avgQuizScore !== null ? (
              <>
                <div className="text-2xl font-bold text-white font-mono">
                  {avgQuizScore}%
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Across {quizAttempts.length} verified attempt{quizAttempts.length > 1 ? 's' : ''}
                </div>
              </>
            ) : (
              <>
                <div className="text-lg font-bold text-slate-400">No attempts yet</div>
                <div className="text-[11px] text-slate-500 mt-1">Take a quiz to establish baseline</div>
              </>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            {avgQuizScore !== null && avgQuizScore >= 75 ? (
              <span className="text-emerald-400 font-medium">Strong exam readiness</span>
            ) : avgQuizScore !== null ? (
              <span className="text-amber-400 font-medium">Needs focused problem review</span>
            ) : (
              <span>Deterministic grading engine ready</span>
            )}
          </div>
        </div>

        {/* Metric 4: Verified Syllabus Coverage */}
        <div
          onClick={() => onNavigateTab('syllabus')}
          className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 flex flex-col justify-between cursor-pointer hover:border-violet-500/50 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Syllabus Verification</span>
            <ShieldCheck className="w-4 h-4 text-violet-400" />
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-white font-mono">
              {verifiedTopicsCount}{' '}
              <span className="text-sm text-slate-400 font-normal">/ {totalTopicsCount}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Verified against university syllabus
            </div>
          </div>
          <div className="text-[11px] text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1">
            <span>Upload or Verify Syllabus</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Due Revisions High-Yield Callout (if any overdue) */}
      {overdueRevisions.length > 0 && (
        <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-900/40 text-rose-300">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-rose-200">
                {overdueRevisions.length} Overdue Spaced Revision{overdueRevisions.length > 1 ? 's' : ''} Need Attention
              </div>
              <div className="text-xs text-rose-300/80 mt-0.5">
                Top overdue:{' '}
                <span className="font-semibold text-rose-100">{overdueRevisions[0].topicName}</span> (
                {overdueRevisions[0].subjectName})
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('revisions')}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors"
          >
            Review Now
          </button>
        </div>
      )}

      {/* All Seven Subjects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">First-Year BTech Subjects</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configured with tailored teaching profiles and university examination modules
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-[#162032] px-2.5 py-1 rounded-md border border-[#25324d]">
            7 Subjects Enrolled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {subjects.map((sub) => {
            const totalUnits = sub.units.length;
            const allTopics = sub.units.flatMap((u) => u.topics);
            const verifiedCount = allTopics.filter((t) => t.isVerifiedAgainstSyllabus).length;
            const highConfidenceCount = allTopics.filter((t) => t.confidence === 'high').length;
            const masteryPct = allTopics.length > 0 ? Math.round((highConfidenceCount / allTopics.length) * 100) : 0;

            // Days until this subject exam
            const examDiff = Math.max(
              0,
              Math.ceil((new Date(sub.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            );

            return (
              <div
                key={sub.id}
                className="bg-[#111827] border border-[#1f293d] hover:border-[#324263] rounded-xl p-5 flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-violet-400 bg-violet-950/60 border border-violet-800/40 px-2 py-0.5 rounded">
                          {sub.code}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {sub.creditWeight} Credits
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1.5 group-hover:text-violet-300 transition-colors">
                        {sub.name}
                      </h3>
                      <div className="text-xs text-slate-400 mt-0.5">{sub.badge}</div>
                    </div>
                  </div>

                  {/* Teaching Profile Tag */}
                  <div className="mt-3.5 p-2 rounded-lg bg-[#0e1424] border border-[#1b2438] text-[11px] text-slate-300 leading-relaxed">
                    <span className="text-violet-400 font-semibold uppercase tracking-wider text-[10px] block mb-0.5">
                      Teaching Profile ({sub.teachingProfile.domain})
                    </span>
                    {sub.teachingProfile.emphasis}
                  </div>

                  {/* Progress & Verification */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Subject Mastery</span>
                      <span className="font-mono font-semibold text-white">{masteryPct}%</span>
                    </div>
                    <div className="w-full bg-[#1b2438] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-indigo-500 h-1.5 rounded-full"
                        style={{ width: `${masteryPct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>{totalUnits} Units · {allTopics.length} Topics</span>
                      <span className="flex items-center gap-1 font-mono">
                        {verifiedCount === allTopics.length ? (
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" /> Fully Verified
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-0.5">
                            <ShieldAlert className="w-3 h-3" /> {verifiedCount}/{allTopics.length} Verified
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Exam Date & Actions */}
                <div className="mt-5 pt-4 border-t border-[#1a233a] flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    Exam: <span className="text-slate-200 font-medium">{sub.examDate}</span>{' '}
                    <span className="text-violet-400 font-mono">({examDiff}d)</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setActiveSubjectId(sub.id);
                        onNavigateTab('tutor');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1a233a] hover:bg-[#253254] text-violet-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Tutor</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveSubjectId(sub.id);
                        onNavigateTab('quiz');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-violet-600/80 hover:bg-violet-600 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Quiz</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
