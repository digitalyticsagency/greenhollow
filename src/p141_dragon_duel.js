/* =====================================================================
   TWO DRAGONS, AND THE STRONGER ONE WINS

   The champions' duel is two people. This is the other fight: two wyrms
   come down over your land and settle it between them, and the one with
   the better numbers usually walks away — usually, not always, because a
   fight nobody can lose is not a fight.

   THE POWER MODEL. Each dragon is rolled with a length, an element and a
   temper, and those three make its power. Power is not a die roll dressed
   up: it decides how much damage a blow does and how often the blow lands
   at all, so across a whole fight the stronger dragon wins about four
   times in five. The remaining fifth is the fun one. Both cards are shown
   before they start, so you can see who ought to win and watch it not
   happen.

   THE FIGHT. Eleven beats, none of them a re-skin of the champions':
   dragons fight in the air, so they circle, stoop, lock talons, fall
   grappling, break, and burn. The finish is a breath struggle — two cones
   meeting in the middle with the join sliding toward whoever is losing —
   which is the only moment the power difference is directly visible.

   THE DESTRUCTION. Not of your farm. p109 took the buildings off the
   table for the champions on purpose — levelling a hay barn for a
   spectacle turns a thing you want to watch into a thing you avoid
   clicking — and that reasoning holds just as well for two wyrms. So they
   bring the skyline down instead: a heavy blow shears a peak and it
   collapses through p109's own four-stage fall, which is bigger than a
   shed and costs you nothing. Craters open on the arena floor and stay
   for the rest of the fight, the screen shakes on the heavy landings, and
   debris is thrown from the impact rather than sprayed at random.

   Nothing here touches the champions' duel. It is a second thing on the
   same button.
   ===================================================================== */

const WYRM_ELEMS = {
  fire:  { n:'fire',  c:'#ff8a3a', c2:'#ffd27a', pow: 6, cry:'A roar like a furnace door opening.' },
  frost: { n:'frost', c:'#9fe4ff', c2:'#e8f8ff', pow: 4, cry:'A shriek that makes your teeth ache.' },
  storm: { n:'storm', c:'#b48aff', c2:'#e8dcff', pow: 7, cry:'A crack of thunder with a throat behind it.' },
  venom: { n:'venom', c:'#8fd44a', c2:'#dcf5a8', pow: 5, cry:'A hiss you feel in the back of your neck.' },
};
const WYRM_TEMPERS = [
  { id:'cold',   n:'cold-blooded', pow: 5, d:'Patient. Waits for the mistake.' },
  { id:'wild',   n:'wild',         pow: 3, d:'All attack, no guard.' },
  { id:'proud',  n:'proud',        pow: 6, d:'Fights to be seen doing it.' },
  { id:'old',    n:'old',          pow: 8, d:'Slow, scarred, and has done this before.' },
  { id:'young',  n:'young',        pow: 2, d:'Fast, and does not know what it is doing.' },
];
const WYRM_NAMES = ['Ashgrim','Vaelith','Korrenthal','Sable','Emberwake','Northwyrd',
                    'Grendlaw','Vashka','Ordrimm','Thistlemaw'];

function makeWyrm(i){
  const skins = (typeof LORD_SKINS !== 'undefined') ? LORD_SKINS : [
    { n:'jade', body:'#3fa86c', lit:'#7fd6a0', deep:'#1d5236', horn:'#f4ebc8', mane:'#f0d878', belly:'#cfe4c8' }];
  const ek = Object.keys(WYRM_ELEMS)[Math.floor(Math.random()*4)];
  const el = WYRM_ELEMS[ek];
  const tp = WYRM_TEMPERS[Math.floor(Math.random()*WYRM_TEMPERS.length)];
  const len = 0.82 + Math.random()*0.5;                   /* how long the serpent is */
  const skin = skins[(Math.floor(Math.random()*skins.length) + i) % skins.length];
  const w = {
    id: 'w'+i, name: WYRM_NAMES[Math.floor(Math.random()*WYRM_NAMES.length)],
    elem: ek, el, temper: tp, len, skin,
    x: 0, y: 0, a: 0, trail: [], t: Math.random()*6,
    hp: 100, breath: 0, hurt: 0, side: i ? 1 : -1,
  };
  /* length is worth the most, then temper, then element */
  w.power = Math.round(len*40 + tp.pow*2.2 + el.pow*1.6 + Math.random()*6);
  return w;
}

