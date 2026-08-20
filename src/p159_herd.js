/* =====================================================================
   A COW IS A SPECIFIC COW

   Stock have been a number. A pen holds six, and the six are
   interchangeable: they have no age, no mother, no temperament and no
   history, and the one you sell is the same as the one you keep. p53 gave
   the pen a mind — where they stand, what they are doing — but not the
   animals inside it.

   Every animal is now an individual with an ear tag, a name, a birth date,
   a dam if it was born here, four temperament traits, a weight, and a
   record of everything that has happened to it. The birds have worked this
   way since the flock was written; this is the same idea applied to the
   stock, where it costs you money.

   IT SHOWS UP IN THE MILK. Individual quality — temperament, condition and
   how much the animal trusts you — feeds the pen's output, so a good herd
   genuinely out-produces a poor one of the same size. Bounded, so it
   colours the yield rather than replacing the husbandry that was already
   there.

   THEY KNOW EACH OTHER. Each one follows somebody and most of them get
   along; a few do not, and a pen with a bully in it is measurably less
   content than the same pen without.

   AND THE PAPERWORK IS REAL. A herd book across every pen: tag, age, dam,
   weight, condition, what it has produced, what it has cost you in
   treatment. Sortable, so the question "which of these is not earning its
   feed" has an answer you can point at instead of a guess.

   COMPATIBILITY, THE HARD WAY. Everything in the game reads o.animals as a
   count, and it still can — the individuals are kept in step with it in
   both directions. Buy four and four arrive with tags. Lose one overnight
   and the herd book says which one, by name.

   The records live on o.book, not o.herd, because o.herd was already
   taken: p9 keeps a positional animal there with health and happy on it,
   and herdHealth reads exactly those. Writing my own objects into that
   array left them with neither, so herdHealth averaged undefined and
   yieldMul came back NaN for every pen on the farm — including one the
   game had placed itself. Caught by checking a properly placed pen rather
   than assuming my test data was at fault; the same name-collision that
   put NaN in the cash pill earlier, one field along.
   ===================================================================== */

const BEAST_NAMES = ['Maisie','Dot','Clover','Bramble','Nessa','Poppy','Juno','Hazel','Fern',
  'Willow','Pearl','Olive','Tansy','Meg','Rosie','Bluebell','Nutmeg','Sorrel','Ivy','Marigold',
  'Barney','Duke','Rufus','Otto','Gus','Wilbur','Sid','Monty','Alfie','Bruno'];
let TAG_SEQ = 0;

function herdState(){ if(!S.herd) S.herd = { seq:1, sold:[], log:[] }; return S.herd; }
function animalPensAll(){ return (S.objs || []).filter(o=>(BPMAP[o.bp] || {}).kind === 'animal'); }

function makeBeast(o, dam){
  const H = herdState();
  const bp = BPMAP[o.bp] || {};
  const t = ()=>+(0.15 + Math.random()*0.8).toFixed(2);
  const b = {
    id: 'a' + (H.seq++),
    tag: 'GH-' + String(H.seq).padStart(3, '0'),
    name: BEAST_NAMES[Math.floor(Math.random()*BEAST_NAMES.length)],
    kind: bp.animal || 'stock',
    born: dam ? (S.day || 1) : (S.day || 1) - Math.floor(20 + Math.random()*900),
    bornHere: !!dam,
    dam: dam ? dam.id : null,
    sex: Math.random() < 0.82 ? 'f' : 'm',
    temper: { calm:t(), hardy:t(), greedy:t(), social:t() },
    cond: 0.72 + Math.random()*0.2,
    weight: Math.round((bp.animal === 'cow' ? 420 : bp.animal === 'sheep' ? 58 :
             bp.animal === 'goat' ? 46 : bp.animal === 'pig' ? 85 : 2.4) * (0.85 + Math.random()*0.3)),
    trust: 0.1 + Math.random()*0.2,
    follows: null, dislikes: null,
    produced: 0, vet: 0,
    notes: [],
  };
  b.notes.push({ d:S.day || 1, t: dam ? `Born here, out of ${dam.name}.` : 'Bought in.' });
  return b;
}
function noteBeast(b, text){
  b.notes.unshift({ d:S.day || 1, t:text });
  if(b.notes.length > 24) b.notes.length = 24;
}

