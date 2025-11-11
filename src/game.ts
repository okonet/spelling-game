import confetti from 'canvas-confetti';
import type {
  GameState,
  GamePhase,
  Difficulty,
  WordAttempt,
  WordResult,
  SpeedTier,
  UserProfile,
  VoiceSettings,
} from './types';
import { WordManager } from './words';
import { AudioManager } from './audio';
import { SessionManager } from './sessionManager';
import { ProfileManager } from './profileManager';

export class SpellingGame {
  private state: GameState;
  private wordManager: WordManager;
  private audioManager: AudioManager;
  private sessionManager: SessionManager;
  private profileManager: ProfileManager;
  private phase: GamePhase = 'idle';
  private currentWordStartTime: number = 0;
  private obstacleStartTime: number = 0;
  private answerSubmitTime: number = 0;
  private obstacleTimeoutId: number | null = null;
  private debugMode: boolean = false;
  private debugUpdateInterval: number | null = null;
  private speakingStartTime: number = 0;
  private speakingEndTime: number = 0;
  private elements: {
    startScreen: HTMLElement;
    gameScreen: HTMLElement;
    gameOverScreen: HTMLElement;
    wordInput: HTMLInputElement;
    scoreDisplay: HTMLElement;
    livesDisplay: HTMLElement;
    levelDisplay: HTMLElement;
    currentWordDisplay: HTMLElement;
    errorMessage: HTMLElement;
    character: HTMLElement;
    obstacle: HTMLElement;
    speechBubble: HTMLElement;
    speechText: HTMLElement;
    ughText: HTMLElement;
    finalScore: HTMLElement;
    finalLevel: HTMLElement;
    comparisonStats: HTMLElement;
    playerNameDisplay: HTMLElement;
    levelUpOverlay: HTMLElement;
    levelUpMessage: HTMLElement;
    startGameButton: HTMLElement;
    playAgainButton: HTMLElement;
    speakAgainButton: HTMLElement;
    viewStatsButton: HTMLElement;
    quitButton: HTMLElement;
    debugPanel: HTMLElement;
    debugInfo: HTMLElement;
    debugTimelineBar: HTMLElement;
    debugSpeaking: HTMLElement;
    debugTyping: HTMLElement;
    debugJumpPoint: HTMLElement;
    speedBonus: HTMLElement;
    speedTierText: HTMLElement;
    speedMultiplierText: HTMLElement;
    // Profile-related elements
    profileSelector: HTMLElement;
    createProfileBtn: HTMLElement;
    createProfileModal: HTMLElement;
    editProfileModal: HTMLElement;
    createProfileForm: HTMLFormElement;
    editProfileForm: HTMLFormElement;
  };

  constructor() {
    this.wordManager = new WordManager();
    this.audioManager = new AudioManager();
    this.sessionManager = new SessionManager();
    this.profileManager = new ProfileManager();

    this.state = {
      currentWord: null,
      currentWordAttempts: [],
      score: 0,
      lives: 3,
      difficulty: 'easy',
      isPlaying: false,
      isGameOver: false,
      userInput: '',
      showCorrectSpelling: false,
      correctSpelling: '',
      playerName: '', // Deprecated
      currentProfile: null,
      level: 1,
      wordsCompletedCorrectly: 0,
      comboCount: 0,
    };

    this.elements = {
      startScreen: document.getElementById('start-screen')!,
      gameScreen: document.getElementById('game-screen')!,
      gameOverScreen: document.getElementById('game-over-screen')!,
      wordInput: document.getElementById('word-input')! as HTMLInputElement,
      scoreDisplay: document.getElementById('score')!,
      livesDisplay: document.getElementById('lives')!,
      levelDisplay: document.getElementById('level')!,
      currentWordDisplay: document.getElementById('current-word')!,
      errorMessage: document.getElementById('error-message')!,
      character: document.getElementById('character')!,
      obstacle: document.getElementById('obstacle')!,
      speechBubble: document.getElementById('speech-bubble')!,
      speechText: document.getElementById('speech-text')!,
      ughText: document.getElementById('ugh-text')!,
      finalScore: document.getElementById('final-score')!,
      finalLevel: document.getElementById('final-level')!,
      comparisonStats: document.getElementById('comparison-stats')!,
      playerNameDisplay: document.getElementById('player-name-display')!,
      levelUpOverlay: document.getElementById('level-up-overlay')!,
      levelUpMessage: document.getElementById('level-up-message')!,
      startGameButton: document.getElementById('start-game')!,
      playAgainButton: document.getElementById('play-again')!,
      speakAgainButton: document.getElementById('speak-again')!,
      viewStatsButton: document.getElementById('view-stats')!,
      quitButton: document.getElementById('quit-game')!,
      debugPanel: document.getElementById('debug-panel')!,
      debugInfo: document.getElementById('debug-info')!,
      debugTimelineBar: document.getElementById('debug-timeline-bar')!,
      debugSpeaking: document.getElementById('debug-speaking')!,
      debugTyping: document.getElementById('debug-typing')!,
      debugJumpPoint: document.getElementById('debug-jump-point')!,
      speedBonus: document.getElementById('speed-bonus')!,
      speedTierText: document.getElementById('speed-tier-text')!,
      speedMultiplierText: document.getElementById('speed-multiplier-text')!,
      // Profile-related elements
      profileSelector: document.getElementById('profile-selector')!,
      createProfileBtn: document.getElementById('create-profile-btn')!,
      createProfileModal: document.getElementById('create-profile-modal')!,
      editProfileModal: document.getElementById('edit-profile-modal')!,
      createProfileForm: document.getElementById('create-profile-form')! as HTMLFormElement,
      editProfileForm: document.getElementById('edit-profile-form')! as HTMLFormElement,
    };

    this.initializeEventListeners();
    this.initializeProfileUI();
  }

  async initialize(): Promise<void> {
    await this.wordManager.loadWords();
  }

