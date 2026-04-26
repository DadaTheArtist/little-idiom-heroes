import { BaseGame } from './base-game.js';

export default class Racing extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.currentIdx = 0;
    this.playerPos = 0;
    this.cpuPos = 0;
    /** 先答對這麼多題的一方抵達終點（與關卡設定的題數一致） */
    this.winSteps = this.totalQuestions;
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
          <div style="position:absolute;top:12px;right:12px;z-index:100;">${this._createHintButton()}</div>
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

    this._bindHintButton();
    this._updateCars();
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
    this.container.innerHTML = '';
  }

  _loadQuestion() {
    if (this._destroyed || this.finished) return;

    if (this.currentIdx >= this.questions.length) {
      this.questions = this._shuffleArray([...this.questions]);
      this.currentIdx = 0;
    }

    this.isProcessing = false;
    const q = this.questions[this.currentIdx];
    this.questionEl.textContent = q.hint || q.stem;
    this.progressEl.textContent =
      `你 ${this.playerPos} / ${this.winSteps} ・ 對手 ${this.cpuPos} / ${this.winSteps}`;

    const baseOptions = Array.isArray(q.options) && q.options.length
      ? [...q.options]
      : [q.answer, ...this._getDistractors(q.answer, 3)];
    const options = this._buildOptions(baseOptions, q.answer, 4);

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
      this._recordWrong(q, chosen);
      btn.classList.add('wrong');
      this.cpuPos += 2;
    }

    this._updateCars();
    this.currentIdx++;

    if (this.playerPos >= this.winSteps || this.cpuPos >= this.winSteps) {
      setTimeout(() => this._endRace(), 800);
    } else {
      setTimeout(() => this._loadQuestion(), correct ? 1000 : 2000);
    }
  }

  _updateCars() {
    const steps = Math.max(this.winSteps, 1);
    /** 賽段上對應「抵達終點線」的進度（終點線約在 right:6%） */
    const linePct = 82;
    /** 答對最後一題／對手奪勝時再多開一段，視覺上越過終點線 */
    const pastLinePct = 12;
    const capPct = 94;

    let playerPct;
    if (this.playerPos >= this.winSteps) {
      playerPct = linePct + pastLinePct;
    } else {
      playerPct = (this.playerPos / steps) * linePct;
    }

    let cpuPct;
    if (this.cpuPos >= this.winSteps) {
      cpuPct = linePct + pastLinePct;
    } else {
      cpuPct = (this.cpuPos / steps) * linePct;
    }

    this.carPlayer.style.left = `${6 + Math.min(playerPct, capPct)}%`;
    this.carCpu.style.left = `${6 + Math.min(cpuPct, capPct)}%`;
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

  _buildOptions(baseOptions, answer, size) {
    const pool = [...new Set(baseOptions)].filter(o => o !== answer);
    const selected = [answer, ...this._shuffleArray(pool)].slice(0, size);

    if (selected.length < size) {
      const extras = this._getDistractors(answer, size);
      for (const item of extras) {
        if (!selected.includes(item)) selected.push(item);
        if (selected.length >= size) break;
      }
    }

    return this._shuffleArray(selected);
  }
}
