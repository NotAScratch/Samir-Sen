/* Tiny browser test harness: register tests, then `await run()`.
   The page title becomes "PASS n/n" or "FAIL k/n" so a headless runner can
   read the result; per-test detail goes into <pre id="out">. */
const tests = [];
const TIMEOUT_MS = 10000;

export const test = (name, fn) => tests.push({ name, fn });

export const assert = (cond, msg = 'assertion failed') => {
  if (!cond) throw new Error(msg);
};

export const assertEqual = (actual, expected, msg = '') => {
  if (actual !== expected) {
    throw new Error(`${msg} expected ${String(expected)}, got ${String(actual)}`.trim());
  }
};

// A hung test fails instead of leaving the page title unset.
const withTimeout = (promise) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
      await withTimeout(Promise.resolve().then(fn));
      lines.push(`ok   ${name}`);
    } catch (error) {
      failed += 1;
      // Tests may throw non-Errors (null, strings).
      lines.push(`FAIL ${name}: ${error?.message ?? String(error)}`);
    }
  }
  document.title = tests.length && !failed ? `PASS ${tests.length}/${tests.length}` : `FAIL ${failed}/${tests.length}`;
  out.textContent = lines.join('\n');
};
