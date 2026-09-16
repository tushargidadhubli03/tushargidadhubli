import {useEffect, useRef, useState, useCallback} from 'react';
import {FastForward, X, ArrowRight} from 'lucide-react';
import {notePlayed} from './visit.js';

/* --------------------------------------------------------------------------------------
   SPEEDRUN
   The site is an argument against skimming, so the generous thing is to admit that some
   people genuinely do not have the time and give them a good version of the short read
   rather than a punished one. It travels the rail on its own, holding two beats at each
   chapter — two beats at the 88bpm the drum machine defaults to, because if the pacing is
   going to be arbitrary it may as well be arbitrary in a way that matches something.
   Any real input stops it instantly: an autoplaying scroll you cannot escape is a trap.
   -------------------------------------------------------------------------------------- */
const BEAT = 60000 / 88;           // one beat at 88bpm
const HOLD = BEAT * 2;             // the two beats spent on each chapter
const TRAVEL = 620;                // roughly how long the smooth scroll takes to arrive

const sleep = ms => new Promise(r => setTimeout(r, ms));

export default function Speedrun({running, chapters, navigate, onStop, onFinish}) {
  const live = useRef({chapters, navigate});
  live.current = {chapters, navigate};
  const [at, setAt] = useState(0);
  const [done, setDone] = useState(false);
  const cancelled = useRef(false);

  const stop = useCallback(() => { cancelled.current = true; onStop(); }, [onStop]);

  useEffect(() => {
    if (!running) { setDone(false); setAt(0); return; }
    cancelled.current = false;
    notePlayed('speedrun');
    let alive = true;

    (async () => {
      const list = live.current.chapters;
      for (let i = 0; i < list.length; i++) {
        if (cancelled.current || !alive) return;
        setAt(i);
        live.current.navigate(list[i].id);
        await sleep(TRAVEL + HOLD);
      }
      if (cancelled.current || !alive) return;
      setDone(true);
    })();

    // Any deliberate input hands control back. Wheel and touch are the ones that would
    // otherwise fight the programmatic scroll and make the page feel broken.
    const bail = () => stop();
    window.addEventListener('wheel', bail, {passive: true});
    window.addEventListener('touchstart', bail, {passive: true});
    window.addEventListener('keydown', bail);
    return () => {
      alive = false;
      window.removeEventListener('wheel', bail);
      window.removeEventListener('touchstart', bail);
      window.removeEventListener('keydown', bail);
    };
    // Deliberately keyed to `running` alone. The other values are read through refs, so a
    // re-render cannot restart a run that is already in progress.
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!running) return null;

  if (done) {
    return (
      <div className="speedrun-end" role="status">
        <div>
          <strong>That was all of it.</strong>
          <span>You have the shape of it now. If you want the rest without reading the rest, ask me for it.</span>
        </div>
        <div className="speedrun-end-actions">
          <button className="solid-button" onClick={onFinish}>Request summary <ArrowRight size={16} /></button>
          <button className="text-link" onClick={stop}>I’ll read it properly</button>
        </div>
      </div>
    );
  }

  return (
    <div className="speedrun-bar" role="status" aria-live="polite">
      <FastForward size={16} />
      <span className="speedrun-label">{chapters[at]?.label}</span>
      <span className="speedrun-dots" aria-hidden="true">
        {chapters.map((c, i) => <i key={c.id} className={i <= at ? 'done' : ''} />)}
      </span>
      <span className="speedrun-count">{at + 1} / {chapters.length}</span>
      <button className="icon-button" onClick={stop} aria-label="Stop the speedrun"><X size={16} /></button>
    </div>
  );
}
