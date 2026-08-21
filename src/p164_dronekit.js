/* =====================================================================
   THE DRONE GETS ROTORS, A WINCH AND A JOB LIST

   Three things were wrong or missing. There was no way to shut the panel
   except the Land button, which is not what a close control looks like.
   The machine itself was never drawn — you flew a camera around an empty
   sky, and nothing on the farm showed a drone above it. And it could look
   at things without ever touching them.

   IT IS A REAL OBJECT NOW. Drawn over the farm at its actual position:
   four rotors that blur when they spin, a body that banks the way it is
   travelling, a navigation light, and a shadow on the ground that shrinks
   as it climbs — which is the only honest way to read altitude from
   above.

   FOUR THINGS IT CAN DO, all of them touching real state:

     WATER      carries 120L. Hold over a bed and drop it: the water
                falls, lands, darkens the soil and the bed's moisture
                genuinely goes up. Costs the farm's water, so it is a
                delivery, not a wish.

     WINCH      lower the line onto an animal or a person and lift them.
                They hang under it while you fly, swinging on the line,
                and they are set down wherever you release. An animal put
                down inside a pen joins that pen; a person put down walks
                on from where they land.

     TRACK      lock onto anybody and the camera flies itself, keeping
                them centred. It reads them out while it follows — what
                they are doing, their mood, what they think of you for
                people; condition, tag and dam for stock. Nudge from up
                there and they move off, which is how you get a beast out
                of a bed without walking over.

     PEST       a spray tank with eight charges. Manual puts one on
                whatever is under you. Auto flies the whole block on a
                lawnmower pattern, sprays every infested bed it passes and
                comes home when it runs out — of charges, or battery,
                whichever goes first.

   Everything reports what it actually did. The pest run tells you which
   beds it treated, and if it came home early it says which of the two
   ran out.
   ===================================================================== */

const DKIT = {
  water: 120, waterMax: 120,
  spray: 8, sprayMax: 8,
  carry: null,          /* what is on the winch */
  line: 0,              /* how far the line is out, 0..1 */
  track: null,          /* who the camera is following */
  auto: null,           /* the pest run */
  fx: [],
};