/* the individuals are kept in step with the count, both ways */
function bookOf(o){
  if(!o) return [];
  const bp = BPMAP[o.bp] || {};
  if(bp.kind !== 'animal') return [];
  if(!o.book) o.book = [];
  const want = o.animals || 0;
  /* arrivals: bought in, or born to a dam already here */
  while(o.book.length < want){
    const mums = o.book.filter(x=>x.sex === 'f' && (S.day || 1) - x.born > 400);
    const dam = (o.book.length && mums.length && Math.random() < 0.6)
      ? mums[Math.floor(Math.random()*mums.length)] : null;
    const b = makeBeast(o, dam);
    o.book.push(b);
    if(dam && typeof log === 'function')
      log(`${dam.name} has had a ${b.sex === 'f' ? 'heifer' : 'bull'} calf — ${b.name}, ${b.tag}.`,
        'good', 'farm');
  }
  /* departures: the game took one off the count, so say which */
  while(o.book.length > want){
    /* the least productive goes first, which is what actually happens */
    o.book.sort((a,b2)=>beastQuality(a) - beastQuality(b2));
    const gone = o.book.shift();
    herdState().sold.push({ tag:gone.tag, name:gone.name, day:S.day || 1, kind:gone.kind });
    if(typeof log === 'function') log(`${gone.name} (${gone.tag}) is off the books.`, '', 'farm');
  }
  /* who follows whom, settled once */
  o.book.forEach(b=>{
    if(b.follows === null && o.book.length > 1){
      const others = o.book.filter(x=>x !== b);
      b.follows = others[Math.floor(Math.random()*others.length)].id;
      if(Math.random() < 0.18){
        const d = others[Math.floor(Math.random()*others.length)];
        if(d.id !== b.follows) b.dislikes = d.id;
      }
    }
  });
  return o.book;
}
/* one number for how good an animal is, used for output and for culling */
function beastQuality(b){
  const t = b.temper;
  return Math.max(0.15, Math.min(1.6,
    0.45 + b.cond*0.45 + b.trust*0.25 + t.calm*0.2 + t.hardy*0.2 - t.greedy*0.1));
}
function penQuality(o){
  const h = bookOf(o);
  if(!h.length) return 1;
  const avg = h.reduce((a,b)=>a + beastQuality(b), 0) / h.length;
  /* a bully makes the whole pen worse */
  const bullies = h.filter(b=>b.dislikes).length;
  return avg * (1 - Math.min(0.18, bullies * 0.05));
}

/* ---------- it shows up in the milk ---------- */
if(typeof yieldMul === 'function'){
  const _yieldMulHerd = yieldMul;
  yieldMul = function(o){
    const base = _yieldMulHerd.apply(this, arguments);
    try{
      const bp = BPMAP[o.bp] || {};
      if(bp.kind !== 'animal' || !(o.animals > 0)) return base;
      const q = penQuality(o);
      /* bounded: the herd colours the yield, husbandry still decides it */
      return base * Math.max(0.75, Math.min(1.3, 0.72 + q*0.42));
    }catch(e){}
    return base;
  };
}

/* ---------- they grow, they age, they get looked after ---------- */
let HERD_DAY = -1;
function herdDay(){
  if(HERD_DAY === S.day) return;
  HERD_DAY = S.day;
  animalPensAll().forEach(o=>{
    const h = bookOf(o);
    const care = (o.care === undefined ? 1 : o.care);
    h.forEach(b=>{
      /* condition follows how the pen is kept, tempered by how hardy it is */
      const drift = (care - 0.55) * 0.02 + (b.temper.hardy - 0.5) * 0.004;
      b.cond = Math.max(0.15, Math.min(1, b.cond + drift - (o.sick ? 0.02 : 0)));
      /* they put on weight while young, and hold it after */
      const age = (S.day || 1) - b.born;
      if(age < 500) b.weight = Math.round(b.weight * 1.002);
      /* trust grows if you are about, and decays if you never are */
      const near = S.you && Math.hypot(S.you.x - (o.tx*T), S.you.y - (o.ty*T)) < T*6;
      b.trust = Math.max(0, Math.min(1, b.trust + (near ? 0.012 : -0.002)));
      b.produced += Math.max(0, (o.ready || 0) / Math.max(1, h.length) * 0.1);
      if(o.sick && Math.random() < 0.05) noteBeast(b, 'Off colour with the rest of the pen.');
    });
  });
}
if(typeof tickPeople === 'function'){
  const _tickHerd = tickPeople;
  tickPeople = function(){
    const r = _tickHerd.apply(this, arguments);
    try{ herdDay(); }catch(e){}
    return r;
  };
}

