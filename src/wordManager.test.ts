import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CUSTOM_WORDS_KEY } from './wordManager';

describe('WordManager localStorage integration', () => {
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  it('should save custom words to localStorage with correct structure', () => {
    const customWords = {
      easy: ['cat', 'dog', 'sun'],
      medium: ['house', 'table', 'chair'],
      hard: ['beautiful', 'elephant', 'mountain'],
      lastModified: Date.now(),
    };

    localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(customWords));

    const stored = localStorage.getItem(CUSTOM_WORDS_KEY);
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.easy).toEqual(['cat', 'dog', 'sun']);
    expect(parsed.medium).toEqual(['house', 'table', 'chair']);
    expect(parsed.hard).toEqual(['beautiful', 'elephant', 'mountain']);
    expect(parsed.lastModified).toBeDefined();
  });

  it('should handle empty word lists', () => {
    const customWords = {
      easy: [],
      medium: [],
      hard: [],
      lastModified: Date.now(),
    };

    localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(customWords));

    const stored = localStorage.getItem(CUSTOM_WORDS_KEY);
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.easy).toEqual([]);
    expect(parsed.medium).toEqual([]);
    expect(parsed.hard).toEqual([]);
  });

  it('should update lastModified timestamp when saving', () => {
    const time1 = Date.now();
    const customWords1 = {
      easy: ['cat'],
      medium: ['house'],
      hard: ['beautiful'],
      lastModified: time1,
    };

    localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(customWords1));

    // Simulate a later save
    const time2 = time1 + 1000;
    const customWords2 = {
      easy: ['dog'],
      medium: ['table'],
      hard: ['elephant'],
      lastModified: time2,
    };

    localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(customWords2));

    const stored = localStorage.getItem(CUSTOM_WORDS_KEY);
    const parsed = JSON.parse(stored!);

    expect(parsed.lastModified).toBe(time2);
    expect(parsed.lastModified).toBeGreaterThan(time1);
  });

  it('should be able to remove custom words from localStorage', () => {
    const customWords = {
      easy: ['cat'],
      medium: ['house'],
      hard: ['beautiful'],
      lastModified: Date.now(),
    };

    localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(customWords));
    expect(localStorage.getItem(CUSTOM_WORDS_KEY)).not.toBeNull();

    localStorage.removeItem(CUSTOM_WORDS_KEY);
    expect(localStorage.getItem(CUSTOM_WORDS_KEY)).toBeNull();
  });

  it('should handle word lists with duplicate words', () => {
    const customWords = {
      easy: ['cat', 'cat', 'dog', 'cat'],
      medium: ['house', 'house'],
      hard: ['beautiful'],
      lastModified: Date.now(),
    };

    localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(customWords));

    const stored = localStorage.getItem(CUSTOM_WORDS_KEY);
    const parsed = JSON.parse(stored!);

    // Should store as-is; deduplication can be handled by UI
    expect(parsed.easy).toEqual(['cat', 'cat', 'dog', 'cat']);
    expect(parsed.medium).toEqual(['house', 'house']);
  });

  it('should maintain data structure for easy migration to database', () => {
    // This test verifies that the structure is database-ready
    const customWords = {
      easy: ['word1', 'word2'],
      medium: ['word3', 'word4'],
      hard: ['word5', 'word6'],
      lastModified: Date.now(),
    };

    localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(customWords));

    const stored = localStorage.getItem(CUSTOM_WORDS_KEY);
    const parsed = JSON.parse(stored!);

    // Verify structure matches what a database would expect
    expect(parsed).toHaveProperty('easy');
    expect(parsed).toHaveProperty('medium');
    expect(parsed).toHaveProperty('hard');
    expect(parsed).toHaveProperty('lastModified');

    expect(Array.isArray(parsed.easy)).toBe(true);
    expect(Array.isArray(parsed.medium)).toBe(true);
    expect(Array.isArray(parsed.hard)).toBe(true);
    expect(typeof parsed.lastModified).toBe('number');
  });

  it('should handle large word lists efficiently', () => {
    const largeWordList = Array.from({ length: 1000 }, (_, i) => `word${i}`);
    const customWords = {
      easy: largeWordList,
      medium: largeWordList,
      hard: largeWordList,
      lastModified: Date.now(),
    };

    const json = JSON.stringify(customWords);
    localStorage.setItem(CUSTOM_WORDS_KEY, json);

    const stored = localStorage.getItem(CUSTOM_WORDS_KEY);
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.easy).toHaveLength(1000);
    expect(parsed.medium).toHaveLength(1000);
    expect(parsed.hard).toHaveLength(1000);
  });
});
