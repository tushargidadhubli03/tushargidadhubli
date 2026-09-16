import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {profile} from '../src/content.js';
import {chapters,fullStory,professionalJourney,additionalRoles,volunteering,education,allRoles,storyCounter,roleCounter,urbanysis,claimStates} from '../src/narrative.js';
import {frame,getAxisTarget} from '../src/state.js';
import {homeLayout,focusLayout,focusModel} from '../src/scene-layout.js';
import {shotPoint,stepBall,INITIAL_BALL} from '../src/physics.js';

assert.equal(profile.birthday,'2003-07-24');
assert.equal(new Set(chapters.map(c=>c.id)).size,9);
assert.ok(profile.spotify.endsWith(profile.spotifyId));
const expected=['left-middle-right','sigur','house','equinox','carmen','icba','bgr','stewards','urbanysis','directive-analyst','directive-cao'];
assert.deepEqual(professionalJourney.map(r=>r.id),expected);
assert.ok(professionalJourney.every(r=>r.company&&r.role&&r.period&&r.paragraphs.length>=2));
assert.equal(professionalJourney.at(-1).role,'Chief Administrative Officer');
assert.ok(professionalJourney.find(r=>r.id==='urbanysis').paragraphs.join(' ').includes('not successful'));
const story=fullStory.flatMap(b=>b.paragraphs).join('\n');
assert.ok(story.split(/\s+/).length>650,'The full personal story must remain present.');
for(const fact of ['twin sister','koi fish tattoos','Dostoevsky','East of Eden','Thanos','Rishikesh','every two years','joy I spread'])assert.ok(story.includes(fact),`Missing personal context: ${fact}`);
const app=readFileSync('src/App.jsx','utf8');
const publicContent=story+JSON.stringify(professionalJourney)+app+readFileSync('src/Career.jsx','utf8');
for(const falseClaim of ['PayPal','Chinese proficiency','graduated from George','thousands of years'])assert.ok(!publicContent.includes(falseClaim),`Unexpected content: ${falseClaim}`);
assert.ok(publicContent.includes('attended George Washington University from 2021–2025'));
assert.ok(!existsSync('src/Chapters.jsx'),'Remove obsolete chapter implementation.');
for(const c of chapters){assert.ok(app.includes(`id="${c.id}"`),`Missing navigable section: ${c.id}`);assert.equal(focusModel[c.id],c.model);}
// Check scene projection, animation envelopes and labels separately.
await import('./check-artifacts.mjs');
let b={...INITIAL_BALL,vx:Math.cos(54*Math.PI/180)*8.6,vy:Math.sin(54*Math.PI/180)*8.6},result;
for(let i=0;i<240;i++){const next=stepBall(b,1/120);if(b.y>2.75&&next.y<=2.75&&next.vy<0){result=Math.abs(next.x-2)<.38;break}b=next}
assert.equal(result,true,'Initial basketball settings must produce a reachable scoring shot.');
const p=shotPoint(54,8.6,.3);let integrated={...INITIAL_BALL,vx:Math.cos(54*Math.PI/180)*8.6,vy:Math.sin(54*Math.PI/180)*8.6};for(let i=0;i<30;i++)integrated=stepBall(integrated,.01);assert.ok(Math.abs(integrated.x-p[0])<.00001);assert.ok(Math.abs(integrated.y-p[1])<.00001);
if(existsSync('dist/index.html')){const html=readFileSync('dist/index.html','utf8');for(const [,path]of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g))assert.ok(existsSync(resolve('dist',path)),`Missing asset: ${path}`);assert.ok(readdirSync('dist/assets').some(f=>f.endsWith('.woff2')));assert.ok(!html.includes('src="/assets/'),'Asset paths must work below a GitHub project prefix.');}

// --- Record corrections, locked 14 Sep 2026 against LinkedIn. Do not let these regress. ---
const role=id=>professionalJourney.find(r=>r.id===id);
assert.equal(role('icba').role,'Regulatory Affairs Intern','ICBA title was corrected from Government Affairs Intern.');
assert.equal(role('stewards').role,'AI Policy Analyst','Stewards.AI title was corrected from Policy Analyst.');
assert.equal(role('sigur').role,'Undergraduate Research Assistant','Sigur title was corrected from Undergraduate Researcher.');
assert.equal(role('urbanysis').company,'Urbanysis','The venture is named, never "Stealth Startup".');

