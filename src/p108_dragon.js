/* =====================================================================
   THE DRAGON, ITS ROOST, AND MUSIC FOR THE ACTION

   The champions have been paying out dragon marks since they were built
   and nothing could be done with them. Here is what they are for.

   THE ROOST FIRST. A dragon is not a pet you keep in the yard; it needs
   somewhere to sleep, and that somewhere is a building you place like any
   other, with a footprint and a cost. Without a roost the summoning is
   refused, which makes the marks buy a decision rather than a firework.

   THE MIND. Asked for a real one rather than a follower. It is built the
   same way the dog's is - drives that fill and empty, and a choice each
   second about which one wins - but a dragon is not a dog and the drives
   say so:

     hunger    it eats, and it will help itself to your stock if let
     pride     it wants to be looked at, and sulks in the roost if not
     heat      it must burn something off or it gets irritable
     bond      slow to earn, and it decides whether it listens at all

   Pride is the one that makes it a dragon. A dog wants to be near you; a
   dragon wants to be admired, and if you ignore it for long enough it
   goes back to the roost and stays there. Bond gates everything: a dragon
   that does not rate you will not come when called, and says so.

   It is deliberately not a strict good citizen. A hungry dragon with a
   low bond will take a sheep. That is the animal you asked for.

   THE MUSIC. The audio engine has had a music bus wired up and held at
   zero since it was written - the Music switch in Settings has never had
   anything to turn on. There are no audio files in this project and there
   is not going to be a megabyte of them in a single HTML file, so the
   score is generated: a mode, a chord bed, and a melodic line picked from
   the scale, arranged differently for a duel, a chase and a summoning.
   Three cues, each with its own key and instrument colour, all played
   through the existing mixer so mute and volume already work.
   ===================================================================== */

/* ---------- the roost ---------- */
(function dragonBlueprint(){
  if(typeof BP === 'undefined' || BPMAP.dragon_roost) return;
  const bp = { id:'dragon_roost', name:'Dragon roost', art:'dragon_roost', cat:'home',
    w:4, h:4, cost:6500, lvl:6, kind:'bonus', charm:26, power:-1,
    desc:'A stone perch and a scorched hollow. Something has to sleep somewhere.',
    tip:'Build it before you spend your dragon marks — the summoning needs a roost.' };
  BP.push(bp); BPMAP[bp.id] = bp;
})();

if(typeof ART === 'object' && !ART.dragon_roost){
  ART.dragon_roost = (w,h)=>{
    let s = ao(0,0,w,h,.34);
    /* scorched ground */
    s += `<ellipse cx="${n(w*0.5)}" cy="${n(h*0.62)}" rx="${n(w*0.42)}" ry="${n(h*0.30)}" fill="#3a2e26"/>`;
    s += `<ellipse cx="${n(w*0.5)}" cy="${n(h*0.62)}" rx="${n(w*0.30)}" ry="${n(h*0.21)}" fill="#241c18"/>`;
    /* standing stones round the hollow */
    for(let i=0;i<7;i++){
      const a0 = (i/7)*Math.PI*2 + 0.4;
      const sx = w*0.5 + Math.cos(a0)*w*0.38, sy = h*0.62 + Math.sin(a0)*h*0.28;
      const hh = h*(0.16 + hash(i*3.1)*0.12);
      s += `<rect x="${n(sx-w*0.035)}" y="${n(sy-hh)}" width="${n(w*0.07)}" height="${n(hh)}" rx="2" fill="#6f6a62"/>`;
      s += `<rect x="${n(sx-w*0.035)}" y="${n(sy-hh)}" width="${n(w*0.03)}" height="${n(hh)}" rx="2" fill="#8d8880"/>`;
    }
    /* the perch itself */
    s += `<path d="M${n(w*0.30)} ${n(h*0.58)} Q${n(w*0.5)} ${n(h*0.30)} ${n(w*0.70)} ${n(h*0.58)}"
      fill="none" stroke="#5a5048" stroke-width="${n(h*0.07)}" stroke-linecap="round"/>`;
    /* embers */
    for(let i=0;i<5;i++)
      s += `<circle class="dember" cx="${n(w*(0.38+i*0.06))}" cy="${n(h*0.66)}" r="${n(1.4+hash(i)*1.6)}"
        fill="#ff8a3a" opacity=".85" style="--i:${i}"/>`;
    return s;
  };
}

