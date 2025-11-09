import type { WordConfig, Word, Difficulty } from './types';

// Predefined word lists by difficulty
const defaultWords: WordConfig = {
  easy: [
    'cat', 'dog', 'sun', 'bed', 'car', 'tree', 'book', 'ball', 'fish', 'bird',
    'cake', 'door', 'milk', 'moon', 'rain', 'star', 'snow', 'frog', 'duck', 'bear'
  ],
  medium: [
    'house', 'table', 'chair', 'water', 'music', 'happy', 'friend', 'school', 'plant', 'animal',
    'winter', 'summer', 'spring', 'flower', 'garden', 'family', 'doctor', 'teacher', 'pencil', 'window'
  ],
  hard: [
    'beautiful', 'elephant', 'mountain', 'butterfly', 'telephone', 'chocolate', 'adventure', 'dinosaur', 'fantastic', 'important',
    'rainbow', 'bicycle', 'wonderful', 'different', 'mysterious', 'celebration', 'dangerous', 'imagination', 'basketball', 'understand'
  ]
};

export class WordManager {
  private words: WordConfig;
  private usedWords: Set<string> = new Set();

  constructor(customWords?: WordConfig) {
    this.words = customWords || defaultWords;
  }

  async loadCustomWords(url: string = '/words.json'): Promise<void> {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const customWords = await response.json();
        // Merge custom words with default words
        this.words = {
          easy: [...defaultWords.easy, ...(customWords.easy || [])],
          medium: [...defaultWords.medium, ...(customWords.medium || [])],
          hard: [...defaultWords.hard, ...(customWords.hard || [])]
        };
      }
    } catch (error) {
      console.warn('Could not load custom words, using defaults', error);
    }
  }

  getRandomWord(difficulty: Difficulty): Word {
    const wordList = this.words[difficulty];
    const availableWords = wordList.filter(word => !this.usedWords.has(word));

    // Reset if all words have been used
    if (availableWords.length === 0) {
      this.usedWords.clear();
      return this.getRandomWord(difficulty);
    }

    const randomIndex = Math.floor(Math.random() * availableWords.length);
    const selectedWord = availableWords[randomIndex];
    this.usedWords.add(selectedWord);

    return {
      text: selectedWord,
      difficulty
    };
  }

  resetUsedWords(): void {
    this.usedWords.clear();
  }

  getWordCount(difficulty: Difficulty): number {
    return this.words[difficulty].length;
  }
}
