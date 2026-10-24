type MusicScene = 'menu' | 'select' | 'howto' | 'match' | 'pause' | 'result';
type Theme = 'menu' | 'match' | 'result';

// Original four-bar arcade themes. Values are MIDI pitches; -1 is a rest.
const MELODY: Record<Theme, readonly number[]> = {
  menu: [
    72, -1, 75, 79, 77, -1, 75, -1,
    70, -1, 72, 75, 74, -1, 70, -1,
    67, -1, 70, 72, 75, 72, 70, -1,
    72, 75, 79, -1, 77, 75, 72, -1
  ],
  match: [
    72, 72, 75, 79, 77, 75, 72, 67,
    70, 70, 75, 77, 79, 77, 75, 70,
    72, 75, 79, 82, 79, 77, 75, 72,
    70, 75, 77, 79, 75, 72, 70, 67
  ],
  result: [
    72, -1, 76, -1, 79, -1, 84, -1,
    79, -1, 76, -1, 72, -1, 67, -1
  ]
};
const BASS: Record<Theme, readonly number[]> = {
  menu: [36, 41, 43, 39],
  match: [36, 39, 41, 43],
  result: [36, 41]
};
const TEMPO: Record<Theme, number> = { menu: 112, match: 150, result: 96 };
const midiHz = (note: number): number => 440 * 2 ** ((note - 69) / 12);

export class MusicEngine {
  enabled = true;
  private context: AudioContext | null = null;
  private bus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private scene: MusicScene = 'menu';
  private step = 0;
  private nextAt = 0;
  private scheduled = 0;

  get status(): { enabled: boolean; playing: boolean; scheduled: number } {
    return {
      enabled: this.enabled,
      playing: this.enabled && this.scene !== 'pause' && this.context?.state === 'running',
      scheduled: this.scheduled
    };
  }

  unlock(): void {
    if (!this.enabled) return;
    try {
      if (!this.context) {
        const context = new AudioContext();
        const bus = context.createGain();
        bus.gain.value = 0;
        bus.connect(context.destination);
        const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.12), context.sampleRate);
        const samples = buffer.getChannelData(0);
        let seed = 0x71c4e2;
        for (let i = 0; i < samples.length; i++) {
          seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
          samples[i] = ((seed >>> 0) / 0x80000000 - 1) * (1 - i / samples.length);
        }
        this.context = context;
        this.bus = bus;
        this.noiseBuffer = buffer;
      }
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
      this.setVolume();
    } catch { /* Music remains optional if Web Audio is unavailable. */ }
  }

  setScene(scene: MusicScene): void {
    if (scene === this.scene) return;
    const currentTheme = this.scene === 'match' || this.scene === 'result' || this.scene === 'pause'
      ? this.scene : 'menu';
    const nextTheme = scene === 'match' || scene === 'result' || scene === 'pause'
      ? scene : 'menu';
    this.scene = scene;
    if (currentTheme !== nextTheme) {
      this.step = 0;
      this.nextAt = 0;
    }
    this.setVolume();
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled) this.unlock();
    this.setVolume();
    this.nextAt = 0;
    return this.enabled;
  }

  tick(): void {
    const context = this.context;
    if (!this.enabled || !context || context.state !== 'running' || this.scene === 'pause') return;
    const theme: Theme = this.scene === 'match' ? 'match' : this.scene === 'result' ? 'result' : 'menu';
    const stepSeconds = 30 / TEMPO[theme];
    const now = context.currentTime;
    if (this.nextAt < now - 0.2) this.nextAt = now + 0.035;
    let queued = 0;
    while (this.nextAt < now + 0.14 && queued++ < 3) {
      this.schedule(theme, this.step, this.nextAt, stepSeconds);
      this.step = (this.step + 1) % MELODY[theme].length;
      this.nextAt += stepSeconds;
    }
  }

  private setVolume(): void {
    if (!this.context || !this.bus) return;
    const now = this.context.currentTime;
    const gain = this.bus.gain;
    gain.cancelScheduledValues(now);
    gain.setTargetAtTime(this.enabled && this.scene !== 'pause' ? 0.28 : 0, now, 0.045);
  }

  private tone(note: number, when: number, duration: number, volume: number,
    shape: OscillatorType, endNote = note): void {
    const context = this.context;
    const bus = this.bus;
    if (!context || !bus) return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(midiHz(note), when);
    if (endNote !== note) oscillator.frequency.exponentialRampToValueAtTime(midiHz(endNote), when + duration);
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(volume, when + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    oscillator.connect(envelope).connect(bus);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.015);
    this.scheduled++;
  }

  private noise(when: number, volume: number, cutoff: number): void {
    const context = this.context;
    const bus = this.bus;
    if (!context || !bus || !this.noiseBuffer) return;
    const source = context.createBufferSource();
    const highpass = context.createBiquadFilter();
    const envelope = context.createGain();
    source.buffer = this.noiseBuffer;
    highpass.type = 'highpass';
    highpass.frequency.value = cutoff;
    envelope.gain.setValueAtTime(volume, when);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + 0.075);
    source.connect(highpass).connect(envelope).connect(bus);
    source.start(when);
    source.stop(when + 0.08);
  }

  private schedule(theme: Theme, step: number, when: number, seconds: number): void {
    const level = theme === 'match' ? 1 : theme === 'menu' ? 0.72 : 0.6;
    const root = BASS[theme][Math.floor(step / 8) % BASS[theme].length]!;
    const lead = MELODY[theme][step]!;
    if (lead >= 0) this.tone(lead, when, seconds * 0.78, 0.092 * level, 'square');
    if (step % 4 === 0) this.tone(root, when, seconds * 2.5, 0.105 * level, 'triangle');
    if (theme !== 'result' && step % 2 === 1) {
      const chord = [12, 19, 15, 24][step % 4]!;
      this.tone(root + chord, when, seconds * 0.48, 0.027 * level, 'sine');
    }
    if (theme !== 'result' && step % 8 === 0) {
      this.tone(47, when, 0.12, 0.16 * level, 'sine', 31);
    }
    if (theme === 'match' && step % 8 === 4) {
      this.tone(46, when, 0.11, 0.13 * level, 'sine', 31);
    }
    if (theme !== 'result' && step % 8 === 4) this.noise(when, 0.065 * level, 1250);
    if (theme === 'match' && step % 2 === 1) this.noise(when, 0.018, 5200);
  }
}