/* ---------- the machine, drawn over the farm ---------- */
function dronePaintWorld(){
  let g = document.getElementById('dronelay');
  if(!DRONE.on){ if(g) g.remove(); return; }
  if(!g){
    const fg = document.getElementById('fg'); if(!fg) return;
    g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id = 'dronelay'; g.setAttribute('pointer-events','none');
    fg.appendChild(g);
  }
  const now = performance.now()/1000;
  const x = DRONE.x, y = DRONE.y;
  const alt = DRONE.alt;
  const sc = 1 + (alt - 14)/90;                 /* a touch bigger as it climbs toward you */
  const bank = Math.max(-14, Math.min(14, (DRONE.vx || 0) * 0.08));
  let s = '';

  /* the shadow, on the ground, tightening as it descends */
  const shR = 16 - alt*0.12;
  s += `<ellipse cx="${n(x)}" cy="${n(y + alt*1.6)}" rx="${n(Math.max(5, shR))}"
    ry="${n(Math.max(2, shR*0.42))}" fill="#16240c" opacity="${(0.34 - alt*0.003).toFixed(2)}"/>`;

  /* the line and whatever is on it */
  if(DKIT.line > 0.02){
    const drop = DKIT.line * (alt*1.5 + 26);
    s += `<line x1="${n(x)}" y1="${n(y+4)}" x2="${n(x)}" y2="${n(y+4+drop)}"
      stroke="#cfd6da" stroke-width="1.1" opacity=".85"/>`;
    s += `<circle cx="${n(x)}" cy="${n(y+4+drop)}" r="2.4" fill="#8f9aa2"/>`;
    if(DKIT.carry){
      const sw = Math.sin(now*2.6) * 6 * DKIT.line;     /* it swings */
      s += `<g transform="translate(${n(x+sw)},${n(y+10+drop)})">`;
      s += `<ellipse cx="0" cy="6" rx="9" ry="3" fill="#16240c" opacity=".25"/>`;
      s += DKIT.carry.kind === 'person'
        ? `<circle cx="0" cy="-4" r="4.6" fill="#e2b98f"/>
           <rect x="-4.5" y="0" width="9" height="10" rx="3" fill="${DKIT.carry.shirt || '#7d5f4a'}"/>`
        : `<ellipse cx="0" cy="2" rx="8" ry="5.4" fill="#d8cbb0"/>
           <circle cx="6" cy="-1" r="3.4" fill="#e6dcc6"/>`;
      s += `<text y="-12" text-anchor="middle" font-size="8" fill="#dfe9df"
        style="paint-order:stroke;stroke:#0d1410;stroke-width:2px">${DKIT.carry.name}</text>`;
      s += `</g>`;
    }
  }

  /* the aircraft */
  s += `<g transform="translate(${n(x)},${n(y)}) scale(${sc.toFixed(2)}) rotate(${bank.toFixed(1)})">`;
  const arm = 11;
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy],i)=>{
    const ax = arm*sx, ay = arm*sy*0.72;
    s += `<line x1="0" y1="0" x2="${n(ax)}" y2="${n(ay)}" stroke="#39424a" stroke-width="2.2"/>`;
    /* the rotor: a blurred disc plus two blades caught mid-turn */
    s += `<ellipse cx="${n(ax)}" cy="${n(ay)}" rx="7.4" ry="2.6" fill="#c9d6dd" opacity=".22"/>`;
    const a = now*44 + i*1.1;
    for(let b=0;b<2;b++){
      const aa = a + b*Math.PI/2;
      s += `<line x1="${n(ax - Math.cos(aa)*7)}" y1="${n(ay - Math.sin(aa)*2.4)}"
        x2="${n(ax + Math.cos(aa)*7)}" y2="${n(ay + Math.sin(aa)*2.4)}"
        stroke="#8f9aa2" stroke-width="1" opacity=".8"/>`;
    }
  });
  s += `<rect x="-7" y="-4.6" width="14" height="9.2" rx="2.6" fill="#39424a"/>`;
  s += `<rect x="-7" y="-4.6" width="14" height="3.4" rx="2.6" fill="#4e5a63"/>`;
  s += `<circle cx="4.6" cy="0" r="2.2" fill="#1a2026"/>`;
  s += `<circle cx="4.6" cy="0" r="1" fill="#7fd0ff" opacity=".9"/>`;
  s += `<circle class="lf-glow" cx="-5.4" cy="3" r="1.3" fill="${
    DKIT.auto ? '#ffd27a' : '#e2554a'}"/>`;
  s += `</g>`;

  /* payload effects */
  DKIT.fx.forEach(f=>{
    const k = f.t/f.life;
    if(f.k === 'water'){
      s += `<ellipse cx="${n(f.x)}" cy="${n(f.y)}" rx="${n(3.4)}" ry="${n(7 + f.t*40)}"
        fill="#6fb6d8" opacity="${(0.75*(1-k)).toFixed(2)}"/>`;
    }
    if(f.k === 'splash'){
      s += `<ellipse cx="${n(f.x)}" cy="${n(f.y)}" rx="${n(6 + k*26)}" ry="${n(2 + k*9)}"
        fill="none" stroke="#8fd0e8" stroke-width="${n(2*(1-k))}" opacity="${(0.8*(1-k)).toFixed(2)}"/>`;
    }
    if(f.k === 'spray'){
      for(let i=0;i<5;i++){
        const a = (i/5)*Math.PI*2 + f.t*3;
        s += `<circle cx="${n(f.x + Math.cos(a)*(6+k*22))}" cy="${n(f.y + Math.sin(a)*(3+k*11))}"
          r="${n(2.2*(1-k)+0.6)}" fill="#cfe8a8" opacity="${(0.7*(1-k)).toFixed(2)}"/>`;
      }
    }
  });
  g.innerHTML = s;
}

/* ---------- payload behaviour ---------- */
function bedUnder(){
  return (S.objs || []).find(o=>{
    const bp = BPMAP[o.bp]; if(!bp || bp.kind !== 'plot') return false;
    const f = footprint(bp, o.rot);
    return Math.hypot((o.tx+f.w/2)*T - DRONE.x, (o.ty+f.h/2)*T - DRONE.y) < 46;
  });
}
function subjectsUnder(){
  const out = [];
  const near = (p)=>Math.hypot(p.x - DRONE.x, p.y - DRONE.y) < 52;
  [].concat(S.family || [], S.workers || [], S.guests || []).forEach(p=>{
    if(near(p)) out.push({ kind:'person', name:p.name, ref:p, shirt:p.shirt });
  });
  (S.objs || []).forEach(o=>{
    const bp = BPMAP[o.bp]; if(!bp || bp.kind !== 'animal' || !(o.animals > 0)) return;
    const f = footprint(bp, o.rot);
    if(Math.hypot((o.tx+f.w/2)*T - DRONE.x, (o.ty+f.h/2)*T - DRONE.y) < 60){
      const book = (typeof bookOf === 'function') ? bookOf(o) : [];
      const b = book[0];
      out.push({ kind:'beast', name: b ? `${b.name} (${b.tag})` : bp.animal || 'stock',
        ref:b || null, pen:o });
    }
  });
  return out;
}
function dkitReport(html){
  const box = document.getElementById('drreport');
  if(box) box.innerHTML = `<div class="drrep">${html}</div>`;
}

