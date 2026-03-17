const GAME_DEFINITIONS = [
  {
    gameId: 'boss-fight',
    displayName: '魔王戰',
    icon: '⚔️',
    description: '拖動寶劍攻擊魔王，答對扣血、答錯反擊。',
    modulePath: './games/boss-fight.js',
    supportsQuestionTypes: ['choice', 'true-false'],
    supportsAnswerModes: ['drag-select', 'tap-select'],
    weight: 1
  },
  {
    gameId: 'racing',
    displayName: '賽車問答',
    icon: '🏎️',
    description: '答對加速前進，率先衝線就獲勝。',
    modulePath: './games/racing.js',
    supportsQuestionTypes: ['choice', 'true-false'],
    supportsAnswerModes: ['tap-select'],
    weight: 1
  },
  {
    gameId: 'match3',
    displayName: '寶石消除',
    icon: '💎',
    description: '在棋盤中找出正確答案並消除。',
    modulePath: './games/match3.js',
    supportsQuestionTypes: ['choice'],
    supportsAnswerModes: ['tap-select'],
    weight: 1
  },
  {
    gameId: 'connect',
    displayName: '連連看',
    icon: '🃏',
    description: '把題目與答案正確配對，完成所有組合。',
    modulePath: './games/connect.js',
    supportsQuestionTypes: ['choice', 'fill-blank'],
    supportsAnswerModes: ['pair-select', 'tap-select'],
    weight: 1
  },
  {
    gameId: 'bomb-defusal',
    displayName: '拆彈專家',
    icon: '💣',
    description: '判斷是非，拆除炸彈！答對警報解除，答錯就爆炸。',
    modulePath: './games/bomb-defusal.js',
    supportsQuestionTypes: ['true-false'],
    supportsAnswerModes: ['tap-select'],
    weight: 1
  },
  {
    gameId: 'lab-experiment',
    displayName: '實驗室',
    icon: '🧪',
    description: '把正確答案拖進實驗設備，成功製作道具！',
    modulePath: './games/lab-experiment.js',
    supportsQuestionTypes: ['multi-select'],
    supportsAnswerModes: ['multi-select'],
    weight: 1
  },
  {
    gameId: 'card-ordering',
    displayName: '排排站',
    icon: '🃏',
    description: '把答案排列成正確順序，成功就放煙火！',
    modulePath: './games/card-ordering.js',
    supportsQuestionTypes: ['ordering'],
    supportsAnswerModes: ['ordering'],
    weight: 1
  }
];

export class GameRegistry {
  constructor(definitions = GAME_DEFINITIONS) {
    this.definitions = definitions;
    this.byId = new Map(definitions.map((def) => [def.gameId, def]));
  }

  get(gameId) {
    return this.byId.get(gameId) || null;
  }

  all() {
    return [...this.definitions];
  }

  getCompatible(questionType, answerMode, candidateGameIds = null) {
    const pool = candidateGameIds?.length
      ? candidateGameIds.map((id) => this.get(id)).filter(Boolean)
      : this.all();

    return pool.filter((def) => {
      const typeOk = !questionType || def.supportsQuestionTypes.includes(questionType);
      const answerModeOk = !answerMode || def.supportsAnswerModes.includes(answerMode);
      return typeOk && answerModeOk;
    });
  }
}

