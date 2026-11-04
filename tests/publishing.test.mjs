import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { publishEdition } from '../scripts/publish-edition.mjs';

const batch = edition => ({ date: '2026-11-04', edition, publishedAt: '2026-11-04T07:00:00+08:00', searchCount: 15, stories: Array.from({ length: 10 }, (_, i) => ({ id: `${edition}-${i}`, title: 'Test story', summary: 'Verified summary', whyItMatters: 'Significance', context: 'Reading scope', publisher: 'Test source', publishedAt: '2026-11-03', retrievedAt: '2026-11-04T00:00:00Z', url: `https://example.com/${edition}/${i}`, category: 'research', tags: ['science'], importance: 4 })) });
test('evening appends to morning, replacement preserves other edition, invalid input changes nothing', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-journal-test-'));
  try {
    publishEdition(batch('morning'), { directory });
    assert.equal(publishEdition(batch('evening'), { directory }).total, 20);
    const file = path.join(directory, '2026-11-04.json');
    const prior = fs.readFileSync(file, 'utf8');
    assert.throws(() => publishEdition(batch('morning'), { directory }), /already exists/);
    const duplicate = batch('morning'); duplicate.stories[0].url = batch('evening').stories[0].url;
    assert.throws(() => publishEdition(duplicate, { directory, replace: true }), /other edition/);
    const invalid = batch('morning'); invalid.stories[0].url = 'javascript:alert(1)';
    assert.throws(() => publishEdition(invalid, { directory, replace: true }), /Unsafe/);
    assert.equal(fs.readFileSync(file, 'utf8'), prior);
    const revision = batch('morning'); revision.stories[0].summary = 'Corrected summary';
    publishEdition(revision, { directory, replace: true });
    const issue = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.deepEqual(issue.editions.evening.stories, batch('evening').stories);
    assert.equal(issue.editions.morning.stories[0].summary, 'Corrected summary');
    const index = JSON.parse(fs.readFileSync(path.join(directory, 'index.json'), 'utf8'));
    assert.equal(index.days[0].morning, 10); assert.equal(index.days[0].evening, 10);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