function hasRoost(){ return (S.objs||[]).some(o=>o.bp === 'dragon_roost'); }
function roostSpot(){
  const r = (S.objs||[]).find(o=>o.bp === 'dragon_roost');
  if(!r) return null;
  const f = footprint(BPMAP[r.bp], r.rot);
  return { x:(r.tx + f.w/2)*T, y:(r.ty + f.h*0.62)*T };
}

/* ---------- summoning ---------- */
const DRAGON_COST = 12;

G.summonDragon = function(){
  if(S.dragon){ if(typeof toast==='function') toast('You already have one', 'bad'); return; }
  if(!hasRoost()){
    if(typeof toast==='function') toast('Build a dragon roost first — it needs somewhere to sleep', 'bad');
    return;
  }
  const marks = S.marks || 0;
  if(marks < DRAGON_COST){
    if(typeof toast==='function') toast(`${DRAGON_COST} dragon marks needed — you have ${marks}`, 'bad');
    return;
  }
  S.marks = marks - DRAGON_COST;
  const spot = roostSpot();
  const names = ['Ashling','Vermil','Sorrow','Kite','Ember','Gale','Thistle'];
  S.dragon = {
    name: names[Math.floor(Math.random()*names.length)],
    x: spot.x, y: spot.y - 40, dir: 1, state:'land',
    hue: Math.floor(Math.random()*360),
    mind: { hunger:0.3, pride:0.4, heat:0.5 },
    bond: 0.15, think:0, task:null, seen:{},
  };
  dragonMusic();
  if(typeof log === 'function')
    log(`${S.dragon.name} came down onto the roost. It is not sure about you yet.`, 'gold', 'farm');
  if(typeof toast === 'function') toast(`${S.dragon.name} answered the call`, 'gold');
  if(typeof render === 'function') render();
  if(typeof ui === 'function') ui();
  if(typeof save === 'function') try{ save(); }catch(e){}
};

/* ---------- the mind ---------- */
function dragonMind(){
  const d = S.dragon; if(!d) return null;
  if(!d.mind) d.mind = { hunger:0.3, pride:0.4, heat:0.5 };
  return d.mind;
}

function dragonDecide(){
  const d = S.dragon, m = dragonMind();
  if(!d || !m) return null;

  /* it finishes what it started */
  if(d.task && d.taskT > 0) return d.task;

  /* Bond gates everything. A dragon that does not rate you does not come
     when called, and there is no point pretending otherwise. */
  const listens = d.bond > 0.35;

  /* A dragon outlives its roost — nothing stops you demolishing the thing
     it sleeps on, and summoning only checks for one at the time. After
     that roostSpot() is null, and two of the four branches below read .x
     straight off it: heat > 0.8 and pride > 0.7 both threw on every frame
     the drive stayed up. tickDragon's caller swallows it, so the dragon
     did not crash the game — it silently stopped deciding and froze.

     Falling through to the next branch would not be enough either.
     Burning is the only thing that discharges heat, and sulking is the
     only thing that discharges pride when you are not there to show off
     to, so a roostless dragon would have had both pinned at maximum for
     good. It does them where it stands instead, which is also what a
     creature with nowhere in particular to be would do. */
  const perch = roostSpot() || { x:d.x, y:d.y };

  /* heat has to go somewhere */
  if(m.heat > 0.8) return { mode:'burn', x:perch.x, y:perch.y - 30, say:'…' };

  /* hungry, and not bonded enough to be polite about it */
  if(m.hunger > 0.75){
    const pen = (S.objs||[]).find(o=>BPMAP[o.bp] && BPMAP[o.bp].kind==='animal' && o.animals>0);
    if(pen && !listens){
      const f = footprint(BPMAP[pen.bp], pen.rot);
      return { mode:'raid', x:(pen.tx+f.w/2)*T, y:(pen.ty+f.h/2)*T, pen };
    }
    return { mode:'feed', x:perch.x, y:perch.y - 20 };
  }
  /* wants an audience */
  if(m.pride > 0.7){
    if(listens && S.you) return { mode:'show', x:S.you.x + 40, y:S.you.y - 30, say:'!' };
    return { mode:'sulk', x:perch.x, y:perch.y - 6 };
  }
  /* otherwise: near you if it rates you, else circling its own roost */
  if(listens && S.you) return { mode:'follow', x:S.you.x - 44, y:S.you.y - 26 };
  return { mode:'circle', x:perch.x, y:perch.y - 34 };
}

