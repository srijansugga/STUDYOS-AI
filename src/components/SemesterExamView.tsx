/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CalendarDays,
  Calendar,
  Clock,
  CheckSquare,
  Sparkles,
  BookOpen,
  Layers,
  ArrowRight,
  Flame,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useStudyOs } from '../context/StudyOsContext';
import { generateStudyTimetable, TimetableSchedule } from '../logic/timetable';
import { ActiveTab } from './Sidebar';

interface SemesterExamViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const SemesterExamView: React.FC<SemesterExamViewProps> = ({ onNavigateTab }) => {
  const { profile, subjects, updateSubject, setActiveSubjectId } = useStudyOs();

  const [dailyHours, setDailyHours] = useState<number>(profile.dailyStudyTargetHours || 4);
  const [planDays, setPlanDays] = useState<number>(7);

  // Generate timetable using pure logic
  const timetable: TimetableSchedule = generateStudyTimetable(
    subjects.map((s) => {
      const allTopics = s.units.flatMap((u) => u.topics);
      const highConf = allTopics.filter((t) => t.confidence === 'high').length;
      const lowConf = allTopics.filter((t) => t.confidence === 'low').length;
      const avgConf: 'low' | 'medium' | 'high' =
        lowConf > highConf ? 'low' : highConf > allTopics.length / 2 ? 'high' : 'medium';

      return {
        subjectId: s.id,
        subjectName: s.name,
        examDateIso: s.examDate,
        totalUnits: s.units.length,
        completedUnits: s.units.filter((u) =>
          u.topics.every((t) => t.confidence === 'high' || t.isMastered)
        ).length,
        averageConfidence: avgConf,
        creditWeight: s.creditWeight,
      };
    }),
    dailyHours,
    new Date().toISOString().split('T')[0],
    planDays
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 lg:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400">
              <CalendarDays className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-wider">
              Semester Examination Command Center
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight mt-1">
            Exam Strategy & Adaptive Study Timetable
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamically distributes study hours across all 7 subjects prioritized by exam proximity, syllabus credit weight, and topic confidence.
          </p>
        </div>

        {/* Timetable Parameters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0a0e1a] border border-[#232f48] px-3 py-1.5 rounded-xl text-xs">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <label htmlFor="daily-hours-input" className="text-slate-400">Target:</label>
            <input
              id="daily-hours-input"
              type="number"
              min={1}
              max={12}
              value={dailyHours}
              onChange={(e) => setDailyHours(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-10 bg-transparent text-white font-mono font-bold focus:outline-none"
            />
            <span className="text-slate-400">hrs/day</span>
          </div>

          <div className="flex items-center gap-2 bg-[#0a0e1a] border border-[#232f48] px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-violet-400" />
            <label htmlFor="plan-days-select" className="text-slate-400">Horizon:</label>
            <select
              id="plan-days-select"
              value={planDays}
              onChange={(e) => setPlanDays(parseInt(e.target.value))}
              className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
            >
              <option value={7} className="bg-[#0f172a]">7 Days</option>
              <option value={14} className="bg-[#0f172a]">14 Days</option>
              <option value={21} className="bg-[#0f172a]">21 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* 7 Subjects Examination Schedule & Dates Editor */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1b253b] pb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-400" />
            <span>Official Semester Exam Dates Schedule</span>
          </h2>
          <span className="text-xs text-slate-400">Editable university timetable</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {subjects.map((sub) => {
            const daysLeft = Math.max(
              0,
              Math.ceil((new Date(sub.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            );
            return (
              <div
                key={sub.id}
                className="p-3.5 rounded-xl bg-[#0a0e1a] border border-[#1c273e] text-xs space-y-2"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-violet-400">{sub.code}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      daysLeft <= 7
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                        : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/40'
                    }`}
                  >
                    {daysLeft} days left
                  </span>
                </div>
                <div className="font-semibold text-white truncate">{sub.name}</div>
                <div className="pt-1 flex items-center justify-between">
                  <label htmlFor={`exam-date-${sub.id}`} className="text-slate-400 text-[11px]">Exam Date:</label>
                  <input
                    id={`exam-date-${sub.id}`}
                    type="date"
                    value={sub.examDate}
                    onChange={(e) => updateSubject(sub.id, { examDate: e.target.value })}
                    className="bg-[#141b2e] text-slate-200 border border-[#232f48] rounded px-2 py-0.5 text-[11px] font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Time Distribution Breakdown */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Calculated Hours Distribution for Next {planDays} Days ({timetable.totalAvailableHours} Total Study Hours)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(timetable.subjectHoursSummary).map(([subId, data]) => {
            return (
              <div
                key={subId}
                className="p-3 rounded-xl bg-[#0a0e1a] border border-[#1c273e] space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white truncate">{data.subjectName}</span>
                  <span className="font-mono font-bold text-violet-300">{data.allocatedHours} hrs</span>
                </div>
                <div className="w-full bg-[#172038] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-indigo-500 h-1.5 rounded-full"
                    style={{ width: `${data.percent}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 text-right font-mono">
                  {data.percent}% of total time
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day-by-Day Focus Slots Timetable */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1b253b] pb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <span>Day-by-Day Actionable Study Plan</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {timetable.slots.length} Planned Sessions
          </span>
        </div>

        <div className="space-y-3">
          {Array.from(new Set(timetable.slots.map((s) => s.dateIso))).map((date) => {
            const daySlots = timetable.slots.filter((s) => s.dateIso === date);
            return (
              <div
                key={date}
                className="p-4 rounded-xl bg-[#0a0e1a] border border-[#1c273e] space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs border-b border-[#172038] pb-2 font-mono">
                  <span className="font-bold text-violet-300">{date}</span>
                  <span className="text-slate-400">
                    {daySlots.reduce((a, b) => a + b.allocatedHours, 0)} hrs planned
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {daySlots.map((slot, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-[#111827] border border-[#1d273f] text-xs flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-white">{slot.subjectName}</span>
                          <span className="text-violet-400 font-mono font-bold">
                            {slot.allocatedHours}h
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">{slot.focusArea}</div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#172038] text-slate-300 capitalize">
                          {slot.type.replace('_', ' ')}
                        </span>
                        <button
                          onClick={() => {
                            setActiveSubjectId(slot.subjectId);
                            onNavigateTab('tutor');
                          }}
                          className="text-[11px] text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
