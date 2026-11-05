import {parseRepository, dailyCommits, sinceDate} from './metrics.js';
const $ = selector => document.querySelector(selector);
const form = $('#repo-form'), notice = $('#notice'), dashboard = $('#dashboard');
let controller;
async function getJson(path, signal, {allowEmpty = false} = {}) {
  const response = await fetch(`https://api.github.com${path}`, {signal, headers:{Accept:'application/vnd.github+json'}});
  if (allowEmpty && response.status === 409) return [];
  if (!response.ok) { if (response.status === 403 || response.status === 429) throw new Error('GitHub rate limit reached. Please wait and try again.'); if (response.status === 404) throw new Error('Repository not found or not public. Check the name and try again.'); throw new Error(`GitHub returned an error (${response.status}). Please try again.`); }
  const result = await response.json(); if (result?.incomplete_results) throw new Error('GitHub returned incomplete search results. Please retry.'); return result;
}
function text(id, value) { $(id).textContent = String(value); }
function drawChart(days) {
  const chart = $('#chart'), table = $('#daily-values'); chart.replaceChildren(); table.replaceChildren();
  const max = Math.max(1, ...days.map(day => day.count));
  for (const day of days) {
    const column = document.createElement('div'); column.className = 'bar-column';
    const bar = document.createElement('div'); bar.className = 'bar'; bar.style.height = `${Math.max(day.count ? 6 : 2, day.count/max*100)}%`; bar.title = `${day.date}: ${day.count} commits`;
    column.append(bar); chart.append(column);
    const row = document.createElement('tr'); for (const val of [day.date, day.count]) {const cell = document.createElement('td'); cell.textContent = val; row.append(cell);} table.append(row);
  }
  chart.setAttribute('aria-label', `Daily commits over 14 UTC days; ${days.reduce((n,d)=>n+d.count,0)} shown. Full daily counts follow in the table.`);
}
async function load(value) {
  if (controller) controller.abort();
  let repo; try {repo = parseRepository(value);} catch (error) {notice.textContent=error.message; dashboard.hidden=true; return;}
  controller = new AbortController(); const signal = controller.signal;
  const name = `${repo.owner}/${repo.name}`; const encoded = `${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`;
  notice.textContent = `Loading ${name} from GitHub…`; dashboard.hidden = true;
  try {
    const search = kind => `/search/issues?q=${encodeURIComponent(`repo:${name} is:${kind} is:open`)}&per_page=1`;
    const [info, issues, pulls, commits] = await Promise.all([
      getJson(`/repos/${encoded}`,signal), getJson(search('issue'),signal), getJson(search('pr'),signal),
      getJson(`/repos/${encoded}/commits?since=${encodeURIComponent(sinceDate())}&per_page=100`,signal,{allowEmpty:true}),
    ]);
    if (signal.aborted) return;
    const days = dailyCommits(commits); const count = days.reduce((n,day)=>n+day.count,0);
    text('#repo-title',info.full_name); text('#repo-description',info.description || 'No description provided.');
    $('#repo-link').href = `https://github.com/${encoded}`;
    text('#issues',issues.total_count.toLocaleString()); text('#pulls',pulls.total_count.toLocaleString());
    text('#stars',info.stargazers_count.toLocaleString()); text('#forks',info.forks_count.toLocaleString());
    text('#language',info.language || 'Not specified'); text('#branch',info.default_branch); text('#last-push',info.pushed_at ? info.pushed_at.slice(0,10) : 'Not available');
    text('#updated',new Date().toISOString().replace('T',' ').slice(0,16)+' UTC');
    text('#commit-total',commits.length === 100 ? `${count}+` : count);
    text('#sample-note',commits.length === 100 ? 'Showing at most 100 commits. Some activity in this window may be missing.' : 'All returned commits in the 14-day window; GitHub may update with a delay.');
    drawChart(days); dashboard.hidden=false; notice.textContent=`Showing public data for ${info.full_name}.`;
  } catch (error) {if (error.name !== 'AbortError') notice.textContent=error.message || 'Unable to load data. Please try again.';}
}
form.addEventListener('submit', event => {event.preventDefault(); load($('#repository').value);});
load($('#repository').value);
