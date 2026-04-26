import { BaseGame } from './base-game.js';

const MAX_LIVES = 3;

export default class SpaceShooter extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.currentIdx = 0;
    this.isProcessing = false;
    this.lives = MAX_LIVES;
    this.asteroids = [];
    this.animFrames = [];
    this.spawnTimers = [];
  }

  init() {
    this.container.innerHTML = `
      <div class="space-game" id="space-root">
        <div class="space-hud">
          <button class="back-btn" id="space-back" style="position:static;">←</button>
          <div class="space-hud-info">
            <span>題目 <strong id="space-progress">1/${this.totalQuestions}</strong></span>
            <span>得分 <strong id="space-score">0</strong></span>
          </div>
          <div class="space-lives" id="space-lives"></div>
          ${this._createHintButton()}
        </div>

        <div class="space-question-panel" id="space-question-panel">
          <div class="space-question-label">摧毀正確答案的隕石！</div>
          <div class="space-question" id="space-question">準備發射！</div>
        </div>

        <div class="space-field" id="space-field">
          <div class="space-stars" id="space-stars"></div>
          <div class="space-asteroid-layer" id="space-asteroid-layer"></div>
          <div class="space-ship" id="space-ship">🚀</div>
          <div class="space-laser-layer" id="space-laser-layer"></div>
        </div>

        <div class="space-feedback" id="space-feedback"></div>
      </div>
    `;

    this.root = this.container.querySelector('#space-root');
    this.questionEl = this.container.querySelector('#space-question');
    this.progressEl = this.container.querySelector('#space-progress');
    this.scoreEl = this.container.querySelector('#space-score');
    this.livesEl = this.container.querySelector('#space-lives');
    this.fieldEl = this.container.querySelector('#space-field');
    this.asteroidLayer = this.container.querySelector('#space-asteroid-layer');
    this.laserLayer = this.container.querySelector('#space-laser-layer');
    this.shipEl = this.container.querySelector('#space-ship');
    this.feedbackEl = this.container.querySelector('#space-feedback');

    this.container.querySelector('#space-back').addEventListener('click', () => {
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
    this._generateStars();
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
    this._destroyed = true;
    this._cleanup();
    this.container.innerHTML = '';
  }

  _cleanup() {
    this.animFrames.forEach(id => cancelAnimationFrame(id));
    this.animFrames = [];
    this.spawnTimers.forEach(t => clearTimeout(t));
    this.spawnTimers = [];
    this.asteroids = [];
  }

  _generateStars() {
    const starsEl = this.container.querySelector('#space-stars');
    if (!starsEl) return;
    for (let i = 0; i < 40; i++) {
      const s = document.createElement('div');
      s.className = 'space-star';
      s.style.left = `${Math.random() * 100}%`;
      s.style.top = `${Math.random() * 100}%`;
      s.style.animationDelay = `${Math.random() * 2}s`;
      s.style.width = s.style.height = `${1 + Math.random() * 2}px`;
      starsEl.appendChild(s);
    }
  }

  _renderLives() {
    if (!this.livesEl) return;
    this.livesEl.innerHTML = Array.from({ length: MAX_LIVES }, (_, i) =>
      `<span class="space-life ${i < this.lives ? 'active' : 'lost'}">❤️</span>`
    ).join('');
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

    const baseOptions = Array.isArray(q.options) && q.options.length
      ? [...q.options]
      : [q.answer, ...this._getDistractors(q.answer, 3)];
    const pool = [...new Set(baseOptions)];
    const answer = q.answer;
    const others = this._shuffleArray(pool.filter(o => o !== answer));
    const options = this._shuffleArray([answer, ...others.slice(0, 3)]);

    this.asteroidLayer.innerHTML = '';
    this._cleanup();

    const fieldW = this.fieldEl.clientWidth || 360;

    options.forEach((opt, idx) => {
      const t = setTimeout(() => {
        if (this._destroyed || this.isProcessing) return;
        this._spawnAsteroid(opt, opt === answer, idx, options.length, fieldW);
      }, idx * 250);
      this.spawnTimers.push(t);
    });
  }

  _spawnAsteroid(label, isCorrect, idx, total, fieldW) {
    const asteroid = document.createElement('div');
    asteroid.className = 'space-asteroid';
    asteroid.dataset.correct = isCorrect ? '1' : '0';

    const xPct = 8 + (idx / total) * 75 + (Math.random() - 0.5) * 10;
    const speed = 27 + Math.random() * 15; // px/s downward（慢速，給小朋友思考時間）
    const rotateDir = Math.random() > 0.5 ? 1 : -1;
    const size = 0.85 + Math.random() * 0.3;

    const emojis = ['🪨', '☄️', '🌑', '💫'];
    const emoji = emojis[idx % emojis.length];

    asteroid.innerHTML = `
      <div class="space-asteroid-body" style="font-size:${Math.round(36 * size)}px">
        ${emoji}
      </div>
      <div class="space-asteroid-label">${label}</div>
    `;

    asteroid.style.left = `${xPct}%`;
    asteroid.style.top = '-80px';
    asteroid.style.setProperty('--rotate-dir', rotateDir);

    asteroid.querySelector('.space-asteroid-body').addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this._handleShoot(asteroid, isCorrect);
    });

    this.asteroidLayer.appendChild(asteroid);

    // Animate downward
    let posY = -80;
    const fieldH = this.fieldEl.clientHeight || 500;

    const animate = (timestamp) => {
      if (this._destroyed || this.isProcessing || !asteroid.isConnected) return;
      posY += speed / 60;
      asteroid.style.top = `${posY}px`;

      const rotDeg = (timestamp / 800) * rotateDir * 60;
      const body = asteroid.querySelector('.space-asteroid-body');
      if (body) body.style.transform = `rotate(${rotDeg}deg)`;

      if (posY > fieldH + 20) {
        // Asteroid passed — treat as wrong (lost life)
        if (!this.isProcessing) this._handleMissed(asteroid, label, isCorrect);
        return;
      }

      const frame = requestAnimationFrame(animate);
      this.animFrames.push(frame);
    };
    const frame = requestAnimationFrame(animate);
    this.animFrames.push(frame);

    this.asteroids.push({ el: asteroid, isCorrect });
  }

  _handleShoot(asteroid, isCorrect) {
    if (this.isProcessing || this._destroyed) return;
    this.isProcessing = true;
    this._cleanup();

    // Laser effect
    this._fireLaser(asteroid);

    if (isCorrect) {
      this.correctCount++;
      this.scoreEl.textContent = this.correctCount;
      asteroid.classList.add('destroyed');
      this._showFeedback('💥 命中！答對！', true);
      this.asteroidLayer.querySelectorAll('.space-asteroid:not(.destroyed)').forEach(a => {
        a.style.opacity = '0.2';
        a.style.pointerEvents = 'none';
      });
    } else {
      this._recordWrong(this.questions[this.currentIdx], asteroid.dataset?.answer || asteroid.textContent);
      asteroid.classList.add('wrong-hit');
      this._loseLife();
      // Highlight correct answer for 1 second before proceeding
      this.asteroidLayer.querySelectorAll('.space-asteroid').forEach(a => {
        if (a.dataset.correct === '1') a.classList.add('correct-glow');
        else { a.style.opacity = '0.2'; a.style.pointerEvents = 'none'; }
      });
      this._showFeedback('⚠️ 打錯了！', false);
    }

    this.currentIdx++;
    // 答對：1.2秒後換題；答錯：先顯示正確答案 1 秒（正確發光），再等 1 秒後換題
    setTimeout(() => this._loadQuestion(), isCorrect ? 1200 : 2000);
  }

  _handleMissed(asteroid, label, isCorrect) {
    if (this.isProcessing || this._destroyed) return;
    if (!isCorrect) return; // Only care if correct asteroid slipped through

    this.isProcessing = true;
    this._cleanup();
    this._loseLife();
    // Highlight what was correct
    this.asteroidLayer.querySelectorAll('.space-asteroid').forEach(a => {
      a.style.opacity = '0.2';
      a.style.pointerEvents = 'none';
    });
    this._showFeedback('🌠 隕石溜走了！', false);

    this.currentIdx++;
    setTimeout(() => this._loadQuestion(), 2000);
  }

  _loseLife() {
    if (this.lives > 0) this.lives--;
    this._renderLives();
    if (this.shipEl) {
      this.shipEl.classList.add('hit');
      setTimeout(() => this.shipEl?.classList.remove('hit'), 500);
    }
  }

  _fireLaser(targetAsteroid) {
    const laser = document.createElement('div');
    laser.className = 'space-laser';
    const rect = targetAsteroid.getBoundingClientRect();
    const fieldRect = this.fieldEl.getBoundingClientRect();
    const shipRect = this.shipEl?.getBoundingClientRect();

    const startX = (shipRect ? shipRect.left + shipRect.width / 2 : fieldRect.left + fieldRect.width / 2) - fieldRect.left;
    const startY = (shipRect ? shipRect.top : fieldRect.bottom - 60) - fieldRect.top;
    const endX = rect.left + rect.width / 2 - fieldRect.left;
    const endY = rect.top + rect.height / 2 - fieldRect.top;

    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    laser.style.cssText = `
      left: ${startX}px;
      top: ${startY}px;
      width: ${length}px;
      transform: rotate(${angle}deg);
      transform-origin: 0 50%;
    `;
    this.laserLayer.appendChild(laser);
    setTimeout(() => laser.remove(), 300);
  }

  _showFeedback(text, success) {
    if (!this.feedbackEl) return;
    this.feedbackEl.textContent = text;
    this.feedbackEl.className = `space-feedback ${success ? 'success' : 'fail'}`;
    const duration = success ? 1200 : 1900; // 答錯時顯示夠久讓小朋友看清楚正確答案
    setTimeout(() => {
      if (this.feedbackEl) this.feedbackEl.className = 'space-feedback';
    }, duration);
  }
}
