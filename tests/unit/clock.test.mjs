import test from 'node:test';
import assert from 'node:assert/strict';
import { formatNpt } from '../../lib/clock.js';

test('formatNpt formats Kathmandu time as HH:MM', () => {
  assert.equal(formatNpt(new Date('2026-10-07T07:21:00Z')), '13:06');
});

test('formatNpt uses 00 for Kathmandu midnight', () => {
  assert.equal(formatNpt(new Date('2026-10-07T18:15:00Z')), '00:00');
});
