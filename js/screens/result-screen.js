export class ResultScreen {
  constructor(app) {
    this.app = app;
  }

  async enter(container, { results, levelConfig }) {
    const won = results.stars > 0;
    const el = document.createElement('div');
    el.className = `screen result-screen ${won ? 'win' : 'lose'}`;

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
        <button class="btn btn-gold" id="btn-map">回到地圖</button>
        <button class="btn btn-secondary" id="btn-retry">再挑戰一次</button>
      </div>
    `;

    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('active'));

    el.querySelector('#btn-map').addEventListener('click', () => {
      this.app.screenManager.switchTo('world-map', {});
    });

    el.querySelector('#btn-retry').addEventListener('click', () => {
      this.app.startLevel(levelConfig);
    });
  }

  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m > 0 ? `${m}分${s}秒` : `${s}秒`;
  }

  async exit() {}
}
