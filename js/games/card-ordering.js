import { BaseGame } from './base-game.js';

/**
 * Ordering question game: tap answer cards to place them into numbered slots.
 *
 * Interaction:
 *   1. Answer cards are shown shuffled in a pool at the top.
 *   2. Player taps a card to "select" it (highlighted).
 *   3. Then taps a numbered slot to place it there.
 *   4. Tapping an occupied slot removes the card back to the pool.
 *   5. When all slots are filled, submit button activates.
 *
 * Expected question format: { prompt, correctOrder: string[] }
 */
export default class CardOrdering extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.currentIdx = 0;
    this.isProcessing = false;
    this.slotContents = [];   // what's in each numbered slot (null if empty)
    this.selectedCard = null; // { val, poolIdx } — the card currently selected from pool
    this.poolItems = [];      // shuffled items not yet placed
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

        <div class="order-pool-area">
          <div class="order-pool-label">答案卡片（點選後放入格子）</div>
          <div class="order-pool" id="order-pool"></div>
        </div>

        <div class="order-slots-area" id="order-slots-area"></div>

        <button class="btn btn-gold order-submit-btn" id="order-submit" disabled>送出</button>

        <div class="order-effect-overlay" id="order-effect"></div>
        <div class="order-status" id="order-status"></div>
      </div>
    `;

    this.root = this.container.querySelector('#order-root');
    this.questionEl = this.container.querySelector('#order-question');
    this.progressEl = this.container.querySelector('#order-progress');
    this.correctEl = this.container.querySelector('#order-correct');
    this.poolEl = this.container.querySelector('#order-pool');
    this.slotsAreaEl = this.container.querySelector('#order-slots-area');
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
    this.selectedCard = null;
    const q = this.questions[this.currentIdx];
    const items = q.correctOrder || [];

    this.slotContents = new Array(items.length).fill(null);
    this.poolItems = this._shuffleArray([...items]);

    this.questionEl.textContent = q.prompt || q.hint || q.stem;
    this.progressEl.textContent = `${this.currentIdx + 1} / ${this.totalQuestions}`;
    this.correctEl.textContent = `${this.correctCount}`;
    this.submitBtn.disabled = true;
    this.effectEl.className = 'order-effect-overlay';
    this.statusEl.style.display = 'none';

    this._renderPool();
    this._renderSlots();
  }

  _renderPool() {
    this.poolEl.innerHTML = this.poolItems.map((val, i) => {
      if (val === null) {
        return `<div class="order-pool-placeholder" data-pool-idx="${i}"></div>`;
      }
      const isSelected = this.selectedCard?.poolIdx === i;
      return `<button class="order-pool-card${isSelected ? ' selected' : ''}" data-pool-idx="${i}">${val}</button>`;
    }).join('');

    this.poolEl.querySelectorAll('.order-pool-card').forEach(btn => {
      btn.addEventListener('click', () => this._onPoolCardClick(parseInt(btn.dataset.poolIdx)));
    });
  }

  _renderSlots() {
    const n = this.slotContents.length;
    this.slotsAreaEl.innerHTML = this.slotContents.map((val, i) => {
      const filled = val !== null;
      return `
        <div class="order-slot-row">
          <div class="order-slot-number">${i + 1}</div>
          <button class="order-slot${filled ? ' filled' : ''}${this.selectedCard && !filled ? ' droppable' : ''}" data-slot-idx="${i}">
            ${filled ? `<span class="order-slot-text">${val}</span><span class="order-slot-remove">✕</span>` : '<span class="order-slot-hint">點此放入</span>'}
          </button>
        </div>
      `;
    }).join('');

    this.slotsAreaEl.querySelectorAll('.order-slot').forEach(btn => {
      btn.addEventListener('click', () => this._onSlotClick(parseInt(btn.dataset.slotIdx)));
    });
  }

  _onPoolCardClick(poolIdx) {
    if (this.isProcessing) return;
    const val = this.poolItems[poolIdx];
    if (val === null) return;

    if (this.selectedCard?.poolIdx === poolIdx) {
      this.selectedCard = null;
    } else {
      this.selectedCard = { val, poolIdx };
    }

    this._renderPool();
    this._renderSlots();
  }

  _onSlotClick(slotIdx) {
    if (this.isProcessing) return;
    const currentVal = this.slotContents[slotIdx];

    if (currentVal !== null) {
      // Remove from slot back to pool
      const emptyIdx = this.poolItems.indexOf(null);
      if (emptyIdx !== -1) {
        this.poolItems[emptyIdx] = currentVal;
      } else {
        this.poolItems.push(currentVal);
      }
      this.slotContents[slotIdx] = null;
      if (this.selectedCard === null) {
        // Just removing; no card selected
      }
    } else if (this.selectedCard !== null) {
      // Place selected card into slot
      this.slotContents[slotIdx] = this.selectedCard.val;
      this.poolItems[this.selectedCard.poolIdx] = null;
      this.selectedCard = null;
    } else {
      return;
    }

    this.submitBtn.disabled = this.slotContents.some(v => v === null);
    this._renderPool();
    this._renderSlots();
  }

  _handleSubmit() {
    if (this.isProcessing || this._destroyed) return;
    this.isProcessing = true;
    this.submitBtn.disabled = true;

    const q = this.questions[this.currentIdx];
    const correctOrder = q.correctOrder || [];
    const isCorrect = this.slotContents.length === correctOrder.length &&
      this.slotContents.every((val, i) => val === correctOrder[i]);

    // Re-render slots with correct/wrong highlights
    this.slotsAreaEl.innerHTML = this.slotContents.map((val, i) => {
      const ok = val === correctOrder[i];
      return `
        <div class="order-slot-row">
          <div class="order-slot-number">${i + 1}</div>
          <div class="order-slot filled ${ok ? 'slot-correct' : 'slot-wrong'}">
            <span class="order-slot-text">${val ?? ''}</span>
          </div>
        </div>
      `;
    }).join('');

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