function tickDragon(dt){
  const d = S.dragon; if(!d) return;
  const m = dragonMind();
  d.taskT = Math.max(0, (d.taskT||0) - dt);

  const goal = dragonDecide();
  if(!goal) return;
  if(goal !== d.task && goal.mode !== (d.task&&d.task.mode)){ d.task = goal; d.taskT = 2.5; }

  const dx = goal.x - d.x, dy = goal.y - d.y;
  const dist = Math.hypot(dx, dy) || 1;
  const speed = goal.mode === 'raid' ? 132 : goal.mode === 'show' ? 118 : 86;
  if(dist > 20){
    const k = Math.min(1, speed*dt/dist);
    d.x += dx*k; d.y += dy*k;
    if(Math.abs(dx) > 2) d.dir = dx < 0 ? -1 : 1;
    d.state = 'fly';
    m.heat = Math.min(1, m.heat + dt*0.012);
  } else {
    d.state = goal.mode === 'sulk' ? 'rest' : goal.mode;
    if(goal.mode === 'burn'){ m.heat = Math.max(0, m.heat - dt*0.5); }
    if(goal.mode === 'feed'){ m.hunger = Math.max(0, m.hunger - dt*0.4); }
    if(goal.mode === 'show'){ m.pride = Math.max(0, m.pride - dt*0.35);
      d.bond = Math.min(1, d.bond + dt*0.010); }
    if(goal.mode === 'sulk'){ m.pride = Math.max(0, m.pride - dt*0.06);
      d.bond = Math.max(0, d.bond - dt*0.004); }
    if(goal.mode === 'raid' && goal.pen && Math.random() < dt*0.5){
      if(goal.pen.animals > 0){
        goal.pen.animals--;
        m.hunger = Math.max(0, m.hunger - 0.6);
        d.bond = Math.max(0, d.bond - 0.05);
        if(typeof log === 'function')
          log(`${d.name} took one of your ${BPMAP[goal.pen.bp].animal||'stock'}. It is not sorry.`, 'bad', 'farm');
        d.task = null; d.taskT = 0;
      }
    }
    if(goal.mode === 'follow'){ d.bond = Math.min(1, d.bond + dt*0.003); }
  }

  /* drives fill */
  m.hunger = Math.min(1, m.hunger + dt*0.009);
  m.pride  = Math.min(1, m.pride  + dt*0.011);
  paintDragon();
}