/* ---------- state ---------- */
let DD = null;
function dragonDuelOn(){ return !!(DD && !DD.over); }

const DD_BEATS = [
  { k:'arrive',   t:2.0 },
  { k:'circle',   t:1.8 },
  { k:'stoop',    t:1.4 },
  { k:'lock',     t:1.8 },
  { k:'fall',     t:1.6 },
  { k:'break',    t:1.2 },
  { k:'burn',     t:2.2 },
  { k:'slam',     t:1.6 },
  { k:'rise',     t:1.3 },
  { k:'struggle', t:3.0 },
  { k:'finish',   t:2.6 },
];

G.startDragonDuel = function(){
  if(dragonDuelOn()) return toast && toast('They are already at it','bad');
  if(typeof duelActive === 'function' && duelActive())
    return toast && toast('The champions are still fighting','bad');
  const A = makeWyrm(0), B = makeWyrm(1);
  const arenas = (typeof ARENAS !== 'undefined') ? ARENAS : null;
  DD = {
    a:A, b:B, bi:0, bt:0, t:0, over:false, fade:0,
    arena: arenas ? arenas[Math.floor(Math.random()*arenas.length)] : null,
    craters:[], debris:[], shake:0, flash:0, join:0.5,
    smashed:0, winner:null,
    peaks: (typeof makePeaks === 'function' && arenas)
      ? makePeaks(arenas[0]) : null,
  };
  /* the loser is decided by the fighting, but the odds come from the cards */
  if(typeof G.wakeTheWorld === 'function') G.wakeTheWorld();
  if(typeof log === 'function')
    log(`${A.name} and ${B.name} came down over the farm. This is not going to be quiet.`, 'bad', 'farm');
  try{ sfx('quake'); }catch(e){ try{ sfx('build'); }catch(e2){} }
  modal(`<h2>Two wyrms over the land</h2>
    <p class="sub">They have found each other above your farm and neither is leaving.
      You can see what each of them is carrying.</p>
    <div class="mkgrid">${[A,B].map(w=>`<div class="mkcard" style="cursor:default">
      <b>${w.name}</b>
      <span class="muted">${w.el.n} · ${w.temper.n} · ${(w.len*9+3).toFixed(1)}m<br>${w.temper.d}</span>
      <span class="lprice">power ${w.power}</span></div>`).join('')}</div>
    <p class="sub" style="margin-top:10px">${A.power === B.power ? 'Dead even.' :
      `${(A.power>B.power?A:B).name} is the stronger by ${Math.abs(A.power-B.power)}. That is
       usually enough.`}</p>
    <div class="mfoot"><button class="btn" onclick="G.closeModal()">Watch</button></div>`);
};

/* the champions button offers both fights now */
G.openFightPicker = function(){
  modal(`<h2>Something to watch</h2>
    <div class="mkgrid">
      <button class="mkcard" onclick="G.closeModal();G.startDuel()"><b>Two champions</b>
        <span class="muted">People. Beams, cries, a flattened outbuilding or two.</span>
        <span class="lprice">Call them down</span></button>
      <button class="mkcard" onclick="G.closeModal();G.startDragonDuel()"><b>Two wyrms</b>
        <span class="muted">Dragons. Longer, louder, and considerably more expensive.</span>
        <span class="lprice">Call them down</span></button>
    </div>
    <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Leave it</button></div>`);
};

