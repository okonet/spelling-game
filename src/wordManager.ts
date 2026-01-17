import './wordManagerStyles.css';
import type { WordConfig } from './types';

const CUSTOM_WORDS_KEY = 'spellingGame_customWords';
const DEFAULT_WORDS_URL = '/words.json';

interface CustomWordList {
  words: WordConfig;
  lastModified: number;
}

class WordManagerUI {
  private defaultWords: WordConfig | null = null;
  private customWords: CustomWordList | null = null;

  async initialize(): Promise<void> {
    await this.loadDefaultWords();
    this.loadCustomWords();
    this.setupEventListeners();
    this.renderWords();
  }

  private async loadDefaultWords(): Promise<void> {
    try {
      const response = await fetch(DEFAULT_WORDS_URL);
      if (!response.ok) {
        throw new Error(`Failed to load default words: ${response.statusText}`);
      }
      this.defaultWords = await response.json();
    } catch (error) {
      console.error('Could not load default words', error);
      throw error;
    }
  }

  private loadCustomWords(): void {
    const stored = localStorage.getItem(CUSTOM_WORDS_KEY);
    if (stored) {
      try {
        this.customWords = JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse custom words from localStorage', error);
        this.customWords = null;
      }
    }
  }

  private saveCustomWords(words: WordConfig): void {
    const customWordList: CustomWordList = {
      words,
      lastModified: Date.now(),
    };
    localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(customWordList));
    this.customWords = customWordList;
  }

  private getCurrentWords(): WordConfig {
    if (this.customWords) {
      return this.customWords.words;
    }
    return this.defaultWords!;
  }

  private renderWords(): void {
    const currentWords = this.getCurrentWords();

    const wordsTextarea = document.getElementById('words') as HTMLTextAreaElement;

    if (wordsTextarea) wordsTextarea.value = currentWords.join('\n');

    this.updateWordCount(currentWords);
  }

  private updateWordCount(words: WordConfig): void {
    const wordCount = document.getElementById('word-count');

    if (wordCount) wordCount.textContent = `(${words.length})`;
  }

  private parseTextareaWords(textarea: HTMLTextAreaElement): string[] {
    return textarea.value
      .split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0);
  }

  private showStatus(message: string, isError: boolean = false): void {
    const statusElement = document.getElementById('status-message');
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `status-message ${isError ? 'error' : 'success'}`;
    statusElement.classList.remove('hidden');

    setTimeout(() => {
      statusElement.classList.add('hidden');
    }, 3000);
  }

  private handleSave(): void {
    const wordsTextarea = document.getElementById('words') as HTMLTextAreaElement;

    if (!wordsTextarea) {
      this.showStatus('Error: Could not find word input field', true);
      return;
    }

    const words = this.parseTextareaWords(wordsTextarea);

    // Validate that we have at least some words
    if (words.length === 0) {
      this.showStatus('Error: You must have at least one word', true);
      return;
    }

    this.saveCustomWords(words);
    this.updateWordCount(words);
    this.showStatus(`✓ Saved successfully! ${words.length} total words`);
  }

  private async handleReset(): Promise<void> {
    if (
      !confirm(
        'Are you sure you want to reset to default words? This will delete all your custom changes.'
      )
    ) {
      return;
    }

    localStorage.removeItem(CUSTOM_WORDS_KEY);
    this.customWords = null;
    this.renderWords();
    this.showStatus('✓ Reset to default words');
  }

  private handleBackToMenu(): void {
    window.location.href = '/';
  }

  private setupEventListeners(): void {
    const saveButton = document.getElementById('save-words');
    const resetButton = document.getElementById('reset-words');
    const backButton = document.getElementById('back-to-menu');

    if (saveButton) {
      saveButton.addEventListener('click', () => this.handleSave());
    }

    if (resetButton) {
      resetButton.addEventListener('click', () => this.handleReset());
    }

    if (backButton) {
      backButton.addEventListener('click', () => this.handleBackToMenu());
    }

    // Update word count as user types
    const textarea = document.getElementById('words') as HTMLTextAreaElement;
    if (textarea) {
      textarea.addEventListener('input', () => {
        this.updateWordCount(this.parseTextareaWords(textarea));
      });
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const wordManager = new WordManagerUI();
  try {
    await wordManager.initialize();
    console.log('Word Manager initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Word Manager', error);
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
      statusElement.textContent = 'Error: Failed to load word lists';
      statusElement.className = 'status-message error';
      statusElement.classList.remove('hidden');
    }
  }
});

export { WordManagerUI, CUSTOM_WORDS_KEY };
