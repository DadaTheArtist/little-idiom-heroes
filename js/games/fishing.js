import { BaseGame } from './base-game.js';

const FISH_EMOJIS = ['🐟', '🐠', '🐡', '🦈', '🐬'];
const FISH_COLORS = ['#00b4d8', '#f4a261', '#e94560', '#4ecca3', '#9b59b6'];

export default class Fishing extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.currentIdx = 0;
    this.isProcessing = false;
    this.fishEls = [];
    this.fishData = [];
    this.animFrames = [];
    this.spawnTimer = null;
    this._fishFixed = config.challenge?.fishFixed === true;
  }

  init() {
    this.container.innerHTML = `
      <div class="fishing-game" id="fishing-root">
        <div class="fishing-header">
          <button class="back-btn" id="fishing-back" style="position:static;">←</button>
          <div class="fishing-info">
            <span>題目 <strong id="fishing-progress">1/${this.totalQuestions}</strong></span>
            <span>答對 <strong id="fishing-score">0</strong></span>
          </div>
          ${this._createHintButton()}
        </div>

        <div class="fishing-question-box">
          <div class="fishing-rod">🎣</div>
          <div class="fishing-question" id="fishing-question">準備垂釣！</div>
          <div class="fishing-hint" id="fishing-hint">釣起正確答案的魚！</div>
        </div>

        <div class="fishing-water" id="fishing-water">
          <div class="fishing-surface"></div>
          <div class="fishing-fish-layer" id="fishing-fish-layer"></div>
          <div class="fishing-bubbles" id="fishing-bubbles"></div>
        </div>

        <div class="fishing-feedback" id="fishing-feedback"></div>
      </div>
    `;

    this.root = this.container.querySelector('#fishing-root');
    this.questionEl = this.container.querySelector('#fishing-question');
    this.hintEl = this.container.querySelector('#fishing-hint');
    this.progressEl = this.container.querySelector('#fishing-progress');
    this.scoreEl = this.container.querySelector('#fishing-score');
    this.fishLayer = this.container.querySelector('#fishing-fish-layer');
    this.feedbackEl = this.container.querySelector('#fishing-feedback');

    this.container.querySelector('#fishing-back').addEventListener('click', () => {
      this._cleanup();
      this.destroy();
      this._onCompleteCb?.({
        correctCount: this.correctCount,
        totalQuestions: this.totalQuestions,
        timeSpent: (Date.now() - this.startTime) / 1000,
        stars: 0
      });
    });

    this._bindHintButton();
    this._spawnBubbles();
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
    this._cleanup();
    this.container.innerHTML = '';
  }

  _cleanup() {
    if (this.spawnTimer) { clearTimeout(this.spawnTimer); this.spawnTimer = null; }
    this.animFrames.forEach(id => cancelAnimationFrame(id));
    this.animFrames = [];
  }

  _spawnBubbles() {
    const container = this.container.querySelector('#fishing-bubbles');
    if (!container) return;
    for (let i = 0; i < 8; i++) {
      const b = document.createElement('div');
      b.className = 'fishing-bubble';
      b.style.left = `${Math.random() * 90}%`;
      b.style.animationDelay = `${Math.random() * 3}s`;
      b.style.animationDuration = `${2 + Math.random() * 2}s`;
      b.style.width = b.style.height = `${6 + Math.random() * 10}px`;
      container.appendChild(b);
    }
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
    this.hintEl.textContent = '點擊正確答案的魚來釣它！';
    this.progressEl.textContent = `${this.currentIdx + 1}/${this.totalQuestions}`;

    // Build options
    const baseOptions = Array.isArray(q.options) && q.options.length
      ? [...q.options]
      : [q.answer, ...this._getDistractors(q.answer, 3)];
    const pool = [...new Set(baseOptions)];
    const answer = q.answer;
    const others = this._shuffleArray(pool.filter(o => o !== answer));
    const options = this._shuffleArray([answer, ...others.slice(0, 3)]);

    // Clear old fish
    this.fishLayer.innerHTML = '';
    this.fishData = [];
    this._cleanup();

    // Spawn fish with staggered delays
    const waterEl = this.container.querySelector('#fishing-water');
    const waterH = waterEl ? waterEl.clientHeight : 200;

    options.forEach((opt, idx) => {
      this.spawnTimer = setTimeout(() => {
        if (this._destroyed || this.isProcessing) return;
        this._spawnFish(opt, opt === answer, idx, options.length, waterH);
      }, idx * 300);
    });
  }

  _spawnFish(label, isCorrect, idx, total, waterH) {
    const fishEl = document.createElement('div');
    fishEl.className = 'fishing-fish';

    const emoji = FISH_EMOJIS[idx % FISH_EMOJIS.length];
    const color = FISH_COLORS[idx % FISH_COLORS.length];

    fishEl.dataset.correct = isCorrect ? '1' : '0';
    fishEl.dataset.answer = label;

    if (this._fishFixed) {
      // Fixed mode: 2-column grid layout, no swimming animation
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const xPct = col === 0 ? 10 : 55;
      const yPct = 15 + row * 28;
      fishEl.innerHTML = `
        <span class="fishing-fish-emoji" style="color:${color}; display:inline-block;">${emoji}</span>
        <span class="fishing-fish-label">${label}</span>
      `;
      fishEl.style.left = `${xPct}%`;
      fishEl.style.top = `${yPct}%`;
      fishEl.style.position = 'absolute';
      this.fishLayer.appendChild(fishEl);
    } else {
      // Swimming mode: original logic
      const goLeft = idx % 2 === 0;
      const yPct = 20 + (idx / total) * 55; // distribute vertically
      const speed = (24 + Math.random() * 18); // px/s

      // goLeft=true 代表魚從左側出發往右游；false 則從右往左游
      // 只對 emoji 做水平翻轉，label 保持正向可讀
      const emojiFlip = !goLeft; // 往左游時 emoji 需要翻轉
      fishEl.innerHTML = `
        <span class="fishing-fish-emoji" style="color:${color}; display:inline-block; transform:scaleX(${emojiFlip ? -1 : 1})">${emoji}</span>
        <span class="fishing-fish-label">${label}</span>
      `;
      fishEl.style.top = `${yPct}%`;

      const startX = goLeft ? -120 : this.fishLayer.clientWidth + 120;
      const endX = goLeft ? this.fishLayer.clientWidth + 120 : -120;
      fishEl.style.left = `${startX}px`;

      this.fishLayer.appendChild(fishEl);

      // Animate fish swimming
      let posX = startX;
      const dir = goLeft ? 1 : -1;

      const animate = (timestamp) => {
        if (this._destroyed || this.isProcessing || !fishEl.isConnected) return;
        posX += (speed / 60) * dir;
        fishEl.style.left = `${posX}px`;

        // Gentle vertical bob
        const bob = Math.sin(timestamp / 600 + idx) * 4;
        fishEl.style.top = `calc(${yPct}% + ${bob}px)`;

        if ((dir > 0 && posX > endX) || (dir < 0 && posX < endX)) {
          fishEl.remove();
          return;
        }
        const frame = requestAnimationFrame(animate);
        this.animFrames.push(frame);
      };
      const frame = requestAnimationFrame(animate);
      this.animFrames.push(frame);
    }

    fishEl.addEventListener('pointerdown', () => this._handleFishClick(fishEl));
    this.fishData.push({ el: fishEl, isCorrect });
  }

  _handleFishClick(fishEl) {
    if (this.isProcessing || this._destroyed) return;
    if (!fishEl.isConnected) return;
    this.isProcessing = true;
    this._cleanup();

    const correct = fishEl.dataset.correct === '1';

    if (correct) {
      this.correctCount++;
      this.scoreEl.textContent = this.correctCount;
      fishEl.classList.add('caught');
      this._showFeedback('🎣 釣到了！答對！', true);
      // Hide other fish
      this.fishLayer.querySelectorAll('.fishing-fish:not(.caught)').forEach(f => {
        f.style.opacity = '0.3';
        f.style.pointerEvents = 'none';
      });
    } else {
      fishEl.classList.add('escaped');
      // Highlight correct fish
      this.fishLayer.querySelectorAll('.fishing-fish').forEach(f => {
        if (f.dataset.correct === '1') f.classList.add('highlight');
        else { f.style.opacity = '0.3'; f.style.pointerEvents = 'none'; }
      });
      this._showFeedback('🐟 釣錯了！', false);
    }

    this.currentIdx++;
    setTimeout(() => this._loadQuestion(), correct ? 1200 : 2200);
  }

  _showFeedback(text, success) {
    if (!this.feedbackEl) return;
    this.feedbackEl.textContent = text;
    this.feedbackEl.className = `fishing-feedback ${success ? 'success' : 'fail'}`;
    setTimeout(() => {
      if (this.feedbackEl) this.feedbackEl.className = 'fishing-feedback';
    }, 1800);
  }
}