/* ---------- the fighting ---------- */
function ddPositions(dt){
  const k = DD.bt / Math.max(0.01, DD_BEATS[DD.bi].t);
  const beat = DD_BEATS[DD.bi].k;
  const cx = WPX*0.5, cy = HPX*0.30, R = Math.min(WPX, HPX)*0.22;
  const A = DD.a, B = DD.b;
  const place = (w, x, y, a)=>{
    w.x = x; w.y = y; w.a = a;
    w.trail.unshift({ x, y });
    if(w.trail.length > 90) w.trail.length = 90;
  };
  const ang = DD.t*1.5;
  switch(beat){
    case 'arrive': {
      const p = Math.min(1, k);
      place(A, -WPX*0.2 + (cx - R - (-WPX*0.2))*p, cy - 40*p, 0);
      place(B, WPX*1.2 + (cx + R - WPX*1.2)*p, cy - 40*p, Math.PI);
      break; }
    case 'circle': case 'rise': {
      place(A, cx + Math.cos(ang)*R, cy + Math.sin(ang)*R*0.5, ang);
      place(B, cx + Math.cos(ang+Math.PI)*R, cy + Math.sin(ang+Math.PI)*R*0.5, ang+Math.PI);
      break; }
    case 'stoop': {
      place(A, cx - R*(1-k)*1.4, cy + k*30, 0);
      place(B, cx + R*(1-k)*1.4, cy + k*30, Math.PI);
      break; }
    case 'lock': {
      const j = Math.sin(DD.t*22)*5;
      place(A, cx - 22 + j, cy + Math.sin(DD.t*9)*7, 0);
      place(B, cx + 22 - j, cy + Math.sin(DD.t*9+1)*7, Math.PI);
      break; }
    case 'fall': {
      const y = cy + k*k*(HPX*0.34);
      const sp = Math.sin(DD.t*9)*26;
      place(A, cx - 20 + sp, y, DD.t*5);
      place(B, cx + 20 - sp, y + 6, DD.t*5 + Math.PI);
      break; }
    case 'break': {
      place(A, cx - 30 - k*R*1.1, cy + HPX*0.30 - k*HPX*0.18, -0.4);
      place(B, cx + 30 + k*R*1.1, cy + HPX*0.30 - k*HPX*0.18, Math.PI+0.4);
      break; }
    case 'burn': case 'struggle': case 'finish': {
      place(A, cx - R*1.15, cy + Math.sin(DD.t*2.2)*10, 0);
      place(B, cx + R*1.15, cy + Math.sin(DD.t*2.2+1)*10, Math.PI);
      break; }
    case 'slam': {
      const y = cy + HPX*0.30;
      place(A, cx - 40 + Math.sin(DD.t*6)*30, y - Math.abs(Math.sin(DD.t*4))*40, 0);
      place(B, cx + 40 - Math.sin(DD.t*6)*30, y - Math.abs(Math.cos(DD.t*4))*40, Math.PI);
      break; }
    default: {
      place(A, cx - R, cy, 0); place(B, cx + R, cy, Math.PI);
    }
  }
}

/* one exchange: power decides both the chance and the size */
function ddExchange(att, def, heavy){
  const edge = (att.power - def.power) / 60;
  const land = Math.min(0.92, Math.max(0.30, 0.6 + edge));
  if(Math.random() > land) return 0;
  const dmg = (heavy ? 13 : 7) * (0.75 + Math.max(0, edge)) * (0.8 + Math.random()*0.45);
  def.hp = Math.max(0, def.hp - dmg);
  def.hurt = 0.5;
  DD.shake = Math.max(DD.shake, heavy ? 1 : 0.5);
  DD.flash = Math.max(DD.flash, heavy ? 0.8 : 0.4);
  for(let i=0;i<(heavy?14:7);i++)
    DD.debris.push({ x:def.x, y:def.y, vx:(Math.random()-0.5)*220, vy:-40-Math.random()*180,
                     r:1.5+Math.random()*3, t:0, c: att.el.c });
  return dmg;
}

/* p109 took the farm off the table deliberately: the champions were
   levelling a building or two per fight, which turned a spectacle into
   something you avoided clicking, and duelTargets() has returned an empty
   list ever since. That reasoning holds exactly as well for two wyrms, so
   the destruction goes where p109 put it — into the skyline. A heavy blow
   brings a mountain down, which is bigger than a shed and costs you
   nothing. Craters and debris stay, because those are on the arena floor. */
function ddSmash(x){
  if(!DD.peaks) return;
  /* the peak nearest the impact, so what comes down follows the fight */
  let bi = -1, bd = 1e9;
  DD.peaks.peaks.forEach((p,i)=>{
    if(p.state !== 'intact') return;
    const d = Math.abs(p.cx - x);
    if(d < bd){ bd = d; bi = i; }
  });
  if(bi < 0) return;
  try{ breakPeak(DD.peaks, bi, DD.a.el.c); DD.smashed++; }catch(e){}
  DD.shake = 1;
}

function ddCrater(x, y){
  DD.craters.push({ x, y, r:0, max:26+Math.random()*18, t:0 });
  for(let i=0;i<12;i++)
    DD.debris.push({ x, y, vx:(Math.random()-0.5)*260, vy:-60-Math.random()*200,
                     r:1.6+Math.random()*3.4, t:0, c:'#c9a882' });
}

