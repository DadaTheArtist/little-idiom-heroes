import { BaseGame } from './base-game.js';

const MAX_LIVES = 3;
const GRID_SIZE = 7;
const DIRECTIONS = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 }
};
const KEY_DIRECTIONS = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right'
};
const CORRECT_DELAY = 900;
const WRONG_DELAY = 1700;
const FEEDBACK_DURATION = 1200;
const MAZE_LAYOUTS = [
  {
    start: { row: 3, col: 3 },
    walls: [
      [1, 1], [1, 2], [1, 5],
      [2, 4],
      [3, 1], [3, 5],
      [4, 2],
      [5, 1], [5, 4], [5, 5]
    ],
    gates: [
      { row: 0, col: 3 },
      { row: 3, col: 6 },
      { row: 6, col: 3 },
      { row: 3, col: 0 }
    ]
  },
  {
    start: { row: 3, col: 3 },
    walls: [
      [0, 2], [1, 4],
      [2, 1], [2, 2], [2, 5],
      [4, 1], [4, 4], [4, 5],
      [5, 2], [6, 4]
    ],
    gates: [
      { row: 0, col: 0 },
      { row: 0, col: 6 },
      { row: 6, col: 6 },
      { row: 6, col: 0 }
    ]
  }
];

export default class MazeRunner extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.currentIdx = 0;
    this.lives = MAX_LIVES;
    this.layoutIdx = 0;
    this.layout = null;
    this.heroPos = { row: 0, col: 0 };
    this.gates = [];
    this.wallKeys = new Set();
    this.isProcessing = false;
    this.feedbackTimer = null;
    this.resolveTimer = null;
    this.backBtn = null;
    this.controlHandlers = [];
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleBack = this._handleBack.bind(this);
  }

  init() {
    this.container.innerHTML = `
      <div class="maze-game" id="maze-root">
        <div class="maze-hud">
          <button class="back-btn" id="maze-back" style="position:static;">←</button>
          <div class="maze-hud-info">
            <span>題目 <strong id="maze-progress">1/${this.totalQuestions}</strong></span>
            <span>得分 <strong id="maze-score">0</strong></span>
          </div>
          <div class="maze-lives" id="maze-lives"></div>
          ${this._createHintButton()}
        </div>

        <div class="maze-question-panel">
          <div class="maze-question" id="maze-question">準備進入迷宮！</div>
        </div>

        <div class="maze-board" id="maze-board">
          <div class="maze-loading">迷宮準備中…</div>
        </div>

        <div class="maze-controls" aria-label="方向控制">
          <button class="maze-control maze-control-up" data-dir="up" aria-label="向上">▲</button>
          <button class="maze-control maze-control-left" data-dir="left" aria-label="向左">◀</button>
          <button class="maze-control maze-control-right" data-dir="right" aria-label="向右">▶</button>
          <button class="maze-control maze-control-down" data-dir="down" aria-label="向下">▼</button>
        </div>

        <div class="maze-feedback" id="maze-feedback"></div>
      </div>
    `;

    this.questionEl = this.container.querySelector('#maze-question');
    this.progressEl = this.container.querySelector('#maze-progress');
    this.scoreEl = this.container.querySelector('#maze-score');
    this.livesEl = this.container.querySelector('#maze-lives');
    this.boardEl = this.container.querySelector('#maze-board');
    this.feedbackEl = this.container.querySelector('#maze-feedback');

    this.backBtn = this.container.querySelector('#maze-back');
    this.backBtn.addEventListener('click', this._handleBack);

    this._bindHintButton();
    this.controlHandlers = [];
    this.container.querySelectorAll('.maze-control').forEach((btn) => {
      const handler = () => this._moveHero(btn.dataset.dir);
      btn.addEventListener('click', handler);
      this.controlHandlers.push({ btn, handler });
    });
    document.addEventListener('keydown', this._handleKeyDown);
    this._renderLives();
  }

  _handleBack() {
    this.destroy();
    this._onCompleteCb?.({
      correctCount: this.correctCount,
      totalQuestions: this.totalQuestions,
      timeSpent: (Date.now() - this.startTime) / 1000,
      stars: 0,
      wrongAnswers: [...this._wrongAnswers]
    });
  }

  _getCurrentQuestion() {
    return this.questions[this.currentIdx] || null;
  }

  start() {
    super.start();
    this._loadQuestion();
  }

  destroy() {
    document.removeEventListener('keydown', this._handleKeyDown);
    if (this.backBtn) this.backBtn.removeEventListener('click', this._handleBack);
    this.controlHandlers.forEach(({ btn, handler }) => {
      btn.removeEventListener('click', handler);
    });
    this.controlHandlers = [];
    clearTimeout(this.feedbackTimer);
    clearTimeout(this.resolveTimer);
    super.destroy();
  }

  _loadQuestion() {
    if (this._destroyed) return;

    const q = this._getCurrentQuestion();
    this.questionEl.textContent = q?.hint || q?.stem || q?.prompt || '準備進入迷宮！';
    this.progressEl.textContent = `${Math.min(this.currentIdx + 1, this.totalQuestions)}/${this.totalQuestions}`;
    this.scoreEl.textContent = this.correctCount;
    this.isProcessing = false;
    this._showFeedback('');
    this._setupMaze(q);
    this._renderBoard();
  }

  _setupMaze(q) {
    this.layout = MAZE_LAYOUTS[this.layoutIdx % MAZE_LAYOUTS.length];
    this.layoutIdx++;
    this.heroPos = { ...this.layout.start };
    this.wallKeys = new Set(this.layout.walls.map(([row, col]) => this._cellKey(row, col)));

    const options = this._buildOptions(q);
    this.gates = this.layout.gates.map((gate, idx) => ({
      ...gate,
      answer: options[idx] || '',
      state: ''
    }));
  }

  _buildOptions(q) {
    if (!q) return [];

    const answer = q.answer;
    const baseOptions = Array.isArray(q.options) && q.options.length
      ? [...q.options]
      : [answer, ...this._getDistractors(answer, 3)];
    const options = [];

    for (const opt of baseOptions) {
      if (opt == null || options.includes(opt)) continue;
      options.push(opt);
    }

    if (answer != null && !options.includes(answer)) {
      options.unshift(answer);
    }

    if (options.length < 4) {
      for (const opt of this._getDistractors(answer, 8)) {
        if (opt == null || options.includes(opt)) continue;
        options.push(opt);
        if (options.length >= 4) break;
      }
    }

    const pool = options.filter((opt) => opt !== answer);
    const selected = answer != null
      ? [answer, ...this._shuffleArray(pool).slice(0, 3)]
      : this._shuffleArray(pool).slice(0, 4);

    return this._shuffleArray(selected);
  }

  _renderBoard() {
    if (!this.boardEl || !this.layout) return;

    this.boardEl.innerHTML = '';
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = document.createElement('div');
        const gate = this._getGateAt(row, col);
        const hasHero = this.heroPos.row === row && this.heroPos.col === col;

        cell.className = 'maze-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;

        if (this._isWall(row, col)) {
          cell.classList.add('maze-cell-wall');
          cell.setAttribute('aria-label', '牆');
        } else if (gate) {
          cell.classList.add('maze-cell-gate');
          if (gate.state) cell.classList.add(`maze-cell-gate-${gate.state}`);
          cell.setAttribute('aria-label', `答案門：${gate.answer}`);

          const label = document.createElement('span');
          label.className = 'maze-gate-label';
          label.textContent = gate.answer;
          cell.appendChild(label);
        } else {
          cell.classList.add('maze-cell-floor');
        }

        if (hasHero) {
          const hero = document.createElement('span');
          hero.className = 'maze-hero';
          hero.setAttribute('aria-label', '勇者位置');
          hero.textContent = '勇';
          cell.appendChild(hero);
        }

        this.boardEl.appendChild(cell);
      }
    }
  }

  _moveHero(dir) {
    if (this._destroyed || this.isProcessing || !DIRECTIONS[dir]) return;

    const delta = DIRECTIONS[dir];
    const next = {
      row: this.heroPos.row + delta.row,
      col: this.heroPos.col + delta.col
    };

    if (!this._canMoveTo(next.row, next.col)) {
      this._showFeedback('走不通！');
      return;
    }

    this.heroPos = next;
    this._renderBoard();

    const gate = this._getGateAt(next.row, next.col);
    if (gate) {
      this._handleGate(gate);
    } else {
      this._showFeedback('');
    }
  }

  _canMoveTo(row, col) {
    return row >= 0
      && row < GRID_SIZE
      && col >= 0
      && col < GRID_SIZE
      && !this._isWall(row, col);
  }

  _handleGate(gate) {
    if (this.isProcessing || this._destroyed) return;

    const q = this._getCurrentQuestion();
    if (!q) return;

    this.isProcessing = true;
    const pickedAnswer = gate.answer;
    const isCorrect = String(pickedAnswer) === String(q.answer);

    if (isCorrect) {
      this.correctCount++;
      this.scoreEl.textContent = this.correctCount;
      gate.state = 'correct';
      this._showFeedback('答對了！');
    } else {
      this.lives = Math.max(0, this.lives - 1);
      this._recordWrong(q, pickedAnswer);
      this._renderLives();
      gate.state = 'wrong';
      const correctGate = this.gates.find((candidate) => String(candidate.answer) === String(q.answer));
      if (correctGate) correctGate.state = 'correct';
      this._showFeedback('答錯了，看看正確答案！');
    }

    this._renderBoard();
    this.currentIdx++;
    this._advanceAfter(isCorrect ? CORRECT_DELAY : WRONG_DELAY);
  }

  _advanceAfter(delay) {
    clearTimeout(this.resolveTimer);
    this.resolveTimer = setTimeout(() => {
      if (this._destroyed) return;
      if (this.lives <= 0 || this.currentIdx >= this.totalQuestions) {
        this._finish();
        return;
      }
      this._loadQuestion();
    }, delay);
  }

  _handleKeyDown(e) {
    const dir = KEY_DIRECTIONS[e.key];
    if (!dir) return;
    e.preventDefault();
    this._moveHero(dir);
  }

  _showFeedback(text) {
    clearTimeout(this.feedbackTimer);
    this.feedbackEl.textContent = text;

    if (text) {
      this.feedbackTimer = setTimeout(() => {
        if (!this._destroyed && this.feedbackEl.textContent === text) {
          this.feedbackEl.textContent = '';
        }
      }, FEEDBACK_DURATION);
    }
  }

  _getGateAt(row, col) {
    return this.gates.find((gate) => gate.row === row && gate.col === col) || null;
  }

  _isWall(row, col) {
    return this.wallKeys.has(this._cellKey(row, col));
  }

  _cellKey(row, col) {
    return `${row}:${col}`;
  }

  _renderLives() {
    if (!this.livesEl) return;
    this.livesEl.innerHTML = Array.from({ length: MAX_LIVES }, (_, i) =>
      `<span class="maze-heart${i >= this.lives ? ' empty' : ''}">❤</span>`
    ).join('');
  }
}
