import { BaseGame } from './base-game.js';

/**
 * Multi-select question game: drag correct answers into lab equipment and submit.
 *
 * Expected question format:
 *   { prompt, correctAnswers: string[], options: string[] }
 *
 * After normalization by ContentLoader the question will also have
 *   type: 'multi-select'
 */
export default class LabExperiment extends BaseGame {
  constructor(container, questions, config) {
    super(container, questions, config);
    this.currentIdx = 0;
    this.isProcessing = false;
    this.selectedAnswers = new Set();
  }

  init() {
    this.container.innerHTML = `
      <div class="lab-game" id="lab-root">
        <div class="lab-header">
          <button class="back-btn" id="lab-back" style="position:static;">←</button>
          <div class="lab-info">
            <div>題目 <span id="lab-progress">1 / ${this.totalQuestions}</span></div>
            <div>成功 <span id="lab-correct">0</span></div>
          </div>
          ${this._createHintButton()}
        </div>

        <div class="lab-question" id="lab-question">準備中…</div>

        <div class="lab-scene">
          <div class="lab-equipment" id="lab-equipment">
            <div class="lab-beaker">🧪</div>
            <div class="lab-dropzone" id="lab-dropzone">
              <span class="lab-dropzone-hint">把答案拖到這裡</span>
            </div>
          </div>
        </div>

        <div class="lab-options-area">
          <div class="lab-options" id="lab-options"></div>
          <button class="btn btn-gold lab-submit-btn" id="lab-submit" disabled>送出</button>
        </div>

        <div class="lab-effect-overlay" id="lab-effect"></div>
        <div class="lab-status" id="lab-status"></div>
      </div>
    `;

    this.root = this.container.querySelector('#lab-root');
    this.questionEl = this.container.querySelector('#lab-question');
    this.progressEl = this.container.querySelector('#lab-progress');
    this.correctEl = this.container.querySelector('#lab-correct');
    this.optionsEl = this.container.querySelector('#lab-options');
    this.dropzone = this.container.querySelector('#lab-dropzone');
    this.submitBtn = this.container.querySelector('#lab-submit');
    this.effectEl = this.container.querySelector('#lab-effect');
    this.statusEl = this.container.querySelector('#lab-status');

    this.submitBtn.addEventListener('click', () => this._handleSubmit());

    this.container.querySelector('#lab-back').addEventListener('click', () => {
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
    if (this._destroyed) return;
    if (this.currentIdx >= this.questions.length) {
      this._finish();
      return;
    }

    this.isProcessing = false;
    this.selectedAnswers.clear();
    const q = this.questions[this.currentIdx];
    const correctCount = (q.correctAnswers || []).length;

    this.questionEl.textContent = q.prompt || q.hint || q.stem;
    this.progressEl.textContent = `${this.currentIdx + 1} / ${this.totalQuestions}`;
    this.correctEl.textContent = `${this.correctCount}`;

    this.dropzone.innerHTML = `<span class="lab-dropzone-hint">選 ${correctCount} 個答案</span>`;
    this.submitBtn.disabled = true;
    this.effectEl.className = 'lab-effect-overlay';
    this.statusEl.style.display = 'none';

    const options = this._shuffleArray([...(q.options || [])]);
    this.optionsEl.innerHTML = options.map(opt =>
      `<button class="lab-option" data-val="${opt}">${opt}</button>`
    ).join('');

    this.optionsEl.querySelectorAll('.lab-option').forEach(btn => {
      btn.addEventListener('click', () => this._toggleOption(btn, q));
    });
  }

  _toggleOption(btn, q) {
    if (this.isProcessing) return;
    const val = btn.dataset.val;
    const correctCount = (q.correctAnswers || []).length;

    if (btn.classList.contains('selected')) {
      btn.classList.remove('selected');
      this.selectedAnswers.delete(val);
    } else {
      if (this.selectedAnswers.size >= correctCount) return;
      btn.classList.add('selected');
      this.selectedAnswers.add(val);
    }

    this._updateDropzone();
    this.submitBtn.disabled = this.selectedAnswers.size !== correctCount;
  }

  _updateDropzone() {
    if (this.selectedAnswers.size === 0) {
      const q = this.questions[this.currentIdx];
      const correctCount = (q.correctAnswers || []).length;
      this.dropzone.innerHTML = `<span class="lab-dropzone-hint">選 ${correctCount} 個答案</span>`;
    } else {
      this.dropzone.innerHTML = [...this.selectedAnswers].map(a =>
        `<span class="lab-drop-tag">${a}</span>`
      ).join('');
    }
  }

  _handleSubmit() {
    if (this.isProcessing || this._destroyed) return;
    this.isProcessing = true;
    this.submitBtn.disabled = true;

    const q = this.questions[this.currentIdx];
    const correctSet = new Set(q.correctAnswers || []);
    const allCorrect = this.selectedAnswers.size === correctSet.size &&
      [...this.selectedAnswers].every(a => correctSet.has(a));

    this.optionsEl.querySelectorAll('.lab-option').forEach(btn => {
      btn.disabled = true;
      if (correctSet.has(btn.dataset.val)) {
        btn.classList.add('reveal-correct');
      } else if (btn.classList.contains('selected')) {
        btn.classList.add('reveal-wrong');
      }
    });

    if (allCorrect) {
      this.correctCount++;
      this.correctEl.textContent = `${this.correctCount}`;
      this._showSuccess();
    } else {
      this._showBurnt();
    }

    this.currentIdx++;
    setTimeout(() => this._loadQuestion(), allCorrect ? 2000 : 3800);
  }

  _showSuccess() {
    this.effectEl.className = 'lab-effect-overlay lab-success-fx';
    this.statusEl.textContent = '實驗成功！道具製作完成！';
    this.statusEl.className = 'lab-status lab-status-success';
    this.statusEl.style.display = 'block';
  }

  _showBurnt() {
    this.effectEl.className = 'lab-effect-overlay lab-burnt-fx';
    const q = this.questions[this.currentIdx - 1] || this.questions[this.currentIdx];
    const correctText = (q.correctAnswers || []).join('、');
    this.statusEl.innerHTML = `烤焦了！實驗失敗<br><span class="lab-status-answer">正確：${correctText}</span>`;
    this.statusEl.className = 'lab-status lab-status-fail';
    this.statusEl.style.display = 'block';
  }
}