function ddBeatStart(k){
  const A = DD.a, B = DD.b;
  if(k === 'lock'){ ddExchange(A,B,false); ddExchange(B,A,false); }
  if(k === 'fall'){ ddExchange(A,B,true); ddExchange(B,A,false); }
  if(k === 'burn'){ A.breath = 1.4; B.breath = 1.4; ddExchange(A,B,false); ddExchange(B,A,false); }
  if(k === 'slam'){
    ddExchange(A,B,true); ddExchange(B,A,true);
    ddSmash(A.x); ddSmash(B.x);
    ddCrater(A.x, A.y + 70); ddCrater(B.x, B.y + 70);
  }
  if(k === 'struggle'){ A.breath = 3.0; B.breath = 3.0; }
  if(k === 'finish'){
    /* whoever is further ahead on the struggle finishes it */
    const win = DD.join < 0.5 ? A : B;
    const lose = win === A ? B : A;
    win.breath = 2.4;
    lose.hp = Math.max(0, lose.hp - 40);
    DD.winner = win;
    DD.shake = 1.2; DD.flash = 1;
    ddSmash(lose.x); ddCrater(lose.x, lose.y + 50);
    if(typeof log === 'function')
      log(`${win.name} put ${lose.name} into the ground. ${win.el.cry}`, 'bad', 'farm');
    try{ sfx('quake'); }catch(e){}
  }
}

function ddTick(dt){
  if(!DD || DD.over) return;
  DD.t += dt; DD.bt += dt;
  DD.fade = Math.min(1, DD.fade + dt*2);
  DD.shake = Math.max(0, DD.shake - dt*2.4);
  DD.flash = Math.max(0, DD.flash - dt*2.2);
  DD.a.hurt = Math.max(0, DD.a.hurt - dt);
  DD.b.hurt = Math.max(0, DD.b.hurt - dt);
  DD.a.breath = Math.max(0, DD.a.breath - dt);
  DD.b.breath = Math.max(0, DD.b.breath - dt);

  /* the struggle join creeps toward whoever is weaker */
  if(DD_BEATS[DD.bi].k === 'struggle'){
    /* The join has to be a contest, not a ramp. Drift alone made the
       stronger dragon win every single time across 12 fights — measured —
       which is not a fight, it is an announcement. The random walk is
       scaled to be the same order as the drift over a three second
       struggle, so the favourite is usually but not reliably ahead, and
       damage already taken carries real weight. */
    const edge = (DD.a.power - DD.b.power)/300 + (DD.a.hp - DD.b.hp)/700;
    DD.join = Math.max(0.12, Math.min(0.88,
      DD.join - edge*dt*1.8 + (Math.random()-0.5)*dt*3.4));
  }

  ddPositions(dt);

  DD.debris.forEach(d=>{ d.t += dt; d.x += d.vx*dt; d.y += d.vy*dt; d.vy += 420*dt; });
  DD.debris = DD.debris.filter(d=>d.t < 1.6);
  DD.craters.forEach(c=>{ c.t += dt; c.r = Math.min(c.max, c.r + dt*90); });
  if(DD.peaks && typeof tickPeaks === 'function'){ try{ tickPeaks(DD.peaks, dt); }catch(e){} }

  if(DD.bt >= DD_BEATS[DD.bi].t){
    DD.bt = 0; DD.bi++;
    if(DD.bi >= DD_BEATS.length){ ddEnd(); return; }
    ddBeatStart(DD_BEATS[DD.bi].k);
  }
}

function ddEnd(){
  const win = DD.winner || (DD.a.hp >= DD.b.hp ? DD.a : DD.b);
  const lose = win === DD.a ? DD.b : DD.a;
  const favourite = DD.a.power >= DD.b.power ? DD.a : DD.b;
  DD.over = true;
  const g = document.getElementById('ddlay'); if(g) g.remove();
  if(typeof log === 'function'){
    log(`${win.name} took it. ${lose.name} went off north low and slow.`, '', 'farm');
    if(win !== favourite)
      log(`${favourite.name} was the stronger on paper. That is not always how it goes.`, '', 'farm');
  }
  if(DD.smashed && typeof log === 'function')
    log(`${DD.smashed} of the peaks came down while they were at it.`, '', 'farm');
  /* watching two wyrms go at it over your land is worth something */
  if(typeof S.fame === 'number') S.fame = Math.min(100, S.fame + 3);
  if(typeof toast === 'function') toast(`${win.name} wins`, 'gold');
  if(typeof render === 'function') try{ render(); }catch(e){}
  if(typeof G.save === 'function') G.save();
}

