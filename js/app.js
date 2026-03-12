import { ScreenManager } from './core/screen-manager.js';
import { AudioManager } from './core/audio-manager.js';
import { Progress } from './core/progress.js';
import { ContentLoader } from './core/content-loader.js';
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
    this.worldConfig = null;
  }

  async init() {
    try {
      this.worldConfig = await this.contentLoader.loadWorldConfig();
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

  async startLevel(levelConfig) {
    const content = await this.contentLoader.load(levelConfig.content);
    const questions = this.contentLoader.prepareQuestions(content, levelConfig.questionCount);

    const gameModules = {
      'boss-fight': './games/boss-fight.js',
      'racing': './games/racing.js',
      'match3': './games/match3.js',
      'connect': './games/connect.js'
    };

    const modulePath = gameModules[levelConfig.game];
    if (!modulePath) {
      console.error(`Unknown game type: ${levelConfig.game}`);
      return;
    }

    const module = await import(modulePath);
    const GameClass = module.default;

    this.container.innerHTML = '';
    const gameContainer = document.createElement('div');
    gameContainer.style.cssText = 'width:100%;height:100%;position:relative;';
    this.container.appendChild(gameContainer);

    const game = new GameClass(gameContainer, questions, {
      allQuestions: content.questions,
      levelConfig
    });

    game.onComplete((results) => {
      game.destroy();
      if (results.stars > 0) {
        this.progress.completeLevel(levelConfig.id, results.stars);
      }
      this.screenManager.switchTo('result', { results, levelConfig });
    });

    this.audioManager.playRandomBGM();
    game.init();
    game.start();
  }
}

const app = new App();
app.init();
