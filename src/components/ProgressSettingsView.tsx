/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LineChart,
  User,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Award,
  Clock,
  CalendarCheck,
  Target,
  Sparkles,
} from 'lucide-react';
import { useStudyOs } from '../context/StudyOsContext';

export const ProgressSettingsView: React.FC = () => {
  const {
    profile,
    updateProfile,
    subjects,
    quizAttempts,
    studySessions,
    revisionQueue,
    exportData,
    importData,
    resetAllData,
  } = useStudyOs();

  // Profile Form state
  const [name, setName] = useState(profile.name);
  const [branch, setBranch] = useState(profile.branch);
  const [semester, setSemester] = useState(profile.semester);
  const [targetGpa, setTargetGpa] = useState(profile.targetGpa);
  const [dailyHours, setDailyHours] = useState(profile.dailyStudyTargetHours);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Import state
  const [importJsonText, setImportJsonText] = useState('');
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      branch,
      semester,
      targetGpa,
      dailyStudyTargetHours: dailyHours,
    });
    setSaveMessage('Profile settings saved successfully.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleExport = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyos_btech_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importJsonText.trim()) return;
    const ok = importData(importJsonText);
    if (ok) {
      setImportNotice('Data restored successfully!');
      setImportJsonText('');
      setTimeout(() => setImportNotice(null), 3000);
    } else {
      setImportNotice('Failed to parse JSON. Please check file format.');
    }
  };

  // Aggregated analytics
  const totalStudyMinutes = studySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalStudyHours = Math.round((totalStudyMinutes / 60) * 10) / 10;
  const totalQuizScoreSum = quizAttempts.reduce((acc, q) => acc + q.result.scorePercentage, 0);
  const avgQuizScore = quizAttempts.length > 0 ? Math.round(totalQuizScoreSum / quizAttempts.length) : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 lg:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400">
              <LineChart className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-wider">
              Analytics & Student Preferences
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight mt-1">
            Personal Progress & Settings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real performance records, data export/backup, and semester targets.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-xl bg-[#1c263f] hover:bg-[#253354] border border-[#2d3e66] text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-violet-400" />
          <span>Export Full Backup</span>
        </button>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Logged Study Time</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            {totalStudyHours} <span className="text-sm font-normal text-slate-400">hours</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {studySessions.length} recorded session{studySessions.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Demonstrated Quiz Score</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            {avgQuizScore !== null ? `${avgQuizScore}%` : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {quizAttempts.length} evaluated attempt{quizAttempts.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Memory Tracks</span>
            <CalendarCheck className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            {revisionQueue.length} <span className="text-sm font-normal text-slate-400">topics</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            In spaced repetition queue
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Target Semester GPA</span>
            <Target className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            {profile.targetGpa}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Target daily study: {profile.dailyStudyTargetHours} hrs
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings Form */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-6 space-y-4">
          <div className="border-b border-[#1b253b] pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-violet-400" />
              <span>Student Profile & Targets</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize your university identity and semester study allocations.
            </p>
          </div>

          {saveMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Student Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0a0e1a] text-slate-200 border border-[#232f48] rounded-xl p-2.5 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Engineering Branch</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-[#0a0e1a] text-slate-200 border border-[#232f48] rounded-xl p-2.5 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Current Semester</label>
                <input
                  type="text"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full bg-[#0a0e1a] text-slate-200 border border-[#232f48] rounded-xl p-2.5 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Target GPA / Percentage</label>
                <input
                  type="text"
                  value={targetGpa}
                  onChange={(e) => setTargetGpa(e.target.value)}
                  className="w-full bg-[#0a0e1a] text-slate-200 border border-[#232f48] rounded-xl p-2.5 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Daily Study Target (Hours)</label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseInt(e.target.value) || 4)}
                  className="w-full bg-[#0a0e1a] text-slate-200 border border-[#232f48] rounded-xl p-2.5 focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors cursor-pointer shadow-md shadow-violet-600/20"
            >
              Update Profile Settings
            </button>
          </form>
        </div>

        {/* Data Persistence, Backup & Reset */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-6 space-y-4">
          <div className="border-b border-[#1b253b] pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4 text-violet-400" />
              <span>Data Sovereignty & Backup</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect, backup, or restore your entire study database.
            </p>
          </div>

          {importNotice && (
            <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-900/40 text-indigo-300 text-xs">
              {importNotice}
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Restore Database from JSON Bundle
              </label>
              <textarea
                rows={3}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="Paste exported STUDYOS JSON backup here..."
                className="w-full bg-[#0a0e1a] text-slate-200 border border-[#232f48] rounded-xl p-2.5 font-mono text-xs focus:outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={handleImport}
                disabled={!importJsonText.trim()}
                className="mt-2 px-3.5 py-1.5 rounded-lg bg-[#1a233a] hover:bg-[#253254] disabled:opacity-40 text-slate-200 text-xs font-semibold border border-[#2c3b62] cursor-pointer"
              >
                Restore JSON
              </button>
            </div>

            <div className="pt-4 border-t border-[#1b253b] space-y-2">
              <div className="text-rose-300 font-semibold">Danger Zone</div>
              <p className="text-slate-400 text-[11px]">
                Resetting will restore all 7 subjects to standard university defaults and clear quiz attempt history.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to reset all data to default BTech curriculum?')) {
                    resetAllData();
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Fresh Defaults</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
