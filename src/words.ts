import type { WordConfig, Word, Difficulty, WordPerformanceMap } from './types';

const CUSTOM_WORDS_KEY = 'spellingGame_customWords';
const DESCRIPTION_SEPARATOR = ' - '; // Separator between word and description

export class WordManager {
  private words: WordConfig = { easy: [], medium: [], hard: [] };
  private sessionWordLists: Map<Difficulty, string[]> = new Map();
  private sessionWordIndices: Map<Difficulty, number> = new Map();

  async loadWords(url: string = '/words.json'): Promise<void> {
    try {
      // First, check localStorage for custom words
      const customWordsJson = localStorage.getItem(CUSTOM_WORDS_KEY);
      if (customWordsJson) {
        try {
          const customWords = JSON.parse(customWordsJson);

          // Validate the structure and data types
          if (
            !customWords ||
            typeof customWords !== 'object' ||
            !Array.isArray(customWords.easy) ||
            !Array.isArray(customWords.medium) ||
            !Array.isArray(customWords.hard)
          ) {
            throw new Error('Invalid custom words structure');
          }

          // Validate that all elements are strings
          const isValidArray = (arr: unknown[]): arr is string[] =>
            arr.every(item => typeof item === 'string');

          if (
            !isValidArray(customWords.easy) ||
            !isValidArray(customWords.medium) ||
            !isValidArray(customWords.hard)
          ) {
            throw new Error('Custom words must be arrays of strings');
          }

          this.words = {
            easy: customWords.easy,
            medium: customWords.medium,
            hard: customWords.hard,
          };
          console.log('Loaded custom words from localStorage');
          return;
        } catch (error) {
          console.error('Failed to parse or validate custom words from localStorage', error);
          // Fall through to load default words
        }
      }

      // Load default words from JSON file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load words: ${response.statusText}`);
      }
      this.words = await response.json();
      console.log('Loaded default words from JSON file');
    } catch (error) {
      console.error('Could not load words from JSON file', error);
      throw error;
    }
  }

  /**
   * Initialize shuffled word lists for a new session based on performance history
   */
  initializeSessionWords(performanceMap: WordPerformanceMap): void {
    this.sessionWordLists.clear();
    this.sessionWordIndices.clear();

    (['easy', 'medium', 'hard'] as Difficulty[]).forEach(difficulty => {
      const shuffled = this.createWeightedShuffledList(difficulty, performanceMap);
      this.sessionWordLists.set(difficulty, shuffled);
      this.sessionWordIndices.set(difficulty, 0);
    });
  }

  /**
   * Parse a word entry that may contain a description separated by ' - '
   * Example: "cat - a small furry pet" returns { text: "cat", description: "a small furry pet" }
   */
  private parseWordEntry(entry: string): { text: string; description?: string } {
    const separatorIndex = entry.indexOf(DESCRIPTION_SEPARATOR);
    if (separatorIndex === -1) {
      // No description, return word as-is
      return { text: entry };
    }

    const text = entry.substring(0, separatorIndex).trim();
    const description = entry.substring(separatorIndex + DESCRIPTION_SEPARATOR.length).trim();

    // Validate that the word text is not empty
    if (!text) {
      console.warn(`Invalid word entry with empty text: "${entry}"`);
      return { text: entry }; // Return original entry as fallback
    }

    // Return undefined for description if it's empty after trimming
    return { text, description: description || undefined };
  }

  /**
   * Get next word from the shuffled session list
   */
  getNextWord(difficulty: Difficulty): Word {
    const wordList = this.sessionWordLists.get(difficulty);
    let index = this.sessionWordIndices.get(difficulty) || 0;

    if (!wordList || wordList.length === 0) {
      throw new Error(`No words available for difficulty: ${difficulty}`);
    }

    // Loop back to start if we've gone through all words
    if (index >= wordList.length) {
      index = 0;
    }

    const wordEntry = wordList[index];
    this.sessionWordIndices.set(difficulty, index + 1);

    const parsed = this.parseWordEntry(wordEntry);
    return {
      text: parsed.text,
      difficulty,
      description: parsed.description,
    };
  }

  /**
   * Get next word with weighted difficulty distribution
   * @param weights - Object with difficulty weights (e.g., { easy: 0.7, medium: 0.3, hard: 0 })
   */
  getNextWordMixed(weights: { easy: number; medium: number; hard: number }): Word {
    // Normalize weights to ensure they sum to 1
    const total = weights.easy + weights.medium + weights.hard;
    const normalized = {
      easy: weights.easy / total,
      medium: weights.medium / total,
      hard: weights.hard / total,
    };

    // Random selection based on weights
    const rand = Math.random();
    let cumulative = 0;
    let selectedDifficulty: Difficulty = 'easy';

    for (const [difficulty, weight] of Object.entries(normalized)) {
      cumulative += weight;
      if (rand <= cumulative) {
        selectedDifficulty = difficulty as Difficulty;
        break;
      }
    }

    return this.getNextWord(selectedDifficulty);
  }

  /**
   * Create a weighted shuffled list prioritizing words that need practice
   */
  private createWeightedShuffledList(
    difficulty: Difficulty,
    performanceMap: WordPerformanceMap
  ): string[] {
    const wordList = [...this.words[difficulty]];

    // Calculate priority score for each word (using just the word text for scoring)
    const wordScores = wordList.map(wordEntry => {
      const parsed = this.parseWordEntry(wordEntry);
      return {
        word: wordEntry, // Keep the full entry (with description)
        score: this.calculatePriorityScore(parsed.text, performanceMap),
      };
    });

    // Sort by score (higher score = needs more practice = should appear earlier)
    wordScores.sort((a, b) => b.score - a.score);

    // Add some randomization while maintaining general priority order
    const result: string[] = [];
    const bucketSize = 10; // Group words in buckets of similar priority

    for (let i = 0; i < wordScores.length; i += bucketSize) {
      const bucket = wordScores.slice(i, i + bucketSize);
      // Shuffle within each bucket for variety
      this.shuffleArray(bucket);
      result.push(...bucket.map(item => item.word));
    }

    return result;
  }

  /**
   * Calculate priority score for a word (higher = needs more practice)
   * Heavily prioritizes words with mistakes and timeouts for faster memorization
   */
  private calculatePriorityScore(word: string, performanceMap: WordPerformanceMap): number {
    const perf = performanceMap[word.toLowerCase()];

    if (!perf) {
      // Never seen before - highest priority
      return 1000;
    }

    let score = 100; // Base score

    // Penalties for good performance (lower score = less frequent)
    score -= perf.timesCorrectFirstTry * 30;

    // HIGH PRIORITY: Words with mistakes and timeouts need maximum repetition
    score += perf.timesTimeout * 100; // Timeouts = word not memorized at all
    score += perf.timesMistakes * 80; // Mistakes = word partially learned but needs work

    // Calculate success rate - if low, boost priority even more
    const totalAttempts = perf.totalAttempts;
    const successRate = perf.timesCorrectFirstTry / Math.max(totalAttempts, 1);
    if (successRate < 0.5 && totalAttempts >= 2) {
      // Less than 50% success rate = needs serious practice
      score += 50;
    }

    // Small bonus for words not seen recently (but mistakes are more important)
    const daysSinceLastSeen = (Date.now() - perf.lastSeen) / (1000 * 60 * 60 * 24);
    if (daysSinceLastSeen > 1) {
      score += Math.min(daysSinceLastSeen * 3, 15);
    }

    return Math.max(score, 0);
  }

  /**
   * Fisher-Yates shuffle algorithm
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  resetSession(): void {
    this.sessionWordLists.clear();
    this.sessionWordIndices.clear();
  }

  getWordCount(difficulty: Difficulty): number {
    return this.words[difficulty].length;
  }
}
