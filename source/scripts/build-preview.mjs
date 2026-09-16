// Fold the preview build into one portable .html file: styles, script, fonts, favicon and
// the seven artifact textures all inlined, so the page runs from a bare file:// with no
// server and no network. Preview only — the shipping build is untouched.
import {readFileSync, writeFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

const dir = 'dist-preview';
let html = readFileSync(join(dir, 'index.html'), 'utf8');
const asset = n => readdirSync(join(dir, 'assets')).find(f => f.startsWith(n));
const css = readFileSync(join(dir, 'assets', asset('style-')), 'utf8');
let js = readFileSync(join(dir, 'assets', asset('index-')), 'utf8');

// Textures live in public/ and are fetched at runtime, so Vite cannot inline them.
// Swap the URL builder for a lookup into an inlined data-URI map.
const textures = {};
for (const f of readdirSync(join(dir, 'artifacts'))) {
  textures[f] = `data:image/jpeg;base64,${readFileSync(join(dir, 'artifacts', f)).toString('base64')}`;
}
const before = js;
js = js.replace(/\.map\((\w+)=>`\.\/artifacts\/\$\{\1\}`\)/, (_, v) => `.map(${v}=>window.__ART__[${v}])`);
if (js === before) throw new Error('Texture path builder not found — the bundle shape changed.');

const favicon = `data:image/svg+xml;base64,${readFileSync(join(dir, 'favicon.svg')).toString('base64')}`;
const safe = s => s.replace(/<\/script/gi, '<\\/script');

// The bundle cannot be pasted into the document as script text. React ships the literal
// string "<script>" inside its own source, and the HTML parser reacts to that sequence even
// though JavaScript considers it part of a string — everything after it gets swallowed and
// the page dies with "Unexpected token '<'". Escaping is not an option either, because the
// sequence sits inside a JS string literal that must survive intact. Handing the browser a
// base64 module means the body is never HTML-parsed at all. It has no imports left to
// resolve (the preview build inlines them), so data: module restrictions do not apply.
const moduleUrl = `data:text/javascript;base64,${Buffer.from(js, 'utf8').toString('base64')}`;

html = html
  .replace(/<link rel="stylesheet"[^>]*>/, `<style>${css}</style>`)
  .replace(/<script type="module"[^>]*><\/script>/,
    `<script>window.__ART__=${safe(JSON.stringify(textures))};</script>`)
  .replace('./favicon.svg', favicon)
  .replace('</body>', `<script type="module" src="${moduleUrl}"></script></body>`);

writeFileSync('tushar-website-preview.html', html);
console.log(`Single file written: ${(Buffer.byteLength(html) / 1048576).toFixed(2)} MB, ${Object.keys(textures).length} textures inlined`);
