/* =====================================================================
   CALL SOMETHING IN, AND WATCH THE DOG SEE IT OFF

   Wildlife already comes onto the land on its own hours and the dog
   already treats a predator as duty, but you can go several nights
   without seeing any of it - the fox comes at 2am while you are looking
   at the barn panel. So: a button that calls one in, and a proper chase
   when the dog gets to it.

   THE COMEDY IS IN THE PHYSICS, NOT IN CARTOON DRAWINGS. A Tom and Jerry
   chase is funny because of what the bodies do - the overshoot on a turn,
   the jink the instant before the paw lands, the skid, the double-back
   through the legs. So none of that is faked with drawn gags. The fox
   genuinely jinks perpendicular to the dog's approach, the dog genuinely
   carries too much speed into the turn and slides past, and the dust and
   the speed lines are drawn from the motion that actually happened.

   AND IT STAYS A FARM, NOT A CARTOON. The dog does not catch and kill
   anything. She closes, the animal breaks, and after enough pressure it
   gives up and leaves the way it came - which is what a farm dog is for
   and what actually happens. If she is slow or the fox is bold enough it
   gets what it came for and goes over the hedge with it. Both endings are
   real outcomes with real consequences: a hen is either lost or not.

     tag        she gets within a nose of it: it breaks off and leaves
     jink       the sharp turn, with a skid and a puff of dust
     overshoot  she cannot turn as fast as it can, and sails past
     escape     it reaches the boundary with a lead and is gone

   Runs off the same tick as everything else and paints by moving
   elements, so a chase costs no re-render.
   ===================================================================== */

let CHASE = null;

const CHASE_DOG_SPEED  = 168;   /* she is faster in a straight line */
const CHASE_RUN_SPEED  = 152;   /* it is more agile, which is the trade */
const CHASE_TAG_DIST   = 23;   /* a nose on it — she lunges the last bit */
const CHASE_JINK_DIST  = 46;    /* how close before it breaks */
const CHASE_MAX_TIME   = 34;

function chaseActive(){ return !!(CHASE && !CHASE.over); }

/* what it came for: its own quarry if the farm has any, else the middle */
function chaseTarget(w){
  try{
    const t = (typeof wildTarget === 'function') ? wildTarget(w) : null;
    if(t && t.x !== undefined) return t;
  }catch(e){}
  return { x:(FARM.x + FARM.w/2)*T, y:(FARM.y + FARM.h/2)*T };
}

/* ---------- calling one in ---------- */
function summonWild(kind){
  if(typeof spawnWild !== 'function') return null;
  const threats = Object.keys(WILD).filter(k=>WILD[k].threat);
  const k = kind || threats[Math.floor(Math.random()*threats.length)];
  const w = spawnWild(k);
  if(!w) return null;
  /* summoned deliberately, so it is here to try its luck rather than
     drift off the moment the clock says it should be asleep */
  w.summoned = 1;
  w.bold = Math.max(w.bold, 0.85);
  w.scared = 0;
  /* spawnWild puts wildlife beyond the hedge so it can walk in on its own
     time. Pressing the button means you want it here now, and left where
     it lands it starts outside the boundary - which the chase read as
     having already escaped, and ended before the first frame. Bring it in
     over the fence, on the side it arrived from. */
  const bx0 = FARM.x*T, bx1 = (FARM.x+FARM.w)*T;
  const by0 = FARM.y*T, by1 = (FARM.y+FARM.h)*T;
  w.x = Math.max(bx0 + T, Math.min(bx1 - T, w.x));
  w.y = Math.max(by0 + T, Math.min(by1 - T, w.y));
  return w;
}

/* the hours check must not evict something the player asked for */
if(typeof wildAwake === 'function'){
  const _wildAwakeBase = wildAwake;
  wildAwake = function(sp){
    try{ if(CHASE && CHASE.w && CHASE.w.summoned && WILD[CHASE.w.k] === sp) return true; }catch(e){}
    return _wildAwakeBase.apply(this, arguments);
  };
}
if(typeof tickWild === 'function'){
  const _tickWildKeep = tickWild;
  tickWild = function(dt){
    /* a summoned animal in a chase is driven here, not by wildThink */
    if(chaseActive() && CHASE.w){ CHASE.w.hold = 1; }
    return _tickWildKeep.apply(this, arguments);
  };
}
if(typeof wildThink === 'function'){
  const _wildThinkBase = wildThink;
  wildThink = function(w, dt){
    if(w && w.hold) return;                     /* the chase owns it */
    return _wildThinkBase.apply(this, arguments);
  };
}

