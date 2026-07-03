function toMysqlDate(value) {
  const date = value instanceof Date ? value : new Date(Number(value || 0));
  const pad = (part, size = 2) => String(part).padStart(size, '0');

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`,
  ].join(' ');
}

function toTimestamp(value) {
  if (!value) {
    return 0;
  }

  return new Date(value).getTime();
}

module.exports = { toMysqlDate, toTimestamp };
