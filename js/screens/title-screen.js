const TAP_THRESHOLD = 5;
const TAP_WINDOW_MS = 2500;

export class TitleScreen {
  constructor(app) {
    this.app = app;
  }

  async enter(container) {
    const totalStars = this.app.progress.getTotalStars();
    const devMode = !!this.app.settings.get('developerMode');

    const el = document.createElement('div');
    el.className = 'screen title-screen';
    el.innerHTML = `
      <div class="title-bg-particles">${this._particles(20)}</div>
      <div class="title-logo" id="title-logo">
        <div class="title-main">小小英雄<br>冒險王國</div>
        <div class="title-sub">邊玩邊學的冒險之旅</div>
      </div>
      <div class="title-actions">
        <button class="btn btn-gold" id="btn-start">開始冒險</button>
        <button class="btn btn-secondary" id="btn-exam">考前練習區</button>
      </div>
      ${totalStars > 0 ? `<div class="title-stars-info">⭐ 已收集 ${totalStars} 顆星星</div>` : ''}
      <button class="title-settings-btn ${devMode ? '' : 'hidden'}" id="btn-settings" aria-label="設定">⚙</button>
      <div class="title-dev-toast" id="title-dev-toast" aria-live="polite"></div>
    `;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('active'));

    el.querySelector('#btn-start').addEventListener('click', () => {
      this.app.audioManager.playRandomBGM();
      this.app.screenManager.switchTo('textbook-select');
    });

    el.querySelector('#btn-settings').addEventListener('click', () => {
      this.app.screenManager.switchTo('settings');
    });

    el.querySelector('#btn-exam').addEventListener('click', () => {
      this.app.audioManager.playRandomBGM();
      this.app.screenManager.switchTo('exam-practice');
    });

    this._installSecretGesture(el);
  }

  _installSecretGesture(el) {
    const logo = el.querySelector('#title-logo');
    const gearBtn = el.querySelector('#btn-settings');
    const toast = el.querySelector('#title-dev-toast');
    let count = 0;
    let resetTimer = null;

    const showToast = (msg) => {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 1600);
    };

    logo.addEventListener('click', () => {
      count += 1;
      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { count = 0; }, TAP_WINDOW_MS);

      if (count >= TAP_THRESHOLD) {
        count = 0;
        clearTimeout(resetTimer);
        const next = !this.app.settings.get('developerMode');
        this.app.settings.set('developerMode', next);
        gearBtn.classList.toggle('hidden', !next);
        showToast(next ? '校對模式：已開啟' : '校對模式：已關閉');
      }
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
