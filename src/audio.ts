import type { VoiceSettings } from './types';

export class AudioManager {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private voiceSettings: VoiceSettings;
  private autoRepeatTimer: number | null = null;
  private lastSpokenText: string = '';

  constructor(voiceSettings?: VoiceSettings) {
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech Synthesis not supported in this browser');
    }

    this.synth = window.speechSynthesis;
    this.voiceSettings = voiceSettings || this.getDefaultVoiceSettings();
    this.loadVoices();

    // Voices may load asynchronously
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private getDefaultVoiceSettings(): VoiceSettings {
    return {
      voiceURI: '',
      rate: 0.6,
      pitch: 1.0,
      autoRepeat: false,
      autoRepeatDelay: 3,
    };
  }

  private loadVoices(): void {
    this.voices = this.synth.getVoices();
  }

  private getPreferredVoice(): SpeechSynthesisVoice | null {
    // First, try to use the configured voice if available
    if (this.voiceSettings.voiceURI) {
      const configuredVoice = this.voices.find(
        voice => voice.voiceURI === this.voiceSettings.voiceURI
      );
      if (configuredVoice) {
        console.log('Using configured voice:', configuredVoice.name);
        return configuredVoice;
      }
    }

    // Fallback to auto-detection
    // Prioritize high-quality English voices
    // Look for premium voices first (Google, Microsoft, Apple)
    const premiumVoice = this.voices.find(
      voice =>
        voice.lang.startsWith('en-') &&
        (voice.name.includes('Google') ||
          voice.name.includes('Microsoft') ||
          voice.name.includes('Samantha') ||
          voice.name.includes('Alex'))
    );

    if (premiumVoice) {
      console.log('Using voice:', premiumVoice.name);
      return premiumVoice;
    }

    // Try to find a local English voice
    const englishVoice = this.voices.find(
      voice => voice.lang.startsWith('en-') && voice.localService
    );

    if (englishVoice) {
      console.log('Using voice:', englishVoice.name);
      return englishVoice;
    }

    // Fallback to any English voice
    const fallbackVoice = this.voices.find(voice => voice.lang.startsWith('en-'));
    if (fallbackVoice) {
      console.log('Using voice:', fallbackVoice.name);
    }
    return fallbackVoice || null;
  }

  speak(text: string, onEnd?: () => void): Promise<void> {
    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech and auto-repeat timer
      this.synth.cancel();
      this.stopAutoRepeat();

      // Store the text for auto-repeat
      this.lastSpokenText = text;

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = this.getPreferredVoice();

      if (voice) {
        utterance.voice = voice;
      }

      // Use configured voice settings
      utterance.rate = this.voiceSettings.rate;
      utterance.pitch = this.voiceSettings.pitch;
      utterance.volume = 1.0;

      utterance.onend = () => {
        if (onEnd) onEnd();

        // Set up auto-repeat if enabled
        if (this.voiceSettings.autoRepeat) {
          this.autoRepeatTimer = window.setTimeout(() => {
            this.speak(text, onEnd).catch(console.error);
          }, this.voiceSettings.autoRepeatDelay * 1000);
        }

        resolve();
      };

      utterance.onerror = event => {
        console.error('Speech synthesis error:', event);
        this.stopAutoRepeat();
        reject(event);
      };

      this.synth.speak(utterance);
    });
  }

  stop(): void {
    this.synth.cancel();
    this.stopAutoRepeat();
  }

  private stopAutoRepeat(): void {
    if (this.autoRepeatTimer !== null) {
      clearTimeout(this.autoRepeatTimer);
      this.autoRepeatTimer = null;
    }
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  /**
   * Get all available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * Get high-quality English voices for selection
   */
  getQualityEnglishVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(
      voice =>
        voice.lang.startsWith('en-') &&
        (voice.name.includes('Google') ||
          voice.name.includes('Microsoft') ||
          voice.name.includes('Samantha') ||
          voice.name.includes('Alex') ||
          voice.localService)
    );
  }

  /**
   * Update voice settings
   */
  updateVoiceSettings(settings: Partial<VoiceSettings>): void {
    this.voiceSettings = {
      ...this.voiceSettings,
      ...settings,
    };
    this.stopAutoRepeat(); // Stop any ongoing auto-repeat when settings change
  }

  /**
   * Get current voice settings
   */
  getVoiceSettings(): VoiceSettings {
    return { ...this.voiceSettings };
  }
}
