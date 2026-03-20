export class TitleScreen {
  constructor(app) {
    this.app = app;
  }

  async enter(container) {
    const totalStars = this.app.progress.getTotalStars();

    const el = document.createElement('div');
    el.className = 'screen title-screen';
    el.innerHTML = `
      <div class="title-bg-particles">${this._particles(20)}</div>
      <div class="title-logo">
        <div class="title-main">小小英雄<br>冒險王國</div>
        <div class="title-sub">邊玩邊學的冒險之旅</div>
      </div>
      <div class="title-actions">
        <button class="btn btn-gold" id="btn-start">開始冒險</button>
      </div>
      ${totalStars > 0 ? `<div class="title-stars-info">⭐ 已收集 ${totalStars} 顆星星</div>` : ''}
      <button class="title-settings-btn" id="btn-settings" aria-label="設定">⚙</button>
    `;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('active'));

    el.querySelector('#btn-start').addEventListener('click', () => {
      this.app.audioManager.playRandomBGM();
      this.app.screenManager.switchTo('world-map');
    });

    el.querySelector('#btn-settings').addEventListener('click', () => {
      this.app.screenManager.switchTo('settings');
    });
  }

  async exit() {}

  _particles(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
      const left = Math.random() * 100;
      const delay = Math.random() * 6;
      const duration = 4 + Math.random() * 4;
      const size = 2 + Math.random() * 4;
      html += `<span style="left:${left}%;width:${size}px;height:${size}px;animation-delay:${delay}s;animation-duration:${duration}s;"></span>`;
    }
    return html;
  }
}
