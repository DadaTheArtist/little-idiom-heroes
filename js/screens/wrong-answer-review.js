export class WrongAnswerReview {
  constructor(app) {
    this.app = app;
    this._lastData = null;
  }

  async enter(container, data = {}) {
    this._lastData = data;
    const wrongAnswers = Array.isArray(data.wrongAnswers) ? data.wrongAnswers : [];
    const levelConfig = data.levelConfig || null;
    const challengeName = levelConfig?.challenge?.name || '本關';

    const el = document.createElement('div');
    el.className = 'screen war-screen';
    el.innerHTML = `
      <button class="back-btn" id="war-back" aria-label="返回">←</button>
      <div class="war-header">
        <h1>📝 錯題檢討</h1>
        <p>${challengeName}・共 ${wrongAnswers.length} 題</p>
      </div>
      <div class="war-list">
        ${wrongAnswers.length === 0
          ? '<div class="war-empty">沒有答錯的題目，太棒了！</div>'
          : wrongAnswers.map((w, i) => this._renderItem(w, i + 1)).join('')}
      </div>
    `;

    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('active'));

    el.querySelector('#war-back').addEventListener('click', () => {
      this._goBack();
    });
  }

  _goBack() {
    const data = this._lastData || {};
    if (data.results && data.levelConfig) {
      this.app.screenManager.switchTo('result', {
        results: data.results,
        levelConfig: data.levelConfig
      });
      return;
    }
    this.app.screenManager.switchTo('title');
  }

  _renderItem(w, idx) {
    const safe = (s) => (s == null ? '' : String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])));
    const question = w.hint || w.stem || '';
    const meaning = (w.hint && w.stem && w.hint !== w.stem) ? w.stem : '';

    return `
      <div class="war-item">
        <div class="war-item-head">
          <span class="war-item-idx">第 ${idx} 題</span>
        </div>
        <div class="war-item-row">
          <span class="war-item-label">題目</span>
          <span class="war-item-question">${safe(question)}</span>
        </div>
        ${meaning ? `
          <div class="war-item-row">
            <span class="war-item-label">解釋</span>
            <span class="war-item-meaning">${safe(meaning)}</span>
          </div>
        ` : ''}
        <div class="war-item-row">
          <span class="war-item-label">正解</span>
          <span class="war-item-answer">${safe(w.answer)}</span>
        </div>
        ${w.picked ? `
          <div class="war-item-row">
            <span class="war-item-label">你選</span>
            <span class="war-item-picked">${safe(w.picked)}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  async exit() {}
}
