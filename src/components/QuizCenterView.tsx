/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Sparkles,
  Timer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  ArrowRight,
  BookOpen,
  Award,
  ChevronRight,
  RotateCcw,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStudyOs } from '../context/StudyOsContext';
import {
  Question,
  StudentResponse,
  QuestionEvaluation,
  QuizResult,
  evaluateObjectiveQuestion,
  aggregateQuizResult,
} from '../logic/scoring';

export const QuizCenterView: React.FC = () => {
  const { activeSubject, subjects, setActiveSubjectId, recordQuizAttempt, quizAttempts } = useStudyOs();

  // Generator Configuration State
  const [selectedUnitId, setSelectedUnitId] = useState<string>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'exam_pattern'>('medium');
  const [questionTypes, setQuestionTypes] = useState<string[]>(['mcq', 'numerical']);

  // Active Quiz State
  const [quizState, setQuizState] = useState<'config' | 'loading' | 'taking' | 'submitting' | 'results'>('config');
  const [quizTitle, setQuizTitle] = useState<string>('');
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [studentResponses, setStudentResponses] = useState<Record<string, StudentResponse>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [finalResult, setFinalResult] = useState<QuizResult | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Timer Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Available topics for active subject
  const allSubjectTopics = activeSubject.units.flatMap((u) => u.topics);

  // Start Timer when quiz taking starts
  useEffect(() => {
    if (quizState === 'taking' && timeRemainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizState, timeRemainingSeconds]);

  // Generate Quiz
  const handleGenerateQuiz = async () => {
    setQuizState('loading');
    setErrorNotice(null);

    const unitObj = selectedUnitId !== 'all' ? activeSubject.units.find((u) => u.id === selectedUnitId) : undefined;
    const topicObj = selectedTopicId !== 'all' ? allSubjectTopics.find((t) => t.id === selectedTopicId) : undefined;

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: activeSubject.name,
          unitTitle: unitObj?.title,
          topicName: topicObj?.name,
          questionCount,
          difficulty,
          questionTypes: questionTypes.length > 0 ? questionTypes : ['mcq', 'numerical'],
          syllabusTopics: allSubjectTopics.map((t) => t.name),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('No questions returned by generation engine.');
      }

      setQuizTitle(data.title || `${activeSubject.name} Assessment`);
      setActiveQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setStudentResponses({});
      setTimeRemainingSeconds((data.durationMinutes || questionCount * 3) * 60);
      setQuizState('taking');
    } catch (err: any) {
      console.error('Quiz generation failed:', err);
      setErrorNotice(err?.message || 'Failed to generate assessment. Please try again.');
      setQuizState('config');
    }
  };

  // Record student response
  const handleAnswerChange = (questionId: string, updates: Partial<StudentResponse>) => {
    setStudentResponses((prev) => {
      const existing = prev[questionId] || { questionId };
      return {
        ...prev,
        [questionId]: {
          ...existing,
          ...updates,
        },
      };
    });
  };

  // Submit and evaluate quiz
  const handleSubmitQuiz = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setQuizState('submitting');

    try {
      const evaluations: QuestionEvaluation[] = [];

      for (const q of activeQuestions) {
        const resp = studentResponses[q.id];

        // Objective check for MCQ or exact numerical
        if (q.type === 'mcq' || q.type === 'numerical') {
          evaluations.push(evaluateObjectiveQuestion(q, resp));
        } else {
          // Subjective question: evaluate via server rubric endpoint
          const studentText = resp?.textAnswer || '';
          if (!studentText.trim()) {
            evaluations.push({
              questionId: q.id,
              isCorrect: false,
              marksAwarded: 0,
              maxMarks: q.marks,
              studentAnswerDisplay: '(Unanswered)',
              expectedAnswerDisplay: q.expectedAnswer || 'See rubric',
              explanation: q.explanation,
              feedback: 'Question left unattempted.',
              topicId: q.topicId,
              topicName: q.topicName,
            });
          } else {
            try {
              const evalRes = await fetch('/api/quiz/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  subjectName: activeSubject.name,
                  questionPrompt: q.prompt,
                  marks: q.marks,
                  expectedAnswer: q.expectedAnswer || q.explanation,
                  studentAnswer: studentText,
                  rubricCriteria: q.rubricCriteria,
                }),
              });
              const evalData = await evalRes.json();
              evaluations.push({
                questionId: q.id,
                isCorrect: Boolean(evalData.isCorrect),
                marksAwarded: evalData.marksAwarded ?? 0,
                maxMarks: q.marks,
                studentAnswerDisplay: studentText,
                expectedAnswerDisplay: q.expectedAnswer || 'Standard university answer',
                explanation: q.explanation,
                feedback: evalData.detailedFeedback || 'Evaluated against grading rubric.',
                rubricBreakdown: evalData.rubricBreakdown,
                topicId: q.topicId,
                topicName: q.topicName,
              });
            } catch {
              // Fallback
              evaluations.push(evaluateObjectiveQuestion(q, resp));
            }
          }
        }
      }

      const result = aggregateQuizResult(evaluations);
      setFinalResult(result);

      // Record to persistent storage & update spaced repetition
      recordQuizAttempt({
        subjectId: activeSubject.id,
        subjectName: activeSubject.name,
        difficulty,
        result,
      });

      // Confetti celebration if passed with >=75%
      if (result.scorePercentage >= 75) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      setQuizState('results');
    } catch (err: any) {
      console.error('Submission failed:', err);
      setErrorNotice('Error evaluating answers: ' + err.message);
      setQuizState('taking');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Quiz Header Banner */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 lg:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400">
              <GraduationCap className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-wider">
              Examination & Assessment Engine
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight mt-1">
            BTech Semester Mock & Topic Quizzes
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic objective scoring, university rubrics, and automated spaced repetition queueing.
          </p>
        </div>

        {quizState === 'taking' && (
          <div className="flex items-center gap-4 bg-[#0a0e1a] border border-[#232f48] px-4 py-2 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <Timer className="w-4 h-4 text-amber-400" />
              <span>Time Left: {formatTimer(timeRemainingSeconds)}</span>
            </div>
            <button
              onClick={handleSubmitQuiz}
              className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Submit Now
            </button>
          </div>
        )}
      </div>

      {errorNotice && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/60 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button onClick={() => setErrorNotice(null)} className="underline text-[11px] font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* STATE 1: Configuration Form */}
      {quizState === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Configurator Form */}
          <div className="lg:col-span-2 bg-[#111827] border border-[#1f293d] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#1b253b] pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>Configure New Assessment</span>
              </h2>
              <span className="text-xs font-mono text-slate-400">
                Subject: {activeSubject.code}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Unit Filter */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Target Unit
                </label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => {
                    setSelectedUnitId(e.target.value);
                    setSelectedTopicId('all');
                  }}
                  className="w-full bg-[#0a0e1a] text-slate-200 border border-[#232f48] rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="all">All Units (Comprehensive)</option>
                  {activeSubject.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unitNumber}: {u.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic Filter */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Target Topic
                </label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full bg-[#0a0e1a] text-slate-200 border border-[#232f48] rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="all">All Topics in Unit</option>
                  {(selectedUnitId === 'all'
                    ? allSubjectTopics
                    : activeSubject.units.find((u) => u.id === selectedUnitId)?.topics || []
                  ).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Question Count & Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Question Count
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 8].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-2 rounded-xl text-xs font-medium transition-all ${
                        questionCount === cnt
                          ? 'bg-violet-600 text-white shadow-xs'
                          : 'bg-[#0a0e1a] text-slate-400 border border-[#232f48] hover:text-white'
                      }`}
                    >
                      {cnt} Questions
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                        difficulty === d
                          ? 'bg-violet-600 text-white shadow-xs'
                          : 'bg-[#0a0e1a] text-slate-400 border border-[#232f48] hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Allowed Question Types Checkboxes */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block">
                Question Formats Included
              </label>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { id: 'mcq', label: 'Multiple Choice (MCQ)' },
                  { id: 'numerical', label: 'Numerical & Calculations' },
                  { id: 'short_answer', label: 'Short Notes & Derivations' },
                  { id: 'code_tracing', label: 'Code Tracing / Output' },
                ].map((type) => {
                  const checked = questionTypes.includes(type.id);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setQuestionTypes((prev) =>
                          checked ? prev.filter((t) => t !== type.id) : [...prev, type.id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 border transition-all ${
                        checked
                          ? 'bg-[#1a233a] text-violet-300 border-violet-600/50'
                          : 'bg-[#0a0e1a] text-slate-400 border-[#232f48] hover:text-white'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                          checked
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'border-slate-600'
                        }`}
                      >
                        {checked && <Check className="w-2.5 h-2.5" />}
                      </span>
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Launch button */}
            <div className="pt-3">
              <button
                type="button"
                onClick={handleGenerateQuiz}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate & Begin Timed Assessment</span>
              </button>
            </div>
          </div>

          {/* Past Attempts Sidebar */}
          <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1b253b] pb-2">
              Recent Assessment History
            </h3>

            {quizAttempts.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No past attempts recorded yet. Take your first quiz to track topic mastery.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {quizAttempts.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl bg-[#0a0e1a] border border-[#1c273e] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{att.subjectName}</span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                          att.result.passed
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                            : 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                        }`}
                      >
                        {att.result.scorePercentage}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>{att.result.totalMarksAwarded}/{att.result.maxMarksTotal} marks</span>
                      <span>{new Date(att.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STATE 2: Loading Generation */}
      {quizState === 'loading' && (
        <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-16 text-center space-y-4">
          <div className="inline-flex p-4 rounded-2xl bg-violet-600/10 text-violet-400 animate-pulse">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Generating BTech Examination Paper</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Drafting realistic questions, establishing numerical tolerances, and designing rubrics for {activeSubject.name}...
            </p>
          </div>
        </div>
      )}

      {/* STATE 3: Taking Active Quiz */}
      {quizState === 'taking' && activeQuestions.length > 0 && (
        <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-6 space-y-6">
          {/* Question Navigator Bar */}
          <div className="flex items-center justify-between border-b border-[#1b253b] pb-4">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {activeQuestions.map((_, idx) => {
                const isAnswered = studentResponses[activeQuestions[idx].id] !== undefined;
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-violet-600 text-white shadow-xs'
                        : isAnswered
                        ? 'bg-[#1d273f] text-emerald-300 border border-emerald-600/40'
                        : 'bg-[#0a0e1a] text-slate-400 border border-[#232f48]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Q{currentQuestionIndex + 1} of {activeQuestions.length} ({activeQuestions[currentQuestionIndex]?.marks} marks)
            </div>
          </div>

          {/* Current Question Display */}
          {(() => {
            const currentQ = activeQuestions[currentQuestionIndex];
            const currentResp = studentResponses[currentQ.id];

            return (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 uppercase tracking-wider mb-1.5">
                    <span>{currentQ.type.replace('_', ' ')}</span>
                    <span>·</span>
                    <span>{currentQ.topicName}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white leading-relaxed">
                    {currentQ.prompt}
                  </h3>
                </div>

                {/* Input Area based on type */}
                {currentQ.type === 'mcq' && currentQ.options && (
                  <div className="space-y-2.5">
                    {currentQ.options.map((opt, optIdx) => {
                      const isSelected = currentResp?.selectedOptionIndex === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() =>
                            handleAnswerChange(currentQ.id, { selectedOptionIndex: optIdx })
                          }
                          className={`w-full p-3.5 rounded-xl text-xs font-medium text-left flex items-center gap-3 transition-all ${
                            isSelected
                              ? 'bg-violet-950/60 text-white border border-violet-500 shadow-xs'
                              : 'bg-[#0a0e1a] text-slate-300 border border-[#1f2a40] hover:bg-[#12192e]'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border shrink-0 ${
                              isSelected
                                ? 'bg-violet-600 border-violet-600 text-white'
                                : 'border-slate-600 text-slate-400'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="flex-1 leading-relaxed">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQ.type === 'numerical' && (
                  <div className="space-y-2 bg-[#0a0e1a] border border-[#1f2a40] rounded-xl p-4">
                    <label className="text-xs text-slate-300 font-semibold block">
                      Enter Calculated Numerical Value {currentQ.unitExpected && `(${currentQ.unitExpected})`}:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="any"
                        value={currentResp?.numericalValue ?? ''}
                        onChange={(e) =>
                          handleAnswerChange(currentQ.id, {
                            numericalValue: parseFloat(e.target.value),
                            textAnswer: e.target.value,
                          })
                        }
                        placeholder="e.g. 6.25"
                        className="bg-[#111827] text-white border border-[#273452] rounded-lg px-3 py-2 text-xs font-mono w-48 focus:outline-none focus:border-violet-500"
                      />
                      {currentQ.unitExpected && (
                        <span className="text-xs font-mono text-slate-400 font-bold">
                          {currentQ.unitExpected}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Evaluated with ±{( (currentQ.acceptableTolerance || 0.05) * 100).toFixed(0)}% university rounding tolerance.
                    </p>
                  </div>
                )}

                {(currentQ.type === 'short_answer' ||
                  currentQ.type === 'derivation' ||
                  currentQ.type === 'code_tracing' ||
                  currentQ.type === 'case_study') && (
                  <div className="space-y-2">
                    <label className="text-xs text-slate-300 font-semibold block">
                      Your Written Solution / Explanation:
                    </label>
                    <textarea
                      rows={5}
                      value={currentResp?.textAnswer || ''}
                      onChange={(e) =>
                        handleAnswerChange(currentQ.id, { textAnswer: e.target.value })
                      }
                      placeholder="Write your explanation, steps, code trace, or reasoning..."
                      className="w-full bg-[#0a0e1a] text-slate-200 border border-[#1f2a40] rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:border-violet-500 font-sans"
                    />
                    <p className="text-[11px] text-slate-500">
                      Evaluated transparently against university criteria rubric after submission.
                    </p>
                  </div>
                )}

                {/* Question Navigation Prev/Next */}
                <div className="flex items-center justify-between pt-4 border-t border-[#1b253b]">
                  <button
                    type="button"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0a0e1a] hover:bg-[#151c30] disabled:opacity-40 text-slate-300 text-xs font-semibold border border-[#232f48] cursor-pointer"
                  >
                    Previous Question
                  </button>

                  {currentQuestionIndex < activeQuestions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitQuiz}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Finish & Submit</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* STATE 4: Submitting Evaluation */}
      {quizState === 'submitting' && (
        <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-16 text-center space-y-4">
          <div className="inline-flex p-4 rounded-2xl bg-violet-600/10 text-violet-400 animate-pulse">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Evaluating Assessment</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Running deterministic checks for objective questions and AI rubrics for subjective questions...
            </p>
          </div>
        </div>
      )}

      {/* STATE 5: Results View */}
      {quizState === 'results' && finalResult && (
        <div className="space-y-6">
          {/* Performance Summary Banner */}
          <div className="bg-gradient-to-r from-[#171f38] via-[#1b2545] to-[#141b31] border border-[#27345b] rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  finalResult.passed
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                {finalResult.passed ? 'Assessment Passed (≥60%)' : 'Needs Review (<60%)'}
              </span>
              <h2 className="text-2xl font-extrabold text-white">
                Score: {finalResult.scorePercentage}%
              </h2>
              <p className="text-xs text-slate-300">
                Awarded {finalResult.totalMarksAwarded} out of {finalResult.maxMarksTotal} total marks ({finalResult.answeredCount}/{finalResult.totalQuestions} answered).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuizState('config')}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-md shadow-violet-600/20"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Take Another Assessment</span>
              </button>
            </div>
          </div>

          {/* Diagnostic Weak Topics Callout */}
          {finalResult.weakTopics.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Identified Weak Topics (Scheduled for Spaced Review):</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {finalResult.weakTopics.map((wt) => (
                  <span
                    key={wt.topicId}
                    className="px-2.5 py-1 rounded-lg bg-amber-900/40 text-amber-200 border border-amber-700/40 text-xs font-medium"
                  >
                    {wt.topicName} (-{wt.missedMarks} marks)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Question-by-Question Review */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Detailed Question Solutions & Grading Feedback
            </h3>

            {finalResult.evaluations.map((ev, i) => (
              <div
                key={i}
                className={`bg-[#111827] border rounded-xl p-5 space-y-3 ${
                  ev.isCorrect ? 'border-emerald-800/40' : 'border-rose-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {ev.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-white">
                        Question {i + 1}: {ev.topicName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Awarded {ev.marksAwarded} / {ev.maxMarks} marks
                      </div>
                    </div>
                  </div>
                </div>

                {/* Answers breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
                  <div className="p-3 rounded-lg bg-[#0a0e1a] border border-[#1b253b]">
                    <span className="text-slate-400 font-semibold block mb-1">Your Answer:</span>
                    <span className={ev.isCorrect ? 'text-emerald-300' : 'text-rose-300'}>
                      {ev.studentAnswerDisplay}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0a0e1a] border border-[#1b253b]">
                    <span className="text-slate-400 font-semibold block mb-1">Expected Solution:</span>
                    <span className="text-slate-200 font-medium">{ev.expectedAnswerDisplay}</span>
                  </div>
                </div>

                {/* Feedback and thorough explanation */}
                <div className="p-3 rounded-lg bg-[#0e1424] text-xs space-y-1">
                  <div className="text-violet-300 font-semibold">Tutor Explanation:</div>
                  <p className="text-slate-300 leading-relaxed">{ev.explanation}</p>
                  <p className="text-slate-400 text-[11px] italic pt-1">{ev.feedback}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
