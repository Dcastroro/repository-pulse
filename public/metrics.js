export function parseRepository(input) {
  const match = /^([a-z\d](?:[a-z\d-]{0,38}))\/([a-z\d_.-]{1,100})$/i.exec(input.trim());
  if (!match || match[2] === '.' || match[2] === '..') throw new Error('Enter a public repository as owner/name.');
  return {owner: match[1], name: match[2]};
}
export function dailyCommits(commits, now = new Date()) {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const days = Array.from({length:14}, (_, i) => {const d = new Date(today); d.setUTCDate(d.getUTCDate() - (13-i)); return {date:d.toISOString().slice(0,10), count:0};});
  const byDay = new Map(days.map(day => [day.date, day]));
  for (const commit of commits) { const date = commit?.commit?.committer?.date?.slice(0,10); const day = byDay.get(date); if (day) day.count++; }
  return days;
}
export function sinceDate(now = new Date()) { const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); d.setUTCDate(d.getUTCDate()-13); return d.toISOString(); }
