const GAME_ICONS = {
  'boss-fight': '⚔️',
  'racing': '🏎️',
  'match3': '💎',
  'connect': '🃏'
};

const GAME_NAMES = {
  'boss-fight': '魔王戰',
  'racing': '賽車問答',
  'match3': '寶石消除',
  'connect': '記憶配對'
};

const GAME_DESC = {
  'boss-fight': '拖動寶劍攻擊魔王！答對扣血，答錯魔王回血！',
  'racing': '答對題目讓賽車衝刺！搶先到達終點吧！',
  'match3': '在寶石陣中找到正確答案並消除它！',
  'connect': '翻開卡片，找到題目與答案的配對！'
};

export class LevelIntro {
  constructor(app) {
    this.app = app;
  }

  async enter(container, { level, world }) {
    const el = document.createElement('div');
    el.className = 'screen';
    el.style.cssText = `
      background: radial-gradient(ellipse at 50% 40%, var(--bg-light) 0%, var(--bg-dark) 70%);
      justify-content: center; gap: 20px; padding: 30px 20px;
    `;

    el.innerHTML = `
      <button class="back-btn" id="btn-back">←</button>
      <div style="font-size:clamp(50px,14vw,80px);animation:fadeInUp 0.5s ease backwards;">
        ${GAME_ICONS[level.game] || '🎮'}
      </div>
      <div style="text-align:center;animation:fadeInUp 0.5s ease 0.15s backwards;">
        <h2 style="font-size:clamp(24px,6vw,36px);color:var(--accent-gold);">${level.name}</h2>
        <p style="color:var(--text-secondary);margin-top:6px;font-size:clamp(13px,3.2vw,16px);">${world.name} — ${GAME_NAMES[level.game]}</p>
      </div>
      <p style="text-align:center;color:var(--text-secondary);font-size:clamp(13px,3.2vw,16px);max-width:320px;line-height:1.6;animation:fadeInUp 0.5s ease 0.3s backwards;">
        ${GAME_DESC[level.game]}
      </p>
      <p style="color:rgba(255,255,255,0.4);font-size:clamp(12px,3vw,14px);animation:fadeInUp 0.5s ease 0.4s backwards;">
        共 ${level.questionCount} 題
      </p>
      <button class="btn btn-gold" id="btn-go" style="animation:fadeInUp 0.5s ease 0.5s backwards;">開始挑戰！</button>
    `;

    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('active'));

    el.querySelector('#btn-back').addEventListener('click', () => {
      this.app.screenManager.switchTo('world-map', {});
    });

    el.querySelector('#btn-go').addEventListener('click', () => {
      this.app.startLevel(level);
    });
  }

  async exit() {}
}
