import { ScreenManager } from './core/screen-manager.js';
import { AudioManager } from './core/audio-manager.js';
import { Progress } from './core/progress.js';
import { ContentLoader } from './core/content-loader.js';
import { GameRegistry } from './core/game-registry.js';
import { GameSelector } from './core/game-selector.js';
import { TitleScreen } from './screens/title-screen.js';
import { WorldMap } from './screens/world-map.js';
import { LevelIntro } from './screens/level-intro.js';
import { ResultScreen } from './screens/result-screen.js';

class App {
  constructor() {
    this.container = document.getElementById('app');
    this.screenManager = new ScreenManager(this.container);
    this.audioManager = new AudioManager();
    this.progress = new Progress();
    this.contentLoader = new ContentLoader();
    this.gameRegistry = new GameRegistry();
    this.gameSelector = new GameSelector(this.gameRegistry);
    this.worldConfig = null;
    this.textbookMap = new Map();
    this.artManifest = null;
  }

  async init() {
    try {
      const [worldConfig, textbooksData, audioManifest, artManifest] = await Promise.all([
        this.contentLoader.loadWorldConfig(),
        this.contentLoader.loadTextbooks(),
        this.contentLoader.loadAudioManifest(),
        this.contentLoader.loadArtManifest()
      ]);
      this.worldConfig = worldConfig;
      this.audioManager.setManifest(audioManifest);
      this.artManifest = artManifest;
      this.textbookMap = new Map(
        (textbooksData.textbooks || []).map((t) => [t.textbookId, t])
      );
    } catch (e) {
      this.container.innerHTML = `<div style="padding:40px;text-align:center;color:#ff6b6b;">
        <h2>載入失敗</h2><p>請使用本地伺服器開啟此頁面</p>
        <p style="font-size:13px;color:#888;margin-top:12px;">
          例如：npx serve 或 python -m http.server
        </p></div>`;
      return;
    }

    this.screenManager.register('title', new TitleScreen(this));
    this.screenManager.register('world-map', new WorldMap(this));
    this.screenManager.register('level-intro', new LevelIntro(this));
    this.screenManager.register('result', new ResultScreen(this));

    await this.screenManager.switchTo('title');
  }

  getTextbook(textbookId) {
    return this.textbookMap.get(textbookId) || null;
  }

  getGameMeta(gameId) {
    return this.gameRegistry.get(gameId);
  }

  peekGameForChallenge(challenge) {
    return this.gameSelector.peek(challenge);
  }

  getZoneArt(zoneId) {
    return this.artManifest?.zones?.[zoneId] || null;
  }

  async startLevel(runtimeConfig) {
    const challenge = runtimeConfig.challenge || runtimeConfig.level || runtimeConfig;
    const zone = runtimeConfig.zone || runtimeConfig.world || null;
    if (!challenge) return;

    const selectedGame = this.gameSelector.resolve(challenge);
    const content = await this.contentLoader.load(challenge.content);
    const prepared = this.contentLoader.prepareQuestions(content, challenge);
    const questions = prepared.questions;
    const allQuestions = prepared.allQuestions;

    const module = await import(selectedGame.modulePath);
    const GameClass = module.default;

    this.container.innerHTML = '';
    const gameContainer = document.createElement('div');
    gameContainer.style.cssText = 'width:100%;height:100%;position:relative;';
    this.container.appendChild(gameContainer);

    const game = new GameClass(gameContainer, questions, {
      allQuestions,
      challenge,
      zone,
      selectedGame,
      art: zone ? this.getZoneArt(zone.id) : null
    });

    game.onComplete((results) => {
      game.destroy();
      if (results.stars > 0 && challenge.id) {
        this.progress.completeLevel(challenge.id, results.stars);
      }
      this.screenManager.switchTo('result', {
        results,
        levelConfig: {
          challenge,
          zone,
          selectedGame
        }
      });
    });

    this.audioManager.playRandomBGM({ themeElement: zone?.themeElement });
    game.init();
    game.start();
  }
}

const app = new App();
app.init();