  private initializeProfileUI(): void {
    // Render profile selector
    this.renderProfileSelector();

    // Create profile button
    this.elements.createProfileBtn.addEventListener('click', () => {
      this.openCreateProfileModal();
    });

    // Modal close buttons
    const closeCreateModal = document.getElementById('close-create-modal');
    const cancelCreate = document.getElementById('cancel-create');
    closeCreateModal?.addEventListener('click', () =>
      this.closeModal(this.elements.createProfileModal)
    );
    cancelCreate?.addEventListener('click', () =>
      this.closeModal(this.elements.createProfileModal)
    );

    const closeEditModal = document.getElementById('close-edit-modal');
    const cancelEdit = document.getElementById('cancel-edit');
    closeEditModal?.addEventListener('click', () =>
      this.closeModal(this.elements.editProfileModal)
    );
    cancelEdit?.addEventListener('click', () => this.closeModal(this.elements.editProfileModal));

    // Create profile form
    this.elements.createProfileForm.addEventListener('submit', e => {
      e.preventDefault();
      this.handleCreateProfile();
    });

    // Edit profile form
    this.elements.editProfileForm.addEventListener('submit', e => {
      e.preventDefault();
      this.handleEditProfile();
    });

    // Initialize emoji pickers
    this.initializeEmojiPicker('emoji-grid', 'select-avatar-btn', 'emoji-picker');
    this.initializeEmojiPicker('edit-emoji-grid', 'edit-avatar-btn', 'edit-emoji-picker');

    // Initialize voice settings
    this.initializeVoiceSettings();

    // Auto-repeat checkbox toggle
    const autoRepeatCheckbox = document.getElementById('profile-auto-repeat') as HTMLInputElement;
    const autoRepeatDelaySection = document.getElementById('auto-repeat-delay-setting');
    autoRepeatCheckbox?.addEventListener('change', () => {
      if (autoRepeatDelaySection) {
        autoRepeatDelaySection.style.display = autoRepeatCheckbox.checked ? 'block' : 'none';
      }
    });

    // Voice settings sliders - update labels
    const rateSlider = document.getElementById('profile-rate') as HTMLInputElement;
    const rateValue = document.getElementById('rate-value');
    rateSlider?.addEventListener('input', () => {
      if (rateValue) rateValue.textContent = rateSlider.value;
    });

    const pitchSlider = document.getElementById('profile-pitch') as HTMLInputElement;
    const pitchValue = document.getElementById('pitch-value');
    pitchSlider?.addEventListener('input', () => {
      if (pitchValue) pitchValue.textContent = pitchSlider.value;
    });

    const delaySlider = document.getElementById('profile-auto-repeat-delay') as HTMLInputElement;
    const delayValue = document.getElementById('delay-value');
    delaySlider?.addEventListener('input', () => {
      if (delayValue) delayValue.textContent = delaySlider.value;
    });

    // Voice preview button
    const previewButton = document.getElementById('preview-voice');
    previewButton?.addEventListener('click', () => {
      this.previewVoice();
    });
  }

