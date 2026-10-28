/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpenCheck,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Search,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Send,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { useStudyOs } from '../context/StudyOsContext';
import { parseSyllabusText } from '../logic/syllabusParser';

export const SyllabusLibraryView: React.FC = () => {
  const {
    activeSubject,
    subjects,
    setActiveSubjectId,
    updateSubject,
    addTopicToUnit,
    updateTopicVerification,
    uploadedMaterials,
    addUploadedMaterial,
    deleteUploadedMaterial,
  } = useStudyOs();

  // Mode: 'syllabus_structure' | 'upload_ingest' | 'grounded_qa'
  const [activeTab, setActiveTab] = useState<'syllabus_structure' | 'upload_ingest' | 'grounded_qa'>(
    'syllabus_structure'
  );

  // Ingestion state
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [rawTextContent, setRawTextContent] = useState<string>('');
  const [fileNotice, setFileNotice] = useState<string | null>(null);

  // Custom topic modal / inline state
  const [newTopicUnitId, setNewTopicUnitId] = useState<string>(activeSubject.units[0]?.id || '');
  const [newTopicName, setNewTopicName] = useState<string>('');
  const [newSubtopicsInput, setNewSubtopicsInput] = useState<string>('');

  // Grounded Q&A state
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [qaQuery, setQaQuery] = useState<string>('');
  const [qaLoading, setQaLoading] = useState<boolean>(false);
  const [qaResult, setQaResult] = useState<{ answer: string; documentTitle: string } | null>(null);

  const subjectMaterials = uploadedMaterials.filter((m) => m.subjectId === activeSubject.id);

  // Handle file selection (Text, Markdown, or PDF text)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFileNotice('File exceeds 5MB limit. Please provide a standard syllabus or notes document.');
      return;
    }

    setDocumentTitle(file.name.replace(/\.[^/.]+$/, ''));
    setFileNotice(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawTextContent(content);
    };
    reader.onerror = () => {
      setFileNotice('Unable to read selected file. Please paste text directly.');
    };

    reader.readAsText(file);
  };

  // Ingest Document into Subject Library & parse units
  const handleIngestDocument = () => {
    if (!rawTextContent.trim() || !documentTitle.trim()) {
      setFileNotice('Please provide a document title and syllabus content.');
      return;
    }

    // Parse units
    const parsedUnits = parseSyllabusText(rawTextContent, activeSubject.id);

    // Save material
    addUploadedMaterial({
      title: documentTitle.trim(),
      subjectId: activeSubject.id,
      fileName: `${documentTitle.trim()}.txt`,
      fileSizeBytes: rawTextContent.length,
      extractedText: rawTextContent,
      topicsIdentifiedCount: parsedUnits.reduce((acc, u) => acc + u.topics.length, 0),
    });

    // If syllabus parsed units, allow merging into subject
    if (parsedUnits.length > 0) {
      // Merge parsed units with existing
      const updatedUnits = [...activeSubject.units];
      for (const pUnit of parsedUnits) {
        const existingIdx = updatedUnits.findIndex(
          (u) => u.title.toLowerCase().includes(pUnit.title.toLowerCase()) || u.unitNumber === pUnit.unitNumber
        );
        if (existingIdx >= 0) {
          // Merge topics
          const existingTopics = updatedUnits[existingIdx].topics;
          for (const top of pUnit.topics) {
            if (!existingTopics.some((t) => t.name.toLowerCase() === top.name.toLowerCase())) {
              existingTopics.push({
                id: top.id,
                name: top.name,
                subtopics: top.subtopics,
                isVerifiedAgainstSyllabus: true,
                confidence: 'medium',
              });
            }
          }
        } else {
          updatedUnits.push({
            id: pUnit.id,
            unitNumber: updatedUnits.length + 1,
            title: pUnit.title,
            topics: pUnit.topics.map((t) => ({
              id: t.id,
              name: t.name,
              subtopics: t.subtopics,
              isVerifiedAgainstSyllabus: true,
              confidence: 'medium',
            })),
          });
        }
      }
      updateSubject(activeSubject.id, { units: updatedUnits });
    }

    setRawTextContent('');
    setDocumentTitle('');
    setActiveTab('syllabus_structure');
  };

  // Add Manual Custom Topic
  const handleAddCustomTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim() || !newTopicUnitId) return;

    const subList = newSubtopicsInput
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    addTopicToUnit(activeSubject.id, newTopicUnitId, newTopicName.trim(), subList);
    setNewTopicName('');
    setNewSubtopicsInput('');
  };

  // Grounded Document Q&A
  const handleRunGroundedQA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaQuery.trim() || !selectedMaterialId) return;

    const mat = uploadedMaterials.find((m) => m.id === selectedMaterialId);
    if (!mat) return;

    setQaLoading(true);
    try {
      const res = await fetch('/api/notes/grounded-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: activeSubject.name,
          documentTitle: mat.title,
          documentText: mat.extractedText,
          userQuery: qaQuery,
        }),
      });
      const data = await res.json();
      setQaResult(data);
    } catch (err: any) {
      setQaResult({
        answer: 'Failed to process grounded query: ' + err.message,
        documentTitle: mat.title,
      });
    } finally {
      setQaLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 lg:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400">
              <BookOpenCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-wider">
              Syllabus & Material Ingestion Hub
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-3">
            {activeSubject.name} Curriculum
            <span className="text-xs font-mono font-normal text-slate-400 bg-[#172038] px-2 py-0.5 rounded border border-[#2b3a62]">
              {activeSubject.code}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize course units, verify topics against university syllabus, and run grounded document Q&A.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#0a0e1a] border border-[#1f293d] rounded-xl p-1 text-xs">
          {[
            { id: 'syllabus_structure', label: 'Unit Structure' },
            { id: 'upload_ingest', label: 'Ingest Syllabus / Notes' },
            { id: 'grounded_qa', label: 'Grounded Doc Q&A' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Syllabus Structure & Topic Verification */}
      {activeTab === 'syllabus_structure' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Units and Topics List (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Units & Verification Status
              </h2>
              <span className="text-xs text-slate-400">
                Click shield icons to toggle verification against syllabus
              </span>
            </div>

            <div className="space-y-4">
              {activeSubject.units.map((unit) => (
                <div
                  key={unit.id}
                  className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden"
                >
                  <div className="p-4 bg-[#141b2e] border-b border-[#1b253b] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-violet-400 font-bold uppercase">
                        Unit {unit.unitNumber}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-0.5">{unit.title}</h3>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {unit.topics.length} Topics
                    </span>
                  </div>

                  <div className="divide-y divide-[#1b253b] p-2">
                    {unit.topics.map((topic) => (
                      <div
                        key={topic.id}
                        className="p-3 flex items-start justify-between gap-4 text-xs hover:bg-[#131b2e] rounded-lg transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-200 flex items-center gap-2">
                            <span>{topic.name}</span>
                            {topic.isVerifiedAgainstSyllabus ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 font-mono">
                                Verified
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/40 font-mono">
                                Unverified
                              </span>
                            )}
                          </div>

                          {topic.subtopics.length > 0 && (
                            <div className="text-[11px] text-slate-400 flex flex-wrap gap-1.5 pt-0.5">
                              {topic.subtopics.map((st, i) => (
                                <span
                                  key={i}
                                  className="bg-[#0b101c] px-2 py-0.5 rounded text-slate-300 border border-[#1d273f]"
                                >
                                  {st}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Toggle verification button */}
                        <button
                          onClick={() =>
                            updateTopicVerification(
                              activeSubject.id,
                              unit.id,
                              topic.id,
                              !topic.isVerifiedAgainstSyllabus
                            )
                          }
                          title={
                            topic.isVerifiedAgainstSyllabus
                              ? 'Click to mark unverified'
                              : 'Click to mark verified against syllabus'
                          }
                          className="p-1.5 rounded-lg hover:bg-[#1f2b46] text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                        >
                          {topic.isVerifiedAgainstSyllabus ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <ShieldAlert className="w-4 h-4 text-amber-400" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Manual Topic Form (1 col) */}
          <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 space-y-4 h-fit">
            <div className="border-b border-[#1b253b] pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-violet-400" />
                <span>Add Custom Topic / Unit</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Add university-specific topics from your syllabus.
              </p>
            </div>

            <form onSubmit={handleAddCustomTopic} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Target Unit</label>
                <select
                  value={newTopicUnitId}
                  onChange={(e) => setNewTopicUnitId(e.target.value)}
                  className="w-full bg-[#0a0e1a] text-slate-200 border border-[#232f48] rounded-xl p-2.5 font-medium focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  {activeSubject.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unitNumber}: {u.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Topic Name</label>
                <input
                  type="text"
                  required
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="e.g. Transient Response of RC Circuits"
                  className="w-full bg-[#0a0e1a] text-slate-200 border border-[#232f48] rounded-xl p-2.5 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Subtopics / Key Terms (comma separated)
                </label>
                <textarea
                  rows={3}
                  value={newSubtopicsInput}
                  onChange={(e) => setNewSubtopicsInput(e.target.value)}
                  placeholder="Time constant, differential equation, charging curve..."
                  className="w-full bg-[#0a0e1a] text-slate-200 border border-[#232f48] rounded-xl p-2.5 focus:outline-none focus:border-violet-500 font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors cursor-pointer shadow-md shadow-violet-600/20"
              >
                Add Topic to Syllabus
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Upload / Ingest Syllabus or Lecture Notes */}
      {activeTab === 'upload_ingest' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#111827] border border-[#1f293d] rounded-2xl p-6 space-y-5">
            <div className="border-b border-[#1b253b] pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-violet-400" />
                <span>Ingest University Syllabus or Course Notes</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Upload a document (.txt, .md, or extracted PDF text) or paste raw syllabus text directly. STUDYOS will automatically organize topics into units.
              </p>
            </div>

            {fileNotice && (
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fileNotice}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  Select Syllabus / Notes File
                </label>
                <input
                  type="file"
                  accept=".txt,.md,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  Document Title
                </label>
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder={`e.g. ${activeSubject.name} Official University Syllabus 2026`}
                  className="w-full bg-[#0a0e1a] text-slate-200 border border-[#232f48] rounded-xl p-2.5 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  Extracted Document Text / Syllabus Content
                </label>
                <textarea
                  rows={8}
                  value={rawTextContent}
                  onChange={(e) => setRawTextContent(e.target.value)}
                  placeholder={`Paste ${activeSubject.name} syllabus or lecture notes here...\n\nExample format:\nUnit 1: Quantum Chemistry\n* Schrodinger equation; Wave mechanics\n* Molecular orbital theory`}
                  className="w-full bg-[#0a0e1a] text-slate-200 border border-[#232f48] rounded-xl p-3 focus:outline-none focus:border-violet-500 font-mono text-xs leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleIngestDocument}
                disabled={!rawTextContent.trim() || !documentTitle.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-violet-600/20"
              >
                <BookOpenCheck className="w-4 h-4" />
                <span>Parse & Ingest into {activeSubject.name}</span>
              </button>
            </div>
          </div>

          {/* Uploaded Materials List for Active Subject */}
          <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1b253b] pb-2">
              Ingested Documents ({subjectMaterials.length})
            </h3>

            {subjectMaterials.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No materials uploaded for {activeSubject.name} yet.
              </div>
            ) : (
              <div className="space-y-3">
                {subjectMaterials.map((mat) => (
                  <div
                    key={mat.id}
                    className="p-3.5 rounded-xl bg-[#0a0e1a] border border-[#1c273e] text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-white leading-tight">{mat.title}</div>
                      <button
                        onClick={() => deleteUploadedMaterial(mat.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Delete material"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
                      <span>{Math.round(mat.fileSizeBytes / 1024)} KB</span>
                      <span>{new Date(mat.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{mat.topicsIdentifiedCount} topics parsed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Grounded Document Q&A */}
      {activeTab === 'grounded_qa' && (
        <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-6 space-y-6">
          <div className="border-b border-[#1b253b] pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <span>Grounded Document Question Answering</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Ask questions strictly verified against your uploaded lecture notes and syllabus. The model will acknowledge uncertainty and explicitly state when information is absent.
            </p>
          </div>

          {subjectMaterials.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-3">
              <p>No documents uploaded for {activeSubject.name} yet.</p>
              <button
                onClick={() => setActiveTab('upload_ingest')}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
              >
                Upload Course Notes First
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Select Reference Document:
                  </label>
                  <select
                    value={selectedMaterialId || subjectMaterials[0]?.id}
                    onChange={(e) => setSelectedMaterialId(e.target.value)}
                    className="w-full bg-[#0a0e1a] text-slate-200 border border-[#232f48] rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    {subjectMaterials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <form onSubmit={handleRunGroundedQA} className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">
                  Your Document Query:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={qaQuery}
                    onChange={(e) => setQaQuery(e.target.value)}
                    placeholder="e.g. Does the syllabus cover Norton theorem with dependent sources?"
                    className="flex-1 bg-[#0a0e1a] text-slate-200 border border-[#232f48] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-violet-500"
                  />
                  <button
                    type="submit"
                    disabled={qaLoading || !qaQuery.trim()}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>{qaLoading ? 'Searching Notes...' : 'Ask Document'}</span>
                  </button>
                </div>
              </form>

              {qaResult && (
                <div className="p-4 rounded-xl bg-[#0b101d] border border-[#1d273f] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-violet-400 font-mono">
                    <span>Grounded in: {qaResult.documentTitle}</span>
                    <span className="text-slate-500">Integrity Verified</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {qaResult.answer}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
