'use strict';
(() => {
  const topics = { all: '全部', product: '产品', research: '研究', opensource: '开源', business: '商业', policy: '治理', community: '社区' };
  const $ = id => document.getElementById(id);
  const state = { index: [], issue: null, edition: 'all', topic: 'all', query: '', savedOnly: false, bookmarks: new Set(), request: 0, focusStory: null };
  const bookmarkKey = 'ai-journal-reading-v1';
  try { const saved = JSON.parse(localStorage.getItem(bookmarkKey) || '[]'); if (Array.isArray(saved)) state.bookmarks = new Set(saved.filter(x => typeof x === 'string')); } catch (_) {}
  function node(tag, className, text) { const el = document.createElement(tag); if (className) el.className = className; if (text != null) el.textContent = text; return el; }
  function webLink(value) { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch (_) { return null; } }
  function allStories() { return ['morning', 'evening'].flatMap(edition => (state.issue?.editions?.[edition]?.stories || []).map(story => ({ ...story, edition }))); }
  function isScience(story) { return story.category === 'research' || (story.tags || []).some(tag => /科研|科学|量子|论文|复现/.test(tag)); }
  function showToast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(showToast.timer); showToast.timer = setTimeout(() => { $('toast').hidden = true; }, 2200); }
  function refreshBookmarkCount() { $('savedCount').textContent = state.bookmarks.size; $('savedToggle').setAttribute('aria-pressed', String(state.savedOnly)); }
  function toggleBookmark(story) {
    const had = state.bookmarks.has(story.id);
    had ? state.bookmarks.delete(story.id) : state.bookmarks.add(story.id);
    try { localStorage.setItem(bookmarkKey, JSON.stringify([...state.bookmarks])); showToast(had ? '已移出阅读清单' : '已加入阅读清单'); } catch (_) { showToast('当前浏览器无法保存，收藏仅在本次打开期间有效'); }
    refreshBookmarkCount(); render();
    if (state.focusStory) updateDialogSave();
  }
  function saveButton(story) { const b = node('button', 'bookmark', state.bookmarks.has(story.id) ? '★' : '☆'); b.setAttribute('aria-label', (state.bookmarks.has(story.id) ? '取消收藏：' : '收藏：') + story.title); b.setAttribute('aria-pressed', String(state.bookmarks.has(story.id))); b.addEventListener('click', () => toggleBookmark(story)); return b; }
  function detailButton(story, text = '阅读摘要 ↗') { const b = node('button', 'read-story', text); b.addEventListener('click', () => openStory(story)); return b; }
  function updateDialogSave() { $('dialogSave').textContent = state.bookmarks.has(state.focusStory.id) ? '★ 已收藏 · 点击移除' : '☆ 加入阅读清单'; }
  function openStory(story) {
    state.focusStory = story;
    $('dialogCategory').textContent = `${topics[story.category] || '资讯'} / ${story.edition === 'morning' ? '早报' : '晚报'}`;
    $('dialogTitle').textContent = story.title;
    $('dialogMeta').textContent = `${story.publisher} · 原文 ${story.publishedAt || '日期未注明'}`;
    $('dialogSummary').textContent = story.summary;
    $('dialogWhy').textContent = story.whyItMatters;
    $('dialogContext').textContent = story.context;
    const url = webLink(story.url); $('dialogLink').hidden = !url; if (url) $('dialogLink').href = url;
    updateDialogSave(); $('storyDialog').showModal();
  }
  function storyCard(story, number) {
    const article = node('article', 'story'); article.dataset.storyId = story.id;
    article.append(node('span', 'story-number', String(number).padStart(2, '0')));
    const body = node('div'); const meta = node('div', 'story-head');
    meta.append(node('span', 'topic-tag', topics[story.category] || '资讯'), node('span', '', story.edition === 'morning' ? '早报' : '晚报'));
    if (isScience(story)) meta.append(node('span', 'science-tag', '科研视角'));
    body.append(meta);
    const heading = node('h3', 'story-title'); heading.append(detailButton(story, story.title)); body.append(heading, node('p', 'story-summary', story.summary));
    const bottom = node('div', 'story-bottom'); bottom.append(node('span', '', story.publisher), node('span', '', story.publishedAt), detailButton(story)); body.append(bottom);
    article.append(body, saveButton(story)); return article;
  }
  function renderLead(story) {
    const lead = node('article', 'lead'); lead.append(node('p', 'eyebrow', 'EDITOR’S PICK / 本期重点'), node('h2', '', story.title), node('p', 'lead-summary', story.summary));
    const bottom = node('div', 'lead-bottom'); bottom.append(detailButton(story, '展开阅读 · 为什么值得关注 ↗'), node('span', 'story-source', `${story.publisher} / ${topics[story.category]}`)); lead.append(bottom); $('leadStory').replaceChildren(lead);
  }
  function setEmpty(title, description, error = false) { $('emptyTitle').textContent = title; $('emptyDescription').textContent = description; $('emptyState').hidden = false; $('retryButton').hidden = !error; }
  function render() {
    if (!state.issue) return;
    const stories = allStories(); const query = state.query.trim().toLocaleLowerCase();
    const filtered = stories.filter(story => (state.edition === 'all' || story.edition === state.edition) && (state.topic === 'all' || (state.topic === 'science' ? isScience(story) : story.category === state.topic)) && (!state.savedOnly || state.bookmarks.has(story.id)) && (!query || [story.title, story.summary, story.publisher, ...(story.tags || [])].join(' ').toLocaleLowerCase().includes(query)));
    const focus = state.topic !== 'all' || !!query || state.savedOnly;
    const leadVisible = filtered.length > 0 && !focus;
    $('leadStory').hidden = !leadVisible; if (leadVisible) renderLead(filtered[0]); else $('leadStory').replaceChildren();
    const list = leadVisible ? filtered.slice(1) : filtered;
    $('storyList').replaceChildren(...list.map((story, i) => storyCard(story, i + (leadVisible ? 2 : 1))));
    $('storyList').setAttribute('aria-busy', 'false');
    $('listHeading').replaceChildren(document.createTextNode(leadVisible ? '继续阅读 ' : (state.savedOnly ? '本期收藏 ' : '本期资讯 ')), node('span', '', String(list.length).padStart(2, '0')));
    $('editionNote').textContent = state.topic === 'science' ? '科研精选 · 关注证据与边界' : `本期共 ${stories.length} 条 · 原文可追溯`;
    $('activeFilter').hidden = !focus;
    $('activeFilter').firstElementChild.textContent = [state.savedOnly ? '仅看收藏' : '', state.topic !== 'all' ? (state.topic === 'science' ? '科研精选' : topics[state.topic]) : '', query ? `搜索：“${state.query}”` : ''].filter(Boolean).join(' / ');
    $('emptyState').hidden = true;
    if (!filtered.length) {
      const absentEdition = state.edition !== 'all' && !state.issue.editions[state.edition]?.stories?.length;
      if (absentEdition) setEmpty(state.edition === 'evening' ? '晚报尚未发布' : '早报尚未发布', '完成检索与原文核验后，本期内容会在这里出现。');
      else if (state.savedOnly) setEmpty('本期还没有符合条件的收藏', '点击资讯右侧的 ☆ 加入阅读清单，也可以清除其他筛选。');
      else setEmpty('暂时没有匹配的资讯', '试试其他关键词，或清除筛选查看本期全部内容。');
    }
    document.querySelectorAll('[data-edition]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.edition === state.edition)));
    document.querySelectorAll('[data-topic]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.topic === state.topic)));
    refreshBookmarkCount();
  }
  async function getJSON(path) { const response = await fetch(path, { cache: 'no-store' }); if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); }
  async function loadIssue(date) {
    const version = ++state.request;
    state.issue = null; $('storyList').setAttribute('aria-busy', 'true'); $('storyList').replaceChildren(node('p', 'loading', '正在读取这一期…')); $('leadStory').replaceChildren(); $('emptyState').hidden = true;
    try {
      const issue = await getJSON(`data/${encodeURIComponent(date)}.json`);
      if (version !== state.request) return;
      if (issue.date !== date || !issue.editions) throw new Error('Invalid issue');
      state.issue = issue;
      $('dateLabel').textContent = date.replaceAll('-', '.');
      $('issueNumber').textContent = `DAILY EDITION / ${String(state.index.findIndex(day => day.date === date) + 1).padStart(3, '0')}`;
      const morning = issue.editions.morning?.stories?.length || 0, evening = issue.editions.evening?.stories?.length || 0;
      $('morningStatus').textContent = morning ? `已刊 ${morning} 条` : '待发布'; $('eveningStatus').textContent = evening ? `已刊 ${evening} 条` : '待发布';
      $('publicationStatus').textContent = `早报 ${morning} 条 / 晚报 ${evening} 条`;
      render();
    } catch (_) {
      if (version !== state.request) return;
      $('storyList').replaceChildren(); $('storyList').setAttribute('aria-busy', 'false'); $('publicationStatus').textContent = '本期暂时无法读取'; setEmpty('日报暂时无法加载', '请检查网络后重试。你的阅读清单不会因此清空。', true);
    }
  }
  async function start() {
    try {
      const index = await getJSON('data/index.json');
      state.index = (index.days || []).filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x.date)).sort((a, b) => a.date.localeCompare(b.date));
      if (!state.index.length) throw new Error('No issues');
      $('daySelect').replaceChildren(...[...state.index].reverse().map(day => { const option = node('option', '', day.date); option.value = day.date; return option; }));
      await loadIssue($('daySelect').value);
    } catch (_) { $('storyList').replaceChildren(); $('storyList').setAttribute('aria-busy', 'false'); $('publicationStatus').textContent = '加载未完成'; setEmpty('暂时无法打开日报', '请检查网络后重新加载。', true); }
  }
  for (const [key, label] of Object.entries(topics)) { const b = node('button', '', label); b.dataset.topic = key; b.setAttribute('aria-pressed', String(key === 'all')); b.addEventListener('click', () => { state.topic = key; render(); }); $('categoryFilters').append(b); }
  document.querySelectorAll('[data-edition]').forEach(b => b.addEventListener('click', () => { state.edition = b.dataset.edition; render(); }));
  $('daySelect').addEventListener('change', () => loadIssue($('daySelect').value));
  $('searchInput').addEventListener('input', event => { state.query = event.target.value; render(); });
  $('savedToggle').addEventListener('click', () => { state.savedOnly = !state.savedOnly; render(); });
  $('scienceFilter').addEventListener('click', () => { state.topic = 'science'; state.edition = 'all'; state.savedOnly = false; state.query = ''; $('searchInput').value = ''; render(); $('news').scrollIntoView({ behavior: 'smooth' }); });
  $('clearFilters').addEventListener('click', () => { state.topic = 'all'; state.query = ''; state.savedOnly = false; $('searchInput').value = ''; render(); });
  $('retryButton').addEventListener('click', () => state.index.length ? loadIssue($('daySelect').value) : start());
  $('closeDialog').addEventListener('click', () => $('storyDialog').close());
  $('storyDialog').addEventListener('click', event => { if (event.target !== $('storyDialog')) return; const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); });
  $('dialogSave').addEventListener('click', () => { if (state.focusStory) toggleBookmark(state.focusStory); });
  refreshBookmarkCount(); start();
})();
