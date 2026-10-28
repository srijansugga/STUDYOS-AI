/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QuestionType =
  | 'mcq'
  | 'short_answer'
  | 'numerical'
  | 'derivation'
  | 'code_tracing'
  | 'diagram_analysis'
  | 'case_study';

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  marks: number;
  options?: string[]; // For MCQ: array of 4 choices (e.g., ["A) ...", "B) ..."])
  correctOptionIndex?: number; // 0, 1, 2, 3
  expectedAnswer?: string; // Standard expected answer or formula
  acceptableTolerance?: number; // For numerical (e.g. 0.05 for 5%)
  unitExpected?: string; // e.g. "V", "Hz", "J/mol", "Ohm"
  rubricCriteria?: {
    criterion: string;
    weightPercent: number;
    description: string;
  }[];
  explanation: string;
  topicId: string;
  topicName: string;
}

export interface StudentResponse {
  questionId: string;
  selectedOptionIndex?: number;
  textAnswer?: string;
  numericalValue?: number;
}

export interface QuestionEvaluation {
  questionId: string;
  isCorrect: boolean;
  marksAwarded: number;
  maxMarks: number;
  studentAnswerDisplay: string;
  expectedAnswerDisplay: string;
  explanation: string;
  feedback: string;
  rubricBreakdown?: { criterion: string; awardedPercent: number; comment: string }[];
  topicId: string;
  topicName: string;
}

export interface QuizResult {
  totalQuestions: number;
  answeredCount: number;
  totalMarksAwarded: number;
  maxMarksTotal: number;
  scorePercentage: number;
  evaluations: QuestionEvaluation[];
  weakTopics: { topicId: string; topicName: string; missedMarks: number }[];
  strongTopics: { topicId: string; topicName: string; earnedMarks: number }[];
  passed: boolean; // >= 60%
}

/**
 * Deterministically evaluates objective questions (MCQ and exact numerical values within tolerance).
 */
export function evaluateObjectiveQuestion(
  question: Question,
  response?: StudentResponse
): QuestionEvaluation {
  const maxMarks = question.marks || 1;

  if (!response) {
    return {
      questionId: question.id,
      isCorrect: false,
      marksAwarded: 0,
      maxMarks,
      studentAnswerDisplay: '(Unanswered)',
      expectedAnswerDisplay: question.expectedAnswer || (question.options && question.correctOptionIndex !== undefined ? question.options[question.correctOptionIndex] : ''),
      explanation: question.explanation,
      feedback: 'Question was left unattempted.',
      topicId: question.topicId,
      topicName: question.topicName,
    };
  }

  if (question.type === 'mcq') {
    const isCorrect = response.selectedOptionIndex === question.correctOptionIndex;
    const studentChoice =
      response.selectedOptionIndex !== undefined && question.options
        ? question.options[response.selectedOptionIndex]
        : '(None selected)';
    const expectedChoice =
      question.correctOptionIndex !== undefined && question.options
        ? question.options[question.correctOptionIndex]
        : (question.expectedAnswer || '');

    return {
      questionId: question.id,
      isCorrect,
      marksAwarded: isCorrect ? maxMarks : 0,
      maxMarks,
      studentAnswerDisplay: studentChoice,
      expectedAnswerDisplay: expectedChoice,
      explanation: question.explanation,
      feedback: isCorrect
        ? 'Correct choice selected.'
        : `Selected ${studentChoice}. The correct option is ${expectedChoice}.`,
      topicId: question.topicId,
      topicName: question.topicName,
    };
  }

  if (question.type === 'numerical' && question.expectedAnswer) {
    const expectedNum = parseFloat(question.expectedAnswer);
    const studentNum = response.numericalValue ?? (response.textAnswer ? parseFloat(response.textAnswer) : NaN);

    if (isNaN(studentNum)) {
      return {
        questionId: question.id,
        isCorrect: false,
        marksAwarded: 0,
        maxMarks,
        studentAnswerDisplay: response.textAnswer || '(No number given)',
        expectedAnswerDisplay: `${question.expectedAnswer} ${question.unitExpected || ''}`.trim(),
        explanation: question.explanation,
        feedback: 'No valid numerical value was parsed.',
        topicId: question.topicId,
        topicName: question.topicName,
      };
    }

    const tolerance = question.acceptableTolerance ?? 0.05; // 5% default
    const absDiff = Math.abs(studentNum - expectedNum);
    const allowedDiff = Math.abs(expectedNum * tolerance);
    const isCorrect = absDiff <= allowedDiff || absDiff < 1e-4;

    return {
      questionId: question.id,
      isCorrect,
      marksAwarded: isCorrect ? maxMarks : 0,
      maxMarks,
      studentAnswerDisplay: `${studentNum} ${question.unitExpected || ''}`.trim(),
      expectedAnswerDisplay: `${expectedNum} ${question.unitExpected || ''}`.trim(),
      explanation: question.explanation,
      feedback: isCorrect
        ? `Accurate calculation within ±${(tolerance * 100).toFixed(1)}% margin.`
        : `Calculated ${studentNum}, expected ${expectedNum} (acceptable range: ${(expectedNum - allowedDiff).toFixed(2)} - ${(expectedNum + allowedDiff).toFixed(2)}).`,
      topicId: question.topicId,
      topicName: question.topicName,
    };
  }

  // Fallback for non-objective when local check is performed
  const text = (response.textAnswer || '').trim();
  const hasText = text.length > 10;
  return {
    questionId: question.id,
    isCorrect: hasText,
    marksAwarded: hasText ? Math.round(maxMarks * 0.7) : 0,
    maxMarks,
    studentAnswerDisplay: text || '(Empty)',
    expectedAnswerDisplay: question.expectedAnswer || 'See rubric solution',
    explanation: question.explanation,
    feedback: hasText ? 'Answer registered for subjective review.' : 'Incomplete explanation.',
    topicId: question.topicId,
    topicName: question.topicName,
  };
}