// Every dated entry must be machine-readable so the career plot can place it.
const dated=[...professionalJourney,...additionalRoles,...volunteering,...education];
for(const r of dated){
  assert.match(r.start,/^\d{4}-\d{2}$/,`${r.id}: start must be YYYY-MM`);
  assert.ok(r.end===null||/^\d{4}-\d{2}$/.test(r.end),`${r.id}: end must be YYYY-MM or null`);
  assert.ok(r.end===null||r.end>=r.start,`${r.id}: ends before it starts`);
  assert.ok(r.tier==='story'||r.tier==='record',`${r.id}: needs a tier`);
}
assert.ok(professionalJourney.every(r=>r.tier==='story'));
assert.equal(allRoles.length,professionalJourney.length+additionalRoles.length+volunteering.length);
assert.deepEqual(allRoles.map(r=>r.start),[...allRoles.map(r=>r.start)].sort(),'allRoles must stay chronological.');

// Roles the site used to omit entirely.
for(const id of ['lmr-research','akpsi-outreach','akpsi-ritual'])assert.ok(additionalRoles.some(r=>r.id===id),`Missing record role: ${id}`);
for(const id of ['lions','miriams'])assert.ok(volunteering.some(r=>r.id===id),`Missing volunteering: ${id}`);
assert.equal(role('directive-cao').end,null,'The current role must stay open-ended.');
assert.equal(role('equinox').end,'2024-11');

const recordContent=JSON.stringify([...additionalRoles,...volunteering,...education]);
for(const falseClaim of ['Stealth Startup','Administrative Assistant','Bachelor of Science','graduated'])assert.ok(!recordContent.includes(falseClaim),`Unexpected content in the record: ${falseClaim}`);


// --- The perspective axis ---------------------------------------------------------------
assert.equal(frame.axis,-1,'The site must open on the conviction side, not halfway.');
assert.equal(getAxisTarget(),-1,'Axis target must start at the conviction pole.');
assert.equal(storyCounter.length,fullStory.length,'Every story block needs a second reading.');
for(const r of professionalJourney)assert.ok(roleCounter[r.id]?.length>=1,`${r.id} has no counter-reading`);
const counters=[...storyCounter.flat(),...Object.values(roleCounter).flat()];
assert.ok(counters.length>=28,'The second reading must be substantial, not a token line.');
assert.ok(counters.every(p=>p.trim().length>60),'Counter-readings must be real passages.');
const counterText=counters.join(' ');
for(const must of ['prediction you cannot produce','twenty-one','never had to prove'])assert.ok(counterText.includes(must),`Counter-reading lost: ${must}`);

// --- Urbanysis: claim states, and the arithmetic behind the one chart --------------------
assert.equal(urbanysis.bii.dimensions.reduce((a,d)=>a+d.weight,0),100,'BII draft weights must sum to 100.');
assert.equal(urbanysis.corridorMpi.dimensions.length,6);
for(const b of urbanysis.blocks)assert.ok(claimStates[b.claim],`${b.id}: unknown claim state`);
assert.ok(urbanysis.blocks.some(b=>b.claim==='developed')&&urbanysis.blocks.some(b=>b.claim==='envisioned')&&urbanysis.blocks.some(b=>b.claim==='outcome'),'All three claim states must be represented.');
const urbanText=JSON.stringify(urbanysis);
assert.ok(urbanText.includes('AF-inspired adaptation'),'The BII must be described as AF-inspired, never as AF itself.');
for(const overclaim of ['peer-reviewed','deployed across','proven impact','validated by'])assert.ok(!urbanText.includes(overclaim),`Urbanysis overclaim: ${overclaim}`);

// --- The dependency that existed to do two fade-ins -------------------------------------
const pkg=JSON.parse(readFileSync('package.json','utf8'));
assert.ok(!pkg.dependencies.gsap,'GSAP was removed; the hero reveal is a keyframe.');
assert.ok(pkg.dependencies['@react-three/postprocessing'],'The render pass needs postprocessing.');

console.log(`Passed: ${professionalJourney.length} story roles + ${additionalRoles.length} record roles + ${volunteering.length} volunteering (${allRoles.length} dated entries, chronological), full story, corrected titles, chapter links, ${storyCounter.length + Object.keys(roleCounter).length} two-sided passages, Urbanysis claim states, responsive scene bounds, basketball physics, and portable assets.`);
