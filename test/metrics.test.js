import { test } from 'node:test';
import assert from 'node:assert/strict';
import {parseRepository, dailyCommits, sinceDate} from '../public/metrics.js';
test('validates owner/name inputs without accepting paths or domains', () => {
  assert.deepEqual(parseRepository(' Dcastroro/repo-craft '), {owner:'Dcastroro',name:'repo-craft'});
  for (const value of ['https://github.com/a/b','a/../secret','a/..','a/b?x=1','a/b/c']) assert.throws(() => parseRepository(value));
});
test('uses 14 inclusive UTC days and ignores commits outside the window', () => {
  const now = new Date('2026-11-05T12:00:00Z');
  const commit = date => ({commit:{committer:{date}}});
  const result = dailyCommits([commit('2026-10-23T23:59:59Z'),commit('2026-11-05T00:00:00Z'),commit('2026-10-22T23:59:59Z')],now);
  assert.equal(sinceDate(now),'2026-10-23T00:00:00.000Z'); assert.equal(result.length,14);
  assert.equal(result[0].count,1); assert.equal(result[13].count,1); assert.equal(result.reduce((n,x)=>n+x.count,0),2);
});
