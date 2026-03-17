import { BaseGame } from './base-game.js';

export default class BombDefusal extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.currentIdx = 0;
    this.isProcessing = false;
    this.bombTimer = null;
    this.wireTimeLeft = 0;
    this.wireTimeMax = 15;
  }

  init() {
    this.container.innerHTML = `
      <div class="bomb-game" id="bomb-root">
        <div class="bomb-header">
          <button class="back-btn" id="bomb-back" style="position:static;">←</button>
          <div class="bomb-info">
            <div>題目 <span id="bomb-progress">1 / ${this.totalQuestions}</span></div>
            <div>拆除 <span id="bomb-correct">0</span></div>
          </div>
        </div>

        <div class="bomb-scene" id="bomb-scene">
          <div class="bomb-device" id="bomb-device">
            <div class="bomb-icon">💣</div>
            <div class="bomb-wire-bar">
              <div class="bomb-wire-fill" id="bomb-wire-fill"></div>
            </div>
            <div class="bomb-wire-label" id="bomb-wire-label"></div>
          </div>
          <div class="bomb-effect-layer" id="bomb-effect"></div>
          <div class="bomb-status" id="bomb-status"></div>
        </div>

        <div class="bomb-question-panel">
          <div class="bomb-question" id="bomb-question">準備中…</div>
          <div class="bomb-buttons">
            <button class="bomb-btn bomb-btn-o" id="bomb-btn-o">O</button>
            <button class="bomb-btn bomb-btn-x" id="bomb-btn-x">X</button>
          </div>
        </div>
      </div>
    `;

    this.root = this.container.querySelector('#bomb-root');
    this.scene = this.container.querySelector('#bomb-scene');
    this.device = this.container.querySelector('#bomb-device');
    this.effectLayer = this.container.querySelector('#bomb-effect');
    this.statusEl = this.container.querySelector('#bomb-status');
    this.questionEl = this.container.querySelector('#bomb-question');
    this.progressEl = this.container.querySelector('#bomb-progress');
    this.correctEl = this.container.querySelector('#bomb-correct');
    this.wireFill = this.container.querySelector('#bomb-wire-fill');
    this.wireLabel = this.container.querySelector('#bomb-wire-label');
    this.btnO = this.container.querySelector('#bomb-btn-o');
    this.btnX = this.container.querySelector('#bomb-btn-x');

    this.btnO.addEventListener('click', () => this._handleAnswer('O'));
    this.btnX.addEventListener('click', () => this._handleAnswer('X'));

    this.container.querySelector('#bomb-back').addEventListener('click', () => {
      this._stopWireTimer();
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
    this._loadQuestion();
  }

  destroy() {
    this._destroyed = true;
    this._stopWireTimer();
    this.container.innerHTML = '';
  }

  _loadQuestion() {
    if (this._destroyed) return;
    if (this.currentIdx >= this.questions.length) {
      this._finish();
      return;
    }

    this.isProcessing = false;
    const q = this.questions[this.currentIdx];
    this.questionEl.textContent = q.prompt || q.hint || q.stem;
    this.progressEl.textContent = `${this.currentIdx + 1} / ${this.totalQuestions}`;
    this.correctEl.textContent = `${this.correctCount}`;

    this.btnO.disabled = false;
    this.btnX.disabled = false;
    this.btnO.className = 'bomb-btn bomb-btn-o';
    this.btnX.className = 'bomb-btn bomb-btn-x';

    this.device.className = 'bomb-device';
    this.effectLayer.className = 'bomb-effect-layer';
    this.statusEl.style.display = 'none';

    this._startWireTimer();
  }

  _startWireTimer() {
    this._stopWireTimer();
    this.wireTimeLeft = this.wireTimeMax;
    this._updateWireBar();
    this.wireLabel.textContent = `${this.wireTimeLeft}s`;

    this.bombTimer = setInterval(() => {
      if (this._destroyed || this.isProcessing) return;
      this.wireTimeLeft--;
      this._updateWireBar();
      this.wireLabel.textContent = `${this.wireTimeLeft}s`;

      if (this.wireTimeLeft <= 5) {
        this.device.classList.add('bomb-urgent');
      }

      if (this.wireTimeLeft <= 0) {
        this._stopWireTimer();
        this._handleTimeout();
      }
    }, 1000);
  }

  _stopWireTimer() {
    if (this.bombTimer) {
      clearInterval(this.bombTimer);
      this.bombTimer = null;
    }
  }

  _updateWireBar() {
    const pct = Math.max(0, (this.wireTimeLeft / this.wireTimeMax) * 100);
    this.wireFill.style.width = `${pct}%`;

    if (pct <= 33) {
      this.wireFill.style.background = 'linear-gradient(90deg, #e74c3c, #ff6b6b)';
    } else if (pct <= 66) {
      this.wireFill.style.background = 'linear-gradient(90deg, #f39c12, #f1c40f)';
    } else {
      this.wireFill.style.background = 'linear-gradient(90deg, var(--accent-green), #2ecc71)';
    }
  }

  _handleTimeout() {
    if (this.isProcessing || this._destroyed) return;
    this.isProcessing = true;

    this.btnO.disabled = true;
    this.btnX.disabled = true;

    const q = this.questions[this.currentIdx];
    this._showExplosion();
    this._showStatus('timeout', q.answer === true || q.answer === 'O' ? 'O' : 'X');

    this.currentIdx++;
    setTimeout(() => this._loadQuestion(), 2500);
  }

  _handleAnswer(choice) {
    if (this.isProcessing || this._destroyed) return;
    this.isProcessing = true;
    this._stopWireTimer();

    const q = this.questions[this.currentIdx];
    const correctAnswer = q.answer === true || q.answer === 'O' ? 'O' : 'X';
    const correct = choice === correctAnswer;

    this.btnO.disabled = true;
    this.btnX.disabled = true;

    if (choice === 'O') {
      this.btnO.classList.add(correct ? 'correct' : 'wrong');
    } else {
      this.btnX.classList.add(correct ? 'correct' : 'wrong');
    }

    if (correct) {
      this.correctCount++;
      this.correctEl.textContent = `${this.correctCount}`;
      this._showDefused();
      this._showStatus('success', null);
    } else {
      this._showExplosion();
      this._showStatus('fail', correctAnswer);
    }

    this.currentIdx++;
    const delay = correct ? 1800 : 2500;
    setTimeout(() => this._loadQuestion(), delay);
  }

  _showDefused() {
    this.device.classList.add('bomb-defused');
    this.effectLayer.className = 'bomb-effect-layer bomb-defused-fx';
  }

  _showExplosion() {
    this.device.classList.add('bomb-exploded');
    this.scene.style.animation = 'shake 0.5s';
    this.effectLayer.className = 'bomb-effect-layer bomb-explosion-fx';
    setTimeout(() => {
      if (!this._destroyed && this.scene) this.scene.style.animation = '';
    }, 500);
  }

  _showStatus(type, correctAnswer) {
    if (type === 'success') {
      this.statusEl.textContent = '警報解除！';
      this.statusEl.className = 'bomb-status bomb-status-success';
    } else if (type === 'fail') {
      this.statusEl.innerHTML = `炸彈爆炸！<br><span class="bomb-status-answer">正確答案：${correctAnswer}</span>`;
      this.statusEl.className = 'bomb-status bomb-status-fail';
    } else {
      this.statusEl.innerHTML = `時間到！炸彈爆炸！<br><span class="bomb-status-answer">正確答案：${correctAnswer}</span>`;
      this.statusEl.className = 'bomb-status bomb-status-fail';
    }
    this.statusEl.style.display = 'block';
  }
}
