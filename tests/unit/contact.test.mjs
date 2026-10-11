import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContact, buildMailto, CONTACT_EMAIL, MESSAGE_MAX } from '../../lib/contact.js';

const valid = { name: 'Ada Lovelace', email: 'ada@example.com', message: 'We are hiring a robotics engineer.' };

test('a complete message has no errors', () => {
  assert.deepEqual(validateContact(valid), {});
});

test('empty or blank fields each get their own message', () => {
  assert.deepEqual(validateContact({ name: '  ', email: '', message: '\n' }), {
    name: 'Enter your name.',
    email: 'Enter your email address so I can reply.',
    message: 'Write a short message.',
  });
  assert.deepEqual(Object.keys(validateContact()), ['name', 'email', 'message']);
});

test('a malformed email address is explained with an example', () => {
  for (const email of ['ada', 'ada@', 'ada@example', 'ada @example.com', '@example.com']) {
    assert.equal(validateContact({ ...valid, email }).email, 'Enter an email address like name@example.com.', email);
  }
  assert.deepEqual(validateContact({ ...valid, email: '  ada@example.co.uk  ' }), {});
});

test('messages over the limit are refused with the limit stated', () => {
  assert.deepEqual(validateContact({ ...valid, message: 'x'.repeat(MESSAGE_MAX) }), {});
  assert.equal(validateContact({ ...valid, message: 'x'.repeat(MESSAGE_MAX + 1) }).message, 'Keep the message to 1,500 characters or fewer.');
});

test('the mailto link addresses Samir and carries the visitor’s words', () => {
  const url = new URL(buildMailto({ name: ' Ada ', email: 'ada@example.com', message: 'Hello & welcome?\nSecond line' }));
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, CONTACT_EMAIL);
  assert.equal(url.searchParams.get('subject'), 'Hello from Ada');
  assert.equal(url.searchParams.get('body'), 'Hello & welcome?\nSecond line\r\n\r\nAda\r\nada@example.com');
  assert.doesNotMatch(buildMailto(valid), /[ \n]/, 'the link is fully encoded');
});
