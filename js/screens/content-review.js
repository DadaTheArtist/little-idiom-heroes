export class ContentReview {
  constructor(app) {
    this.app = app;
  }

  async enter(container, data = {}) {
    const textbookId = data.textbookId || null;
    if (textbookId) {
      await this._renderQuestions(container, textbookId);
    } else {
      this._renderTextbookList(container);
    }
  }

  _renderTextbookList(container) {
    const zones = this.app.worldConfig.zones;
    const grouped = new Map();
    zones.forEach((zone) => {
      const tid = zone.textbookId || '__none__';
      if (!grouped.has(tid)) grouped.set(tid, []);
      grouped.get(tid).push(zone);
    });

    const cards = [];
    for (const [textbookId, zList] of grouped) {
      const textbook = this.app.getTextbook(textbookId);
      const totalChallenges = zList.reduce((s, z) => s + (z.challenges?.length || 0), 0);
      if (totalChallenges === 0) continue;
      const contentPaths = new Set();
      zList.forEach((z) => z.challenges?.forEach((c) => c.content && contentPaths.add(c.content)));
      cards.push({
        textbookId,
        displayName: textbook?.displayName || zList.map((z) => z.name).join('、'),
        zoneNames: zList.map((z) => z.name).join('、'),
        sourceCount: contentPaths.size,
        themeElement: textbook?.themeElement || zList[0]?.themeElement || 'fire'
      });
    }

    const el = document.createElement('div');
    el.className = 'screen content-review-screen';
    el.innerHTML = `
      <button class="back-btn" id="cr-back" aria-label="返回">←</button>
      <div class="cr-header">
        <h1>題目校對</h1>
        <p>選擇一本測驗，檢視所有題目與答案</p>
      </div>
      <div class="cr-list">
        ${cards.map((c) => `
          <button class="cr-card theme-${c.themeElement}" data-tid="${c.textbookId}">
            <div class="cr-card-body">
              <div class="cr-card-name">${c.displayName}</div>
              <div class="cr-card-meta">${c.zoneNames}</div>
              <div class="cr-card-meta">題庫檔 ${c.sourceCount} 個</div>
            </div>
            <div class="cr-card-arrow">›</div>
          </button>
        `).join('') || '<div class="cr-empty">沒有可校對的題庫</div>'}
      </div>
    `;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('active'));

    el.querySelector('#cr-back').addEventListener('click', () => {
      this.app.screenManager.switchTo('settings');
    });
    el.querySelectorAll('.cr-card').forEach((card) => {
      card.addEventListener('click', () => {
        this.app.screenManager.switchTo('content-review', { textbookId: card.dataset.tid });
      });
    });
  }

  async _renderQuestions(container, textbookId) {
    const textbook = this.app.getTextbook(textbookId);
    const zones = this.app.worldConfig.zones.filter((z) => z.textbookId === textbookId);

    const el = document.createElement('div');
    el.className = 'screen content-review-screen';
    el.innerHTML = `
      <button class="back-btn" id="cr-back" aria-label="返回">←</button>
      <div class="cr-header">
        <h1>${textbook?.displayName || textbookId}</h1>
        <p id="cr-summary">載入中…</p>
      </div>
      <div class="cr-search-wrap">
        <input type="search" id="cr-search" placeholder="搜尋成語、題幹或例句…" class="cr-search">
      </div>
      <div class="cr-questions" id="cr-questions">
        <div class="cr-loading">載入中…</div>
      </div>
    `;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('active'));

    el.querySelector('#cr-back').addEventListener('click', () => {
      this.app.screenManager.switchTo('content-review');
    });

    const groups = await this._collectGroups(zones);
    let totalQuestions = 0;
    groups.forEach((g) => { totalQuestions += g.questions.length; });

    el.querySelector('#cr-summary').textContent = `共 ${groups.length} 個題庫檔・${totalQuestions} 題`;

    const listEl = el.querySelector('#cr-questions');
    const renderGroups = (filterText) => {
      const needle = (filterText || '').trim().toLowerCase();
      let html = '';
      let visibleQuestions = 0;
      groups.forEach((g) => {
        const filtered = needle
          ? g.questions.filter((q) => this._matches(q, needle))
          : g.questions;
        if (!filtered.length) return;
        visibleQuestions += filtered.length;
        html += `
          <div class="cr-group">
            <div class="cr-group-title">
              <span class="cr-group-source">${g.source}</span>
              <span class="cr-group-zone">${g.zoneNames.join('、')}</span>
              <span class="cr-group-count">${filtered.length} / ${g.questions.length} 題</span>
            </div>
            ${filtered.map((q, i) => this._renderQuestionItem(q, i + 1)).join('')}
          </div>
        `;
      });
      listEl.innerHTML = html || '<div class="cr-empty">沒有符合的題目</div>';
      el.querySelector('#cr-summary').textContent = needle
        ? `符合 ${visibleQuestions} / ${totalQuestions} 題`
        : `共 ${groups.length} 個題庫檔・${totalQuestions} 題`;
    };

    renderGroups('');
    el.querySelector('#cr-search').addEventListener('input', (e) => {
      renderGroups(e.target.value);
    });
  }

  async _collectGroups(zones) {
    const sourceMap = new Map();
    zones.forEach((zone) => {
      zone.challenges?.forEach((ch) => {
        if (!ch.content) return;
        if (!sourceMap.has(ch.content)) {
          sourceMap.set(ch.content, { source: ch.content, zoneNames: new Set() });
        }
        sourceMap.get(ch.content).zoneNames.add(zone.name);
      });
    });

    const groups = [];
    for (const [source, info] of sourceMap) {
      try {
        const content = await this.app.contentLoader.load(source);
        groups.push({
          source,
          zoneNames: [...info.zoneNames],
          questions: content.questions || []
        });
      } catch {
        groups.push({
          source,
          zoneNames: [...info.zoneNames],
          questions: [],
          error: true
        });
      }
    }
    return groups;
  }

  _matches(q, needle) {
    const fields = [q.id, q.stem, q.answer, q.hint, q.playerHint, q.prompt];
    return fields.some((f) => f && String(f).toLowerCase().includes(needle));
  }

  _renderQuestionItem(q, idx) {
    const safe = (s) => (s == null ? '' : String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])));
    const type = q.type || 'choice';
    let answerHTML = '';
    if (type === 'multi-select') {
      const correct = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];
      answerHTML = `<div class="cr-q-row"><span class="cr-q-label">正確答案</span><span class="cr-q-answer">${correct.map(safe).join('、') || '—'}</span></div>`;
      if (Array.isArray(q.options) && q.options.length) {
        answerHTML += `<div class="cr-q-row"><span class="cr-q-label">所有選項</span><span class="cr-q-meta">${q.options.map(safe).join(' / ')}</span></div>`;
      }
    } else if (type === 'ordering') {
      const order = Array.isArray(q.correctOrder) ? q.correctOrder : [];
      answerHTML = `<div class="cr-q-row"><span class="cr-q-label">正確順序</span><span class="cr-q-answer">${order.map(safe).join(' → ') || '—'}</span></div>`;
    } else if (type === 'true-false') {
      answerHTML = `<div class="cr-q-row"><span class="cr-q-label">答案</span><span class="cr-q-answer">${q.answer === true || q.answer === 'O' || q.answer === '是' ? 'O 正確' : 'X 錯誤'}</span></div>`;
    } else {
      answerHTML = `<div class="cr-q-row"><span class="cr-q-label">答案</span><span class="cr-q-answer">${safe(q.answer)}</span></div>`;
      if (Array.isArray(q.options) && q.options.length) {
        answerHTML += `<div class="cr-q-row"><span class="cr-q-label">選項</span><span class="cr-q-meta">${q.options.map(safe).join(' / ')}</span></div>`;
      }
    }

    return `
      <div class="cr-q">
        <div class="cr-q-head">
          <span class="cr-q-idx">#${idx}</span>
          <span class="cr-q-id">${safe(q.id || '')}</span>
          <span class="cr-q-type">${type}</span>
        </div>
        <div class="cr-q-row"><span class="cr-q-label">題幹</span><span class="cr-q-text">${safe(q.stem || q.prompt || '')}</span></div>
        ${answerHTML}
        ${q.hint ? `<div class="cr-q-row"><span class="cr-q-label">例句／提示</span><span class="cr-q-text">${safe(q.hint)}</span></div>` : ''}
        ${q.playerHint ? `<div class="cr-q-row"><span class="cr-q-label">小提示</span><span class="cr-q-meta">${safe(q.playerHint)}</span></div>` : ''}
      </div>
    `;
  }

  async exit() {}
}
