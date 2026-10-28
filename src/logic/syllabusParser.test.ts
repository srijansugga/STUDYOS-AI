/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSyllabusText } from './syllabusParser';

test('parseSyllabusText parses Units and topics cleanly', () => {
  const raw = `
Unit 1: Quantum Chemistry and Spectroscopy
* Schrodinger wave equation; Postulates; Molecular orbital theory
* UV-Visible and IR Spectroscopy

Unit 2: Electrochemistry and Corrosion
* Nernst equation and potentiometry
* Mechanism of corrosion and cathodic protection
  `;

  const units = parseSyllabusText(raw, 'chem');
  assert.equal(units.length, 2);
  assert.equal(units[0].unitNumber, 1);
  assert.equal(units[0].title, 'Quantum Chemistry and Spectroscopy');
  assert.ok(units[0].topics.length >= 2);
  assert.equal(units[0].topics[0].isVerifiedAgainstSyllabus, true);
  assert.equal(units[1].unitNumber, 2);
  assert.equal(units[1].title, 'Electrochemistry and Corrosion');
});
