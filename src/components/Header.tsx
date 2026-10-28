/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, Sparkles, Calendar, UserCheck } from 'lucide-react';
import { useStudyOs } from '../context/StudyOsContext';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenProfile,
}) => {
  const { profile, activeSubject, subjects, setActiveSubjectId } = useStudyOs();

  // Calculate days until first exam
  const today = new Date();
  const examDate = new Date(profile.examStartDate);
  const diffDays = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <header className="sticky top-0 z-30 bg-[#0d1222]/90 backdrop-blur-md border-b border-[#1a233a] px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
      {/* Left section: mobile hamburger + subject selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#1a233a] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <label htmlFor="active-subject-select" className="text-xs text-slate-400 font-medium hidden sm:inline">
            Active Focus:
          </label>
          <select
            id="active-subject-select"
            value={activeSubject.id}
            onChange={(e) => setActiveSubjectId(e.target.value)}
            className="bg-[#151c30] text-slate-200 border border-[#273352] rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-violet-500 cursor-pointer transition-colors max-w-[200px] sm:max-w-none truncate"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#0f172a] text-slate-200">
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right section: Exam countdown + Student profile button */}
      <div className="flex items-center gap-3">
        {/* Semester Exam Countdown Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/50 border border-indigo-800/40 text-indigo-300 text-xs">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium hidden md:inline">Semester Exams:</span>
          <span className="font-mono font-bold text-white bg-indigo-900/60 px-1.5 py-0.5 rounded text-[11px]">
            {diffDays} days left
          </span>
        </div>

        {/* AI Engine Status Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#151c30] border border-[#25314f] text-[11px] text-slate-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Gemini 3.8 Flash</span>
        </div>

        {/* Profile Pill */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-[#151c30] hover:bg-[#1a233a] border border-[#273352] text-xs transition-colors text-slate-200"
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
            {profile.name.charAt(0)}
          </div>
          <div className="text-left hidden sm:block">
            <div className="font-semibold text-slate-200 text-xs leading-none">{profile.name}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{profile.branch.split(' ')[0]}</div>
          </div>
          <UserCheck className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </button>
      </div>
    </header>
  );
};
