import { BaseGame } from './base-game.js';

const MAX_HEALTH = 3;
const CORRECT_DELAY = 900;
const WRONG_DELAY = 1500;
const FEEDBACK_DURATION = 1100;

export default class ShieldDefense extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.currentIdx = 0;
    this.health = MAX_HEALTH;
    this.isProcessing = false;
    this.feedbackTimer = null;
    this.resolveTimer = null;
  }

  init() {
    this.container.innerHTML = `
      <div class="shield-game">
        <div class="shield-hud">
          <button class="back-btn" id="shield-back" style="position:static;">←</button>
          <div class="shield-hud-info">
            <span>題目 <strong id="shield-progress">1/${this.totalQuestions}</strong></span>
            <span>得分 <strong id="shield-score">0</strong></span>
          </div>
          <div class="shield-health" id="shield-health"></div>
          ${this._createHintButton()}
        </div>
        <div class="shield-question" id="shield-question">準備防禦！</div>
        <div class="shield-battlefield">
          <div class="shield-lanes" id="shield-lanes"></div>
          <div class="shield-castle">
            <div class="shield-castle-icon">🏰</div>
            <div class="shield-barrier" id="shield-barrier">🛡️</div>
          </div>
        </div>
        <div class="shield-feedback" id="shield-feedback"></div>
      </div>
    `;

    this.questionEl = this.container.querySelector('#shield-question');
    this.progressEl = this.container.querySelector('#shield-progress');
    this.scoreEl = this.container.querySelector('#shield-score');
    this.healthEl = this.container.querySelector('#shield-health');
    this.lanesEl = this.container.querySelector('#shield-lanes');
    this.feedbackEl = this.container.querySelector('#shield-feedback');
    this.barrierEl = this.container.querySelector('#shield-barrier');

    this.container.querySelector('#shield-back').addEventListener('click', () => this._handleBack());
    this._bindHintButton();
    this._renderHealth();
  }

  _getCurrentQuestion() {
    return this.questions[this.currentIdx] || null;
  }

  start() {
    super.start();
    this._loadQuestion();
  }

  destroy() {
    clearTimeout(this.feedbackTimer);
    clearTimeout(this.resolveTimer);
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
    if (this.currentIdx >= this.totalQuestions || this.health <= 0) {
      this._finish();
      return;
    }

    const q = this._getCurrentQuestion();
    this.isProcessing = false;
    this.progressEl.textContent = `${this.currentIdx + 1}/${this.totalQuestions}`;
    this.scoreEl.textContent = this.correctCount;
    this.questionEl.textContent = q?.hint || q?.stem || q?.prompt || '選出正確答案';
    this._showFeedback('');
    this._renderLanes(q);
  }

  _renderLanes(q) {
    this.lanesEl.innerHTML = '';
    this._buildOptions(q).forEach((answer, idx) => {
      const lane = document.createElement('button');
      lane.className = 'shield-lane';
      lane.type = 'button';
      lane.dataset.answer = answer;
      lane.style.setProperty('--lane-delay', `${idx * 0.12}s`);

      const enemy = document.createElement('span');
      enemy.className = 'shield-enemy';
      enemy.textContent = '⚔️';
      const label = document.createElement('span');
      label.className = 'shield-answer';
      label.textContent = answer;
      lane.append(enemy, label);
      lane.addEventListener('click', () => this._submitAnswer(answer));
      this.lanesEl.appendChild(lane);
    });
  }

  _submitAnswer(answer) {
    if (this.isProcessing || this._destroyed) return;
    const q = this._getCurrentQuestion();
    if (!q) return;

    this.isProcessing = true;
    const isCorrect = String(answer) === String(q.answer);
    this.lanesEl.querySelectorAll('.shield-lane').forEach((lane) => {
      lane.disabled = true;
      if (String(lane.dataset.answer) === String(q.answer)) lane.classList.add('correct');
      if (!isCorrect && String(lane.dataset.answer) === String(answer)) lane.classList.add('wrong');
    });

    if (isCorrect) {
      this.correctCount++;
      this.scoreEl.textContent = this.correctCount;
      this.barrierEl.classList.add('active');
      this._showFeedback('盾牌成功防禦！');
    } else {
      this.health = Math.max(0, this.health - 1);
      this._recordWrong(q, answer);
      this._renderHealth();
      this.barrierEl.classList.add('hit');
      this._showFeedback('城堡受傷了！');
    }

    this.currentIdx++;
    this._advanceAfter(isCorrect ? CORRECT_DELAY : WRONG_DELAY);
  }

  _advanceAfter(delay) {
    clearTimeout(this.resolveTimer);
    this.resolveTimer = setTimeout(() => {
      if (this._destroyed) return;
      this.barrierEl.classList.remove('active', 'hit');
      if (this.currentIdx >= this.totalQuestions || this.health <= 0) {
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

  _renderHealth() {
    this.healthEl.innerHTML = Array.from({ length: MAX_HEALTH }, (_, i) =>
      `<span class="shield-heart${i >= this.health ? ' empty' : ''}">❤</span>`
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
