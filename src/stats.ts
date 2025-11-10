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
    const filteredSessions = sessions.filter(s => s.playerName === selectedPlayer);

    // Display player progress view
    this.displayPlayerProgress(filteredSessions);
  }

  private populatePlayerFilter(sessions: PlayerSession[]): void {
    const playerNames = Array.from(new Set(sessions.map(s => s.playerName))).sort();

    const currentValue = this.elements.playerFilter.value;
    this.elements.playerFilter.innerHTML = '';

    playerNames.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      this.elements.playerFilter.appendChild(option);
    });

    // Restore previous selection if it still exists, otherwise select first player
    if (currentValue && playerNames.includes(currentValue)) {
      this.elements.playerFilter.value = currentValue;
    } else if (playerNames.length > 0) {
      this.elements.playerFilter.value = playerNames[0];
    }
  }


  private displayPlayerProgress(sessions: PlayerSession[]): void {
    const sortedSessions = sessions.sort((a, b) => a.startTime - b.startTime);
    const playerName = sortedSessions[0]?.playerName || 'Unknown';

    // Calculate overall stats with safe defaults
    const totalGames = sortedSessions.length;
    const scores = sortedSessions.map(s => s.totalScore || 0).filter(s => !isNaN(s));
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const levels = sortedSessions.map(s => {
      if (!s.wordsPlayed || s.wordsPlayed.length === 0) return 1;
      const maxLevel = s.wordsPlayed.reduce((max, w) => {
        const level = w.level || 1;
        return Math.max(max, level);
      }, 1);
      return maxLevel;
    }).filter(l => !isNaN(l));
    const bestLevel = levels.length > 0 ? Math.max(...levels) : 1;

    // Calculate word accuracy
    const allWords = sortedSessions.flatMap(s => s.wordsPlayed || []);
    const correctFirstTry = allWords.filter(w =>
      w.attempts && w.attempts.length === 1 && w.attempts[0]?.correct
    ).length;
    const totalWords = allWords.length;
    const accuracyRate = totalWords > 0 ? Math.round((correctFirstTry / totalWords) * 100) : 0;

    const html = `
      <div class="player-progress-container">
        <div class="player-header">
          <h2 class="player-name">📊 ${this.escapeHtml(playerName)}'s Progress</h2>
          <div class="player-summary-stats">
            <div class="stat-box">
              <div class="stat-value">${totalGames}</div>
              <div class="stat-label">Games Played</div>
            </div>
            <div class="stat-box highlight">
              <div class="stat-value">${bestScore}</div>
              <div class="stat-label">Best Score</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${averageScore}</div>
              <div class="stat-label">Avg Score</div>
            </div>
            <div class="stat-box highlight">
              <div class="stat-value">${bestLevel}</div>
              <div class="stat-label">Best Level</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${accuracyRate}%</div>
              <div class="stat-label">Accuracy</div>
            </div>
          </div>
        </div>

        <div class="progress-charts">
          <div class="chart-container">
            <h3 class="chart-title">📈 Score Progress</h3>
            ${this.renderProgressChart(sortedSessions, 'score')}
          </div>

          <div class="chart-container">
            <h3 class="chart-title">🎯 Level Progression</h3>
            ${this.renderProgressChart(sortedSessions, 'level')}
          </div>
        </div>

        <div class="sessions-timeline">
          <h3 class="section-title">Recent Sessions</h3>
          ${this.renderCompactSessions(sortedSessions.slice().reverse())}
        </div>
      </div>
    `;

    this.elements.statsContent.innerHTML = html;

    // Add event listeners for expandable sessions
    sortedSessions.forEach((session) => {
      const toggleBtn = document.getElementById(`toggle-${session.sessionId}`);
      const detailsDiv = document.getElementById(`details-${session.sessionId}`);

      if (toggleBtn && detailsDiv) {
        toggleBtn.addEventListener('click', () => {
          const isExpanded = detailsDiv.classList.contains('expanded');
          if (isExpanded) {
            detailsDiv.classList.remove('expanded');
            toggleBtn.textContent = '▼ Show Details';
          } else {
            detailsDiv.classList.add('expanded');
            toggleBtn.textContent = '▲ Hide Details';
          }
        });
      }

      // Add delete button listener
      const deleteBtn = document.getElementById(`delete-${session.sessionId}`);
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('Delete this session?')) {
            this.sessionManager.deleteSession(session.sessionId);
            this.loadStats();
          }
        });
      }
    });
  }

  private renderProgressChart(sessions: PlayerSession[], type: 'score' | 'level'): string {
    const maxBarHeight = 120;
    const values = sessions.map(s => {
      if (type === 'score') return s.totalScore || 0;
      if (s.wordsPlayed.length === 0) return 1;
      return s.wordsPlayed.reduce((max, w) => Math.max(max, w.level || 1), 1);
    });

    const maxValue = values.length > 0 ? Math.max(...values, 1) : 1;

    // Calculate bar heights (minimum 10px for visibility)
    const bars = values.map((value, index) => {
      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
      const height = Math.max(10, (percentage / 100) * maxBarHeight);
      const date = new Date(sessions[index].startTime);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

      // Determine if this is an improvement
      const isImprovement = index > 0 && value > values[index - 1];
      const isDecline = index > 0 && value < values[index - 1];

      return { height, value, dateStr, isImprovement, isDecline };
    });

    // Determine trend
    const firstValue = values[0] || 0;
    const lastValue = values[values.length - 1] || 0;
    const trendIndicator = lastValue > firstValue ? '📈 Improving' :
                           lastValue < firstValue ? '📉 Declining' : '➡️ Stable';

    return `
      <div class="chart-info">
        <div class="chart-stats">
          <span>Best: <strong>${maxValue}</strong></span>
          <span>Latest: <strong>${lastValue}</strong></span>
          <span class="trend">${trendIndicator}</span>
        </div>
      </div>
      <div class="bar-chart">
        ${bars.map((bar) => `
          <div class="bar-wrapper" title="${bar.dateStr}: ${bar.value}">
            <div class="bar ${bar.isImprovement ? 'bar-up' : bar.isDecline ? 'bar-down' : ''}"
                 style="height: ${bar.height}px">
              <span class="bar-value">${bar.value}</span>
            </div>
            <span class="bar-label">${bar.dateStr}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderCompactSessions(sessions: PlayerSession[]): string {
    return sessions.slice(0, 10).map((session, index) => {
      const date = new Date(session.startTime).toLocaleDateString();
      const time = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const maxLevel = session.wordsPlayed.length > 0
        ? session.wordsPlayed.reduce((max, w) => Math.max(max, w.level || 1), 1)
        : 1;
      const correctFirstTry = session.wordsPlayed.filter(w => w.attempts.length === 1 && w.attempts[0]?.correct).length;
      const accuracy = session.wordsPlayed.length > 0
        ? Math.round((correctFirstTry / session.wordsPlayed.length) * 100)
        : 0;

      return `
        <div class="compact-session-wrapper">
          <div class="compact-session">
            <div class="session-number">#${sessions.length - index}</div>
            <div class="session-datetime">
              <div class="session-date">${date}</div>
              <div class="session-time">${time}</div>
            </div>
            <div class="session-metrics">
              <div class="metric">
                <span class="metric-icon">🎯</span>
                <span class="metric-value">${session.totalScore || 0}</span>
                <span class="metric-label">Score</span>
              </div>
              <div class="metric">
                <span class="metric-icon">📊</span>
                <span class="metric-value">L${maxLevel}</span>
                <span class="metric-label">Level</span>
              </div>
              <div class="metric">
                <span class="metric-icon">✓</span>
                <span class="metric-value">${accuracy}%</span>
                <span class="metric-label">Accuracy</span>
              </div>
              <div class="metric">
                <span class="metric-icon">❤️</span>
                <span class="metric-value">${session.livesRemaining}/3</span>
                <span class="metric-label">Lives</span>
              </div>
            </div>
            <div class="session-actions">
              <button id="toggle-${session.sessionId}" class="toggle-details-btn">▼ Show Details</button>
              <button id="delete-${session.sessionId}" class="delete-compact-btn">🗑️</button>
            </div>
          </div>
          <div id="details-${session.sessionId}" class="session-details">
            ${this.renderSessionDetails(session)}
          </div>
        </div>
      `;
    }).join('');
  }

  private renderSessionDetails(session: PlayerSession): string {
    const duration = session.endTime
      ? this.formatDuration(session.endTime - session.startTime)
      : 'In progress';

    return `
      <div class="session-details-content">
        <div class="details-summary">
          <div class="detail-item">
            <span class="detail-label">Duration:</span>
            <span class="detail-value">${duration}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Words Played:</span>
            <span class="detail-value">${session.wordsPlayed.length}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Difficulty:</span>
            <span class="detail-value difficulty-${session.difficulty}">${session.difficulty}</span>
          </div>
        </div>
        <div class="words-section">
          <h4 class="words-title">Words Attempted:</h4>
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
