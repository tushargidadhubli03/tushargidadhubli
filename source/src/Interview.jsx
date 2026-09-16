import {useState, useRef, useEffect} from 'react';
import {X, ArrowRight, Mail, Copy, Check} from 'lucide-react';
import {profile} from './content.js';
import {notePlayed} from './visit.js';

/* --------------------------------------------------------------------------------------
   THE REVERSE INTERVIEW
   The button says Interview, which everybody reads as an interview with me. It isn't. The
   whole site refuses the format it was handed — a resume, a one-way read — so the last thing
   it should do at the point of contact is hand over an email address and hope.
   Three questions, one at a time, and at the end it writes the message for them. Nothing is
   stored and nothing is sent from here: the answers live in this component until the visitor
   presses send in their own mail client, and then they are gone.
   -------------------------------------------------------------------------------------- */
const QUESTIONS = [
  {
    id: 'who',
    q: 'Who am I talking to?',
    hint: 'A name, and the part of what you do that you would lead with at a party rather than on LinkedIn.',
    placeholder: 'I’m…',
  },
  {
    id: 'what',
    q: 'What are you working on right now?',
    hint: 'The thing actually occupying you this week. A job title is not an answer to this.',
    placeholder: 'At the moment I’m…',
  },
  {
    id: 'why',
    q: 'What do you want out of talking to me?',
    hint: 'Be direct. “Nothing, you just seemed interesting” is a complete answer, and a good one.',
    placeholder: 'I’d like…',
  },
];

const SUBJECT = 'Answering your three questions';

function compose(answers) {
  const body = QUESTIONS
    .map((q, i) => `${i + 1}. ${q.q}\n${(answers[q.id] || '').trim() || '(skipped)'}`)
    .join('\n\n');
  return `${body}\n\n—\nSent from the three questions on your site.`;
}

export default function Interview({open, onClose}) {
  // 'gag' → the joke, 0..2 → the questions, 'done' → the composed message
  const [stage, setStage] = useState('gag');
  const [answers, setAnswers] = useState({});
  const [copied, setCopied] = useState(false);
  const box = useRef();
  const field = useRef();

  useEffect(() => { if (open) { setStage('gag'); setAnswers({}); setCopied(false); notePlayed('interview'); } }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const key = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); prev?.focus?.({preventScroll: true}); };
  }, [open, onClose]);

  // Focus the field as each question arrives, so the whole thing is answerable from the keyboard.
  useEffect(() => { if (typeof stage === 'number') field.current?.focus(); }, [stage]);

  if (!open) return null;

  const advance = () => setStage(s => (typeof s === 'number' ? (s + 1 >= QUESTIONS.length ? 'done' : s + 1) : 0));
  const message = compose(answers);
  const mailto = `mailto:${profile.email}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(message)}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { setCopied(false); }
  };

  return (
    <div className="interview" role="dialog" aria-modal="true" aria-label="Three questions" ref={box}>
      <button className="interview-close icon-button" onClick={onClose} aria-label="Close"><X /></button>

      {stage === 'gag' && (
        <div className="iv-beat">
          <h2 className="iv-shout">Nice try.</h2>
          <p className="iv-why">
            You clicked interview, so I assume you were expecting to ask the questions. The rest
            of this site is already me talking. This part is the other way round — three
            questions, and at the end I will write the email for you.
          </p>
          <div className="iv-actions">
            <button className="solid-button" onClick={() => setStage(0)}>Fine. Ask them <ArrowRight size={16} /></button>
            <button className="text-link" onClick={onClose}>Not today</button>
          </div>
        </div>
      )}

      {typeof stage === 'number' && (
        <div className="iv-beat" key={stage}>
          <span className="iv-count">{stage + 1} of {QUESTIONS.length}</span>
          <h2 className="iv-question">{QUESTIONS[stage].q}</h2>
          <p className="iv-hint">{QUESTIONS[stage].hint}</p>
          <textarea
            ref={field}
            className="iv-field"
            rows={4}
            value={answers[QUESTIONS[stage].id] || ''}
            placeholder={QUESTIONS[stage].placeholder}
            aria-label={QUESTIONS[stage].q}
            onChange={e => setAnswers(a => ({...a, [QUESTIONS[stage].id]: e.target.value}))}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); advance(); } }}
          />
          <div className="iv-actions">
            <button className="solid-button" onClick={advance}>
              {(answers[QUESTIONS[stage].id] || '').trim()
                ? (stage + 1 === QUESTIONS.length ? 'Done' : 'Next')
                : 'Skip it'}
              <ArrowRight size={16} />
            </button>
            <span className="iv-shortcut" aria-hidden="true">⌘ + return</span>
          </div>
        </div>
      )}

      {stage === 'done' && (
        <div className="iv-beat iv-wide">
          <h2 className="iv-question">That is the whole interview.</h2>
          <p className="iv-hint">
            Here is your message. Nothing has been sent and nothing was saved — pressing send
            opens your own mail, where you can change any of it first.
          </p>
          <pre className="iv-preview">{message}</pre>
          <div className="iv-actions">
            <a className="solid-button" href={mailto}><Mail size={17} /> Send it to {profile.email}</a>
            <button className="text-link" onClick={copy}>
              {copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy it instead'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
