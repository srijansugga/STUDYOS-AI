/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import {
  generateTutorExplanation,
  chatWithTutor,
  generateProgressiveHint,
  generateSemesterQuiz,
  evaluateSubjectiveAnswer,
  answerFromNotes,
} from './src/server/geminiHandler.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'operational',
    system: 'STUDYOS BTech Server Engine',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Tutor routes
app.post('/api/tutor/explain', async (req, res) => {
  try {
    const result = await generateTutorExplanation(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Tutor explain error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate explanation' });
  }
});

app.post('/api/tutor/chat', async (req, res) => {
  try {
    const reply = await chatWithTutor(req.body);
    res.json({ reply });
  } catch (error: any) {
    console.error('Tutor chat error:', error);
    res.status(500).json({ error: error?.message || 'Chat service error' });
  }
});

app.post('/api/tutor/hint', async (req, res) => {
  try {
    const hintData = await generateProgressiveHint(req.body);
    res.json(hintData);
  } catch (error: any) {
    console.error('Tutor hint error:', error);
    res.status(500).json({ error: error?.message || 'Hint generation error' });
  }
});

app.post('/api/quiz/generate', async (req, res) => {
  try {
    const quiz = await generateSemesterQuiz(req.body);
    res.json(quiz);
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ error: error?.message || 'Quiz generation failed' });
  }
});

app.post('/api/quiz/evaluate', async (req, res) => {
  try {
    const evaluation = await evaluateSubjectiveAnswer(req.body);
    res.json(evaluation);
  } catch (error: any) {
    console.error('Quiz evaluation error:', error);
    res.status(500).json({ error: error?.message || 'Evaluation failed' });
  }
});

app.post('/api/notes/grounded-qa', async (req, res) => {
  try {
    const result = await answerFromNotes(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Notes QA error:', error);
    res.status(500).json({ error: error?.message || 'Document Q&A failed' });
  }
});

// Serve static build in production
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`STUDYOS Server running on port ${PORT}`);
});
