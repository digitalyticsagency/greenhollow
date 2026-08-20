/* =====================================================================
   A DRONE, AND A REASON TO OWN ONE

   The camera posts already stream the live scene through a second view of
   the same SVG. That view is fixed to a post. This makes it yours to move.

   FLYING IT. Arrows to fly, W and S for altitude, Escape to land. The feed
   is first person and the framing widens as you climb, so at fifty metres
   you can see the whole block and at eight you can read a bed. The map
   below shows where you actually are, because a first-person view with no
   map is how you lose a drone.

   IT IS NOT A TOY ABOUT PHYSICS. Battery drains, faster when you climb,
   and the range is limited by the pad it launched from. Run the battery to
   fifteen percent and it turns for home on its own, whatever you are
   doing — which is the correct behaviour and also the most annoying, which
   is why it is correct.

   AND IT DOES WORK. Four jobs, each reading true farm state rather than
   inventing something:

     crops    every bed under you, flagging dry, weedy and pest-hit
     stock    a head count in the paddock, against the herd book, so a
              missing animal is named
     roofs    the condition of everything you have built out there
     thermal  after dark only: what is warm and outside the fence

   The scan reads whatever is within range of where the drone is hovering,
   so covering the whole farm means flying it. That is the difference
   between a readout and a survey.
   ===================================================================== */

