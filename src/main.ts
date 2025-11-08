import './style.css';

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
  private streak: number = 0;
  private correctCount: number = 0;
  private incorrectCount: number = 0;

  private userInput: HTMLInputElement;
  private submitBtn: HTMLButtonElement;
  private playSound: HTMLButtonElement;
  private feedback: HTMLElement;
  private scoreElement: HTMLElement;
  private streakElement: HTMLElement;
  private correctElement: HTMLElement;
  private incorrectElement: HTMLElement;
  private wordHint: HTMLElement;

  constructor() {
    this.userInput = document.getElementById('userInput') as HTMLInputElement;
    this.submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
    this.playSound = document.getElementById('playSound') as HTMLButtonElement;
    this.feedback = document.getElementById('feedback') as HTMLElement;
    this.scoreElement = document.getElementById('score') as HTMLElement;
    this.streakElement = document.getElementById('streak') as HTMLElement;
    this.correctElement = document.getElementById('correct') as HTMLElement;
    this.incorrectElement = document.getElementById('incorrect') as HTMLElement;
    this.wordHint = document.getElementById('wordHint') as HTMLElement;

    this.currentWord = this.getRandomWord();
    this.setupEventListeners();
    this.updateDisplay();
  }

  private getRandomWord(): { word: string; hint: string } {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    return wordList[randomIndex];
  }

  private setupEventListeners(): void {
    this.submitBtn.addEventListener('click', () => this.checkAnswer());
    
    this.userInput.addEventListener('keypress', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        this.checkAnswer();
      }
    });

    this.playSound.addEventListener('click', () => this.speakWord());
  }

  private speakWord(): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(this.currentWord.word);
      utterance.rate = 0.8; // Slower speech for learning
      utterance.lang = 'en-US';
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);
    } else {
      this.showFeedback('Speech synthesis not supported in your browser', 'incorrect');
    }
  }

  private checkAnswer(): void {
    const userAnswer = this.userInput.value.trim().toLowerCase();
    
    if (userAnswer === '') {
      return;
    }

    if (userAnswer === this.currentWord.word.toLowerCase()) {
      this.correctCount++;
      this.score += 10;
      this.streak++;
      this.showFeedback(`✓ Correct! The word is "${this.currentWord.word}"`, 'correct');
      
      // Move to next word after a short delay
      setTimeout(() => {
        this.nextWord();
      }, 1500);
    } else {
      this.incorrectCount++;
      this.streak = 0;
      this.showFeedback(
        `✗ Incorrect. The correct spelling is "${this.currentWord.word}". Try again!`,
        'incorrect'
      );
    }

    this.updateDisplay();
    this.userInput.value = '';
  }

  private showFeedback(message: string, type: 'correct' | 'incorrect'): void {
    this.feedback.textContent = message;
    this.feedback.className = `feedback ${type}`;
  }

  private nextWord(): void {
    this.currentWord = this.getRandomWord();
    this.feedback.textContent = '';
    this.feedback.className = 'feedback';
    this.wordHint.textContent = this.currentWord.hint;
    this.speakWord(); // Automatically speak the new word
    this.userInput.focus();
  }

  private updateDisplay(): void {
    this.scoreElement.textContent = this.score.toString();
    this.streakElement.textContent = this.streak.toString();
    this.correctElement.textContent = this.correctCount.toString();
    this.incorrectElement.textContent = this.incorrectCount.toString();
    this.wordHint.textContent = this.currentWord.hint;
  }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SpellingGame();
});
