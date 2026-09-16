import {useState, useMemo} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {professionalJourney, allRoles, roleCounter, shortName} from './narrative.js';
import {Dual} from './Perspective.jsx';
import Unfold from './Unfold.jsx';

const MONTH = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const months = ym => {const [y,m] = ym.split('-').map(Number); return y * 12 + (m - 1);};
const nowYM = () => {const d = new Date(); return d.getFullYear() * 12 + d.getMonth();};

// One row per role, ordered by when it began, placed against a real month axis.
// Lanes were tried first and failed: sixteen labels cannot share five lanes without
// colliding. Rows keep every label legible, and concurrency still reads — overlapping
// roles are the bars that line up vertically.
function Plot({onPick}) {
  const {rows, start, span} = useMemo(() => {
    const start = Math.min(...allRoles.map(r => months(r.start)));
    const end = nowYM() + 2;
    return {rows: allRoles, start, span: end - start};
  }, []);
  const [hover, setHover] = useState(null);

  const GUTTER = 232, W = 1000, ROW = 27, TOP = 34;
  const plotW = W - GUTTER;
  const height = TOP + rows.length * ROW + 16;
  const x = m => GUTTER + ((m - start) / span) * plotW;
  const years = [2022, 2023, 2024, 2025, 2026];

  return (
    <div className="career-plot">
      <p className="plot-note">
        Every role, placed where it actually happened. The overlaps through 2022 and 2023 are
        an ordinary undergraduate load — a part-time job, a research assistantship, an
        internship and a student club, alongside classes. Solid bars carry the story; outlined
        ones are here because they happened.
      </p>
      <div className="plot-scroll">
        <svg viewBox={`0 0 ${W} ${height}`} className="plot-svg" role="img"
             aria-label={`Timeline of ${rows.length} roles from 2022 to the present. Roles that ran at the same time appear as bars that line up vertically.`}>
          {years.map(y => {
            const mx = x(months(`${y}-01`));
            return <g key={y}>
              <line x1={mx} y1={TOP - 16} x2={mx} y2={height - 12} className="plot-grid" />
              <text x={mx + 5} y={TOP - 20} className="plot-year">{y}</text>
            </g>;
          })}
          <line x1={GUTTER} y1={TOP - 16} x2={GUTTER} y2={height - 12} className="plot-axis" />
          {rows.map((role, i) => {
            const a = months(role.start), b = role.end ? months(role.end) : nowYM();
            const bx = x(a), bw = Math.max(7, x(Math.max(b, a + 1)) - bx);
            const by = TOP + i * ROW;
            const on = hover === role.id;
            return (
              <g key={role.id}
                 className={`plot-row tier-${role.tier} ${on ? 'is-hover' : ''}`}
                 tabIndex={0} role="button"
                 aria-label={`${role.company}, ${role.role}, ${role.period}`}
                 onMouseEnter={() => setHover(role.id)} onMouseLeave={() => setHover(null)}
                 onFocus={() => setHover(role.id)} onBlur={() => setHover(null)}
                 onClick={() => role.tier === 'story' && onPick(role.id)}
                 onKeyDown={e => {if (e.key === 'Enter' && role.tier === 'story') onPick(role.id);}}>
                <rect className="plot-hit" x="0" y={by - 3} width={W} height={ROW - 1} />
                <text className="plot-label" x={GUTTER - 12} y={by + 9} textAnchor="end">{shortName[role.company] || role.company}</text>
                <rect className="plot-bar" x={bx} y={by} width={bw} height={13} rx="2" />
              </g>
            );
          })}
        </svg>
      </div>
      <p className="plot-readout" aria-live="polite">
        {hover
          ? (() => {const r = allRoles.find(x => x.id === hover); return `${r.role} · ${r.period}`;})()
          : 'Hover or tab through a row for the detail.'}
      </p>
    </div>
  );
}

export default function Career({motion}) {
  const [view, setView] = useState('story');
  const go = id => {
    setView('story');
    requestAnimationFrame(() => document.getElementById(`role-${id}`)?.scrollIntoView({behavior: motion ? 'smooth' : 'instant', block: 'start'}));
  };
  return (
    <div className="career-experience">
      <div className="career-view-switch" role="group" aria-label="Choose how to explore work experience">
        <button aria-pressed={view === 'story'} onClick={() => setView('story')}>Follow the story</button>
        <button aria-pressed={view === 'plot'} onClick={() => setView('plot')}>Plotted in time</button>
        <button aria-pressed={view === 'scan'} onClick={() => setView('scan')}>Everything, listed</button>
      </div>

      {view === 'plot' && <Plot onPick={go} />}

      {view === 'scan' && (
        <div className="experience-ledger">
          <p className="ledger-intro">Everything, most recent first. The roles that carry the story link through to it; the rest are here because they happened.</p>
          {[...allRoles].reverse().map(role => role.tier === 'story'
            ? <button key={role.id} onClick={() => go(role.id)}><span>{role.period}</span><strong>{role.company}</strong><em>{role.role}</em><ArrowUpRight size={18} /></button>
            : <div key={role.id} className="ledger-record"><span>{role.period}</span><strong>{role.company}</strong><em>{role.role}</em>{role.context && <small>{role.context}</small>}</div>)}
        </div>
      )}

      {view === 'story' && <>
        <div className="career-prologue">
          <span className="eyebrow">Before any of the job titles</span>
          <h4>Words, a marching band, and a lot of video games</h4>
          <p>I grew up in Northern Virginia. In high school, I was in marching band and eventually became a section leader. I played soccer, basketball, and a lot of video games. I was good with words and had no shortage of passion.</p>
          <p>I attended George Washington University from 2021–2025, studying International Affairs and Economics. I loved learning how the world came to be and how nations interact. Those frameworks still shape how I think about people, incentives, negotiation, institutions, and business.</p>
          <p>I wanted to eventually become the U.S. ambassador to India. Being in Washington, D.C., made politics an obvious place to start getting involved.</p>
        </div>
        <div className="career-timeline">
          {professionalJourney.map((item, i) => (
            <article id={`role-${item.id}`} key={item.id} className={i === professionalJourney.length - 1 ? 'latest' : ''}>
              <span className="career-dot" />
              <div className="role-identity">
                <span className="role-count">{String(i + 1).padStart(2, '0')}</span>
                <div><strong>{item.company}</strong><span>{item.role}</span></div>
                <time>{item.period}</time>
              </div>
              <span className="eyebrow">{item.tag}</span>
              <h4>{item.title}</h4>
              <Dual
                conviction={<Unfold count={item.paragraphs.length - 1}>{item.paragraphs.map((p, j) => <p key={j}>{p}</p>)}</Unfold>}
                doubt={<Unfold label="The other reading" count={(roleCounter[item.id]?.length || 1) - 1}>{roleCounter[item.id]?.map((p, j) => <p key={j}>{p}</p>)}</Unfold>}
              />
              {item.source && <a className="text-link" href={item.source.url} target="_blank" rel="noreferrer">{item.source.label}<ArrowUpRight size={16} /></a>}
            </article>
          ))}
        </div>
      </>}
    </div>
  );
}
