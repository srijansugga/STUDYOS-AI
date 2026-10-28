/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNextInterval,
  computeNextReviewDate,
  isRevisionOverdue,
  deduplicateRevisions,
  RevisionItem,
} from './spacedRepetition';

test('spaced repetition resets to 1 day on failing score (<60%)', () => {
  const result = calculateNextInterval(7, 3, {
    scorePercent: 40,
    confidence: 'high',
  });
  assert.equal(result.nextIntervalDays, 1);
  assert.equal(result.nextConsecutiveCorrect, 0);
});

test('spaced repetition advances along ladder on high confidence passing score', () => {
  const result = calculateNextInterval(3, 1, {
    scorePercent: 90,
    confidence: 'high',
  });
  assert.equal(result.nextIntervalDays, 7);
  assert.equal(result.nextConsecutiveCorrect, 2);
});

test('spaced repetition compresses interval when student has low confidence despite passing score', () => {
  const result = calculateNextInterval(7, 2, {
    scorePercent: 75,
    confidence: 'low',
  });
  // Low confidence compresses interval to at most 2 days
  assert.ok(result.nextIntervalDays <= 2);
  assert.equal(result.nextConsecutiveCorrect, 3);
});

test('spaced repetition compresses interval if semester exam is in 3 days', () => {
  const result = calculateNextInterval(3, 2, {
    scorePercent: 95,
    confidence: 'high',
    daysUntilExam: 3,
  });
  assert.equal(result.nextIntervalDays, 1);
});

test('computeNextReviewDate correctly adds days', () => {
  const nextDate = computeNextReviewDate('2026-10-28T00:00:00.000Z', 3);
  assert.equal(nextDate, '2026-10-31');
});

test('isRevisionOverdue detects overdue items accurately', () => {
  assert.equal(isRevisionOverdue('2026-10-25', '2026-10-28'), true);
  assert.equal(isRevisionOverdue('2026-10-28', '2026-10-28'), false);
  assert.equal(isRevisionOverdue('2026-11-01', '2026-10-28'), false);
});

test('deduplicateRevisions keeps most recent review for same topicId', () => {
  const items: RevisionItem[] = [
    {
      id: 'rev-1',
      subjectId: 'chem',
      subjectName: 'Engineering Chemistry',
      topicId: 'chem-corrosion',
      topicName: 'Mechanism of Corrosion',
      unitTitle: 'Unit 2: Electrochemistry',
      intervalDays: 1,
      repetitionCount: 1,
      lastReviewedAt: '2026-10-20T10:00:00Z',
      nextReviewAt: '2026-10-21',
      lastScorePercent: 50,
      confidence: 'low',
      consecutiveCorrect: 0,
    },
    {
      id: 'rev-2',
      subjectId: 'chem',
      subjectName: 'Engineering Chemistry',
      topicId: 'chem-corrosion',
      topicName: 'Mechanism of Corrosion',
      unitTitle: 'Unit 2: Electrochemistry',
      intervalDays: 3,
      repetitionCount: 2,
      lastReviewedAt: '2026-10-25T10:00:00Z',
      nextReviewAt: '2026-10-28',
      lastScorePercent: 80,
      confidence: 'high',
      consecutiveCorrect: 1,
    },
  ];

  const deduped = deduplicateRevisions(items);
  assert.equal(deduped.length, 1);
  assert.equal(deduped[0].id, 'rev-2');
  assert.equal(deduped[0].lastScorePercent, 80);
});