/* ---------- the herd book ---------- */
let HERD_SORT = 'tag';
G.openHerd = function(sort){
  if(sort) HERD_SORT = sort;
  const all = [];
  animalPensAll().forEach(o=>bookOf(o).forEach(b=>all.push({ b, o })));
  const key = { tag:(x)=>x.b.tag, name:(x)=>x.b.name,
    age:(x)=>-( (S.day||1) - x.b.born ), cond:(x)=>-x.b.cond,
    weight:(x)=>-x.b.weight, quality:(x)=>-beastQuality(x.b) }[HERD_SORT] || ((x)=>x.b.tag);
  all.sort((a,b2)=>{ const ka = key(a), kb = key(b2);
    return typeof ka === 'string' ? ka.localeCompare(kb) : ka - kb; });
  const H = herdState();
  modal(`<h2>The herd book</h2>
    <p class="sub">${all.length} head across ${animalPensAll().filter(o=>o.animals>0).length}
      pen${animalPensAll().filter(o=>o.animals>0).length===1?'':'s'}.
      ${H.sold.length ? `${H.sold.length} off the books since you started.` : ''}</p>
    <div class="herdsort">Sort:
      ${['tag','name','age','cond','weight','quality'].map(k=>
        `<button class="btn ghost${HERD_SORT===k?' on':''}" onclick="G.openHerd('${k}')">${
          k==='cond'?'condition':k}</button>`).join('')}</div>
    <div class="tablewrap" style="margin-top:8px;max-height:46vh;overflow:auto">
      <table><thead><tr><th>Tag</th><th>Name</th><th>Pen</th><th>Age</th>
        <th>Condition</th><th>Weight</th><th>Worth keeping</th></tr></thead><tbody>
      ${all.map(({b,o})=>{
        const age = (S.day||1) - b.born;
        const yrs = (age/120).toFixed(1);
        const q = beastQuality(b);
        return `<tr class="herdrow" onclick="G.openBeast('${b.id}')">
          <td class="n">${b.tag}</td><td>${b.name}${b.sex==='m'?' ♂':''}</td>
          <td>${(BPMAP[o.bp]||{}).name||''}</td>
          <td class="n">${yrs}y</td>
          <td class="n">${Math.round(b.cond*100)}%</td>
          <td class="n">${b.weight}kg</td>
          <td class="n" style="color:${q>1.05?'#7cc24f':q<0.8?'#e2a05c':'inherit'}">${q.toFixed(2)}</td>
        </tr>`; }).join('')}
      </tbody></table></div>
    ${all.length ? '' : '<p class="sub">No stock yet.</p>'}
    <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Close</button></div>`);
};
G.openBeast = function(id){
  let found = null, pen = null;
  animalPensAll().forEach(o=>{ const b = bookOf(o).find(x=>x.id === id); if(b){ found = b; pen = o; } });
  if(!found) return G.openHerd();
  const b = found;
  const age = (S.day||1) - b.born;
  const dam = pen ? bookOf(pen).find(x=>x.id === b.dam) : null;
  const kids = pen ? bookOf(pen).filter(x=>x.dam === b.id) : [];
  const fol = pen ? bookOf(pen).find(x=>x.id === b.follows) : null;
  const dis = pen ? bookOf(pen).find(x=>x.id === b.dislikes) : null;
  modal(`<h2>${b.name} <span class="muted" style="font-size:14px">${b.tag}</span></h2>
    <p class="sub">${b.kind}${b.sex==='f'?', female':', male'} ·
      ${b.bornHere ? 'born here' : 'bought in'} · ${(age/120).toFixed(1)} years
      · in the ${(BPMAP[pen.bp]||{}).name.toLowerCase()}</p>
    <div class="rows">
      <div class="row"><span>Condition</span><b>${Math.round(b.cond*100)}%</b></div>
      <div class="row"><span>Weight</span><b>${b.weight} kg</b></div>
      <div class="row"><span>Trusts you</span><b>${Math.round(b.trust*100)}%</b></div>
      <div class="row"><span>Worth keeping</span><b>${beastQuality(b).toFixed(2)}</b></div>
      <div class="row"><span>Temperament</span><b>${
        Object.entries(b.temper).sort((x,y)=>y[1]-x[1]).slice(0,2).map(([k])=>k).join(', ')}</b></div>
      ${dam ? `<div class="row"><span>Out of</span><b>${dam.name} (${dam.tag})</b></div>` : ''}
      ${kids.length ? `<div class="row"><span>Produced</span><b>${kids.map(k=>k.name).join(', ')}</b></div>` : ''}
      ${fol ? `<div class="row"><span>Follows</span><b>${fol.name}</b></div>` : ''}
      ${dis ? `<div class="row"><span>Will not stand near</span><b class="cbad">${dis.name}</b></div>` : ''}
      <div class="row"><span>Treatments</span><b>${b.vet}</b></div>
    </div>
    <h3 style="margin:14px 0 6px;font-size:15px">Record</h3>
    <div class="rows">${b.notes.slice(0,8).map(nt=>
      `<div class="row"><span>${nt.t}</span><b>day ${nt.d}</b></div>`).join('')}</div>
    <div class="mkgrid" style="margin-top:12px">
      <button class="mkcard" onclick="G.treatBeast('${b.id}')"><b>Have the vet see it</b>
        <span class="muted">Improves condition and is written on the record.</span>
        <span class="lprice">${fmt(140)}</span></button>
      <button class="mkcard" onclick="G.handleBeast('${b.id}')"><b>Spend time with it</b>
        <span class="muted">Quieter stock produce better. Costs you the afternoon.</span>
        <span class="lprice">An hour</span></button>
    </div>
    <div class="mfoot"><button class="btn ghost" onclick="G.openHerd()">Back to the book</button></div>`);
};
G.treatBeast = function(id){
  let b = null, pen = null;
  animalPensAll().forEach(o=>{ const f = bookOf(o).find(x=>x.id === id); if(f){ b = f; pen = o; } });
  if(!b) return;
  if(S.cash < 140) return toast('Not enough for the vet','bad');
  S.cash -= 140; b.vet++;
  b.cond = Math.min(1, b.cond + 0.22);
  noteBeast(b, 'Seen by the vet.');
  if(typeof log === 'function') log(`Vet out to ${b.name} (${b.tag}). ${fmt(140)}.`, '', 'money');
  G.openBeast(id);
};
G.handleBeast = function(id){
  let b = null;
  animalPensAll().forEach(o=>{ const f = bookOf(o).find(x=>x.id === id); if(f) b = f; });
  if(!b) return;
  b.trust = Math.min(1, b.trust + 0.16);
  b.temper.calm = Math.min(1, b.temper.calm + 0.03);
  noteBeast(b, 'Handled quietly for an afternoon.');
  G.openBeast(id);
};

