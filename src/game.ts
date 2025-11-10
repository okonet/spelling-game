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
  private obstacleStartTime: number = 0;
  private obstacleTimeoutId: number | null = null;
  private debugMode: boolean = false;
  private debugUpdateInterval: number | null = null;
  private speakingStartTime: number = 0;
  private speakingEndTime: number = 0;
  private elements: {
    startScreen: HTMLElement;
    gameScreen: HTMLElement;
    gameOverScreen: HTMLElement;
    wordInput: HTMLInputElement;
    playerNameInput: HTMLInputElement;
    scoreDisplay: HTMLElement;
    livesDisplay: HTMLElement;
    levelDisplay: HTMLElement;
    currentWordDisplay: HTMLElement;
    errorMessage: HTMLElement;
    character: HTMLElement;
    obstacle: HTMLElement;
    speechBubble: HTMLElement;
    speechText: HTMLElement;
    ughText: HTMLElement;
    finalScore: HTMLElement;
    finalLevel: HTMLElement;
    comparisonStats: HTMLElement;
    playerNameDisplay: HTMLElement;
    levelUpOverlay: HTMLElement;
    levelUpMessage: HTMLElement;
    startGameButton: HTMLElement;
    playAgainButton: HTMLElement;
    speakAgainButton: HTMLElement;
    viewStatsButton: HTMLElement;
    quitButton: HTMLElement;
    debugPanel: HTMLElement;
    debugInfo: HTMLElement;
    debugTimelineBar: HTMLElement;
    debugSpeaking: HTMLElement;
    debugTyping: HTMLElement;
    debugJumpPoint: HTMLElement;
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
      playerName: '',
      level: 1,
      wordsCompletedCorrectly: 0
    };

    this.elements = {
      startScreen: document.getElementById('start-screen')!,
      gameScreen: document.getElementById('game-screen')!,
      gameOverScreen: document.getElementById('game-over-screen')!,
      wordInput: document.getElementById('word-input')! as HTMLInputElement,
      playerNameInput: document.getElementById('player-name')! as HTMLInputElement,
      scoreDisplay: document.getElementById('score')!,
      livesDisplay: document.getElementById('lives')!,
      levelDisplay: document.getElementById('level')!,
      currentWordDisplay: document.getElementById('current-word')!,
      errorMessage: document.getElementById('error-message')!,
      character: document.getElementById('character')!,
      obstacle: document.getElementById('obstacle')!,
      speechBubble: document.getElementById('speech-bubble')!,
      speechText: document.getElementById('speech-text')!,
      ughText: document.getElementById('ugh-text')!,
      finalScore: document.getElementById('final-score')!,
      finalLevel: document.getElementById('final-level')!,
      comparisonStats: document.getElementById('comparison-stats')!,
      playerNameDisplay: document.getElementById('player-name-display')!,
      levelUpOverlay: document.getElementById('level-up-overlay')!,
      levelUpMessage: document.getElementById('level-up-message')!,
      startGameButton: document.getElementById('start-game')!,
      playAgainButton: document.getElementById('play-again')!,
      speakAgainButton: document.getElementById('speak-again')!,
      viewStatsButton: document.getElementById('view-stats')!,
      quitButton: document.getElementById('quit-game')!,
      debugPanel: document.getElementById('debug-panel')!,
      debugInfo: document.getElementById('debug-info')!,
      debugTimelineBar: document.getElementById('debug-timeline-bar')!,
      debugSpeaking: document.getElementById('debug-speaking')!,
      debugTyping: document.getElementById('debug-typing')!,
      debugJumpPoint: document.getElementById('debug-jump-point')!
    };

    this.initializeEventListeners();
  }

  async initialize(): Promise<void> {
    await this.wordManager.loadWords();
  }

  private initializeEventListeners(): void {
    // Start game button
    this.elements.startGameButton.addEventListener('click', () => {
      const playerName = this.elements.playerNameInput.value.trim();
      if (!playerName) {
        alert('Please enter your name to start the game!');
        this.elements.playerNameInput.focus();
        return;
      }
      this.startGame(playerName);
    });

    // Allow Enter key in player name input to start game
    this.elements.playerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.elements.startGameButton.click();
      }
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

    // View stats button on game over screen
    const viewStatsGameOver = document.getElementById('view-stats-gameover');
    if (viewStatsGameOver) {
      viewStatsGameOver.addEventListener('click', () => {
        window.location.href = '/stats.html';
      });
    }

    // Quit game button
    this.elements.quitButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to quit? Your progress will be saved.')) {
        this.quitGame();
      }
    });

    // Debug mode toggle (press 'D' key)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'd' || e.key === 'D') {
        if (!this.elements.wordInput.matches(':focus')) {
          this.toggleDebugMode();
        }
      }
    });

    // Auto-focus input when player starts typing
    document.addEventListener('keydown', (e) => {
      // Only auto-focus during waiting-input phase
      if (this.phase !== 'waiting-input') return;

      // Only for alphanumeric keys (not special keys like Shift, Ctrl, etc.)
      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        // If input is not focused, focus it
        if (!this.elements.wordInput.matches(':focus')) {
          this.elements.wordInput.focus();
          // The keypress will naturally be captured by the now-focused input
        }
      }
    });
  }

  private toggleDebugMode(): void {
    this.debugMode = !this.debugMode;

    if (this.debugMode) {
      this.elements.debugPanel.classList.remove('hidden');
      this.startDebugUpdate();
    } else {
      this.elements.debugPanel.classList.add('hidden');
      this.stopDebugUpdate();
    }
  }

  private startDebugUpdate(): void {
    this.stopDebugUpdate();
    this.updateDebugInfo();
    this.debugUpdateInterval = window.setInterval(() => {
      this.updateDebugInfo();
    }, 100); // Update every 100ms
  }

  private stopDebugUpdate(): void {
    if (this.debugUpdateInterval !== null) {
      clearInterval(this.debugUpdateInterval);
      this.debugUpdateInterval = null;
    }
  }

  private updateDebugInfo(): void {
    if (!this.debugMode) return;

    const now = Date.now();
    const elapsed = now - this.currentWordStartTime;
    const speed = this.getObstacleSpeedForLevel(this.state.level);
    const speakingDuration = this.speakingEndTime - this.speakingStartTime;
    const obstacleReachTime = speed * 0.6;
    const elapsedSinceObstacle = now - this.obstacleStartTime;
    const timeUntilJump = obstacleReachTime - elapsedSinceObstacle;

    let html = `
      <div><span class="debug-label">Phase:</span> <span class="debug-value">${this.phase}</span></div>
      <div><span class="debug-label">Level:</span> <span class="debug-value">${this.state.level}</span></div>
      <div><span class="debug-label">Speed (total):</span> <span class="debug-value">${speed}ms</span></div>
      <div><span class="debug-label">Speaking time:</span> <span class="debug-value">${speakingDuration}ms</span></div>
      <div><span class="debug-label">Total elapsed:</span> <span class="debug-value">${elapsed}ms</span></div>
      <div><span class="debug-label">Obstacle elapsed:</span> <span class="debug-value">${elapsedSinceObstacle}ms</span></div>
      <div><span class="debug-label">Obstacle reach time:</span> <span class="debug-value">${obstacleReachTime.toFixed(0)}ms (60%)</span></div>
      <div><span class="debug-label">Time until reach:</span> <span class="debug-value ${timeUntilJump < 0 ? 'debug-warning' : ''}">${timeUntilJump.toFixed(0)}ms</span></div>
    `;

    this.elements.debugInfo.innerHTML = html;

    // Update timeline visualization
    const totalTime = speed;
    const speakingPercent = (speakingDuration / totalTime) * 100;
    const obstaclePercent = (elapsedSinceObstacle / totalTime) * 100;
    const jumpPercent = 60; // 60% of animation

    this.elements.debugSpeaking.style.width = `${Math.min(speakingPercent, 100)}%`;
    this.elements.debugTyping.style.left = `${Math.min(speakingPercent, 100)}%`;
    this.elements.debugTyping.style.width = `${Math.max(0, Math.min(obstaclePercent, 100))}%`;
    this.elements.debugJumpPoint.style.left = `${jumpPercent}%`;
  }

  private startGame(playerName: string): void {
    this.state.playerName = playerName;
    this.state.difficulty = 'easy'; // Always start with easy
    this.state.isPlaying = true;
    this.state.score = 0;
    this.state.lives = 3;
    this.state.level = 1;
    this.state.wordsCompletedCorrectly = 0;
    this.state.isGameOver = false;

    // Create new session
    this.sessionManager.createSession(playerName, 'easy');

    this.elements.startScreen.classList.add('hidden');
    this.elements.gameScreen.classList.remove('hidden');
    this.elements.playerNameDisplay.textContent = playerName;

    this.updateDisplay();
    this.nextRound();
  }

  private getDifficultyForLevel(level: number): Difficulty {
    if (level <= 3) return 'easy';
    if (level <= 6) return 'medium';
    return 'hard';
  }

  private getObstacleSpeedForLevel(level: number): number {
    // Base speed: 8000ms (slower for beginners), decrease by 400ms per level, minimum 2500ms
    const baseSpeed = 8000;
    const speedDecrease = 400;
    const minSpeed = 2500;
    return Math.max(minSpeed, baseSpeed - (level - 1) * speedDecrease);
  }

  private async nextRound(): Promise<void> {
    if (this.state.isGameOver) return;

    // Save previous word result if exists
    if (this.state.currentWord && this.currentWordStartTime > 0) {
      this.saveWordResult(false);
    }

    // Update difficulty based on current level
    this.state.difficulty = this.getDifficultyForLevel(this.state.level);

    this.phase = 'speaking';
    this.state.currentWord = this.wordManager.getRandomWord(this.state.difficulty);
    this.state.currentWordAttempts = [];
    this.currentWordStartTime = Date.now();
    this.state.showCorrectSpelling = false;
    this.elements.wordInput.value = '';
    this.elements.wordInput.disabled = true;

    // Reset positions
    this.resetAnimations();

    // Speak the word
    await this.speakWord(this.state.currentWord.text);

    // Start obstacle moving and set timeout
    this.obstacleStartTime = Date.now(); // Track when obstacle starts moving
    this.elements.obstacle.textContent = '🚧'; // Generic obstacle instead of showing the word
    this.elements.obstacle.classList.add('show');

    // Update obstacle animation speed based on level
    const speed = this.getObstacleSpeedForLevel(this.state.level);
    this.elements.obstacle.style.animationDuration = `${speed}ms`;

    // Wait for input
    this.phase = 'waiting-input';
    this.elements.wordInput.disabled = false;
    this.elements.wordInput.focus();

    // Set timeout for obstacle reaching character (at 60% of animation)
    const obstacleReachTime = speed * 0.6;
    this.clearObstacleTimeout();
    this.obstacleTimeoutId = window.setTimeout(() => {
      if (this.phase === 'waiting-input') {
        this.handleTimeout();
      }
    }, obstacleReachTime);
  }

  private async speakWord(word: string): Promise<void> {
    try {
      this.speakingStartTime = Date.now();
      await this.audioManager.speak(word);
      this.speakingEndTime = Date.now();
    } catch (error) {
      console.error('Failed to speak word:', error);
      this.speakingEndTime = Date.now();
    }
  }

  private handleWordSubmit(): void {
    const userAnswer = this.elements.wordInput.value.trim().toLowerCase();
    const correctAnswer = this.state.currentWord!.text.toLowerCase();

    this.phase = 'validating';
    this.elements.wordInput.disabled = true;

    // Clear obstacle timeout since user submitted
    this.clearObstacleTimeout();

    // Record attempt
    const attempt: WordAttempt = {
      spelling: userAnswer,
      correct: userAnswer === correctAnswer,
      timestamp: Date.now()
    };
    this.state.currentWordAttempts.push(attempt);

    // Keep obstacle as generic visual
    // (don't show user's answer to avoid giving away the spelling)

    if (userAnswer === correctAnswer) {
      this.handleCorrectAnswer();
    } else {
      this.handleIncorrectAnswer(correctAnswer);
    }
  }

  private clearObstacleTimeout(): void {
    if (this.obstacleTimeoutId !== null) {
      clearTimeout(this.obstacleTimeoutId);
      this.obstacleTimeoutId = null;
    }
  }

  private async handleTimeout(): Promise<void> {
    // Player ran out of time
    this.phase = 'crashing';
    this.clearObstacleTimeout();
    this.elements.wordInput.disabled = true;

    // Play crash animation and sound
    this.elements.character.classList.add('crashing');
    this.playErrorSound();

    // Show "Ugh!" text
    this.elements.ughText.classList.remove('hidden');

    await this.delay(800);

    // Hide ugh text
    this.elements.ughText.classList.add('hidden');

    // NOW lose the life (after crash animation)
    this.state.lives -= 1;
    this.updateDisplay();
    this.sessionManager.updateSessionLives(this.state.lives);

    // Show correct spelling in speech bubble
    this.elements.speechText.textContent = `"${this.state.currentWord!.text}"`;
    this.elements.speechBubble.classList.remove('hidden');

    await this.delay(2500);

    // Hide speech bubble
    this.elements.speechBubble.classList.add('hidden');

    // Check if game over
    if (this.state.lives <= 0) {
      this.saveWordResult(true); // Save with timeout flag
      this.gameOver();
    } else {
      // Continue to next word
      this.saveWordResult(true); // Save with timeout flag
      this.resetAnimations();
      this.nextRound();
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
    this.state.wordsCompletedCorrectly += 1;
    this.updateDisplay();
    this.sessionManager.updateSessionScore(this.state.score);

    // Calculate delay until obstacle reaches character
    const speed = this.getObstacleSpeedForLevel(this.state.level);
    const obstacleReachTime = speed * 0.6; // Obstacle reaches character at 60% of animation
    const elapsedSinceObstacle = Date.now() - this.obstacleStartTime;
    const jumpDelay = obstacleReachTime - elapsedSinceObstacle;

    // Wait for obstacle to reach character position, then jump
    if (jumpDelay > 0) {
      await this.delay(jumpDelay);
    }
    this.elements.character.classList.add('jumping');

    // Celebration
    this.celebrate();

    // Wait for obstacle to finish sliding off screen
    await this.delay(900);

    // Check for level up (every 5 correct words)
    const shouldLevelUp = this.state.wordsCompletedCorrectly % 5 === 0;

    // Reset and continue
    this.resetAnimations();

    if (shouldLevelUp) {
      await this.levelUp();
    }

    this.nextRound();
  }

  private async handleIncorrectAnswer(correctAnswer: string): Promise<void> {
    this.phase = 'crashing';

    // Calculate delay until obstacle reaches character
    const speed = this.getObstacleSpeedForLevel(this.state.level);
    const obstacleReachTime = speed * 0.6; // Obstacle reaches character at 60% of animation
    const elapsedSinceObstacle = Date.now() - this.obstacleStartTime;
    const crashDelay = obstacleReachTime - elapsedSinceObstacle;

    // Wait for obstacle to reach character position, then crash
    if (crashDelay > 0) {
      await this.delay(crashDelay);
    }
    this.elements.character.classList.add('crashing');
    this.playErrorSound();

    // Show "Ugh!" text
    this.elements.ughText.classList.remove('hidden');

    // Wait for crash animation to complete (increased for more dramatic effect)
    await this.delay(800);

    // Hide ugh text (it fades out via animation)
    this.elements.ughText.classList.add('hidden');

    // NOW lose the life (after crash animation)
    this.state.lives -= 1;
    this.updateDisplay();
    this.sessionManager.updateSessionLives(this.state.lives);

    // Show correct spelling in speech bubble
    this.state.correctSpelling = correctAnswer;
    this.elements.speechText.textContent = `"${correctAnswer}"`;
    this.elements.speechBubble.classList.remove('hidden');

    // Wait longer for user to read the correct spelling
    await this.delay(2500);

    // Hide speech bubble
    this.elements.speechBubble.classList.add('hidden');

    // Check if game over
    if (this.state.lives <= 0) {
      this.saveWordResult(false); // Save the last word result
      this.gameOver();
    } else {
      // Give another chance with the same word
      this.resetAnimations();
      this.elements.wordInput.value = '';
      this.elements.wordInput.disabled = true;

      // Speak the word again
      await this.speakWord(correctAnswer);

      // Start obstacle moving again for retry
      this.obstacleStartTime = Date.now();
      this.elements.obstacle.textContent = '🚧';
      this.elements.obstacle.classList.add('show');

      const speed = this.getObstacleSpeedForLevel(this.state.level);
      this.elements.obstacle.style.animationDuration = `${speed}ms`;

      // Set up timeout again
      const obstacleReachTime = speed * 0.6;
      this.clearObstacleTimeout();
      this.obstacleTimeoutId = window.setTimeout(() => {
        if (this.phase === 'waiting-input') {
          this.handleTimeout();
        }
      }, obstacleReachTime);

      // Wait for input
      this.phase = 'waiting-input';
      this.elements.wordInput.disabled = false;
      this.elements.wordInput.focus();
    }
  }

  private saveWordResult(timedOut: boolean): void {
    if (!this.state.currentWord) return;

    const wordResult: WordResult = {
      word: this.state.currentWord.text,
      difficulty: this.state.currentWord.difficulty,
      attempts: [...this.state.currentWordAttempts],
      scoreEarned: timedOut ? 0 : this.calculateScore(this.state.currentWordAttempts.length),
      startTime: this.currentWordStartTime,
      endTime: Date.now(),
      level: this.state.level,
      timedOut
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

  private async levelUp(): Promise<void> {
    this.state.level += 1;
    this.phase = 'level-up';
    this.updateDisplay();

    // Show level-up overlay
    this.elements.levelUpMessage.textContent = `Level ${this.state.level}`;
    this.elements.levelUpOverlay.classList.remove('hidden');

    // Celebration effects
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c']
    });
    this.playLevelUpSound();

    // Wait for celebration
    await this.delay(2500);

    // Hide overlay
    this.elements.levelUpOverlay.classList.add('hidden');
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

  private playLevelUpSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Triumphant ascending melody: C, E, G, C, E, G, High C
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      const duration = 0.2;
      const startTime = audioContext.currentTime;

      notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Envelope for a triumphant sound
        gainNode.gain.setValueAtTime(0, startTime + index * duration);
        gainNode.gain.linearRampToValueAtTime(0.25, startTime + index * duration + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + index * duration + duration);

        oscillator.start(startTime + index * duration);
        oscillator.stop(startTime + index * duration + duration);
      });
    } catch (error) {
      console.warn('Could not play level-up sound:', error);
    }
  }

  private resetAnimations(): void {
    this.elements.character.classList.remove('moving', 'jumping', 'crashing');
    this.elements.obstacle.classList.remove('show');
    this.elements.obstacle.textContent = '';
    this.elements.speechBubble.classList.add('hidden');
    this.elements.ughText.classList.add('hidden');
  }

  private updateDisplay(): void {
    this.elements.scoreDisplay.textContent = this.state.score.toString();
    this.elements.levelDisplay.textContent = this.state.level.toString();

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
    this.elements.finalLevel.textContent = `Reached Level ${this.state.level}`;

    // Show session comparison
    this.displaySessionComparison();
  }

  private displaySessionComparison(): void {
    const allSessions = this.sessionManager.getAllSessions();
    const playerSessions = allSessions.filter(s => s.playerName === this.state.playerName && s.endTime);

    if (playerSessions.length === 0) {
      this.elements.comparisonStats.innerHTML = '<p style="text-align: center; color: #666;">This is your first game! 🎮</p>';
      return;
    }

    const scores = playerSessions.map(s => s.totalScore);
    const levels = playerSessions.map(s => {
      // Calculate max level reached (based on words played)
      const maxLevelWord = s.wordsPlayed.reduce((max, word) =>
        word.level > max ? word.level : max, 1
      );
      return maxLevelWord;
    });

    const bestScore = Math.max(...scores);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const bestLevel = Math.max(...levels);
    const totalGames = playerSessions.length;

    const currentScore = this.state.score;
    const currentLevel = this.state.level;

    let html = `
      <div class="stat-comparison-item">
        <div class="stat-comparison-label">Games Played</div>
        <div class="stat-comparison-value">${totalGames}</div>
      </div>
      <div class="stat-comparison-item">
        <div class="stat-comparison-label">Best Score</div>
        <div class="stat-comparison-value ${currentScore >= bestScore ? 'stat-comparison-current' : ''}">${bestScore}</div>
      </div>
      <div class="stat-comparison-item">
        <div class="stat-comparison-label">Average Score</div>
        <div class="stat-comparison-value">${averageScore}</div>
      </div>
      <div class="stat-comparison-item">
        <div class="stat-comparison-label">Best Level</div>
        <div class="stat-comparison-value ${currentLevel >= bestLevel ? 'stat-comparison-current' : ''}">${bestLevel}</div>
      </div>
    `;

    // Add achievement message if new records
    if (currentScore > bestScore) {
      html += `<div class="stat-comparison-item" style="grid-column: 1 / -1; background: #d4edda; color: #155724;">
        <strong>🎉 New High Score! 🎉</strong>
      </div>`;
    }
    if (currentLevel > bestLevel) {
      html += `<div class="stat-comparison-item" style="grid-column: 1 / -1; background: #d4edda; color: #155724;">
        <strong>🚀 New Level Record! 🚀</strong>
      </div>`;
    }

    this.elements.comparisonStats.innerHTML = html;
  }

  private resetGame(): void {
    this.elements.gameOverScreen.classList.add('hidden');
    this.elements.startScreen.classList.remove('hidden');
    this.phase = 'idle';
    this.wordManager.resetUsedWords();
    this.elements.playerNameInput.value = '';
  }

  private quitGame(): void {
    // Clear any pending timeouts
    this.clearObstacleTimeout();
    this.stopDebugUpdate();

    // Save current word result if exists
    if (this.state.currentWord && this.currentWordStartTime > 0) {
      this.saveWordResult(false);
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
