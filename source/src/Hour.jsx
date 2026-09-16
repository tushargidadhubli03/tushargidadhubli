import {useEffect, useState} from 'react';
import {X} from 'lucide-react';

/* --------------------------------------------------------------------------------------
   THE HOUR
   One line that could only have been written for the person reading it, using the only thing
   the page knows about them without asking: the time on their own clock. It waits for the
   first scroll, because arriving before anyone has done anything makes it an interruption
   rather than a reply. It never repeats within a visit and it costs nothing to be wrong.
   -------------------------------------------------------------------------------------- */
const ORDINAL = h => {
  const tens = h % 100;
  if (tens >= 11 && tens <= 13) return `${h}th`;
  return `${h}${({1: 'st', 2: 'nd', 3: 'rd'})[h % 10] || 'th'}`;
};

export function hourLine(h) {
  // 24-hour, as asked: an 11pm visitor is told they arrived in the 23rd hour.
  if (h === 0) return 'What brings you here at hour zero?';
  return `What brings you here at the ${ORDINAL(h)} hour of the day?`;
}

export default function Hour() {
  const [shown, setShown] = useState(false);
  const [gone, setGone] = useState(false);
  const [line, setLine] = useState('');

  useEffect(() => {
    let timer;
    const onScroll = () => {
      if (window.scrollY < 120) return;
      window.removeEventListener('scroll', onScroll);
      setLine(hourLine(new Date().getHours()));
      setShown(true);
      timer = setTimeout(() => setGone(true), 9000);
    };
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(timer); };
  }, []);

  if (!shown || gone) return null;
  return (
    <div className={`hour-note ${gone ? 'is-going' : ''}`} role="status">
      <span>{line}</span>
      <button className="icon-button" onClick={() => setGone(true)} aria-label="Dismiss"><X size={14} /></button>
    </div>
  );
}