/* ---------- starting one ---------- */
G.summonWildlife = function(kind){
  if(!S.dog){
    if(typeof toast === 'function') toast('You need a dog first — she is in Build under Animals', 'bad');
    return;
  }
  if(chaseActive()){ if(typeof toast === 'function') toast('There is already one out there', 'bad'); return; }
  const w = summonWild(kind);
  if(!w){ if(typeof toast === 'function') toast('Nothing came', 'bad'); return; }

  CHASE = { w, t:0, phase:'approach', jinkT:0, tags:0, jinks:0, over:false,
            dogVX:0, dogVY:0, puffs:[], said:0 };
  const sp = WILD[w.k];
  if(typeof log === 'function') log(`${sp.n} is on the land — ${S.dog.name} has seen it.`, 'bad', 'farm');
  if(typeof toast === 'function') toast(`${sp.n}! ${S.dog.name} is going after it`, 'bad');
  /* follow the action */
  try{ if(typeof G.lookAt === 'function') G.lookAt(w.x, w.y); }catch(e){}
  if(S.speed === 0 && typeof G.setSpeed === 'function') try{ G.setSpeed(1); }catch(e){}
};

/* ---------- the chase itself ---------- */
function chaseTick(dt){
  if(!chaseActive()) return;
  const c = CHASE, w = c.w, d = S.dog;
  if(!w || !d || w.done){ chaseEnd('gone'); return; }
  c.t += dt;

  const dx = w.x - d.x, dy = w.y - d.y;
  const dist = Math.hypot(dx, dy) || 1;

  /* Both paces up front, because the animal's decision to stop working
     the yard and simply go depends on whether it is actually quicker than
     she is. Inferring that from the gap did not work: its jink is
     perpendicular, so it keeps cutting back across her and the gap
     oscillates instead of growing — the bail never fired and a dog on her
     last legs still won every time. */
  const mind = (typeof dogMind === 'function') ? dogMind() : null;
  const energy = mind ? mind.energy : 1;
  const dogSpeed = CHASE_DOG_SPEED * (0.80 + energy * 0.28);
  const runSpeed = CHASE_RUN_SPEED * (0.9 + w.bold*0.2);
  if(c.phase === 'run' && c.t > 1.2 && runSpeed > dogSpeed * 1.02) c.bail = 1;

  /* ---- the animal ----
     Two phases, because a fox does not arrive already running. It comes
     for the hens and ignores the dog until she is close enough to matter;
     only then does it break. Driving it in flee mode from the first frame
     meant it sprinted straight off the far side in two seconds without
     the dog ever getting near enough for a chase to happen. */
  if(c.phase === 'approach'){
    const tgt = c.target || (c.target = chaseTarget(w));
    const tx = tgt.x - w.x, ty = tgt.y - w.y;
    const td = Math.hypot(tx, ty) || 1;
    const sp2 = (WILD[w.k].speed || 90) * 0.85;
    w.x += (tx/td) * sp2 * dt;
    w.y += (ty/td) * sp2 * dt;
    w.dir = tx < 0 ? -1 : 1;
    w.state = 'move';
    if(dist < 150){                      /* she is on it: break */
      c.phase = 'run';
      puff(w.x, w.y);
      if(typeof speak === 'function') try{ speak(d, 'oi!'); }catch(e){}
    }
    /* it is not away yet, so keep it on the land while it approaches */
    w.x = Math.max((FARM.x+0.5)*T, Math.min((FARM.x+FARM.w-0.5)*T, w.x));
    w.y = Math.max((FARM.y+0.5)*T, Math.min((FARM.y+FARM.h-0.5)*T, w.y));
  }

  /* it runs from her, but not in a straight line: the closer she gets the
     harder it cuts, which is the whole shape of a chase */
  /* dx,dy already runs from the dog to the animal, so away from her is
     +dx. Negating it pointed the fox straight back at the dog: it spent
     every chase charging her, which is why she caught it every time
     however slow she was and why the gap sat pinned at ten pixels. */
  let ax = dx/dist, ay = dy/dist;              /* straight away from her */
  c.jinkT -= dt;
  /* Once it has decided to go, it goes. Jinking is how it stays alive
     while it is still working the yard, but it cuts perpendicular — back
     across her path — so an animal that kept jinking while trying to
     leave got caught every time regardless of how slow she was. */
  if(c.bail) c.jinkT = 0;
  if(!c.bail && dist < CHASE_JINK_DIST && c.jinkT <= 0){
    /* break perpendicular, to the side with more room */
    const px = -dy/dist, py = dx/dist;          /* across the flee line */
    const room = (w.x + px*60 > FARM.x*T && w.x + px*60 < (FARM.x+FARM.w)*T) ? 1 : -1;
    c.jinkDir = room * (Math.random() < 0.5 ? 1 : -1);
    c.jinkT = 0.55 + Math.random()*0.5;
    c.jinks++;
    puff(w.x, w.y);
    if(typeof speak === 'function' && c.jinks % 2 === 1)
      try{ speak(d, ['!','oi','hey'][c.jinks % 3]); }catch(e){}
  }
  if(c.jinkT > 0){
    const px = (-dy/dist) * c.jinkDir, py = (dx/dist) * c.jinkDir;
    ax = ax*0.35 + px*0.95; ay = ay*0.35 + py*0.95;
    const m = Math.hypot(ax,ay)||1; ax/=m; ay/=m;
  }
  /* It came here for the hens, so until it has taken real punishment it
     turns along the fence rather than straight over it. Without this the
     first break sent it at the nearest boundary and the whole thing was
     over in two seconds — a chase has to stay in the yard to be a chase. */
  /* Once it is genuinely outrunning her it stops working the yard and
     goes. Without this the fence-turn held it in for the whole chase, so
     it could never get away however slow she was — a dog on her last legs
     still won every time, and the outcome meant nothing. */
  if(c.phase === 'run' && !c.bail && c.tags < 2 && c.t < 20){
    const m = T*1.6;
    if(w.x < (FARM.x)*T + m && ax < 0)            { ax = Math.abs(ay); ay = ay*0.6 + (Math.sign(ay)||1)*0.8; }
    if(w.x > (FARM.x+FARM.w)*T - m && ax > 0)     { ax = -Math.abs(ay); ay = ay*0.6 + (Math.sign(ay)||1)*0.8; }
    if(w.y < (FARM.y)*T + m && ay < 0)            { ay = Math.abs(ax); ax = ax*0.6 + (Math.sign(ax)||1)*0.8; }
    if(w.y > (FARM.y+FARM.h)*T - m && ay > 0)     { ay = -Math.abs(ax); ax = ax*0.6 + (Math.sign(ax)||1)*0.8; }
    const m2 = Math.hypot(ax,ay)||1; ax/=m2; ay/=m2;
  }
  if(c.phase === 'run'){
    const wSpeed = runSpeed * (c.burst > 0 ? 1.35 : 1);
    w.x += ax * wSpeed * dt;
    w.y += ay * wSpeed * dt;
    w.dir = ax < 0 ? -1 : 1;
    w.state = 'flee';
  }

  /* ---- the dog ---- */
  /* She steers rather than teleports toward it, so she cannot corner as
     tightly as the thing she is chasing. That single difference is what
     produces the overshoot, and the overshoot is the joke. */
  /* Her pace is her condition. Flat out she is quicker than a fox and
     always won, which made the outcome a formality — six runs, six wins.
     A tired dog is slower than a bold fox and it gets away with a hen, so
     whether you have run her ragged all day actually matters. */
  const want = { x: dx/dist, y: dy/dist };
  const turn = Math.min(1, (dist < 70 ? 4.6 : 3.4) * dt);   /* she locks on close in */
  c.dogVX += (want.x*dogSpeed - c.dogVX) * turn;
  c.dogVY += (want.y*dogSpeed - c.dogVY) * turn;
  /* It costs her, and that is felt inside a single chase: a long pursuit
     drains her below the fox's pace and it gets away, which is why an
     eleven second chase can end with a hen gone. Tuned so a rested dog
     usually converts before that happens. */
  if(mind) mind.energy = Math.max(0, mind.energy - dt * 0.026);
  const before = dist;
  d.x += c.dogVX * dt;
  d.y += c.dogVY * dt;
  if(Math.abs(c.dogVX) > 4) d.dir = c.dogVX < 0 ? -1 : 1;
  d.state = 'run';

  const after = Math.hypot(w.x-d.x, w.y-d.y);
  /* a skid: she was closing and is now opening, at speed */
  if(before < CHASE_JINK_DIST && after > before + 1.5) puff(d.x, d.y - 2);

  /* Until it commits to leaving it is working the yard, so it stays on
     the land. The fence-turn alone let it drift over the boundary and
     every chase ended in an escape however fresh she was. */
  if(c.phase === 'run' && !c.bail){
    w.x = Math.max((FARM.x+0.4)*T, Math.min((FARM.x+FARM.w-0.4)*T, w.x));
    w.y = Math.max((FARM.y+0.4)*T, Math.min((FARM.y+FARM.h-0.4)*T, w.y));
  }

  /* ---- keep them on the land ---- */
  const bx0 = (FARM.x-1)*T, bx1 = (FARM.x+FARM.w+1)*T;
  const by0 = (FARM.y-1)*T, by1 = (FARM.y+FARM.h+1)*T;
  /* leaving only counts as getting away once it has actually been on the
     land - otherwise an animal that starts near the edge escapes before
     the dog has taken a step */
  const inside = w.x > bx0 && w.x < bx1 && w.y > by0 && w.y < by1;
  if(inside) c.entered = 1;
  const out = c.phase === 'run' && c.entered && !inside;
  d.x = Math.max(bx0, Math.min(bx1, d.x));
  d.y = Math.max(by0, Math.min(by1, d.y));

  /* ---- outcomes ---- */
  /* A touch needs a cooldown. Without one the frames either side of a
     near miss both counted, so two "tags" landed a tenth of a second
     apart and the whole chase was over in 0.4 seconds having recorded a
     single turn. A touch also gives it a fright and a burst of pace,
     which is what actually gets it clear and keeps the chase going. */
  c.tagCool = Math.max(0, (c.tagCool || 0) - dt);
  c.burst   = Math.max(0, (c.burst || 0) - dt);
  if(after < CHASE_TAG_DIST && c.tagCool <= 0 && c.phase === 'run'){
    c.tags++;
    c.tagCool = 1.4;
    c.burst = 0.9;
    puff(w.x, w.y); puff(d.x, d.y - 2);
    if(typeof speak === 'function') try{ speak(d, ['got you','ha','oi'][c.tags % 3]); }catch(e){}
    if(c.tags >= 3){ chaseEnd('seen off'); return; }
    c.jinkT = 0.9; c.jinkDir = -(c.jinkDir || 1);   /* it doubles back, hard */
  }
  /* Leaving is only a win if she actually put it under pressure. Scoring
     any single touch as "seen off" meant a fox that simply outran a tired
     dog and went over the hedge was reported as a success with nothing
     lost — which made the dog's condition, and the whole outcome, mean
     nothing. Two touches is her seeing it off; fewer is it leaving when
     it suited, with whatever it came for. */
  if(out){ chaseEnd(c.tags >= 2 ? 'seen off' : 'escaped'); return; }
  if(c.t > CHASE_MAX_TIME){ chaseEnd(c.tags >= 2 ? 'seen off' : 'escaped'); return; }

  paintChase(dt);
}