/**
 * Aggregates all evaluations to form complete quiz results and diagnostic topic breakdown.
 */
export function aggregateQuizResult(evaluations: QuestionEvaluation[]): QuizResult {
  let totalMarksAwarded = 0;
  let maxMarksTotal = 0;
  let answeredCount = 0;

  const topicScores: Record<string, { topicName: string; earned: number; max: number }> = {};

  for (const ev of evaluations) {
    totalMarksAwarded += ev.marksAwarded;
    maxMarksTotal += ev.maxMarks;
    if (ev.studentAnswerDisplay !== '(Unanswered)' && ev.studentAnswerDisplay !== '(Empty)') {
      answeredCount++;
    }

    if (!topicScores[ev.topicId]) {
      topicScores[ev.topicId] = {
        topicName: ev.topicName,
        earned: 0,
        max: 0,
      };
    }
    topicScores[ev.topicId].earned += ev.marksAwarded;
    topicScores[ev.topicId].max += ev.maxMarks;
  }

  const scorePercentage = maxMarksTotal > 0 ? Math.round((totalMarksAwarded / maxMarksTotal) * 100) : 0;

  const weakTopics: { topicId: string; topicName: string; missedMarks: number }[] = [];
  const strongTopics: { topicId: string; topicName: string; earnedMarks: number }[] = [];

  for (const [topicId, data] of Object.entries(topicScores)) {
    const missed = data.max - data.earned;
    const percent = data.max > 0 ? (data.earned / data.max) * 100 : 0;
    if (missed > 0 && percent < 70) {
      weakTopics.push({ topicId, topicName: data.topicName, missedMarks: missed });
    } else if (percent >= 70) {
      strongTopics.push({ topicId, topicName: data.topicName, earnedMarks: data.earned });
    }
  }

  // Sort weak topics by highest missed marks
  weakTopics.sort((a, b) => b.missedMarks - a.missedMarks);

  return {
    totalQuestions: evaluations.length,
    answeredCount,
    totalMarksAwarded,
    maxMarksTotal,
    scorePercentage,
    evaluations,
    weakTopics,
    strongTopics,
    passed: scorePercentage >= 60,
  };
}
