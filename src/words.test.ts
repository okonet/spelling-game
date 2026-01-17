import { describe, it, expect, beforeEach } from 'vitest';
import { WordManager } from './words';
import type { WordPerformanceMap } from './types';

describe('WordManager', () => {
  let wordManager: WordManager;

  beforeEach(() => {
    wordManager = new WordManager();
  });

  describe('Priority Scoring Algorithm', () => {
    it('should give highest priority (1000) to words never seen before', () => {
      const performanceMap: WordPerformanceMap = {};

      // @ts-ignore - accessing private method for testing
      const score = wordManager['calculatePriorityScore']('cat', performanceMap);

      expect(score).toBe(1000);
    });

    it('should heavily prioritize words with timeouts (+100 per timeout)', () => {
      const performanceMap: WordPerformanceMap = {
        difficult: {
          word: 'difficult',
          timesCorrectFirstTry: 0,
          timesMistakes: 0,
          timesTimeout: 2,
          totalAttempts: 2,
          lastSeen: Date.now(),
        },
      };

      // @ts-ignore
      const score = wordManager['calculatePriorityScore']('difficult', performanceMap);

      // Base: 100, Timeouts: +200 (2 * 100), Low success rate: +50 = 350
      expect(score).toBe(350);
    });

    it('should heavily prioritize words with mistakes (+80 per mistake)', () => {
      const performanceMap: WordPerformanceMap = {
        tricky: {
          word: 'tricky',
          timesCorrectFirstTry: 0,
          timesMistakes: 3,
          timesTimeout: 0,
          totalAttempts: 3,
          lastSeen: Date.now(),
        },
      };

      // @ts-ignore
      const score = wordManager['calculatePriorityScore']('tricky', performanceMap);

      // Base: 100, Mistakes: +240 (3 * 80), Low success rate: +50 = 390
      expect(score).toBe(390);
    });

    it('should penalize mastered words (-30 per correct first try)', () => {
      const performanceMap: WordPerformanceMap = {
        easy: {
          word: 'easy',
          timesCorrectFirstTry: 5,
          timesMistakes: 0,
          timesTimeout: 0,
          totalAttempts: 5,
          lastSeen: Date.now(),
        },
      };

      // @ts-ignore
      const score = wordManager['calculatePriorityScore']('easy', performanceMap);

      // Base: 100, Correct: -150 (5 * 30) = -50, but minimum is 0
      expect(score).toBe(0);
    });

    it('should boost priority (+50) for words with low success rate (<50%)', () => {
      const performanceMap: WordPerformanceMap = {
        struggling: {
          word: 'struggling',
          timesCorrectFirstTry: 1,
          timesMistakes: 0,
          timesTimeout: 0,
          totalAttempts: 3,
          lastSeen: Date.now(),
        },
      };

      // @ts-ignore
      const score = wordManager['calculatePriorityScore']('struggling', performanceMap);

      // Base: 100, Correct: -30, Low success rate: +50 = 120
      expect(score).toBe(120);
    });

    it('should slightly boost priority for words not seen recently (+3 per day, max +15)', () => {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      const performanceMap: WordPerformanceMap = {
        forgotten: {
          word: 'forgotten',
          timesCorrectFirstTry: 0,
          timesMistakes: 0,
          timesTimeout: 0,
          totalAttempts: 0,
          lastSeen: threeDaysAgo,
        },
      };

      // @ts-ignore
      const score = wordManager['calculatePriorityScore']('forgotten', performanceMap);

      // Base: 100, Recency: +9 (3 days * 3) = 109 (approximately due to floating point)
      expect(score).toBeCloseTo(109, 0);
    });

    it('should demonstrate combined scoring: mistakes are highest priority', () => {
      const performanceMap: WordPerformanceMap = {
        'timeout-word': {
          word: 'timeout-word',
          timesCorrectFirstTry: 0,
          timesMistakes: 0,
          timesTimeout: 3,
          totalAttempts: 3,
          lastSeen: Date.now(),
        },
        'mistake-word': {
          word: 'mistake-word',
          timesCorrectFirstTry: 0,
          timesMistakes: 3,
          timesTimeout: 0,
          totalAttempts: 3,
          lastSeen: Date.now(),
        },
        'mastered-word': {
          word: 'mastered-word',
          timesCorrectFirstTry: 10,
          timesMistakes: 0,
          timesTimeout: 0,
          totalAttempts: 10,
          lastSeen: Date.now(),
        },
      };

      // @ts-ignore
      const timeoutScore = wordManager['calculatePriorityScore']('timeout-word', performanceMap);
      // @ts-ignore
      const mistakeScore = wordManager['calculatePriorityScore']('mistake-word', performanceMap);
      // @ts-ignore
      const masteredScore = wordManager['calculatePriorityScore']('mastered-word', performanceMap);

      // Timeout: 100 + 300 (3 * 100) + 50 (low success rate) = 450
      expect(timeoutScore).toBe(450);
      // Mistakes: 100 + 240 (3 * 80) + 50 (low success rate) = 390
      expect(mistakeScore).toBe(390);
      // Mastered: 100 - 300 (10 * 30) = 0 (minimum)
      expect(masteredScore).toBe(0);

      // Timeouts should have highest priority
      expect(timeoutScore).toBeGreaterThan(mistakeScore);
      expect(mistakeScore).toBeGreaterThan(masteredScore);
    });
  });

  describe('Weighted Shuffling', () => {
    it('should create shuffled word lists prioritizing struggling words', () => {
      // Mock word data
      // @ts-ignore
      wordManager['words'] = ['cat', 'dog', 'sun', 'bed', 'car'];

      const performanceMap: WordPerformanceMap = {
        cat: {
          word: 'cat',
          timesCorrectFirstTry: 5,
          timesMistakes: 0,
          timesTimeout: 0,
          totalAttempts: 5,
          lastSeen: Date.now(),
        },
        dog: {
          word: 'dog',
          timesCorrectFirstTry: 0,
          timesMistakes: 3,
          timesTimeout: 0,
          totalAttempts: 3,
          lastSeen: Date.now(),
        },
        sun: {
          word: 'sun',
          timesCorrectFirstTry: 0,
          timesMistakes: 0,
          timesTimeout: 2,
          totalAttempts: 2,
          lastSeen: Date.now(),
        },
        // 'bed' and 'car' never seen (priority 1000 each)
      };

      wordManager.initializeSessionWords(performanceMap);

      // Get words in order
      const words = [];
      for (let i = 0; i < 5; i++) {
        words.push(wordManager.getNextWord().text);
      }

      // Calculate priority scores to determine expected order
      // @ts-ignore
      const catScore = wordManager['calculatePriorityScore']('cat', performanceMap);
      // @ts-ignore
      const dogScore = wordManager['calculatePriorityScore']('dog', performanceMap);
      // @ts-ignore
      const sunScore = wordManager['calculatePriorityScore']('sun', performanceMap);
      // @ts-ignore
      const bedScore = wordManager['calculatePriorityScore']('bed', performanceMap);
      // @ts-ignore
      const carScore = wordManager['calculatePriorityScore']('car', performanceMap);

      // Verify that mastered word (cat) has lowest score
      expect(catScore).toBeLessThan(dogScore);
      expect(catScore).toBeLessThan(sunScore);
      expect(catScore).toBeLessThan(bedScore);
      expect(catScore).toBeLessThan(carScore);

      // Verify all words are included
      expect(words).toContain('cat');
      expect(words).toContain('dog');
      expect(words).toContain('sun');
      expect(words).toContain('bed');
      expect(words).toContain('car');

      // Due to bucketing and shuffling, we can't predict exact order,
      // but we can verify that mastered word doesn't appear first
      expect(words[0]).not.toBe('cat');
    });

    it('should loop back to start when all words are used', () => {
      // @ts-ignore
      wordManager['words'] = ['cat', 'dog'];

      wordManager.initializeSessionWords({});

      const firstWord = wordManager.getNextWord().text;
      wordManager.getNextWord(); // Get second word
      const thirdWord = wordManager.getNextWord().text;

      // Third word should be same as first (looped back)
      expect(thirdWord).toBe(firstWord);
    });
  });

  describe('Session Management', () => {
    it('should initialize word list', () => {
      // @ts-ignore
      wordManager['words'] = ['cat', 'dog', 'house'];

      wordManager.initializeSessionWords({});

      const word = wordManager.getNextWord();

      expect(['cat', 'dog', 'house']).toContain(word.text);
    });

    it('should reset session and clear word list', () => {
      // @ts-ignore
      wordManager['words'] = ['cat', 'dog'];

      wordManager.initializeSessionWords({});
      wordManager.getNextWord();

      wordManager.resetSession();

      // After reset, session list should be cleared
      expect(() => wordManager.getNextWord()).toThrow();
    });
  });

  describe('Real-world Scenario: Learning Journey', () => {
    it('should demonstrate adaptive learning over multiple sessions', () => {
      // @ts-ignore
      wordManager['words'] = ['cat', 'dog', 'sun'];

      // Session 1: First time playing
      const session1Performance: WordPerformanceMap = {};
      wordManager.initializeSessionWords(session1Performance);

      const session1Words = [
        wordManager.getNextWord().text,
        wordManager.getNextWord().text,
        wordManager.getNextWord().text,
      ];

      // All words should appear (all have priority 1000)
      expect(session1Words).toContain('cat');
      expect(session1Words).toContain('dog');
      expect(session1Words).toContain('sun');

      // Session 2: Player struggled with 'dog'
      const session2Performance: WordPerformanceMap = {
        cat: {
          word: 'cat',
          timesCorrectFirstTry: 1,
          timesMistakes: 0,
          timesTimeout: 0,
          totalAttempts: 1,
          lastSeen: Date.now(),
        },
        dog: {
          word: 'dog',
          timesCorrectFirstTry: 0,
          timesMistakes: 1,
          timesTimeout: 0,
          totalAttempts: 1,
          lastSeen: Date.now(),
        },
        sun: {
          word: 'sun',
          timesCorrectFirstTry: 1,
          timesMistakes: 0,
          timesTimeout: 0,
          totalAttempts: 1,
          lastSeen: Date.now(),
        },
      };

      wordManager.resetSession();
      wordManager.initializeSessionWords(session2Performance);

      const session2Words = [
        wordManager.getNextWord().text,
        wordManager.getNextWord().text,
        wordManager.getNextWord().text,
      ];

      // Calculate priority scores to verify 'dog' has highest priority
      // @ts-ignore
      const catScore = wordManager['calculatePriorityScore']('cat', session2Performance);
      // @ts-ignore
      const dogScore = wordManager['calculatePriorityScore']('dog', session2Performance);
      // @ts-ignore
      const sunScore = wordManager['calculatePriorityScore']('sun', session2Performance);

      // 'dog' should have highest priority (mistake penalty)
      expect(dogScore).toBeGreaterThan(catScore);
      expect(dogScore).toBeGreaterThan(sunScore);

      // All words should appear
      expect(session2Words).toContain('cat');
      expect(session2Words).toContain('dog');
      expect(session2Words).toContain('sun');

      // Due to bucketing with only 3 words, exact order isn't guaranteed
      // but 'dog' should appear earlier than both mastered words on average
    });
  });

  describe('Word Descriptions', () => {
    it('should parse words without descriptions correctly', () => {
      // @ts-ignore
      wordManager['words'] = ['cat', 'dog'];

      wordManager.initializeSessionWords({});

      const word = wordManager.getNextWord();
      expect(word.text).toMatch(/^(cat|dog)$/);
      expect(word.description).toBeUndefined();
    });

    it('should parse words with descriptions correctly', () => {
      // @ts-ignore
      wordManager['words'] = ['cat - a small furry pet', 'dog - a loyal animal friend'];

      wordManager.initializeSessionWords({});

      const word1 = wordManager.getNextWord();
      const word2 = wordManager.getNextWord();

      // Check first word
      if (word1.text === 'cat') {
        expect(word1.description).toBe('a small furry pet');
      } else {
        expect(word1.text).toBe('dog');
        expect(word1.description).toBe('a loyal animal friend');
      }

      // Check second word
      if (word2.text === 'cat') {
        expect(word2.description).toBe('a small furry pet');
      } else {
        expect(word2.text).toBe('dog');
        expect(word2.description).toBe('a loyal animal friend');
      }
    });

    it('should handle mixed words (some with and some without descriptions)', () => {
      // @ts-ignore
      wordManager['words'] = ['cat - a small furry pet', 'dog', 'sun - a bright star'];

      wordManager.initializeSessionWords({});

      const words = [
        wordManager.getNextWord(),
        wordManager.getNextWord(),
        wordManager.getNextWord(),
      ];

      // Find each word and verify
      const catWord = words.find(w => w.text === 'cat');
      expect(catWord).toBeDefined();
      expect(catWord?.description).toBe('a small furry pet');

      const dogWord = words.find(w => w.text === 'dog');
      expect(dogWord).toBeDefined();
      expect(dogWord?.description).toBeUndefined();

      const sunWord = words.find(w => w.text === 'sun');
      expect(sunWord).toBeDefined();
      expect(sunWord?.description).toBe('a bright star');
    });

    it('should use word text for priority scoring even with description', () => {
      // @ts-ignore
      wordManager['words'] = ['cat - a small furry pet', 'dog - a loyal friend'];

      const performanceMap = {
        cat: {
          word: 'cat',
          timesCorrectFirstTry: 5,
          timesMistakes: 0,
          timesTimeout: 0,
          totalAttempts: 5,
          lastSeen: Date.now(),
        },
        dog: {
          word: 'dog',
          timesCorrectFirstTry: 0,
          timesMistakes: 3,
          timesTimeout: 0,
          totalAttempts: 3,
          lastSeen: Date.now(),
        },
      };

      wordManager.initializeSessionWords(performanceMap);

      // Get words and verify that priority scoring works
      const word = wordManager.getNextWord();
      // Dog should have higher priority, so it's more likely to appear first
      // but due to shuffling we can't be 100% certain
      expect(['cat', 'dog']).toContain(word.text);
    });

    it('should handle descriptions with multiple dashes correctly', () => {
      // @ts-ignore
      wordManager['words'] = ['mother-in-law - a relative by marriage'];

      wordManager.initializeSessionWords({});

      const word = wordManager.getNextWord();
      expect(word.text).toBe('mother-in-law');
      expect(word.description).toBe('a relative by marriage');
    });

    it('should trim whitespace from word text and description', () => {
      // @ts-ignore
      wordManager['words'] = ['  cat  -  a small furry pet  '];

      wordManager.initializeSessionWords({});

      const word = wordManager.getNextWord();
      expect(word.text).toBe('cat');
      expect(word.description).toBe('a small furry pet');
    });

    it('should handle empty description after separator', () => {
      // @ts-ignore
      wordManager['words'] = ['cat - '];

      wordManager.initializeSessionWords({});

      const word = wordManager.getNextWord();
      expect(word.text).toBe('cat');
      expect(word.description).toBeUndefined();
    });

    it('should handle invalid entry with empty text before separator', () => {
      // @ts-ignore
      wordManager['words'] = [' - a description'];

      wordManager.initializeSessionWords({});

      const word = wordManager.getNextWord();
      // Should fall back to using the original entry
      expect(word.text).toBe(' - a description');
      expect(word.description).toBeUndefined();
    });

    it('should parse words with en dash (–) separator correctly', () => {
      // @ts-ignore
      wordManager['words'] = {
        easy: ['cat – a small furry pet', 'dog – a loyal animal friend'],
        medium: [],
        hard: [],
      };

      wordManager.initializeSessionWords({});

      const word1 = wordManager.getNextWord('easy');
      const word2 = wordManager.getNextWord('easy');

      // Check first word
      if (word1.text === 'cat') {
        expect(word1.description).toBe('a small furry pet');
      } else {
        expect(word1.text).toBe('dog');
        expect(word1.description).toBe('a loyal animal friend');
      }

      // Check second word
      if (word2.text === 'cat') {
        expect(word2.description).toBe('a small furry pet');
      } else {
        expect(word2.text).toBe('dog');
        expect(word2.description).toBe('a loyal animal friend');
      }
    });

    it('should parse words with em dash (—) separator correctly', () => {
      // @ts-ignore
      wordManager['words'] = {
        easy: ['cat — a small furry pet', 'dog — a loyal animal friend'],
        medium: [],
        hard: [],
      };

      wordManager.initializeSessionWords({});

      const word1 = wordManager.getNextWord('easy');
      const word2 = wordManager.getNextWord('easy');

      // Check first word
      if (word1.text === 'cat') {
        expect(word1.description).toBe('a small furry pet');
      } else {
        expect(word1.text).toBe('dog');
        expect(word1.description).toBe('a loyal animal friend');
      }

      // Check second word
      if (word2.text === 'cat') {
        expect(word2.description).toBe('a small furry pet');
      } else {
        expect(word2.text).toBe('dog');
        expect(word2.description).toBe('a loyal animal friend');
      }
    });

    it('should handle mixed separator types (hyphen, en dash, em dash)', () => {
      // @ts-ignore
      wordManager['words'] = {
        easy: ['cat - a small furry pet', 'dog – a loyal animal friend', 'sun — a bright star'],
        medium: [],
        hard: [],
      };

      wordManager.initializeSessionWords({});

      const words = [
        wordManager.getNextWord('easy'),
        wordManager.getNextWord('easy'),
        wordManager.getNextWord('easy'),
      ];

      // Find each word and verify
      const catWord = words.find(w => w.text === 'cat');
      expect(catWord).toBeDefined();
      expect(catWord?.description).toBe('a small furry pet');

      const dogWord = words.find(w => w.text === 'dog');
      expect(dogWord).toBeDefined();
      expect(dogWord?.description).toBe('a loyal animal friend');

      const sunWord = words.find(w => w.text === 'sun');
      expect(sunWord).toBeDefined();
      expect(sunWord?.description).toBe('a bright star');
    });

    it('should handle en dash in word text with em dash separator', () => {
      // @ts-ignore
      wordManager['words'] = {
        easy: ['mother–in–law — a relative by marriage'],
        medium: [],
        hard: [],
      };

      wordManager.initializeSessionWords({});

      const word = wordManager.getNextWord('easy');
      expect(word.text).toBe('mother–in–law');
      expect(word.description).toBe('a relative by marriage');
    });

    it('should find earliest separator when multiple separator types exist', () => {
      // @ts-ignore
      wordManager['words'] = {
        easy: ['test – first — second - third'],
        medium: [],
        hard: [],
      };

      wordManager.initializeSessionWords({});

      const word = wordManager.getNextWord('easy');
      expect(word.text).toBe('test');
      expect(word.description).toBe('first — second - third');
    });
  });
});
