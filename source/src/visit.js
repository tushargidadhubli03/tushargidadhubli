// What this visit actually did.
//
// The closing chapter changes depending on how someone moved through the site, so a few
// facts about the visit are worth keeping: how long they stayed, how much they opened, how
// many of the counter-readings they looked at, whether they played anything. None of it
// leaves the browser — there is no analytics here, no network call, no storage. It exists
// for one purpose, which is to say something true to the person at the end.

const listeners = new Set();

export const visit = {
  started: typeof performance === 'undefined' ? 0 : performance.now(),
  chapters: new Set(['home']),
  unfolds: 0,          // long-form blocks opened
  counters: 0,         // counter-readings actually surfaced
  axisMoved: false,    // did they drag the perspective slider at all
  played: new Set(),   // which interactive things they touched
  decisions: [],       // choices made in the decision game
  reachedEnd: false,
};

// useSyncExternalStore compares snapshots by identity, so the getter must return the SAME
// object until something actually changes. Recomputing a fresh object per call is an
// infinite render loop — which is exactly what it did the first time.
let cached = null;
function ping() { cached = null; for (const fn of listeners) fn(); }
export function subscribeVisit(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function noteChapter(id) {
  if (visit.chapters.has(id)) return;
  visit.chapters.add(id);
  if (id === 'contact') visit.reachedEnd = true;
  ping();
}
export function noteUnfold() { visit.unfolds++; ping(); }
export function noteCounter() { visit.counters++; ping(); }
export function noteAxis() { if (!visit.axisMoved) { visit.axisMoved = true; ping(); } }
export function notePlayed(what) { if (!visit.played.has(what)) { visit.played.add(what); ping(); } }
export function noteDecision(id, agreed) {
  if (visit.decisions.some(d => d.id === id)) return;
  visit.decisions.push({id, agreed});
  ping();
}

export function seconds() {
  return Math.round((performance.now() - visit.started) / 1000);
}

/* The closer. Ordered most specific first — the first condition that fits, wins, so somebody
   who did several notable things gets told about the most notable one rather than the most
   generic. Every branch has to be true of the person reading it, or the whole trick fails. */
export function closingLine() {
  return cached || (cached = computeClosingLine());
}

function computeClosingLine() {
  const s = seconds();
  const chapters = visit.chapters.size;
  const agreed = visit.decisions.filter(d => d.agreed).length;
  const made = visit.decisions.length;

  if (made >= 4) {
    if (agreed === made) return {
      head: 'You made every call I made.',
      body: `All ${made} of them, the same way. Either we think alike or I am more predictable than I would like to be. Both are worth a conversation.`,
    };
    if (agreed === 0) return {
      head: 'You disagreed with me every single time.',
      body: `${made} decisions, ${made} different answers. I would genuinely like to hear your reasoning, and I mean that in the least defensive way possible.`,
    };
    return {
      head: `You'd have made ${agreed} of my ${made} calls.`,
      body: 'Which means there are a few you would have played differently. Those are the conversations I actually want to have.',
    };
  }
  if (visit.counters >= 4) return {
    head: 'You read the arguments against me.',
    body: 'Most people stay on the flattering side of the slider. You went looking for the other one, which tells me more about you than this site told you about me.',
  };
  if (visit.played.size >= 2) return {
    head: 'You played with everything.',
    body: 'The drum machine, the court, the lamps — you found the things that are not really about my career at all. Those are the parts I had the most fun building.',
  };
  if (s < 60 && chapters >= 5) return {
    head: `That took you under a minute.`,
    body: 'Efficient. I respect it, and I would rather you skimmed this than pretended to read a resume. The email is right there.',
  };
  if (visit.unfolds >= 6) return {
    head: 'You opened nearly all of it.',
    body: 'That is a lot of words about one person, and you kept going. Thank you — properly.',
  };
  if (s > 300) return {
    head: `You have been here a while.`,
    body: 'Long enough that saying hello would be less strange than not saying hello.',
  };
  return {
    head: 'You can just say hi.',
    body: 'You don’t need a professional reason, and you don’t need an impressive opening line. “Hi” has had a pretty good run.',
  };
}