if(typeof syncWorldButtons === 'function'){
  const _syncHerd = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncHerd.apply(this, arguments);
    try{
      const host = document.getElementById('zoomctl');
      if(host && !document.getElementById('herdbtn')){
        const b = document.createElement('button');
        b.id = 'herdbtn'; b.textContent = '🐄';
        b.title = 'The herd book';
        b.setAttribute('data-tip','<b>The herd book</b>Every animal by tag, age, dam and condition.');
        b.onclick = ()=>G.openHerd();
        host.insertBefore(b, host.firstChild);
      }
      const b2 = document.getElementById('herdbtn');
      if(b2) b2.style.display = animalPensAll().some(o=>o.animals>0) ? '' : 'none';
    }catch(e){}
    return r;
  };
}
(function herdCss(){
  const s = document.createElement('style');
  s.textContent = `
  .herdsort{ display:flex; flex-wrap:wrap; gap:6px; align-items:center; font-size:12px; opacity:.85 }
  .herdsort .btn{ padding:3px 9px; font-size:12px }
  .herdsort .btn.on{ outline:1px solid var(--gold,#d8b45a) }
  .herdrow{ cursor:pointer }
  .herdrow:hover td{ background:rgba(255,255,255,.05) }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.herdAudit = function(){
  const pens = animalPensAll().filter(o=>o.animals > 0);
  const all = [];
  pens.forEach(o=>bookOf(o).forEach(b=>all.push({ b, o })));
  return {
    pens: pens.length,
    head: all.length,
    countsMatch: pens.every(o=>bookOf(o).length === o.animals),
    bornHere: all.filter(x=>x.b.bornHere).length,
    withDam: all.filter(x=>x.b.dam).length,
    bullies: all.filter(x=>x.b.dislikes).length,
    offTheBooks: herdState().sold.length,
    penQuality: pens.map(o=>`${(BPMAP[o.bp]||{}).name}: ${penQuality(o).toFixed(2)}`),
    sample: all.slice(0, 5).map(x=>`${x.b.tag} ${x.b.name} ${Math.round(x.b.cond*100)}% `
      + `${x.b.weight}kg q${beastQuality(x.b).toFixed(2)}${x.b.dam ? ' out of a dam here' : ''}`),
  };
};