/* ---------- drawing ---------- */
function dragonArt(d){
  const c = `hsl(${d.hue} 55% 42%)`, c2 = `hsl(${d.hue} 60% 56%)`, belly = `hsl(${(d.hue+30)%360} 40% 74%)`;
  const flap = d.state === 'fly';
  let s = `<ellipse cx="2" cy="10" rx="22" ry="6" fill="#16240c" opacity=".24"/>`;
  /* tail */
  s += `<path d="M6 0 Q22 -2 30 -12 Q24 -6 12 -3 Z" fill="${c}"/>`;
  /* far wing */
  s += `<path class="dwing far" d="M-2 -10 Q-24 -34 -44 -22 Q-26 -18 -14 -4 Z" fill="${c}" opacity=".75"/>`;
  /* body */
  s += `<ellipse cx="0" cy="-6" rx="14" ry="9" fill="${c}"/>`;
  s += `<ellipse cx="-1" cy="-3.5" rx="10" ry="5.4" fill="${belly}" opacity=".85"/>`;
  /* neck and head */
  s += `<path d="M-10 -10 Q-20 -18 -26 -26" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  s += `<ellipse cx="-28" cy="-28" rx="8" ry="5.4" fill="${c2}"/>`;
  s += `<path d="M-34 -30 L-24 -31 L-27 -25 Z" fill="${belly}"/>`;
  s += `<circle cx="-30" cy="-29.5" r="1.5" fill="#ffe07a"/>`;
  /* horns */
  s += `<path d="M-26 -32 L-22 -40 M-30 -32 L-30 -41" stroke="#e8d9b8" stroke-width="2" stroke-linecap="round"/>`;
  /* near wing */
  s += `<path class="dwing near" d="M0 -12 Q-20 -42 -46 -32 Q-24 -24 -10 -6 Z" fill="${c2}"/>`;
  s += `<path d="M0 -12 Q-20 -42 -46 -32" fill="none" stroke="${c}" stroke-width="1.4" opacity=".7"/>`;
  /* legs */
  s += `<path d="M-4 2 L-6 8 M6 2 L8 8" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`;
  /* a breath of flame when burning off heat */
  if(d.state === 'burn'){
    s += `<path d="M-34 -29 Q-52 -34 -66 -26 Q-50 -26 -36 -24 Z" fill="#ff8a3a" opacity=".85"/>`;
    s += `<path d="M-34 -29 Q-48 -31 -58 -27 Q-47 -27 -36 -26 Z" fill="#ffd87a" opacity=".9"/>`;
  }
  return `<g class="dragon ${d.state}${flap?' flying':''}">${s}</g>`;
}

function dragonLayer(){
  let g = document.getElementById('dragonlay');
  if(!g){
    const fg = document.getElementById('fg');
    if(!fg) return null;
    g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id = 'dragonlay';
    g.setAttribute('pointer-events','none');
    fg.appendChild(g);
  }
  return g;
}
function paintDragon(){
  const d = S.dragon; if(!d) return;
  const g = dragonLayer(); if(!g) return;
  let el = g.firstElementChild;
  if(!el || g.dataset.state !== d.state){
    g.innerHTML = `<g id="dragonbody">${dragonArt(d)}</g>`;
    g.dataset.state = d.state;
    el = g.firstElementChild;
  }
  el.setAttribute('transform', `translate(${n(d.x)},${n(d.y)}) scale(${d.dir},1)`);
}

if(typeof tickPeople === 'function'){
  const _tickPeopleDragon = tickPeople;
  tickPeople = function(dt){
    const r = _tickPeopleDragon.apply(this, arguments);
    try{ tickDragon(typeof dt==='number' ? Math.min(0.08, dt) : 0.05); }catch(e){}
    return r;
  };
}

/* ---------- the summoning card, in the AI panel beside the marks ---------- */
if(typeof autoHTML === 'function'){
  const _autoHTMLDragon = autoHTML;
  autoHTML = function(){
    const base = _autoHTMLDragon.apply(this, arguments);
    let card = '';
    try{
      const marks = S.marks || 0;
      if(S.dragon){
        const d = S.dragon, m = dragonMind();
        card = `<div class="card"><div class="eyebrow">${d.name}</div>
          <div class="ledrow"><span>Opinion of you</span><b>${d.bond>0.6?'high':d.bond>0.35?'coming round':'unimpressed'}</b></div>
          <div class="ledrow"><span>Doing</span><b>${d.state}</b></div>
          <div class="ledrow"><span>Hunger</span><b>${Math.round(m.hunger*100)}%</b></div>
          <div class="ledrow"><span>Pride</span><b>${Math.round(m.pride*100)}%</b></div>
          <div class="muted" style="margin-top:5px">It listens once its opinion of you passes
          "coming round". Until then it pleases itself.</div></div>`;
      } else {
        const roost = hasRoost();
        card = `<div class="card"><div class="eyebrow">Dragon marks</div>
          <div style="font-size:19px;font-weight:800;color:var(--gold)">${marks}</div>
          <div class="muted" style="margin-top:4px">Won from champion duels.</div>
          ${!roost ? `<div class="warnbox">A dragon needs a roost to sleep in. Build one from the Home category first.</div>` : ''}
          <button class="act primary full" style="margin-top:7px"
            ${(roost && marks>=DRAGON_COST)?'':'disabled'} onclick="G.summonDragon()">
            ${marks>=DRAGON_COST ? `Call one down — ${DRAGON_COST} marks` : `Needs ${DRAGON_COST} marks`}</button></div>`;
      }
    }catch(e){ return base; }
    return card + base;
  };
}

/* ---------- the score ----------
   No audio files: everything is generated. A cue is a mode, a bed and a
   line, and each one is arranged for what is happening. */
const SCALES = {
  duel:   [0,2,3,5,7,8,11],    /* harmonic minor — the fight */
  chase:  [0,2,4,6,7,9,11],    /* lydian — the comedy of it */
  dragon: [0,2,3,7,9],         /* pentatonic minor — the summoning */
};
let CUE = null;
function stopCue(){
  if(CUE){ try{ CUE.nodes.forEach(n0=>{ try{ n0.stop(); }catch(e){} }); }catch(e){} CUE = null; }
  if(typeof SND === 'object' && SND.musicOff) try{ SND.musicOff(); }catch(e){}
}
function playCue(kind, seconds){
  if(typeof SND !== 'object' || !SND.music) return;
  if(typeof SET === 'function' && SET('mus') === false) return;
  const m = SND.music(); if(!m) return;
  stopCue();
  const { ctx, bus } = m;
  const root = kind === 'duel' ? 110 : kind === 'chase' ? 196 : 82.4;
  const scale = SCALES[kind] || SCALES.duel;
  const t0 = ctx.currentTime;
  const nodes = [];
  const g0 = ctx.createGain(); g0.gain.value = 0.9; g0.connect(bus);

  /* the bed: a held fifth, so there is something under the line */
  [1, 1.5].forEach((mul,i)=>{
    const o = ctx.createOscillator();
    o.type = kind === 'dragon' ? 'sine' : 'sawtooth';
    o.frequency.value = root*mul;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(kind==='duel'?0.10:0.07, t0+0.6);
    g.gain.setTargetAtTime(0, t0+seconds-1.2, 0.5);
    o.connect(g); g.connect(g0); o.start(t0); o.stop(t0+seconds);
    nodes.push(o);
  });

  /* the line: a note every beat, drawn from the scale, rising as it goes */
  const bpm = kind === 'chase' ? 148 : kind === 'duel' ? 126 : 74;
  const step = 60/bpm;
  for(let i=0; i*step < seconds-0.3; i++){
    const deg = scale[Math.floor(Math.random()*scale.length)];
    const oct = 2 + (i/((seconds/step)) > 0.66 ? 1 : 0);
    const f = root * Math.pow(2, oct + deg/12);
    const at = t0 + i*step;
    const o = ctx.createOscillator();
    o.type = kind === 'chase' ? 'triangle' : 'square';
    o.frequency.setValueAtTime(f, at);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(kind==='chase'?0.055:0.075, at+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + step*0.9);
    o.connect(g); g.connect(g0); o.start(at); o.stop(at + step);
    nodes.push(o);
  }
  CUE = { nodes, kind };
  setTimeout(()=>{ if(CUE && CUE.nodes === nodes) stopCue(); }, seconds*1000 + 300);
}
function duelMusic(){   playCue('duel', 22); }
function chaseMusic(){  playCue('chase', 12); }
function dragonMusic(){ playCue('dragon', 9); }

if(typeof G.startDuel === 'function'){
  const _sdMusic = G.startDuel;
  G.startDuel = function(){ const r = _sdMusic.apply(this, arguments);
    try{ if(DUEL) duelMusic(); }catch(e){} return r; };
}
if(typeof G.summonWildlife === 'function'){
  const _swMusic = G.summonWildlife;
  G.summonWildlife = function(){ const r = _swMusic.apply(this, arguments);
    try{ if(typeof chaseActive==='function' && chaseActive()) chaseMusic(); }catch(e){} return r; };
}

(function dragonCss(){
  const s = document.createElement('style');
  s.textContent = `
  #dragonlay .dwing{ transform-origin: 0px -12px; }
  #dragonlay .flying .dwing.near{ animation: dflap .42s ease-in-out infinite alternate; }
  #dragonlay .flying .dwing.far { animation: dflap .42s ease-in-out infinite alternate reverse; }
  @keyframes dflap{ from{ transform: rotate(-16deg) scaleY(.86) } to{ transform: rotate(12deg) scaleY(1.1) } }
  .dember{ animation: demb 1.8s ease-in-out infinite alternate; animation-delay: calc(var(--i)*.24s); }
  @keyframes demb{ from{ opacity:.35; transform: translateY(0) } to{ opacity:.95; transform: translateY(-3px) } }
  @media (prefers-reduced-motion: reduce){
    #dragonlay .dwing, .dember{ animation:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.dragonAudit = function(){
  const d = S.dragon;
  if(!d) return { dragon:'none', marks:S.marks||0, cost:DRAGON_COST,
    roost: hasRoost() ? 'built' : 'not built — needed before summoning',
    canSummon: hasRoost() && (S.marks||0) >= DRAGON_COST };
  const m = dragonMind();
  const goal = dragonDecide();
  return {
    name:d.name, at:`${Math.round(d.x)},${Math.round(d.y)}`, state:d.state,
    wants: goal ? goal.mode : '—',
    bond:+d.bond.toFixed(2),
    listensToYou: d.bond > 0.35,
    drives:{ hunger:+m.hunger.toFixed(2), pride:+m.pride.toFixed(2), heat:+m.heat.toFixed(2) },
    marks:S.marks||0,
    music: CUE ? CUE.kind : 'silent',
  };
};
