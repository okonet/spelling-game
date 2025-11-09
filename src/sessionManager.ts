import type { PlayerSession, WordResult } from './types';

const STORAGE_KEY = 'spelling-game-sessions';

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
}
