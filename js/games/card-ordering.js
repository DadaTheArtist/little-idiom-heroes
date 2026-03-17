import { BaseGame } from './base-game.js';

/**
 * Ordering question game: arrange cards in the correct sequence.
 *
 * Expected question format:
 *   { prompt, correctOrder: string[] }
 *
 * After normalization by ContentLoader the question will also have
 *   type: 'ordering'
 */
export default class CardOrdering extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.currentIdx = 0;
    this.isProcessing = false;
    this.slots = [];
    this.dragSrcIdx = null;
  }

  init() {
    this.container.innerHTML = `
      <div class="order-game" id="order-root">
        <div class="order-header">
          <button class="back-btn" id="order-back" style="position:static;">←</button>
          <div class="order-info">
            <div>題目 <span id="order-progress">1 / ${this.totalQuestions}</span></div>
            <div>正確 <span id="order-correct">0</span></div>
          </div>
        </div>

        <div class="order-question" id="order-question">準備中…</div>

        <div class="order-slots-area">
          <div class="order-slot-numbers" id="order-numbers"></div>
          <div class="order-slots" id="order-slots"></div>
        </div>

        <button class="btn btn-gold order-submit-btn" id="order-submit" disabled>送出</button>

        <div class="order-effect-overlay" id="order-effect"></div>
        <div class="order-status" id="order-status"></div>
      </div>
    `;

    this.root = this.container.querySelector('#order-root');
    this.questionEl = this.container.querySelector('#order-question');
    this.progressEl = this.container.querySelector('#order-progress');
    this.correctEl = this.container.querySelector('#order-correct');
    this.numbersEl = this.container.querySelector('#order-numbers');
    this.slotsEl = this.container.querySelector('#order-slots');
    this.submitBtn = this.container.querySelector('#order-submit');
    this.effectEl = this.container.querySelector('#order-effect');
    this.statusEl = this.container.querySelector('#order-status');

    this.submitBtn.addEventListener('click', () => this._handleSubmit());

    this.container.querySelector('#order-back').addEventListener('click', () => {
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
    this.container.innerHTML = '';
  }

  _loadQuestion() {
    if (this._destroyed) return;
    if (this.currentIdx >= this.questions.length) {
      this._finish();
      return;
    }

    this.isProcessing = false;
    this.dragSrcIdx = null;
    const q = this.questions[this.currentIdx];
    const items = q.correctOrder || [];
    this.slots = this._shuffleArray([...items]);

    this.questionEl.textContent = q.prompt || q.hint || q.stem;
    this.progressEl.textContent = `${this.currentIdx + 1} / ${this.totalQuestions}`;
    this.correctEl.textContent = `${this.correctCount}`;
    this.submitBtn.disabled = false;
    this.effectEl.className = 'order-effect-overlay';
    this.statusEl.style.display = 'none';

    this.numbersEl.innerHTML = items.map((_, i) =>
      `<div class="order-number">${i + 1}</div>`
    ).join('');

    this._renderSlots();
  }

  _renderSlots() {
    this.slotsEl.innerHTML = this.slots.map((val, i) =>
      `<div class="order-card" data-idx="${i}" draggable="true">${val}</div>`
    ).join('');

    this.slotsEl.querySelectorAll('.order-card').forEach(card => {
      card.addEventListener('dragstart', (e) => this._onDragStart(e, card));
      card.addEventListener('dragover', (e) => e.preventDefault());
      card.addEventListener('drop', (e) => this._onDrop(e, card));
      card.addEventListener('dragend', () => this._onDragEnd());

      card.addEventListener('touchstart', (e) => this._onTouchStart(e, card), { passive: true });
      card.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
      card.addEventListener('touchend', (e) => this._onTouchEnd(e));
    });
  }

  _onDragStart(e, card) {
    if (this.isProcessing) return;
    this.dragSrcIdx = parseInt(card.dataset.idx);
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  _onDrop(e, card) {
    e.preventDefault();
    if (this.isProcessing || this.dragSrcIdx === null) return;
    const targetIdx = parseInt(card.dataset.idx);
    if (this.dragSrcIdx !== targetIdx) {
      const temp = this.slots[this.dragSrcIdx];
      this.slots[this.dragSrcIdx] = this.slots[targetIdx];
      this.slots[targetIdx] = temp;
      this._renderSlots();
    }
    this.dragSrcIdx = null;
  }

  _onDragEnd() {
    this.dragSrcIdx = null;
    this.slotsEl.querySelectorAll('.order-card').forEach(c => c.classList.remove('dragging'));
  }

  _onTouchStart(e, card) {
    if (this.isProcessing) return;
    this.dragSrcIdx = parseInt(card.dataset.idx);
    card.classList.add('dragging');
  }

  _onTouchMove(e) {
    if (this.dragSrcIdx === null) return;
    e.preventDefault();
  }

  _onTouchEnd(e) {
    if (this.isProcessing || this.dragSrcIdx === null) return;
    const touch = e.changedTouches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetCard = targetEl?.closest?.('.order-card');

    if (targetCard) {
      const targetIdx = parseInt(targetCard.dataset.idx);
      if (this.dragSrcIdx !== targetIdx) {
        const temp = this.slots[this.dragSrcIdx];
        this.slots[this.dragSrcIdx] = this.slots[targetIdx];
        this.slots[targetIdx] = temp;
        this._renderSlots();
      }
    }

    this.dragSrcIdx = null;
    this.slotsEl.querySelectorAll('.order-card').forEach(c => c.classList.remove('dragging'));
  }

  _handleSubmit() {
    if (this.isProcessing || this._destroyed) return;
    this.isProcessing = true;
    this.submitBtn.disabled = true;

    const q = this.questions[this.currentIdx];
    const correctOrder = q.correctOrder || [];
    const isCorrect = this.slots.length === correctOrder.length &&
      this.slots.every((val, i) => val === correctOrder[i]);

    this.slotsEl.querySelectorAll('.order-card').forEach((card, i) => {
      if (this.slots[i] === correctOrder[i]) {
        card.classList.add('slot-correct');
      } else {
        card.classList.add('slot-wrong');
      }
    });

    if (isCorrect) {
      this.correctCount++;
      this.correctEl.textContent = `${this.correctCount}`;
      this._showFireworks();
    } else {
      this._showSadFace(correctOrder);
    }

    this.currentIdx++;
    setTimeout(() => this._loadQuestion(), isCorrect ? 2200 : 3000);
  }

  _showFireworks() {
    this.effectEl.className = 'order-effect-overlay order-firework-fx';
    this.statusEl.textContent = '排列正確！🎆';
    this.statusEl.className = 'order-status order-status-success';
    this.statusEl.style.display = 'block';
  }

  _showSadFace(correctOrder) {
    this.effectEl.className = 'order-effect-overlay order-sad-fx';
    this.statusEl.innerHTML = `順序不對 😢<br><span class="order-status-answer">正確：${correctOrder.join(' → ')}</span>`;
    this.statusEl.className = 'order-status order-status-fail';
    this.statusEl.style.display = 'block';
  }
}
