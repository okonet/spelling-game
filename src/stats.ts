import './statsStyles.css';
import { SessionManager } from './sessionManager';
import type { PlayerSession, WordResult } from './types';

class StatsPage {
  private sessionManager: SessionManager;
  private elements: {
    backButton: HTMLElement;
    clearDataButton: HTMLElement;
    playerFilter: HTMLSelectElement;
    statsContent: HTMLElement;
  };

  constructor() {
    this.sessionManager = new SessionManager();

    this.elements = {
      backButton: document.getElementById('back-to-game')!,
      clearDataButton: document.getElementById('clear-data')!,
      playerFilter: document.getElementById('player-filter')! as HTMLSelectElement,
      statsContent: document.getElementById('stats-content')!
    };

    this.initializeEventListeners();
    this.loadStats();
  }

  private initializeEventListeners(): void {
    this.elements.backButton.addEventListener('click', () => {
      window.location.href = '/';
    });

    this.elements.clearDataButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all statistics? This cannot be undone.')) {
        this.sessionManager.clearAllSessions();
        this.loadStats();
      }
    });

    this.elements.playerFilter.addEventListener('change', () => {
      this.loadStats();
    });
  }

  private loadStats(): void {
    const sessions = this.sessionManager.getAllSessions();

    if (sessions.length === 0) {
      this.elements.statsContent.innerHTML = '<p class="no-data-message">No game sessions found. Play some games first!</p>';
      return;
    }

    // Populate player filter
    this.populatePlayerFilter(sessions);

    // Filter sessions
    const selectedPlayer = this.elements.playerFilter.value;
    const filteredSessions = selectedPlayer === 'all'
      ? sessions
      : sessions.filter(s => s.playerName === selectedPlayer);

    // Display sessions
    this.displaySessions(filteredSessions);
  }

  private populatePlayerFilter(sessions: PlayerSession[]): void {
    const playerNames = Array.from(new Set(sessions.map(s => s.playerName)));

    // Keep "All Players" option and add individual players
    const currentValue = this.elements.playerFilter.value;
    this.elements.playerFilter.innerHTML = '<option value="all">All Players</option>';

    playerNames.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      this.elements.playerFilter.appendChild(option);
    });

    // Restore previous selection if it still exists
    if (currentValue && playerNames.includes(currentValue)) {
      this.elements.playerFilter.value = currentValue;
    }
  }

  private displaySessions(sessions: PlayerSession[]): void {
    // Sort sessions by most recent first
    const sortedSessions = sessions.sort((a, b) => b.startTime - a.startTime);

    const html = sortedSessions.map(session => this.renderSession(session)).join('');
    this.elements.statsContent.innerHTML = html;

    // Add delete buttons event listeners
    sortedSessions.forEach(session => {
      const deleteBtn = document.getElementById(`delete-${session.sessionId}`);
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          if (confirm('Delete this session?')) {
            this.sessionManager.deleteSession(session.sessionId);
            this.loadStats();
          }
        });
      }
    });
  }

  private renderSession(session: PlayerSession): string {
    const duration = session.endTime
      ? this.formatDuration(session.endTime - session.startTime)
      : 'In progress';

    const date = new Date(session.startTime).toLocaleString();

    return `
      <div class="session-card">
        <div class="session-header">
          <div class="session-info">
            <h2 class="session-player-name">${this.escapeHtml(session.playerName)}</h2>
            <span class="session-date">${date}</span>
          </div>
          <button id="delete-${session.sessionId}" class="delete-session-btn">🗑️</button>
        </div>

        <div class="session-summary">
          <div class="summary-item">
            <span class="summary-label">Difficulty:</span>
            <span class="summary-value difficulty-${session.difficulty}">${session.difficulty}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Score:</span>
            <span class="summary-value">${session.totalScore}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Words Played:</span>
            <span class="summary-value">${session.wordsPlayed.length}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Lives Remaining:</span>
            <span class="summary-value">${session.livesRemaining}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Duration:</span>
            <span class="summary-value">${duration}</span>
          </div>
        </div>

        <div class="words-section">
          <h3 class="words-title">Words Attempted:</h3>
          ${this.renderWords(session.wordsPlayed)}
        </div>
      </div>
    `;
  }

  private renderWords(words: WordResult[]): string {
    if (words.length === 0) {
      return '<p class="no-words">No words attempted yet.</p>';
    }

    return words.map(word => {
      const allCorrect = word.attempts.every(a => a.correct);
      const finalCorrect = word.attempts[word.attempts.length - 1]?.correct;

      return `
        <div class="word-card ${finalCorrect ? 'word-success' : 'word-failure'}">
          <div class="word-header">
            <span class="word-text">"${this.escapeHtml(word.word)}"</span>
            <span class="word-score">+${word.scoreEarned} pts</span>
          </div>
          <div class="word-attempts">
            <span class="attempts-label">Attempts (${word.attempts.length}):</span>
            <div class="attempts-list">
              ${word.attempts.map((attempt, index) => `
                <span class="attempt ${attempt.correct ? 'attempt-correct' : 'attempt-incorrect'}">
                  ${index + 1}. "${this.escapeHtml(attempt.spelling)}" ${attempt.correct ? '✓' : '✗'}
                </span>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize stats page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new StatsPage();
});
