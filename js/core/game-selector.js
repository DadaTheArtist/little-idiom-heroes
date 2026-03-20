export class GameSelector {
  constructor(gameRegistry) {
    this.gameRegistry = gameRegistry;
  }

  resolve(challenge, options = {}) {
    const { selectionMode, gameId, candidateGameIds, questionType, answerMode } = challenge;
    const randomEnabled = options.randomEnabled !== false;

    if (selectionMode === 'fixed') {
      const fixed = this.gameRegistry.get(gameId);
      if (!fixed) {
        throw new Error(`Unknown fixed game: ${gameId}`);
      }
      this._assertCompatibility(fixed, challenge);
      return fixed;
    }

    const compatible = this.gameRegistry.getCompatible(questionType, answerMode, candidateGameIds);
    if (!compatible.length) {
      throw new Error(`No compatible games for challenge ${challenge.id}`);
    }
    return randomEnabled ? this._pickWeighted(compatible) : compatible[0];
  }

  peek(challenge) {
    if (challenge.selectionMode === 'fixed') {
      return this.gameRegistry.get(challenge.gameId);
    }

    const compatible = this.gameRegistry.getCompatible(
      challenge.questionType,
      challenge.answerMode,
      challenge.candidateGameIds
    );
    return compatible[0] || null;
  }

  _assertCompatibility(gameDef, challenge) {
    if (challenge.questionType && !gameDef.supportsQuestionTypes.includes(challenge.questionType)) {
      throw new Error(`${gameDef.gameId} does not support question type ${challenge.questionType}`);
    }
    if (challenge.answerMode && !gameDef.supportsAnswerModes.includes(challenge.answerMode)) {
      throw new Error(`${gameDef.gameId} does not support answer mode ${challenge.answerMode}`);
    }
  }

  _pickWeighted(choices) {
    const total = choices.reduce((sum, c) => sum + (c.weight || 1), 0);
    let roll = Math.random() * total;
    for (const c of choices) {
      roll -= (c.weight || 1);
      if (roll <= 0) return c;
    }
    return choices[choices.length - 1];
  }
}

