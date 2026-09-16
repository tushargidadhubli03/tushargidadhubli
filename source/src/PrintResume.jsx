import {profile} from './content.js';
import {professionalJourney, additionalRoles, volunteering, education, capabilities} from './narrative.js';

/* --------------------------------------------------------------------------------------
   THE RESUME
   The site's entire argument is that a resume is not enough. That argument only works if the
   resume itself is good — refusing the format because you cannot execute it is not a position,
   it is an excuse. So: one page, generated from the same narrative.js that drives everything
   else, hidden on screen and revealed only by the print stylesheet. One source of truth, two
   outputs, and the joke pays off instead of just sitting there.
   -------------------------------------------------------------------------------------- */

const short = p => p
  .replace(/–|—/g, '–')
  .replace(/ – present/, ' – present');

export default function PrintResume() {
  const roles = [...professionalJourney].reverse();
  return (
    <div className="resume-sheet" aria-hidden="true">
      <header className="rs-head">
        <div>
          <h1>Tushar Gidadhubli</h1>
          <p className="rs-role">Chief Administrative Officer, Directive 17 · Atlanta, Georgia</p>
        </div>
        <ul className="rs-contact">
          <li>{profile.email}</li>
          <li>linkedin.com/in/tushargidadhubli</li>
          <li>The longer version: tushar-a-little-world.dhubli.chatgpt.site</li>
        </ul>
      </header>

      <div className="rs-body">
        <main className="rs-main">
          <h2>Experience</h2>
          {roles.map(r => (
            <article key={r.id} className="rs-role-item">
              <div className="rs-role-line">
                <strong>{r.company}</strong>
                <em>{r.role}</em>
                <time>{short(r.period)}</time>
              </div>
              <p>{r.paragraphs[0]}</p>
            </article>
          ))}
        </main>

        <aside className="rs-side">
          <section>
            <h2>What I do</h2>
            <ul className="rs-caps">
              {capabilities.map(c => (
                <li key={c.title}><strong>{c.title}</strong><span>{c.body}</span></li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Education</h2>
            {education.map(e => (
              <p key={e.id} className="rs-edu">
                <strong>{e.company}</strong><br />
                {e.role}<br />
                <span>{e.period}</span>
              </p>
            ))}
          </section>

          <section>
            <h2>Also</h2>
            <ul className="rs-also">
              {[...additionalRoles].reverse().map(r => (
                <li key={r.id}>{r.company} — {r.role} <span>{short(r.period)}</span></li>
              ))}
              {[...volunteering].reverse().map(r => (
                <li key={r.id}>{r.company} — {r.role} <span>{short(r.period)}</span></li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <footer className="rs-foot">
        This page was generated from the same file that writes the website, so it cannot fall
        out of date with it. Everything here is also on the site, with the reasons attached.
      </footer>
    </div>
  );
}
