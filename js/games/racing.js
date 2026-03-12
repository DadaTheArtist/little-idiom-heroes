import { BaseGame } from './base-game.js';

export default class Racing extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.currentIdx = 0;
    this.playerPos = 0;
    this.cpuPos = 0;
    this.trackSteps = questions.length + 2;
    this.isProcessing = false;
    this.finished = false;
  }

  init() {
    this.container.innerHTML = `
      <div class="racing-game" id="racing-root">
        <div class="racing-track-area">
          <div class="racing-road"></div>
          <div class="racing-finish-line"></div>
          <div class="racing-lane-divider"></div>
          <div class="racing-lane racing-lane-player">
            <span class="racing-label">你</span>
            <div class="racing-car racing-car-player" id="car-player">🚙</div>
          </div>
          <div class="racing-lane racing-lane-cpu">
            <span class="racing-label">對手</span>
            <div class="racing-car racing-car-cpu" id="car-cpu">🚗</div>
          </div>
          <div class="racing-progress-text" id="racing-progress"></div>
          <button class="back-btn" id="racing-back">←</button>
        </div>
        <div class="racing-quiz-area">
          <div class="racing-question" id="racing-q">準備中…</div>
          <div class="racing-options" id="racing-opts"></div>
        </div>
      </div>
    `;

    this.carPlayer = this.container.querySelector('#car-player');
    this.carCpu = this.container.querySelector('#car-cpu');
    this.questionEl = this.container.querySelector('#racing-q');
    this.optionsEl = this.container.querySelector('#racing-opts');
    this.progressEl = this.container.querySelector('#racing-progress');
    this.root = this.container.querySelector('#racing-root');

    this.container.querySelector('#racing-back').addEventListener('click', () => {
      this.destroy();
      this._onCompleteCb?.({
        correctCount: this.correctCount,
        totalQuestions: this.totalQuestions,
        timeSpent: (Date.now() - this.startTime) / 1000,
        stars: 0
      });
    });

    this._updateCars();
  }

  start() {
    super.start();
    this._loadQuestion();
  }

  destroy() {
    this._destroyed = true;
    this.container.innerHTML = '';
  }

  _loadQuestion() {
    if (this._destroyed || this.finished) return;
    if (this.currentIdx >= this.questions.length) {
      this._endRace();
      return;
    }

    this.isProcessing = false;
    const q = this.questions[this.currentIdx];
    this.questionEl.textContent = q.hint || q.stem;
    this.progressEl.textContent = `第 ${this.currentIdx + 1} / ${this.totalQuestions} 題`;

    const distractors = this._getDistractors(q.answer, 3);
    const options = this._shuffleArray([q.answer, ...distractors]);

    this.optionsEl.innerHTML = options.map(opt =>
      `<button class="racing-option" data-answer="${opt}">${opt}</button>`
    ).join('');

    this.optionsEl.querySelectorAll('.racing-option').forEach(btn => {
      btn.addEventListener('click', () => this._handleAnswer(btn, q));
    });
  }

  _handleAnswer(btn, q) {
    if (this.isProcessing || this._destroyed) return;
    this.isProcessing = true;

    const chosen = btn.dataset.answer;
    const correct = chosen === q.answer;

    this.optionsEl.querySelectorAll('.racing-option').forEach(b => {
      b.style.pointerEvents = 'none';
      if (b.dataset.answer === q.answer) b.classList.add('reveal-correct');
    });

    if (correct) {
      this.correctCount++;
      btn.classList.add('correct');
      this.playerPos++;
    } else {
      btn.classList.add('wrong');
      this.cpuPos++;
    }

    this._updateCars();
    this.currentIdx++;

    if (this.playerPos >= this.trackSteps || this.cpuPos >= this.trackSteps) {
      setTimeout(() => this._endRace(), 800);
    } else {
      setTimeout(() => this._loadQuestion(), 1000);
    }
  }

  _updateCars() {
    const maxPct = 82;
    const playerPct = Math.min((this.playerPos / this.trackSteps) * maxPct, maxPct);
    const cpuPct = Math.min((this.cpuPos / this.trackSteps) * maxPct, maxPct);
    this.carPlayer.style.left = `${6 + playerPct}%`;
    this.carCpu.style.left = `${6 + cpuPct}%`;
  }

  _endRace() {
    if (this.finished) return;
    this.finished = true;

    const won = this.playerPos >= this.cpuPos;
    const overlay = document.createElement('div');
    overlay.className = 'racing-result-overlay';
    overlay.innerHTML = `
      <div class="racing-result-text" style="color:${won ? 'var(--accent-gold)' : 'var(--accent-red)'}">
        ${won ? '你贏了！' : '對手先到了…'}
      </div>
      <button class="btn btn-gold" id="racing-done">繼續</button>
    `;
    this.root.appendChild(overlay);

    overlay.querySelector('#racing-done').addEventListener('click', () => {
      this._finish();
    });
  }
}
