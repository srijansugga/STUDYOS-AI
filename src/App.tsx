/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudyOsProvider } from './context/StudyOsContext';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TutorWorkspaceView } from './components/TutorWorkspaceView';
import { QuizCenterView } from './components/QuizCenterView';
import { RevisionQueueView } from './components/RevisionQueueView';
import { SyllabusLibraryView } from './components/SyllabusLibraryView';
import { SemesterExamView } from './components/SemesterExamView';
import { ProgressSettingsView } from './components/ProgressSettingsView';

function AppContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-100 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Top Header */}
        <Header
          onToggleMobileMenu={() => setMobileSidebarOpen((prev) => !prev)}
          onOpenProfile={() => setActiveTab('analytics')}
        />

        {/* View Routing */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && <DashboardView onNavigateTab={setActiveTab} />}
          {activeTab === 'tutor' && <TutorWorkspaceView />}
          {activeTab === 'quiz' && <QuizCenterView />}
          {activeTab === 'revisions' && <RevisionQueueView />}
          {activeTab === 'syllabus' && <SyllabusLibraryView />}
          {activeTab === 'semester' && <SemesterExamView onNavigateTab={setActiveTab} />}
          {activeTab === 'analytics' && <ProgressSettingsView />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StudyOsProvider>
      <AppContent />
    </StudyOsProvider>
  );
}
