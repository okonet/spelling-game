import './wordManagerStyles.css';
import type { WordConfig } from './types';

const CUSTOM_WORDS_KEY = 'spellingGame_customWords';
const DEFAULT_WORDS_URL = '/words.json';

interface CustomWordList extends WordConfig {
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
      ...words,
      lastModified: Date.now(),
    };
    localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(customWordList));
    this.customWords = customWordList;
  }

  private getCurrentWords(): WordConfig {
    if (this.customWords) {
      return {
        easy: this.customWords.easy,
        medium: this.customWords.medium,
        hard: this.customWords.hard,
      };
    }
    return this.defaultWords!;
  }

  private renderWords(): void {
    const currentWords = this.getCurrentWords();

    const easyTextarea = document.getElementById('easy-words') as HTMLTextAreaElement;
    const mediumTextarea = document.getElementById('medium-words') as HTMLTextAreaElement;
    const hardTextarea = document.getElementById('hard-words') as HTMLTextAreaElement;

    if (easyTextarea) easyTextarea.value = currentWords.easy.join('\n');
    if (mediumTextarea) mediumTextarea.value = currentWords.medium.join('\n');
    if (hardTextarea) hardTextarea.value = currentWords.hard.join('\n');

    this.updateWordCounts(currentWords);
  }

  private updateWordCounts(words: WordConfig): void {
    const easyCount = document.getElementById('easy-count');
    const mediumCount = document.getElementById('medium-count');
    const hardCount = document.getElementById('hard-count');

    if (easyCount) easyCount.textContent = `(${words.easy.length})`;
    if (mediumCount) mediumCount.textContent = `(${words.medium.length})`;
    if (hardCount) hardCount.textContent = `(${words.hard.length})`;
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
    const easyTextarea = document.getElementById('easy-words') as HTMLTextAreaElement;
    const mediumTextarea = document.getElementById('medium-words') as HTMLTextAreaElement;
    const hardTextarea = document.getElementById('hard-words') as HTMLTextAreaElement;

    if (!easyTextarea || !mediumTextarea || !hardTextarea) {
      this.showStatus('Error: Could not find word input fields', true);
      return;
    }

    const easyWords = this.parseTextareaWords(easyTextarea);
    const mediumWords = this.parseTextareaWords(mediumTextarea);
    const hardWords = this.parseTextareaWords(hardTextarea);

    // Validate that each difficulty has at least some words
    const emptyLevels: string[] = [];
    if (easyWords.length === 0) emptyLevels.push('Easy');
    if (mediumWords.length === 0) emptyLevels.push('Medium');
    if (hardWords.length === 0) emptyLevels.push('Hard');

    if (emptyLevels.length > 0) {
      this.showStatus(
        `Error: ${emptyLevels.join(', ')} difficulty level(s) must have at least one word`,
        true
      );
      return;
    }

    const newWords: WordConfig = {
      easy: easyWords,
      medium: mediumWords,
      hard: hardWords,
    };

    this.saveCustomWords(newWords);
    this.updateWordCounts(newWords);
    this.showStatus(
      `✓ Saved successfully! ${easyWords.length + mediumWords.length + hardWords.length} total words`
    );
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

    // Update word counts as user types
    const textareas = document.querySelectorAll('.word-textarea');
    textareas.forEach(textarea => {
      textarea.addEventListener('input', () => {
        const easyTextarea = document.getElementById('easy-words') as HTMLTextAreaElement;
        const mediumTextarea = document.getElementById('medium-words') as HTMLTextAreaElement;
        const hardTextarea = document.getElementById('hard-words') as HTMLTextAreaElement;

        if (easyTextarea && mediumTextarea && hardTextarea) {
          this.updateWordCounts({
            easy: this.parseTextareaWords(easyTextarea),
            medium: this.parseTextareaWords(mediumTextarea),
            hard: this.parseTextareaWords(hardTextarea),
          });
        }
      });
    });
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
