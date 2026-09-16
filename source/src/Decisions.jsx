import {useState} from 'react';
import {ArrowRight, RotateCcw} from 'lucide-react';
import {noteDecision, notePlayed, visit} from './visit.js';

/* --------------------------------------------------------------------------------------
   THE FORKS
   Eleven jobs in five years looks like restlessness on a resume. It was not — every ending
   was a decision, and most of them cost something. Rather than assert that, this puts the
   visitor at each fork first, with only what Tushar knew at the time, and asks them. Then it
   shows what he did.
   Every situation and outcome below comes from the record. The framing is written to be fair
   to the option he did not take: a fork where one answer is obviously right is not a fork.
   -------------------------------------------------------------------------------------- */
const FORKS = [
  {
    id: 'major',
    when: '2021 · eighteen',
    situation:
      'You are choosing a degree. You are good with words and you win arguments, and you are fascinated by how countries end up doing what they do. Your father has a clear view about which subjects lead to a career, and international affairs is not on the list.',
    a: {label: 'Study international affairs anyway', gloss: 'The thing you actually want to understand'},
    b: {label: 'Take the safer subject', gloss: 'He is not wrong about the job market'},
    chose: 'a',
    outcome:
      'I chose international affairs, despite my father’s best wishes. I wanted to understand how the world came to be and why nations behave the way they do.',
    reflection:
      'It turned out to be the most useful thing I studied, though not in the way anyone meant it to be — the frameworks are about competing interests and imperfect information, which describes almost every room I have been in since.',
  },
  {
    id: 'hill',
    when: 'Summer 2023 · Capitol Hill',
    situation:
      'You are a congressional intern. You came in wanting public service, and three months in you have watched enough meetings to notice that a great deal of the actual direction of policy seems to arrive through lobbyists rather than through the people who were elected.',
    a: {label: 'Follow the influence', gloss: 'Go where the decisions seem to get made'},
    b: {label: 'Stay on the public side', gloss: 'The people doing slow, unglamorous work are also right here'},
    chose: 'a',
    outcome:
      'I shifted my attention toward lobbying and government relations. Carmen Group, then ICBA, then BGR.',
    reflection:
      'Worth saying plainly: that was a very large conclusion to draw from one office in one spring, at the bottom of the building. I noticed the thing that confirmed a suspicion I had already arrived with.',
  },
  {
    id: 'bgr',
    when: 'December 2024 · twenty-one',
    situation:
      'Three years of deliberate moves have landed you at a top-tier lobbying firm. The work is good. You can see that the career, followed far enough, will eventually require you to push an agenda you do not believe in. Nobody has asked you to do that yet.',
    a: {label: 'Stay', gloss: 'Nothing has actually happened. You might never be asked'},
    b: {label: 'Leave before you find out', gloss: 'The line is easier to hold before you are standing on it'},
    chose: 'b',
    outcome: 'I left. That was a line I did not want to build a career around crossing.',
    reflection:
      'The honest reading is that I left before I ever had to find out whether I was right. That is either good judgment or a decision made comfortably early, and I still cannot tell you which.',
  },
  {
    id: 'stewards',
    when: 'Mid 2025 · Stewards.AI',
    situation:
      'You moved to a startup and worked your way up to supervising three interns. You have not been paid for any of the work you have done there. The interns still report to you, and they did not sign up for this either. Leaving means admitting the whole move was a mistake.',
    a: {label: 'Stay and try to hold it together', gloss: 'Three people are depending on you, and the money might still come'},
    b: {label: 'Get out', gloss: 'A company that never paid you is telling you what it is'},
    chose: 'b',
    outcome:
      'I never got paid for any of it. That, and the breakdown of trust in leadership, is why I left — and why I decided to take things into my own hands and start building instead.',
    reflection:
      'I also stayed longer than the warning signs justified, because leaving meant admitting I had picked wrong. The ending was done to me. Staying that long was mine.',
  },
  {
    id: 'urbanysis',
    when: 'January 2026 · Urbanysis',
    situation:
      'Seven months into the venture you co-founded. The measurement framework is real work and you are proud of it. The buyers — government agencies — are further from being ready for any of it than you assumed when you started. You have runway to keep going for a while.',
    a: {label: 'Keep pushing', gloss: 'Being early is not the same as being wrong'},
    b: {label: 'Wind it down', gloss: 'Conviction is not a substitute for a buyer'},
    chose: 'b',
    outcome:
      'I wound it down. My assessment is that government readiness was the major barrier: the understanding of AI I encountered was far behind what I believed the technology made possible.',
    reflection:
      'A harder reading, which I think is also true: we built a sophisticated measurement framework before proving anyone would buy anything, and I found the modelling more interesting than the selling.',
  },
];

