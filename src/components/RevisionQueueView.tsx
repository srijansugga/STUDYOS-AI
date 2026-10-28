/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CalendarClock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Calendar,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useStudyOs } from '../context/StudyOsContext';
import { RevisionItem } from '../logic/spacedRepetition';

export const RevisionQueueView: React.FC = () => {
  const { revisionQueue, recordRevisionReview, rescheduleRevision, subjects } = useStudyOs();

  const todayStr = new Date().toISOString().split('T')[0];

  // Active Review Item Modal State
  const [reviewingItem, setReviewingItem] = useState<RevisionItem | null>(null);
  const [reviewScore, setReviewScore] = useState<number>(80);
  const [reviewConfidence, setReviewConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [rescheduleModalItem, setRescheduleModalItem] = useState<RevisionItem | null>(null);
  const [newDateInput, setNewDateInput] = useState<string>(todayStr);

  // Partition queue into Overdue, Due Today, and Upcoming
  const overdueItems = revisionQueue.filter((r) => r.nextReviewAt < todayStr);
  const dueTodayItems = revisionQueue.filter((r) => r.nextReviewAt === todayStr);
  const upcomingItems = revisionQueue.filter((r) => r.nextReviewAt > todayStr);

  const handleCompleteReview = () => {
    if (!reviewingItem) return;
    recordRevisionReview(reviewingItem.id, {
      scorePercent: reviewScore,
      confidence: reviewConfidence,
    });
    setReviewingItem(null);
  };

  const handleSaveReschedule = () => {
    if (!rescheduleModalItem || !newDateInput) return;
    rescheduleRevision(rescheduleModalItem.id, newDateInput);
    setRescheduleModalItem(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 lg:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400">
              <CalendarClock className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-wider">
              Spaced Repetition & Active Recall Engine
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight mt-1">
            Adaptive Semester Revision Queue
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Calibrated review intervals (1, 3, 7, 14, 28 days) adapting to your confidence and upcoming semester exam dates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0a0e1a] border border-[#232f48] px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300 font-mono">
              {revisionQueue.length} Active Memory Tracks
            </span>
          </div>
        </div>
      </div>

      {/* Spaced Repetition Heuristic Transparency Note */}
      <div className="p-4 rounded-xl bg-[#0e1424] border border-[#1d273f] text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-violet-300">Pedagogical Note:</strong> Spaced repetition review intervals are an engineering heuristic designed to counter the Ebbinghaus forgetting curve before your semester exams. An interval expansion does not guarantee permanent memory retention without continuous active recall practice.
        </p>
      </div>

      {/* Overdue Section */}
      {overdueItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Overdue Revisions ({overdueItems.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {overdueItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#14101e] border border-rose-900/50 rounded-xl p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-rose-300 font-mono">
                    <span>{item.subjectName}</span>
                    <span className="bg-rose-950 px-1.5 py-0.5 rounded border border-rose-800/40">
                      Due: {item.nextReviewAt}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1.5">{item.topicName}</h3>
                  <div className="text-[11px] text-slate-400 mt-0.5">{item.unitTitle}</div>
                </div>

                <div className="pt-2 border-t border-rose-900/30 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Interval: {item.intervalDays}d (Rep #{item.repetitionCount})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setRescheduleModalItem(item);
                        setNewDateInput(item.nextReviewAt);
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => setReviewingItem(item)}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Due Today Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Due Today ({dueTodayItems.length})</span>
        </div>

        {dueTodayItems.length === 0 ? (
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 text-center text-xs text-slate-400">
            No revisions due today. Excellent work maintaining your study schedule!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {dueTodayItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#111827] border border-amber-600/30 rounded-xl p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-amber-300 font-mono">
                    <span>{item.subjectName}</span>
                    <span className="bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/40">
                      Due Today
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1.5">{item.topicName}</h3>
                  <div className="text-[11px] text-slate-400 mt-0.5">{item.unitTitle}</div>
                </div>

                <div className="pt-2 border-t border-[#1b253b] flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Step: {item.intervalDays}d (Rep #{item.repetitionCount})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setRescheduleModalItem(item);
                        setNewDateInput(item.nextReviewAt);
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => setReviewingItem(item)}
                      className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Revisions Queue */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>Upcoming Scheduled Reviews ({upcomingItems.length})</span>
        </div>

        {upcomingItems.length === 0 ? (
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 text-center text-xs text-slate-400">
            No upcoming reviews scheduled yet. Complete topic tutorials and quizzes to populate the queue.
          </div>
        ) : (
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden divide-y divide-[#1b253b]">
            {upcomingItems.map((item) => (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-white">{item.topicName}</div>
                  <div className="text-[11px] text-slate-400">
                    {item.subjectName} · {item.unitTitle}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                  <span>Next: <strong className="text-violet-300">{item.nextReviewAt}</strong></span>
                  <span>Interval: {item.intervalDays} days</span>
                  <button
                    onClick={() => {
                      setRescheduleModalItem(item);
                      setNewDateInput(item.nextReviewAt);
                    }}
                    className="text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => setReviewingItem(item)}
                    className="px-2.5 py-1 rounded-lg bg-[#182038] hover:bg-[#202b4d] text-slate-200 border border-[#2b3a62] cursor-pointer"
                  >
                    Early Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Active Review Session */}
      {reviewingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#27345b] rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1b253b] pb-3">
              <div>
                <span className="text-[11px] font-mono text-violet-400 uppercase font-semibold">
                  Spaced Repetition Review
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{reviewingItem.topicName}</h3>
                <div className="text-xs text-slate-400">{reviewingItem.subjectName}</div>
              </div>
              <button
                onClick={() => setReviewingItem(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold p-1"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  How well do you recall this topic today? (Score: {reviewScore}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={reviewScore}
                  onChange={(e) => setReviewScore(parseInt(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>0% (Blank)</span>
                  <span>50% (Hesitant)</span>
                  <span>100% (Instant recall)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Recall Confidence
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((conf) => (
                    <button
                      key={conf}
                      type="button"
                      onClick={() => setReviewConfidence(conf)}
                      className={`py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                        reviewConfidence === conf
                          ? 'bg-violet-600 text-white shadow-xs'
                          : 'bg-[#0a0e1a] text-slate-400 border border-[#232f48] hover:text-white'
                      }`}
                    >
                      {conf}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {reviewScore < 60
                    ? '⚠️ Score < 60% resets interval to 1 day for prompt remediation.'
                    : reviewConfidence === 'low'
                    ? '⚠️ Low confidence compresses next interval (max 2 days) to reinforce.'
                    : '✅ Confident recall advances interval to next milestone (e.g. 7 or 14 days).'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1b253b] flex items-center justify-end gap-2">
              <button
                onClick={() => setReviewingItem(null)}
                className="px-3 py-1.5 rounded-lg bg-[#0a0e1a] hover:bg-[#151c30] text-slate-300 text-xs font-semibold border border-[#232f48]"
              >
                Close
              </button>
              <button
                onClick={handleCompleteReview}
                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-md shadow-violet-600/20"
              >
                Record Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reschedule Review Date */}
      {rescheduleModalItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#27345b] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">
              Reschedule: {rescheduleModalItem.topicName}
            </h3>
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-semibold block">
                Select New Target Review Date:
              </label>
              <input
                type="date"
                value={newDateInput}
                onChange={(e) => setNewDateInput(e.target.value)}
                className="w-full bg-[#0a0e1a] text-white border border-[#232f48] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-violet-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRescheduleModalItem(null)}
                className="px-3 py-1.5 rounded-lg bg-[#0a0e1a] text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReschedule}
                className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
              >
                Save Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
