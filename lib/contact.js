/* Contact form rules, kept free of the DOM so they can be unit tested.
   The form never sends anything itself: a valid message becomes a mailto:
   link that opens in the visitor's own email app. */
export const CONTACT_EMAIL = 'samirsen66@gmail.com';
export const MESSAGE_MAX = 1500;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns `{ field: message }` for every invalid field; `{}` when the form is valid. */
export function validateContact({ name = '', email = '', message = '' } = {}) {
  const errors = {};
  if (!name.trim()) errors.name = 'Enter your name.';
  if (!email.trim()) errors.email = 'Enter your email address so I can reply.';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter an email address like name@example.com.';
  if (!message.trim()) errors.message = 'Write a short message.';
  else if (message.length > MESSAGE_MAX) errors.message = `Keep the message to ${MESSAGE_MAX.toLocaleString('en')} characters or fewer.`;
  return errors;
}

/** A mailto: URL addressed to Samir, with the visitor's message as the body. */
export function buildMailto({ name, email, message }) {
  const subject = `Hello from ${name.trim()}`;
  // RFC 6068: line breaks in a mailto body are CRLF.
  const body = [message.trim(), '', name.trim(), email.trim()].join('\r\n');
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
