export class SettingsScreen {
  constructor(app) {
    this.app = app;
  }

  async enter(container) {
    const s = this.app.settings;

    const el = document.createElement('div');
    el.className = 'screen settings-screen';
    el.innerHTML = `
      <div class="settings-panel">
        <button class="back-btn" id="settings-back">←</button>
        <h2 class="settings-title">系統設定</h2>

        <div class="settings-list">
          <label class="settings-row">
            <span class="settings-label">關卡隨機搭配遊戲</span>
            <input type="checkbox" class="settings-toggle" id="set-random" ${s.get('randomGameSelection') ? 'checked' : ''}>
          </label>

          <label class="settings-row">
            <span class="settings-label">提供提示（燈泡）</span>
            <input type="checkbox" class="settings-toggle" id="set-hints" ${s.get('hintsEnabled') ? 'checked' : ''}>
          </label>

          <label class="settings-row">
            <span class="settings-label">開啟計時功能</span>
            <input type="checkbox" class="settings-toggle" id="set-timer" ${s.get('timerEnabled') ? 'checked' : ''}>
          </label>

          <div class="settings-row">
            <span class="settings-label">每區題目數量</span>
            <div class="settings-count-control">
              <button class="settings-count-btn" id="set-q-minus">−</button>
              <span class="settings-count-value" id="set-q-val">${s.get('questionCountOverride') ?? '預設'}</span>
              <button class="settings-count-btn" id="set-q-plus">+</button>
            </div>
          </div>
        </div>

        <button class="btn btn-secondary settings-reset-btn" id="set-reset">還原預設</button>
      </div>
    `;

    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('active'));

    el.querySelector('#settings-back').addEventListener('click', () => {
      this.app.screenManager.switchTo('title');
    });

    el.querySelector('#set-random').addEventListener('change', (e) => {
      s.set('randomGameSelection', e.target.checked);
    });

    el.querySelector('#set-hints').addEventListener('change', (e) => {
      s.set('hintsEnabled', e.target.checked);
    });

    el.querySelector('#set-timer').addEventListener('change', (e) => {
      s.set('timerEnabled', e.target.checked);
    });

    const qValEl = el.querySelector('#set-q-val');
    const updateQDisplay = () => {
      const v = s.get('questionCountOverride');
      qValEl.textContent = v ?? '預設';
    };

    el.querySelector('#set-q-minus').addEventListener('click', () => {
      const cur = s.get('questionCountOverride');
      if (cur === null || cur === undefined) {
        s.set('questionCountOverride', 10);
      } else if (cur > 3) {
        s.set('questionCountOverride', cur - 1);
      }
      updateQDisplay();
    });

    el.querySelector('#set-q-plus').addEventListener('click', () => {
      const cur = s.get('questionCountOverride');
      if (cur === null || cur === undefined) {
        s.set('questionCountOverride', 10);
      } else if (cur < 20) {
        s.set('questionCountOverride', cur + 1);
      }
      updateQDisplay();
    });

    el.querySelector('#set-reset').addEventListener('click', () => {
      s.reset();
      el.querySelector('#set-random').checked = s.get('randomGameSelection');
      el.querySelector('#set-hints').checked = s.get('hintsEnabled');
      el.querySelector('#set-timer').checked = s.get('timerEnabled');
      updateQDisplay();
    });
  }

  async exit() {}
}
