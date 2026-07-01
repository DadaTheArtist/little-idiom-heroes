import { ScreenManager } from './core/screen-manager.js';
import { AudioManager } from './core/audio-manager.js';
import { Progress } from './core/progress.js';
import { Settings } from './core/settings.js';
import { ContentLoader } from './core/content-loader.js';
import { GameRegistry } from './core/game-registry.js';
import { GameSelector } from './core/game-selector.js';
import { TitleScreen } from './screens/title-screen.js';
import { TextbookSelect } from './screens/textbook-select.js';
import { WorldMap } from './screens/world-map.js';
import { LevelIntro } from './screens/level-intro.js';
import { ResultScreen } from './screens/result-screen.js';
import { WrongAnswerReview } from './screens/wrong-answer-review.js';
import { SettingsScreen } from './screens/settings-screen.js';
import { ContentReview } from './screens/content-review.js';
import { ExamPracticeScreen } from './screens/exam-practice-screen.js';
import { GameTestScreen } from './screens/game-test-screen.js';

class App {
  constructor() {
    this.container = document.getElementById('app');
    this.screenManager = new ScreenManager(this.container);
    this.audioManager = new AudioManager();
    this.progress = new Progress();
    this.settings = new Settings();
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
    this.screenManager.register('textbook-select', new TextbookSelect(this));
    this.screenManager.register('world-map', new WorldMap(this));
    this.screenManager.register('level-intro', new LevelIntro(this));
    this.screenManager.register('result', new ResultScreen(this));
    this.screenManager.register('wrong-answer-review', new WrongAnswerReview(this));
    this.screenManager.register('settings', new SettingsScreen(this));
    this.screenManager.register('content-review', new ContentReview(this));
    this.screenManager.register('exam-practice', new ExamPracticeScreen(this));
    this.screenManager.register('game-test', new GameTestScreen(this));

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
    const rawChallenge = runtimeConfig.challenge || runtimeConfig.level || runtimeConfig;
    const zone = runtimeConfig.zone || runtimeConfig.world || null;
    if (!rawChallenge) return;

    const challenge = this.settings.applyToChallenge(rawChallenge);
    const selectedGame = this.gameSelector.resolve(challenge, {
      randomEnabled: this.settings.get('randomGameSelection')
    });
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
      art: zone ? this.getZoneArt(zone.id) : null,
      hintsEnabled: this.settings.get('hintsEnabled')
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

  async startExamPractice(challenge) {
    if (!challenge) return;

    // Apply only timer setting — never apply questionCountOverride for exam practice
    const examChallenge = { ...challenge };
    if (!this.settings.get('timerEnabled')) {
      delete examChallenge.timeLimitSeconds;
    }
    if (this.settings.get('examPracticeFullBank')) {
      examChallenge.ordered = true;
    }

    const selectedGame = this.gameSelector.resolve(examChallenge, { randomEnabled: false });
    const content = await this.contentLoader.load(examChallenge.content);
    const prepared = this.contentLoader.prepareQuestions(content, examChallenge);
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
      challenge: examChallenge,
      zone: null,
      selectedGame,
      art: null,
      hintsEnabled: false
    });

    game.onComplete((results) => {
      game.destroy();
      // Intentionally no this.progress.completeLevel() — practice never saves progress
      this.screenManager.switchTo('result', {
        results,
        levelConfig: {
          challenge: examChallenge,
          zone: null,
          selectedGame,
          isExamPractice: true
        }
      });
    });

