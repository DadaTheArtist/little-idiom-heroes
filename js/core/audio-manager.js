export class AudioManager {
  constructor() {
    this.bgm = new Audio();
    this.bgm.loop = true;
    this.bgmVolume = 0.5;
    this.bgm.volume = this.bgmVolume;
    this.audioManifest = null;
  }

  setManifest(manifest) {
    this.audioManifest = manifest || null;
  }

  playBGM(src) {
    if (this.bgm.src && this.bgm.src.endsWith(src)) return;
    this.bgm.src = src;
    this.bgm.currentTime = 0;
    this.bgm.play().catch(() => {});
  }

  playRandomBGM(context = {}) {
    const list = this.audioManifest?.bgm;
    if (Array.isArray(list) && list.length) {
      const tagged = context.themeElement
        ? list.filter((item) => item.tags?.includes(context.themeElement))
        : [];
      const pool = tagged.length ? tagged : list;
      const choice = pool[Math.floor(Math.random() * pool.length)];
      if (choice?.src) {
        this.playBGM(choice.src);
        return;
      }
    }

    const num = Math.floor(Math.random() * 3) + 1;
    this.playBGM(`audio/bgm-${num}.mp3`);
  }

  stopBGM() {
    this.bgm.pause();
    this.bgm.currentTime = 0;
  }

  setVolume(v) {
    this.bgmVolume = v;
    this.bgm.volume = v;
  }
}
