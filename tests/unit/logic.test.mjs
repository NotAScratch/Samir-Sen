import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canRun3D,
  isDarkColor,
  clampLook,
  pickClip,
  phaseFor,
  selectRobotCandidate,
  cssLengthToPx,
  cssAngleToRad,
  cssNumber,
} from '../../robots/logic.js';

test('canRun3D is false when any gate fails', () => {
  assert.equal(canRun3D({ reducedMotion: true, saveData: false, hasWebGL: true }), false);
  assert.equal(canRun3D({ reducedMotion: false, saveData: true, hasWebGL: true }), false);
  assert.equal(canRun3D({ reducedMotion: false, saveData: false, hasWebGL: false }), false);
});

test('canRun3D is true when all gates are clear', () => {
  assert.equal(canRun3D({ reducedMotion: false, saveData: false, hasWebGL: true }), true);
});

test('isDarkColor flags dark untextured materials only', () => {
  assert.equal(isDarkColor({ r: 0.05, g: 0.05, b: 0.05 }, false), true);
  assert.equal(isDarkColor({ r: 0.05, g: 0.05, b: 0.05 }, true), false);
  assert.equal(isDarkColor({ r: 1, g: 0.5, b: 0 }, false), false);
});

test('clampLook limits to +/- max', () => {
  assert.equal(clampLook(1.2, 0.698), 0.698);
  assert.equal(clampLook(-1.2, 0.698), -0.698);
  assert.equal(clampLook(0.3, 0.698), 0.3);
});

test('pickClip matches case-insensitively or returns null', () => {
  const names = ['RobotArmature|Robot_Idle', 'RobotArmature|Robot_Wave'];
  assert.equal(pickClip(names, 'wave'), 'RobotArmature|Robot_Wave');
  assert.equal(pickClip(['A'], 'idle'), null);
});

test('phaseFor maps viewport position to run / idle / dispose', () => {
  assert.equal(phaseFor({ top: 100, bottom: 500 }, 900, 200), 'run');
  assert.equal(phaseFor({ top: 1050, bottom: 1400 }, 900, 200), 'run');
  assert.equal(phaseFor({ top: 1200, bottom: 1600 }, 900, 200), 'idle');
  assert.equal(phaseFor({ top: 2800, bottom: 3200 }, 900, 200), 'dispose');
  assert.equal(phaseFor({ top: -2400, bottom: -1900 }, 900, 200), 'dispose');
});

test('phaseFor uses the supplied design-token activation margin', () => {
  assert.equal(phaseFor({ top: 1050, bottom: 1400 }, 900, 200), 'run');
  assert.equal(phaseFor({ top: 1050, bottom: 1400 }, 900, 100), 'idle');
});

test('selectRobotCandidate chooses only one robot, preferring a visible robot', () => {
  const near = { id: 'near', phase: 'run', rect: { top: 920, bottom: 1320 } };
  const visible = { id: 'visible', phase: 'run', rect: { top: 500, bottom: 900 } };
  const otherVisible = { id: 'other-visible', phase: 'run', rect: { top: 0, bottom: 400 } };
  assert.equal(selectRobotCandidate([near, visible, otherVisible], 900), visible);
  assert.equal(selectRobotCandidate([near], 900), near);
  assert.equal(selectRobotCandidate([{ ...near, phase: 'idle' }], 900), null);
});

test('cssLengthToPx converts pixel and rem tokens', () => {
  assert.equal(cssLengthToPx('200px', 16), 200);
  assert.equal(cssLengthToPx('12.5rem', 16), 200);
});

test('cssAngleToRad parses deg and rad', () => {
  assert.ok(Math.abs(cssAngleToRad('40deg') - 0.6981) < 1e-4);
  assert.equal(cssAngleToRad('0.5rad'), 0.5);
});

test('cssNumber parses numeric strings with a fallback', () => {
  assert.equal(cssNumber('24px', 0), 24);
  assert.equal(cssNumber(' 0.1 ', 0), 0.1);
  assert.equal(cssNumber('', 7), 7);
});
