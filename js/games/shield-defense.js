import { BaseGame } from './base-game.js';

const MAX_HEALTH = 3;
const CORRECT_DELAY = 900;
const WRONG_DELAY = 1500;
const FEEDBACK_DURATION = 1100;

export function createGateQueue(totalQuestions, currentIdx, resolutions = []) {
  const total = Math.max(0, Number(totalQuestions) || 0);
  const current = Math.max(0, Number(currentIdx) || 0);

  return Array.from({ length: total }, (_, idx) => {
    const resolved = resolutions[idx];
    let status = 'waiting';
    if (resolved === 'admitted' || resolved === 'rejected') {
      status = resolved;
    } else if (idx < current) {
      status = 'done';
    } else if (idx === current) {
      status = 'current';
    }

    return {
      index: idx,
      number: idx + 1,
      status
    };
  });
}

export function createVisibleGateQueue(totalQuestions, currentIdx, resolutions = []) {
  return createGateQueue(totalQuestions, currentIdx, resolutions)
    .filter((person) => person.index >= currentIdx);
}

export function getGateResolutionClass(isCorrect) {
  return isCorrect ? 'admitted' : 'rejected';
}

export default class ShieldDefense extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.currentIdx = 0;
    this.health = MAX_HEALTH;
    this.isProcessing = false;
    this.feedbackTimer = null;
    this.resolveTimer = null;
    this.queueResolutions = Array.from({ length: this.totalQuestions }, () => null);
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
          <div class="shield-checkpoint">
            <div class="shield-gate">
              <div class="shield-gate-roof">城門</div>
              <div class="shield-gate-arch"></div>
            </div>
            <div class="shield-guard" id="shield-guard">
              <span class="shield-guard-icon">💂</span>
              <span class="shield-guard-label">守衛</span>
            </div>
          </div>
          <div class="shield-queue-area">
            <div class="shield-queue" id="shield-queue"></div>
            <div class="shield-options" id="shield-options"></div>
          </div>
        </div>
        <div class="shield-feedback" id="shield-feedback"></div>
      </div>
    `;

    this.questionEl = this.container.querySelector('#shield-question');
    this.progressEl = this.container.querySelector('#shield-progress');
    this.scoreEl = this.container.querySelector('#shield-score');
    this.healthEl = this.container.querySelector('#shield-health');
    this.queueEl = this.container.querySelector('#shield-queue');
    this.optionsEl = this.container.querySelector('#shield-options');
    this.feedbackEl = this.container.querySelector('#shield-feedback');
    this.guardEl = this.container.querySelector('#shield-guard');

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
    this._renderQueue();
    this._showFeedback('');
    this._renderOptions(q);
  }

  _renderQueue() {
    this.queueEl.innerHTML = '';
    createVisibleGateQueue(this.totalQuestions, this.currentIdx, this.queueResolutions).forEach((person) => {
      const item = document.createElement('div');
      item.className = `shield-person ${person.status}`;
      item.dataset.index = String(person.index);
      item.innerHTML = `
        <span class="shield-person-icon">🧍</span>
        <span class="shield-person-number">${person.number}</span>
      `;
      this.queueEl.appendChild(item);
    });
  }

  _renderOptions(q) {
    this.optionsEl.innerHTML = '';
    this._buildOptions(q).forEach((answer, idx) => {
      const option = document.createElement('button');
      option.className = 'shield-option';
      option.type = 'button';
      option.dataset.answer = answer;
      option.style.setProperty('--option-delay', `${idx * 0.08}s`);

      const badge = document.createElement('span');
      badge.className = 'shield-option-badge';
      badge.textContent = '通行牌';
      const label = document.createElement('span');
      label.className = 'shield-answer';
      label.textContent = answer;
      option.append(badge, label);
      option.addEventListener('click', () => this._submitAnswer(answer));
      this.optionsEl.appendChild(option);
    });
  }

  _submitAnswer(answer) {
    if (this.isProcessing || this._destroyed) return;
    const q = this._getCurrentQuestion();
    if (!q) return;

    this.isProcessing = true;
    const isCorrect = String(answer) === String(q.answer);
    this.optionsEl.querySelectorAll('.shield-option').forEach((option) => {
      option.disabled = true;
      if (String(option.dataset.answer) === String(q.answer)) option.classList.add('correct');
      if (!isCorrect && String(option.dataset.answer) === String(answer)) option.classList.add('wrong');
    });

    const resolution = getGateResolutionClass(isCorrect);
    this.queueResolutions[this.currentIdx] = resolution;
    const currentPerson = this.queueEl.querySelector('.shield-person.current');
    if (currentPerson) {
      currentPerson.classList.remove('current');
      currentPerson.classList.add(resolution);
    }

    if (isCorrect) {
      this.correctCount++;
      this.scoreEl.textContent = this.correctCount;
      this.guardEl.classList.add('approve');
      this._showFeedback('查驗通過，放行入城！');
    } else {
      this.health = Math.max(0, this.health - 1);
      this._recordWrong(q, answer);
      this._renderHealth();
      this.guardEl.classList.add('deny');
      this._showFeedback('查驗未通過，請離開！');
    }

    this.currentIdx++;
    this._advanceAfter(isCorrect ? CORRECT_DELAY : WRONG_DELAY);
  }

  _advanceAfter(delay) {
    clearTimeout(this.resolveTimer);
    this.resolveTimer = setTimeout(() => {
      if (this._destroyed) return;
      this.guardEl.classList.remove('approve', 'deny');
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
