/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SubjectExamConfig {
  subjectId: string;
  subjectName: string;
  examDateIso: string; // e.g. "2026-11-15"
  totalUnits: number;
  completedUnits: number;
  averageConfidence: 'low' | 'medium' | 'high';
  creditWeight: number; // e.g., 4 for Math, 3 for Chem, etc.
}

export interface DayStudySlot {
  dateIso: string;
  subjectId: string;
  subjectName: string;
  allocatedHours: number;
  focusArea: string; // e.g., "Unit 2: Linear Algebra - Eigenvalues"
  type: 'concept_review' | 'problem_solving' | 'mock_test' | 'spaced_revision';
}

export interface TimetableSchedule {
  totalDailyHours: number;
  daysRemaining: number;
  totalAvailableHours: number;
  slots: DayStudySlot[];
  subjectHoursSummary: Record<string, { subjectName: string; allocatedHours: number; percent: number }>;
}

/**
 * Distributes available study hours across subjects based on:
 * 1. Proximity of examination (fewer days -> higher priority)
 * 2. Confidence level (low confidence -> more hours needed)
 * 3. Incomplete units ratio
 * 4. Credit weight
 */
export function generateStudyTimetable(
  subjects: SubjectExamConfig[],
  dailyAvailableHours: number,
  startDateIso: string,
  totalPlanDays: number = 7
): TimetableSchedule {
  const startDate = new Date(startDateIso);
  const totalAvailableHours = dailyAvailableHours * totalPlanDays;

  // Compute weight score for each subject
  const subjectWeights: { subjectId: string; weight: number; config: SubjectExamConfig }[] = [];

  for (const sub of subjects) {
    const examDate = new Date(sub.examDateIso);
    const diffDays = Math.max(1, Math.ceil((examDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Proximity factor (sooner exam = higher factor)
    const proximityFactor = Math.max(1, 30 / diffDays);

    // Incomplete unit factor
    const incompleteRatio = sub.totalUnits > 0 ? (sub.totalUnits - sub.completedUnits) / sub.totalUnits : 0.5;
    const completionFactor = 1 + incompleteRatio * 1.5;

    // Confidence factor
    const confidenceMultiplier =
      sub.averageConfidence === 'low' ? 1.5 : sub.averageConfidence === 'medium' ? 1.0 : 0.7;

    const weight = sub.creditWeight * proximityFactor * completionFactor * confidenceMultiplier;
    subjectWeights.push({ subjectId: sub.subjectId, weight, config: sub });
  }

  const totalWeight = subjectWeights.reduce((sum, item) => sum + item.weight, 0);

  // Allocate total hours
  const subjectHoursSummary: Record<string, { subjectName: string; allocatedHours: number; percent: number }> = {};
  let allocatedTotal = 0;

  for (const item of subjectWeights) {
    const rawHours = totalWeight > 0 ? (item.weight / totalWeight) * totalAvailableHours : totalAvailableHours / subjects.length;
    const roundedHours = Math.max(1, Math.round(rawHours * 10) / 10);
    allocatedTotal += roundedHours;
    subjectHoursSummary[item.subjectId] = {
      subjectName: item.config.subjectName,
      allocatedHours: roundedHours,
      percent: 0,
    };
  }

  // Normalize percentages
  for (const key of Object.keys(subjectHoursSummary)) {
    subjectHoursSummary[key].percent = Math.round(
      (subjectHoursSummary[key].allocatedHours / allocatedTotal) * 100
    );
  }

  // Generate slots for each day
  const slots: DayStudySlot[] = [];
  const hoursPerSlot = 1.5; // typical focused block

  // Sort subjects by priority weight descending
  const prioritized = [...subjectWeights].sort((a, b) => b.weight - a.weight);

  for (let day = 0; day < totalPlanDays; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + day);
    const dateStr = dayDate.toISOString().split('T')[0];

    // Pick 2-3 subjects for this day to keep variety and retention
    let dayHoursRemaining = dailyAvailableHours;
    let subIdx = day % prioritized.length;

    while (dayHoursRemaining > 0) {
      const currentSub = prioritized[subIdx % prioritized.length].config;
      const slotHours = Math.min(dayHoursRemaining, hoursPerSlot);

      let type: DayStudySlot['type'] = 'concept_review';
      if (currentSub.averageConfidence === 'high') {
        type = 'mock_test';
      } else if (currentSub.averageConfidence === 'medium') {
        type = 'problem_solving';
      }

      slots.push({
        dateIso: dateStr,
        subjectId: currentSub.subjectId,
        subjectName: currentSub.subjectName,
        allocatedHours: slotHours,
        focusArea: `High-priority units (${currentSub.totalUnits - currentSub.completedUnits} remaining)`,
        type,
      });

      dayHoursRemaining -= slotHours;
      subIdx++;
    }
  }

  return {
    totalDailyHours: dailyAvailableHours,
    daysRemaining: totalPlanDays,
    totalAvailableHours,
    slots,
    subjectHoursSummary,
  };
}
