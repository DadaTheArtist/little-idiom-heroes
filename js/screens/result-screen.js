export class ResultScreen {
  constructor(app) {
    this.app = app;
  }

  async enter(container, { results, levelConfig }) {
    const won = results.stars > 0;
    const isExamPractice = !!levelConfig.isExamPractice;
    const nextChallenge = (!isExamPractice && won) ? this._findNextChallenge(levelConfig) : null;
    const el = document.createElement('div');
    el.className = `screen result-screen ${won ? 'win' : 'lose'}`;

    let actionsHTML;
    if (isExamPractice) {
      actionsHTML = `
        <button class="btn btn-gold" id="btn-retry">再練一次</button>
        <button class="btn btn-secondary" id="btn-map">回到練習區</button>
      `;
    } else if (won) {
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

    const showReview = this.app.settings.get('showWrongAnswerReview');
    const wrongAnswers = Array.isArray(results.wrongAnswers) ? results.wrongAnswers : [];
    const reviewHTML = (showReview && wrongAnswers.length > 0)
      ? this._renderReview(wrongAnswers)
      : '';

    el.innerHTML = `
      <div class="result-scroll">
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
        ${reviewHTML}
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
        if (isExamPractice) {
          this.app.startExamPractice(levelConfig.challenge);
        } else {
          this.app.startLevel(levelConfig);
        }
      });
    }

    el.querySelector('#btn-map').addEventListener('click', () => {
      if (isExamPractice) {
        this.app.screenManager.switchTo('exam-practice');
      } else {
        const textbookId = levelConfig?.zone?.textbookId || null;
        this.app.screenManager.switchTo('world-map', textbookId ? { textbookId } : {});
      }
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

  _renderReview(wrongAnswers) {
    const safe = (s) => (s == null ? '' : String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])));
    return `
      <div class="result-review">
        <div class="result-review-title">📝 錯題檢討（${wrongAnswers.length} 題）</div>
        <div class="result-review-list">
          ${wrongAnswers.map((w) => `
            <div class="result-review-item">
              <div class="result-review-stem">${safe(w.stem || w.hint || '')}</div>
              <div class="result-review-row">
                <span class="result-review-label">正解</span>
                <span class="result-review-answer">${safe(w.answer)}</span>
              </div>
              ${w.picked ? `
                <div class="result-review-row">
                  <span class="result-review-label">你選</span>
                  <span class="result-review-picked">${safe(w.picked)}</span>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  async exit() {}
}
