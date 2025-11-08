export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Word {
  text: string;
  difficulty: Difficulty;
}

export interface GameState {
  currentWord: Word | null;
  score: number;
  lives: number;
  difficulty: Difficulty;
  isPlaying: boolean;
  isGameOver: boolean;
  userInput: string;
  showCorrectSpelling: boolean;
  correctSpelling: string;
}

export interface WordConfig {
  easy: string[];
  medium: string[];
  hard: string[];
}

export type GamePhase = 'idle' | 'speaking' | 'waiting-input' | 'validating' | 'jumping' | 'crashing' | 'game-over';