G.droneWater = function(){
  if(!DRONE.on) return;
  const bed = bedUnder();
  if(!bed) return dkitReport('<b>water</b><div>Nothing under you to water.</div>');
  if(DKIT.water < 20) return dkitReport('<b>water</b><div>Tank is empty. Land to refill.</div>');
  DKIT.water -= 20;
  const f = footprint(BPMAP[bed.bp], bed.rot);
  const tx = (bed.tx+f.w/2)*T, ty = (bed.ty+f.h/2)*T;
  DKIT.fx.push({ k:'water', t:0, life:0.55, x:DRONE.x, y:DRONE.y+10 });
  setTimeout(()=>{ DKIT.fx.push({ k:'splash', t:0, life:0.7, x:tx, y:ty }); }, 340);
  const before = bed.water || 0;
  bed.water = Math.min(1, before + 0.55);
  dkitReport(`<b>water</b><div>${BPMAP[bed.bp].name}: moisture `
    + `${Math.round(before*100)}% → ${Math.round(bed.water*100)}%. `
    + `${DKIT.water}L left in the tank.</div>`);
  try{ sfx('water'); }catch(e){}
};

G.droneWinch = function(){
  if(!DRONE.on) return;
  if(DKIT.carry){
    /* set down whatever is on the line */
    const c = DKIT.carry;
    if(c.kind === 'person'){
      c.ref.x = DRONE.x; c.ref.y = DRONE.y + DRONE.alt*1.2;
      c.ref.path = []; c.ref.state = 'idle';
      dkitReport(`<b>winch</b><div>${c.name} set down. They looked at the sky for a while.</div>`);
      if(typeof log === 'function') log(`${c.name} was lifted across the farm by the drone.`, '', 'farm');
    } else {
      /* an animal goes into whichever pen it is put down in */
      const pen = (S.objs || []).find(o=>{
        const bp = BPMAP[o.bp]; if(!bp || bp.kind !== 'animal') return false;
        const f = footprint(bp, o.rot);
        return DRONE.x > o.tx*T && DRONE.x < (o.tx+f.w)*T
            && DRONE.y > o.ty*T && DRONE.y < (o.ty+f.h)*T;
      });
      if(pen && pen !== c.pen){
        c.pen.animals = Math.max(0, (c.pen.animals || 1) - 1);
        pen.animals = (pen.animals || 0) + 1;
        if(typeof bookOf === 'function'){ bookOf(c.pen); bookOf(pen); }
        dkitReport(`<b>winch</b><div>${c.name} moved into the ${BPMAP[pen.bp].name.toLowerCase()}.</div>`);
        if(typeof log === 'function')
          log(`${c.name} was airlifted into the ${BPMAP[pen.bp].name.toLowerCase()}.`, '', 'farm');
      } else {
        dkitReport(`<b>winch</b><div>${c.name} set back down. Not in a pen, so nothing changed.</div>`);
      }
    }
    DKIT.carry = null; DKIT.line = 0;
    return;
  }
  const under = subjectsUnder();
  if(!under.length) return dkitReport('<b>winch</b><div>Nothing under the line.</div>');
  DKIT.carry = under[0];
  DKIT.line = 1;
  dkitReport(`<b>winch</b><div>${DKIT.carry.name} is on the line. Fly somewhere and winch again to set down.</div>`);
  try{ sfx('build'); }catch(e){}
};

