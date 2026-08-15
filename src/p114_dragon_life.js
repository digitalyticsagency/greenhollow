/* =====================================================================
   A DRAGON WITH SOMETHING TO DO, AND WINGS THAT WORK

   Three things.

   1. IT HAD NOWHERE TO GO. The mind from p108 decides between roost,
      food, showing off and sulking — all of which happen in one spot. A
      dragon that never leaves a ten metre circle does not read as alive
      however good its drives are. It now has places to be and reasons to
      go: a patrol of the fence line, long soaring circles when it is
      content, a perch on the tallest thing you own, a skim along the
      ground, and a genuine interest in any wildlife that turns up. It
      picks by mood, not by dice - a proud dragon patrols where it can be
      seen, a bored one goes hunting.

   2. THE WINGS WERE A METRONOME. `rotate(-16deg) to rotate(12deg)` on an
      alternating ease is a windscreen wiper. Real flapping is asymmetric:
      the downstroke is the fast one because it does the work, and the
      recovery upstroke is slower and folds the wing to cut drag. So the
      cycle is four keyframes with the power stroke taking a fifth of it,
      the membrane stretching as it drives down and folding on the way
      back up, and the body lifting on each beat rather than sliding along
      a flat line. The far wing runs the same cycle a hair behind the near
      one, which is what gives it depth.

   3. IT WILL BREATHE FIRE IF YOU ASK. Click it and it practises: a
      wind-up, a jet with three layers, and a scorch that fades. It costs
      it heat - which is one of its drives - so a dragon that has just
      shown off is calmer for a while, and one you never let breathe gets
      irritable and goes looking for something to burn.
   ===================================================================== */

/* ---------- 1. places to be ---------- */
function dragonRoam(){
  const d = S.dragon, m = dragonMind();
  if(!d || !m) return null;
  const bx = FARM.x*T, by = FARM.y*T, bw = FARM.w*T, bh = FARM.h*T;

  /* something wild on the land is more interesting than anything else */
  const wild = (S.wild || []).find(w=>!w.done);
  if(wild && m.hunger > 0.4)
    return { mode:'hunt', x:wild.x, y:wild.y - 30, say:'…' };

  /* proud: patrol the fence, where the whole valley can see it */
  if(m.pride > 0.5){
    const legs = [
      {x:bx+bw*0.1, y:by+bh*0.1}, {x:bx+bw*0.9, y:by+bh*0.15},
      {x:bx+bw*0.9, y:by+bh*0.85}, {x:bx+bw*0.15, y:by+bh*0.8},
    ];
    d.leg = (d.leg === undefined) ? 0 : d.leg;
    const t = legs[d.leg % legs.length];
    if(Math.hypot(t.x-d.x, t.y-d.y) < 40) d.leg++;
    return { mode:'patrol', x:t.x, y:t.y };
  }

  /* content: long slow circles over the middle */
  if(m.heat < 0.5 && m.hunger < 0.5){
    d.soar = (d.soar || 0) + 0.006;
    return { mode:'soar',
      x: bx + bw*0.5 + Math.cos(d.soar)*bw*0.32,
      y: by + bh*0.45 + Math.sin(d.soar)*bh*0.26 };
  }

  /* otherwise sit on the tallest thing on the farm and watch */
  const tall = (S.objs||[]).filter(o=>{
    const bp = BPMAP[o.bp];
    return bp && ['home','housing','hub','process','tourism'].includes(bp.kind);
  }).sort((a,b)=>(BPMAP[b.bp].cost||0)-(BPMAP[a.bp].cost||0))[0];
  if(tall){
    const f = footprint(BPMAP[tall.bp], tall.rot);
    return { mode:'perch', x:(tall.tx+f.w/2)*T, y:(tall.ty)*T - 6 };
  }
  return null;
}

if(typeof dragonDecide === 'function'){
  const _decideBase = dragonDecide;
  dragonDecide = function(){
    const base = _decideBase.apply(this, arguments);
    const d = S.dragon;
    /* the base handles the things that must win: burning off heat, eating,
       raiding, and being called. Anything that would have it idling at the
       roost is replaced with somewhere to actually be. */
    if(!base) return dragonRoam() || base;
    if(['circle','sulk'].includes(base.mode)){
      const roam = dragonRoam();
      if(roam) return roam;
    }
    return base;
  };
}

