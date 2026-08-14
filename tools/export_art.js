/* =====================================================================
   Export every character and animal as a standalone SVG.

   This runs the game's OWN art functions rather than copying their output,
   so the exported files cannot drift from what the game draws. Re-run it
   after any change to person(), beast() or DEFS and the pack is current.

   The art parts are plain string builders, but they live in a browser
   file that touches document/window at load time, so this stubs just
   enough of a DOM for them to evaluate. Nothing is rendered - the
   functions only ever return strings.

   Usage:  node tools/export_art.js [outDir]
   ===================================================================== */

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const SRC  = path.join(__dirname, '..', 'src');
const OUT  = process.argv[2] || path.join(__dirname, '..', 'export', 'greenhollow-art');

/* The parts that define the art, in load order. Anything later in the
   build only decorates buildings and pens, which this pack does not use. */
const PARTS = [
  'p2_art.js',            // DEFS, person, beast, canopy, patch...
  'p49_animals3d.js',     // beast3d overrides beast with the good bodies
  'p54_duck_bee.js',      // beeBody
  'p59_animal_tongue.js',
  /* The horse body is added here, not in p49 - leave it out and beast()
     falls through to the 195-byte generic blob for horses only. */
  'p64_horse_guests.js',
  'p68_new_species.js',   // quail, pig, turkey, alpaca bodies + SPECIES
  'p69_bench.js',         // bookArt, for the reading pose
];

/* ---- a DOM stub: enough to evaluate, not enough to render ---- */
const noop = () => {};
const fakeEl = () => ({
  style:{setProperty:noop}, classList:{add:noop,remove:noop,toggle:noop},
  setAttribute:noop, getAttribute:()=>null, appendChild:noop, remove:noop,
  querySelector:()=>null, querySelectorAll:()=>[], addEventListener:noop,
  insertBefore:noop, children:[], textContent:'', innerHTML:'', dataset:{},
});
const sandbox = {
  console,
  document:{
    createElement:fakeEl, createElementNS:fakeEl, getElementById:()=>null,
    querySelector:()=>null, querySelectorAll:()=>[], addEventListener:noop,
    head:fakeEl(), body:Object.assign(fakeEl(),{firstChild:null}),
    documentElement:fakeEl(),
  },
  window:{}, navigator:{userAgent:'node'}, localStorage:{getItem:()=>null,setItem:noop},
  requestAnimationFrame:noop, setTimeout:noop, setInterval:noop, clearInterval:noop,
  performance:{now:()=>0}, matchMedia:()=>({matches:false,addEventListener:noop}),
  /* game globals the art parts read at load time */
  S:{objs:[],family:[],guests:[],speed:0,settings:{}}, G:{}, BPMAP:{}, CROPS:{},
  FARM:{x:3,y:3,w:16,h:11}, WPX:1920, HPX:1360, DAY_MS:600000, acc:0,
  isNight:()=>false, dayFrac:()=>0.5, clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  footprint:(bp)=>({w:(bp&&bp.w)||1,h:(bp&&bp.h)||1}),
  curTier:()=>0, speak:noop, render:noop, terrainCache:'',
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);

let loaded = [];
for(const f of PARTS){
  const p = path.join(SRC, f);
  if(!fs.existsSync(p)){ console.warn('  skip (missing):', f); continue; }
  try { vm.runInContext(fs.readFileSync(p,'utf8'), ctx, {filename:f}); loaded.push(f); }
  catch(e){ console.warn(`  ${f} stopped early (${e.message.split('\n')[0]}) - continuing`); loaded.push(f+'*'); }
}
console.log('loaded:', loaded.join(', '));

const { person, beast, DEFS } = sandbox;
if(typeof person !== 'function' || typeof beast !== 'function')
  throw new Error('person()/beast() did not load - the DOM stub is not sufficient');

const defs = DEFS();