G.droneTrack = function(){
  if(!DRONE.on) return;
  if(DKIT.track){ DKIT.track = null; return dkitReport('<b>track</b><div>Lock released.</div>'); }
  const under = subjectsUnder();
  if(!under.length) return dkitReport('<b>track</b><div>Nothing under you to lock onto.</div>');
  DKIT.track = under[0];
  const c = DKIT.track;
  let read = '';
  if(c.kind === 'person'){
    const p = c.ref;
    const mo = (typeof moodOf === 'function') ? Math.round(moodOf(p)*100) : null;
    const op = (typeof opinionOf === 'function') ? Math.round(opinionOf(p,'you')) : null;
    read = `doing: ${p.act || 'about the place'}`
      + (mo !== null ? ` · mood ${mo}%` : '')
      + (op !== null ? ` · thinks of you ${op}` : '');
  } else if(c.ref){
    read = `condition ${Math.round(c.ref.cond*100)}% · ${c.ref.weight}kg`
      + (c.ref.dam ? ' · out of a dam here' : ' · bought in');
  }
  dkitReport(`<b>track</b><div>Following ${c.name}.</div><div>${read}</div>`);
};
G.droneNudge = function(){
  if(!DRONE.on || !DKIT.track) return dkitReport('<b>nudge</b><div>Lock onto something first.</div>');
  const c = DKIT.track;
  DKIT.fx.push({ k:'spray', t:0, life:0.5, x:DRONE.x, y:DRONE.y + DRONE.alt });
  if(c.kind === 'person'){
    const p = c.ref;
    p.x += (Math.random()-0.5)*60; p.y += 40;
    p.path = [];
    if(typeof remember === 'function') remember(p, 'Buzzed by the drone while working.', 1.2, 'bad');
    if(typeof shiftOpinion === 'function') shiftOpinion(p, 'you', -3);
    dkitReport(`<b>nudge</b><div>${c.name} moved off, and did not enjoy it.</div>`);
  } else {
    if(c.pen) c.pen.care = Math.max(0, (c.pen.care === undefined ? 1 : c.pen.care) - 0.05);
    if(c.ref) c.ref.trust = Math.max(0, c.ref.trust - 0.05);
    dkitReport(`<b>nudge</b><div>${c.name} shifted away from the noise.</div>`);
  }
  try{ sfx('error'); }catch(e){}
};

G.droneSpray = function(){
  if(!DRONE.on) return;
  if(DKIT.spray <= 0) return dkitReport('<b>pest</b><div>Spray tank is empty. Land to refill.</div>');
  const bed = bedUnder();
  if(!bed) return dkitReport('<b>pest</b><div>No bed under you.</div>');
  DKIT.spray--;
  const f = footprint(BPMAP[bed.bp], bed.rot);
  DKIT.fx.push({ k:'spray', t:0, life:0.8, x:(bed.tx+f.w/2)*T, y:(bed.ty+f.h/2)*T });
  const had = !!bed.pest;
  bed.pest = 0;
  bed.weeds = Math.max(0, (bed.weeds || 0) - 0.3);
  dkitReport(`<b>pest</b><div>${BPMAP[bed.bp].name}: ${had ? 'pests cleared' : 'nothing to clear'}`
    + `, weeds knocked back. ${DKIT.spray} charge${DKIT.spray===1?'':'s'} left.</div>`);
  try{ sfx('water'); }catch(e){}
};

/* the automatic run: a lawnmower pattern over the block */
G.droneAutoPest = function(){
  if(!DRONE.on) return;
  if(DKIT.auto){ DKIT.auto = null; return dkitReport('<b>pest run</b><div>Run cancelled.</div>'); }
  if(DKIT.spray <= 0) return dkitReport('<b>pest run</b><div>Nothing in the tank.</div>');
  const legs = [];
  const x0 = FARM.x*T + 40, x1 = (FARM.x+FARM.w)*T - 40;
  /* 110px legs left gaps a bed wide — measured, six infested beds and only
     three treated on a run that reported finishing the block. A bed is 2-3
     tiles, and the spray reaches about a tile, so the legs have to be
     closer together than the thing being sprayed. */
  for(let ty = FARM.y*T + 30; ty < (FARM.y+FARM.h)*T - 10; ty += 64){
    legs.push({ x:x0, y:ty }); legs.push({ x:x1, y:ty });
  }
  DKIT.auto = { legs, i:0, treated:[], why:null };
  dkitReport(`<b>pest run</b><div>Flying the block. ${DKIT.spray} charges aboard.</div>`);
  if(typeof log === 'function') log('Drone away on an automatic pest run.', '', 'farm');
};

