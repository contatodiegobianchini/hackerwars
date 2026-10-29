// Global background soundtrack player for "Terminal Access.mp3"

class SoundtrackManager {
  private audio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private baseVolume: number = 0.35;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio('/soundtrack.mp3');
      this.audio.loop = true;
      this.audio.volume = this.baseVolume;

      const savedMute = localStorage.getItem('soundtrack_muted');
      if (savedMute === 'true') {
        this.isMuted = true;
        this.audio.muted = true;
      }
    }
  }

  public start() {
    if (!this.audio) return;
    this.audio.play().then(() => {
      this.isPlaying = true;
    }).catch(() => {
      // Autoplay policy prevented playback, will start on next user interaction
      const resumeOnGesture = () => {
        if (!this.isMuted && this.audio) {
          this.audio.play().then(() => {
            this.isPlaying = true;
          }).catch(() => {});
        }
        window.removeEventListener('click', resumeOnGesture);
        window.removeEventListener('keydown', resumeOnGesture);
      };
      window.addEventListener('click', resumeOnGesture, { once: true });
      window.addEventListener('keydown', resumeOnGesture, { once: true });
    });
  }

  public toggleMute(): boolean {
    if (!this.audio) return false;
    this.isMuted = !this.isMuted;
    this.audio.muted = this.isMuted;
    localStorage.setItem('soundtrack_muted', String(this.isMuted));

    if (!this.isMuted && this.audio.paused) {
      this.audio.play().catch(() => {});
      this.isPlaying = true;
    }
    return !this.isMuted;
  }

  public isSoundtrackActive(): boolean {
    return !this.isMuted && this.isPlaying;
  }

  public duck() {
    if (this.audio) {
      this.audio.volume = 0.05;
    }
  }

  public unduck() {
    if (this.audio) {
      this.audio.volume = this.baseVolume;
    }
  }

  public pause() {
    if (this.audio) {
      this.audio.pause();
      this.isPlaying = false;
    }
  }

  public resume() {
    if (this.audio && !this.isMuted) {
      this.audio.play().catch(() => {});
      this.isPlaying = true;
    }
  }
}

export const soundtrack = new SoundtrackManager();
