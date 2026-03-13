export class LevelIntro {
  constructor(app) {
    this.app = app;
  }

  async enter(container, { challenge, zone }) {
    const previewGame = this.app.peekGameForChallenge(challenge);
    const textbook = this.app.getTextbook(zone.textbookId);
    const challengeModeText = challenge.selectionMode === 'random' ? '隨機挑戰' : '固定挑戰';
    const gameTitle = previewGame?.displayName || '冒險挑戰';
    const gameDesc = previewGame?.description || '準備進入新的勇者試煉。';
    const el = document.createElement('div');
    el.className = 'screen';
    el.style.cssText = `
      background: radial-gradient(ellipse at 50% 40%, var(--bg-light) 0%, var(--bg-dark) 70%);
      justify-content: center; gap: 20px; padding: 30px 20px;
    `;

    el.innerHTML = `
      <button class="back-btn" id="btn-back">←</button>
      <div style="font-size:clamp(50px,14vw,80px);animation:fadeInUp 0.5s ease backwards;">
        ${previewGame?.icon || '🎮'}
      </div>
      <div style="text-align:center;animation:fadeInUp 0.5s ease 0.15s backwards;">
        <h2 style="font-size:clamp(24px,6vw,36px);color:var(--accent-gold);">${challenge.name}</h2>
        <p style="color:var(--text-secondary);margin-top:6px;font-size:clamp(13px,3.2vw,16px);">${zone.name} — ${gameTitle}</p>
      </div>
      <p style="text-align:center;color:var(--text-secondary);font-size:clamp(13px,3.2vw,16px);max-width:320px;line-height:1.6;animation:fadeInUp 0.5s ease 0.3s backwards;">
        ${gameDesc}
      </p>
      <p style="color:rgba(255,255,255,0.4);font-size:clamp(12px,3vw,14px);animation:fadeInUp 0.5s ease 0.4s backwards;">
        ${textbook?.displayName || zone.textbookId} · ${challenge.questionType} · ${challengeModeText}
      </p>
      <p style="color:rgba(255,255,255,0.4);font-size:clamp(12px,3vw,14px);margin-top:-10px;animation:fadeInUp 0.5s ease 0.45s backwards;">
        共 ${challenge.questionCount} 題
      </p>
      <button class="btn btn-gold" id="btn-go" style="animation:fadeInUp 0.5s ease 0.5s backwards;">開始挑戰！</button>
    `;

    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('active'));

    el.querySelector('#btn-back').addEventListener('click', () => {
      this.app.screenManager.switchTo('world-map', {});
    });

    el.querySelector('#btn-go').addEventListener('click', () => {
      this.app.startLevel({ challenge, zone });
    });
  }

  async exit() {}
}