/* the new modes need speeds and an arrival behaviour */
if(typeof tickDragon === 'function'){
  const _tickBase = tickDragon;
  tickDragon = function(dt){
    const d = S.dragon;
    const r = _tickBase.apply(this, arguments);
    try{
      if(!d) return r;
      /* Anything that is not settled on something is flight. Keying this
         off state === 'fly' alone meant patrol, soar, hunt and raid all
         flew with the wings held rigid. */
      const grounded = ['rest','perch','sulk','feed','burn','land','show'];
      const m = dragonMind();
      d.wing = grounded.includes(d.state) ? 0 : 1;
      if(d.state === 'perch' && m) m.pride = Math.max(0, m.pride - dt*0.02);
      if(d.wing && m) m.heat = Math.min(1, m.heat + dt*0.008);
      if(d.state === 'hunt' && m) m.hunger = Math.max(0, m.hunger - dt*0.05);
      /* the body lifts on each wingbeat rather than sliding flat */
      d.beat = (d.beat || 0) + dt * (d.wing ? 11 : 0);
    }catch(e){}
    return r;
  };
}

/* dragonArt sets its flying class from `state === 'fly'`, so a dragon on
   patrol drew its wings rigid. Every flight state gets it. */
if(typeof dragonArt === 'function'){
  const _dragonArtBase = dragonArt;
  dragonArt = function(d){
    const grounded = ['rest','perch','sulk','feed','burn','land','show'];
    const flying = !grounded.includes(d.state);
    return _dragonArtBase.call(this, flying ? { ...d, state:'fly' } : d);
  };
}

/* ---------- 2. wings, and the body riding them ---------- */
if(typeof paintDragon === 'function'){
  const _paintBase = paintDragon;
  paintDragon = function(){
    const r = _paintBase.apply(this, arguments);
    try{
      const d = S.dragon; if(!d) return r;
      const g = document.getElementById('dragonlay');
      const el = g && g.firstElementChild;
      if(!el) return r;
      /* the lift, synced to the stroke: fast up on the downbeat, slow down */
      const lift = d.wing ? Math.sin(d.beat || 0) * 2.6 : 0;
      el.setAttribute('transform',
        `translate(${n(d.x)},${n(d.y + lift)}) scale(${d.dir},1)`);
      const body = el.querySelector('.dragon');
      if(body) body.classList.toggle('flying', !!d.wing);
    }catch(e){}
    return r;
  };
}

/* ---------- 3. click it and it breathes ---------- */
G.dragonFlame = function(){
  const d = S.dragon; if(!d) return;
  if(d.flameT > 0) return;
  d.flameT = 1.5;
  const m = dragonMind();
  if(m) m.heat = Math.max(0, m.heat - 0.35);
  d.bond = Math.min(1, d.bond + 0.004);
  if(typeof G.bang === 'function') try{ G.bang('roar'); }catch(e){}
  if(typeof log === 'function' && Math.random() < 0.4)
    log(`${d.name} let off a jet of flame, mostly to show it could.`, '', 'farm');
};

/* the flame lives on its own layer so it can outlive a state change */
function flameArt(d, k){
  /* k is 0..1 through the breath */
  const reach = 90 * Math.sin(Math.min(1, k*1.5) * Math.PI);
  if(reach < 2) return '';
  const w0 = 9 + 13*Math.sin(k*Math.PI);
  const x0 = -30, y0 = -28;
  const tip = x0 - reach;
  const p = (r, spread)=>`M${n(x0)} ${n(y0)} Q${n(x0-r*0.5)} ${n(y0-spread)} ${n(x0-r)} ${n(y0)}
    Q${n(x0-r*0.5)} ${n(y0+spread)} ${n(x0)} ${n(y0)} Z`;
  let s = `<g class="dflame">`;
  s += `<path d="${p(reach, w0)}" fill="#ff6a2a" opacity=".55"/>`;
  s += `<path d="${p(reach*0.76, w0*0.66)}" fill="#ffa03a" opacity=".8"/>`;
  s += `<path d="${p(reach*0.48, w0*0.4)}" fill="#ffe07a" opacity=".95"/>`;
  s += `<circle cx="${n(tip)}" cy="${n(y0)}" r="${n(w0*0.4)}" fill="#fff3c4" opacity="${(0.7*(1-k)).toFixed(2)}"/>`;
  s += `</g>`;
  return s;
}