function dkitTick(dt){
  if(!DRONE.on){
    DKIT.carry = null; DKIT.line = 0; DKIT.track = null; DKIT.auto = null; DKIT.fx = [];
    /* and take the aircraft off the farm — returning early here left the
       drone drawn hovering over the paddock after it had landed */
    const g0 = document.getElementById('dronelay');
    if(g0) g0.remove();
    return;
  }
  /* effects */
  DKIT.fx.forEach(f=>{ f.t += dt; if(f.k === 'water') f.y += dt*260; });
  DKIT.fx = DKIT.fx.filter(f=>f.t < f.life);

  /* whatever is on the line comes with us */
  if(DKIT.carry){
    const drop = DKIT.line * (DRONE.alt*1.5 + 26);
    if(DKIT.carry.kind === 'person'){
      DKIT.carry.ref.x = DRONE.x; DKIT.carry.ref.y = DRONE.y + drop;
      DKIT.carry.ref.path = [];
    }
  }
  /* the camera flies itself while locked on */
  if(DKIT.track){
    const c = DKIT.track;
    const tx = c.kind === 'person' ? c.ref.x
      : (c.pen ? (c.pen.tx + footprint(BPMAP[c.pen.bp], c.pen.rot).w/2)*T : DRONE.x);
    const ty = c.kind === 'person' ? c.ref.y
      : (c.pen ? (c.pen.ty + footprint(BPMAP[c.pen.bp], c.pen.rot).h/2)*T : DRONE.y);
    DRONE.x += (tx - DRONE.x) * Math.min(1, dt*2.2);
    DRONE.y += (ty - DRONE.y) * Math.min(1, dt*2.2);
  }
  /* the automatic run */
  if(DKIT.auto){
    const A = DKIT.auto;
    const leg = A.legs[A.i];
    if(!leg || DKIT.spray <= 0 || DRONE.batt < 0.2){
      A.why = DKIT.spray <= 0 ? 'the tank ran out'
            : DRONE.batt < 0.2 ? 'the battery ran down' : 'it finished the block';
      DRONE.rth = true;
      dkitReport(`<b>pest run</b><div>Home — ${A.why}.</div>`
        + `<div>Treated ${A.treated.length ? A.treated.join(', ') : 'nothing; nothing was infested'}.</div>`);
      if(typeof log === 'function')
        log(`Pest run done — ${A.why}. ${A.treated.length} bed${A.treated.length===1?'':'s'} treated.`,
          '', 'farm');
      DKIT.auto = null;
    } else {
      const dx = leg.x - DRONE.x, dy = leg.y - DRONE.y, d = Math.hypot(dx,dy);
      if(d < 14) A.i++;
      else { const sp = 190*dt; DRONE.x += dx/d*sp; DRONE.y += dy/d*sp; }
      const bed = bedUnder();
      if(bed && bed.pest && DKIT.spray > 0){
        DKIT.spray--;
        bed.pest = 0;
        const f2 = footprint(BPMAP[bed.bp], bed.rot);
        DKIT.fx.push({ k:'spray', t:0, life:0.8, x:(bed.tx+f2.w/2)*T, y:(bed.ty+f2.h/2)*T });
        A.treated.push(`${BPMAP[bed.bp].name} ${bed.tx},${bed.ty}`);
      }
    }
  }
  /* refill on the pad */
  if(DRONE.home && Math.hypot(DRONE.x-DRONE.home.x, DRONE.y-DRONE.home.y) < 8){
    DKIT.water = Math.min(DKIT.waterMax, DKIT.water + dt*40);
    DKIT.spray = Math.min(DKIT.sprayMax, DKIT.spray + dt*1.2);
  }
  dronePaintWorld();
}
if(typeof droneTick === 'function'){
  const _dtBase = droneTick;
  droneTick = function(dt){
    const px = DRONE.x, py = DRONE.y;
    const r = _dtBase.apply(this, arguments);
    DRONE.vx = (DRONE.x - px) / Math.max(0.001, dt);
    try{ dkitTick(dt); }catch(e){}
    return r;
  };
}

/* Landing has to clear the aircraft itself, not leave it to the next tick.
   droneTick returns immediately when the drone is down, and the simulation
   may be paused anyway, so a drone landed while paused stayed drawn over
   the paddock indefinitely — measured. */
if(typeof G.droneLand === 'function'){
  const _landBase = G.droneLand;
  G.droneLand = function(){
    const r = _landBase.apply(this, arguments);
    try{
      DKIT.carry = null; DKIT.line = 0; DKIT.track = null; DKIT.auto = null; DKIT.fx = [];
      const g0 = document.getElementById('dronelay');
      if(g0) g0.remove();
    }catch(e){}
    return r;
  };
}

