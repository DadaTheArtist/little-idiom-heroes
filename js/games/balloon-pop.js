import { BaseGame } from './base-game.js';

const BALLOON_COLORS = ['#e94560', '#f4a261', '#ffd700', '#4ecca3', '#9b59b6', '#00b4d8', '#ff8a65', '#81c784'];

export default class BalloonPop extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.currentIdx   = 0;
    this.answeredCount = 0;
    this.replenished  = false;
    this.isProcessing = false;
    this.colorIdx     = 0;
  }

  init() {
    this.container.innerHTML = `
      <div class="balloon-game" id="balloon-root">
        <div class="balloon-header">
          <button class="back-btn" id="balloon-back" style="position:static;">←</button>
          <div class="balloon-info">
            <span>題目 <strong id="balloon-progress">1/${this.totalQuestions}</strong></span>
            <span>答對 <strong id="balloon-score">0</strong></span>
          </div>
          ${this._createHintButton()}
        </div>

        <div class="balloon-question-area">
          <div class="balloon-question" id="balloon-question">準備戳氣球！</div>
          <div class="balloon-sub" id="balloon-sub">找到正確答案的氣球，戳破它！</div>
        </div>

        <div class="balloon-sky" id="balloon-sky">
          <div class="balloon-clouds"></div>
          <div class="balloon-arena" id="balloon-arena"></div>
        </div>

        <div class="balloon-feedback" id="balloon-feedback"></div>
      </div>
    `;

    this.root       = this.container.querySelector('#balloon-root');
    this.questionEl = this.container.querySelector('#balloon-question');
    this.subEl      = this.container.querySelector('#balloon-sub');
    this.progressEl = this.container.querySelector('#balloon-progress');
    this.scoreEl    = this.container.querySelector('#balloon-score');
    this.arenaEl    = this.container.querySelector('#balloon-arena');
    this.feedbackEl = this.container.querySelector('#balloon-feedback');

    this.container.querySelector('#balloon-back').addEventListener('click', () => {
      this.destroy();
      this._onCompleteCb?.({
        correctCount: this.correctCount,
        totalQuestions: this.totalQuestions,
        timeSpent: (Date.now() - this.startTime) / 1000,
        stars: 0
      });
    });

    this._bindHintButton();
    this._addClouds();
  }

  _getCurrentQuestion() {
    return this.questions[this.currentIdx] || null;
  }

  start() {
    super.start();
    this._spawnAllBalloons();
    this._showQuestion();
  }

  destroy() {
    this._destroyed = true;
    this.container.innerHTML = '';
  }

  // ─── 初始化：將所有題目的正確答案各生成一顆氣球 ─────────────────────────
  _spawnAllBalloons() {
    this.arenaEl.innerHTML = '';

    // 每題的正確答案 → 一顆氣球
    const labels = this.questions.map(q => q.answer);
    this._spawnBalloons(labels);
  }

  // ─── 補充氣球至 n 個（用干擾選項填滿） ────────────────────────────────────
  _replenish() {
    const remaining = this.arenaEl.querySelectorAll('.balloon-item').length;
    const needed = this.totalQuestions - remaining;
    if (needed <= 0) return;

    // 從已作答題目的錯誤選項中抽干擾答案
    const distractors = [];
    this.questions.forEach(q => {
      const opts = Array.isArray(q.options) ? q.options : [];
      opts.filter(o => o !== q.answer).forEach(o => distractors.push(o));
    });

    const pool = this._shuffleArray([...new Set(distractors)]);
    const labels = pool.slice(0, needed);
    this._spawnBalloons(labels);

    // 提示文字
    this.subEl.textContent = '☁️ 新氣球補充了！繼續找答案！';
    setTimeout(() => {
      if (this.subEl) this.subEl.textContent = '找到正確答案的氣球，戳破它！';
    }, 2000);
  }

  // ─── 生成一批氣球（帶位置散布演算法） ────────────────────────────────────
  _spawnBalloons(labels) {
    const total = this.arenaEl.querySelectorAll('.balloon-item').length + labels.length;
    labels.forEach((label, i) => {
      setTimeout(() => {
        if (this._destroyed) return;
        this._spawnOneBalloon(label, false);
      }, i * 120);
    });
  }

  _spawnOneBalloon(label, isDistractor) {
    const balloon = document.createElement('div');
    balloon.className = 'balloon-item';
    balloon.dataset.label = label;

    const color = BALLOON_COLORS[this.colorIdx % BALLOON_COLORS.length];
    this.colorIdx++;

    // 散布位置：把場地分成格子再加隨機偏移，避免嚴重重疊
    const totalSlots = this.totalQuestions;
    const cols = Math.ceil(Math.sqrt(totalSlots * 1.5));
    const slotW = 100 / cols;
    const existingCount = this.arenaEl.querySelectorAll('.balloon-item').length;
    const col = existingCount % cols;
    const row = Math.floor(existingCount / cols);
    const xPct = col * slotW + slotW * 0.1 + Math.random() * slotW * 0.6;
    const yPct = 5 + row * 28 + Math.random() * 12;

    const wobble = 6 + Math.random() * 8;
    const bobDelay = Math.random() * 2;

    balloon.innerHTML = `
      <div class="balloon-body" style="background:radial-gradient(circle at 35% 35%, ${color}cc, ${color});">
        <div class="balloon-shine"></div>
        <div class="balloon-label">${label}</div>
      </div>
      <div class="balloon-string"></div>
    `;

    balloon.style.cssText = `
      left: ${Math.min(xPct, 88)}%;
      top: ${Math.min(yPct, 70)}%;
      --wobble: ${wobble}px;
      --bob-delay: ${bobDelay}s;
    `;

    balloon.querySelector('.balloon-body').addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this._handleTap(balloon);
    });

    this.arenaEl.appendChild(balloon);
  }

  // ─── 顯示當前題目 ────────────────────────────────────────────────────────
  _showQuestion() {
    if (this._destroyed || this.currentIdx >= this.questions.length) return;
    const q = this.questions[this.currentIdx];
    this.questionEl.textContent = q.hint || q.stem || q.prompt;
    this.progressEl.textContent = `${this.currentIdx + 1}/${this.totalQuestions}`;
    this.isProcessing = false;
  }

  // ─── 點擊氣球 ────────────────────────────────────────────────────────────
  _handleTap(balloon) {
    if (this.isProcessing || this._destroyed) return;
    if (!balloon.isConnected) return;

    const q = this.questions[this.currentIdx];
    const correct = balloon.dataset.label === String(q.answer);

    if (correct) {
      this.isProcessing = true;
      this.correctCount++;
      this.answeredCount++;
      this.scoreEl.textContent = this.correctCount;

      balloon.classList.add('fly-away');
      this._showFeedback('🎉 答對了！', true);

      // 半程補充氣球
      const half = Math.floor(this.totalQuestions / 2);
      if (!this.replenished && this.answeredCount === half) {
        this.replenished = true;
        setTimeout(() => this._replenish(), 600);
      }

      this.currentIdx++;
      if (this.currentIdx >= this.questions.length) {
        setTimeout(() => this._finish(), 1400);
      } else {
        setTimeout(() => this._showQuestion(), 1200);
      }
    } else {
      balloon.classList.add('wrong-shake');
      this._showFeedback('❌ 不對，繼續找！', false);
      setTimeout(() => balloon.classList.remove('wrong-shake'), 500);
    }
  }

  _showFeedback(text, success) {
    if (!this.feedbackEl) return;
    this.feedbackEl.textContent = text;
    this.feedbackEl.className = `balloon-feedback ${success ? 'success' : 'fail'}`;
    setTimeout(() => {
      if (this.feedbackEl) this.feedbackEl.className = 'balloon-feedback';
    }, 1400);
  }

  _addClouds() {
    const clouds = this.container.querySelector('.balloon-clouds');
    if (!clouds) return;
    for (let i = 0; i < 4; i++) {
      const c = document.createElement('div');
      c.className = 'balloon-cloud';
      c.textContent = '☁️';
      c.style.left = `${5 + i * 24}%`;
      c.style.top = `${5 + (i % 2) * 12}%`;
      c.style.animationDelay = `${i * 1.5}s`;
      c.style.fontSize = `${28 + i * 8}px`;
      clouds.appendChild(c);
    }
  }
}
