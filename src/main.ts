import './style.css';
import confetti from 'canvas-confetti';

// Word list for the game
const wordList: { word: string; hint: string }[] = [
  { word: 'cat', hint: 'A small furry pet that meows' },
  { word: 'dog', hint: 'A loyal pet that barks' },
  { word: 'house', hint: 'A place where people live' },
  { word: 'tree', hint: 'A tall plant with leaves and branches' },
  { word: 'book', hint: 'You read this' },
  { word: 'water', hint: 'A liquid you drink' },
  { word: 'sun', hint: 'A bright star in the sky' },
  { word: 'moon', hint: 'You see this at night' },
  { word: 'apple', hint: 'A red or green fruit' },
  { word: 'bird', hint: 'An animal that can fly' },
  { word: 'fish', hint: 'An animal that lives in water' },
  { word: 'school', hint: 'A place where children learn' },
  { word: 'friend', hint: 'Someone you like to play with' },
  { word: 'happy', hint: 'A feeling of joy' },
  { word: 'flower', hint: 'A colorful plant that smells nice' },
  { word: 'car', hint: 'A vehicle with four wheels' },
  { word: 'ball', hint: 'A round toy you can throw' },
  { word: 'rain', hint: 'Water falling from clouds' },
  { word: 'snow', hint: 'White frozen water from the sky' },
  { word: 'home', hint: 'Where your family lives' },
];

class SpellingGame {
  private currentWord: { word: string; hint: string };
  private score: number = 0;
  private lives: number = 5;
  private isAnimating: boolean = false;

  private userInput: HTMLInputElement;
  private playSound: HTMLButtonElement;
  private feedback: HTMLElement;
  private scoreElement: HTMLElement;
  private livesElement: HTMLElement;
  private wordHint: HTMLElement;
  private character: HTMLElement;
  private obstacle: HTMLElement;
  private gameOverScreen: HTMLElement;
  private finalScoreElement: HTMLElement;
  private restartBtn: HTMLButtonElement;

  constructor() {
    this.userInput = document.getElementById('userInput') as HTMLInputElement;
    this.playSound = document.getElementById('playSound') as HTMLButtonElement;
    this.feedback = document.getElementById('feedback') as HTMLElement;
    this.scoreElement = document.getElementById('score') as HTMLElement;
    this.livesElement = document.getElementById('lives') as HTMLElement;
    this.wordHint = document.getElementById('wordHint') as HTMLElement;
    this.character = document.getElementById('character') as HTMLElement;
    this.obstacle = document.getElementById('obstacle') as HTMLElement;
    this.gameOverScreen = document.getElementById('gameOver') as HTMLElement;
    this.finalScoreElement = document.getElementById('finalScore') as HTMLElement;
    this.restartBtn = document.getElementById('restartBtn') as HTMLButtonElement;

    this.currentWord = this.getRandomWord();
    this.setupEventListeners();
    this.updateDisplay();
    this.speakWord(); // Speak the first word
  }

  private getRandomWord(): { word: string; hint: string } {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    return wordList[randomIndex];
  }

  private setupEventListeners(): void {
    this.userInput.addEventListener('keypress', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !this.isAnimating) {
        this.handleSubmit();
      }
    });

    this.playSound.addEventListener('click', () => this.speakWord());
    this.restartBtn.addEventListener('click', () => this.restartGame());
  }

  private speakWord(): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(this.currentWord.word);
      utterance.rate = 0.8;
      utterance.lang = 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }

  private handleSubmit(): void {
    const userAnswer = this.userInput.value.trim().toLowerCase();
    
    if (userAnswer === '') {
      return;
    }

    this.isAnimating = true;
    this.userInput.disabled = true;

    // Show the obstacle with the typed word
    this.obstacle.textContent = userAnswer;
    this.obstacle.className = 'obstacle moving';

    // Wait for obstacle to reach the character position
    setTimeout(() => {
      if (userAnswer === this.currentWord.word.toLowerCase()) {
        this.handleCorrectAnswer();
      } else {
        this.handleIncorrectAnswer(userAnswer);
      }
    }, 2000); // Match the animation duration
  }

  private handleCorrectAnswer(): void {
    // Character jumps over the obstacle
    this.character.classList.add('jumping');
    
    // Update score
    this.score += 10;
    this.updateDisplay();

    // Show success feedback
    this.showFeedback(`✓ Perfect! "${this.currentWord.word}" is correct!`, 'correct');

    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Clean up and move to next word
    setTimeout(() => {
      this.character.classList.remove('jumping');
      this.nextWord();
    }, 1500);
  }

  private handleIncorrectAnswer(userAnswer: string): void {
    // Character crashes
    this.character.classList.add('crash');
    
    // Lose a life
    this.lives--;
    this.updateDisplay();

    // Show error feedback with correct spelling
    this.showFeedback(
      `✗ Oops! You typed "${userAnswer}". The correct spelling is "${this.currentWord.word}". Try again!`,
      'incorrect'
    );

    // Clean up after crash animation
    setTimeout(() => {
      this.character.classList.remove('crash');
      
      if (this.lives <= 0) {
        this.gameOver();
      } else {
        // Allow retry with the same word
        this.resetForRetry();
      }
    }, 1000);
  }

  private resetForRetry(): void {
    // Reset obstacle position
    this.obstacle.className = 'obstacle';
    this.obstacle.textContent = '';
    
    // Clear input and re-enable
    this.userInput.value = '';
    this.userInput.disabled = false;
    this.userInput.focus();
    this.isAnimating = false;

    // Speak the word again
    setTimeout(() => {
      this.speakWord();
    }, 500);
  }

  private showFeedback(message: string, type: 'correct' | 'incorrect'): void {
    this.feedback.textContent = message;
    this.feedback.className = `feedback ${type}`;
  }

  private nextWord(): void {
    this.currentWord = this.getRandomWord();
    
    // Reset everything
    this.obstacle.className = 'obstacle';
    this.obstacle.textContent = '';
    this.feedback.textContent = '';
    this.feedback.className = 'feedback empty';
    this.userInput.value = '';
    this.userInput.disabled = false;
    this.userInput.focus();
    this.isAnimating = false;

    // Update display and speak new word
    this.wordHint.textContent = this.currentWord.hint;
    setTimeout(() => {
      this.speakWord();
    }, 300);
  }

  private updateDisplay(): void {
    this.scoreElement.textContent = this.score.toString();
    this.wordHint.textContent = this.currentWord.hint;
    
    // Update lives display with hearts
    this.livesElement.innerHTML = '❤️'.repeat(this.lives) + '🖤'.repeat(5 - this.lives);
  }

  private gameOver(): void {
    this.finalScoreElement.textContent = this.score.toString();
    this.gameOverScreen.classList.remove('hidden');
  }

  private restartGame(): void {
    // Reset all game state
    this.score = 0;
    this.lives = 5;
    this.isAnimating = false;
    
    // Hide game over screen
    this.gameOverScreen.classList.add('hidden');
    
    // Reset UI elements
    this.obstacle.className = 'obstacle';
    this.obstacle.textContent = '';
    this.feedback.textContent = '';
    this.feedback.className = 'feedback empty';
    this.userInput.value = '';
    this.userInput.disabled = false;
    this.character.className = 'character';
    
    // Get new word
    this.currentWord = this.getRandomWord();
    this.updateDisplay();
    this.userInput.focus();
    
    // Speak the new word
    setTimeout(() => {
      this.speakWord();
    }, 300);
  }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SpellingGame();
});