function Fork({fork, index, total, picked, onAnswer, onNext, last}) {
  const agreed = picked === fork.chose;
  return (
    <article className={`fork ${picked ? 'is-answered' : ''}`} key={fork.id}>
      <header>
        <span className="fork-when">{fork.when}</span>
        <span className="fork-count">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
      </header>
      <p className="fork-situation">{fork.situation}</p>

      {!picked ? (
        <div className="fork-options" role="group" aria-label="What would you do?">
          {['a', 'b'].map(k => (
            <button key={k} className="fork-option" onClick={() => onAnswer(k)}>
              <strong>{fork[k].label}</strong>
              <span>{fork[k].gloss}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="fork-result">
          <p className="fork-verdict">
            <em>{agreed ? 'Same call.' : 'We differ here.'}</em>{' '}
            You chose <b>{fork[picked].label.toLowerCase()}</b>. I chose <b>{fork[fork.chose].label.toLowerCase()}</b>.
          </p>
          <p className="fork-outcome">{fork.outcome}</p>
          <p className="fork-reflection">{fork.reflection}</p>
          <button className="fork-next" onClick={onNext} autoFocus>
            {last ? 'See how we did' : 'Next decision'} <ArrowRight size={15} />
          </button>
        </div>
      )}
    </article>
  );
}

/* One card at a time. Five stacked cards is a wall of text and — on a column rail — a block
   too tall to keep whole, so it fragmented across columns and the game stopped reading as a
   game. Stepping through them keeps the block one column tall and makes each fork land on
   its own, which is the point: you should have to commit before you see what I did. */
export default function Decisions() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [done, setDone] = useState(false);

  const fork = FORKS[i];
  const agreedCount = answers.filter(Boolean).length;

  const answer = key => {
    if (picked) return;
    setPicked(key);
    const agreed = key === fork.chose;
    setAnswers(a => [...a, agreed]);
    noteDecision(fork.id, agreed);
    notePlayed('decisions');
  };
  const next = () => {
    if (i + 1 >= FORKS.length) { setDone(true); return; }
    setI(n => n + 1);
    setPicked(null);
  };
  const reset = () => {
    visit.decisions.length = 0;
    setI(0); setPicked(null); setAnswers([]); setDone(false);
  };

  return (
    <section className="decisions" aria-labelledby="decisions-title">
      <div className="decisions-head">
        <h3 id="decisions-title">You decide first</h3>
        <p>
          Eleven jobs in five years reads as restlessness. It wasn’t — every ending was a
          decision, and most of them cost something. Here are five of them, with only what I
          knew at the time. Pick before I tell you what I did.
        </p>
        <div className="decisions-score" aria-live="polite">
          <span className="score-bar" aria-hidden="true">
            {FORKS.map((f, n) => (
              <i key={f.id} className={`${n < answers.length ? 'done' : ''} ${answers[n] ? 'same' : ''}`} />
            ))}
          </span>
          {answers.length > 0 && (
            <span className="score-text">{agreedCount} of {answers.length} the same way</span>
          )}
        </div>
      </div>

      {!done ? (
        <div className="fork-stage" key={fork.id}>
          <Fork
            fork={fork} index={i} total={FORKS.length}
            picked={picked} onAnswer={answer} onNext={next}
            last={i + 1 === FORKS.length}
          />
        </div>
      ) : (
        <footer className="decisions-end">
          <p>
            {agreedCount === FORKS.length
              ? 'You made all five the way I made them. Either we think alike or I am more predictable than I would like to be.'
              : agreedCount === 0
                ? 'You went the other way on every single one. I would genuinely like to hear the reasoning.'
                : `You’d have made ${agreedCount} of my ${FORKS.length}. The ones you played differently are the conversations worth having.`}
          </p>
          <button className="text-link" onClick={reset}><RotateCcw size={15} /> Play them again</button>
        </footer>
      )}
    </section>
  );
}
