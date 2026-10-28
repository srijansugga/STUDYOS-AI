/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParsedTopic {
  id: string;
  name: string;
  subtopics: string[];
  isVerifiedAgainstSyllabus: boolean;
  pageReferences?: string[];
}

export interface ParsedUnit {
  id: string;
  unitNumber: number;
  title: string;
  topics: ParsedTopic[];
}

/**
 * Parses raw text (e.g. pasted or extracted from PDF) into structured Units and Topics.
 * Identifies markers like "Unit 1", "Module 1", "Chapter 1", bullet points, etc.
 */
export function parseSyllabusText(rawText: string, defaultPrefix: string = 'unit'): ParsedUnit[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const units: ParsedUnit[] = [];

  let currentUnit: ParsedUnit | null = null;
  let currentTopic: ParsedTopic | null = null;
  let unitCounter = 1;
  let topicCounter = 1;

  const unitRegex = /^(?:unit|module|chapter|section)\s*([0-9IVXLCDM]+)[\s:\-\.]*(.*)$/i;
  const topicBulletRegex = /^[-*•\d+\.]\s+(.*)$/;

  for (const line of lines) {
    const unitMatch = line.match(unitRegex);
    if (unitMatch) {
      if (currentTopic && currentUnit) {
        currentUnit.topics.push(currentTopic);
        currentTopic = null;
      }
      if (currentUnit) {
        units.push(currentUnit);
      }

      const numStr = unitMatch[1];
      const parsedNum = parseInt(numStr, 10);
      const unitNum = isNaN(parsedNum) ? unitCounter : parsedNum;
      const title = unitMatch[2].trim() || `Unit ${unitNum}`;

      currentUnit = {
        id: `${defaultPrefix}-u${unitNum}-${Date.now().toString(36)}`,
        unitNumber: unitNum,
        title,
        topics: [],
      };
      unitCounter++;
      continue;
    }

    // If we haven't seen a unit yet, create a default Unit 1
    if (!currentUnit) {
      currentUnit = {
        id: `${defaultPrefix}-u1-${Date.now().toString(36)}`,
        unitNumber: 1,
        title: 'Core Concepts & Fundamentals',
        topics: [],
      };
    }

    const bulletMatch = line.match(topicBulletRegex);
    if (bulletMatch) {
      const topicText = bulletMatch[1].trim();

      // Check if it has subtopics separated by semicolons or commas
      if (topicText.includes(';') || (topicText.length > 50 && topicText.includes(','))) {
        const parts = topicText.split(/[;,]/).map((p) => p.trim()).filter((p) => p.length > 0);
        const mainName = parts[0];
        const subs = parts.slice(1);

        if (currentTopic) {
          currentUnit.topics.push(currentTopic);
        }

        currentTopic = {
          id: `${currentUnit.id}-t${topicCounter++}`,
          name: mainName,
          subtopics: subs,
          isVerifiedAgainstSyllabus: true,
        };
      } else {
        if (currentTopic) {
          currentUnit.topics.push(currentTopic);
        }

        currentTopic = {
          id: `${currentUnit.id}-t${topicCounter++}`,
          name: topicText,
          subtopics: [],
          isVerifiedAgainstSyllabus: true,
        };
      }
    } else if (currentTopic) {
      // Append as subtopic
      currentTopic.subtopics.push(line);
    } else {
      // Treat as a new topic
      currentTopic = {
        id: `${currentUnit.id}-t${topicCounter++}`,
        name: line,
        subtopics: [],
        isVerifiedAgainstSyllabus: true,
      };
    }
  }

  if (currentTopic && currentUnit) {
    currentUnit.topics.push(currentTopic);
  }
  if (currentUnit && !units.includes(currentUnit)) {
    units.push(currentUnit);
  }

  return units;
}
