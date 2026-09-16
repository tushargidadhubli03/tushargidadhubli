import {useState, useRef, useCallback, useEffect} from 'react';
import {notePlayed} from './visit.js';

/* --------------------------------------------------------------------------------------
   THE GANGA
   At the aarti, people set a lit diya on the water and let the river take it. This is that,
   as a small thing you can actually do: click anywhere on the water and a lamp goes in, and
   drifts. It is not a game with a score — it is the one moment on this site that asks you to
   do nothing in particular. Everything moves in CSS off per-lamp custom properties, so a
   hundred lamps cost the main thread nothing.
   -------------------------------------------------------------------------------------- */
const LIFETIME = 17000;

export default function Diya() {
  const [lamps, setLamps] = useState([]);
  const nextId = useRef(0);
  const timers = useRef(new Set());

  useEffect(() => () => {timers.current.forEach(clearTimeout); timers.current.clear();}, []);

  const release = useCallback(e => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * 100;
    const y = ((e.clientY - box.top) / box.height) * 100;
    const id = nextId.current++;
    notePlayed('diya');
    const lamp = {
      id,
      x: Math.max(2, Math.min(94, x)),
      y: Math.max(8, Math.min(88, y)),
      drift: 26 + Math.random() * 46,       // how far right it travels
      bob: 3 + Math.random() * 5,
      dur: 13 + Math.random() * 7,
      tilt: (Math.random() * 2 - 1) * 14,
      scale: 0.82 + Math.random() * 0.45,
    };
    setLamps(l => [...l.slice(-59), lamp]);
    const t = setTimeout(() => {
      setLamps(l => l.filter(v => v.id !== id));
      timers.current.delete(t);
    }, LIFETIME);
    timers.current.add(t);
  }, []);

  return (
    <figure className="diya">
      <figcaption>
        <h4>Set one on the water</h4>
        <p>
          At the aarti people float a lamp and let the river take it. Click the water. There is
          no score and nothing to win — that is rather the point of it.
        </p>
      </figcaption>
      <div
        className="diya-river"
        onPointerDown={release}
        role="button"
        tabIndex={0}
        aria-label="Float a lamp on the water"
        onKeyDown={e => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          const b = e.currentTarget.getBoundingClientRect();
          release({currentTarget: e.currentTarget, clientX: b.left + b.width * (0.1 + Math.random() * 0.3), clientY: b.top + b.height * (0.2 + Math.random() * 0.6)});
        }}
      >
        <span className="diya-current" aria-hidden="true" />
        {lamps.map(l => (
          <span
            key={l.id}
            className="diya-lamp"
            aria-hidden="true"
            style={{
              left: `${l.x}%`, top: `${l.y}%`,
              '--drift': `${l.drift}%`, '--bob': `${l.bob}px`,
              '--dur': `${l.dur}s`, '--tilt': `${l.tilt}deg`, '--scale': l.scale,
            }}
          >
            <span className="diya-flame" />
          </span>
        ))}
        {!lamps.length && <span className="diya-hint">click the water</span>}
      </div>
    </figure>
  );
}
