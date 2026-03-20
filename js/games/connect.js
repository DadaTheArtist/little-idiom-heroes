import { BaseGame } from './base-game.js';

export default class Connect extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.cards = [];
    this.selected = [];
    this.matchedPairs = 0;
    this.totalPairs = questions.length;
    this.mistakes = 0;
    this.maxMistakes = questions.length;
    this.isProcessing = false;
  }

  _firstUnmatchedPairId() {
    const matchedIds = new Set();
    this.cards.forEach((c, i) => {
      const el = this.gridEl?.children[i];
      if (el?.classList.contains('matched')) matchedIds.add(c.pairId);
    });
    for (let i = 0; i < this.questions.length; i++) {
      if (!matchedIds.has(i)) return i;
    }
    return -1;
  }

  _clearPairHintHighlight() {
    this.gridEl?.querySelectorAll('.connect-hint-pair').forEach((el) => {
      el.classList.remove('connect-hint-pair');
    });
  }

  _showHint() {
    if (this._destroyed) return;
    if (this._hintModalEl) return;

    if (this._hintsRemaining <= 0) {
      this._showHintModal('本關提示已用完');
      return;
    }

    const pairId = this._firstUnmatchedPairId();
    if (pairId < 0) return;

    this._clearPairHintHighlight();

    const highlightEls = [];
    this.gridEl.querySelectorAll('.connect-card').forEach((el) => {
      const idx = parseInt(el.dataset.idx, 10);
      const card = this.cards[idx];
      if (card && card.pairId === pairId && !el.classList.contains('matched')) {
        highlightEls.push(el);
      }
    });

    if (highlightEls.length !== 2) return;

    highlightEls.forEach((el) => el.classList.add('connect-hint-pair'));

    this._hintsRemaining--;
    this._updateHintButton();
  }

  init() {
    const pairs = this.questions.length;
    const cols = pairs <= 4 ? 4 : 4;
    const totalCards = pairs * 2;
    const rows = Math.ceil(totalCards / cols);

    this.cards = [];
    this.questions.forEach((q, i) => {
      this.cards.push({ type: 'stem', text: q.stem, pairId: i });
      this.cards.push({ type: 'answer', text: q.answer, pairId: i });
    });
    this.cards = this._shuffleArray(this.cards);

    this.container.innerHTML = `
      <div class="connect-game" id="connect-root">
        <div class="connect-header">
          <button class="back-btn" id="cn-back" style="position:static;">←</button>
          <div class="connect-info">
            <div>配對 <span id="cn-matched">0</span>/${pairs}</div>
            <div id="cn-lives">${this._renderLives()}</div>
          </div>
          ${this._createHintButton()}
        </div>
        <div class="connect-hint">選擇題目與對應的答案進行配對</div>
        <div class="connect-grid-wrapper">
          <div class="connect-grid" id="cn-grid"
               style="grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr);">
          </div>
        </div>
      </div>
    `;

    this.gridEl = this.container.querySelector('#cn-grid');
    this.matchedEl = this.container.querySelector('#cn-matched');
    this.livesEl = this.container.querySelector('#cn-lives');

    this._renderCards();

    this.container.querySelector('#cn-back').addEventListener('click', () => {
      this.destroy();
      this._onCompleteCb?.({
        correctCount: this.correctCount,
        totalQuestions: this.totalQuestions,
        timeSpent: (Date.now() - this.startTime) / 1000,
        stars: 0
      });
    });

    this._bindHintButton();
  }

  _getCurrentQuestion() {
    const matchedIds = new Set();
    this.cards.forEach((c, i) => {
      const el = this.gridEl?.children[i];
      if (el?.classList.contains('matched')) matchedIds.add(c.pairId);
    });
    return this.questions.find((_, i) => !matchedIds.has(i)) || this.questions[0] || null;
  }

  start() {
    super.start();
  }

  destroy() {
    this._destroyed = true;
    this.container.innerHTML = '';
  }

  _renderLives() {
    const remaining = this.maxMistakes - this.mistakes;
    return '❤️'.repeat(remaining) + '🖤'.repeat(this.mistakes);
  }

  _renderCards() {
    this.gridEl.innerHTML = this.cards.map((card, idx) => `
      <div class="connect-card" data-idx="${idx}">
        <div class="connect-card-body">
          <span class="connect-card-text">${card.text}</span>
        </div>
      </div>
    `).join('');

    this._autoFitCardText();

    this.gridEl.querySelectorAll('.connect-card').forEach(el => {
      el.addEventListener('click', () => this._handleCardClick(el));
    });
  }

  _autoFitCardText() {
    this.gridEl.querySelectorAll('.connect-card-text').forEach(el => {
      const parent = el.closest('.connect-card-body');
      if (!parent) return;
      const availH = parent.clientHeight - 8;
      const availW = parent.clientWidth - 8;
      const lineHeight = 1.25;
      const targetLines = 3;
      let size = Math.floor(availH / (targetLines * lineHeight));
      size = Math.min(size, 14);
      const minSize = 7;
      el.style.fontSize = `${size}px`;
      while (size > minSize && (el.scrollHeight > availH || el.scrollWidth > availW)) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    });
  }

  _handleCardClick(el) {
    if (this.isProcessing || this._destroyed) return;
    const idx = parseInt(el.dataset.idx);

    if (el.classList.contains('matched')) return;

    if (el.classList.contains('selected')) {
      el.classList.remove('selected');
      this.selected = this.selected.filter(s => s.idx !== idx);
      return;
    }

    if (this.selected.length >= 2) return;

    el.classList.add('selected');
    this.selected.push({ idx, el, card: this.cards[idx] });

    if (this.selected.length === 2) {
      this.isProcessing = true;
      setTimeout(() => this._checkMatch(), 300);
    }
  }

  _checkMatch() {
    this._clearPairHintHighlight();

    const [a, b] = this.selected;
    const isMatch = a.card.pairId === b.card.pairId && a.card.type !== b.card.type;

    if (isMatch) {
      this.matchedPairs++;
      this.correctCount++;
      this.matchedEl.textContent = this.matchedPairs;

      a.el.classList.add('matched');
      b.el.classList.add('matched');
      a.el.classList.remove('selected');
      b.el.classList.remove('selected');
      this.selected = [];
      this.isProcessing = false;

      if (this.matchedPairs >= this.totalPairs) {
        setTimeout(() => this._finish(), 600);
      }
    } else {
      this.mistakes++;
      this.livesEl.innerHTML = this._renderLives();

      a.el.classList.add('wrong');
      b.el.classList.add('wrong');

      setTimeout(() => {
        a.el.classList.remove('selected', 'wrong');
        b.el.classList.remove('selected', 'wrong');
        this.selected = [];
        this.isProcessing = false;

        if (this.mistakes >= this.maxMistakes) {
          this._showGameOver();
        }
      }, 800);
    }
  }

  _showGameOver() {
    const overlay = document.createElement('div');
    overlay.className = 'connect-gameover';
    overlay.innerHTML = `
      <div class="connect-gameover-box">
        <div class="connect-gameover-icon">💔</div>
        <div class="connect-gameover-title">挑戰失敗</div>
        <div class="connect-gameover-subtitle">已用完所有機會</div>
        <button class="btn btn-gold connect-gameover-btn" id="cn-retry">再試一次</button>
      </div>
    `;
    this.container.querySelector('#connect-root').appendChild(overlay);

    overlay.querySelector('#cn-retry').addEventListener('click', () => {
      this._retry();
    });
  }

  _retry() {
    this.matchedPairs = 0;
    this.mistakes = 0;
    this.correctCount = 0;
    this.selected = [];
    this.isProcessing = false;
    this.cards = this._shuffleArray(this.cards);
    this.startTime = Date.now();

    this.matchedEl.textContent = '0';
    this.livesEl.innerHTML = this._renderLives();

    const overlay = this.container.querySelector('.connect-gameover');
    if (overlay) overlay.remove();

    this._renderCards();
  }
}
