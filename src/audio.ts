export class AudioManager {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech Synthesis not supported in this browser');
    }

    this.synth = window.speechSynthesis;
    this.loadVoices();

    // Voices may load asynchronously
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    this.voices = this.synth.getVoices();
  }

  private getPreferredVoice(): SpeechSynthesisVoice | null {
    // Prioritize high-quality English voices
    // Look for premium voices first (Google, Microsoft, Apple)
    const premiumVoice = this.voices.find(voice =>
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
    const englishVoice = this.voices.find(voice =>
      voice.lang.startsWith('en-') && voice.localService
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
      // Cancel any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = this.getPreferredVoice();

      if (voice) {
        utterance.voice = voice;
      }

      // Speak slowly and clearly for children
      utterance.rate = 1; // Slower for better clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        if (onEnd) onEnd();
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        reject(event);
      };

      this.synth.speak(utterance);
    });
  }

  stop(): void {
    this.synth.cancel();
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }
}
