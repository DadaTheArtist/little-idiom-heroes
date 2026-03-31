import { BaseGame } from './base-game.js';

export default class MemoryFlip extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.pairs = [];
    this.cards = [];
    this.flippedCards = [];
    this.matchedCount = 0;
    this.moves = 0;
    this.isChecking = false;
    this.flipLockTimer = null;
  }

  init() {
    this.container.innerHTML = `
      <div class="memflip-game" id="memflip-root">
        <div class="memflip-header">
          <button class="back-btn" id="memflip-back" style="position:static;">←</button>
          <div class="memflip-info">
            <span>配對 <strong id="memflip-matched">0</strong>/<strong id="memflip-total">0</strong></span>
            <span>翻牌 <strong id="memflip-moves">0</strong></span>
          </div>
          ${this._createHintButton()}
        </div>
        <div class="memflip-title">翻開牌找出對應的題目與答案！</div>
        <div class="memflip-grid" id="memflip-grid"></div>
      </div>
    `;

    this.root = this.container.querySelector('#memflip-root');
    this.matchedEl = this.container.querySelector('#memflip-matched');
    this.totalEl = this.container.querySelector('#memflip-total');
    this.movesEl = this.container.querySelector('#memflip-moves');
    this.gridEl = this.container.querySelector('#memflip-grid');

    this.container.querySelector('#memflip-back').addEventListener('click', () => {
      this._clearTimers();
      this.destroy();
      this._onCompleteCb?.({
        correctCount: this.matchedCount,
        totalQuestions: this.totalQuestions,
        timeSpent: (Date.now() - this.startTime) / 1000,
        stars: 0
      });
    });

    this._bindHintButton();
    this._buildPairs();
    this._renderCards();
  }

  _buildPairs() {
    // Cap at 6 pairs for playability on small screens
    const usedQs = this.questions.slice(0, Math.min(this.questions.length, 6));
    this.pairs = usedQs.map((q, i) => ({
      pairId: i,
      question: q.hint || q.stem || q.prompt || q.answer,
      answer: String(q.answer)
    }));
    this.totalQuestions = this.pairs.length;
  }

  _renderCards() {
    const allCards = [];
    this.pairs.forEach(pair => {
      allCards.push({ pairId: pair.pairId, side: 'question', text: pair.question });
      allCards.push({ pairId: pair.pairId, side: 'answer',   text: pair.answer });
    });

    this.cards = this._shuffleArray(allCards);
    this.totalEl.textContent = this.pairs.length;
    this.matchedEl.textContent = 0;

    // Choose grid columns based on pair count
    const cols = this.pairs.length <= 4 ? 4 : this.pairs.length <= 6 ? 4 : 4;
    this.gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    this.gridEl.innerHTML = '';
    this.cards.forEach((card, idx) => {
      const el = document.createElement('div');
      el.className = 'memflip-card';
      el.dataset.cardIdx = idx;
      el.dataset.pairId = card.pairId;
      el.dataset.side = card.side;
      el.innerHTML = `
        <div class="memflip-card-inner">
          <div class="memflip-card-front">
            <span class="memflip-card-icon">${card.side === 'question' ? '❓' : '💡'}</span>
          </div>
          <div class="memflip-card-back">
            <span class="memflip-card-text">${card.text}</span>
          </div>
        </div>
      `;
      el.addEventListener('click', () => this._handleCardClick(el, card, idx));
      this.gridEl.appendChild(el);
    });
  }

  _getCurrentQuestion() {
    return this.questions[0] || null;
  }

  start() {
    super.start();
  }

  destroy() {
    this._destroyed = true;
    this._clearTimers();
    this.container.innerHTML = '';
  }

  _clearTimers() {
    if (this.flipLockTimer) { clearTimeout(this.flipLockTimer); this.flipLockTimer = null; }
  }

  _handleCardClick(el, card, idx) {
    if (this._destroyed || this.isChecking) return;
    if (el.classList.contains('flipped') || el.classList.contains('matched')) return;

    el.classList.add('flipped');
    this.flippedCards.push({ el, card, idx });

    if (this.flippedCards.length === 2) {
      this.moves++;
      this.movesEl.textContent = this.moves;
      this.isChecking = true;
      this.flipLockTimer = setTimeout(() => this._checkMatch(), 800);
    }
  }

  _checkMatch() {
    if (this._destroyed) return;
    const [a, b] = this.flippedCards;

    if (a.card.pairId === b.card.pairId && a.card.side !== b.card.side) {
      // Match!
      a.el.classList.add('matched');
      b.el.classList.add('matched');
      this.matchedCount++;
      this.correctCount = this.matchedCount;
      this.matchedEl.textContent = this.matchedCount;

      if (this.matchedCount >= this.pairs.length) {
        setTimeout(() => this._showComplete(), 400);
      }
    } else {
      // No match — flip back
      a.el.classList.remove('flipped');
      b.el.classList.remove('flipped');
      a.el.classList.add('mismatch');
      b.el.classList.add('mismatch');
      setTimeout(() => {
        if (!this._destroyed) {
          a.el.classList.remove('mismatch');
          b.el.classList.remove('mismatch');
        }
      }, 400);
    }

    this.flippedCards = [];
    this.isChecking = false;
  }

  _showComplete() {
    if (this._destroyed) return;
    const overlay = document.createElement('div');
    overlay.className = 'memflip-complete-overlay';
    overlay.innerHTML = `
      <div class="memflip-complete-box">
        <div class="memflip-complete-icon">🎉</div>
        <div class="memflip-complete-text">全部配對成功！</div>
        <div class="memflip-complete-sub">翻牌次數：${this.moves}</div>
        <button class="btn btn-gold" id="memflip-done">繼續</button>
      </div>
    `;
    this.root.appendChild(overlay);
    overlay.querySelector('#memflip-done').addEventListener('click', () => {
      this.totalQuestions = this.pairs.length;
      this.correctCount = this.matchedCount;
      this._finish();
    });
  }
}
