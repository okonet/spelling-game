import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionManager } from './sessionManager';
import type { WordResult } from './types';

// Helper function to create a complete WordResult object
function createWordResult(partial: Partial<WordResult> & { word: string }): WordResult {
  const now = Date.now();
  return {
    difficulty: 'easy',
    startTime: now - 5000,
    endTime: now,
    scoreEarned: 20,
    speedMultiplier: 1.0,
    speedTier: 'normal',
    comboMultiplier: 1.0,
    comboCount: 0,
    responseTime: 3000,
    level: 1,
    timedOut: false,
    attempts: [{ spelling: partial.word, correct: true, timestamp: now }],
    ...partial
  };
}

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Session Management', () => {
    it('should create a new session for a player', () => {
      const session = sessionManager.createSession('Alice', 'easy');

      expect(session.playerName).toBe('Alice');
      expect(session.difficulty).toBe('easy');
      expect(session.totalScore).toBe(0);
      expect(session.wordsPlayed).toEqual([]);
      expect(session.livesRemaining).toBe(3);
      expect(session.sessionId).toBeTruthy();
      expect(session.startTime).toBeTypeOf('number');
    });

    it('should track current session', () => {
      const session = sessionManager.createSession('Bob', 'medium');
      const currentSession = sessionManager.getCurrentSession();

      expect(currentSession).toEqual(session);
    });

    it('should update session score', () => {
      sessionManager.createSession('Charlie', 'easy');
      sessionManager.updateSessionScore(50);

      const session = sessionManager.getCurrentSession();
      expect(session?.totalScore).toBe(50);
    });

    it('should update session lives', () => {
      sessionManager.createSession('Diana', 'easy');
      sessionManager.updateSessionLives(2);

      const session = sessionManager.getCurrentSession();
      expect(session?.livesRemaining).toBe(2);
    });

    it('should save and retrieve all sessions', () => {
      const session1 = sessionManager.createSession('Eve', 'easy');
      sessionManager.endSession();

      const session2 = sessionManager.createSession('Frank', 'hard');
      sessionManager.endSession();

      const allSessions = sessionManager.getAllSessions();
      expect(allSessions).toHaveLength(2);
      expect(allSessions[0].sessionId).toBe(session1.sessionId);
      expect(allSessions[1].sessionId).toBe(session2.sessionId);
    });

    it('should filter sessions by player name', () => {
      sessionManager.createSession('Grace', 'easy');
      sessionManager.endSession();

      sessionManager.createSession('Henry', 'medium');
      sessionManager.endSession();

      sessionManager.createSession('Grace', 'hard');
      sessionManager.endSession();

      const graceSessions = sessionManager.getSessionsByPlayer('Grace');
      expect(graceSessions).toHaveLength(2);
      expect(graceSessions[0].playerName).toBe('Grace');
      expect(graceSessions[1].playerName).toBe('Grace');
    });

    it('should delete specific session', () => {
      const session1 = sessionManager.createSession('Ivan', 'easy');
      sessionManager.endSession();

      const session2 = sessionManager.createSession('Ivan', 'medium');
      sessionManager.endSession();

      sessionManager.deleteSession(session1.sessionId);

      const allSessions = sessionManager.getAllSessions();
      expect(allSessions).toHaveLength(1);
      expect(allSessions[0].sessionId).toBe(session2.sessionId);
    });
  });

  describe('Per-Player Word Performance Tracking', () => {
    it('should track word performance separately for each player', () => {
      // Player 1 struggles with 'cat'
      const wordResult1 = createWordResult({
        word: 'cat',
        attempts: [
          { spelling: 'kat', correct: false, timestamp: Date.now() },
          { spelling: 'cat', correct: true, timestamp: Date.now() }
        ],
        scoreEarned: 10
      });
      sessionManager.updateWordPerformance('Alice', wordResult1);

      // Player 2 masters 'cat' on first try
      const wordResult2 = createWordResult({
        word: 'cat',
        scoreEarned: 20
      });
      sessionManager.updateWordPerformance('Bob', wordResult2);

      // Check Alice's performance
      const alicePerformance = sessionManager.getWordPerformance('Alice');
      expect(alicePerformance['cat']).toBeDefined();
      expect(alicePerformance['cat'].timesMistakes).toBe(1);
      expect(alicePerformance['cat'].timesCorrectFirstTry).toBe(0);

      // Check Bob's performance (should be different)
      const bobPerformance = sessionManager.getWordPerformance('Bob');
      expect(bobPerformance['cat']).toBeDefined();
      expect(bobPerformance['cat'].timesMistakes).toBe(0);
      expect(bobPerformance['cat'].timesCorrectFirstTry).toBe(1);
    });

    it('should track correct first try', () => {
      const wordResult = createWordResult({
        word: 'dog',
        scoreEarned: 20
      });

      sessionManager.updateWordPerformance('Charlie', wordResult);

      const performance = sessionManager.getWordPerformance('Charlie');
      expect(performance['dog'].timesCorrectFirstTry).toBe(1);
      expect(performance['dog'].timesMistakes).toBe(0);
      expect(performance['dog'].timesTimeout).toBe(0);
      expect(performance['dog'].totalAttempts).toBe(1);
    });

    it('should track mistakes (multiple attempts)', () => {
      const wordResult = createWordResult({
        word: 'difficult',
        attempts: [
          { spelling: 'dificult', correct: false, timestamp: Date.now() },
          { spelling: 'difficalt', correct: false, timestamp: Date.now() },
          { spelling: 'difficult', correct: true, timestamp: Date.now() }
        ],
        scoreEarned: 5,
        level: 2
      });

      sessionManager.updateWordPerformance('Diana', wordResult);

      const performance = sessionManager.getWordPerformance('Diana');
      expect(performance['difficult'].timesCorrectFirstTry).toBe(0);
      expect(performance['difficult'].timesMistakes).toBe(1);
      expect(performance['difficult'].timesTimeout).toBe(0);
      expect(performance['difficult'].totalAttempts).toBe(1);
    });

    it('should track timeouts', () => {
      const wordResult = createWordResult({
        word: 'complex',
        attempts: [],
        scoreEarned: 0,
        timedOut: true,
        level: 3
      });

      sessionManager.updateWordPerformance('Eve', wordResult);

      const performance = sessionManager.getWordPerformance('Eve');
      expect(performance['complex'].timesCorrectFirstTry).toBe(0);
      expect(performance['complex'].timesMistakes).toBe(0);
      expect(performance['complex'].timesTimeout).toBe(1);
      expect(performance['complex'].totalAttempts).toBe(1);
    });

    it('should accumulate stats over multiple attempts of same word', () => {
      const playerName = 'Frank';

      // First attempt: mistake
      const attempt1 = createWordResult({
        word: 'house',
        attempts: [
          { spelling: 'hose', correct: false, timestamp: Date.now() },
          { spelling: 'house', correct: true, timestamp: Date.now() }
        ],
        scoreEarned: 10,
        level: 1
      });
      sessionManager.updateWordPerformance(playerName, attempt1);

      // Second attempt: timeout
      const attempt2 = createWordResult({
        word: 'house',
        attempts: [],
        scoreEarned: 0,
        timedOut: true,
        level: 2
      });
      sessionManager.updateWordPerformance(playerName, attempt2);

      // Third attempt: correct first try
      const attempt3 = createWordResult({
        word: 'house',
        scoreEarned: 20,
        level: 3
      });
      sessionManager.updateWordPerformance(playerName, attempt3);

      const performance = sessionManager.getWordPerformance(playerName);
      expect(performance['house'].timesCorrectFirstTry).toBe(1);
      expect(performance['house'].timesMistakes).toBe(1);
      expect(performance['house'].timesTimeout).toBe(1);
      expect(performance['house'].totalAttempts).toBe(3);
    });

    it('should handle case-insensitive word tracking', () => {
      const wordResult = createWordResult({
        word: 'CAT',
        scoreEarned: 20
      });

      sessionManager.updateWordPerformance('Grace', wordResult);

      const performance = sessionManager.getWordPerformance('Grace');
      // Should be stored as lowercase
      expect(performance['cat']).toBeDefined();
      expect(performance['cat'].timesCorrectFirstTry).toBe(1);
    });

    it('should update lastSeen timestamp on each attempt', () => {
      const wordResult = createWordResult({
        word: 'test',
        scoreEarned: 20
      });

      const beforeTime = Date.now();
      sessionManager.updateWordPerformance('Henry', wordResult);
      const afterTime = Date.now();

      const performance = sessionManager.getWordPerformance('Henry');
      expect(performance['test'].lastSeen).toBeGreaterThanOrEqual(beforeTime);
      expect(performance['test'].lastSeen).toBeLessThanOrEqual(afterTime);
    });

    it('should clear specific player performance without affecting others', () => {
      // Add performance for two players
      const wordResult = createWordResult({
        word: 'shared',
        scoreEarned: 20
      });

      sessionManager.updateWordPerformance('Ivan', wordResult);
      sessionManager.updateWordPerformance('Julia', wordResult);

      // Clear Ivan's performance
      sessionManager.clearWordPerformance('Ivan');

      // Ivan's performance should be empty
      const ivanPerformance = sessionManager.getWordPerformance('Ivan');
      expect(Object.keys(ivanPerformance)).toHaveLength(0);

      // Julia's performance should remain
      const juliaPerformance = sessionManager.getWordPerformance('Julia');
      expect(juliaPerformance['shared']).toBeDefined();
    });

    it('should clear all performance data when no player specified', () => {
      const wordResult = createWordResult({
        word: 'test',
        scoreEarned: 20
      });

      sessionManager.updateWordPerformance('Player1', wordResult);
      sessionManager.updateWordPerformance('Player2', wordResult);

      sessionManager.clearWordPerformance();

      const allPerformance = sessionManager.getAllPlayersPerformance();
      expect(Object.keys(allPerformance)).toHaveLength(0);
    });

    it('should get all players performance data', () => {
      const wordResult1 = createWordResult({
        word: 'cat',
        scoreEarned: 20
      });

      const wordResult2 = createWordResult({
        word: 'dog',
        scoreEarned: 20
      });

      sessionManager.updateWordPerformance('Kevin', wordResult1);
      sessionManager.updateWordPerformance('Laura', wordResult2);

      const allPerformance = sessionManager.getAllPlayersPerformance();

      expect(Object.keys(allPerformance)).toHaveLength(2);
      expect(allPerformance['Kevin']).toBeDefined();
      expect(allPerformance['Laura']).toBeDefined();
      expect(allPerformance['Kevin']['cat']).toBeDefined();
      expect(allPerformance['Laura']['dog']).toBeDefined();
    });
  });

  describe('Real-world Multi-Player Scenario', () => {
    it('should isolate learning progress for siblings using the same game', () => {
      // Sibling 1 (younger, struggles with 'difficult' words)
      const sibling1Word1 = createWordResult({
        word: 'cat',
        scoreEarned: 20
      });

      const sibling1Word2 = createWordResult({
        word: 'elephant',
        attempts: [],
        scoreEarned: 0,
        timedOut: true,
        level: 2
      });

      sessionManager.updateWordPerformance('Emma', sibling1Word1);
      sessionManager.updateWordPerformance('Emma', sibling1Word2);

      // Sibling 2 (older, masters both words)
      const sibling2Word1 = createWordResult({
        word: 'cat',
        scoreEarned: 20
      });

      const sibling2Word2 = createWordResult({
        word: 'elephant',
        scoreEarned: 20
      });

      sessionManager.updateWordPerformance('Liam', sibling2Word1);
      sessionManager.updateWordPerformance('Liam', sibling2Word2);

      // Verify Emma's performance
      const emmaPerf = sessionManager.getWordPerformance('Emma');
      expect(emmaPerf['cat'].timesCorrectFirstTry).toBe(1);
      expect(emmaPerf['elephant'].timesTimeout).toBe(1);

      // Verify Liam's performance (should be completely different)
      const liamPerf = sessionManager.getWordPerformance('Liam');
      expect(liamPerf['cat'].timesCorrectFirstTry).toBe(1);
      expect(liamPerf['elephant'].timesCorrectFirstTry).toBe(1);
      expect(liamPerf['elephant'].timesTimeout).toBe(0);

      // When Emma plays again, 'elephant' should be prioritized for her
      // When Liam plays again, 'elephant' should NOT be prioritized
      // This is the key benefit of per-player tracking!
    });
  });

  describe('Integration with Word Manager', () => {
    it('should provide performance data structure compatible with WordManager', () => {
      const wordResults: WordResult[] = [
        createWordResult({
          word: 'apple',
          scoreEarned: 20
        }),
        createWordResult({
          word: 'banana',
          attempts: [
            { spelling: 'bananna', correct: false, timestamp: Date.now() },
            { spelling: 'banana', correct: true, timestamp: Date.now() }
          ],
          scoreEarned: 10
        }),
        createWordResult({
          word: 'cherry',
          attempts: [],
          scoreEarned: 0,
          timedOut: true,
          level: 2
        })
      ];

      wordResults.forEach(result => {
        sessionManager.updateWordPerformance('TestPlayer', result);
      });

      const performanceMap = sessionManager.getWordPerformance('TestPlayer');

      // Verify structure is correct for WordManager
      expect(performanceMap['apple']).toHaveProperty('word');
      expect(performanceMap['apple']).toHaveProperty('timesCorrectFirstTry');
      expect(performanceMap['apple']).toHaveProperty('timesMistakes');
      expect(performanceMap['apple']).toHaveProperty('timesTimeout');
      expect(performanceMap['apple']).toHaveProperty('totalAttempts');
      expect(performanceMap['apple']).toHaveProperty('lastSeen');

      // Verify values are correctly categorized
      expect(performanceMap['apple'].timesCorrectFirstTry).toBe(1);
      expect(performanceMap['banana'].timesMistakes).toBe(1);
      expect(performanceMap['cherry'].timesTimeout).toBe(1);
    });
  });
});
