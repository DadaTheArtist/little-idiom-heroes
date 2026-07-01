import { BaseGame } from './base-game.js';

const MAX_LIVES = 3;
const CORRECT_DELAY = 950;
const WRONG_DELAY = 1350;
const FEEDBACK_DURATION = 1100;

export default class SorterBelt extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.currentIdx = 0;
    this.lives = MAX_LIVES;
    this.isProcessing = false;
    this.resolveTimer = null;
    this.feedbackTimer = null;
  }

  init() {
    this.container.innerHTML = `
      <div class="sorter-game">
        <div class="sorter-hud">
          <button class="back-btn" id="sorter-back" style="position:static;">←</button>
          <div class="sorter-info">
            <span>題目 <strong id="sorter-progress">1/${this.totalQuestions}</strong></span>
            <span>答對 <strong id="sorter-score">0</strong></span>
          </div>
          <div class="sorter-lives" id="sorter-lives"></div>
          ${this._createHintButton()}
        </div>

        <div class="sorter-stage">
          <div class="sorter-prompt-board" id="sorter-prompt">準備分類！</div>
          <div class="sorter-belt">
            <div class="sorter-belt-line"></div>
            <div class="sorter-card" id="sorter-card">
              <span class="sorter-card-icon">📦</span>
              <span class="sorter-card-text" id="sorter-card-text"></span>
            </div>
          </div>
          <div class="sorter-bins" id="sorter-bins"></div>
        </div>

        <div class="sorter-feedback" id="sorter-feedback"></div>
      </div>
    `;

    this.progressEl = this.container.querySelector('#sorter-progress');
    this.scoreEl = this.container.querySelector('#sorter-score');
    this.livesEl = this.container.querySelector('#sorter-lives');
    this.promptEl = this.container.querySelector('#sorter-prompt');
    this.cardEl = this.container.querySelector('#sorter-card');
    this.cardTextEl = this.container.querySelector('#sorter-card-text');
    this.binsEl = this.container.querySelector('#sorter-bins');
    this.feedbackEl = this.container.querySelector('#sorter-feedback');

    this.container.querySelector('#sorter-back').addEventListener('click', () => this._handleBack());
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

  destroy() {
    clearTimeout(this.resolveTimer);
    clearTimeout(this.feedbackTimer);
    super.destroy();
  }

  _handleBack() {
    this.destroy();
    this._onCompleteCb?.({
      correctCount: this.correctCount,
      totalQuestions: this.totalQuestions,
      timeSpent: (Date.now() - this.startTime) / 1000,
      stars: 0,
      wrongAnswers: [...this._wrongAnswers]
    });
  }

  _loadQuestion() {
    if (this._destroyed) return;
    if (this.currentIdx >= this.totalQuestions || this.lives <= 0) {
      this._finish();
      return;
    }

    const q = this._getCurrentQuestion();
    this.isProcessing = false;
    this.progressEl.textContent = `${this.currentIdx + 1}/${this.totalQuestions}`;
    this.scoreEl.textContent = this.correctCount;
    this.promptEl.textContent = q?.hint || q?.stem || q?.prompt || '把題目送進正確答案箱';
    this.cardTextEl.textContent = q?.stem || q?.prompt || q?.hint || '請分類';
    this.cardEl.classList.remove('correct', 'wrong', 'moving');
    this._showFeedback('');
    this._renderBins(q);
  }

  _renderBins(q) {
    this.binsEl.innerHTML = '';
    this._buildOptions(q).forEach((answer, idx) => {
      const bin = document.createElement('button');
      bin.className = 'sorter-bin';
      bin.type = 'button';
      bin.dataset.answer = answer;
      bin.style.setProperty('--bin-hue', `${48 + idx * 48}`);
      bin.innerHTML = `
        <span class="sorter-bin-lid"></span>
        <span class="sorter-bin-label"></span>
      `;
      bin.querySelector('.sorter-bin-label').textContent = answer;
      bin.addEventListener('click', () => this._submitAnswer(answer));
      this.binsEl.appendChild(bin);
    });
  }

  _submitAnswer(answer) {
    if (this.isProcessing || this._destroyed) return;
    const q = this._getCurrentQuestion();
    if (!q) return;

    this.isProcessing = true;
    const isCorrect = String(answer) === String(q.answer);
    this.binsEl.querySelectorAll('.sorter-bin').forEach((bin) => {
      bin.disabled = true;
      if (String(bin.dataset.answer) === String(q.answer)) bin.classList.add('correct');
      if (!isCorrect && String(bin.dataset.answer) === String(answer)) bin.classList.add('wrong');
    });

    this.cardEl.classList.add(isCorrect ? 'correct' : 'wrong', 'moving');

    if (isCorrect) {
      this.correctCount++;
      this.scoreEl.textContent = this.correctCount;
      this._showFeedback('分類成功！');
    } else {
      this.lives = Math.max(0, this.lives - 1);
      this._recordWrong(q, answer);
      this._renderLives();
      this._showFeedback('送錯箱了！');
    }

    this.currentIdx++;
    this._advanceAfter(isCorrect ? CORRECT_DELAY : WRONG_DELAY);
  }

  _advanceAfter(delay) {
    clearTimeout(this.resolveTimer);
    this.resolveTimer = setTimeout(() => {
      if (this._destroyed) return;
      if (this.currentIdx >= this.totalQuestions || this.lives <= 0) {
        this._finish();
        return;
      }
      this._loadQuestion();
    }, delay);
  }

  _buildOptions(q) {
    if (!q) return [];
    const baseOptions = Array.isArray(q.options) && q.options.length
      ? [...q.options]
      : [q.answer, ...this._getDistractors(q.answer, 3)];
    const options = [];
    for (const opt of baseOptions) {
      if (opt == null || options.includes(opt)) continue;
      options.push(opt);
    }
    if (q.answer != null && !options.includes(q.answer)) options.unshift(q.answer);
    return this._shuffleArray(options).slice(0, 4);
  }

  _renderLives() {
    this.livesEl.innerHTML = Array.from({ length: MAX_LIVES }, (_, i) =>
      `<span class="sorter-life${i >= this.lives ? ' empty' : ''}">●</span>`
    ).join('');
  }

  _showFeedback(text) {
    clearTimeout(this.feedbackTimer);
    this.feedbackEl.textContent = text;
    if (!text) return;
    this.feedbackTimer = setTimeout(() => {
      if (!this._destroyed && this.feedbackEl.textContent === text) {
        this.feedbackEl.textContent = '';
      }
    }, FEEDBACK_DURATION);
  }
}
