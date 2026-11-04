import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const topics = new Set(['product', 'research', 'opensource', 'business', 'policy', 'community']);
export function validateEdition(input) {
  if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error('Invalid issue date');
  const date = new Date(input.date + 'T00:00:00Z');
  if (!Number.isFinite(+date) || date.toISOString().slice(0, 10) !== input.date) throw new Error('Invalid calendar date');
  if (!['morning', 'evening'].includes(input.edition)) throw new Error('Invalid edition');
  if (!Array.isArray(input.stories) || !input.stories.length || input.stories.length > 10) throw new Error('Each edition needs 1–10 verified stories');
  if (!Number.isFinite(Date.parse(input.publishedAt))) throw new Error('Publication timestamp required');
  if (!Number.isInteger(input.searchCount) || input.searchCount < 0) throw new Error('Search count required');
  const ids = new Set(), urls = new Set();
  for (const s of input.stories) {
    for (const key of ['id', 'title', 'summary', 'whyItMatters', 'context', 'publisher', 'publishedAt', 'retrievedAt']) if (typeof s[key] !== 'string' || !s[key].trim()) throw new Error('Missing story field: ' + key);
    const url = new URL(s.url); url.hash = '';
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsafe source URL');
    if (ids.has(s.id) || urls.has(url.href)) throw new Error('Duplicate story');
    if (!topics.has(s.category)) throw new Error('Invalid category');
    if (!Array.isArray(s.tags) || s.tags.some(tag => typeof tag !== 'string')) throw new Error('Invalid tags');
    if (!Number.isInteger(s.importance) || s.importance < 1 || s.importance > 5) throw new Error('Invalid importance');
    ids.add(s.id); urls.add(url.href);
  }
}
export function publishEdition(input, { directory = path.join(root, 'public/data'), replace = false } = {}) {
  validateEdition(input);
  fs.mkdirSync(directory, { recursive: true });
  const target = path.join(directory, input.date + '.json');
  const issue = fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, 'utf8')) : { schemaVersion: 1, date: input.date, editions: {} };
  if (issue.editions[input.edition] && !replace) throw new Error('Edition already exists; use --replace-edition with the complete revised edition');
  const others = Object.entries(issue.editions).filter(([key]) => key !== input.edition).flatMap(([, value]) => value.stories);
  const canonical = url => { const u = new URL(url); u.hash = ''; return u.href; };
  for (const story of input.stories) if (others.some(s => s.id === story.id || canonical(s.url) === canonical(story.url))) throw new Error('Story duplicates the other edition');
  issue.editions[input.edition] = { publishedAt: input.publishedAt, searchCount: input.searchCount, collectionWindow: input.collectionWindow || null, stories: input.stories };
  issue.updatedAt = new Date().toISOString();
  const days = fs.readdirSync(directory).filter(name => /^\d{4}-\d{2}-\d{2}\.json$/.test(name)).map(name => name === input.date + '.json' ? issue : JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8')));
  if (!days.some(day => day.date === issue.date)) days.push(issue);
  const index = { schemaVersion: 1, updatedAt: issue.updatedAt, days: days.sort((a, b) => a.date.localeCompare(b.date)).map(day => ({ date: day.date, updatedAt: day.updatedAt, morning: day.editions.morning?.stories.length || 0, evening: day.editions.evening?.stories.length || 0 })) };
  for (const [file, value] of [[target, issue], [path.join(directory, 'index.json'), index]]) { fs.writeFileSync(file + '.tmp', JSON.stringify(value, null, 2) + '\n'); fs.renameSync(file + '.tmp', file); }
  return { date: issue.date, edition: input.edition, count: input.stories.length, total: Object.values(issue.editions).reduce((n, e) => n + e.stories.length, 0) };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('Usage: node scripts/publish-edition.mjs edition.json [--replace-edition]');
  console.log(JSON.stringify(publishEdition(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), { replace: process.argv.includes('--replace-edition') })));
}
