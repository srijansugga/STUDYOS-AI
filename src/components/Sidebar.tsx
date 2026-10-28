/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  BrainCircuit,
  GraduationCap,
  CalendarClock,
  BookOpenCheck,
  CalendarDays,
  LineChart,
  Atom,
  Binary,
  Zap,
  Cpu,
  Briefcase,
  Leaf,
  Code2,
} from 'lucide-react';
import { useStudyOs } from '../context/StudyOsContext';

export type ActiveTab =
  | 'dashboard'
  | 'tutor'
  | 'quiz'
  | 'revisions'
  | 'syllabus'
  | 'semester'
  | 'analytics';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
}) => {
  const { subjects, activeSubject, setActiveSubjectId, revisionQueue } = useStudyOs();

  const todayStr = new Date().toISOString().split('T')[0];
  const dueRevisionCount = revisionQueue.filter((r) => r.nextReviewAt <= todayStr).length;

  const subjectIcons: Record<string, React.ReactNode> = {
    math: <Binary className="w-4 h-4 text-blue-400" />,
    chem: <Atom className="w-4 h-4 text-emerald-400" />,
    bee: <Zap className="w-4 h-4 text-amber-400" />,
    ece: <Cpu className="w-4 h-4 text-purple-400" />,
    mgt: <Briefcase className="w-4 h-4 text-rose-400" />,
    evs: <Leaf className="w-4 h-4 text-green-400" />,
    cse: <Code2 className="w-4 h-4 text-cyan-400" />,
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tutor', label: 'AI Tutor Workspace', icon: BrainCircuit },
    { id: 'quiz', label: 'Quiz & Assessments', icon: GraduationCap },
    {
      id: 'revisions',
      label: 'Revision Queue',
      icon: CalendarClock,
      badge: dueRevisionCount > 0 ? dueRevisionCount : undefined,
    },
    { id: 'syllabus', label: 'Syllabus & Documents', icon: BookOpenCheck },
    { id: 'semester', label: 'Semester Exam Mode', icon: CalendarDays },
    { id: 'analytics', label: 'Progress & Settings', icon: LineChart },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#0d1222] border-r border-[#1a233a] z-50 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-[#1a233a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-500/20">
              OS
            </div>
            <div>
              <div className="font-bold tracking-tight text-white flex items-center gap-1.5 text-base">
                STUDYOS
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800/40">
                  BTech
                </span>
              </div>
              <div className="text-[11px] text-slate-400">Semester 1 Success System</div>
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as ActiveTab);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-900/60 to-indigo-900/40 text-white border border-violet-700/50 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#151c30]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-slate-400'}`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Seven BTech Subjects Quick Selector */}
          <div className="pt-5 pb-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2 flex items-center justify-between">
              <span>BTech Subjects (7)</span>
              <span className="text-[9px] text-violet-400 font-mono">Sem 1</span>
            </div>
            <div className="space-y-1">
              {subjects.map((sub) => {
                const isSelected = activeSubject.id === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setActiveSubjectId(sub.id);
                      if (activeTab === 'dashboard') {
                        // Keep dashboard or focus
                      }
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all text-left ${
                      isSelected
                        ? 'bg-[#182038] text-white border border-[#2e3b63] font-medium'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#12182a]'
                    }`}
                  >
                    <span className="shrink-0">{subjectIcons[sub.id] || <Atom className="w-4 h-4" />}</span>
                    <div className="flex-1 truncate">
                      <div className="truncate">{sub.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{sub.code}</div>
                    </div>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[#1a233a] bg-[#0a0e1a]/80 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gemini 3.8 Flash Ready</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">v1.0</span>
        </div>
      </aside>
    </>
  );
};
