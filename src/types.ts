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
}

export interface WordConfig {
  easy: string[];
  medium: string[];
  hard: string[];
}

export type GamePhase = 'idle' | 'speaking' | 'waiting-input' | 'validating' | 'jumping' | 'crashing' | 'game-over';
