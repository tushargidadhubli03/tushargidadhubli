import {useState, useEffect, useRef, useSyncExternalStore} from 'react';
import {setAxis, getAxisTarget, subscribeAxis, subscribeSide, currentSide} from './state.js';
import {noteAxis} from './visit.js';

// The perspective axis. One value, -1 to +1, black koi to white koi.
// Everything on this site that has two honest readings reads from it.

export function useSide() {
  return useSyncExternalStore(subscribeSide, currentSide, () => 'conviction');
}

// Both readings live in the DOM at once, stacked in one grid cell so the container is as
// tall as the taller of the two and nothing reflows as the axis moves. The crossfade is
// pure CSS driven by --axis: no React render, no JS per frame.
export function Dual({conviction, doubt, className = ''}) {
  const side = useSide();
  if (!doubt || !doubt.length) return <div className={className}>{conviction}</div>;
  return (
    <div className={`dual ${className}`}>
      <div className="dual-read dual-conviction" aria-hidden={side === 'doubt'}>{conviction}</div>
      <div className="dual-read dual-doubt" aria-hidden={side === 'conviction'}>{doubt}</div>
    </div>
  );
}

export function Paragraphs({items}) {
  return <>{items.map((p, i) => <p key={i}>{p}</p>)}</>;
}

// The control itself. A range input underneath, so it is keyboard-operable, announced
// properly and works with touch — with the koi drawn over it.
export function AxisControl({compact = false, label = 'Perspective'}) {
  const [value, setValue] = useState(() => getAxisTarget());
  const dragging = useRef(false);
  useEffect(() => subscribeAxis(v => { if (!dragging.current) setValue(v); }), []);
  const commit = v => { setValue(v); setAxis(v); noteAxis(); };
  const pct = (value + 1) / 2;
  const reading = value < -0.33 ? 'How I tell it' : value > 0.33 ? 'Argued against me' : 'Somewhere in between';
  return (
    <div className={`axis-control ${compact ? 'is-compact' : ''}`} style={{'--pos': pct}}>
      {!compact && (
        <div className="axis-head">
          <span className="axis-title">{label}</span>
          <span className="axis-reading" aria-live="polite">{reading}</span>
        </div>
      )}
      <div className="axis-track">
        <span className="axis-line" aria-hidden="true" />
        <span className="axis-koi axis-koi-black" aria-hidden="true" />
        <span className="axis-koi axis-koi-white" aria-hidden="true" />
        <input
          id="perspective-axis"
          type="range" min="-1" max="1" step="0.01" value={value}
          aria-label="Perspective: drag toward the white koi to read the case against me"
          onPointerDown={() => { dragging.current = true; }}
          onPointerUp={() => { dragging.current = false; }}
          onChange={e => commit(Number(e.target.value))}
        />
      </div>
      {!compact && (
        <div className="axis-ends">
          <button type="button" onClick={() => commit(-1)}>The conviction</button>
          <button type="button" onClick={() => commit(1)}>The doubt</button>
        </div>
      )}
    </div>
  );
}

export function AxisInvitation() {
  return (
    <section className="axis-invitation" aria-labelledby="axis-invitation-title">
      <h3 id="axis-invitation-title">Everything here has two readings.</h3>
      <p>
        I am the mediator among my friends, I spent a year working on political echo chambers,
        and my sister and I have matching koi tattoos. So it would be strange to build a site
        that only argued one side of me.
      </p>
      <p>
        Drag toward the white koi and every passage on this page becomes the same facts read
        against me — the version a fair critic would give. I wrote both. Neither one is the
        trick; the honest answer is usually somewhere on the line between them.
      </p>
      <AxisControl />
    </section>
  );
}
