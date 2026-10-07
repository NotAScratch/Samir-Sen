/* Tiny browser test harness: register tests, then `await run()`.
   The page title becomes "PASS n/n" or "FAIL k/n" so a headless runner can
   read the result; per-test detail goes into <pre id="out">. */
const tests = [];

export const test = (name, fn) => tests.push({ name, fn });

export const assert = (cond, msg = 'assertion failed') => {
  if (!cond) throw new Error(msg);
};

export const assertEqual = (actual, expected, msg = '') => {
  if (actual !== expected) {
    throw new Error(`${msg} expected ${String(expected)}, got ${String(actual)}`.trim());
  }
};

export const run = async () => {
  let out = document.getElementById('out');
  if (!out) {
    out = document.createElement('pre');
    out.id = 'out';
    document.body.append(out);
  }
  const lines = [];
  let failed = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      lines.push(`ok   ${name}`);
    } catch (error) {
      failed += 1;
      lines.push(`FAIL ${name}: ${error.message}`);
    }
  }
  document.title = failed ? `FAIL ${failed}/${tests.length}` : `PASS ${tests.length}/${tests.length}`;
  out.textContent = lines.join('\n');
};
