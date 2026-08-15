/* =====================================================================
   IT STAYS HOME, AND PERFORMS WHEN ASKED

   Four things, and the second one reverses something I added last turn,
   so it is a switch rather than a deletion.

   1. THE RIDE BUTTON GETS A SWITCH, like the champions and the wildlife
      ones. Settings > Display, on by default, and it still only appears
      once you actually have a dragon.

   2. IT STAYS AT THE ROOST. Last turn I gave it patrol routes, soaring
      circles and hunting, which is a lot of movement across the farm
      while you are trying to look at something else. Homebound is the
      default now - it stays around its roost, settles on it, and behaves.
      The roaming is not thrown away: "Dragon roams the farm" turns it
      back on for anyone who wants a dragon crossing the sky all day.

      The things that must still win, win: it will always break off to
      raid stock if you leave it hungry, and it will always come when the
      bond is high enough. Homebound changes what it does when nothing is
      pressing, which is most of the time.

   3. CLICK THE ROOST AND IT PERFORMS. It rises off the perch, holds, and
      breathes - and the three cycle, so it is fire, then frost, then air,
      then fire again. Frost is new: a pale blue cone with crystals in it
      that leaves a rime on the ground for a moment.

   4. Each display costs it heat and buys a little regard, so showing it
      off is also how you get on terms with it.
   ===================================================================== */

/* ---------- 1 & 2. the switches ---------- */
(function roostSettings(){
  if(typeof SETTINGS === 'undefined') return;
  const add = (k,n,d,def)=>{
    if(SETTINGS.some(o=>o.k===k)) return;
    const i = SETTINGS.findIndex(o=>o.g==='Display');
    SETTINGS.splice(i<0?0:i+1, 0, {g:'Display', k, n, t:'bool', def, d});
  };
  add('rideBtn', 'Ride button',
      'Shows the dragon button by the zoom controls, for riding out. Only appears once you have a dragon.', true);
  add('dragonRoams', 'Dragon roams the farm',
      'Off, it stays around its roost. On, it patrols the fence, soars over the middle and hunts anything wild that turns up.', false);
})();

if(typeof syncWorldButtons === 'function'){
  const _syncRoost = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncRoost.apply(this, arguments);
    try{
      const b = document.getElementById('ridebtn');
      if(b) b.style.display = (S.dragon && SET('rideBtn')) ? '' : 'none';
    }catch(e){}
    return r;
  };
}

/* Homebound unless the switch says otherwise. This has to intercept the
   DECISION, not just the roaming: with a decent bond the mind chooses
   'follow' and the dragon trails you across the whole farm, which is why
   the first version of this still strayed 520px — barely different from
   roaming's 598px. Only the things that genuinely must win get through. */
if(typeof dragonDecide === 'function'){
  const _decideHome = dragonDecide;
  dragonDecide = function(){
    const base = _decideHome.apply(this, arguments);
    try{
      if(typeof SET === 'function' && SET('dragonRoams')) return base;
      /* raiding and being fed still win — a hungry dragon is a hungry
         dragon whatever the setting says */
      if(base && ['raid','feed','burn'].includes(base.mode)) return base;
      const spot = (typeof roostSpot === 'function') ? roostSpot() : null;
      if(!spot) return base;
      const m = dragonMind();
      if(m && m.pride > 0.75) return { mode:'show', x:spot.x + 26, y:spot.y - 40 };
      return { mode:'rest', x:spot.x, y:spot.y - 4 };
    }catch(e){}
    return base;
  };
}

/* ---------- 3. the display ---------- */
const SHOWS = ['fire','frost','air'];

G.roostShow = function(){
  const d = S.dragon;
  if(!d){ if(typeof toast==='function') toast('You have no dragon', 'bad'); return; }
  if(d.showT > 0) return;
  d.showIdx = ((d.showIdx === undefined) ? -1 : d.showIdx) + 1;
  d.showKind = SHOWS[d.showIdx % SHOWS.length];
  d.showT = 2.6;
  const m = dragonMind();
  if(m){ m.heat = Math.max(0, m.heat - 0.3); m.pride = Math.max(0, m.pride - 0.25); }
  d.bond = Math.min(1, d.bond + 0.006);
  if(typeof G.bang === 'function') try{ G.bang(d.showKind === 'frost' ? 'whoosh' : 'roar'); }catch(e){}
  if(typeof log === 'function')
    log(`${d.name} rose off the roost and let go a gout of ${d.showKind}.`, '', 'farm');
};

const SHOWCOL = {
  fire:  ['#ff5a1a','#ffa03a','#ffe07a'],
  frost: ['#4a86b8','#8fc4e0','#e0f4ff'],
  air:   ['#c8d8e4','#e4eef4','#ffffff'],
};