    this.audioManager.playRandomBGM({ themeElement: null });
    game.init();
    game.start();
  }

  async startGameTest(gameId) {
    const selectedGame = this.gameRegistry.get(gameId);
    if (!selectedGame) throw new Error(`Unknown test game: ${gameId}`);

    const challenge = this._buildGameTestChallenge(selectedGame);
    const content = { questions: this._getGameTestQuestions(challenge.questionType) };
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
      zone: null,
      selectedGame,
      art: null,
      hintsEnabled: true
    });

    game.onComplete((results) => {
      game.destroy();
      this.screenManager.switchTo('result', {
        results,
        levelConfig: {
          challenge,
          zone: null,
          selectedGame,
          isGameTest: true
        }
      });
    });

    this.audioManager.playRandomBGM({ themeElement: null });
    game.init();
    game.start();
  }

  _buildGameTestChallenge(gameDef) {
    const questionType = gameDef.supportsQuestionTypes.find((type) =>
      Object.prototype.hasOwnProperty.call(this._gameTestQuestionSets, type)
    );
    if (!questionType) {
      throw new Error(`${gameDef.displayName} 尚無測試題型`);
    }

    const answerMode = gameDef.supportsAnswerModes[0] || 'tap-select';
    return {
      id: `test-${gameDef.gameId}`,
      name: `${gameDef.displayName}測試`,
      selectionMode: 'fixed',
      gameId: gameDef.gameId,
      questionType,
      answerMode,
      content: '__game-test__',
      questionCount: this._gameTestQuestionSets[questionType].length
    };
  }

  get _gameTestQuestionSets() {
    return {
      choice: [
        { id: 'test-choice-1', type: 'choice', stem: '形容非常專心', hint: '他讀書時總是 _____。', answer: '全神貫注', options: ['全神貫注', '東張西望', '半途而廢', '心不在焉'], playerHint: '全部精神都集中在一件事上' },
        { id: 'test-choice-2', type: 'choice', stem: '5 × 6 = ?', answer: '30', options: ['30', '25', '35', '56'], playerHint: '五六三十' },
        { id: 'test-choice-3', type: 'choice', stem: '水受熱後較容易變成什麼？', answer: '水蒸氣', options: ['水蒸氣', '冰塊', '沙子', '金屬'], playerHint: '想想燒開水冒出的白煙' },
        { id: 'test-choice-4', type: 'choice', stem: '形容做事有開始也有結束', answer: '有始有終', options: ['有始有終', '虎頭蛇尾', '三心二意', '手忙腳亂'], playerHint: '開始和結束都完成' },
        { id: 'test-choice-5', type: 'choice', stem: '100 - 37 = ?', answer: '63', options: ['63', '73', '67', '53'], playerHint: '先減 30，再減 7' },
        { id: 'test-choice-6', type: 'choice', stem: '植物需要哪一項幫助生長？', answer: '陽光', options: ['陽光', '塑膠', '汽油', '鐵釘'], playerHint: '植物行光合作用需要它' }
      ],
      'true-false': [
        { id: 'test-tf-1', type: 'true-false', prompt: '25 × 4 等於 100。', answer: true, playerHint: '25 的四倍是多少？' },
        { id: 'test-tf-2', type: 'true-false', prompt: '冰遇熱一定會變成石頭。', answer: false, playerHint: '冰遇熱會融化' },
        { id: 'test-tf-3', type: 'true-false', prompt: '三角形內角和是 180 度。', answer: true, playerHint: '這是幾何常識' },
        { id: 'test-tf-4', type: 'true-false', prompt: '植物完全不需要水。', answer: false, playerHint: '植物生長需要水分' },
        { id: 'test-tf-5', type: 'true-false', prompt: '7 × 8 等於 56。', answer: true, playerHint: '七八五十六' },
        { id: 'test-tf-6', type: 'true-false', prompt: '「全神貫注」表示很分心。', answer: false, playerHint: '全神貫注是專心' }
      ],
      'fill-blank': [
        { id: 'test-fill-1', type: 'fill-blank', stem: '全神貫注', hint: '形容非常專心', answer: '全神貫注', playerHint: '精神集中' },
        { id: 'test-fill-2', type: 'fill-blank', stem: '有始有終', hint: '做事開始和結束都完成', answer: '有始有終', playerHint: '不是半途而廢' },
        { id: 'test-fill-3', type: 'fill-blank', stem: '水蒸氣', hint: '水受熱後形成的氣體', answer: '水蒸氣', playerHint: '燒水會看到' },
        { id: 'test-fill-4', type: 'fill-blank', stem: '陽光', hint: '植物行光合作用需要', answer: '陽光', playerHint: '白天來自太陽' },
        { id: 'test-fill-5', type: 'fill-blank', stem: '63', hint: '100 - 37 的答案', answer: '63', playerHint: '先減 30 再減 7' },
        { id: 'test-fill-6', type: 'fill-blank', stem: '180度', hint: '三角形內角和', answer: '180度', playerHint: '三角形三個角相加' }
      ],
      'multi-select': [
        { id: 'test-multi-1', type: 'multi-select', prompt: '哪些是植物生長需要的條件？', correctAnswers: ['陽光', '水分'], options: ['陽光', '水分', '汽油', '塑膠'], playerHint: '想想植物活著需要什麼' },
        { id: 'test-multi-2', type: 'multi-select', prompt: '哪些算是正確的學習態度？', correctAnswers: ['專心', '複習'], options: ['專心', '複習', '亂猜', '放棄'], playerHint: '有助於把知識記牢' },
        { id: 'test-multi-3', type: 'multi-select', prompt: '哪些答案等於 12？', correctAnswers: ['6+6', '3×4'], options: ['6+6', '3×4', '5+5', '2×5'], playerHint: '算算每個式子' }
      ],
      ordering: [
        { id: 'test-order-1', type: 'ordering', prompt: '把植物成長順序排好', correctOrder: ['種子', '發芽', '幼苗', '開花'], playerHint: '從種子開始' },
        { id: 'test-order-2', type: 'ordering', prompt: '把數字由小到大排列', correctOrder: ['3', '8', '12', '20'], playerHint: '由小到大' },
        { id: 'test-order-3', type: 'ordering', prompt: '把水的加熱變化排好', correctOrder: ['冷水', '溫水', '熱水', '水蒸氣'], playerHint: '溫度越來越高' }
      ]
    };
  }

  _getGameTestQuestions(questionType) {
    return this._gameTestQuestionSets[questionType] || [];
  }
}

const app = new App();
app.init();