/* ---------- drawing ---------- */
function wyrmBody(w, op){
  const S1 = w.skin;
  const SEGS = Math.round(22 * w.len), SPACING = 8;
  const pts = [];
  let acc = 0;
  if(!w.trail.length) return '';
  pts.push({ p:w.trail[0], i:0 });
  for(let j=1; j<w.trail.length && pts.length < SEGS; j++){
    acc += Math.hypot(w.trail[j].x - w.trail[j-1].x, w.trail[j].y - w.trail[j-1].y);
    if(acc >= SPACING){ acc = 0; pts.push({ p:w.trail[j], i:pts.length }); }
  }
  pts.reverse();
  let s = `<g opacity="${op.toFixed(2)}">`;
  pts.forEach(({p,i})=>{
    const f = 1 - i/SEGS;
    const r = (4.6 + f*f*10) * w.len;
    s += `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(r+1.6)}" fill="#120d08" opacity=".5"/>`;
    s += `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(r)}" fill="${S1.body}"/>`;
    s += `<circle cx="${n(p.x-r*0.26)}" cy="${n(p.y-r*0.3)}" r="${n(r*0.56)}" fill="${S1.lit}" opacity=".75"/>`;
    if(i % 2 === 0 && i < SEGS-2)
      s += `<path d="M${n(p.x)} ${n(p.y-r*0.9)} l${n(-r*0.5)} ${n(-r*0.9)} l${n(r)} ${n(r*0.25)} Z"
        fill="${S1.mane}" opacity=".9"/>`;
  });
  /* the head, at the front of the trail */
  const h = w.trail[0];
  const hr = 9*w.len;
  const face = w.side > 0 ? -1 : 1;
  s += `<g transform="translate(${n(h.x)},${n(h.y)}) scale(${face},1)">`;
  s += `<ellipse cx="0" cy="0" rx="${n(hr*1.25)}" ry="${n(hr*0.8)}" fill="${S1.body}"/>`;
  s += `<ellipse cx="${n(hr*0.9)}" cy="${n(hr*0.16)}" rx="${n(hr*0.7)}" ry="${n(hr*0.42)}" fill="${S1.deep}"/>`;
  s += `<path d="M${n(-hr*0.3)} ${n(-hr*0.55)} l${n(-hr*0.8)} ${n(-hr*1.1)} l${n(hr*0.95)} ${n(hr*0.3)} Z"
    fill="${S1.horn}"/>`;
  s += `<circle cx="${n(hr*0.42)}" cy="${n(-hr*0.24)}" r="${n(hr*0.17)}" fill="#1a1208"/>`;
  s += `<circle cx="${n(hr*0.46)}" cy="${n(-hr*0.28)}" r="${n(hr*0.06)}" fill="${w.el.c2}"/>`;
  if(w.hurt > 0)
    s += `<ellipse cx="0" cy="0" rx="${n(hr*1.4)}" ry="${n(hr*0.95)}" fill="#ff4a3a"
      opacity="${(0.5*w.hurt).toFixed(2)}"/>`;
  s += `</g>`;
  /* wings, beating */
  const beat = Math.sin(DD.t*7 + (w.side))*0.5 + 0.5;
  [1,-1].forEach(sgn=>{
    const wy = h.y + sgn*2;
    s += `<path d="M${n(h.x)} ${n(wy)}
      q${n(-face*34*w.len)} ${n(sgn*(14+beat*26)*w.len)} ${n(-face*58*w.len)} ${n(sgn*(4+beat*10)*w.len)}
      q${n(face*20*w.len)} ${n(sgn*10*w.len)} ${n(face*58*w.len)} ${n(-sgn*2)} Z"
      fill="${S1.deep}" opacity=".85"/>`;
  });
  s += `</g>`;
  return s;
}

