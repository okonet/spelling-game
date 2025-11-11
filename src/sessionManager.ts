import type { PlayerSession, WordResult, WordPerformanceMap } from './types';

const STORAGE_KEY = 'spelling-game-sessions';
const PERFORMANCE_KEY = 'spelling-game-word-performance';

export class SessionManager {
  private currentSession: PlayerSession | null = null;

  createSession(playerName: string, difficulty: string): PlayerSession {
    const session: PlayerSession = {
      playerName,
      sessionId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      difficulty: difficulty as PlayerSession['difficulty'],
      totalScore: 0,
      wordsPlayed: [],
      livesRemaining: 3
    };

    this.currentSession = session;
    return session;
  }

  getCurrentSession(): PlayerSession | null {
    return this.currentSession;
  }

  updateSessionScore(score: number): void {
    if (this.currentSession) {
      this.currentSession.totalScore = score;
    }
  }

  updateSessionLives(lives: number): void {
    if (this.currentSession) {
      this.currentSession.livesRemaining = lives;
    }
  }

  addWordResult(wordResult: WordResult): void {
    if (this.currentSession) {
      this.currentSession.wordsPlayed.push(wordResult);
    }
  }

  endSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.saveSession(this.currentSession);
      this.currentSession = null;
    }
  }

  private saveSession(session: PlayerSession): void {
    const sessions = this.getAllSessions();
    sessions.push(session);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save session to localStorage:', error);
    }
  }

  getAllSessions(): PlayerSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load sessions from localStorage:', error);
      return [];
    }
  }

  getSessionsByPlayer(playerName: string): PlayerSession[] {
    return this.getAllSessions().filter(
      session => session.playerName.toLowerCase() === playerName.toLowerCase()
    );
  }

  clearAllSessions(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear sessions from localStorage:', error);
    }
  }

  deleteSession(sessionId: string): void {
    const sessions = this.getAllSessions().filter(
      session => session.sessionId !== sessionId
    );

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to delete session from localStorage:', error);
    }
  }

  // Word Performance Tracking (per player)
  //
  // Current localStorage structure (optimized for future DB migration):
  // { [playerName]: { [word]: WordPerformance } }
  //
  // Future database schema would be:
  // Table: word_performance
  // Columns: player_name (TEXT), word (TEXT), times_correct_first_try (INT),
  //          times_mistakes (INT), times_timeout (INT), total_attempts (INT),
  //          last_seen (TIMESTAMP)
  // Primary Key: (player_name, word)
  // Indexes: player_name, last_seen
  getWordPerformance(playerName: string): WordPerformanceMap {
    try {
      const data = localStorage.getItem(PERFORMANCE_KEY);
      const allPerformance = data ? JSON.parse(data) : {};
      return allPerformance[playerName] || {};
    } catch (error) {
      console.error('Failed to load word performance from localStorage:', error);
      return {};
    }
  }

  updateWordPerformance(playerName: string, wordResult: WordResult): void {
    try {
      const data = localStorage.getItem(PERFORMANCE_KEY);
      const allPerformance = data ? JSON.parse(data) : {};

      // Get or create player's performance map
      const playerPerformance = allPerformance[playerName] || {};
      const word = wordResult.word.toLowerCase();

      const existing = playerPerformance[word] || {
        word,
        timesCorrectFirstTry: 0,
        timesMistakes: 0,
        timesTimeout: 0,
        totalAttempts: 0,
        lastSeen: 0
      };

      // Update stats based on result
      existing.totalAttempts += 1;
      existing.lastSeen = Date.now();

      if (wordResult.timedOut) {
        existing.timesTimeout += 1;
      } else if (wordResult.attempts.length === 1 && wordResult.attempts[0].correct) {
        existing.timesCorrectFirstTry += 1;
      } else {
        existing.timesMistakes += 1;
      }

      playerPerformance[word] = existing;
      allPerformance[playerName] = playerPerformance;

      localStorage.setItem(PERFORMANCE_KEY, JSON.stringify(allPerformance));
    } catch (error) {
      console.error('Failed to save word performance to localStorage:', error);
    }
  }

  clearWordPerformance(playerName?: string): void {
    try {
      if (playerName) {
        // Clear specific player's performance
        const data = localStorage.getItem(PERFORMANCE_KEY);
        const allPerformance = data ? JSON.parse(data) : {};
        delete allPerformance[playerName];
        localStorage.setItem(PERFORMANCE_KEY, JSON.stringify(allPerformance));
      } else {
        // Clear all performance data
        localStorage.removeItem(PERFORMANCE_KEY);
      }
    } catch (error) {
      console.error('Failed to clear word performance from localStorage:', error);
    }
  }

  getAllPlayersPerformance(): { [playerName: string]: WordPerformanceMap } {
    try {
      const data = localStorage.getItem(PERFORMANCE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to load all performance data from localStorage:', error);
      return {};
    }
  }
}
