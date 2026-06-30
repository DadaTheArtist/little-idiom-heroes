import { BaseGame } from './base-game.js';

const MAX_LIVES = 3;

export default class MazeRunner extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.currentIdx = 0;
    this.lives = MAX_LIVES;
  }

  init() {
    this.container.innerHTML = `
      <div class="maze-game" id="maze-root">
        <div class="maze-hud">
          <button class="back-btn" id="maze-back" style="position:static;">←</button>
          <div class="maze-hud-info">
            <span>題目 <strong id="maze-progress">1/${this.totalQuestions}</strong></span>
            <span>得分 <strong id="maze-score">0</strong></span>
          </div>
          <div class="maze-lives" id="maze-lives"></div>
          ${this._createHintButton()}
        </div>

        <div class="maze-question-panel">
          <div class="maze-question" id="maze-question">準備進入迷宮！</div>
        </div>

        <div class="maze-board" id="maze-board">
          <div class="maze-loading">迷宮準備中…</div>
        </div>

        <div class="maze-controls" aria-label="方向控制">
          <button class="maze-control maze-control-up" aria-label="向上">▲</button>
          <button class="maze-control maze-control-left" aria-label="向左">◀</button>
          <button class="maze-control maze-control-right" aria-label="向右">▶</button>
          <button class="maze-control maze-control-down" aria-label="向下">▼</button>
        </div>

        <div class="maze-feedback" id="maze-feedback"></div>
      </div>
    `;

    this.questionEl = this.container.querySelector('#maze-question');
    this.progressEl = this.container.querySelector('#maze-progress');
    this.scoreEl = this.container.querySelector('#maze-score');
    this.livesEl = this.container.querySelector('#maze-lives');
    this.feedbackEl = this.container.querySelector('#maze-feedback');

    this.container.querySelector('#maze-back').addEventListener('click', () => {
      this.destroy();
      this._onCompleteCb?.({
        correctCount: this.correctCount,
        totalQuestions: this.totalQuestions,
        timeSpent: (Date.now() - this.startTime) / 1000,
        stars: 0,
        wrongAnswers: [...this._wrongAnswers]
      });
    });

    this._bindHintButton();
    this._renderLives();
  }

  _getCurrentQuestion() {
    return this.questions[this.currentIdx] || null;
  }

  start() {
    super.start();
    this._loadQuestion();
  }

  _loadQuestion() {
    if (this._destroyed) return;

    const q = this._getCurrentQuestion();
    this.questionEl.textContent = q?.hint || q?.stem || q?.prompt || '準備進入迷宮！';
    this.progressEl.textContent = `${Math.min(this.currentIdx + 1, this.totalQuestions)}/${this.totalQuestions}`;
    this.scoreEl.textContent = this.correctCount;
    this.feedbackEl.textContent = '';
  }

  _renderLives() {
    if (!this.livesEl) return;
    this.livesEl.innerHTML = Array.from({ length: MAX_LIVES }, (_, i) =>
      `<span class="maze-heart${i >= this.lives ? ' empty' : ''}">❤</span>`
    ).join('');
  }
}
