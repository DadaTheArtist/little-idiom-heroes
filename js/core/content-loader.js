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

  prepareQuestions(content, count) {
    const shuffled = [...content.questions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    return selected.map(q => {
      if (q.options && q.options.length >= 3) return q;
      const others = content.questions
        .filter(o => o.answer !== q.answer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(o => o.answer);
      return { ...q, options: [q.answer, ...others].sort(() => Math.random() - 0.5) };
    });
  }
}
