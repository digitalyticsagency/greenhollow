/* =====================================================================
   THE DOG WAS NEVER MOVING ON SCREEN, AND NOW SHE HAS A MIND

   THE BUG. tickDog() ran every frame and updated S.dog.x and S.dog.y
   correctly the whole time. Nothing ever moved the element. People are
   repositioned by paintPeople(), which rewrites the transform on each
   frame; the dog had no equivalent, so her position only reached the
   screen when a full render() happened - which is rare. She was
   following you the entire time, invisibly, and teleporting whenever
   something else forced a redraw.

   THE MIND. She had one rule: stray, else fire at night, else heel. This
   replaces it with drives that fill and empty, and a decision each second
   about which one wins. Nothing here is random for its own sake - every
   state is something she wants, and she tells you which by thinking it.

     energy     falls while she moves, refills asleep
     bond       to you, built by being near you, spent when you leave
     play       fills on its own, and children satisfy it fastest
     curiosity  fills on its own, and anything newly built satisfies it
     duty       spikes the moment something is loose

   Duty always wins, because a dog that ignores loose stock is not a farm
   dog. After that it is whichever drive is most starved, so she is never
   doing nothing for no reason - and when nothing is pressing she comes
   back to you, which is what a dog does.
   ===================================================================== */

/* ---------- the missing paint ---------- */
function paintDog(){
  const d = S.dog;
  if(!d || d.x === undefined) return;
  const el = document.getElementById('dog');
  if(!el) return;
  el.setAttribute('transform', `translate(${n(d.x)},${n(d.y)})`);
  el.setAttribute('class', 'dog ' + (d.state || 'sit'));
  const flip = el.querySelector('g');
  if(flip) flip.setAttribute('transform', `scale(${d.dir || 1},1)`);
  const lab = el.querySelector('text');
  if(lab && lab.textContent !== d.name) lab.textContent = d.name;
}

/* ---------- drives ---------- */
function dogMind(){
  const d = S.dog; if(!d) return null;
  if(d.mind === undefined){
    d.mind = { energy:1, play:0.3, curio:0.3 };
    d.bond = d.bond === undefined ? 0.35 : d.bond;
    d.seen = d.seen || {};          /* things she has already investigated */
    d.think = 0;
  }
  return d.mind;
}

function dogChildren(){
  return (S.family || []).filter(f=>f.role === 'child' && f.x !== undefined);
}
/* anything built that she has not been over to look at yet */
function dogNovelty(){
  const d = S.dog;
  const o = (S.objs || []).find(x=>!d.seen[x.id] && BPMAP[x.bp]
    && BPMAP[x.bp].kind !== 'decor');
  return o || null;
}

/* What she wants most, right now - but once she has picked something she
   sticks with it until it is done.

   Without that she abandoned everything she started. A drive drains while
   it is being satisfied, so the moment sniffing pushed curiosity below the
   0.7 that triggered it, the next tick chose something else and walked
   away - 0.6 seconds into a 2 second sniff. She would cross the yard,
   sniff for half a second, leave, and immediately want to come back. Play
   had exactly the same fault. Commitment is what makes a drive-based mind
   look like a mind rather than a twitch. */
function dogDecide(){
  const d = S.dog, m = dogMind();
  if(!m) return null;

  /* duty interrupts anything, so it is checked before the commitment */
  const strays = (typeof strayList === 'function') ? strayList() : (S.strays || []);
  if(strays && strays.length && strays[0].x !== undefined)
    return { mode:'work', x:strays[0].x, y:strays[0].y, say:'!' };

  /* a task in progress is finished before anything else is considered */
  if(d.task){
    const t = d.task;
    if(t.mode === 'sniff'){
      const o = (S.objs||[]).find(x=>x.id === t.objId);
      if(o && !d.seen[o.id]){
        const f = footprint(BPMAP[o.bp], o.rot);
        return { mode:'sniff', x:(o.tx+f.w/2)*T, y:(o.ty+f.h+0.3)*T, obj:o };
      }
      d.task = null;
    } else if(t.mode === 'play'){
      const k = dogChildren().find(c=>c.id === t.withId);
      /* she stops when she has had enough, not when the drive first dips */
      if(k && m.play > 0.12) return { mode:'play', x:k.x+18, y:k.y+8, with:k };
      d.task = null;
    }
  }

  /* 2. exhausted, or it is night and there is a fire */
  const night = (typeof isNight === 'function') && isNight();
  if(m.energy < 0.18 || night){
    const fire = (S.objs||[]).find(o=>o.bp === 'firepit');
    if(fire){
      const f = footprint(BPMAP[fire.bp], fire.rot);
      return { mode:'sleep', x:(fire.tx+f.w/2)*T, y:(fire.ty+f.h+0.4)*T,
               say: night ? null : 'done in' };
    }
    if(m.energy < 0.18 && S.you)
      return { mode:'sleep', x:S.you.x - 26, y:S.you.y + 16, say:'done in' };
  }

  /* 3. the children, if she has play in her and they are out */
  const kids = dogChildren();
  if(m.play > 0.62 && kids.length){
    const k = kids[Math.floor(hash(S.day + kids.length) * kids.length)] || kids[0];
    d.task = { mode:'play', withId:k.id };
    return { mode:'play', x:k.x + 18, y:k.y + 8, say:'!!', with:k };
  }

  /* 4. something new on the farm she has not sniffed yet */
  if(m.curio > 0.7){
    const o = dogNovelty();
    if(o){
      const f = footprint(BPMAP[o.bp], o.rot);
      d.task = { mode:'sniff', objId:o.id };
      return { mode:'sniff', x:(o.tx+f.w/2)*T, y:(o.ty+f.h+0.3)*T, obj:o, say:'?' };
    }
  }

  /* 5. otherwise she is where you are */
  if(S.you) return { mode:'follow', x:S.you.x - 20, y:S.you.y + 12 };
  return { mode:'sit', x:d.x, y:d.y };
}

