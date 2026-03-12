import { BaseGame } from './base-game.js';

export default class BossFight extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.bossHp = questions.length;
    this.maxHp = questions.length;
    this.currentIdx = 0;
    this.isProcessing = false;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
  }

  init() {
    const bossNum = Math.floor(Math.random() * 5) + 1;
    this.container.innerHTML = `
      <div class="boss-fight" id="boss-arena" style="background-image:url('img/boss-${bossNum}.png')">
        <div class="boss-effect-layer" id="boss-atk-effect"></div>
        <div class="boss-effect-layer" id="boss-def-effect"></div>
        <div class="boss-status-text" id="boss-status"></div>
        <button class="back-btn" id="boss-back">←</button>
        <div class="boss-ui-overlay">
          <div class="boss-hp-container">
            <div class="boss-hp-fill" id="boss-hp-fill"></div>
            <div class="boss-hp-text" id="boss-hp-text"></div>
          </div>
          <div class="boss-question" id="boss-question">準備中…</div>
          <div class="boss-answer-area" id="boss-answers">
            <div class="boss-answer-target" id="bt-0"></div>
            <div class="boss-answer-target" id="bt-1"></div>
            <div class="boss-answer-target" id="bt-2"></div>
          </div>
          <div class="boss-sword-container">
            <div class="boss-sword" id="boss-sword"></div>
          </div>
        </div>
      </div>
    `;

    this.arena = this.container.querySelector('#boss-arena');
    this.sword = this.container.querySelector('#boss-sword');
    this.targets = this.container.querySelectorAll('.boss-answer-target');
    this.hpFill = this.container.querySelector('#boss-hp-fill');
    this.hpText = this.container.querySelector('#boss-hp-text');
    this.questionEl = this.container.querySelector('#boss-question');
    this.statusEl = this.container.querySelector('#boss-status');
    this.atkEffect = this.container.querySelector('#boss-atk-effect');
    this.defEffect = this.container.querySelector('#boss-def-effect');

    this.container.querySelector('#boss-back').addEventListener('click', () => {
      this.destroy();
      this._onCompleteCb?.({
        correctCount: this.correctCount,
        totalQuestions: this.totalQuestions,
        timeSpent: (Date.now() - this.startTime) / 1000,
        stars: 0
      });
    });

    this.sword.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
  }

  start() {
    super.start();
    this._updateHp();
    this._loadQuestion();
  }

  destroy() {
    this._destroyed = true;
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
  }

  _loadQuestion() {
    if (this._destroyed) return;
    if (this.currentIdx >= this.questions.length) {
      this._finish();
      return;
    }
    this.isProcessing = false;

    const q = this.questions[this.currentIdx];
    this.questionEl.textContent = q.hint || q.stem;

    const distractors = this._getDistractors(q.answer, 2);
    const options = this._shuffleArray([q.answer, ...distractors]);

    this.targets.forEach((t, i) => {
      t.textContent = options[i];
      t.style.background = 'rgba(45,45,45,0.95)';
      t.style.borderColor = '#666';
      t.style.color = 'white';
      t.classList.remove('hover');
    });
  }

  _updateHp() {
    if (this.bossHp > this.maxHp) this.bossHp = this.maxHp;
    if (this.bossHp < 0) this.bossHp = 0;
    this.hpFill.style.width = `${(this.bossHp / this.maxHp) * 100}%`;
    this.hpText.textContent = `HP: ${this.bossHp} / ${this.maxHp}`;
  }

  _checkAnswer(target) {
    if (this.isProcessing || this._destroyed) return;
    this.isProcessing = true;

    const q = this.questions[this.currentIdx];
    const correct = target.textContent === q.answer;

    if (correct) {
      this.correctCount++;
      this.bossHp--;
      this._updateHp();
      this._showStatus('success', '');
      this.arena.style.animation = 'shake 0.3s';
      setTimeout(() => { if (this.arena) this.arena.style.animation = ''; }, 300);

      if (this.bossHp <= 0) {
        this.arena.classList.add('boss-defeated-anim');
        setTimeout(() => this._finish(), 2000);
      } else {
        this.currentIdx++;
        setTimeout(() => this._loadQuestion(), 500);
      }
    } else {
      this.bossHp += 2;
      this._updateHp();

      target.style.background = 'rgba(244,67,54,0.6)';
      target.style.borderColor = '#ff4d4d';

      this.targets.forEach(btn => {
        if (btn.textContent === q.answer) {
          btn.style.background = 'rgba(76,175,80,0.7)';
          btn.style.borderColor = '#4CAF50';
        }
      });

      this._showStatus('fail', q.answer);
      this.currentIdx++;
      setTimeout(() => this._loadQuestion(), 2500);
    }
  }

  _showStatus(type, correctAnswer) {
    const atk = this.atkEffect;
    const def = this.defEffect;
    let displayTime = 1500;

    if (type === 'success') {
      this.statusEl.textContent = '命中！HP - 1';
      this.statusEl.style.color = '#ffd700';
      atk.style.backgroundImage = `url('img/boss-attack.gif?t=${Date.now()}')`;
      atk.style.display = 'block';
      def.style.display = 'none';
    } else {
      this.statusEl.innerHTML = `攻擊失敗！<br><span style="font-size:0.7em;color:white;">魔王恢復 HP+2</span><br><span style="color:#ffeb3b;">正確答案：${correctAnswer}</span>`;
      this.statusEl.style.color = '#ff4d4d';
      def.style.backgroundImage = `url('img/boss-def.gif?t=${Date.now()}')`;
      def.style.display = 'block';
      atk.style.display = 'none';
      displayTime = 2500;
    }

    this.statusEl.style.display = 'block';
    setTimeout(() => {
      if (this._destroyed) return;
      this.statusEl.style.display = 'none';
      atk.style.display = 'none';
      def.style.display = 'none';
    }, displayTime);
  }

  _onPointerDown(e) {
    if (this._destroyed || this.isProcessing) return;
    this.isDragging = true;
    this.sword.setPointerCapture(e.pointerId);
    this.startX = e.clientX;
    this.startY = e.clientY;
  }

  _onPointerMove(e) {
    if (!this.isDragging || this._destroyed) return;
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    this.sword.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    this.targets.forEach(t => {
      const r = t.getBoundingClientRect();
      t.classList.toggle('hover',
        e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom);
    });
  }

  _onPointerUp(e) {
    if (!this.isDragging || this._destroyed) return;
    this.isDragging = false;

    let hit = null;
    this.targets.forEach(t => {
      const r = t.getBoundingClientRect();
      if (e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom) {
        hit = t;
      }
      t.classList.remove('hover');
    });

    if (hit) this._checkAnswer(hit);
    this.sword.style.transform = 'translate(-50%, -50%)';
  }
}
