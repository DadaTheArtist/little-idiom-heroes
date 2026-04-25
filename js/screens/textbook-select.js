export class TextbookSelect {
  constructor(app) {
    this.app = app;
  }

  async enter(container) {
    const zones = this.app.worldConfig.zones;
    const examPractice = this.app.worldConfig.examPractice;

    const groupedByTextbook = new Map();
    zones.forEach((zone, idx) => {
      const tid = zone.textbookId || '__none__';
      if (!groupedByTextbook.has(tid)) groupedByTextbook.set(tid, []);
      groupedByTextbook.get(tid).push({ zone, idx });
    });

    const cards = [];
    for (const [textbookId, items] of groupedByTextbook) {
      const textbook = this.app.getTextbook(textbookId);
      const allDisabled = items.every((it) => it.zone.enabled === false);
      const totalChallenges = items.reduce((sum, it) => sum + (it.zone.challenges?.length || 0), 0);
      const completedCount = items.reduce((sum, it) => {
        return sum + (it.zone.challenges?.filter((c) => this.app.progress.isCompleted(c.id)).length || 0);
      }, 0);
      const earnedStars = items.reduce((sum, it) => {
        return sum + (it.zone.challenges?.reduce((s, c) => s + this.app.progress.getStars(c.id), 0) || 0);
      }, 0);

      const iconList = items.map((it) => it.zone.icon).join(' ');
      const zoneNames = items.map((it) => it.zone.name).join('、');
      const displayName = textbook?.displayName || zoneNames || textbookId;
      const themeElement = textbook?.themeElement || items[0]?.zone?.themeElement || 'fire';
      const firstEnabledIdx = items.find((it) => it.zone.enabled !== false)?.idx ?? items[0].idx;

      cards.push({
        textbookId,
        displayName,
        themeElement,
        zoneNames,
        iconList,
        totalChallenges,
        completedCount,
        earnedStars,
        disabled: allDisabled,
        firstEnabledIdx
      });
    }

    const el = document.createElement('div');
    el.className = 'screen textbook-select-screen';
    el.innerHTML = `
      <button class="back-btn" id="btn-back" aria-label="返回">←</button>
      <div class="tb-header">
        <h1>選擇課本</h1>
        <p>挑一本課本開始冒險</p>
      </div>
      <div class="tb-list">
        ${cards.map((c) => `
          <button class="tb-card theme-${c.themeElement}${c.disabled ? ' disabled' : ''}"
                  data-tid="${c.textbookId}"
                  data-zone-idx="${c.firstEnabledIdx}"
                  ${c.disabled ? 'disabled' : ''}>
            <div class="tb-card-icon">${c.iconList || '📘'}</div>
            <div class="tb-card-body">
              <div class="tb-card-name">${c.displayName}</div>
              <div class="tb-card-zones">${c.zoneNames}</div>
              ${c.disabled
                ? '<div class="tb-card-stat tb-card-stat-locked">尚未開放</div>'
                : `<div class="tb-card-stat">關卡 ${c.completedCount}/${c.totalChallenges} ・ ⭐ ${c.earnedStars}</div>`}
            </div>
            <div class="tb-card-arrow">›</div>
          </button>
        `).join('')}
      </div>
      ${examPractice ? `
        <button class="tb-exam-btn" id="btn-exam">⚔ ${examPractice.title || '考前練習區'}</button>
      ` : ''}
    `;

    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('active'));

    el.querySelector('#btn-back').addEventListener('click', () => {
      this.app.screenManager.switchTo('title');
    });

    el.querySelectorAll('.tb-card:not([disabled])').forEach((card) => {
      card.addEventListener('click', () => {
        const tid = card.dataset.tid;
        const zoneIdx = parseInt(card.dataset.zoneIdx);
        this.app.screenManager.switchTo('world-map', { textbookId: tid, worldIdx: zoneIdx });
      });
    });

    el.querySelector('#btn-exam')?.addEventListener('click', () => {
      this.app.screenManager.switchTo('exam-practice');
    });
  }

  async exit() {}
}