if(typeof tickDragon === 'function'){
  const _tickFlame = tickDragon;
  tickDragon = function(dt){
    const r = _tickFlame.apply(this, arguments);
    try{
      const d = S.dragon; if(!d) return r;
      if(d.flameT > 0){
        d.flameT = Math.max(0, d.flameT - dt);
        const g = document.getElementById('dragonlay');
        const el = g && g.firstElementChild;
        if(el){
          let f = el.querySelector('.dflamewrap');
          if(!f){
            f = document.createElementNS('http://www.w3.org/2000/svg','g');
            f.setAttribute('class','dflamewrap');
            el.appendChild(f);
          }
          f.innerHTML = flameArt(d, 1 - d.flameT/1.5);
        }
      } else {
        const f = document.querySelector('#dragonlay .dflamewrap');
        if(f && f.innerHTML) f.innerHTML = '';
      }
    }catch(e){}
    return r;
  };
}

/* make it clickable — the layer is pointer-events:none for everything else */
(function clickable(){
  const wire = ()=>{
    const g = document.getElementById('dragonlay');
    if(!g || g.dataset.wired) return;
    g.dataset.wired = '1';
    g.style.pointerEvents = 'none';
    g.addEventListener('click', ()=>G.dragonFlame());
    const body = g.firstElementChild;
    if(body){ body.style.pointerEvents = 'auto'; body.style.cursor = 'pointer'; }
  };
  setInterval(()=>{ try{
    wire();
    const b = document.querySelector('#dragonlay > g');
    if(b){ b.style.pointerEvents='auto'; b.style.cursor='pointer'; b.onclick = ()=>G.dragonFlame(); }
  }catch(e){} }, 1200);
})();

(function wingCss(){
  const s = document.createElement('style');
  s.textContent = `
  /* Asymmetric, because that is what flapping is: a fast power stroke
     that does the work and a slow folded recovery. The old cycle was a
     symmetric alternating ease — a windscreen wiper. */
  #dragonlay .flying .dwing.near{ animation: dbeat .52s cubic-bezier(.35,0,.55,1) infinite; }
  #dragonlay .flying .dwing.far { animation: dbeat .52s cubic-bezier(.35,0,.55,1) infinite;
    animation-delay: -.06s; opacity:.72; }
  @keyframes dbeat{
    0%   { transform: rotate(-34deg) scaleY(.74) }
    20%  { transform: rotate(16deg)  scaleY(1.16) }
    32%  { transform: rotate(26deg)  scaleY(1.04) }
    100% { transform: rotate(-34deg) scaleY(.74) }
  }
  #dragonlay .dflame{ animation: dfl .11s steps(2) infinite; transform-origin: right center; }
  @keyframes dfl{ from{ transform: scaleY(.94) } to{ transform: scaleY(1.06) } }
  @media (prefers-reduced-motion: reduce){
    #dragonlay .flying .dwing.near, #dragonlay .flying .dwing.far, #dragonlay .dflame{ animation:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.dragonLifeAudit = function(){
  const d = S.dragon;
  if(!d) return { dragon:'none' };
  const m = dragonMind();
  const goal = dragonDecide();
  return {
    name:d.name, state:d.state, wants: goal ? goal.mode : '—',
    at:`${Math.round(d.x)},${Math.round(d.y)}`,
    wingsBeating: !!d.wing,
    breathing: (d.flameT||0) > 0,
    drives:{ hunger:+m.hunger.toFixed(2), pride:+m.pride.toFixed(2), heat:+m.heat.toFixed(2) },
    roamModes:['patrol','soar','hunt','perch'],
    clickIt: 'click the dragon and it practises its fire — costs it heat',
  };
};