/* dust, drawn from the turn that actually happened */
function puff(x, y){
  if(!CHASE) return;
  CHASE.puffs.push({ x, y, t:0, r:2 + Math.random()*2 });
  if(CHASE.puffs.length > 14) CHASE.puffs.shift();
}

function chaseLayer(){
  let g = document.getElementById('chaselay');
  if(!g){
    const fg = document.getElementById('fg');
    if(!fg) return null;
    g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id = 'chaselay';
    g.setAttribute('pointer-events','none');
    fg.appendChild(g);
  }
  return g;
}

function paintChase(dt){
  const g = chaseLayer(); if(!g || !CHASE) return;
  const c = CHASE;
  let s = '';
  for(let i=c.puffs.length-1;i>=0;i--){
    const p = c.puffs[i];
    p.t += dt;
    if(p.t > 0.75){ c.puffs.splice(i,1); continue; }
    const k = p.t/0.75;
    s += `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(p.r + k*7)}"
      fill="#cbbfa4" opacity="${(0.42*(1-k)).toFixed(3)}"/>`;
  }
  /* speed lines behind whichever is running hardest */
  const w = c.w, d = S.dog;
  if(w && d){
    const sp = Math.hypot(c.dogVX, c.dogVY);
    if(sp > 90){
      const ux = -c.dogVX/sp, uy = -c.dogVY/sp;
      for(let i=0;i<3;i++){
        const o = (i-1)*3.2;
        s += `<line x1="${n(d.x + ux*7 - uy*o)}" y1="${n(d.y + uy*7 + ux*o - 4)}"
          x2="${n(d.x + ux*19 - uy*o)}" y2="${n(d.y + uy*19 + ux*o - 4)}"
          stroke="#ffffff" stroke-opacity=".30" stroke-width="1.3" stroke-linecap="round"/>`;
      }
    }
  }
  g.innerHTML = s;
  if(typeof paintDog === 'function') try{ paintDog(); }catch(e){}
  if(typeof paintWild === 'function') try{ paintWild(); }catch(e){}
}

