export class ContentLoader {
  constructor() {
    this.cache = {};
  }

  async load(path) {
    if (this.cache[path]) return this.cache[path];
    const resp = await fetch(`data/${path}`);
    if (!resp.ok) throw new Error(`Failed to load data/${path}`);
    const data = await resp.json();
    this.cache[path] = data;
    return data;
  }

  async loadWorldConfig() {
    return this.load('world-config.json');
  }

  async loadTextbooks() {
    return this.load('textbooks.json');
  }

  async loadAudioManifest() {
    return this.load('assets/audio-manifest.json');
  }

  async loadArtManifest() {
    return this.load('assets/art-manifest.json');
  }

  prepareQuestions(content, configOrCount) {
    const challenge = typeof configOrCount === 'object'
      ? configOrCount
      : { questionCount: configOrCount, questionType: 'choice' };
    const questionType = challenge.questionType || 'choice';
    const questionCount = challenge.questionCount || 10;

    const allQuestions = content.questions.map((q) => this._normalizeQuestion(q, questionType));
    const candidatePool = allQuestions.filter((q) => q.type === questionType);
    const sourcePool = candidatePool.length ? candidatePool : allQuestions;
    const selected = this._shuffleArray(sourcePool).slice(0, questionCount);

    const enriched = selected.map((q) => this._ensureOptions(q, allQuestions));
    return {
      questions: enriched,
      allQuestions
    };
  }

  _normalizeQuestion(q, fallbackType = 'choice') {
    const type = q.type || fallbackType;
    const prompt = q.prompt || q.hint || q.stem || '';
    const normalized = {
      ...q,
      type,
      prompt,
      stem: q.stem || prompt,
      hint: q.hint || prompt
    };

    if (type === 'true-false') {
      const boolAnswer = typeof q.answer === 'boolean'
        ? q.answer
        : ['true', 't', 'yes', 'y', '是', '對', '正確'].includes(String(q.answer).toLowerCase());
      normalized.answer = boolAnswer ? '是' : '否';
      normalized.options = ['是', '否'];
      return normalized;
    }

    if (type === 'fill-blank' && Array.isArray(q.acceptableAnswers) && q.acceptableAnswers.length) {
      normalized.answer = q.acceptableAnswers[0];
    }

    if (Array.isArray(q.choices) && q.choices.length) {
      normalized.options = [...q.choices];
    } else if (Array.isArray(q.options) && q.options.length) {
      normalized.options = [...q.options];
    }

    return normalized;
  }

  _ensureOptions(question, allQuestions) {
    if (question.type === 'true-false') return question;

    const existing = Array.isArray(question.options) ? [...question.options] : [];
    const options = [...new Set([question.answer, ...existing])];
    if (options.length >= 4) {
      return { ...question, options: this._shuffleArray(options).slice(0, 4) };
    }

    const distractors = this._shuffleArray(
      allQuestions
        .map((q) => q.answer)
        .filter((answer) => answer && answer !== question.answer)
    );

    for (const d of distractors) {
      if (!options.includes(d)) options.push(d);
      if (options.length >= 4) break;
    }

    return { ...question, options: this._shuffleArray(options) };
  }

  _shuffleArray(arr) {
    const copied = [...arr];
    for (let i = copied.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copied[i], copied[j]] = [copied[j], copied[i]];
    }
    return copied;
  }
}
