export class GameTestScreen {
  constructor(app) {
    this.app = app;
  }

  async enter(container) {
    const games = this.app.gameRegistry.all();
    const el = document.createElement('div');
    el.className = 'screen game-test-screen';
    el.innerHTML = `
      <div class="game-test-panel">
        <button class="back-btn" id="game-test-back">←</button>
        <h2 class="game-test-title">遊戲測試區</h2>
        <div class="game-test-list">
          ${games.map((game) => this._renderGameRow(game)).join('')}
        </div>
        <div class="game-test-error" id="game-test-error"></div>
      </div>
    `;

    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('active'));

    el.querySelector('#game-test-back').addEventListener('click', () => {
      this.app.screenManager.switchTo('settings');
    });

    el.querySelectorAll('.game-test-start').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const errorEl = el.querySelector('#game-test-error');
        errorEl.textContent = '';
        btn.disabled = true;
        try {
          await this.app.startGameTest(btn.dataset.gameId);
        } catch (error) {
          btn.disabled = false;
          errorEl.textContent = error?.message || '無法啟動遊戲測試';
        }
      });
    });
  }

  _renderGameRow(game) {
    const types = game.supportsQuestionTypes.join(' / ');
    const modes = game.supportsAnswerModes.join(' / ');
    return `
      <div class="game-test-row">
        <div class="game-test-icon">${game.icon || '🎮'}</div>
        <div class="game-test-meta">
          <div class="game-test-name">${game.displayName}</div>
          <div class="game-test-desc">${game.description}</div>
          <div class="game-test-tags">
            <span>${types}</span>
            <span>${modes}</span>
          </div>
        </div>
        <button class="btn btn-gold game-test-start" data-game-id="${game.gameId}">開始測試</button>
      </div>
    `;
  }

  async exit() {}
}
