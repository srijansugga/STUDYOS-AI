/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateObjectiveQuestion,
  aggregateQuizResult,
  Question,
  StudentResponse,
} from './scoring';

test('evaluateObjectiveQuestion handles correct MCQ selection', () => {
  const question: Question = {
    id: 'q1',
    type: 'mcq',
    prompt: 'What is the SI unit of electric potential?',
    marks: 2,
    options: ['A) Ampere', 'B) Volt', 'C) Ohm', 'D) Farad'],
    correctOptionIndex: 1,
    explanation: 'Volt (V) is the SI unit of electromotive force and electric potential.',
    topicId: 'bee-basics',
    topicName: 'Electrical Fundamentals',
  };

  const response: StudentResponse = {
    questionId: 'q1',
    selectedOptionIndex: 1,
  };

  const evaluation = evaluateObjectiveQuestion(question, response);
  assert.equal(evaluation.isCorrect, true);
  assert.equal(evaluation.marksAwarded, 2);
  assert.equal(evaluation.studentAnswerDisplay, 'B) Volt');
});

test('evaluateObjectiveQuestion handles incorrect MCQ selection', () => {
  const question: Question = {
    id: 'q1',
    type: 'mcq',
    prompt: 'What is the SI unit of electric potential?',
    marks: 2,
    options: ['A) Ampere', 'B) Volt', 'C) Ohm', 'D) Farad'],
    correctOptionIndex: 1,
    explanation: 'Volt is the unit.',
    topicId: 'bee-basics',
    topicName: 'Electrical Fundamentals',
  };

  const response: StudentResponse = {
    questionId: 'q1',
    selectedOptionIndex: 0,
  };

  const evaluation = evaluateObjectiveQuestion(question, response);
  assert.equal(evaluation.isCorrect, false);
  assert.equal(evaluation.marksAwarded, 0);
  assert.equal(evaluation.studentAnswerDisplay, 'A) Ampere');
});

test('evaluateObjectiveQuestion evaluates numerical values within 5% tolerance', () => {
  const question: Question = {
    id: 'q2',
    type: 'numerical',
    prompt: 'Calculate the equivalent resistance of 10 Ohm and 15 Ohm in parallel.',
    marks: 4,
    expectedAnswer: '6.0',
    unitExpected: 'Ohm',
    acceptableTolerance: 0.05,
    explanation: 'R_eq = (10 * 15) / (10 + 15) = 150 / 25 = 6 Ohm.',
    topicId: 'bee-circuits',
    topicName: 'Resistor Networks',
  };

  // Student enters 6.1 (which is within 5% of 6.0 = ±0.3)
  const response: StudentResponse = {
    questionId: 'q2',
    numericalValue: 6.1,
  };

  const evaluation = evaluateObjectiveQuestion(question, response);
  assert.equal(evaluation.isCorrect, true);
  assert.equal(evaluation.marksAwarded, 4);

  // Student enters 7.5 (outside 5%)
  const responseWrong: StudentResponse = {
    questionId: 'q2',
    numericalValue: 7.5,
  };
  const evaluationWrong = evaluateObjectiveQuestion(question, responseWrong);
  assert.equal(evaluationWrong.isCorrect, false);
  assert.equal(evaluationWrong.marksAwarded, 0);
});

test('aggregateQuizResult accurately computes percentage and weak topics', () => {
  const evals = [
    {
      questionId: 'q1',
      isCorrect: true,
      marksAwarded: 2,
      maxMarks: 2,
      studentAnswerDisplay: 'B) Volt',
      expectedAnswerDisplay: 'B) Volt',
      explanation: 'Unit of potential',
      feedback: 'Correct',
      topicId: 'bee-basics',
      topicName: 'Fundamentals',
    },
    {
      questionId: 'q2',
      isCorrect: false,
      marksAwarded: 0,
      maxMarks: 4,
      studentAnswerDisplay: '9 Ohm',
      expectedAnswerDisplay: '6 Ohm',
      explanation: 'Parallel calculation',
      feedback: 'Formula error',
      topicId: 'bee-circuits',
      topicName: 'Network Theorems',
    },
    {
      questionId: 'q3',
      isCorrect: true,
      marksAwarded: 4,
      maxMarks: 4,
      studentAnswerDisplay: 'Correct steps',
      expectedAnswerDisplay: 'KVL equation',
      explanation: 'Kirchhoff Voltage Law',
      feedback: 'Good job',
      topicId: 'bee-basics',
      topicName: 'Fundamentals',
    },
  ];

  const result = aggregateQuizResult(evals);
  assert.equal(result.totalMarksAwarded, 6);
  assert.equal(result.maxMarksTotal, 10);
  assert.equal(result.scorePercentage, 60);
  assert.equal(result.passed, true);
  assert.equal(result.weakTopics.length, 1);
  assert.equal(result.weakTopics[0].topicId, 'bee-circuits');
  assert.equal(result.weakTopics[0].missedMarks, 4);
});
