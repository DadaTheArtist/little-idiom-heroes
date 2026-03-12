import { BaseGame } from './base-game.js';

const GRID_SIZE = 4;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
const TIME_LIMIT = 90;

export default class Match3 extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.currentQIdx = 0;
    this.grid = [];
    this.isProcessing = false;
    this.timeLeft = TIME_LIMIT;
    this.timerInterval = null;
  }

  init() {
    this.container.innerHTML = `
      <div class="match3-game" id="match3-root">
        <div class="match3-header">
          <button class="back-btn" id="m3-back" style="position:static;">←</button>
          <div class="match3-info">
            <div>答對 <span id="m3-correct">0</span>/${this.totalQuestions}</div>
            <div>⏱ <span id="m3-time">${TIME_LIMIT}</span>秒</div>
          </div>
        </div>
        <div class="match3-question-bar" id="m3-question">準備中…</div>
        <div class="match3-grid-wrapper">
          <div class="match3-grid" id="m3-grid" style="grid-template-columns:repeat(${GRID_SIZE},1fr);"></div>
        </div>
        <div class="match3-timer-bar"><div class="match3-timer-fill" id="m3-timer-fill"></div></div>
      </div>
    `;

    this.gridEl = this.container.querySelector('#m3-grid');
    this.questionEl = this.container.querySelector('#m3-question');
    this.correctEl = this.container.querySelector('#m3-correct');
    this.timeEl = this.container.querySelector('#m3-time');
    this.timerFill = this.container.querySelector('#m3-timer-fill');

    this.container.querySelector('#m3-back').addEventListener('click', () => {
      this._stopTimer();
      this.destroy();
      this._onCompleteCb?.({
        correctCount: this.correctCount,
        totalQuestions: this.totalQuestions,
        timeSpent: (Date.now() - this.startTime) / 1000,
        stars: 0
      });
    });
  }

  start() {
    super.start();
    this._buildGrid();
    this._loadQuestion();
    this._startTimer();
  }

  destroy() {
    this._destroyed = true;
    this._stopTimer();
    this.container.innerHTML = '';
  }

  _buildGrid() {
    this.grid = [];
    const currentQ = this.questions[this.currentQIdx];
    const allAnswers = this.allQuestions.map(q => q.answer);
    const unique = [...new Set(allAnswers)];

    for (let i = 0; i < TOTAL_CELLS; i++) {
      const ans = (i === 0) ? currentQ.answer : unique[Math.floor(Math.random() * unique.length)];
      this.grid.push(ans);
    }
    this.grid = this._shuffleArray(this.grid);

    if (!this.grid.includes(currentQ.answer)) {
      this.grid[Math.floor(Math.random() * TOTAL_CELLS)] = currentQ.answer;
    }

    this._renderGrid();
  }

  _renderGrid() {
    this.gridEl.innerHTML = this.grid.map((val, i) =>
      `<div class="match3-tile" data-idx="${i}">${val}</div>`
    ).join('');

    this.gridEl.querySelectorAll('.match3-tile').forEach(tile => {
      tile.addEventListener('click', () => this._handleTileClick(tile));
    });
  }

  _loadQuestion() {
    if (this._destroyed || this.currentQIdx >= this.questions.length) return;
    const q = this.questions[this.currentQIdx];
    this.questionEl.textContent = q.hint || q.stem;
    this._ensureAnswerInGrid(q.answer);
  }

  _ensureAnswerInGrid(answer) {
    if (this.grid.includes(answer)) return;
    const idx = Math.floor(Math.random() * TOTAL_CELLS);
    this.grid[idx] = answer;
    const tile = this.gridEl.children[idx];
    if (tile) {
      tile.textContent = answer;
      tile.classList.add('falling');
      setTimeout(() => tile.classList.remove('falling'), 350);
    }
  }

  _handleTileClick(tile) {
    if (this.isProcessing || this._destroyed) return;
    const idx = parseInt(tile.dataset.idx);
    const q = this.questions[this.currentQIdx];

    if (this.grid[idx] === q.answer) {
      this.isProcessing = true;
      this.correctCount++;
      this.correctEl.textContent = this.correctCount;
      tile.classList.add('correct');

      setTimeout(() => {
        this._replaceTile(idx);
        this.currentQIdx++;

        if (this.currentQIdx >= this.questions.length) {
          this._stopTimer();
          this._finish();
        } else {
          this._loadQuestion();
          this.isProcessing = false;
        }
      }, 500);
    } else {
      tile.classList.add('wrong');
      setTimeout(() => tile.classList.remove('wrong'), 400);
    }
  }

  _replaceTile(idx) {
    const allAnswers = this.allQuestions.map(q => q.answer);
    this.grid[idx] = allAnswers[Math.floor(Math.random() * allAnswers.length)];
    const tile = this.gridEl.children[idx];
    if (tile) {
      tile.textContent = this.grid[idx];
      tile.className = 'match3-tile falling';
      tile.dataset.idx = idx;
      setTimeout(() => tile.classList.remove('falling'), 350);
      tile.addEventListener('click', () => this._handleTileClick(tile));
    }
  }

  _startTimer() {
    this.timerFill.style.width = '100%';
    this.timerInterval = setInterval(() => {
      if (this._destroyed) return;
      this.timeLeft--;
      this.timeEl.textContent = this.timeLeft;
      this.timerFill.style.width = `${(this.timeLeft / TIME_LIMIT) * 100}%`;

      if (this.timeLeft <= 0) {
        this._stopTimer();
        this._finish();
      }
    }, 1000);
  }

  _stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
