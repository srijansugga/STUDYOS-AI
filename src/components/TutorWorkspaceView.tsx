/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Send,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Layers,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Calculator,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useStudyOs } from '../context/StudyOsContext';
import { TutorExplanationResponse } from '../server/geminiHandler';

export const TutorWorkspaceView: React.FC = () => {
  const { activeSubject, subjects, setActiveSubjectId, uploadedMaterials, recordStudySession } = useStudyOs();

  // Unit and topic selection
  const [selectedUnitId, setSelectedUnitId] = useState<string>(activeSubject.units[0]?.id || '');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    activeSubject.units[0]?.topics[0]?.id || ''
  );

  const [depth, setDepth] = useState<'quick' | 'standard' | 'detailed'>('standard');
  const [loadingExplanation, setLoadingExplanation] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<TutorExplanationResponse | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Progressive Hint State
  const [hintLevel, setHintLevel] = useState<number>(1);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState<boolean>(false);

  // Chat conversation state
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string; timestamp: string }[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Update selected unit when activeSubject changes
  useEffect(() => {
    if (activeSubject.units.length > 0) {
      const firstUnit = activeSubject.units[0];
      setSelectedUnitId(firstUnit.id);
      if (firstUnit.topics.length > 0) {
        setSelectedTopicId(firstUnit.topics[0].id);
      }
    }
    setExplanation(null);
    setChatMessages([]);
    setCurrentHint(null);
  }, [activeSubject.id]);

  const currentUnit = activeSubject.units.find((u) => u.id === selectedUnitId) || activeSubject.units[0];
  const currentTopic = currentUnit?.topics.find((t) => t.id === selectedTopicId) || currentUnit?.topics[0];

  // Grounded notes for this subject
  const subjectMaterials = uploadedMaterials.filter((m) => m.subjectId === activeSubject.id);
  const groundedNotesText = subjectMaterials.map((m) => m.extractedText).join('\n\n');

  // Trigger Gemini AI Explanation
  const handleGenerateExplanation = async () => {
    if (!currentTopic) return;
    setLoadingExplanation(true);
    setErrorNotice(null);

    try {
      const response = await fetch('/api/tutor/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: activeSubject.name,
          topicName: currentTopic.name,
          unitTitle: currentUnit?.title,
          depth,
          teachingProfile: activeSubject.teachingProfile,
          groundedNotesText: groundedNotesText || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data: TutorExplanationResponse = await response.json();
      setExplanation(data);

      // Record study session (15 mins estimated)
      recordStudySession({
        subjectId: activeSubject.id,
        subjectName: activeSubject.name,
        topicName: currentTopic.name,
        durationMinutes: 15,
        notes: `AI Tutor explanation session (${depth} depth)`,
      });
    } catch (err: any) {
      console.error('Explanation request failed:', err);
      setErrorNotice(err?.message || 'Could not connect to Gemini tutor service. Please check connection.');
    } finally {
      setLoadingExplanation(false);
    }
  };

  // Trigger Progressive Hint
  const handleRequestHint = async (problemPrompt: string) => {
    setLoadingHint(true);
    try {
      const res = await fetch('/api/tutor/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: activeSubject.name,
          problemStatement: problemPrompt,
          hintLevel,
        }),
      });
      const data = await res.json();
      setCurrentHint(data.hint);
      if (data.nextHintAvailable) {
        setHintLevel((prev) => prev + 1);
      }
    } catch (e: any) {
      setCurrentHint('Hint generation temporary error: ' + (e?.message || ''));
    } finally {
      setLoadingHint(false);
    }
  };

  // Handle follow-up chat
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    const newHistory = [
      ...chatMessages,
      { role: 'user' as const, text: userText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ];
    setChatMessages(newHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: activeSubject.name,
          topicName: currentTopic ? currentTopic.name : activeSubject.name,
          userMessage: userText,
          history: newHistory.map((m) => ({ role: m.role, text: m.text })),
          teachingDomain: activeSubject.teachingProfile.domain,
        }),
      });

      const data = await response.json();
      setChatMessages([
        ...newHistory,
        {
          role: 'model',
          text: data.reply || 'I am ready to help you analyze this topic.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setChatMessages([
        ...newHistory,
        {
          role: 'model',
          text: `Apologies, unable to retrieve model response: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400">
                <BrainCircuit className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-wider">
                Undergraduate AI Tutor Workspace
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-3">
              {activeSubject.name}
              <span className="text-xs font-normal font-mono px-2 py-0.5 rounded bg-[#1e2844] text-slate-300 border border-[#2b3a63]">
                {activeSubject.code}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Teaching Mode:{' '}
              <span className="text-violet-300 font-medium">
                {activeSubject.teachingProfile.emphasis}
              </span>
            </p>
          </div>

          {/* Depth selector + Generate button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-[#0a0e1a] border border-[#1f293d] rounded-xl p-1 text-xs">
              {(['quick', 'standard', 'detailed'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDepth(d)}
                  className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${
                    depth === d
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerateExplanation}
              disabled={loadingExplanation || !currentTopic}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-violet-600/20"
            >
              {loadingExplanation ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Explain Topic</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Topic Selector Row */}
        <div className="mt-5 pt-4 border-t border-[#1a233a] grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="unit-select" className="text-xs font-semibold text-slate-300 mb-1.5 block">
              1. Select Unit
            </label>
            <select
              id="unit-select"
              value={selectedUnitId}
              onChange={(e) => {
                const uId = e.target.value;
                setSelectedUnitId(uId);
                const u = activeSubject.units.find((unit) => unit.id === uId);
                if (u && u.topics.length > 0) {
                  setSelectedTopicId(u.topics[0].id);
                }
              }}
              className="w-full bg-[#0a0e1a] text-slate-200 border border-[#232f48] rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              {activeSubject.units.map((u) => (
                <option key={u.id} value={u.id}>
                  Unit {u.unitNumber}: {u.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="topic-select" className="text-xs font-semibold text-slate-300 mb-1.5 block">
              2. Select Syllabus Topic
            </label>
            <select
              id="topic-select"
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full bg-[#0a0e1a] text-slate-200 border border-[#232f48] rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              {currentUnit?.topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.isVerifiedAgainstSyllabus ? '✓' : '(Unverified)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject Materials Grounding Notice */}
        {subjectMaterials.length > 0 && (
          <div className="mt-3 text-[11px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>
              Document Grounding Active: {subjectMaterials.length} course material file(s) available for citation.
            </span>
          </div>
        )}
      </div>

      {/* Error state */}
      {errorNotice && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/60 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button
            onClick={handleGenerateExplanation}
            className="text-[11px] underline font-semibold hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {loadingExplanation ? (
        <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-12 text-center space-y-4">
          <div className="inline-flex p-4 rounded-2xl bg-violet-600/10 text-violet-400 animate-pulse">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Synthesizing Undergraduate Lecture</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Running Gemini 3.8 Flash model with {activeSubject.name} teaching profile, computing derivations, and assembling exam summary...
            </p>
          </div>
        </div>
      ) : explanation ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Structured Explanation (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Intuition Box */}
            <div className="bg-gradient-to-r from-violet-950/40 via-[#13192e] to-[#111827] border border-violet-800/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold mb-2">
                <Lightbulb className="w-4 h-4 text-violet-400" />
                <span>Core Intuition & Mechanical Analogy</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-normal">
                {explanation.intuition}
              </p>
            </div>

            {/* Undergraduate Rigor Explanation */}
            <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-[#1b253b] pb-3">
                <span className="flex items-center gap-2 text-slate-200">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Formal Undergraduate Explanation</span>
                </span>
                <span className="text-[11px] font-mono text-violet-400 capitalize">
                  Depth: {depth}
                </span>
              </div>
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line pt-2">
                {explanation.undergraduateExplanation}
              </div>
            </div>

            {/* Step-by-Step Worked Example (Never skip steps) */}
            <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1b253b] pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    Step-by-Step Worked University Example
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/40">
                  Detailed Solution
                </span>
              </div>

              <div className="bg-[#0b101d] rounded-xl p-4 border border-[#1d273f]">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Problem Statement:
                </div>
                <div className="text-sm font-medium text-slate-200">
                  {explanation.stepByStepExample.problemStatement}
                </div>
              </div>

              {/* Steps list */}
              <div className="space-y-3 pt-2">
                {explanation.stepByStepExample.steps.map((st) => (
                  <div
                    key={st.stepNumber}
                    className="p-3.5 rounded-xl bg-[#0e1424] border border-[#1b2438] space-y-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        {st.stepNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-200">{st.title}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-7.5">
                      {st.explanation}
                    </p>
                    {st.mathOrCode && (
                      <div className="ml-7.5 p-2.5 rounded-lg bg-[#070a12] font-mono text-xs text-emerald-300 border border-[#162035] overflow-x-auto">
                        {st.mathOrCode}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Final Result Box */}
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-300">Final Boxed Result:</span>
                <span className="font-mono font-bold text-white text-xs bg-emerald-900/40 px-3 py-1 rounded-md border border-emerald-700/50">
                  {explanation.stepByStepExample.finalResult}
                </span>
              </div>

              {/* Progressive Hint Button for Practice */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#131b2e] p-3.5 rounded-xl">
                <div className="text-xs text-slate-300">
                  Need a hint before checking the final solution?
                </div>
                <button
                  onClick={() => handleRequestHint(explanation.stepByStepExample.problemStatement)}
                  disabled={loadingHint}
                  className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>
                    {loadingHint ? 'Formulating Hint...' : `Get Hint (Level ${hintLevel}/4)`}
                  </span>
                </button>
              </div>

              {currentHint && (
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-700/40 text-amber-200 text-xs space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Progressive Tutor Hint (Level {hintLevel - 1}):</span>
                  </div>
                  <p className="leading-relaxed">{currentHint}</p>
                </div>
              )}
            </div>

            {/* Common Mistakes & Misconceptions */}
            {explanation.commonMisconceptions.length > 0 && (
              <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2 border-b border-[#1b253b] pb-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-white">
                    Common Examination Pitfalls & Corrections
                  </h3>
                </div>
                <div className="space-y-3 pt-1">
                  {explanation.commonMisconceptions.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#0f1526] border border-[#1c263f] text-xs space-y-2"
                    >
                      <div className="text-rose-300 font-semibold flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800/40">
                          Trap
                        </span>
                        {m.misconception}
                      </div>
                      <div className="text-slate-300 pl-4 border-l-2 border-emerald-500/50">
                        <span className="text-emerald-400 font-medium">Correction: </span>
                        {m.correction}
                      </div>
                      <div className="text-slate-400 pl-4 text-[11px] italic">
                        Tip: {m.examTip}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Panel: Formulas, Exam Summary & Follow-Up Q&A (1 col) */}
          <div className="space-y-6">
            {/* Formulas & Definitions Sheet */}
            {explanation.formulasAndDefinitions.length > 0 && (
              <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-violet-400" />
                  <span>Important Formulas & Definitions</span>
                </div>
                <div className="space-y-2.5">
                  {explanation.formulasAndDefinitions.map((f, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[#0a0e1a] border border-[#1c273e] text-xs space-y-1"
                    >
                      <div className="font-semibold text-slate-200">{f.name}</div>
                      <div className="font-mono text-violet-300 bg-[#12192e] px-2 py-1 rounded text-[11px]">
                        {f.formulaOrDef}
                      </div>
                      <div className="text-[10px] text-slate-400">{f.notes}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 10-Minute Exam Summary */}
            {explanation.examSummary.length > 0 && (
              <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Exam-Ready Summary Checklist</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {explanation.examSummary.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Multi-Turn Follow-Up Chat Box */}
            <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 flex flex-col h-[420px]">
              <div className="flex items-center justify-between border-b border-[#1b253b] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-bold text-white">Ask Follow-Up Question</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Preserves Context</span>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                    <Info className="w-5 h-5 text-slate-500 mb-1" />
                    <span>Have doubts about this topic? Ask a question below.</span>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl ${
                        msg.role === 'user'
                          ? 'bg-violet-600/30 text-violet-100 ml-4 border border-violet-500/30'
                          : 'bg-[#0b101d] text-slate-200 mr-4 border border-[#1b2438]'
                      }`}
                    >
                      <div className="text-[10px] text-slate-400 mb-1 font-mono">
                        {msg.role === 'user' ? 'You' : 'STUDYOS Tutor'} · {msg.timestamp}
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="p-2.5 rounded-xl bg-[#0b101d] text-slate-400 text-xs flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-400" />
                    <span>Tutor is formulating response...</span>
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendChat} className="mt-3 pt-3 border-t border-[#1b253b] flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Ask about ${currentTopic?.name || 'this topic'}...`}
                  className="flex-1 bg-[#0a0e1a] text-slate-200 border border-[#232f48] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white transition-colors cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-12 text-center space-y-4">
          <div className="inline-flex p-4 rounded-2xl bg-violet-600/10 text-violet-400">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Select a Topic and Click "Explain Topic"</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              STUDYOS will generate intuitive analogies, formal undergraduate derivations, step-by-step calculation examples, and common pitfalls for {activeSubject.name}.
            </p>
          </div>
          <button
            onClick={handleGenerateExplanation}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-violet-600/30"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Generate Explanation for "{currentTopic?.name}"</span>
          </button>
        </div>
      )}
    </div>
  );
};
