/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { generateStudyTimetable, SubjectExamConfig } from './timetable';

test('generateStudyTimetable allocates more hours to urgent and low-confidence subjects', () => {
  const subjects: SubjectExamConfig[] = [
    {
      subjectId: 'math',
      subjectName: 'Engineering Mathematics',
      examDateIso: '2026-11-05', // Closer exam
      totalUnits: 5,
      completedUnits: 1, // More units incomplete
      averageConfidence: 'low', // Low confidence
      creditWeight: 4,
    },
    {
      subjectId: 'mgt',
      subjectName: 'Management Studies',
      examDateIso: '2026-11-25', // Later exam
      totalUnits: 5,
      completedUnits: 4, // Mostly done
      averageConfidence: 'high',
      creditWeight: 2,
    },
  ];

  const schedule = generateStudyTimetable(subjects, 4, '2026-10-28', 7);
  assert.equal(schedule.totalDailyHours, 4);
  assert.equal(schedule.totalAvailableHours, 28);
  assert.ok(schedule.slots.length > 0);

  const mathHours = schedule.subjectHoursSummary['math'].allocatedHours;
  const mgtHours = schedule.subjectHoursSummary['mgt'].allocatedHours;

  assert.ok(
    mathHours > mgtHours,
    `Math (${mathHours}h) should receive significantly more hours than Management (${mgtHours}h)`
  );
});
