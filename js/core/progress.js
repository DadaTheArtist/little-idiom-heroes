const STORAGE_KEY = 'little-heroes-progress';

export class Progress {
  constructor() {
    this.data = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.version === 1) return parsed;
      }
    } catch (_) { /* ignore */ }
    return { version: 1, levels: {}, totalStars: 0 };
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  completeLevel(levelId, stars) {
    const prev = this.data.levels[levelId];
    const bestStars = prev?.completed ? Math.max(prev.stars, stars) : stars;
    this.data.levels[levelId] = { completed: true, stars: bestStars };
    this._recalcTotalStars();
    this.save();
  }

  isCompleted(levelId) {
    return !!this.data.levels[levelId]?.completed;
  }

  getStars(levelId) {
    return this.data.levels[levelId]?.stars || 0;
  }

  isUnlocked(levelId, unlockRequire) {
    if (!unlockRequire) return true;
    return this.isCompleted(unlockRequire);
  }

  _recalcTotalStars() {
    this.data.totalStars = Object.values(this.data.levels)
      .reduce((sum, l) => sum + (l.stars || 0), 0);
  }

  getTotalStars() {
    return this.data.totalStars;
  }

  reset() {
    this.data = { version: 1, levels: {}, totalStars: 0 };
    this.save();
  }
}
