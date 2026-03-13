export class WorldMap {
  constructor(app) {
    this.app = app;
    this.currentWorldIdx = 0;
  }

  async enter(container, data) {
    if (data.worldIdx !== undefined) this.currentWorldIdx = data.worldIdx;

    const zones = this.app.worldConfig.zones;

    if (zones[this.currentWorldIdx]?.enabled === false) {
      this.currentWorldIdx = zones.findIndex(z => z.enabled !== false);
      if (this.currentWorldIdx < 0) this.currentWorldIdx = 0;
    }
    const el = document.createElement('div');
    el.className = 'screen world-map-screen';

    el.innerHTML = `
      <div class="world-tabs">${zones.map((z, i) => {
        const disabled = z.enabled === false;
        return `<button class="world-tab${i === this.currentWorldIdx ? ' active' : ''}${disabled ? ' disabled' : ''}" data-idx="${i}" ${disabled ? 'disabled' : ''}>
          ${z.icon} ${z.name}${disabled ? '<span class="tab-locked-label">(尚未開放)</span>' : ''}
        </button>`;
      }).join('')}</div>
      <div class="world-content" id="world-content"></div>
    `;

    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('active'));

    el.querySelectorAll('.world-tab:not([disabled])').forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentWorldIdx = parseInt(tab.dataset.idx);
        el.querySelectorAll('.world-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._renderWorld(el.querySelector('#world-content'), zones[this.currentWorldIdx]);
      });
    });

    this._renderWorld(el.querySelector('#world-content'), zones[this.currentWorldIdx]);
  }

  _renderWorld(contentEl, zone) {
    const progress = this.app.progress;
    const textbook = this.app.getTextbook(zone.textbookId);
    let html = `
      <div class="world-header">
        <h2>${zone.icon} ${zone.name}</h2>
        <p>${zone.description}</p>
        <p style="font-size:12px;color:rgba(255,255,255,0.55);margin-top:6px;">
          課本：${textbook?.displayName || zone.textbookId}
        </p>
      </div>
      <div class="level-path">
    `;

    zone.challenges.forEach((challenge, i) => {
      const unlocked = progress.isUnlocked(challenge.id, challenge.unlockRequire);
      const completed = progress.isCompleted(challenge.id);
      const stars = progress.getStars(challenge.id);
      const stateClass = completed ? 'completed' : unlocked ? 'unlocked' : 'locked';
      const delay = i * 0.1;
      const gameMeta = this.app.peekGameForChallenge(challenge);

      if (i > 0) {
        html += `<div class="level-connector${unlocked ? ' unlocked' : ''}"></div>`;
      }

      html += `
        <div class="level-row">
          <button class="level-node ${stateClass}" data-level-idx="${i}" style="animation-delay:${delay}s" ${!unlocked && !completed ? 'disabled' : ''} aria-label="${challenge.name} - ${completed ? '已完成' : unlocked ? '可遊玩' : '鎖定'}">
            <div class="level-circle ${stateClass}">
              ${completed || unlocked
                ? `<span>${challenge.id.split('-').at(-1) || i + 1}</span>
                   <div class="level-game-icon" style="border-color:${completed ? 'var(--accent-green)' : 'var(--accent-blue)'}">${gameMeta?.icon || '🎮'}</div>`
                : `<span class="level-lock">🔒</span>`}
            </div>
            <div class="level-name">${challenge.name}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:3px;">
              ${challenge.questionType} · ${challenge.selectionMode === 'random' ? '隨機' : (gameMeta?.displayName || '固定')}
            </div>
            ${completed ? `<div class="level-stars">${this._starsHTML(stars, 3)}</div>` : ''}
          </button>
        </div>
      `;
    });

    html += '</div>';
    contentEl.innerHTML = html;

    contentEl.querySelectorAll('.level-node.unlocked, .level-node.completed').forEach(node => {
      node.addEventListener('click', () => {
        const idx = parseInt(node.dataset.levelIdx);
        const challenge = zone.challenges[idx];
        this.app.screenManager.switchTo('level-intro', { challenge, zone });
      });
    });
  }

  _starsHTML(earned, total) {
    let html = '';
    for (let i = 0; i < total; i++) {
      html += `<span class="star${i < earned ? ' earned' : ''}">⭐</span>`;
    }
    return html;
  }

  async exit() {}
}