/* ---- the cast, with the colours the game actually assigns ---- */
const PEOPLE = [
  ['you',             1.15, '#c8583f', '#e0c07a', 'You — the player character'],
  ['partner',         1.00, '#8f6fc4', null,      'Your partner'],
  ['child-eldest',    0.80, '#e8a33d', null,      'Eldest child'],
  ['child-youngest',  0.72, '#5fb0d4', null,      'Youngest child'],
  ['worker-a',        1.00, '#d4726a', '#e8e0cc', 'Hired worker'],
  ['worker-b',        1.00, '#6bbf7a', '#e8e0cc', 'Hired worker'],
  ['worker-c',        1.00, '#e0995c', '#e8e0cc', 'Hired worker'],
  ['worker-d',        1.00, '#7fa8c4', '#e8e0cc', 'Hired worker'],
  ['trader',          1.00, '#c47fa8', '#e8e0cc', 'Market trader'],
  ['guest-tent',      1.00, '#6bbf7a', null,      'Glamping guest'],
  ['guest-dome',      1.00, '#7fa8c4', null,      'Dome guest'],
  ['fisherman',       1.00, '#5f8aa8', '#c9b98a', 'Seasonal fisherman'],
];
const ANIMALS = ['chicken','duck','goat','sheep','cow','rabbit','horse','quail','pig','turkey','alpaca'];

const wrap = (title, vb, inner, w, h) =>
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}">
  <title>Greenhollow — ${title}</title>
${defs}
  <g>${inner}</g>
</svg>
`;

const write = (rel, body) => {
  const full = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(full), {recursive:true});
  fs.writeFileSync(full, body);
  return {rel, bytes:body.length};
};

const made = [];
PEOPLE.forEach(([name, sc, shirt, hat, label])=>{
  made.push(Object.assign(write(`people/${name}.svg`,
    wrap(label, '-14 -17 28 30', person(0,0,sc,shirt,hat), 280, 300)), {label, group:'people'}));
});
if(typeof sandbox.bookArt === 'function')
  made.push(Object.assign(write('people/reading.svg',
    wrap('Reading on a bench','-14 -17 28 30', person(0,0,1,'#8f6fc4',null,sandbox.bookArt(0,0,1)), 280, 300)),
    {label:'Reading on a bench', group:'people'}));

ANIMALS.forEach(k=>{
  const art = beast(k,0,0,1.6);
  if(art.length < 300) { console.warn('  ! %s fell through to the generic body - skipped', k); return; }
  made.push(Object.assign(write(`animals/${k}.svg`,
    wrap(k, '-22 -26 44 40', art, 440, 400)), {label:k, group:'animals'}));
});
if(typeof sandbox.beeBody === 'function')
  made.push(Object.assign(write('animals/bee.svg',
    wrap('bee','-16 -14 32 26', sandbox.beeBody(0,0,3.2), 320, 260)), {label:'bee', group:'animals'}));

/* ---- a contact sheet so the pack can be seen at a glance ---- */
const card = m =>
  `<figure><img src="${m.rel}" alt="${m.label}"><figcaption>${m.label}<small>${m.rel.split('/')[1]}</small></figcaption></figure>`;
fs.writeFileSync(path.join(OUT,'index.html'),
`<!doctype html><meta charset="utf-8"><title>Greenhollow art pack</title>
<style>
 body{margin:0;padding:28px;background:#8fae63;font:15px/1.5 system-ui,sans-serif;color:#1c2a12}
 h1{margin:0 0 4px;font-size:22px} h2{margin:28px 0 10px;font-size:15px;text-transform:uppercase;letter-spacing:.08em;opacity:.75}
 p.lede{margin:0 0 8px;max-width:60ch}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px}
 figure{margin:0;background:rgba(255,255,255,.5);border-radius:12px;padding:10px;text-align:center}
 img{width:100%;height:110px;object-fit:contain;display:block}
 figcaption{font-size:12px;margin-top:6px} small{display:block;opacity:.6;font-size:11px}
</style>
<h1>Greenhollow art pack</h1>
<p class="lede">Every file is a standalone SVG with the game's gradients embedded, so it opens
anywhere and scales without loss. Generated by <code>tools/export_art.js</code> from the game's
own drawing code — re-run it after any art change and this pack is current.</p>
<h2>People (${made.filter(m=>m.group==='people').length})</h2>
<div class="grid">${made.filter(m=>m.group==='people').map(card).join('')}</div>
<h2>Animals (${made.filter(m=>m.group==='animals').length})</h2>
<div class="grid">${made.filter(m=>m.group==='animals').map(card).join('')}</div>
`);

console.log(`\nwrote ${made.length} SVGs + index.html to ${OUT}`);
made.forEach(m=>console.log(`  ${m.rel.padEnd(30)} ${String(m.bytes).padStart(6)} B`));