function chaseEnd(how){
  const c = CHASE; if(!c || c.over) return;
  c.over = true;
  const w = c.w, sp = WILD[w.k], d = S.dog;
  const g = document.getElementById('chaselay'); if(g) g.innerHTML = '';
  if(w) w.hold = 0;

  if(how === 'seen off'){
    w.state = 'flee'; w.scared = Math.min(1, (w.scared||0) + 0.5); w.done = 1;
    if(d){ d.bond = Math.min(1, (d.bond||0.35) + 0.06); d.state = 'sit'; }
    if(typeof log === 'function')
      log(`${d?d.name:'The dog'} saw the ${sp.n.toLowerCase()} off after ${c.jinks} turn${c.jinks===1?'':'s'}. Nothing lost.`, 'good', 'farm');
    if(typeof toast === 'function') toast(`${d?d.name:'She'} saw it off`, 'good');
    if(typeof addXP === 'function') try{ addXP(6); }catch(e){}
  } else if(how === 'escaped'){
    /* it got away, and a fox that gets away has usually had something */
    let took = null;
    /* wildPayoff works off the animal's goal, which the chase never set —
       so a fox that got clean away took nothing, and losing meant nothing */
    try{ if(!w.goal) w.goal = c.target || chaseTarget(w); took = wildPayoff(w); }catch(e){}
    w.done = 1;
    if(typeof log === 'function')
      log(`The ${sp.n.toLowerCase()} got away over the hedge.`, 'bad', 'farm');
    if(typeof toast === 'function') toast('It got away', 'bad');
  } else {
    if(typeof log === 'function') log(`The ${sp.n.toLowerCase()} slipped away.`, '', 'farm');
  }
  if(typeof render === 'function') try{ render(); }catch(e){}
  CHASE = null;
}

