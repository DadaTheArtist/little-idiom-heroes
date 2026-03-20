export class BaseGame {
  constructor(container, questions, config = {}) {
    this.container = container;
    this.questions = questions;
    this.config = config;
    this.allQuestions = config.allQuestions || questions;
    this.startTime = 0;
    this.correctCount = 0;
    this.totalQuestions = questions.length;
    this._onCompleteCb = null;
    this._destroyed = false;

    this._hintsEnabled = config.hintsEnabled !== false;
    this._hintsRemaining = 3;
    this._hintModalEl = null;
  }

  init() {}
  start() { this.startTime = Date.now(); }
  pause() {}
  resume() {}

  destroy() {
    this._destroyed = true;
    this.container.innerHTML = '';
  }

  _getCurrentQuestion() {
    return null;
  }

  _createHintButton() {
    if (!this._hintsEnabled) return '';
    return `<button class="hint-bulb-btn" id="hint-bulb" aria-label="提示">💡<span class="hint-bulb-count">${this._hintsRemaining}</span></button>`;
  }

  _bindHintButton() {
    if (!this._hintsEnabled) return;
    const btn = this.container.querySelector('#hint-bulb');
    if (!btn) return;
    btn.addEventListener('click', () => this._showHint());
  }

  _updateHintButton() {
    const btn = this.container.querySelector('#hint-bulb');
    if (!btn) return;
    const countEl = btn.querySelector('.hint-bulb-count');
    if (countEl) countEl.textContent = this._hintsRemaining;
    if (this._hintsRemaining <= 0) btn.classList.add('exhausted');
  }

  _showHint() {
    if (this._destroyed) return;
    if (this._hintModalEl) return;

    if (this._hintsRemaining <= 0) {
      this._showHintModal('本關提示已用完');
      return;
    }

    const q = this._getCurrentQuestion();
    const text = q?.playerHint || '仔細看看題目的關鍵字吧！';
    this._hintsRemaining--;
    this._updateHintButton();
    this._showHintModal(text);
  }

  _showHintModal(text) {
    const overlay = document.createElement('div');
    overlay.className = 'hint-modal-overlay';
    overlay.innerHTML = `
      <div class="hint-modal">
        <button class="hint-modal-close" aria-label="關閉">✕</button>
        <div class="hint-modal-icon">💡</div>
        <div class="hint-modal-text">${text}</div>
      </div>
    `;
    this.container.appendChild(overlay);
    this._hintModalEl = overlay;

    const close = () => {
      overlay.remove();
      this._hintModalEl = null;
    };
    overlay.querySelector('.hint-modal-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }

  onComplete(cb) {
    this._onCompleteCb = cb;
  }

  _finish() {
    if (this._destroyed) return;
    const timeSpent = (Date.now() - this.startTime) / 1000;
    const ratio = this.correctCount / this.totalQuestions;
    let stars = 0;
    if (ratio >= 0.9) stars = 3;
    else if (ratio >= 0.7) stars = 2;
    else if (ratio >= 0.4) stars = 1;

    const results = {
      correctCount: this.correctCount,
      totalQuestions: this.totalQuestions,
      timeSpent,
      stars
    };

    if (this._onCompleteCb) this._onCompleteCb(results);
  }

  _shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  _getDistractors(correctAnswer, count = 2) {
    return this.allQuestions
      .filter(q => q.answer !== correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map(q => q.answer);
  }
}
