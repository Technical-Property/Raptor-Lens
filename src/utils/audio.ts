// Web Audio API & real ornithological field recording player (Xeno-canto / Wikimedia Commons)

const SPECIES_AUDIO_MAP: Record<string, string> = {
  'red-kite': '/audio/red-kite.mp3',
  'buzzard': '/audio/buzzard.mp3',
  'common-buzzard': '/audio/buzzard.mp3',
  'kestrel': '/audio/kestrel.mp3',
  'common-kestrel': '/audio/kestrel.mp3',
  'peregrine': '/audio/peregrine.mp3',
  'peregrine-falcon': '/audio/peregrine.mp3',
  'barn-owl': '/audio/barn-owl.mp3',
  'sparrowhawk': '/audio/sparrowhawk.mp3',
  'eurasian-sparrowhawk': '/audio/sparrowhawk.mp3',
  'hen-harrier': '/audio/hen-harrier.mp3',
  'marsh-harrier': '/audio/hen-harrier.mp3',
  'hobby': '/audio/hobby.mp3',
  'eurasian-hobby': '/audio/hobby.mp3',
  'osprey': '/audio/osprey.mp3',
  'short-eared-owl': '/audio/short-eared-owl.mp3',
  'merlin': '/audio/merlin.mp3',
};

class TacticalAudio {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientNoiseSource: AudioBufferSourceNode | null = null;
  private currentCallAudio: HTMLAudioElement | null = null;
  private currentCallSpeciesId: string | null = null;
  public isAmbientPlaying: boolean = false;
  public isMuted: boolean = false;
  private muteListeners: Array<(muted: boolean) => void> = [];

  constructor() {
    try {
      this.isMuted = localStorage.getItem('raptorlens_audio_muted') === 'true';
    } catch {
      this.isMuted = false;
    }
  }

  public subscribeMute(listener: (muted: boolean) => void) {
    this.muteListeners.push(listener);
    return () => {
      this.muteListeners = this.muteListeners.filter((l) => l !== listener);
    };
  }

  private notifyMute() {
    try {
      localStorage.setItem('raptorlens_audio_muted', this.isMuted ? 'true' : 'false');
    } catch {}
    this.muteListeners.forEach((l) => l(this.isMuted));
  }

  public setMuted(muted: boolean): boolean {
    this.isMuted = muted;
    if (this.isMuted) {
      if (this.isAmbientPlaying) {
        this.stopDownlandBreeze();
      }
      this.stopSpeciesCall();
    }
    this.notifyMute();
    return this.isMuted;
  }

  public toggleMuted(): boolean {
    return this.setMuted(!this.isMuted);
  }

  public stopSpeciesCall() {
    if (this.currentCallAudio) {
      try {
        this.currentCallAudio.pause();
        this.currentCallAudio.currentTime = 0;
      } catch {}
      this.currentCallAudio = null;
      this.currentCallSpeciesId = null;
    }
  }

  private stopDownlandBreeze() {
    try {
      if (this.ambientGain && this.ctx) {
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);
        setTimeout(() => {
          this.ambientNoiseSource?.stop();
          this.ambientNoiseSource?.disconnect();
          this.ambientNoiseSource = null;
          this.isAmbientPlaying = false;
        }, 350);
      } else {
        this.isAmbientPlaying = false;
      }
    } catch {
      this.isAmbientPlaying = false;
    }
  }

  private initCtx() {
    if (this.isMuted) return;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Tactical radar ping / chirp
  public playRadarPing(frequency: number = 880) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  // Tactical target lock / confirmed log beep
  public playConfirmChime() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc1.frequency.setValueAtTime(880.00, this.ctx.currentTime + 0.08); // A5

      osc2.frequency.setValueAtTime(1174.66, this.ctx.currentTime + 0.08); // D6

      gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start(this.ctx.currentTime + 0.08);
      osc1.stop(this.ctx.currentTime + 0.35);
      osc2.stop(this.ctx.currentTime + 0.35);
    } catch {
      // Ignore
    }
  }

  // Downland breeze wind simulator (gentle pink/brownian noise with resonant filter)
  public toggleDownlandBreeze(): boolean {
    try {
      this.initCtx();
      if (!this.ctx) return false;

      if (this.isAmbientPlaying) {
        if (this.ambientGain) {
          this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);
          setTimeout(() => {
            this.ambientNoiseSource?.stop();
            this.ambientNoiseSource?.disconnect();
            this.ambientNoiseSource = null;
            this.isAmbientPlaying = false;
          }, 850);
        }
        return false;
      } else {
        // Generate 4 seconds of looping low-pass filtered noise
        const bufferSize = this.ctx.sampleRate * 4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5; // boost brownian wind
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, this.ctx.currentTime);
        filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.045, this.ctx.currentTime + 1.2);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
        this.ambientNoiseSource = noise;
        this.ambientGain = gain;
        this.isAmbientPlaying = true;
        return true;
      }
    } catch {
      return false;
    }
  }

  // Authentic recorded ornithological flight calls (Xeno-canto / Wikimedia Commons)
  // Returns true if playback started, false if toggled off or muted
  public playSpeciesCall(speciesId: string, onEnded?: () => void): boolean {
    if (this.isMuted) return false;

    const normalizedKey = speciesId.toLowerCase().trim();
    const audioSrc = SPECIES_AUDIO_MAP[normalizedKey];

    // If the exact same species call is currently playing, toggle it off
    if (this.currentCallAudio && !this.currentCallAudio.paused && this.currentCallSpeciesId === normalizedKey) {
      this.stopSpeciesCall();
      onEnded?.();
      return false;
    }

    // Stop any previously playing bird call
    this.stopSpeciesCall();

    if (audioSrc) {
      try {
        const audio = new Audio(audioSrc);
        audio.volume = 0.9;
        this.currentCallAudio = audio;
        this.currentCallSpeciesId = normalizedKey;

        const handleFinish = () => {
          if (this.currentCallAudio === audio) {
            this.currentCallAudio = null;
            this.currentCallSpeciesId = null;
          }
          onEnded?.();
        };

        audio.addEventListener('ended', handleFinish, { once: true });
        audio.addEventListener('error', () => {
          handleFinish();
        }, { once: true });

        audio.play().catch(() => {
          handleFinish();
        });
        return true;
      } catch {
        onEnded?.();
        return false;
      }
    }

    // Fallback radar ping if unknown species ID
    this.playRadarPing(1100);
    onEnded?.();
    return false;
  }
}

export const tacticalAudio = new TacticalAudio();