/* ---------- the tick, replacing the old one ---------- */
function tickDogMind(dt){
  const d = S.dog; if(!d) return;
  dogInit();
  const m = dogMind();

  const goal = dogDecide();
  if(!goal) return;

  /* say it, but not constantly */
  d.think = (d.think || 0) + dt;
  if(goal.say && d.think > 6 && goal.mode !== d.lastMode){
    d.think = 0;
    if(typeof speak === 'function') try{ speak(d, goal.say); }catch(e){}
  }
  d.lastMode = goal.mode;

  const dx = goal.x - d.x, dy = goal.y - d.y;
  const dist = Math.hypot(dx, dy);
  const speed = goal.mode === 'work' ? 122 : goal.mode === 'play' ? 104 : 76;
  const stopAt = goal.mode === 'sleep' ? 6 : goal.mode === 'work' ? 14
               : goal.mode === 'sniff' ? 12 : 26;

  if(dist > stopAt){
    const k = Math.min(1, (speed * dt) / dist);
    d.x += dx * k; d.y += dy * k;
    if(Math.abs(dx) > 2) d.dir = dx < 0 ? -1 : 1;
    d.state = (goal.mode === 'work' || goal.mode === 'play') ? 'run' : 'walk';
    if(goal.mode !== 'sniff') d.sniffT = 0;   /* walking away resets the sniff */
    m.energy = Math.max(0, m.energy - dt * (goal.mode === 'work' ? 0.030 : 0.014));
  } else {
    /* arrived: the drive it was serving is satisfied */
    if(goal.mode === 'sleep'){
      d.state = 'sleep';
      m.energy = Math.min(1, m.energy + dt * 0.10);
    } else if(goal.mode === 'work'){
      d.state = 'work';
      if(typeof G.roundUp === 'function'){
        G.roundUp();
        d.bond = Math.min(1, (d.bond||0.35) + 0.05);
        log(`${d.name} brought the loose stock back in.`, 'good', 'farm');
        toast(`${d.name} rounded them up`, 'good');
      }
    } else if(goal.mode === 'play'){
      d.state = 'run';
      m.play = Math.max(0, m.play - dt * 0.34);
      if(goal.with && Math.random() < dt*0.14 && typeof speak === 'function')
        try{ speak(goal.with, ['Good girl!','Fetch!','She never gets tired.'][Math.floor(Math.random()*3)]); }catch(e){}
    } else if(goal.mode === 'sniff'){
      d.state = 'sit';
      m.curio = Math.max(0, m.curio - dt * 0.5);
      /* Marked seen after a couple of seconds nose-down, NOT when curio
         happens to fall below a threshold. Gating it on the drive meant
         she could be interrupted, come back, and start the same shed
         again forever - curiosity refills, so that bar was never reliably
         crossed and nothing was ever finished. */
      d.sniffT = (d.sniffT || 0) + dt;
      if(goal.obj && d.sniffT > 2){
        d.seen[goal.obj.id] = 1;
        d.sniffT = 0;
        d.task = null;                      /* done with this one */
        m.curio = Math.max(0, m.curio - 0.35);
        if(typeof log === 'function' && Math.random() < 0.5)
          log(`${d.name} went and had a good look at the ${BPMAP[goal.obj.bp].name.toLowerCase()}.`, '', 'home');
      }
    } else {
      d.state = 'sit';
      m.energy = Math.min(1, m.energy + dt * 0.03);
      d.bond = Math.min(1, (d.bond||0.35) + dt * 0.004);   /* time together */
    }
  }

  /* drives fill on their own */
  m.play  = Math.min(1, m.play  + dt * 0.012);
  m.curio = Math.min(1, m.curio + dt * 0.008);

  paintDog();
}

/* replace the old tick outright - it is hooked into tickPeople already,
   so swapping the function it calls is enough */
if(typeof tickDog === 'function') tickDog = tickDogMind;

/* and paint her on every frame, which is what was actually missing */
if(typeof tickPeople === 'function'){
  const _tickPeopleDogPaint = tickPeople;
  tickPeople = function(dt){
    const r = _tickPeopleDogPaint.apply(this, arguments);
    try{ if(S.dog) paintDog(); }catch(e){}
    return r;
  };
}

/* ---------- she is worth asking about ---------- */
G.dogMindAudit = function(){
  const d = S.dog;
  if(!d) return { owned:false };
  const m = dogMind();
  const goal = dogDecide();
  const el = document.getElementById('dog');
  return {
    name:d.name, state:d.state,
    at:`${Math.round(d.x)},${Math.round(d.y)}`,
    elementAt: el ? el.getAttribute('transform') : 'not drawn',
    positionMatchesElement: el
      ? el.getAttribute('transform') === `translate(${n(d.x)},${n(d.y)})` : false,
    wants: goal ? goal.mode : 'nothing',
    drives: { energy:+m.energy.toFixed(2), play:+m.play.toFixed(2), curio:+m.curio.toFixed(2) },
    bond: +(d.bond||0).toFixed(2),
    thingsInvestigated: Object.keys(d.seen||{}).length,
    childrenOut: dogChildren().length,
    somethingNew: !!dogNovelty(),
  };
};