(function droneBlueprint(){
  if(typeof BP === 'undefined' || BPMAP.drone_pad) return;
  const bp = { id:'drone_pad', name:'Drone and pad', art:'drone_pad', cat:'auto',
    w:1, h:1, cost:1600, lvl:3, kind:'bonus', charm:1,
    desc:'A landing pad and the machine that lives on it.',
    tip:'Fly it yourself. Crop, stock, roof and thermal surveys of whatever you fly over.' };
  BP.push(bp); BPMAP[bp.id] = bp;
})();
if(typeof ART === 'object' && !ART.drone_pad){
  ART.drone_pad = (w,h)=>{
    const cx = w/2, cy = h/2;
    let s = patch(w, h, '#9aa0a2', 29, 2);
    s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(Math.min(w,h)*0.36)}" fill="#2f3a40"/>`;
    s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(Math.min(w,h)*0.30)}" fill="none"
      stroke="#c9d6dd" stroke-width="1.4" stroke-dasharray="4 3"/>`;
    /* the machine itself, folded on the pad */
    s += `<rect x="${n(cx-5)}" y="${n(cy-3.5)}" width="10" height="7" rx="2" fill="#39424a"/>`;
    [[-7,-6],[7,-6],[-7,6],[7,6]].forEach(([dx,dy])=>{
      s += `<circle cx="${n(cx+dx)}" cy="${n(cy+dy)}" r="3.1" fill="none" stroke="#5c666e" stroke-width="1.1"/>`;
      s += `<circle cx="${n(cx+dx)}" cy="${n(cy+dy)}" r="0.9" fill="#8f9aa2"/>`;
    });
    s += `<circle class="lf-glow" cx="${n(cx+6)}" cy="${n(cy-4)}" r="1.1" fill="#7cf0c0"/>`;
    return s;
  };
}
function dronePads(){ return (S.objs || []).filter(o=>o.bp === 'drone_pad'); }

const DRONE = { on:false, x:0, y:0, alt:14, yaw:0, batt:1, home:null, rth:false, keys:{}, t:0 };
const DR_RANGE = 26 * 40;          /* how far from the pad it will go */
const DR_MAXALT = 60, DR_MINALT = 6;

function droneFov(){
  /* what the camera sees, in world pixels across, by height */
  return 150 + DRONE.alt * 12;
}
function dronePanel(){
  const fov = droneFov();
  const half = fov/2;
  const vb = `${n(DRONE.x-half)} ${n(DRONE.y-half*0.66)} ${n(fov)} ${n(fov*0.66)}`;
  const night = (typeof isNight === 'function') && isNight();
  const dist = DRONE.home ? Math.hypot(DRONE.x-DRONE.home.x, DRONE.y-DRONE.home.y) : 0;
  return `<div id="dronehud">
    <div class="drfeedwrap">
      <svg id="drfeed" class="drfeed ${night?'ir':''}" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">
        <use href="#bg"/><use href="#fg"/>
      </svg>
      <div class="drscan"></div>
      <div class="drcross"></div>
      <div class="drtop"><span class="drrec"></span>DRONE ${night?'· THERMAL':'· FPV'}</div>
      <div class="drbot">
        <span>ALT ${Math.round(DRONE.alt)}m</span>
        <span>${Math.round(dist/40)}m out / ${Math.round(DR_RANGE/40)}</span>
        <span class="${DRONE.batt<0.2?'drlow':''}">BATT ${Math.round(DRONE.batt*100)}%</span>
      </div>
      ${DRONE.rth ? `<div class="drrth">RETURNING TO PAD</div>` : ''}
    </div>
    <div class="drctl">
      <span class="muted">Arrows fly · W/S height · Esc land</span>
      <span style="flex:1"></span>
      <button class="btn ghost" onclick="G.droneScan('crops')">Crops</button>
      <button class="btn ghost" onclick="G.droneScan('stock')">Stock</button>
      <button class="btn ghost" onclick="G.droneScan('roofs')">Roofs</button>
      <button class="btn ghost" onclick="G.droneScan('thermal')">Thermal</button>
      <button class="btn" onclick="G.droneLand()">Land</button>
    </div>
    <div id="drreport"></div>
  </div>`;
}

G.flyDrone = function(){
  const pad = dronePads()[0];
  if(!pad) return toast && toast('No drone on the place','bad');
  if(DRONE.on) return;
  const f = footprint(BPMAP[pad.bp], pad.rot);
  DRONE.home = { x:(pad.tx+f.w/2)*T, y:(pad.ty+f.h/2)*T };
  DRONE.x = DRONE.home.x; DRONE.y = DRONE.home.y;
  DRONE.alt = 14; DRONE.on = true; DRONE.rth = false; DRONE.keys = {};
  if(DRONE.batt < 0.2) DRONE.batt = 1;
  if(typeof G.wakeTheWorld === 'function') G.wakeTheWorld();
  let host = document.getElementById('dronewrap');
  if(!host){
    host = document.createElement('div');
    host.id = 'dronewrap';
    document.body.appendChild(host);
  }
  host.innerHTML = dronePanel();
  document.addEventListener('keydown', droneKey);
  document.addEventListener('keyup', droneKeyUp);
  if(typeof log === 'function') log('Drone up.', '', 'farm');
};
G.droneLand = function(){
  DRONE.on = false;
  document.removeEventListener('keydown', droneKey);
  document.removeEventListener('keyup', droneKeyUp);
  const host = document.getElementById('dronewrap');
  if(host) host.remove();
  if(typeof log === 'function') log(`Drone down. Battery ${Math.round(DRONE.batt*100)}%.`, '', 'farm');
};
function droneKey(e){
  if(!DRONE.on) return;
  DRONE.keys[e.key] = 1;
  if(e.key === 'Escape') G.droneLand();
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','s','W','S'].includes(e.key)) e.preventDefault();
}
function droneKeyUp(e){ DRONE.keys[e.key] = 0; }

function droneTick(dt){
  if(!DRONE.on) return;
  const k = DRONE.keys;
  const speed = 210 * dt;
  let mx = 0, my = 0;
  if(k.ArrowLeft) mx -= 1;
  if(k.ArrowRight) mx += 1;
  if(k.ArrowUp) my -= 1;
  if(k.ArrowDown) my += 1;
  if(k.w || k.W) DRONE.alt = Math.min(DR_MAXALT, DRONE.alt + 26*dt);
  if(k.s || k.S) DRONE.alt = Math.max(DR_MINALT, DRONE.alt - 26*dt);

  /* it turns for home on its own when it has to, and you cannot argue */
  if(DRONE.batt < 0.15) DRONE.rth = true;
  if(DRONE.rth){
    const dx = DRONE.home.x - DRONE.x, dy = DRONE.home.y - DRONE.y;
    const d = Math.hypot(dx, dy);
    if(d < 6){
      DRONE.batt = Math.min(1, DRONE.batt + dt*0.06);       /* charging on the pad */
      if(DRONE.batt > 0.95){ DRONE.rth = false; }
      mx = my = 0;
    } else { mx = dx/d; my = dy/d; }
  }
  if(mx || my){
    const m = Math.hypot(mx, my) || 1;
    DRONE.x += mx/m*speed; DRONE.y += my/m*speed;
  }
  /* the pad keeps it on a leash */
  const dh = Math.hypot(DRONE.x-DRONE.home.x, DRONE.y-DRONE.home.y);
  if(dh > DR_RANGE){
    const s2 = DR_RANGE/dh;
    DRONE.x = DRONE.home.x + (DRONE.x-DRONE.home.x)*s2;
    DRONE.y = DRONE.home.y + (DRONE.y-DRONE.home.y)*s2;
    if(!DRONE.rth && typeof toast === 'function' && !DRONE.warned){
      DRONE.warned = 1; toast('At the limit of its range', 'bad');
    }
  }
  /* battery: hovering costs, climbing costs more */
  if(!(DRONE.rth && dh < 6))
    DRONE.batt = Math.max(0, DRONE.batt - dt * (0.0055 + DRONE.alt*0.00009));

  DRONE.t += dt;
  if(DRONE.t > 0.12){ DRONE.t = 0; dronePaint(); }
}
function dronePaint(){
  const svg = document.getElementById('drfeed');
  if(!svg) return;
  const fov = droneFov(), half = fov/2;
  svg.setAttribute('viewBox',
    `${n(DRONE.x-half)} ${n(DRONE.y-half*0.66)} ${n(fov)} ${n(fov*0.66)}`);
  const night = (typeof isNight === 'function') && isNight();
  svg.classList.toggle('ir', !!night);
  const bot = document.querySelector('#dronehud .drbot');
  if(bot){
    const dist = Math.hypot(DRONE.x-DRONE.home.x, DRONE.y-DRONE.home.y);
    bot.innerHTML = `<span>ALT ${Math.round(DRONE.alt)}m</span>
      <span>${Math.round(dist/40)}m out / ${Math.round(DR_RANGE/40)}</span>
      <span class="${DRONE.batt<0.2?'drlow':''}">BATT ${Math.round(DRONE.batt*100)}%</span>`;
  }
  const rth = document.querySelector('#dronehud .drrth');
  if(DRONE.rth && !rth){
    const w = document.querySelector('.drfeedwrap');
    if(w){ const d = document.createElement('div'); d.className = 'drrth';
      d.textContent = 'RETURNING TO PAD'; w.appendChild(d); }
  } else if(!DRONE.rth && rth) rth.remove();
}
if(typeof tickPeople === 'function'){
  const _tickDrone = tickPeople;
  tickPeople = function(dt){
    const r = _tickDrone.apply(this, arguments);
    try{ droneTick(typeof dt === 'number' ? dt : 1/30); }catch(e){}
    return r;
  };
}

/* ---------- the work ---------- */
function underDrone(){
  const reach = droneFov()*0.5;
  return (S.objs || []).filter(o=>{
    const bp = BPMAP[o.bp]; if(!bp) return false;
    const f = footprint(bp, o.rot);
    const ox = (o.tx+f.w/2)*T, oy = (o.ty+f.h/2)*T;
    return Math.hypot(ox-DRONE.x, oy-DRONE.y) < reach;
  });
}
G.droneScan = function(kind){
  if(!DRONE.on) return;
  const seen = underDrone();
  const out = [];
  if(kind === 'crops'){
    const beds = seen.filter(o=>(BPMAP[o.bp]||{}).kind === 'plot');
    if(!beds.length) out.push('No beds in shot.');
    beds.forEach(o=>{
      const bp = BPMAP[o.bp];
      const bad = [];
      if(!o.crop) bad.push('empty');
      else {
        if((o.water||0) < 0.35) bad.push('dry');
        if((o.weeds||0) > 0.5) bad.push('weedy');
        if(o.pest) bad.push('pests');
        if((o.fert===undefined?1:o.fert) < 0.45) bad.push('worn out');
      }
      out.push(`${bp.name} at ${o.tx},${o.ty} — ${bad.length ? bad.join(', ') : 'looks well'}`);
    });
  }
  if(kind === 'stock'){
    const pens = seen.filter(o=>(BPMAP[o.bp]||{}).kind === 'animal');
    if(!pens.length) out.push('No stock in shot.');
    pens.forEach(o=>{
      const bp = BPMAP[o.bp];
      const book = (typeof bookOf === 'function') ? bookOf(o) : [];
      /* The book reconciles itself the moment it is read, so a count can
         never disagree with it — checking for a mismatch here would always
         say fine. What the drone can actually tell you is who has gone
         recently, which is the question you are up there asking. */
      out.push(`${bp.name}: counted ${o.animals||0}`
        + (book.length ? `, book agrees` : ''));
      try{
        const recent = (herdState().sold || []).filter(x=>(S.day||1) - x.day <= 3);
        if(recent.length) out.push(`  off the books in the last three days: `
          + recent.map(x=>`${x.name} (${x.tag})`).join(', '));
      }catch(e){}
      if(book.length){
        const poor = book.filter(b=>b.cond < 0.5);
        if(poor.length) out.push(`  ${poor.map(b=>b.name+' ('+b.tag+')').join(', ')} in poor condition`);
      }
    });
  }
  if(kind === 'roofs'){
    const built = seen.filter(o=>['home','housing','process','shop','store','bonus','tourism']
      .includes((BPMAP[o.bp]||{}).kind));
    if(!built.length) out.push('Nothing built in shot.');
    built.forEach(o=>{
      const bp = BPMAP[o.bp];
      const t = (typeof tOf === 'function') ? tOf(o) : 0;
      out.push(`${bp.name} — Mk ${['I','II','III','IV'][t] || 'I'}`
        + (o.broken ? ', broken down' : '')
        + (o.staffed ? ', somebody in it' : ''));
    });
  }
  if(kind === 'thermal'){
    const night = (typeof isNight === 'function') && isNight();
    if(!night){ out.push('Thermal is no use in daylight. Come back after dark.'); }
    else {
      const reach = droneFov()*0.5;
      const warm = [];
      (typeof wildList === 'function' ? (wildList()||[]) : []).forEach(w=>{
        if(Math.hypot(w.x-DRONE.x, w.y-DRONE.y) < reach) warm.push(w.kind || 'something');
      });
      (typeof strayList === 'function' ? (strayList()||[]) : []).forEach(s=>{
        if(Math.hypot(s.x-DRONE.x, s.y-DRONE.y) < reach) warm.push((s.kind||'stock') + ' out of its pen');
      });
      [].concat(S.family||[], S.workers||[]).forEach(p=>{
        if(Math.hypot(p.x-DRONE.x, p.y-DRONE.y) < reach) warm.push(p.name);
      });
      out.push(warm.length ? 'Warm: ' + warm.join(', ') : 'Nothing warm out here.');
    }
  }
  const box = document.getElementById('drreport');
  if(box) box.innerHTML = `<div class="drrep"><b>${kind}</b>${
    out.map(l=>`<div>${l}</div>`).join('')}</div>`;
  if(typeof log === 'function' && out.length)
    log(`Drone ${kind} survey: ${out[0]}${out.length>1?` (+${out.length-1} more)`:''}`, '', 'farm');
  return out;
};

if(typeof syncWorldButtons === 'function'){
  const _syncDrone = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncDrone.apply(this, arguments);
    try{
      const host = document.getElementById('zoomctl');
      if(host && !document.getElementById('dronebtn')){
        const b = document.createElement('button');
        b.id = 'dronebtn'; b.textContent = '🛸';
        b.title = 'Fly the drone';
        b.setAttribute('data-tip','<b>The drone</b>Fly it yourself. Crop, stock, roof and thermal surveys.');
        b.onclick = ()=>G.flyDrone();
        host.insertBefore(b, host.firstChild);
      }
      const b2 = document.getElementById('dronebtn');
      if(b2) b2.style.display = dronePads().length ? '' : 'none';
    }catch(e){}
    return r;
  };
}

(function droneCss(){
  const s = document.createElement('style');
  s.textContent = `
  #dronebtn{ font-size:15px; line-height:1 }
  #dronewrap{ position:fixed; right:16px; bottom:16px; width:min(420px,42vw); z-index:70;
    background:rgba(13,20,16,.96); border:1px solid var(--line2,#33402c); border-radius:11px;
    padding:9px; box-shadow:0 10px 34px rgba(0,0,0,.5) }
  .drfeedwrap{ position:relative; border-radius:7px; overflow:hidden; background:#070b06;
    aspect-ratio:3/2 }
  .drfeed{ width:100%; height:100%; display:block; background:#0d1410 }
  .drfeed.ir{ filter:sepia(.7) hue-rotate(140deg) saturate(2.4) brightness(1.25) contrast(1.1) }
  .drscan{ position:absolute; inset:0; pointer-events:none;
    background:repeating-linear-gradient(rgba(255,255,255,.02) 0 1px,transparent 1px 4px);
    box-shadow:inset 0 0 16px rgba(0,0,0,.35) }
  .drcross{ position:absolute; left:50%; top:50%; width:26px; height:26px; margin:-13px 0 0 -13px;
    pointer-events:none; border:1px solid rgba(220,255,220,.5); border-radius:3px }
  .drcross::before,.drcross::after{ content:''; position:absolute; background:rgba(220,255,220,.5) }
  .drcross::before{ left:50%; top:-7px; width:1px; height:7px }
  .drcross::after{ top:50%; left:-7px; height:1px; width:7px }
  .drtop,.drbot{ position:absolute; left:0; right:0; display:flex; gap:8px; padding:5px 8px;
    font:500 10.5px/1 ui-monospace,monospace; letter-spacing:.06em; color:#dfe9df;
    text-shadow:0 1px 2px #000; pointer-events:none }
  .drtop{ top:0; align-items:center } .drbot{ bottom:0; justify-content:space-between }
  .drlow{ color:#e2705c }
  .drrec{ width:7px;height:7px;border-radius:50%;background:#e2554a;display:inline-block;
    animation:camblink 1.6s steps(1,end) infinite }
  .drrth{ position:absolute; left:50%; top:44%; transform:translateX(-50%);
    font:600 12px/1 ui-monospace,monospace; color:#ffd27a; letter-spacing:.1em;
    text-shadow:0 1px 3px #000; pointer-events:none }
  .drctl{ display:flex; gap:6px; align-items:center; margin-top:7px; flex-wrap:wrap; font-size:11.5px }
  .drctl .btn{ padding:4px 9px; font-size:11.5px }
  .drrep{ margin-top:7px; font-size:12px; line-height:1.5; max-height:130px; overflow:auto;
    border-top:1px solid var(--line2,#33402c); padding-top:6px }
  .drrep b{ display:block; text-transform:uppercase; letter-spacing:.1em; font-size:10.5px;
    opacity:.7; margin-bottom:3px }
  @media (prefers-reduced-motion: reduce){ .drrec{ animation:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.droneAudit = function(){
  return {
    pads: dronePads().length,
    flying: DRONE.on,
    at: DRONE.on ? `${Math.round(DRONE.x)},${Math.round(DRONE.y)}` : 'on the pad',
    altitude: Math.round(DRONE.alt) + 'm',
    fieldOfView: Math.round(droneFov()) + 'px across (' + (droneFov()/40).toFixed(1) + ' tiles)',
    battery: Math.round(DRONE.batt*100) + '%',
    range: Math.round(DR_RANGE/40) + ' tiles',
    distanceOut: DRONE.home ? Math.round(Math.hypot(DRONE.x-DRONE.home.x, DRONE.y-DRONE.home.y)/40) : 0,
    returningHome: DRONE.rth,
    inShot: DRONE.on ? underDrone().length : 0,
    jobs: ['crops','stock','roofs','thermal'],
  };
};
