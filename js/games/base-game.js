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
  }

  init() {}
  start() { this.startTime = Date.now(); }
  pause() {}
  resume() {}

  destroy() {
    this._destroyed = true;
    this.container.innerHTML = '';
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
