import { BaseGame } from './base-game.js';

const MOLE_UP_MS   = 1800; // 每個選項露出時間
const MOLE_DOWN_MS =  500; // 縮回洞裡的間隔

export default class WhackAMole extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.currentIdx  = 0;
    this.options     = [];
    this.cycleIdx    = 0;
    this.canHit      = false;   // 是否可以點擊（地鼠探頭中）
    this.isProcessing = false;
    this._cycleTimer = null;
  }

  init() {
    this.container.innerHTML = `
      <div class="whack-game" id="whack-root">
        <div class="whack-header">
          <button class="back-btn" id="whack-back" style="position:static;">←</button>
          <div class="whack-info">
            <span>題目 <strong id="whack-progress">1/${this.totalQuestions}</strong></span>
            <span>答對 <strong id="whack-score">0</strong></span>
          </div>
          ${this._createHintButton()}
        </div>

        <div class="whack-question-box">
          <div class="whack-question" id="whack-question">準備出發！</div>
          <div class="whack-sub">等正確答案的地鼠出現，再打它！</div>
        </div>

        <div class="whack-scene">
          <div class="whack-sky"></div>
          <div class="whack-stage">
            <div class="whack-single-hole">
              <div class="whack-mole" id="whack-mole">
                <div class="whack-mole-body">
                  <div class="whack-mole-face">🐹</div>
                  <div class="whack-mole-label" id="whack-mole-label"></div>
                </div>
              </div>
            </div>
            <div class="whack-grass-strip"></div>
          </div>
        </div>

        <div class="whack-feedback" id="whack-feedback"></div>
      </div>
    `;

    this.root       = this.container.querySelector('#whack-root');
    this.questionEl = this.container.querySelector('#whack-question');
    this.progressEl = this.container.querySelector('#whack-progress');
    this.scoreEl    = this.container.querySelector('#whack-score');
    this.feedbackEl = this.container.querySelector('#whack-feedback');
    this.moleEl     = this.container.querySelector('#whack-mole');
    this.moleLabelEl = this.container.querySelector('#whack-mole-label');

    this.container.querySelector('#whack-back').addEventListener('click', () => {
      this._stopCycle();
      this.destroy();
      this._onCompleteCb?.({
        correctCount: this.correctCount,
        totalQuestions: this.totalQuestions,
        timeSpent: (Date.now() - this.startTime) / 1000,
        stars: 0
      });
    });

    this._bindHintButton();
    this.moleEl.addEventListener('pointerdown', () => this._handleHit());
  }

  _getCurrentQuestion() {
    return this.questions[this.currentIdx] || null;
  }

  start() {
    super.start();
    this._loadQuestion();
  }

  destroy() {
    this._destroyed = true;
    this._stopCycle();
    this.container.innerHTML = '';
  }

  _stopCycle() {
    if (this._cycleTimer) { clearTimeout(this._cycleTimer); this._cycleTimer = null; }
  }

  _loadQuestion() {
    if (this._destroyed) return;
    if (this.currentIdx >= this.questions.length) {
      this._finish();
      return;
    }

    this.isProcessing = false;
    const q = this.questions[this.currentIdx];
    this.questionEl.textContent = q.hint || q.stem || q.prompt;
    this.progressEl.textContent = `${this.currentIdx + 1}/${this.totalQuestions}`;
    this.feedbackEl.className = 'whack-feedback';

    // Build options: correct answer + distractors, shuffled
    const baseOptions = Array.isArray(q.options) && q.options.length
      ? [...q.options]
      : [q.answer, ...this._getDistractors(q.answer, 3)];
    const pool = [...new Set(baseOptions)];
    const others = this._shuffleArray(pool.filter(o => o !== q.answer));
    this.options = this._shuffleArray([q.answer, ...others.slice(0, 3)]);

    // Make sure correct answer isn't always first
    this.cycleIdx = 0;
    this._hideMole();
    this._cycleTimer = setTimeout(() => this._showNextMole(), 400);
  }

  _showNextMole() {
    if (this._destroyed || this.isProcessing) return;

    const q = this.questions[this.currentIdx];
    const opt = this.options[this.cycleIdx % this.options.length];

    this.moleLabelEl.textContent = opt;
    this.moleEl.dataset.current = opt;
    this.moleEl.dataset.correct = (opt === q.answer) ? '1' : '0';
    this.moleEl.classList.remove('hit', 'wrong', 'up');

    // Pop up
    void this.moleEl.offsetWidth; // reflow to restart animation
    this.moleEl.classList.add('up');
    this.canHit = true;

    // Auto hide after MOLE_UP_MS if not hit
    this._cycleTimer = setTimeout(() => {
      if (this._destroyed || this.isProcessing) return;
      this.canHit = false;
      this._hideMole();
      this.cycleIdx++;
      this._cycleTimer = setTimeout(() => this._showNextMole(), MOLE_DOWN_MS);
    }, MOLE_UP_MS);
  }

  _hideMole() {
    this.moleEl.classList.remove('up');
    this.canHit = false;
  }

  _handleHit() {
    if (!this.canHit || this.isProcessing || this._destroyed) return;

    const correct = this.moleEl.dataset.correct === '1';

    if (correct) {
      this.isProcessing = true;
      this._stopCycle();
      this.canHit = false;
      this.correctCount++;
      this.scoreEl.textContent = this.correctCount;
      this.moleEl.classList.add('hit');
      this._showFeedback('👊 打到了！答對！', true);
      this.currentIdx++;
      this._cycleTimer = setTimeout(() => this._loadQuestion(), 1400);
    } else {
      // Wrong — shake, keep cycling
      this.moleEl.classList.add('wrong');
      this._showFeedback('❌ 不對！繼續找！', false);
      setTimeout(() => {
        if (!this._destroyed) this.moleEl.classList.remove('wrong');
      }, 500);
    }
  }

  _showFeedback(text, success) {
    if (!this.feedbackEl) return;
    this.feedbackEl.textContent = text;
    this.feedbackEl.className = `whack-feedback ${success ? 'success' : 'fail'}`;
    setTimeout(() => {
      if (this.feedbackEl) this.feedbackEl.className = 'whack-feedback';
    }, 1200);
  }
}