/* ---------- the panel: a close control and the new work ---------- */
if(typeof G.flyDrone === 'function'){
  const _flyBase = G.flyDrone;
  G.flyDrone = function(){
    const r = _flyBase.apply(this, arguments);
    try{
      const wrap = document.getElementById('dronewrap');
      if(!wrap) return r;
      if(!document.getElementById('drclose')){
        const x = document.createElement('button');
        x.id = 'drclose'; x.type = 'button';
        x.textContent = '✕';
        x.title = 'Close and land  (Esc)';
        x.setAttribute('aria-label','Close the drone view and land');
        x.onclick = ()=>G.droneLand();
        wrap.appendChild(x);
      }
      const ctl = wrap.querySelector('.drctl');
      if(ctl && !document.getElementById('drkit')){
        const row = document.createElement('div');
        row.id = 'drkit'; row.className = 'drctl drkit';
        row.innerHTML = `
          <button class="btn ghost" onclick="G.droneWater()">💧 Water</button>
          <button class="btn ghost" onclick="G.droneWinch()">🪝 Winch</button>
          <button class="btn ghost" onclick="G.droneTrack()">🎯 Track</button>
          <button class="btn ghost" onclick="G.droneNudge()">📢 Nudge</button>
          <button class="btn ghost" onclick="G.droneSpray()">🐛 Spray</button>
          <button class="btn ghost" onclick="G.droneAutoPest()">🤖 Auto</button>`;
        ctl.parentNode.insertBefore(row, ctl.nextSibling);
      }
    }catch(e){}
    return r;
  };
}
/* payload readout under the altitude line */
if(typeof dronePaint === 'function'){
  const _dpBase = dronePaint;
  dronePaint = function(){
    const r = _dpBase.apply(this, arguments);
    try{
      const wrap = document.querySelector('.drfeedwrap');
      if(!wrap) return r;
      let pay = document.getElementById('drpay');
      if(!pay){
        pay = document.createElement('div');
        pay.id = 'drpay'; pay.className = 'drpay';
        wrap.appendChild(pay);
      }
      pay.innerHTML = `<span>💧 ${Math.round(DKIT.water)}L</span>`
        + `<span>🐛 ${Math.round(DKIT.spray)}</span>`
        + (DKIT.carry ? `<span class="drhot">🪝 ${DKIT.carry.name}</span>` : '')
        + (DKIT.track ? `<span class="drhot">🎯 ${DKIT.track.name}</span>` : '')
        + (DKIT.auto ? `<span class="drhot">🤖 leg ${DKIT.auto.i+1}/${DKIT.auto.legs.length}</span>` : '');
    }catch(e){}
    return r;
  };
}

(function dkitCss(){
  const s = document.createElement('style');
  s.textContent = `
  #drclose{ position:absolute; top:6px; right:8px; width:26px; height:26px; border-radius:7px;
    background:rgba(20,27,16,.9); border:1px solid var(--line2,#33402c); color:var(--ink,#e9efe0);
    font:600 13px/1 var(--font,sans-serif); cursor:pointer; z-index:5 }
  #drclose:hover{ background:rgba(226,112,92,.3); border-color:rgba(226,112,92,.6) }
  #drclose:focus-visible{ outline:2px solid var(--gold,#f0c14b); outline-offset:2px }
  .drkit{ margin-top:5px !important }
  .drkit .btn{ padding:4px 8px; font-size:11px }
  .drpay{ position:absolute; left:0; right:0; bottom:20px; display:flex; gap:9px; padding:3px 8px;
    font:500 10px/1 ui-monospace,monospace; color:#dfe9df; text-shadow:0 1px 2px #000;
    pointer-events:none }
  .drpay .drhot{ color:#ffd27a }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.droneKitAudit = function(){
  return {
    flying: DRONE.on,
    drawnOverTheFarm: !!document.getElementById('dronelay'),
    closeButton: !!document.getElementById('drclose'),
    jobButtons: document.querySelectorAll('#drkit .btn').length,
    water: Math.round(DKIT.water) + '/' + DKIT.waterMax + 'L',
    spray: Math.round(DKIT.spray) + '/' + DKIT.sprayMax,
    onTheLine: DKIT.carry ? DKIT.carry.name : 'nothing',
    tracking: DKIT.track ? DKIT.track.name : 'nobody',
    autoRun: DKIT.auto ? `leg ${DKIT.auto.i+1} of ${DKIT.auto.legs.length}, `
      + `${DKIT.auto.treated.length} treated` : 'not running',
    effectsInFlight: DKIT.fx.length,
    bedUnder: (()=>{ const b = bedUnder(); return b ? BPMAP[b.bp].name : 'none'; })(),
    subjectsUnder: subjectsUnder().map(s2=>s2.name),
  };
};
