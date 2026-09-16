import {useState} from 'react';
import {ChevronDown} from 'lucide-react';
import {urbanysis, claimStates} from './narrative.js';

// Claim state is shown, not implied. Every block says what kind of thing it is:
// work that was done, design that was never deployed, or what actually happened.
function Claim({state}) {
  const c = claimStates[state];
  return <span className={`claim claim-${state}`} title={c.note}>{c.label}</span>;
}

function WeightBars({dimensions}) {
  const max = Math.max(...dimensions.map(d => d.weight));
  return (
    <ul className="bii-weights">
      {dimensions.map(d => (
        <li key={d.name}>
          <span className="bii-name">{d.name}</span>
          <span className="bii-bar" aria-hidden="true"><i style={{'--w': `${(d.weight / max) * 100}%`}} /></span>
          <span className="bii-value">{d.weight}%</span>
        </li>
      ))}
    </ul>
  );
}

export default function Urbanysis() {
  const [open, setOpen] = useState(false);
  return (
    <section className={`urbanysis ${open ? 'is-open' : ''}`} aria-labelledby="urbanysis-title">
      <div className="urbanysis-head">
        <span className="eyebrow">The part that deserves more than a paragraph</span>
        <h3 id="urbanysis-title">What we actually built at Urbanysis</h3>
        <p className="urbanysis-lede">{urbanysis.lede}</p>
        <p className="urbanysis-role"><strong>My scope:</strong> {urbanysis.role}</p>
        <button className="urbanysis-toggle" aria-expanded={open} onClick={() => setOpen(o => !o)}>
          {open ? 'Close the detail' : 'Open the methodology'}
          <ChevronDown size={18} />
        </button>
      </div>

      {open && (
        <div className="urbanysis-body">
          <p className="claim-key">
            Each block below is labelled by what kind of claim it is. <Claim state="developed" /> is work
            that was done. <Claim state="envisioned" /> was designed and never deployed.
            <Claim state="outcome" /> is what happened. Nothing here implies academic validation,
            a government deployment, or proven impact, because there was none.
          </p>

          {urbanysis.blocks.map(b => (
            <article key={b.id} className="urbanysis-block">
              <div className="block-top"><Claim state={b.claim} /><h4>{b.title}</h4></div>
              <p>{b.body}</p>
            </article>
          ))}

          <figure className="bii">
            <figcaption>
              <div className="block-top"><Claim state={urbanysis.bii.claim} /><h4>{urbanysis.bii.title}</h4></div>
              <p>{urbanysis.bii.note}</p>
            </figcaption>
            <WeightBars dimensions={urbanysis.bii.dimensions} />
            <p className="bii-rationale">{urbanysis.bii.rationale}</p>
          </figure>

          <div className="mpi">
            <div className="block-top"><Claim state={urbanysis.corridorMpi.claim} /><h4>{urbanysis.corridorMpi.title}</h4></div>
            <p>{urbanysis.corridorMpi.note}</p>
            <ul className="mpi-list">
              {urbanysis.corridorMpi.dimensions.map(d => (
                <li key={d.name}><strong>{d.name}</strong><span>{d.detail}</span></li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
