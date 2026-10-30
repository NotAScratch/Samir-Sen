import test from 'node:test';
import assert from 'node:assert/strict';
import { validSpecimens } from '../../lib/specimens.js';

const good = { name: 'Hand truck', category: 'Logistics', model: 'assets/simready/hand-truck.glb', credit: 'NVIDIA SimReady · CC BY 4.0' };

test('an empty or missing manifest yields no specimens', () => {
  assert.deepEqual(validSpecimens(undefined), []);
  assert.deepEqual(validSpecimens({}), []);
  assert.deepEqual(validSpecimens({ specimens: [] }), []);
});

test('complete entries pass; incomplete ones are dropped', () => {
  assert.equal(validSpecimens({ specimens: [good] }).length, 1);
  for (const key of ['name', 'category', 'model', 'credit']) {
    assert.deepEqual(validSpecimens({ specimens: [{ ...good, [key]: ' ' }] }), [], `blank ${key} accepted`);
  }
});

test('models and posters must live directly in assets/simready/', () => {
  for (const model of ['https://example.com/x.glb', 'assets/simready/../x.glb', 'assets/models/robot-arm.glb', 'assets/simready/x.usd']) {
    assert.deepEqual(validSpecimens({ specimens: [{ ...good, model }] }), [], `${model} accepted`);
  }
  assert.equal(validSpecimens({ specimens: [{ ...good, poster: 'assets/simready/hand-truck.webp' }] })[0].poster, 'assets/simready/hand-truck.webp');
  assert.equal(validSpecimens({ specimens: [{ ...good, poster: 'javascript:alert(1)' }] })[0].poster, '');
});
