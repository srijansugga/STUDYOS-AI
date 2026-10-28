/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RevisionItem {
  id: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  unitTitle: string;
  intervalDays: number;
  repetitionCount: number;
  lastReviewedAt: string; // ISO date
  nextReviewAt: string; // ISO date
  lastScorePercent: number;
  confidence: 'low' | 'medium' | 'high';
  consecutiveCorrect: number;
  isOverdue?: boolean;
}

export interface ReviewPerformance {
  scorePercent: number; // 0 to 100
  confidence: 'low' | 'medium' | 'high';
  daysUntilExam?: number;
}

/**
 * Calculates next review interval based on spaced repetition rules:
 * Base intervals: 1, 3, 7, 14, 28 days.
 * - Incorrect (<60%): resets interval to 1 day.
 * - Low confidence with passing score: compressed interval (e.g., max 2 days).
 * - High confidence + >=80%: expands interval along ladder.
 * - Proximity to exam: caps interval so student reviews before exam.
 */
export function calculateNextInterval(
  currentIntervalDays: number,
  consecutiveCorrect: number,
  performance: ReviewPerformance
): { nextIntervalDays: number; nextConsecutiveCorrect: number } {
  const ladder = [1, 3, 7, 14, 28];

  if (performance.scorePercent < 60) {
    // Incorrect: trigger early review
    let nextInterval = 1;
    if (performance.daysUntilExam && performance.daysUntilExam <= 2) {
      nextInterval = 1;
    }
    return {
      nextIntervalDays: nextInterval,
      nextConsecutiveCorrect: 0,
    };
  }

  // Passing score (>=60%)
  const newConsecutive = consecutiveCorrect + 1;

  let nextInterval: number;
  if (performance.confidence === 'low') {
    // Correct but uncertain: extra review needed
    nextInterval = Math.min(2, Math.max(1, Math.floor(currentIntervalDays * 0.75)));
  } else if (performance.confidence === 'medium') {
    // Find next step in ladder
    const currentIndex = ladder.findIndex((val) => val >= currentIntervalDays);
    const nextIndex = currentIndex >= 0 ? Math.min(ladder.length - 1, currentIndex + 1) : 1;
    nextInterval = ladder[nextIndex];
  } else {
    // High confidence
    const currentIndex = ladder.findIndex((val) => val >= currentIntervalDays);
    const nextIndex = currentIndex >= 0 ? Math.min(ladder.length - 1, currentIndex + 1) : 2;
    nextInterval = ladder[nextIndex];
  }

  // Adapt to exam proximity if specified
  if (performance.daysUntilExam && performance.daysUntilExam > 0) {
    if (performance.daysUntilExam <= 3) {
      nextInterval = 1;
    } else if (nextInterval >= performance.daysUntilExam) {
      nextInterval = Math.max(1, Math.floor(performance.daysUntilExam / 2));
    }
  }

  return {
    nextIntervalDays: Math.max(1, nextInterval),
    nextConsecutiveCorrect: newConsecutive,
  };
}

/**
 * Computes next review date from given ISO timestamp and interval days.
 */
export function computeNextReviewDate(fromDateIso: string, intervalDays: number): string {
  const date = new Date(fromDateIso);
  date.setDate(date.getDate() + intervalDays);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Checks whether an item is overdue relative to a target reference date (YYYY-MM-DD).
 */
export function isRevisionOverdue(nextReviewAtIso: string, referenceDateIso: string): boolean {
  const nextDate = new Date(nextReviewAtIso.split('T')[0]).getTime();
  const refDate = new Date(referenceDateIso.split('T')[0]).getTime();
  return nextDate < refDate;
}

/**
 * Filters and deduplicates revision items by topicId, keeping the most recently updated.
 */
export function deduplicateRevisions(items: RevisionItem[]): RevisionItem[] {
  const map = new Map<string, RevisionItem>();
  for (const item of items) {
    const existing = map.get(item.topicId);
    if (!existing || new Date(item.lastReviewedAt).getTime() > new Date(existing.lastReviewedAt).getTime()) {
      map.set(item.topicId, item);
    }
  }
  return Array.from(map.values());
}
