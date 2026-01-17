export interface Word {
  text: string;
  description?: string; // Optional description to be read aloud instead of the word
}

export interface WordAttempt {
  spelling: string;
  correct: boolean;
  timestamp: number;
}

export type SpeedTier = 'lightning' | 'fast' | 'good' | 'normal';

export interface WordResult {
  word: string;
  attempts: WordAttempt[];
  scoreEarned: number;
  speedMultiplier: number;
  speedTier: SpeedTier;
  comboMultiplier: number;
  comboCount: number;
  responseTime: number; // Time from obstacle start to answer (ms)
  startTime: number;
  endTime: number;
  level: number;
  timedOut: boolean;
}

export interface PlayerSession {
  email: string; // Changed from playerName to support profiles
  playerName?: string; // Keep for backwards compatibility with old sessions
  sessionId: string;
  startTime: number;
  endTime?: number;
  totalScore: number;
  wordsPlayed: WordResult[];
  livesRemaining: number;
}

export interface GameState {
  currentWord: Word | null;
  currentWordAttempts: WordAttempt[];
  score: number;
  lives: number;
  isPlaying: boolean;
  isGameOver: boolean;
  userInput: string;
  showCorrectSpelling: boolean;
  correctSpelling: string;
  playerName: string; // Deprecated: kept for backwards compatibility
  currentProfile: UserProfile | null; // Active user profile
  level: number;
  wordsCompletedCorrectly: number;
  comboCount: number; // Consecutive correct answers (first try only)
}

export type WordConfig = string[];

export type GamePhase =
  | 'idle'
  | 'speaking'
  | 'waiting-input'
  | 'validating'
  | 'jumping'
  | 'crashing'
  | 'game-over'
  | 'level-up';

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

export interface VoiceSettings {
  voiceURI: string;
  rate: number; // 0.5 - 1.5
  pitch: number; // 0.5 - 2.0
  autoRepeat: boolean;
  autoRepeatDelay: number; // seconds
}

export interface UserProfile {
  email: string; // Used as unique ID
  nickname: string;
  avatar: string; // Emoji
  preferences: {
    voice: VoiceSettings;
    gameSpeed: number; // 0.5 (slowest) to 1.5 (fastest), default 1.0
  };
  createdAt: number;
  lastUsed: number;
}
