import confetti from 'canvas-confetti';
import type { GameState, GamePhase, Difficulty, WordAttempt, WordResult } from './types';
import { WordManager } from './words';
import { AudioManager } from './audio';
import { SessionManager } from './sessionManager';

export class SpellingGame {
  private state: GameState;
  private wordManager: WordManager;
  private audioManager: AudioManager;
  private sessionManager: SessionManager;
  private phase: GamePhase = 'idle';
  private currentWordStartTime: number = 0;
  private elements: {
    startScreen: HTMLElement;
    gameScreen: HTMLElement;
    gameOverScreen: HTMLElement;
    wordInput: HTMLInputElement;
    playerNameInput: HTMLInputElement;
    scoreDisplay: HTMLElement;
    livesDisplay: HTMLElement;
    currentWordDisplay: HTMLElement;
    errorMessage: HTMLElement;
    character: HTMLElement;
    obstacle: HTMLElement;
    finalScore: HTMLElement;
    playerNameDisplay: HTMLElement;
    difficultyButtons: NodeListOf<HTMLButtonElement>;
    playAgainButton: HTMLElement;
    speakAgainButton: HTMLElement;
    viewStatsButton: HTMLElement;
    quitButton: HTMLElement;
  };

  constructor() {
    this.wordManager = new WordManager();
    this.audioManager = new AudioManager();
    this.sessionManager = new SessionManager();

    this.state = {
      currentWord: null,
      currentWordAttempts: [],
      score: 0,
      lives: 3,
      difficulty: 'easy',
      isPlaying: false,
      isGameOver: false,
      userInput: '',
      showCorrectSpelling: false,
      correctSpelling: '',
      playerName: ''
    };

    this.elements = {
      startScreen: document.getElementById('start-screen')!,
      gameScreen: document.getElementById('game-screen')!,
      gameOverScreen: document.getElementById('game-over-screen')!,
      wordInput: document.getElementById('word-input')! as HTMLInputElement,
      playerNameInput: document.getElementById('player-name')! as HTMLInputElement,
      scoreDisplay: document.getElementById('score')!,
      livesDisplay: document.getElementById('lives')!,
      currentWordDisplay: document.getElementById('current-word')!,
      errorMessage: document.getElementById('error-message')!,
      character: document.getElementById('character')!,
      obstacle: document.getElementById('obstacle')!,
      finalScore: document.getElementById('final-score')!,
      playerNameDisplay: document.getElementById('player-name-display')!,
      difficultyButtons: document.querySelectorAll('.difficulty-btn'),
      playAgainButton: document.getElementById('play-again')!,
      speakAgainButton: document.getElementById('speak-again')!,
      viewStatsButton: document.getElementById('view-stats')!,
      quitButton: document.getElementById('quit-game')!
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
        const playerName = this.elements.playerNameInput.value.trim();
        if (!playerName) {
          alert('Please enter your name to start the game!');
          this.elements.playerNameInput.focus();
          return;
        }

        const difficulty = button.dataset.difficulty as Difficulty;
        this.startGame(playerName, difficulty);
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

    // View stats button
    this.elements.viewStatsButton.addEventListener('click', () => {
      window.location.href = '/stats.html';
    });

    // Quit game button
    this.elements.quitButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to quit? Your progress will be saved.')) {
        this.quitGame();
      }
    });
  }

  private startGame(playerName: string, difficulty: Difficulty): void {
    this.state.playerName = playerName;
    this.state.difficulty = difficulty;
    this.state.isPlaying = true;
    this.state.score = 0;
    this.state.lives = 3;
    this.state.isGameOver = false;

    // Create new session
    this.sessionManager.createSession(playerName, difficulty);

    this.elements.startScreen.classList.add('hidden');
    this.elements.gameScreen.classList.remove('hidden');
    this.elements.playerNameDisplay.textContent = playerName;

    this.updateDisplay();
    this.nextRound();
  }

  private async nextRound(): Promise<void> {
    if (this.state.isGameOver) return;

    // Save previous word result if exists
    if (this.state.currentWord && this.currentWordStartTime > 0) {
      this.saveWordResult();
    }

    this.phase = 'speaking';
    this.state.currentWord = this.wordManager.getRandomWord(this.state.difficulty);
    this.state.currentWordAttempts = [];
    this.currentWordStartTime = Date.now();
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

    // Record attempt
    const attempt: WordAttempt = {
      spelling: userAnswer,
      correct: userAnswer === correctAnswer,
      timestamp: Date.now()
    };
    this.state.currentWordAttempts.push(attempt);

    // Create obstacle from typed word
    this.elements.obstacle.textContent = userAnswer;
    this.elements.obstacle.classList.add('show');

    if (userAnswer === correctAnswer) {
      this.handleCorrectAnswer();
    } else {
      this.handleIncorrectAnswer(correctAnswer);
    }
  }

  private calculateScore(attempts: number): number {
    // Scoring based on number of attempts
    switch (attempts) {
      case 1:
        return 20; // First attempt: 20 points
      case 2:
        return 10; // Second attempt: 10 points
      case 3:
        return 5;  // Third attempt: 5 points
      default:
        return 2;  // More attempts: 2 points
    }
  }

  private async handleCorrectAnswer(): Promise<void> {
    this.phase = 'jumping';

    const points = this.calculateScore(this.state.currentWordAttempts.length);
    this.state.score += points;
    this.updateDisplay();
    this.sessionManager.updateSessionScore(this.state.score);

    // Wait for obstacle to approach character position, then jump
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
    this.sessionManager.updateSessionLives(this.state.lives);

    // Wait for obstacle to reach character position, then crash
    await this.delay(1400);
    this.elements.character.classList.add('crashing');
    this.playErrorSound();

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
      this.saveWordResult(); // Save the last word result
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

  private saveWordResult(): void {
    if (!this.state.currentWord) return;

    const wordResult: WordResult = {
      word: this.state.currentWord.text,
      difficulty: this.state.currentWord.difficulty,
      attempts: [...this.state.currentWordAttempts],
      scoreEarned: this.calculateScore(this.state.currentWordAttempts.length),
      startTime: this.currentWordStartTime,
      endTime: Date.now()
    };

    this.sessionManager.addWordResult(wordResult);
  }

  private celebrate(): void {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    this.playTadaSound();
  }

  private playTadaSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C (major chord)
      const duration = 0.15;
      const startTime = audioContext.currentTime;

      notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Envelope for a pleasant sound
        gainNode.gain.setValueAtTime(0, startTime + index * duration);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + index * duration + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + index * duration + duration);

        oscillator.start(startTime + index * duration);
        oscillator.stop(startTime + index * duration + duration);
      });
    } catch (error) {
      console.warn('Could not play tada sound:', error);
    }
  }

  private playErrorSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const startTime = audioContext.currentTime;

      // Create a descending "wrong answer" sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Descending frequency from 400Hz to 200Hz
      oscillator.frequency.setValueAtTime(400, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, startTime + 0.3);
      oscillator.type = 'sawtooth'; // Harsher sound for error

      // Volume envelope
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    } catch (error) {
      console.warn('Could not play error sound:', error);
    }
  }

  private resetAnimations(): void {
    this.elements.character.classList.remove('moving', 'jumping', 'crashing');
    this.elements.obstacle.classList.remove('show');
    this.elements.obstacle.textContent = '';
  }

  private updateDisplay(): void {
    this.elements.scoreDisplay.textContent = this.state.score.toString();

    // Always show 3 hearts - filled for remaining lives, grayed out for lost lives
    const maxLives = 3;
    const filledHearts = '❤️'.repeat(this.state.lives);
    const emptyHearts = '🖤'.repeat(maxLives - this.state.lives);
    this.elements.livesDisplay.textContent = filledHearts + emptyHearts;
  }

  private gameOver(): void {
    this.state.isGameOver = true;
    this.phase = 'game-over';

    // End session
    this.sessionManager.endSession();

    this.elements.gameScreen.classList.add('hidden');
    this.elements.gameOverScreen.classList.remove('hidden');
    this.elements.finalScore.textContent = this.state.score.toString();
  }

  private resetGame(): void {
    this.elements.gameOverScreen.classList.add('hidden');
    this.elements.startScreen.classList.remove('hidden');
    this.phase = 'idle';
    this.wordManager.resetUsedWords();
    this.elements.playerNameInput.value = '';
  }

  private quitGame(): void {
    // Save current word result if exists
    if (this.state.currentWord && this.currentWordStartTime > 0) {
      this.saveWordResult();
    }

    // End the session and save to localStorage
    this.sessionManager.endSession();

    // Reset game state and return to start screen
    this.state.isGameOver = false;
    this.state.isPlaying = false;
    this.elements.gameScreen.classList.add('hidden');
    this.elements.startScreen.classList.remove('hidden');
    this.phase = 'idle';
    this.wordManager.resetUsedWords();
    this.resetAnimations();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
