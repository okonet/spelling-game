import type { WordConfig, Word, Difficulty } from './types';

export class WordManager {
  private words: WordConfig = { easy: [], medium: [], hard: [] };
  private usedWords: Set<string> = new Set();

  async loadWords(url: string = '/words.json'): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load words: ${response.statusText}`);
      }
      this.words = await response.json();
    } catch (error) {
      console.error('Could not load words from JSON file', error);
      throw error;
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