  private renderProfileSelector(): void {
    const profiles = this.profileManager.getAllProfiles();
    const currentProfile = this.profileManager.getCurrentProfile();

    if (profiles.length === 0) {
      this.elements.profileSelector.innerHTML =
        '<p class="no-profiles-message">No profiles yet. Create one to get started!</p>';
      this.elements.startGameButton.disabled = true;
      return;
    }

    this.elements.startGameButton.disabled = false;
    this.elements.profileSelector.innerHTML = profiles
      .map(profile => {
        const isSelected = currentProfile?.email === profile.email;
        return `
        <div class="profile-card ${isSelected ? 'selected' : ''}" data-email="${profile.email}">
          <div class="profile-avatar">${profile.avatar}</div>
          <div class="profile-info">
            <div class="profile-nickname">${profile.nickname}</div>
            <div class="profile-email">${profile.email}</div>
          </div>
          <div class="profile-actions">
            <button class="profile-edit-btn" data-email="${profile.email}">✏️</button>
          </div>
        </div>
      `;
      })
      .join('');

    // Add event listeners to profile cards
    this.elements.profileSelector.querySelectorAll('.profile-card').forEach(card => {
      card.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        if (!target.classList.contains('profile-edit-btn')) {
          const email = (card as HTMLElement).dataset.email!;
          this.selectProfile(email);
        }
      });
    });

    // Add event listeners to edit buttons
    this.elements.profileSelector.querySelectorAll('.profile-edit-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const email = (btn as HTMLElement).dataset.email!;
        this.openEditProfileModal(email);
      });
    });
  }

  private selectProfile(email: string): void {
    const result = this.profileManager.selectProfile(email);
    if (result.success) {
      this.renderProfileSelector();
    }
  }

  private openCreateProfileModal(): void {
    this.elements.createProfileModal.classList.remove('hidden');
    // Reset form
    this.elements.createProfileForm.reset();
    const avatarBtn = document.getElementById('select-avatar-btn');
    if (avatarBtn) avatarBtn.textContent = '👤';
  }

  private openEditProfileModal(email: string): void {
    const profile = this.profileManager.getProfile(email);
    if (!profile) return;

    this.elements.editProfileModal.classList.remove('hidden');

    // Populate form
    (document.getElementById('edit-email') as HTMLInputElement).value = profile.email;
    (document.getElementById('edit-nickname') as HTMLInputElement).value = profile.nickname;
    const editAvatarBtn = document.getElementById('edit-avatar-btn');
    if (editAvatarBtn) editAvatarBtn.textContent = profile.avatar;
  }

  private closeModal(modal: HTMLElement): void {
    modal.classList.add('hidden');
  }

  private handleCreateProfile(): void {
    const email = (document.getElementById('profile-email') as HTMLInputElement).value.trim();
    const nickname = (document.getElementById('profile-nickname') as HTMLInputElement).value.trim();
    const avatarBtn = document.getElementById('select-avatar-btn');
    const avatar = avatarBtn?.textContent || '👤';
    const difficulty = (document.getElementById('profile-difficulty') as HTMLSelectElement)
      .value as Difficulty;

    const voiceURI = (document.getElementById('profile-voice') as HTMLSelectElement).value;
    const rate = parseFloat((document.getElementById('profile-rate') as HTMLInputElement).value);
    const pitch = parseFloat((document.getElementById('profile-pitch') as HTMLInputElement).value);
    const autoRepeat = (document.getElementById('profile-auto-repeat') as HTMLInputElement).checked;
    const autoRepeatDelay = parseInt(
      (document.getElementById('profile-auto-repeat-delay') as HTMLInputElement).value
    );

    const voiceSettings: VoiceSettings = {
      voiceURI,
      rate,
      pitch,
      autoRepeat,
      autoRepeatDelay,
    };

    const result = this.profileManager.createProfile(
      email,
      nickname,
      avatar,
      difficulty,
      voiceSettings
    );

    if (result.success) {
      this.closeModal(this.elements.createProfileModal);
      this.renderProfileSelector();
      // Auto-select the newly created profile
      if (result.profile) {
        this.profileManager.selectProfile(result.profile.email);
        this.renderProfileSelector();
      }
    } else {
      alert(result.error || 'Failed to create profile');
    }
  }

  private handleEditProfile(): void {
    const email = (document.getElementById('edit-email') as HTMLInputElement).value.trim();
    const nickname = (document.getElementById('edit-nickname') as HTMLInputElement).value.trim();
    const avatarBtn = document.getElementById('edit-avatar-btn');
    const avatar = avatarBtn?.textContent || '👤';

    const result = this.profileManager.updateProfile(email, { nickname, avatar });

    if (result.success) {
      this.closeModal(this.elements.editProfileModal);
      this.renderProfileSelector();
    } else {
      alert(result.error || 'Failed to update profile');
    }
  }

  private initializeEmojiPicker(gridId: string, buttonId: string, pickerId: string): void {
    const grid = document.getElementById(gridId);
    const button = document.getElementById(buttonId);
    const picker = document.getElementById(pickerId);

    if (!grid || !button || !picker) return;

    // Common emojis for avatars
    const emojis = [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '🤣',
      '😂',
      '🙂',
      '🙃',
      '😉',
      '😊',
      '😇',
      '🥰',
      '😍',
      '🤩',
      '😘',
      '😗',
      '😚',
      '😙',
      '😋',
      '😛',
      '😜',
      '🤪',
      '😝',
      '🤑',
      '🤗',
      '🤭',
      '🤫',
      '🤔',
      '🤐',
      '🤨',
      '😐',
      '😑',
      '😶',
      '😏',
      '😒',
      '🙄',
      '😬',
      '🤥',
      '😌',
      '😔',
      '😪',
      '🤤',
      '😴',
      '😷',
      '🤒',
      '🤕',
      '🤢',
      '🤮',
      '🤧',
      '🥵',
      '🥶',
      '🥴',
      '😵',
      '🤯',
      '🤠',
      '🥳',
      '😎',
      '🤓',
      '🧐',
      '👶',
      '👧',
      '🧒',
      '👦',
      '👩',
      '🧑',
      '👨',
      '👵',
      '🧓',
      '👴',
      '👲',
      '👳',
      '🧕',
      '👮',
      '👷',
      '💂',
      '🕵',
      '👩‍⚕️',
      '👨‍⚕️',
      '👩‍🎓',
      '👨‍🎓',
      '👩‍🏫',
      '👨‍🏫',
      '👩‍⚖️',
      '👨‍⚖️',
      '👩‍🌾',
      '👨‍🌾',
      '👩‍🍳',
      '👨‍🍳',
      '👩‍🔧',
      '👨‍🔧',
      '👩‍🏭',
      '👨‍🏭',
      '👩‍💼',
      '👨‍💼',
      '🐶',
      '🐱',
      '🐭',
      '🐹',
      '🐰',
      '🦊',
      '🐻',
      '🐼',
      '🐨',
      '🐯',
      '🦁',
      '🐮',
      '🐷',
      '🐸',
      '🐵',
      '🐔',
      '🐧',
      '🐦',
      '🐤',
      '🦆',
      '🦅',
      '🦉',
      '🦇',
      '🐺',
      '🐗',
      '🐴',
      '🦄',
      '🐝',
      '🐛',
      '🦋',
      '🐌',
      '🐞',
      '🐜',
      '🦟',
      '🦗',
      '🕷',
      '🦂',
      '🐢',
      '🐍',
      '🦎',
      '🦖',
      '🦕',
      '🐙',
      '🦑',
      '🦐',
      '🦞',
      '🦀',
      '🐡',
      '🐠',
      '🐟',
      '🐬',
      '🐳',
      '🐋',
      '🦈',
      '🐊',
      '🐅',
      '🐆',
      '🦓',
      '🦍',
      '🦧',
      '⚽',
      '🏀',
      '🏈',
      '⚾',
      '🥎',
      '🎾',
      '🏐',
      '🏉',
      '🥏',
      '🎱',
      '🏓',
      '🏸',
      '🏒',
      '🏑',
      '🥍',
      '🏏',
      '🥅',
      '⛳',
      '🪁',
      '🏹',
      '🎣',
      '🤿',
      '🥊',
      '🥋',
    ];

    grid.innerHTML = emojis
      .map(emoji => `<button type="button" class="emoji-option">${emoji}</button>`)
      .join('');

    // Toggle picker
    button.addEventListener('click', e => {
      e.preventDefault();
      picker.classList.toggle('hidden');
    });

    // Select emoji
    grid.querySelectorAll('.emoji-option').forEach(option => {
      option.addEventListener('click', () => {
        button.textContent = (option as HTMLElement).textContent || '👤';
        picker.classList.add('hidden');
      });
    });

    // Close picker when clicking outside
    document.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      if (!button.contains(target) && !picker.contains(target)) {
        picker.classList.add('hidden');
      }
    });
  }

  private initializeVoiceSettings(): void {
    const voiceSelect = document.getElementById('profile-voice') as HTMLSelectElement;
    if (!voiceSelect) return;

    // Wait for voices to load
    const populateVoices = () => {
      const voices = this.audioManager.getQualityEnglishVoices();
      voiceSelect.innerHTML = voices
        .map(voice => `<option value="${voice.voiceURI}">${voice.name} (${voice.lang})</option>`)
        .join('');
    };

    // Voices may not be immediately available
    if (speechSynthesis.getVoices().length > 0) {
      populateVoices();
    }

    speechSynthesis.addEventListener('voiceschanged', populateVoices);
  }

  private previewVoice(): void {
    // List of simple preview words
    const previewWords = [
      'hello',
      'welcome',
      'fantastic',
      'wonderful',
      'excellent',
      'amazing',
      'superb',
      'brilliant',
    ];
    const randomWord = previewWords[Math.floor(Math.random() * previewWords.length)];

    // Get current voice settings from the form
    const voiceSelect = document.getElementById('profile-voice') as HTMLSelectElement;
    const rateInput = document.getElementById('profile-rate') as HTMLInputElement;
    const pitchInput = document.getElementById('profile-pitch') as HTMLInputElement;

    if (!voiceSelect || !rateInput || !pitchInput) return;

    const voiceSettings: VoiceSettings = {
      voiceURI: voiceSelect.value,
      rate: parseFloat(rateInput.value),
      pitch: parseFloat(pitchInput.value),
      autoRepeat: false, // Don't auto-repeat during preview
      autoRepeatDelay: 3,
    };

    // Save current settings
    const originalSettings = this.audioManager.getVoiceSettings();

    // Apply preview settings
    this.audioManager.updateVoiceSettings(voiceSettings);

    // Speak the word
    this.audioManager
      .speak(randomWord)
      .then(() => {
        // Restore original settings after preview
        this.audioManager.updateVoiceSettings(originalSettings);
      })
      .catch(error => {
        console.error('Voice preview error:', error);
        // Restore original settings even on error
        this.audioManager.updateVoiceSettings(originalSettings);
      });
  }

  private initializeEventListeners(): void {
    // Start game button - now requires a selected profile
    this.elements.startGameButton.addEventListener('click', () => {
      const currentProfile = this.profileManager.getCurrentProfile();
      if (!currentProfile) {
        alert('Please select or create a profile to start the game!');
        return;
      }
      this.startGame(currentProfile);
    });

    // Word input
    this.elements.wordInput.addEventListener('keypress', e => {
      if (e.key === 'Enter' && this.phase === 'waiting-input') {
        this.handleWordSubmit();
      }
    });

    // Play again button
    this.elements.playAgainButton.addEventListener('click', () => {
      this.resetGame();
    });

    // Speak again button
    this.elements.speakAgainButton.addEventListener('click', () => {
      if (this.state.currentWord) {
        this.speakWord(this.state.currentWord.text);
      }
    });

    // View stats button
    this.elements.viewStatsButton.addEventListener('click', () => {
      window.location.href = '/stats.html';
    });

    // View stats button on game over screen
    const viewStatsGameOver = document.getElementById('view-stats-gameover');
    if (viewStatsGameOver) {
      viewStatsGameOver.addEventListener('click', () => {
        window.location.href = '/stats.html';
      });
    }

    // Quit game button
    this.elements.quitButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to quit? Your progress will be saved.')) {
        this.quitGame();
      }
    });

    // Debug mode toggle (press 'D' key)
    document.addEventListener('keydown', e => {
      if (e.key === 'd' || e.key === 'D') {
        if (!this.elements.wordInput.matches(':focus')) {
          this.toggleDebugMode();
        }
      }
    });

    // Auto-focus input when player starts typing
    document.addEventListener('keydown', e => {
      // Only auto-focus during waiting-input phase
      if (this.phase !== 'waiting-input') return;

      // Only for alphanumeric keys (not special keys like Shift, Ctrl, etc.)
      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        // If input is not focused, focus it
        if (!this.elements.wordInput.matches(':focus')) {
          this.elements.wordInput.focus();
          // The keypress will naturally be captured by the now-focused input
        }
      }
    });
  }

  private toggleDebugMode(): void {
    this.debugMode = !this.debugMode;

    if (this.debugMode) {
      this.elements.debugPanel.classList.remove('hidden');
      this.startDebugUpdate();
    } else {
      this.elements.debugPanel.classList.add('hidden');
      this.stopDebugUpdate();
    }
  }

  private startDebugUpdate(): void {
    this.stopDebugUpdate();
    this.updateDebugInfo();
    this.debugUpdateInterval = window.setInterval(() => {
      this.updateDebugInfo();
    }, 100); // Update every 100ms
  }

  private stopDebugUpdate(): void {
    if (this.debugUpdateInterval !== null) {
      clearInterval(this.debugUpdateInterval);
      this.debugUpdateInterval = null;
    }
  }

  private updateDebugInfo(): void {
    if (!this.debugMode) return;

    const now = Date.now();
    const elapsed = now - this.currentWordStartTime;
    const speed = this.getObstacleSpeedForLevel(this.state.level);
    const speakingDuration = this.speakingEndTime - this.speakingStartTime;
    const obstacleReachTime = speed * 0.6;
    const elapsedSinceObstacle = now - this.obstacleStartTime;
    const timeUntilJump = obstacleReachTime - elapsedSinceObstacle;

    let html = `
      <div><span class="debug-label">Phase:</span> <span class="debug-value">${this.phase}</span></div>
      <div><span class="debug-label">Level:</span> <span class="debug-value">${this.state.level}</span></div>
      <div><span class="debug-label">Speed (total):</span> <span class="debug-value">${speed}ms</span></div>
      <div><span class="debug-label">Speaking time:</span> <span class="debug-value">${speakingDuration}ms</span></div>
      <div><span class="debug-label">Total elapsed:</span> <span class="debug-value">${elapsed}ms</span></div>
      <div><span class="debug-label">Obstacle elapsed:</span> <span class="debug-value">${elapsedSinceObstacle}ms</span></div>
      <div><span class="debug-label">Obstacle reach time:</span> <span class="debug-value">${obstacleReachTime.toFixed(0)}ms (60%)</span></div>
      <div><span class="debug-label">Time until reach:</span> <span class="debug-value ${timeUntilJump < 0 ? 'debug-warning' : ''}">${timeUntilJump.toFixed(0)}ms</span></div>
    `;

    this.elements.debugInfo.innerHTML = html;

    // Update timeline visualization
    const totalTime = speed;
    const speakingPercent = (speakingDuration / totalTime) * 100;
    const obstaclePercent = (elapsedSinceObstacle / totalTime) * 100;
    const jumpPercent = 60; // 60% of animation

    this.elements.debugSpeaking.style.width = `${Math.min(speakingPercent, 100)}%`;
    this.elements.debugTyping.style.left = `${Math.min(speakingPercent, 100)}%`;
    this.elements.debugTyping.style.width = `${Math.max(0, Math.min(obstaclePercent, 100))}%`;
    this.elements.debugJumpPoint.style.left = `${jumpPercent}%`;
  }

  private startGame(profile: UserProfile): void {
    this.state.currentProfile = profile;
    this.state.playerName = profile.nickname; // For backwards compatibility
    this.state.difficulty = profile.preferences.initialDifficulty;
    this.state.isPlaying = true;
    this.state.score = 0;
    this.state.lives = 3;
    this.state.level = 1;
    this.state.wordsCompletedCorrectly = 0;
    this.state.isGameOver = false;

    // Update AudioManager with profile's voice settings
    this.audioManager.updateVoiceSettings(profile.preferences.voice);

    // Create new session with email
    this.sessionManager.createSession(
      profile.email,
      profile.preferences.initialDifficulty,
      profile.nickname
    );

    // Initialize weighted word lists based on this player's performance history
    const performanceMap = this.sessionManager.getWordPerformanceByEmail(profile.email);
    this.wordManager.initializeSessionWords(performanceMap);

    this.elements.startScreen.classList.add('hidden');
    this.elements.gameScreen.classList.remove('hidden');
    // Display avatar + nickname
    this.elements.playerNameDisplay.textContent = `${profile.avatar} ${profile.nickname}`;

    this.updateDisplay();
    this.nextRound();
  }

  private getDifficultyForLevel(level: number): Difficulty {
    if (level <= 3) return 'easy';
    if (level <= 6) return 'medium';
    return 'hard';
  }

  private getObstacleSpeedForLevel(level: number): number {
    // Base speed: 8000ms (slower for beginners), decrease by 400ms per level, minimum 2500ms
    const baseSpeed = 8000;
    const speedDecrease = 400;
    const minSpeed = 2500;
    return Math.max(minSpeed, baseSpeed - (level - 1) * speedDecrease);
  }

  private async nextRound(): Promise<void> {
    if (this.state.isGameOver) return;

    // Save previous word result if exists
    if (this.state.currentWord && this.currentWordStartTime > 0) {
      this.saveWordResult(false);
    }

    // Update difficulty based on current level
    this.state.difficulty = this.getDifficultyForLevel(this.state.level);

    this.phase = 'speaking';
    this.state.currentWord = this.wordManager.getNextWord(this.state.difficulty);
    this.state.currentWordAttempts = [];
    this.currentWordStartTime = Date.now();
    this.state.showCorrectSpelling = false;
    this.elements.wordInput.value = '';
    this.elements.wordInput.disabled = true;

    // Reset positions
    this.resetAnimations();

    // Speak the word
    await this.speakWord(this.state.currentWord.text);

    // Start obstacle moving and set timeout
    this.obstacleStartTime = Date.now(); // Track when obstacle starts moving
    this.elements.obstacle.textContent = '🚧'; // Generic obstacle instead of showing the word
    this.elements.obstacle.classList.add('show');

    // Update obstacle animation speed based on level
    const speed = this.getObstacleSpeedForLevel(this.state.level);
    this.elements.obstacle.style.animationDuration = `${speed}ms`;

    // Wait for input
    this.phase = 'waiting-input';
    this.elements.wordInput.disabled = false;
    this.elements.wordInput.focus();

    // Set timeout for obstacle reaching character (at 60% of animation)
    const obstacleReachTime = speed * 0.6;
    this.clearObstacleTimeout();
    this.obstacleTimeoutId = window.setTimeout(() => {
      if (this.phase === 'waiting-input') {
        this.handleTimeout();
      }
    }, obstacleReachTime);
  }

  private async speakWord(word: string): Promise<void> {
    try {
      this.speakingStartTime = Date.now();
      await this.audioManager.speak(word);
      this.speakingEndTime = Date.now();
    } catch (error) {
      console.error('Failed to speak word:', error);
      this.speakingEndTime = Date.now();
    }
  }

  private handleWordSubmit(): void {
    const userAnswer = this.elements.wordInput.value.trim().toLowerCase();
    const correctAnswer = this.state.currentWord!.text.toLowerCase();

    this.phase = 'validating';
    this.elements.wordInput.disabled = true;

    // Record the time when answer was submitted (for speed calculation)
    this.answerSubmitTime = Date.now();

    // Clear obstacle timeout since user submitted
    this.clearObstacleTimeout();

    // Record attempt
    const attempt: WordAttempt = {
      spelling: userAnswer,
      correct: userAnswer === correctAnswer,
      timestamp: this.answerSubmitTime,
    };
    this.state.currentWordAttempts.push(attempt);

    // Keep obstacle as generic visual
    // (don't show user's answer to avoid giving away the spelling)

    if (userAnswer === correctAnswer) {
      this.handleCorrectAnswer();
    } else {
      this.handleIncorrectAnswer(correctAnswer);
    }
  }

  private clearObstacleTimeout(): void {
    if (this.obstacleTimeoutId !== null) {
      clearTimeout(this.obstacleTimeoutId);
      this.obstacleTimeoutId = null;
    }
  }

  private async handleTimeout(): Promise<void> {
    // Player ran out of time
    this.phase = 'crashing';
    this.clearObstacleTimeout();
    this.elements.wordInput.disabled = true;

    // Reset combo on timeout
    this.state.comboCount = 0;

    // Play crash animation and sound
    this.elements.character.classList.add('crashing');
    this.playErrorSound();

    // Show "Ugh!" text
    this.elements.ughText.classList.remove('hidden');

    await this.delay(800);

    // Hide ugh text
    this.elements.ughText.classList.add('hidden');

    // NOW lose the life (after crash animation)
    this.state.lives -= 1;
    this.updateDisplay();
    this.sessionManager.updateSessionLives(this.state.lives);

    // Show correct spelling in speech bubble
    this.elements.speechText.textContent = `"${this.state.currentWord!.text}"`;
    this.elements.speechBubble.classList.remove('hidden');

    await this.delay(2500);

    // Hide speech bubble
    this.elements.speechBubble.classList.add('hidden');

    // Wait for obstacle to finish sliding off screen before reset
    const speed = this.getObstacleSpeedForLevel(this.state.level);
    const elapsedTotal = Date.now() - this.obstacleStartTime;
    const remainingObstacleTime = Math.max(speed - elapsedTotal, 0);
    if (remainingObstacleTime > 0) {
      await this.delay(remainingObstacleTime);
    }

    // Check if game over
    if (this.state.lives <= 0) {
      this.saveWordResult(true); // Save with timeout flag
      this.gameOver();
    } else {
      // Continue to next word
      this.saveWordResult(true); // Save with timeout flag
      this.resetAnimations();
      this.nextRound();
    }
  }

  private calculateScore(attempts: number): number {
    // Base scoring based on number of attempts
    switch (attempts) {
      case 1:
        return 20; // First attempt: 20 points
      case 2:
        return 10; // Second attempt: 10 points
      case 3:
        return 5; // Third attempt: 5 points
      default:
        return 2; // More attempts: 2 points
    }
  }

  private calculateSpeedMultiplier(
    responseTime: number,
    totalTime: number
  ): { multiplier: number; tier: SpeedTier } {
    // Calculate percentage of time used (0-100%)
    const timePercentage = (responseTime / totalTime) * 100;

    // Speed tiers based on percentage of time used
    if (timePercentage < 30) {
      return { multiplier: 2.0, tier: 'lightning' }; // Lightning fast: < 30%
    } else if (timePercentage < 50) {
      return { multiplier: 1.5, tier: 'fast' }; // Fast: 30-50%
    } else if (timePercentage < 70) {
      return { multiplier: 1.25, tier: 'good' }; // Good: 50-70%
    } else {
      return { multiplier: 1.0, tier: 'normal' }; // Normal: > 70%
    }
  }

  private calculateComboMultiplier(comboCount: number): number {
    // Combo multiplier based on consecutive correct answers (first try only)
    // Combo builds up for consecutive correct first-try answers
    if (comboCount >= 5) {
      return 1.5; // 5+ combo: 1.5× (max)
    } else if (comboCount >= 4) {
      return 1.3; // 4 combo: 1.3×
    } else if (comboCount >= 3) {
      return 1.2; // 3 combo: 1.2×
    } else if (comboCount >= 2) {
      return 1.1; // 2 combo: 1.1×
    } else {
      return 1.0; // 0-1: no combo bonus
    }
  }

  private showSpeedFeedback(
    tier: SpeedTier,
    speedMultiplier: number,
    comboMultiplier: number,
    finalPoints: number
  ): void {
    // Show different messages based on speed tier
    const tierMessages = {
      lightning: '⚡ LIGHTNING FAST!',
      fast: '🚀 FAST!',
      good: '👍 GOOD SPEED!',
      normal: '✓ CORRECT!',
    };

    const tierText = tierMessages[tier];
    const totalMultiplier = speedMultiplier * comboMultiplier;

    // Build compact multiplier display with emojis
    let multiplierText = '';
    if (totalMultiplier > 1.0) {
      const parts = [];
      if (speedMultiplier > 1.0) {
        parts.push(`⚡${speedMultiplier}×`);
      }
      if (comboMultiplier > 1.0) {
        parts.push(`🔥${comboMultiplier}×`);
      }
      const bonusText = parts.join(' · ');

      // Show combo count if active
      const comboCount = this.state.comboCount > 1 ? ` (${this.state.comboCount} combo)` : '';

      multiplierText = `${bonusText} = ${totalMultiplier.toFixed(1)}× BONUS${comboCount}\n+${finalPoints} pts`;
    } else {
      const comboCount = this.state.comboCount > 1 ? ` 🔥${this.state.comboCount}` : '';
      multiplierText = `+${finalPoints} pts${comboCount}`;
    }

    this.elements.speedTierText.textContent = tierText;
    this.elements.speedMultiplierText.textContent = multiplierText;
    this.elements.speedBonus.classList.remove('hidden');
    this.elements.speedBonus.setAttribute('data-tier', tier); // For CSS styling
  }

  private async animatePointsToScore(points: number): Promise<void> {
    // Get speed feedback display position (source of points)
    const feedbackRect = this.elements.speedBonus.getBoundingClientRect();
    const feedbackX = (feedbackRect.left + feedbackRect.width / 2) / window.innerWidth;
    const feedbackY = (feedbackRect.top + feedbackRect.height / 2) / window.innerHeight;

    // Get score display position (target)
    const scoreRect = this.elements.scoreDisplay.getBoundingClientRect();
    const scoreX = (scoreRect.left + scoreRect.width / 2) / window.innerWidth;
    const scoreY = (scoreRect.top + scoreRect.height / 2) / window.innerHeight;

    // Calculate angle from feedback to score
    // Confetti angle: 90 = up, 0 = right, 180 = left, 270 = down
    const deltaX = scoreX - feedbackX;
    const deltaY = scoreY - feedbackY;
    // Convert from standard atan2 to confetti's angle system
    const mathAngle = (Math.atan2(-deltaY, deltaX) * 180) / Math.PI; // Negate Y because screen coords
    const angle = mathAngle + 90; // Rotate to confetti's coordinate system

    // Determine number of particles based on points (more points = more particles)
    const particleCount = Math.max(Math.floor(points), 2);

    // Animate particles from feedback display to score
    const duration = 1200; // Animation duration in ms
    confetti({
      particleCount,
      startVelocity: 10,
      spread: 40,
      angle,
      origin: {
        x: feedbackX,
        y: feedbackY,
      },
      gravity: -1,
      scalar: 1.2,
      ticks: duration / 16.67, // Convert ms to frames (60fps)
      shapes: ['circle'],
      colors: ['#FFD700', '#FFA500', '#FF6347', '#87CEEB'],
      disableForReducedMotion: true,
    });

    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, duration));
  }

  private async handleCorrectAnswer(): Promise<void> {
    this.phase = 'jumping';

    // Calculate speed metrics
    const speed = this.getObstacleSpeedForLevel(this.state.level);
    const obstacleReachTime = speed * 0.6; // Obstacle reaches character at 60% of animation
    const responseTime = this.answerSubmitTime - this.obstacleStartTime;
    const { multiplier: speedMultiplier, tier } = this.calculateSpeedMultiplier(
      responseTime,
      obstacleReachTime
    );

    // Check if this was first-try correct (for combo)
    const isFirstTryCorrect = this.state.currentWordAttempts.length === 1;

    // Update combo count
    if (isFirstTryCorrect) {
      this.state.comboCount += 1;
    } else {
      this.state.comboCount = 0; // Reset combo on multiple attempts
    }

    // Calculate combo multiplier
    const comboMultiplier = this.calculateComboMultiplier(this.state.comboCount);

    // Calculate base and final scores (speed × combo)
    const basePoints = this.calculateScore(this.state.currentWordAttempts.length);
    const totalMultiplier = speedMultiplier * comboMultiplier;
    const finalPoints = Math.round(basePoints * totalMultiplier);

    // DON'T update score display yet - wait until after animation!
    this.state.wordsCompletedCorrectly += 1;

    // Play success sound and show score feedback immediately
    this.playTadaSound();
    this.showSpeedFeedback(tier, speedMultiplier, comboMultiplier, finalPoints);

    // Calculate delay until obstacle reaches character
    const elapsedSinceObstacle = Date.now() - this.obstacleStartTime;
    const jumpDelay = obstacleReachTime - elapsedSinceObstacle;

    // Wait for obstacle to reach character, then jump
    if (jumpDelay > 0) {
      await this.delay(jumpDelay);
    }

    this.elements.character.classList.add('jumping');

    // Keep score feedback on screen to read it
    await this.delay(1000);

    // Animate particles flying to score display
    const animationPromise = this.animatePointsToScore(finalPoints);

    // Update the score (particles will fly while score updates)
    this.state.score += finalPoints;
    this.updateDisplay();
    this.sessionManager.updateSessionScore(this.state.score);

    // Wait for animation to complete
    await animationPromise;

    // Hide speed feedback
    this.elements.speedBonus.classList.add('hidden');

    // Calculate how much time is left for obstacle to slide off screen
    // The obstacle animation takes 'speed' ms total, started at obstacleStartTime
    const elapsedTotal = Date.now() - this.obstacleStartTime;
    const remainingObstacleTime = Math.max(speed - elapsedTotal, 0);

    // Wait for obstacle to finish sliding off screen
    if (remainingObstacleTime > 0) {
      await this.delay(remainingObstacleTime);
    }

    // Check for level up (every 5 correct words)
    const shouldLevelUp = this.state.wordsCompletedCorrectly % 5 === 0;

    // Reset and continue (now obstacle is definitely off-screen)
    this.resetAnimations();

    if (shouldLevelUp) {
      await this.levelUp();
    }

    this.nextRound();
  }

  private async handleIncorrectAnswer(correctAnswer: string): Promise<void> {
    this.phase = 'crashing';

    // Reset combo on incorrect answer
    this.state.comboCount = 0;

    // Calculate delay until obstacle reaches character
    const speed = this.getObstacleSpeedForLevel(this.state.level);
    const obstacleReachTime = speed * 0.6; // Obstacle reaches character at 60% of animation
    const elapsedSinceObstacle = Date.now() - this.obstacleStartTime;
    const crashDelay = obstacleReachTime - elapsedSinceObstacle;

    // Wait for obstacle to reach character position, then crash
    if (crashDelay > 0) {
      await this.delay(crashDelay);
    }
    this.elements.character.classList.add('crashing');
    this.playErrorSound();

    // Show "Ugh!" text
    this.elements.ughText.classList.remove('hidden');

    // Wait for crash animation to complete (increased for more dramatic effect)
    await this.delay(800);

    // Hide ugh text (it fades out via animation)
    this.elements.ughText.classList.add('hidden');

    // NOW lose the life (after crash animation)
    this.state.lives -= 1;
    this.updateDisplay();
    this.sessionManager.updateSessionLives(this.state.lives);

    // Show correct spelling in speech bubble
    this.state.correctSpelling = correctAnswer;
    this.elements.speechText.textContent = `"${correctAnswer}"`;
    this.elements.speechBubble.classList.remove('hidden');

    // Wait longer for user to read the correct spelling
    await this.delay(2500);

    // Hide speech bubble
    this.elements.speechBubble.classList.add('hidden');

    // Wait for obstacle to finish sliding off screen before reset
    const elapsedTotal = Date.now() - this.obstacleStartTime;
    const remainingObstacleTime = Math.max(speed - elapsedTotal, 0);
    if (remainingObstacleTime > 0) {
      await this.delay(remainingObstacleTime);
    }

    // Check if game over
    if (this.state.lives <= 0) {
      this.saveWordResult(false); // Save the last word result
      this.gameOver();
    } else {
      // Give another chance with the same word
      this.resetAnimations();
      this.elements.wordInput.value = '';
      this.elements.wordInput.disabled = true;

      // Speak the word again
      await this.speakWord(correctAnswer);

      // Start obstacle moving again for retry
      this.obstacleStartTime = Date.now();
      this.elements.obstacle.textContent = '🚧';
      this.elements.obstacle.classList.add('show');

      const speed = this.getObstacleSpeedForLevel(this.state.level);
      this.elements.obstacle.style.animationDuration = `${speed}ms`;

      // Set up timeout again
      const obstacleReachTime = speed * 0.6;
      this.clearObstacleTimeout();
      this.obstacleTimeoutId = window.setTimeout(() => {
        if (this.phase === 'waiting-input') {
          this.handleTimeout();
        }
      }, obstacleReachTime);

      // Wait for input
      this.phase = 'waiting-input';
      this.elements.wordInput.disabled = false;
      this.elements.wordInput.focus();
    }
  }

  private saveWordResult(timedOut: boolean): void {
    if (!this.state.currentWord) return;

    // Calculate speed metrics
    const speed = this.getObstacleSpeedForLevel(this.state.level);
    const obstacleReachTime = speed * 0.6;
    const responseTime =
      this.answerSubmitTime > 0
        ? this.answerSubmitTime - this.obstacleStartTime
        : obstacleReachTime; // If no answer was submitted, use full time

    // Calculate score with speed and combo multipliers (only for correct answers)
    let speedMultiplier = 1.0;
    let speedTier: SpeedTier = 'normal';
    let comboMultiplier = 1.0;
    let comboCount = 0;
    let scoreEarned = 0;

    if (timedOut) {
      scoreEarned = 0;
      comboCount = 0; // Combo is 0 after timeout
    } else {
      const baseScore = this.calculateScore(this.state.currentWordAttempts.length);
      const lastAttemptCorrect =
        this.state.currentWordAttempts[this.state.currentWordAttempts.length - 1]?.correct;
      const isFirstTryCorrect = this.state.currentWordAttempts.length === 1 && lastAttemptCorrect;

      if (lastAttemptCorrect && this.answerSubmitTime > 0) {
        // Correct answer - calculate speed bonus
        const speedInfo = this.calculateSpeedMultiplier(responseTime, obstacleReachTime);
        speedMultiplier = speedInfo.multiplier;
        speedTier = speedInfo.tier;

        // Combo bonus only for first-try correct answers
        if (isFirstTryCorrect) {
          comboCount = this.state.comboCount; // Save current combo count
          comboMultiplier = this.calculateComboMultiplier(comboCount);
        } else {
          comboCount = 0; // No combo if multiple attempts
        }

        const totalMultiplier = speedMultiplier * comboMultiplier;
        scoreEarned = Math.round(baseScore * totalMultiplier);
      } else {
        // Incorrect answer - no bonuses
        scoreEarned = baseScore;
        comboCount = 0;
      }
    }

    const wordResult: WordResult = {
      word: this.state.currentWord.text,
      difficulty: this.state.currentWord.difficulty,
      attempts: [...this.state.currentWordAttempts],
      scoreEarned,
      speedMultiplier,
      speedTier,
      comboMultiplier,
      comboCount,
      responseTime,
      startTime: this.currentWordStartTime,
      endTime: Date.now(),
      level: this.state.level,
      timedOut,
    };

    this.sessionManager.addWordResult(wordResult);
    // Update word performance history for adaptive learning (per player)
    if (this.state.currentProfile) {
      this.sessionManager.updateWordPerformanceByEmail(this.state.currentProfile.email, wordResult);
    }
  }

  private async levelUp(): Promise<void> {
    this.state.level += 1;
    this.phase = 'level-up';
    this.updateDisplay();

    // Show level-up overlay
    this.elements.levelUpMessage.textContent = `Level ${this.state.level}`;
    this.elements.levelUpOverlay.classList.remove('hidden');

    // Celebration effects
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
    });
    this.playLevelUpSound();

    // Wait for celebration
    await this.delay(2500);

    // Hide overlay
    this.elements.levelUpOverlay.classList.add('hidden');
  }

  private playTadaSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [261.63, 329.63, 392.0, 523.25]; // C, E, G, C (major chord)
      const duration = 0.15;
      const startTime = audioContext.currentTime;

      notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Envelope for a pleasant sound
        gainNode.gain.setValueAtTime(0, startTime + index * duration);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + index * duration + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + index * duration + duration);

        oscillator.start(startTime + index * duration);
        oscillator.stop(startTime + index * duration + duration);
      });
    } catch (error) {
      console.warn('Could not play tada sound:', error);
    }
  }

  private playErrorSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const startTime = audioContext.currentTime;

      // Create a descending "wrong answer" sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Descending frequency from 400Hz to 200Hz
      oscillator.frequency.setValueAtTime(400, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, startTime + 0.3);
      oscillator.type = 'sawtooth'; // Harsher sound for error

      // Volume envelope
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    } catch (error) {
      console.warn('Could not play error sound:', error);
    }
  }

  private playLevelUpSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Triumphant ascending melody: C, E, G, C, E, G, High C
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
      const duration = 0.2;
      const startTime = audioContext.currentTime;

      notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Envelope for a triumphant sound
        gainNode.gain.setValueAtTime(0, startTime + index * duration);
        gainNode.gain.linearRampToValueAtTime(0.25, startTime + index * duration + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + index * duration + duration);

        oscillator.start(startTime + index * duration);
        oscillator.stop(startTime + index * duration + duration);
      });
    } catch (error) {
      console.warn('Could not play level-up sound:', error);
    }
  }

  private resetAnimations(): void {
    this.elements.character.classList.remove('moving', 'jumping', 'crashing');
    this.elements.obstacle.classList.remove('show');
    this.elements.obstacle.textContent = '';
    this.elements.speechBubble.classList.add('hidden');
    this.elements.ughText.classList.add('hidden');
  }

  private updateDisplay(): void {
    this.elements.scoreDisplay.textContent = this.state.score.toString();
    this.elements.levelDisplay.textContent = this.state.level.toString();

    // Always show 3 hearts - filled for remaining lives, grayed out for lost lives
    const maxLives = 3;
    const filledHearts = '❤️'.repeat(this.state.lives);
    const emptyHearts = '🖤'.repeat(maxLives - this.state.lives);
    this.elements.livesDisplay.textContent = filledHearts + emptyHearts;
  }

  private gameOver(): void {
    this.state.isGameOver = true;
    this.phase = 'game-over';

    // End session
    this.sessionManager.endSession();

    // Reset word manager session
    this.wordManager.resetSession();

    this.elements.gameScreen.classList.add('hidden');
    this.elements.gameOverScreen.classList.remove('hidden');
    this.elements.finalScore.textContent = this.state.score.toString();
    this.elements.finalLevel.textContent = `Reached Level ${this.state.level}`;

    // Show session comparison
    this.displaySessionComparison();
  }

  private displaySessionComparison(): void {
    if (!this.state.currentProfile) return;

    const playerSessions = this.sessionManager
      .getSessionsByEmail(this.state.currentProfile.email)
      .filter(s => s.endTime);

    if (playerSessions.length === 0) {
      this.elements.comparisonStats.innerHTML =
        '<p style="text-align: center; color: #666;">This is your first game! 🎮</p>';
      return;
    }

    const scores = playerSessions.map(s => s.totalScore);
    const levels = playerSessions.map(s => {
      // Calculate max level reached (based on words played)
      const maxLevelWord = s.wordsPlayed.reduce(
        (max, word) => (word.level > max ? word.level : max),
        1
      );
      return maxLevelWord;
    });

    const bestScore = Math.max(...scores);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const bestLevel = Math.max(...levels);
    const totalGames = playerSessions.length;

    const currentScore = this.state.score;
    const currentLevel = this.state.level;

    let html = `
      <div class="stat-comparison-item">
        <div class="stat-comparison-label">Games Played</div>
        <div class="stat-comparison-value">${totalGames}</div>
      </div>
      <div class="stat-comparison-item">
        <div class="stat-comparison-label">Best Score</div>
        <div class="stat-comparison-value ${currentScore >= bestScore ? 'stat-comparison-current' : ''}">${bestScore}</div>
      </div>
      <div class="stat-comparison-item">
        <div class="stat-comparison-label">Average Score</div>
        <div class="stat-comparison-value">${averageScore}</div>
      </div>
      <div class="stat-comparison-item">
        <div class="stat-comparison-label">Best Level</div>
        <div class="stat-comparison-value ${currentLevel >= bestLevel ? 'stat-comparison-current' : ''}">${bestLevel}</div>
      </div>
    `;

    // Add achievement message if new records
    if (currentScore > bestScore) {
      html += `<div class="stat-comparison-item" style="grid-column: 1 / -1; background: #d4edda; color: #155724;">
        <strong>🎉 New High Score! 🎉</strong>
      </div>`;
    }
    if (currentLevel > bestLevel) {
      html += `<div class="stat-comparison-item" style="grid-column: 1 / -1; background: #d4edda; color: #155724;">
        <strong>🚀 New Level Record! 🚀</strong>
      </div>`;
    }

    this.elements.comparisonStats.innerHTML = html;
  }

  private resetGame(): void {
    this.elements.gameOverScreen.classList.add('hidden');
    this.elements.startScreen.classList.remove('hidden');
    this.phase = 'idle';
    this.wordManager.resetSession();
    // Profile remains selected for next game
  }

  private quitGame(): void {
    // Clear any pending timeouts
    this.clearObstacleTimeout();
    this.stopDebugUpdate();

    // Save current word result if exists
    if (this.state.currentWord && this.currentWordStartTime > 0) {
      this.saveWordResult(false);
    }

    // End the session and save to localStorage
    this.sessionManager.endSession();

    // Reset game state and return to start screen
    this.state.isGameOver = false;
    this.state.isPlaying = false;
    this.elements.gameScreen.classList.add('hidden');
    this.elements.startScreen.classList.remove('hidden');
    this.phase = 'idle';
    this.wordManager.resetSession();
    this.resetAnimations();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
