export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Word {
  text: string;
  difficulty: Difficulty;
}

export interface WordAttempt {
  spelling: string;
  correct: boolean;
  timestamp: number;
}

export interface WordResult {
  word: string;
  difficulty: Difficulty;
  attempts: WordAttempt[];
  scoreEarned: number;
  startTime: number;
  endTime: number;
  level: number;
  timedOut: boolean;
}

export interface PlayerSession {
  playerName: string;
  sessionId: string;
  startTime: number;
  endTime?: number;
  difficulty: Difficulty;
  totalScore: number;
  wordsPlayed: WordResult[];
  livesRemaining: number;
}

export interface GameState {
  currentWord: Word | null;
  currentWordAttempts: WordAttempt[];
  score: number;
  lives: number;
  difficulty: Difficulty;
  isPlaying: boolean;
  isGameOver: boolean;
  userInput: string;
  showCorrectSpelling: boolean;
  correctSpelling: string;
  playerName: string;
  level: number;
  wordsCompletedCorrectly: number;
}

export interface WordConfig {
  easy: string[];
  medium: string[];
  hard: string[];
}

export type GamePhase = 'idle' | 'speaking' | 'waiting-input' | 'validating' | 'jumping' | 'crashing' | 'game-over' | 'level-up';

export interface WordPerformance {
  word: string;
  timesCorrectFirstTry: number;
  timesMistakes: number;
  timesTimeout: number;
  totalAttempts: number;
  lastSeen: number;
}

export interface WordPerformanceMap {
  [word: string]: WordPerformance;
}
