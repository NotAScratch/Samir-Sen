const NPT_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kathmandu',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatNpt(date) {
  return NPT_FORMATTER.format(date);
}
