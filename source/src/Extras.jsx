import {useEffect, useRef, useState} from 'react';
import {X, Printer, ArrowRight} from 'lucide-react';

/* --------------------------------------------------------------------------------------
   THE RESUME BUTTON
   A resume button on a site whose whole premise is that a resume is not enough should not
   simply hand over a resume. It negotiates. Four beats: the refusal, the fake relent, the
   thing that is technically a resume and tells you nothing, and finally a print button that
   prints exactly two words. The real document is only offered once the joke has finished,
   because refusing a format you cannot execute is not a position, it is an excuse.
   -------------------------------------------------------------------------------------- */
const PHRASE = 'F*CK RESUMES';

export function ResumeGag({open, onClose, onPrint}) {
  const panel = useRef();
  const [stage, setStage] = useState(0);

  useEffect(() => { if (open) setStage(0); }, [open]);
  useEffect(() => {
    if (!open) return;
    const el = panel.current;
    const prev = document.activeElement;
    el?.querySelector('button')?.focus();
    const key = e => {if (e.key === 'Escape') onClose();};
    document.addEventListener('keydown', key);
    return () => {document.removeEventListener('keydown', key); prev?.focus?.({preventScroll: true});};
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="resume-gag" role="dialog" aria-modal="true" aria-label="About my resume" ref={panel} data-stage={stage}>
      <button className="resume-close icon-button" onClick={onClose} aria-label="Close"><X /></button>

      {stage === 0 && (
        <div className="gag-beat">
          {/* Every letter gets its own delay, duration and direction, so the word never
              settles into a synchronised wave — the letters should look like they disagree. */}
          <h2 className="resume-shout" aria-label={PHRASE}>
            {PHRASE.split('').map((ch, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={ch === ' ' ? 'gap' : 'letter'}
                style={{
                  '--i': i,
                  '--dur': `${(1.1 + (i % 5) * 0.17).toFixed(2)}s`,
                  '--delay': `${(i * 0.07).toFixed(2)}s`,
                  '--dir': i % 2 ? 1 : -1,
                  '--lift': `${8 + (i % 4) * 7}px`,
                  '--tilt': `${(i % 3 - 1) * 9}deg`,
                }}
              >{ch === ' ' ? ' ' : ch}</span>
            ))}
          </h2>
          <p className="resume-why">
            A resume would tell you I held eleven jobs in five years and let you draw your own
            conclusion. This tells you why I left each one. That seemed more useful.
          </p>
          <div className="resume-actions">
            <button className="solid-button" onClick={onClose}>Fine, show me the work</button>
            <button className="text-link" onClick={() => setStage(1)}>
              Just kidding, here it is <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {stage === 1 && (
        <div className="gag-beat">
          {/* Technically a resume. Every line of it is true of almost everyone. */}
          <div className="old-resume" aria-label="A parody of a generic resume">
            <div className="old-resume-bar" aria-hidden="true"><span /><span /><span />resume_FINAL_v4_USE THIS ONE.doc</div>
            <div className="old-resume-page">
              <h3>TUSHAR GIDADHUBLI</h3>
              <p className="or-contact">1234 Somewhere Street · Atlanta, GA · References available upon request</p>
              <h4>OBJECTIVE</h4>
              <p>
                To obtain a challenging position at a dynamic, forward-thinking organization
                where I can leverage my skill set, add value, and grow professionally.
              </p>
              <h4>SKILLS</h4>
              <p>
                Microsoft Word · Microsoft Excel · Microsoft PowerPoint · Team player ·
                Hard worker · Detail-oriented · Fast learner · Excellent communicator · Synergy
              </p>
              <h4>EXPERIENCE</h4>
              <p>
                Various roles. Responsible for various responsibilities. Utilized various tools
                to deliver various outcomes, resulting in various results.
              </p>
            </div>
          </div>
          <p className="resume-why">
            There. That is a resume. It is about me and it told you nothing — I could have
            handed you that at nineteen and it would have said exactly the same thing.
          </p>
          <div className="resume-actions">
            <button className="text-link" onClick={() => setStage(2)}>
              Okay, if you really want to see it <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {stage === 2 && (
        <div className="gag-beat">
          <h2 className="gag-headline">Last chance.</h2>
          <p className="resume-why">
            One page. Straight to your printer. No preview, no take-backs. You have been very
            patient about this and I want you to know I noticed.
          </p>
          <div className="resume-actions">
            <button className="solid-button" onClick={() => {onPrint('gag'); setStage(3);}}>
              <Printer size={17} /> Print it
            </button>
          </div>
        </div>
      )}

      {stage === 3 && (
        <div className="gag-beat">
          <h2 className="gag-headline">Okay. That was the last one.</h2>
          <p className="resume-why">
            The real thing does exist, it is one page, and it is generated from the same file
            that writes this whole site, so it cannot quietly go out of date. It is still the
            least interesting way to find out anything about me.
          </p>
          <div className="resume-actions">
            <button className="solid-button" onClick={() => onPrint('resume')}>
              <Printer size={17} /> Print the real one
            </button>
            <button className="text-link" onClick={onClose}>I would rather see the work</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* The two words that come out of the printer at stage two. It lives in the DOM at all times
   and is revealed by the print stylesheet, the same way the real sheet is. */
export function GagSheet() {
  return <div className="gag-sheet" aria-hidden="true"><span>really bro.</span></div>;
}

/* --------------------------------------------------------------------------------------
   PURELY PROFESSIONAL
   Some people arrive wanting the career and nothing else. Rather than hide that behind an
   apology, the site offers it as a deliberate mode: the personal chapters step out, the rail
   re-measures, and the work stands on its own.
   -------------------------------------------------------------------------------------- */
export function ProToggle({on, onToggle}) {
  return (
    <button className={`pro-toggle ${on ? 'is-on' : ''}`} onClick={onToggle} aria-pressed={on}>
      <span className="pro-dot" aria-hidden="true" />
      {on ? 'Showing the work only' : 'Purely professional'}
    </button>
  );
}

export function ProBanner({on, onExit}) {
  if (!on) return null;
  return (
    <div className="pro-banner" role="status">
      <strong>Professional mode.</strong>
      <span>The music, the books, India, the basketball and the two endings are hidden.</span>
      <button className="text-link" onClick={onExit}>Bring the rest back</button>
    </div>
  );
}
