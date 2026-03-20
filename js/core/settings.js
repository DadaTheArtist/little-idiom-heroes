const STORAGE_KEY = 'little-heroes-settings';

const DEFAULTS = {
  randomGameSelection: true,
  hintsEnabled: true,
  questionCountOverride: null,
  timerEnabled: true
};

export class Settings {
  constructor() {
    this.data = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.version === 1) return { ...DEFAULTS, ...parsed };
      }
    } catch (_) { /* ignore */ }
    return { version: 1, ...DEFAULTS };
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  get(key) {
    return this.data[key] ?? DEFAULTS[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  applyToChallenge(challenge) {
    const merged = { ...challenge };

    if (this.data.questionCountOverride != null) {
      merged.questionCount = this.data.questionCountOverride;
    }

    if (!this.data.timerEnabled) {
      delete merged.timeLimitSeconds;
    }

    return merged;
  }

  reset() {
    this.data = { version: 1, ...DEFAULTS };
    this.save();
  }
}