function showArt(d){
  if(!(d.showT > 0)) return '';
  const k = 1 - d.showT/2.6;
  /* rise for the first third, hold and breathe through the middle */
  const breath = Math.max(0, Math.min(1, (k - 0.30) / 0.55));
  if(breath <= 0) return '';
  const c = SHOWCOL[d.showKind] || SHOWCOL.fire;
  const reach = 105 * Math.sin(breath * Math.PI);
  if(reach < 3) return '';
  const x0 = -30, y0 = -28;
  const sp = 10 + 16*Math.sin(breath*Math.PI);
  const jet = (r,s0,col,op)=>`<path d="M${n(x0)} ${n(y0)}
    Q${n(x0-r*0.5)} ${n(y0-s0)} ${n(x0-r)} ${n(y0)}
    Q${n(x0-r*0.5)} ${n(y0+s0)} ${n(x0)} ${n(y0)} Z" fill="${col}" opacity="${op}"/>`;
  let s = `<g class="dshow">`;
  s += jet(reach, sp, c[0], 0.55);
  s += jet(reach*0.74, sp*0.66, c[1], 0.82);
  s += jet(reach*0.46, sp*0.4, c[2], 0.95);
  if(d.showKind === 'frost'){
    for(let i=0;i<7;i++){
      const fx = x0 - reach*(0.25+i*0.11), fy = y0 + (hash(i*3.1)-0.5)*sp*1.8;
      s += `<path d="M${n(fx-3)} ${n(fy)} L${n(fx+3)} ${n(fy)} M${n(fx)} ${n(fy-3)} L${n(fx)} ${n(fy+3)}
        M${n(fx-2)} ${n(fy-2)} L${n(fx+2)} ${n(fy+2)} M${n(fx-2)} ${n(fy+2)} L${n(fx+2)} ${n(fy-2)}"
        stroke="#eaf6ff" stroke-width="1.1" stroke-opacity=".9"/>`;
    }
    s += `<ellipse cx="${n(x0-reach*0.6)}" cy="6" rx="${n(reach*0.5)}" ry="7"
      fill="#dff0ff" opacity="${(0.35*(1-breath)).toFixed(2)}"/>`;
  }
  if(d.showKind === 'air'){
    for(let i=0;i<4;i++)
      s += `<ellipse cx="${n(x0-reach*(0.3+i*0.2))}" cy="${n(y0)}" rx="${n(5+i*4)}"
        ry="${n(sp*(0.6+i*0.25))}" fill="none" stroke="#ffffff"
        stroke-opacity="${(0.55-i*0.12).toFixed(2)}" stroke-width="1.7"/>`;
  }
  s += `</g>`;
  return s;
}

/* the rise, and the breath, drawn on the farm dragon */
if(typeof tickDragon === 'function'){
  const _tickShow = tickDragon;
  tickDragon = function(dt){
    const d = S.dragon;
    /* while it is performing it holds position above the roost rather
       than being steered by the mind */
    if(d && d.showT > 0){
      d.showT = Math.max(0, d.showT - dt);
      const k = 1 - d.showT/2.6;
      const spot = (typeof roostSpot === 'function') ? roostSpot() : null;
      if(spot){
        const rise = Math.min(1, k/0.30);
        d.x += (spot.x - d.x) * Math.min(1, dt*4);
        d.y += ((spot.y - 4 - rise*54) - d.y) * Math.min(1, dt*4);
      }
      d.state = k < 0.30 ? 'fly' : 'burn';
      d.wing = 1;
      d.beat = (d.beat||0) + dt*11;
      try{ paintDragon(); }catch(e){}
      try{
        const g = document.getElementById('dragonlay');
        const el = g && g.firstElementChild;
        if(el){
          let w = el.querySelector('.dshowwrap');
          if(!w){ w = document.createElementNS('http://www.w3.org/2000/svg','g');
            w.setAttribute('class','dshowwrap'); el.appendChild(w); }
          w.innerHTML = showArt(d);
        }
      }catch(e){}
      return;                       /* the mind does not get a say mid-show */
    }
    const r = _tickShow.apply(this, arguments);
    try{
      const w = document.querySelector('#dragonlay .dshowwrap');
      if(w && w.innerHTML) w.innerHTML = '';
    }catch(e){}
    return r;
  };
}

/* ---------- clicking the roost ---------- */
(function roostClick(){
  const wire = ()=>{
    if(typeof G.select !== 'function' && typeof sel === 'undefined') return;
    document.querySelectorAll('[data-o]').forEach(el=>{
      const id = +el.getAttribute('data-o');
      const o = (S.objs||[]).find(z=>z.id===id);
      if(!o || o.bp !== 'dragon_roost' || el.dataset.roostWired) return;
      el.dataset.roostWired = '1';
      el.style.cursor = 'pointer';
      el.addEventListener('click', ()=>{ if(S.dragon) G.roostShow(); });
    });
  };
  setInterval(()=>{ try{ wire(); }catch(e){} }, 1400);
})();

/* and a button on the roost's own panel, which is the discoverable way */
if(typeof inspHTML === 'function'){
  const _inspRoost = inspHTML;
  inspHTML = function(){
    const base = _inspRoost.apply(this, arguments);
    try{
      const o = (S.objs||[]).find(z=>z.id === sel);
      if(!o || o.bp !== 'dragon_roost') return base;
      if(!S.dragon) return base + `<div class="card"><div class="muted">No dragon yet — win
        dragon marks from the champions and call one down from the AI panel.</div></div>`;
      const nextKind = SHOWS[((S.dragon.showIdx === undefined ? -1 : S.dragon.showIdx)+1) % SHOWS.length];
      return base + `<div class="card">
        <div class="eyebrow">${S.dragon.name}</div>
        <div class="muted" style="margin-bottom:6px">It will rise off the perch and let go a gout of
        ${nextKind}. Each one settles it a little and it thinks better of you for the audience.</div>
        <button class="act primary full" onclick="G.roostShow()">Have it breathe ${nextKind}</button></div>`;
    }catch(e){}
    return base;
  };
}

/* ---------- handle ---------- */
G.roostAudit = function(){
  const d = S.dragon;
  return {
    rideButton: SET('rideBtn') ? 'on' : 'off',
    roams: SET('dragonRoams') ? 'on — patrols, soars and hunts' : 'off — stays at the roost',
    dragon: d ? d.name : 'none',
    state: d ? d.state : '—',
    performing: d && d.showT > 0 ? d.showKind : 'no',
    nextBreath: d ? SHOWS[((d.showIdx === undefined ? -1 : d.showIdx)+1) % SHOWS.length] : '—',
    cycle: SHOWS,
    howToTrigger: 'click the roost on the farm, or its panel button',
  };
};
