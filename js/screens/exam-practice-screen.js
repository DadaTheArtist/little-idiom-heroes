export class ExamPracticeScreen {
  constructor(app) {
    this.app = app;
  }

  async enter(container) {
    const examPractice = this.app.worldConfig.examPractice;
    const challenges = examPractice?.challenges || [];

    const el = document.createElement('div');
    el.className = 'screen exam-practice-screen';
    el.innerHTML = `
      <div class="ep-header">
        <button class="back-btn" id="ep-back">←</button>
        <h2 class="ep-title">考前練習區</h2>
      </div>
      <div class="ep-subtitle">所有關卡隨時可練，不影響冒險進度</div>
      <div class="ep-challenge-list">
        ${challenges.map((ch, i) => `
          <button class="ep-card" data-idx="${i}">
            <div class="ep-card-icon">${ch.icon || '📝'}</div>
            <div class="ep-card-body">
              <div class="ep-card-name">${ch.name}</div>
              <div class="ep-card-desc">${ch.description}</div>
              <div class="ep-card-count" id="ep-count-${i}">載入中…</div>
            </div>
            <div class="ep-card-arrow">→</div>
          </button>
        `).join('')}
      </div>
    `;

    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('active'));

    el.querySelector('#ep-back').addEventListener('click', () => {
      this.app.screenManager.switchTo('title');
    });

    challenges.forEach((ch, i) => {
      el.querySelector(`.ep-card[data-idx="${i}"]`).addEventListener('click', () => {
        this.app.startExamPractice(ch);
      });
    });

    this._loadCounts(el, challenges);
  }

  async _loadCounts(el, challenges) {
    for (const [i, ch] of challenges.entries()) {
      try {
        const content = await this.app.contentLoader.load(ch.content);
        const count = content.questions.filter(q =>
          (q.type || 'choice') === ch.questionType
        ).length;
        const countEl = el.querySelector(`#ep-count-${i}`);
        if (countEl) {
          const used = Math.min(count, ch.questionCount);
          countEl.textContent = `題庫共 ${count} 題，每次出 ${used} 題`;
        }
      } catch {
        const countEl = el.querySelector(`#ep-count-${i}`);
        if (countEl) countEl.textContent = '無法載入題庫';
      }
    }
  }

  async exit() {}
}
