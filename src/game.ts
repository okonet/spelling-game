import confetti from 'canvas-confetti';
import type { GameState, GamePhase, Difficulty } from './types';
import { WordManager } from './words';
import { AudioManager } from './audio';

export class SpellingGame {
  private state: GameState;
  private wordManager: WordManager;
  private audioManager: AudioManager;
  private phase: GamePhase = 'idle';
  private elements: {
    startScreen: HTMLElement;
    gameScreen: HTMLElement;
    gameOverScreen: HTMLElement;
    wordInput: HTMLInputElement;
    scoreDisplay: HTMLElement;
    livesDisplay: HTMLElement;
    currentWordDisplay: HTMLElement;
    errorMessage: HTMLElement;
    character: HTMLElement;
    obstacle: HTMLElement;
    finalScore: HTMLElement;
    difficultyButtons: NodeListOf<HTMLButtonElement>;
    playAgainButton: HTMLElement;
    speakAgainButton: HTMLElement;
  };

  constructor() {
    this.wordManager = new WordManager();
    this.audioManager = new AudioManager();

    this.state = {
      currentWord: null,
      score: 0,
      lives: 5,
      difficulty: 'easy',
      isPlaying: false,
      isGameOver: false,
      userInput: '',
      showCorrectSpelling: false,
      correctSpelling: ''
    };

    this.elements = {
      startScreen: document.getElementById('start-screen')!,
      gameScreen: document.getElementById('game-screen')!,
      gameOverScreen: document.getElementById('game-over-screen')!,
      wordInput: document.getElementById('word-input')! as HTMLInputElement,
      scoreDisplay: document.getElementById('score')!,
      livesDisplay: document.getElementById('lives')!,
      currentWordDisplay: document.getElementById('current-word')!,
      errorMessage: document.getElementById('error-message')!,
      character: document.getElementById('character')!,
      obstacle: document.getElementById('obstacle')!,
      finalScore: document.getElementById('final-score')!,
      difficultyButtons: document.querySelectorAll('.difficulty-btn'),
      playAgainButton: document.getElementById('play-again')!,
      speakAgainButton: document.getElementById('speak-again')!
    };

    this.initializeEventListeners();
  }

  async initialize(): Promise<void> {
    await this.wordManager.loadCustomWords();
  }

  private initializeEventListeners(): void {
    // Difficulty selection
    this.elements.difficultyButtons.forEach(button => {
      button.addEventListener('click', () => {
        const difficulty = button.dataset.difficulty as Difficulty;
        this.startGame(difficulty);
      });
    });

    // Word input
    this.elements.wordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && this.phase === 'waiting-input') {
        this.handleWordSubmit();
      }
    });

    // Play again button
    this.elements.playAgainButton.addEventListener('click', () => {
      this.resetGame();
    });

    // Speak again button
    this.elements.speakAgainButton.addEventListener('click', () => {
      if (this.state.currentWord) {
        this.speakWord(this.state.currentWord.text);
      }
    });
  }

  private startGame(difficulty: Difficulty): void {
    this.state.difficulty = difficulty;
    this.state.isPlaying = true;
    this.state.score = 0;
    this.state.lives = 5;
    this.state.isGameOver = false;

    this.elements.startScreen.classList.add('hidden');
    this.elements.gameScreen.classList.remove('hidden');

    this.updateDisplay();
    this.nextRound();
  }

  private async nextRound(): Promise<void> {
    if (this.state.isGameOver) return;

    this.phase = 'speaking';
    this.state.currentWord = this.wordManager.getRandomWord(this.state.difficulty);
    this.state.showCorrectSpelling = false;
    this.elements.errorMessage.classList.add('hidden');
    this.elements.wordInput.value = '';
    this.elements.wordInput.disabled = true;

    // Reset positions
    this.resetAnimations();

    // Speak the word
    await this.speakWord(this.state.currentWord.text);

    // Wait for input
    this.phase = 'waiting-input';
    this.elements.wordInput.disabled = false;
    this.elements.wordInput.focus();
  }

  private async speakWord(word: string): Promise<void> {
    try {
      await this.audioManager.speak(word);
    } catch (error) {
      console.error('Failed to speak word:', error);
    }
  }

  private handleWordSubmit(): void {
    const userAnswer = this.elements.wordInput.value.trim().toLowerCase();
    const correctAnswer = this.state.currentWord!.text.toLowerCase();

    this.phase = 'validating';
    this.elements.wordInput.disabled = true;

    // Create obstacle from typed word
    this.elements.obstacle.textContent = userAnswer;
    this.elements.obstacle.classList.add('show');

    if (userAnswer === correctAnswer) {
      this.handleCorrectAnswer();
    } else {
      this.handleIncorrectAnswer(correctAnswer);
    }
  }

  private async handleCorrectAnswer(): Promise<void> {
    this.phase = 'jumping';
    this.state.score += 10;
    this.updateDisplay();

    // Wait for obstacle to approach character position, then jump
    // Fine-tuned timing: jump slightly before obstacle reaches character
    await this.delay(1500);
    this.elements.character.classList.add('jumping');

    // Celebration
    this.celebrate();

    // Wait for obstacle to finish sliding off screen
    await this.delay(900);

    // Reset and continue
    this.resetAnimations();
    this.nextRound();
  }

  private async handleIncorrectAnswer(correctAnswer: string): Promise<void> {
    this.phase = 'crashing';
    this.state.lives -= 1;
    this.updateDisplay();

    // Wait for obstacle to reach character position, then crash
    await this.delay(1400);
    this.elements.character.classList.add('crashing');

    // Wait for crash animation to complete
    await this.delay(600);

    // Show correct spelling
    this.state.correctSpelling = correctAnswer;
    this.elements.errorMessage.textContent = `The correct spelling is: "${correctAnswer}"`;
    this.elements.errorMessage.classList.remove('hidden');

    // Wait for obstacle to finish sliding off screen and for user to read error
    await this.delay(1500);

    // Check if game over
    if (this.state.lives <= 0) {
      this.gameOver();
    } else {
      // Give another chance with the same word
      this.resetAnimations();
      this.phase = 'waiting-input';
      this.elements.wordInput.value = '';
      this.elements.wordInput.disabled = false;
      this.elements.wordInput.focus();
      await this.speakWord(correctAnswer);
    }
  }

  private celebrate(): void {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  private resetAnimations(): void {
    this.elements.character.classList.remove('moving', 'jumping', 'crashing');
    this.elements.obstacle.classList.remove('show');
    this.elements.obstacle.textContent = '';
  }

  private updateDisplay(): void {
    this.elements.scoreDisplay.textContent = this.state.score.toString();

    // Always show 5 hearts - filled for remaining lives, grayed out for lost lives
    const maxLives = 5;
    const filledHearts = '❤️'.repeat(this.state.lives);
    const emptyHearts = '🖤'.repeat(maxLives - this.state.lives);
    this.elements.livesDisplay.textContent = filledHearts + emptyHearts;
  }

  private gameOver(): void {
    this.state.isGameOver = true;
    this.phase = 'game-over';

    this.elements.gameScreen.classList.add('hidden');
    this.elements.gameOverScreen.classList.remove('hidden');
    this.elements.finalScore.textContent = this.state.score.toString();
  }

  private resetGame(): void {
    this.elements.gameOverScreen.classList.add('hidden');
    this.elements.startScreen.classList.remove('hidden');
    this.phase = 'idle';
    this.wordManager.resetUsedWords();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
