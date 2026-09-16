import {useState, useRef, useEffect, useCallback} from 'react';
import {Play, Pause, RotateCcw, Shuffle} from 'lucide-react';
import {notePlayed} from './visit.js';

/* --------------------------------------------------------------------------------------
   dhubli's drum machine
   A real four-track, sixteen-step sequencer. Every sound is synthesised in the browser with
   the Web Audio API — no samples, nothing downloaded — so the whole thing costs a few
   hundred bytes. Scheduling runs on a lookahead timer against the audio clock rather than
   setInterval, because setInterval drifts and a drum machine that drifts is unusable.
   -------------------------------------------------------------------------------------- */

const TRACKS = [
  {id: 'kick',  name: 'Kick',  hint: 'the floor'},
  {id: 'snare', name: 'Snare', hint: 'the backbeat'},
  {id: 'hat',   name: 'Hat',   hint: 'the pulse'},
  {id: 'key',   name: 'Keys',  hint: 'the mood'},
];
const STEPS = 16;

// A starting pattern that already sounds like something, so the first thing you hear is music.
const SEED = {
  kick:  [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,0],
  snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
  hat:   [1,0,1,1, 1,0,1,0, 1,0,1,1, 1,0,1,0],
  key:   [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
};
const KEYS = [0, 3, 7, 10, 12];   // minor pentatonic degrees, in semitones

const clone = g => Object.fromEntries(Object.entries(g).map(([k, v]) => [k, [...v]]));

function voice(ctx, out, kind, when, degree = 0) {
  const g = ctx.createGain();
  g.connect(out);
  if (kind === 'kick') {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(132, when);
    o.frequency.exponentialRampToValueAtTime(42, when + .11);
    g.gain.setValueAtTime(.9, when);
    g.gain.exponentialRampToValueAtTime(.001, when + .34);
    o.connect(g); o.start(when); o.stop(when + .36);
  } else if (kind === 'snare') {
    const len = Math.floor(ctx.sampleRate * .2);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1750; bp.Q.value = .7;
    g.gain.setValueAtTime(.42, when);
    g.gain.exponentialRampToValueAtTime(.001, when + .2);
    src.connect(bp); bp.connect(g); src.start(when); src.stop(when + .22);
  } else if (kind === 'hat') {
    const len = Math.floor(ctx.sampleRate * .06);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7600;
    g.gain.setValueAtTime(.2, when);
    g.gain.exponentialRampToValueAtTime(.001, when + .06);
    src.connect(hp); hp.connect(g); src.start(when); src.stop(when + .08);
  } else {
    const freq = 220 * Math.pow(2, (KEYS[degree % KEYS.length] - 12) / 12);
    for (const [mult, level] of [[1, .22], [2.01, .09], [3, .05]]) {
      const o = ctx.createOscillator();
      o.type = mult === 1 ? 'triangle' : 'sine';
      o.frequency.setValueAtTime(freq * mult, when);
      const vg = ctx.createGain();
      vg.gain.setValueAtTime(0, when);
      vg.gain.linearRampToValueAtTime(level, when + .02);
      vg.gain.exponentialRampToValueAtTime(.001, when + .85);
      o.connect(vg); vg.connect(g); o.start(when); o.stop(when + .9);
    }
  }
}

export default function BeatMachine() {
  const [grid, setGrid] = useState(() => clone(SEED));
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(-1);
  const [bpm, setBpm] = useState(88);

  const ctxRef = useRef(null), gainRef = useRef(null);
  const nextTime = useRef(0), nextStep = useRef(0), timer = useRef(0);
  const gridRef = useRef(grid), bpmRef = useRef(bpm);
  useEffect(() => {gridRef.current = grid;}, [grid]);
  useEffect(() => {bpmRef.current = bpm;}, [bpm]);

  const stop = useCallback(() => {
    clearTimeout(timer.current);
    setPlaying(false);
    setStep(-1);
  }, []);

  // Lookahead scheduler: queue every hit that falls in the next 120ms against the audio
  // clock, then sleep. Timer jitter never reaches the sound.
  const tick = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const spb = 60 / bpmRef.current / 4;          // sixteenth notes
    while (nextTime.current < ctx.currentTime + .12) {
      const s = nextStep.current % STEPS;
      const at = nextTime.current;
      for (const t of TRACKS) {
        if (gridRef.current[t.id][s]) {
          voice(ctx, gainRef.current, t.id, at, Math.floor(s / 3));
        }
      }
      const showAt = (at - ctx.currentTime) * 1000;
      setTimeout(() => setStep(s), Math.max(0, showAt));
      nextTime.current += spb;
      nextStep.current++;
    }
    timer.current = setTimeout(tick, 40);
  }, []);

  const start = useCallback(async () => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const g = ctx.createGain();
      g.gain.value = .55;
      g.connect(ctx.destination);
      ctxRef.current = ctx; gainRef.current = g;
    }
    await ctxRef.current.resume();
    notePlayed('beat');
    nextTime.current = ctxRef.current.currentTime + .06;
    nextStep.current = 0;
    setPlaying(true);
    tick();
  }, [tick]);

  useEffect(() => () => {clearTimeout(timer.current); ctxRef.current?.close?.();}, []);

  const toggle = (track, i) => setGrid(g => {
    const next = clone(g);
    next[track][i] = next[track][i] ? 0 : 1;
    return next;
  });

  const scatter = () => setGrid(() => {
    const g = clone(SEED);
    for (const t of TRACKS) {
      for (let i = 0; i < STEPS; i++) {
        const density = t.id === 'hat' ? .55 : t.id === 'kick' ? .3 : t.id === 'snare' ? .2 : .16;
        g[t.id][i] = Math.random() < density ? 1 : 0;
      }
    }
    return g;
  });

  return (
    <section className="beat" aria-labelledby="beat-title">
      <div className="beat-head">
        <div>
          <h4 id="beat-title">Make something</h4>
          <p>Four tracks, sixteen steps, every sound built in your browser. Tap the squares.</p>
        </div>
        <div className="beat-transport">
          <button className="beat-play" onClick={() => (playing ? stop() : start())} aria-pressed={playing}>
            {playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
            {playing ? 'Stop' : 'Play'}
          </button>
          <button className="icon-button" onClick={scatter} aria-label="Random pattern"><Shuffle size={17} /></button>
          <button className="icon-button" onClick={() => setGrid(clone(SEED))} aria-label="Back to the starting pattern"><RotateCcw size={17} /></button>
        </div>
      </div>

      <div className="beat-grid" role="group" aria-label="Step sequencer">
        {TRACKS.map(t => (
          <div className="beat-row" key={t.id}>
            <span className="beat-name">{t.name}<small>{t.hint}</small></span>
            <div className="beat-steps">
              {grid[t.id].map((on, i) => (
                <button
                  key={i}
                  className={`beat-step ${on ? 'on' : ''} ${step === i ? 'now' : ''} ${i % 4 === 0 ? 'downbeat' : ''}`}
                  aria-label={`${t.name} step ${i + 1}`}
                  aria-pressed={!!on}
                  onClick={() => toggle(t.id, i)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <label className="beat-tempo">
        Tempo <span>{bpm} bpm</span>
        <input type="range" min="60" max="132" value={bpm} onChange={e => setBpm(Number(e.target.value))} aria-label="Tempo" />
      </label>
      <small className="beat-note">Nothing here is a recording. It is four oscillators and two bursts of noise, scheduled against the audio clock.</small>
    </section>
  );
}
