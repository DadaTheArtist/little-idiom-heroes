export class ResultScreen {
  constructor(app) {
    this.app = app;
  }

  async enter(container, { results, levelConfig }) {
    const won = results.stars > 0;
    const nextChallenge = won ? this._findNextChallenge(levelConfig) : null;
    const el = document.createElement('div');
    el.className = `screen result-screen ${won ? 'win' : 'lose'}`;

    let actionsHTML;
    if (won) {
      actionsHTML = `
        ${nextChallenge ? `<button class="btn btn-gold" id="btn-next">下一個關卡</button>` : ''}
        <button class="btn ${nextChallenge ? 'btn-secondary' : 'btn-gold'}" id="btn-map">回到地圖</button>
      `;
    } else {
      actionsHTML = `
        <button class="btn btn-gold" id="btn-retry">重新挑戰</button>
        <button class="btn btn-secondary" id="btn-map">回到地圖</button>
      `;
    }

    el.innerHTML = `
      <div class="result-title">${won ? '關卡通過！' : '挑戰失敗…'}</div>
      <div class="result-stars">
        ${[1, 2, 3].map(i =>
          `<span class="result-star ${i <= results.stars ? 'earned' : 'empty'}">${i <= results.stars ? '⭐' : '☆'}</span>`
        ).join('')}
      </div>
      <div class="result-stats">
        <p>答對 <span class="highlight">${results.correctCount}</span> / ${results.totalQuestions} 題</p>
        <p>花費時間 <span class="highlight">${this._formatTime(results.timeSpent)}</span></p>
      </div>
      <div class="result-actions">
        ${actionsHTML}
      </div>
    `;

    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('active'));

    if (nextChallenge) {
      el.querySelector('#btn-next').addEventListener('click', () => {
        this.app.screenManager.switchTo('level-intro', {
          challenge: nextChallenge,
          zone: levelConfig.zone
        });
      });
    }

    const retryBtn = el.querySelector('#btn-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.app.startLevel(levelConfig);
      });
    }

    el.querySelector('#btn-map').addEventListener('click', () => {
      this.app.screenManager.switchTo('world-map', {});
    });
  }

  _findNextChallenge(levelConfig) {
    const zone = levelConfig.zone;
    const challenge = levelConfig.challenge;
    if (!zone?.challenges || !challenge?.id) return null;

    const idx = zone.challenges.findIndex(c => c.id === challenge.id);
    if (idx < 0 || idx >= zone.challenges.length - 1) return null;
    return zone.challenges[idx + 1];
  }

  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m > 0 ? `${m}分${s}秒` : `${s}秒`;
  }

  async exit() {}
}
