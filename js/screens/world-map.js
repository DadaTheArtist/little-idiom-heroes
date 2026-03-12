const GAME_ICONS = {
  'boss-fight': '⚔️',
  'racing': '🏎️',
  'match3': '💎',
  'connect': '🃏'
};

const GAME_NAMES = {
  'boss-fight': '魔王戰',
  'racing': '賽車',
  'match3': '寶石消除',
  'connect': '記憶配對'
};

export class WorldMap {
  constructor(app) {
    this.app = app;
    this.currentWorldIdx = 0;
  }

  async enter(container, data) {
    if (data.worldIdx !== undefined) this.currentWorldIdx = data.worldIdx;

    const worlds = this.app.worldConfig.worlds;
    const el = document.createElement('div');
    el.className = 'screen world-map-screen';

    el.innerHTML = `
      <div class="world-tabs">${worlds.map((w, i) =>
        `<button class="world-tab${i === this.currentWorldIdx ? ' active' : ''}" data-idx="${i}">
          ${w.icon} ${w.name}
        </button>`
      ).join('')}</div>
      <div class="world-content" id="world-content"></div>
    `;

    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('active'));

    el.querySelectorAll('.world-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentWorldIdx = parseInt(tab.dataset.idx);
        el.querySelectorAll('.world-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._renderWorld(el.querySelector('#world-content'), worlds[this.currentWorldIdx]);
      });
    });

    this._renderWorld(el.querySelector('#world-content'), worlds[this.currentWorldIdx]);
  }

  _renderWorld(contentEl, world) {
    const progress = this.app.progress;
    let html = `
      <div class="world-header">
        <h2>${world.icon} ${world.name}</h2>
        <p>${world.description}</p>
      </div>
      <div class="level-path">
    `;

    world.levels.forEach((level, i) => {
      const unlocked = progress.isUnlocked(level.id, level.unlockRequire);
      const completed = progress.isCompleted(level.id);
      const stars = progress.getStars(level.id);
      const stateClass = completed ? 'completed' : unlocked ? 'unlocked' : 'locked';
      const delay = i * 0.1;

      if (i > 0) {
        html += `<div class="level-connector${unlocked ? ' unlocked' : ''}"></div>`;
      }

      html += `
        <div class="level-row">
          <button class="level-node ${stateClass}" data-level-idx="${i}" style="animation-delay:${delay}s" ${!unlocked && !completed ? 'disabled' : ''} aria-label="${level.name} - ${completed ? '已完成' : unlocked ? '可遊玩' : '鎖定'}">
            <div class="level-circle ${stateClass}">
              ${completed || unlocked
                ? `<span>${level.id.split('-')[1]}</span>
                   <div class="level-game-icon" style="border-color:${completed ? 'var(--accent-green)' : 'var(--accent-blue)'}">${GAME_ICONS[level.game] || '?'}</div>`
                : `<span class="level-lock">🔒</span>`}
            </div>
            <div class="level-name">${level.name}</div>
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
        const level = world.levels[idx];
        this.app.screenManager.switchTo('level-intro', { level, world });
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
