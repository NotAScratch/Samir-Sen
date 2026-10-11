import test from 'node:test';
import assert from 'node:assert/strict';
import { servoPose } from '../../lib/servo.js';

// Screen coordinates: x grows right, y grows down. dx/dy run from the shape to the pointer.
const MAX = 40;
const FAR = Infinity; // no fall-off: pure angle behaviour

test('servoPose points straight ahead when the pointer is level', () => {
  const pose = servoPose(100, 0, MAX, FAR);
  assert.equal(pose.tilt, 0);
  assert.equal(pose.ux, 1);
  assert.equal(pose.uy, 0);
});

test('servoPose tilts up (negative rotate) toward a pointer above and caps at the limit', () => {
  assert.equal(servoPose(100, -100, MAX, FAR).tilt, -40); // 45 degrees, capped to 40
  assert.ok(Math.abs(servoPose(100, -36.397, MAX, FAR).tilt - -20) < 0.01); // tan(20deg) ≈ 0.364
});

test('servoPose mirrors instead of flipping when the pointer is behind the shape', () => {
  // A pointer to the left and slightly above must still tilt up, never swing through 180 degrees.
  assert.equal(servoPose(-100, -10, MAX, FAR).tilt, servoPose(100, -10, MAX, FAR).tilt);
  assert.ok(servoPose(-100, -10, MAX, FAR).tilt < 0);
});

test('servoPose returns a unit vector for the sensor pupil, and rests at zero distance', () => {
  const pose = servoPose(30, 40, MAX, FAR);
  assert.ok(Math.abs(pose.ux - 0.6) < 1e-9 && Math.abs(pose.uy - 0.8) < 1e-9);
  assert.deepEqual(servoPose(0, 0, MAX, FAR), { tilt: 0, ux: 0, uy: 0 });
});

test('servoPose fades with distance and rests level beyond its reach', () => {
  const REACH = 400;
  assert.deepEqual(servoPose(0, -500, MAX, REACH), { tilt: 0, ux: 0, uy: 0 }); // out of reach: at rest
  const half = servoPose(0, -200, MAX, REACH); // straight up, half way to the edge of reach
  assert.ok(Math.abs(half.tilt - -20) < 1e-9, `half-way tilt ${half.tilt}`);
  assert.ok(Math.abs(half.uy - -0.5) < 1e-9, `half-way pupil ${half.uy}`);
  const near = servoPose(40, -40, MAX, REACH);
  assert.ok(near.tilt < -30 && near.tilt > -40, `near tilt ${near.tilt}`);
});
