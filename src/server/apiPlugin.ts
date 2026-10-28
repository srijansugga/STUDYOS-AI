/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Plugin, ViteDevServer } from 'vite';
import { IncomingMessage, ServerResponse } from 'http';
import {
  generateTutorExplanation,
  chatWithTutor,
  generateProgressiveHint,
  generateSemesterQuiz,
  evaluateSubjectiveAnswer,
  answerFromNotes,
} from './geminiHandler';

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, payload: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export function studyosApiPlugin(): Plugin {
  return {
    name: 'studyos-backend-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        if (!url || !url.startsWith('/api/')) {
          return next();
        }

        try {
          if (url === '/api/health' && req.method === 'GET') {
            return sendJson(res, 200, {
              status: 'operational',
              system: 'STUDYOS Engine',
              hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
              timestamp: new Date().toISOString(),
            });
          }

          if (req.method !== 'POST') {
            return sendJson(res, 405, { error: 'Method Not Allowed' });
          }

          const body = await parseBody(req);

          if (url === '/api/tutor/explain') {
            const result = await generateTutorExplanation(body);
            return sendJson(res, 200, result);
          }

          if (url === '/api/tutor/chat') {
            const reply = await chatWithTutor(body);
            return sendJson(res, 200, { reply });
          }

          if (url === '/api/tutor/hint') {
            const hintData = await generateProgressiveHint(body);
            return sendJson(res, 200, hintData);
          }

          if (url === '/api/quiz/generate') {
            const quiz = await generateSemesterQuiz(body);
            return sendJson(res, 200, quiz);
          }

          if (url === '/api/quiz/evaluate') {
            const evaluation = await evaluateSubjectiveAnswer(body);
            return sendJson(res, 200, evaluation);
          }

          if (url === '/api/notes/grounded-qa') {
            const qaResult = await answerFromNotes(body);
            return sendJson(res, 200, qaResult);
          }

          return sendJson(res, 404, { error: 'Endpoint Not Found' });
        } catch (error: any) {
          console.error('[STUDYOS API Error]:', error);
          return sendJson(res, 500, {
            error: error?.message || 'Server-side AI processing error',
            details: error?.statusText || 'Error communicating with Gemini model',
          });
        }
      });
    },
  };
}
