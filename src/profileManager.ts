import type { UserProfile, Difficulty, VoiceSettings } from './types';

const PROFILES_STORAGE_KEY = 'spelling-game-profiles';
const CURRENT_PROFILE_KEY = 'spelling-game-current-profile';

export class ProfileManager {
  private profiles: Map<string, UserProfile> = new Map();
  private currentProfile: UserProfile | null = null;

  constructor() {
    this.loadProfiles();
  }

  /**
   * Load all profiles from localStorage
   */
  private loadProfiles(): void {
    try {
      const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
      if (stored) {
        const profilesArray: UserProfile[] = JSON.parse(stored);
        this.profiles = new Map(
          profilesArray.map(profile => [profile.email.toLowerCase(), profile])
        );
      }

      // Load current profile
      const currentEmail = localStorage.getItem(CURRENT_PROFILE_KEY);
      if (currentEmail) {
        this.currentProfile = this.profiles.get(currentEmail.toLowerCase()) || null;
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
      this.profiles = new Map();
      this.currentProfile = null;
    }
  }

  /**
   * Save all profiles to localStorage
   */
  private saveProfiles(): void {
    try {
      const profilesArray = Array.from(this.profiles.values());
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profilesArray));
    } catch (error) {
      console.error('Failed to save profiles:', error);
    }
  }

  /**
   * Save current profile email to localStorage
   */
  private saveCurrentProfile(): void {
    try {
      if (this.currentProfile) {
        localStorage.setItem(CURRENT_PROFILE_KEY, this.currentProfile.email.toLowerCase());
      } else {
        localStorage.removeItem(CURRENT_PROFILE_KEY);
      }
    } catch (error) {
      console.error('Failed to save current profile:', error);
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Create a new profile
   */
  createProfile(
    email: string,
    nickname: string,
    avatar: string,
    initialDifficulty: Difficulty,
    voiceSettings: VoiceSettings
  ): { success: boolean; error?: string; profile?: UserProfile } {
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email
    if (!this.isValidEmail(normalizedEmail)) {
      return { success: false, error: 'Invalid email format' };
    }

    // Check if email already exists
    if (this.profiles.has(normalizedEmail)) {
      return { success: false, error: 'A profile with this email already exists' };
    }

    // Validate nickname
    if (!nickname.trim()) {
      return { success: false, error: 'Nickname is required' };
    }

    // Validate avatar (should be an emoji)
    if (!avatar.trim()) {
      return { success: false, error: 'Avatar is required' };
    }

    const now = Date.now();
    const profile: UserProfile = {
      email: normalizedEmail,
      nickname: nickname.trim(),
      avatar: avatar.trim(),
      preferences: {
        initialDifficulty,
        voice: voiceSettings,
      },
      createdAt: now,
      lastUsed: now,
    };

    this.profiles.set(normalizedEmail, profile);
    this.saveProfiles();

    return { success: true, profile };
  }

  /**
   * Update profile (limited: only nickname and avatar can be changed)
   */
  updateProfile(
    email: string,
    updates: { nickname?: string; avatar?: string }
  ): { success: boolean; error?: string; profile?: UserProfile } {
    const normalizedEmail = email.toLowerCase().trim();
    const profile = this.profiles.get(normalizedEmail);

    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    // Apply updates
    if (updates.nickname !== undefined) {
      const trimmedNickname = updates.nickname.trim();
      if (!trimmedNickname) {
        return { success: false, error: 'Nickname cannot be empty' };
      }
      profile.nickname = trimmedNickname;
    }

    if (updates.avatar !== undefined) {
      const trimmedAvatar = updates.avatar.trim();
      if (!trimmedAvatar) {
        return { success: false, error: 'Avatar cannot be empty' };
      }
      profile.avatar = trimmedAvatar;
    }

    this.profiles.set(normalizedEmail, profile);
    this.saveProfiles();

    // Update current profile if it's the one being edited
    if (this.currentProfile?.email === normalizedEmail) {
      this.currentProfile = profile;
    }

    return { success: true, profile };
  }

  /**
   * Delete a profile
   */
  deleteProfile(email: string): { success: boolean; error?: string } {
    const normalizedEmail = email.toLowerCase().trim();

    if (!this.profiles.has(normalizedEmail)) {
      return { success: false, error: 'Profile not found' };
    }

    this.profiles.delete(normalizedEmail);
    this.saveProfiles();

    // Clear current profile if it was deleted
    if (this.currentProfile?.email === normalizedEmail) {
      this.currentProfile = null;
      this.saveCurrentProfile();
    }

    return { success: true };
  }

  /**
   * Get a profile by email
   */
  getProfile(email: string): UserProfile | null {
    return this.profiles.get(email.toLowerCase().trim()) || null;
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): UserProfile[] {
    return Array.from(this.profiles.values()).sort((a, b) => b.lastUsed - a.lastUsed);
  }

  /**
   * Select a profile as current
   */
  selectProfile(email: string): { success: boolean; error?: string; profile?: UserProfile } {
    const normalizedEmail = email.toLowerCase().trim();
    const profile = this.profiles.get(normalizedEmail);

    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    // Update last used timestamp
    profile.lastUsed = Date.now();
    this.profiles.set(normalizedEmail, profile);
    this.saveProfiles();

    this.currentProfile = profile;
    this.saveCurrentProfile();

    return { success: true, profile };
  }

  /**
   * Get the currently selected profile
   */
  getCurrentProfile(): UserProfile | null {
    return this.currentProfile;
  }

  /**
   * Clear current profile selection
   */
  clearCurrentProfile(): void {
    this.currentProfile = null;
    this.saveCurrentProfile();
  }

  /**
   * Check if any profiles exist
   */
  hasProfiles(): boolean {
    return this.profiles.size > 0;
  }

  /**
   * Get profile count
   */
  getProfileCount(): number {
    return this.profiles.size;
  }

  /**
   * Migrate old playerName-based sessions to email-based
   * This creates a profile for each unique playerName found in old sessions
   */
  migrateOldSessions(): void {
    try {
      // Get old sessions
      const sessionsData = localStorage.getItem('spelling-game-sessions');
      if (!sessionsData) return;

      const sessions = JSON.parse(sessionsData);
      const uniquePlayerNames = new Set<string>();

      // Collect unique player names
      sessions.forEach((session: any) => {
        if (session.playerName && !session.email) {
          uniquePlayerNames.add(session.playerName);
        }
      });

      // Create profiles for each unique player name
      uniquePlayerNames.forEach(playerName => {
        // Generate an email from the player name
        const email = `${playerName.toLowerCase().replace(/\s+/g, '.')}@legacy.local`;

        // Check if profile already exists
        if (!this.profiles.has(email)) {
          // Create a default profile
          const defaultVoiceSettings: VoiceSettings = {
            voiceURI: '',
            rate: 0.6,
            pitch: 1.0,
            autoRepeat: false,
            autoRepeatDelay: 3,
          };

          const result = this.createProfile(
            email,
            playerName,
            '👤', // Default avatar
            'easy',
            defaultVoiceSettings
          );

          if (result.success) {
            console.log(`Migrated player "${playerName}" to profile with email: ${email}`);
          }
        }
      });
    } catch (error) {
      console.error('Failed to migrate old sessions:', error);
    }
  }
}