function breathCone(w, tx, ty, k){
  if(k <= 0) return '';
  const h = w.trail[0]; if(!h) return '';
  const ang = Math.atan2(ty - h.y, tx - h.x);
  const len = Math.hypot(tx - h.x, ty - h.y);
  const spread = 0.22 + 0.05*Math.sin(DD.t*20);
  const p1x = h.x + Math.cos(ang - spread)*len, p1y = h.y + Math.sin(ang - spread)*len;
  const p2x = h.x + Math.cos(ang + spread)*len, p2y = h.y + Math.sin(ang + spread)*len;
  let s = `<path d="M${n(h.x)} ${n(h.y)} L${n(p1x)} ${n(p1y)} L${n(p2x)} ${n(p2y)} Z"
    fill="${w.el.c}" opacity="${(0.5*Math.min(1,k)).toFixed(2)}"/>`;
  s += `<path d="M${n(h.x)} ${n(h.y)} L${n(h.x+Math.cos(ang-spread*0.5)*len)} ${n(h.y+Math.sin(ang-spread*0.5)*len)}
    L${n(h.x+Math.cos(ang+spread*0.5)*len)} ${n(h.y+Math.sin(ang+spread*0.5)*len)} Z"
    fill="${w.el.c2}" opacity="${(0.55*Math.min(1,k)).toFixed(2)}"/>`;
  for(let i=0;i<5;i++){
    const t = ((DD.t*2.2 + i*0.2) % 1);
    const px = h.x + Math.cos(ang)*len*t, py = h.y + Math.sin(ang)*len*t;
    s += `<circle cx="${n(px + (Math.random()-0.5)*10)}" cy="${n(py + (Math.random()-0.5)*10)}"
      r="${n(2+t*5)}" fill="${w.el.c2}" opacity="${(0.5*(1-t)).toFixed(2)}"/>`;
  }
  return s;
}

function ddPaint(){
  if(!DD || DD.over) return;
  let g = document.getElementById('ddlay');
  if(!g){
    const fg = document.getElementById('fg'); if(!fg) return;
    g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id = 'ddlay'; g.setAttribute('pointer-events','none');
    fg.appendChild(g);
  }
  const beat = DD_BEATS[DD.bi].k;
  const sh = DD.shake;
  const ox = (Math.random()-0.5)*14*sh, oy = (Math.random()-0.5)*10*sh;
  let s = `<g transform="translate(${n(ox)},${n(oy)})">`;

  /* the same backdrop the champions get */
  if(DD.arena && typeof arenaArt === 'function'){
    try{ s += arenaArt(DD.arena, DD.fade); }catch(e){}
  }
  /* the skyline, with whatever has already come down in it */
  if(DD.peaks && typeof peaksArt === 'function' && DD.arena){
    try{ s += peaksArt(DD.peaks, DD.arena); }catch(e){}
  }
  /* craters stay */
  DD.craters.forEach(c=>{
    s += `<ellipse cx="${n(c.x)}" cy="${n(c.y)}" rx="${n(c.r)}" ry="${n(c.r*0.45)}"
      fill="#1a1208" opacity=".55"/>`;
    s += `<ellipse cx="${n(c.x)}" cy="${n(c.y-2)}" rx="${n(c.r*0.7)}" ry="${n(c.r*0.3)}"
      fill="#3a2a18" opacity=".5"/>`;
  });

  s += wyrmBody(DD.a, DD.fade);
  s += wyrmBody(DD.b, DD.fade);

  /* breath */
  if(beat === 'struggle' || beat === 'finish'){
    const mx = DD.a.x + (DD.b.x - DD.a.x)*DD.join;
    const my = (DD.a.y + DD.b.y)/2;
    s += breathCone(DD.a, mx, my, DD.a.breath);
    s += breathCone(DD.b, mx, my, DD.b.breath);
    /* the ball where they meet */
    const r = 16 + Math.sin(DD.t*18)*4;
    s += `<circle cx="${n(mx)}" cy="${n(my)}" r="${n(r*1.7)}" fill="#fff" opacity=".18"/>`;
    s += `<circle cx="${n(mx)}" cy="${n(my)}" r="${n(r)}" fill="#fff" opacity=".85"/>`;
    for(let i=0;i<8;i++){
      const a = DD.t*3 + i*0.785;
      s += `<line x1="${n(mx)}" y1="${n(my)}" x2="${n(mx+Math.cos(a)*r*2.4)}"
        y2="${n(my+Math.sin(a)*r*2.4)}" stroke="#fff" stroke-width="1.6" opacity=".4"/>`;
    }
  } else if(beat === 'burn'){
    s += breathCone(DD.a, DD.b.x, DD.b.y, DD.a.breath);
    s += breathCone(DD.b, DD.a.x, DD.a.y, DD.b.breath);
  }

  /* debris */
  DD.debris.forEach(d=>{
    s += `<rect x="${n(d.x)}" y="${n(d.y)}" width="${n(d.r*2)}" height="${n(d.r*1.6)}"
      fill="${d.c}" opacity="${(1-d.t/1.6).toFixed(2)}"
      transform="rotate(${n(d.t*220)} ${n(d.x)} ${n(d.y)})"/>`;
  });

  /* health bars, so the power difference is legible while it happens */
  const barW = WPX*0.24;
  [[DD.a, WPX*0.10],[DD.b, WPX*0.66]].forEach(([w,bx])=>{
    const by = HPX*0.06;
    s += `<rect x="${n(bx)}" y="${n(by)}" width="${n(barW)}" height="9" rx="4" fill="#0d1410" opacity=".7"/>`;
    s += `<rect x="${n(bx)}" y="${n(by)}" width="${n(barW*w.hp/100)}" height="9" rx="4" fill="${w.el.c}"/>`;
    s += `<text x="${n(bx)}" y="${n(by-4)}" fill="#e8f0e4" font-size="11" opacity=".9"
      style="font-family:inherit">${w.name} · ${w.el.n} · ${w.power}</text>`;
  });

  if(DD.flash > 0)
    s += `<rect x="${n(-T*2)}" y="${n(-T*2)}" width="${n(WPX+T*4)}" height="${n(HPX+T*4)}"
      fill="#fff" opacity="${(0.5*DD.flash).toFixed(2)}"/>`;
  s += `</g>`;
  g.innerHTML = s;
}