/* ---------- the dog is busy while this is on ---------- */
if(typeof tickDog === 'function'){
  const _tickDogChase = tickDog;
  tickDog = function(dt){
    if(chaseActive()) return;        /* the chase moves her instead */
    return _tickDogChase.apply(this, arguments);
  };
}
if(typeof tickPeople === 'function'){
  const _tickPeopleChase = tickPeople;
  tickPeople = function(dt){
    const r = _tickPeopleChase.apply(this, arguments);
    try{ chaseTick(typeof dt === 'number' ? Math.min(0.08, dt) : 0.05); }catch(e){}
    return r;
  };
}

/* ---------- the button ---------- */
(function chaseButton(){
  const put = ()=>{
    const host = document.getElementById('zoomctl');
    if(!host || document.getElementById('summonbtn')) return;
    const b = document.createElement('button');
    b.id = 'summonbtn';
    b.textContent = '🦊';
    b.title = 'Call something in — the dog will see it off';
    b.setAttribute('data-tip','<b>Call in wildlife</b>Puts a fox, badger or deer on the land now. Your dog will go for it, and either sees it off or it gets away with something.');
    b.onclick = ()=>G.summonWildlife();
    host.insertBefore(b, host.firstChild);
  };
  put();
  setTimeout(put, 600);
  setTimeout(put, 2000);
  const s = document.createElement('style');
  s.textContent = `#summonbtn{ font-size:15px; line-height:1 }
    #summonbtn:disabled{ opacity:.4 }`;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.chaseAudit = function(){
  if(!chaseActive()) return { running:false, dog: S.dog ? S.dog.name : 'none',
    canSummon: !!S.dog, note:'press the fox button by the zoom controls' };
  const c = CHASE, d = S.dog;
  return {
    running:true, species: WILD[c.w.k].n,
    seconds:+c.t.toFixed(1), jinks:c.jinks, tags:c.tags, phase:c.phase,
    gap: Math.round(Math.hypot(c.w.x-d.x, c.w.y-d.y)),
    dogSpeed: Math.round(Math.hypot(c.dogVX, c.dogVY)),
    puffs: c.puffs.length,
  };
};
