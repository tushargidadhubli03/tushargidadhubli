import {useState, useRef, useEffect} from 'react';
import {Plus, Minus} from 'lucide-react';
import {noteUnfold, noteCounter} from './visit.js';

/* --------------------------------------------------------------------------------------
   UNFOLD
   The writing is the best thing here, but all of it at once is a wall. This shows the first
   paragraph and keeps the rest one click away, so the default pass through the site reads
   like a story and the long version is still there for anyone who wants it.
   Nothing is hidden from a screen reader or from find-in-page while open; collapsed content
   is removed from the flow rather than clipped, so the column solver measures it honestly.
   -------------------------------------------------------------------------------------- */
export default function Unfold({children, label = 'Keep reading', count}) {
  const [open, setOpen] = useState(false);
  const items = Array.isArray(children) ? children.filter(Boolean) : [children];
  const first = items[0];
  const rest = items.slice(1);
  const wasOpen = useRef(false);

  // Opening changes how much content exists, so the rail has to re-solve its columns.
  useEffect(() => {
    if (open === wasOpen.current) return;
    wasOpen.current = open;
    if (open) (label === 'The other reading' ? noteCounter : noteUnfold)();
    const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
    return () => clearTimeout(t);
  }, [open]);

  if (!rest.length) return <>{first}</>;
  return (
    <>
      {first}
      {open && rest}
      <button className={`unfold ${open ? 'is-open' : ''}`} onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {open ? <Minus size={14} /> : <Plus size={14} />}
        {open ? 'Enough' : label}
        {!open && count ? <em>{count} more</em> : null}
      </button>
    </>
  );
}