/* ---------- on the frame ---------- */
if(typeof tickPeople === 'function'){
  const _tickDD = tickPeople;
  tickPeople = function(dt){
    const r = _tickDD.apply(this, arguments);
    try{ if(dragonDuelOn()){ ddTick(typeof dt === 'number' ? dt : 1/30); ddPaint(); } }catch(e){}
    return r;
  };
}

/* the farm must be hidden for this the same way it is for the champions */
if(typeof sceneRunning === 'function'){
  const _sceneBase = sceneRunning;
  sceneRunning = function(){
    if(dragonDuelOn()) return 'ddlay';
    return _sceneBase.apply(this, arguments);
  };
}
if(typeof FARM_LAYERS !== 'undefined' && FARM_LAYERS.indexOf('duellay') < 0)
  FARM_LAYERS.push('duellay');

/* the button opens the choice */
if(typeof syncWorldButtons === 'function'){
  const _syncDD = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncDD.apply(this, arguments);
    try{
      const d = document.getElementById('duelbtn');
      if(d){
        d.onclick = ()=>G.openFightPicker();
        d.setAttribute('data-tip','<b>A fight over your land</b>Two champions, or two dragons.');
      }
    }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.dragonDuelAudit2 = function(){
  if(!DD) return { running:false, note:'no dragon duel has been called' };
  return {
    running: dragonDuelOn(),
    beat: DD_BEATS[DD.bi] ? DD_BEATS[DD.bi].k : 'done',
    beatNumber: DD.bi + 1 + ' of ' + DD_BEATS.length,
    a: { name:DD.a.name, elem:DD.a.elem, temper:DD.a.temper.id,
         power:DD.a.power, hp:Math.round(DD.a.hp), len:+DD.a.len.toFixed(2) },
    b: { name:DD.b.name, elem:DD.b.elem, temper:DD.b.temper.id,
         power:DD.b.power, hp:Math.round(DD.b.hp), len:+DD.b.len.toFixed(2) },
    strongerOnPaper: (DD.a.power >= DD.b.power ? DD.a : DD.b).name,
    struggleJoin: +DD.join.toFixed(2),
    mountainsBroughtDown: DD.smashed,
    farmBuildingsHarmed: 0,
    peaksStanding: DD.peaks ? DD.peaks.peaks.filter(p=>p.state==='intact').length : 'no peaks',
    cratersLeft: DD.craters.length,
    debrisInFlight: DD.debris.length,
    winner: DD.winner ? DD.winner.name : null,
  };
};
