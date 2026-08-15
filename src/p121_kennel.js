/* =====================================================================
   A DOG HOUSE, AND SOMEWHERE OF HER OWN TO BE

   The dog has a mind, drives, a bond with you and an opinion of the
   dragon. What she has never had is an address. Read p92 and she sleeps
   by the firepit if one is lit, and otherwise lies down in the dirt
   wherever you happen to be standing — the only animal on the farm with
   nowhere to go.

   THE OBJECT. Two tiles. A pitched box with an arched mouth, a bowl, a
   chewed bone, and the grass worn off around it because that is what
   happens where a dog lives. Her name is over the door, so it is her
   kennel rather than a kennel.

   THE BEHAVIOUR is the half that matters, and it is four rules:

     a dry bed beats a fire in the wet
                    On a fine night a lit firepit still wins, because
                    that was always the nicest thing about her. In rain,
                    frost or a storm she goes home instead. She does not
                    sit out in it, and she no longer sleeps rough beside
                    you when there is a bed with her name on it.

     rest is worth more indoors
                    Sleeping in the kennel refills her energy at twice
                    the rate of sleeping on the ground, and she starts
                    each day rested. That is the reason to build it
                    rather than a decoration you are asked to like.

     somewhere to retreat to
                    While she is still wary of the dragon (p118, stage
                    'wary') and it comes near, she now has a destination
                    instead of merely backing away from one.

     and somewhere to be when you are not there
                    With no you to follow she used to stop dead in the
                    open field. She goes home.

   No new tick: everything hangs off dogDecide and the existing tickDog,
   which is also why the kennel had to wait until the dog had a mind
   worth giving a house to.

   NOT UPGRADEABLE, deliberately. The generic Mk II–IV skin bolts steel
   trim, a service light and plant tanks onto whatever it is given, which
   is right for a dairy and absurd on a dog box.
   ===================================================================== */

/* ---------- the blueprint ---------- */
(function kennelBlueprint(){
  if(typeof BP === 'undefined' || BPMAP.kennel) return;
  const bp = { id:'kennel', name:'Dog kennel', art:'kennel', cat:'animal',
    w:2, h:2, cost:140, lvl:1, kind:'bonus', charm:6,
    desc:'A pitched box, a dry bed and a water bowl. Her name goes over the door.',
    tip:'She sleeps in it rather than out in the wet, and wakes rested. No use at all without a dog.' };
  BP.push(bp); BPMAP[bp.id] = bp;
})();

/* The generic tier skin is wrong on something this small — see the header. */
if(typeof canUpgrade === 'function'){
  const _canUpgradeKennel = canUpgrade;
  canUpgrade = function(o){
    if(o && o.bp === 'kennel') return false;
    return _canUpgradeKennel.apply(this, arguments);
  };
}

/* ---------- how it looks ---------- */
if(typeof ART === 'object' && !ART.kennel){
  ART.kennel = (w, h)=>{
    const name = (S.dog && S.dog.name) ? S.dog.name : '';
    /* the box sits left of centre, the bowl beside it */
    const bx = w*0.08, bw = w*0.60;
    const top = h*0.20, eave = h*0.58, base = h*0.78;

    /* the grass is worn off where a dog lives */
    let s = patch(w, h, '#a48e60', 71, 2);
    s += ao(bx-2, top, bw+4, base-top+3, 0.30);

    /* Roof: the same two-plane idiom building() uses, so it sits in the
       scene as a roof seen from above rather than a façade. Far plane
       catches the upper-left sun, near plane falls away. */
    const ridge = top + (eave - top)*0.45;
    s += `<rect x="${n(bx-0.8)}" y="${n(top-0.8)}" width="${n(bw+1.6)}" height="${n(eave-top+1.6)}" rx="2"
      fill="#2a3238" opacity=".85"/>`;
    s += `<rect x="${n(bx)}" y="${n(top)}" width="${n(bw)}" height="${n(ridge-top)}" rx="1.4" fill="url(#gRoofRed)"/>`;
    s += `<rect x="${n(bx)}" y="${n(ridge)}" width="${n(bw)}" height="${n(eave-ridge)}" rx="1.4" fill="url(#gRoofRed)"/>`;
    s += `<rect x="${n(bx)}" y="${n(top)}" width="${n(bw)}" height="${n(ridge-top)}" fill="#ffffff" opacity=".16"/>`;
    s += `<rect x="${n(bx)}" y="${n(ridge)}" width="${n(bw)}" height="${n(eave-ridge)}" fill="#000000" opacity=".20"/>`;
    /* corrugation down the pitch */
    for(let i = bx+3; i < bx+bw-1; i += 4){
      s += `<line x1="${n(i)}" y1="${n(top+0.5)}" x2="${n(i)}" y2="${n(eave-0.5)}" stroke="#ffffff" stroke-opacity=".11" stroke-width="0.6"/>`;
      s += `<line x1="${n(i+1.5)}" y1="${n(top+0.5)}" x2="${n(i+1.5)}" y2="${n(eave-0.5)}" stroke="#000000" stroke-opacity=".10" stroke-width="0.6"/>`;
    }
    /* ridge cap, and the eave lip that shades the wall below */
    s += `<rect x="${n(bx)}" y="${n(ridge-0.9)}" width="${n(bw)}" height="1.8" rx="0.8" fill="#ffffff" opacity=".22"/>`;
    s += `<rect x="${n(bx-1.6)}" y="${n(eave-2)}" width="${n(bw+3.2)}" height="3.2" rx="1.4" fill="#8a3f30"/>`;

    /* the wall band under the eave */
    s += `<rect x="${n(bx+1.6)}" y="${n(eave+1)}" width="${n(bw-3.2)}" height="${n(base-eave)}" fill="url(#gTimber)"/>`;
    s += `<rect x="${n(bx+1.6)}" y="${n(eave+1)}" width="${n(bw-3.2)}" height="1.8" fill="#000000" opacity=".28"/>`;

    /* the mouth, arched, with straw showing at the bottom of it */
    const dw = bw*0.42, dx = bx + bw/2 - dw/2, dh = base - eave;
    s += `<path d="M${n(dx)} ${n(base)} L${n(dx)} ${n(eave+dh*0.45)}
      Q${n(dx+dw/2)} ${n(eave-0.5)} ${n(dx+dw)} ${n(eave+dh*0.45)}
      L${n(dx+dw)} ${n(base)} Z" fill="#241a12"/>`;
    s += `<rect x="${n(dx+0.8)}" y="${n(base-2.2)}" width="${n(dw-1.6)}" height="2.2" fill="url(#gStraw)" opacity=".85"/>`;

    /* her name over the door */
    if(name){
      const nw = Math.max(16, Math.min(bw-6, name.length*4.6 + 6));
      /* on the near plane, below the ridge, where it faces you */
      const ny = ridge + (eave - ridge)*0.18;
      s += `<rect x="${n(bx+bw/2-nw/2)}" y="${n(ny)}" width="${n(nw)}" height="7" rx="1.6"
        fill="#e8d8b2" stroke="#8a6b45" stroke-width="0.7"/>`;
      s += `<text x="${n(bx+bw/2)}" y="${n(ny+5.2)}" text-anchor="middle"
        font-size="5.2" fill="#4b3520" style="font-family:inherit">${esc(name)}</text>`;
    }

    /* the water bowl, on its own contact shadow */
    const wx = w*0.85, wy = h*0.66;
    s += `<ellipse cx="${n(wx+0.8)}" cy="${n(wy+1.2)}" rx="6.2" ry="3.2" fill="url(#gShadow)" opacity=".55"/>`;
    s += `<ellipse cx="${n(wx)}" cy="${n(wy)}" rx="6" ry="3.1" fill="#7d6a55"/>`;
    s += `<ellipse cx="${n(wx)}" cy="${n(wy-0.3)}" rx="4.4" ry="2.1" fill="url(#gWater)"/>`;
    s += `<ellipse cx="${n(wx-1.4)}" cy="${n(wy-1)}" rx="1.6" ry="0.7" fill="#ffffff" opacity=".45"/>`;

    /* a bone she has left out */
    const kx = w*0.20, ky = h*0.90;
    s += `<g transform="translate(${n(kx)},${n(ky)}) rotate(-18)">
      <rect x="-4" y="-1" width="8" height="2" rx="1" fill="#e6ddc8"/>
      <circle cx="-4.4" cy="-1.4" r="1.5" fill="#e6ddc8"/><circle cx="-4.4" cy="1.2" r="1.5" fill="#e6ddc8"/>
      <circle cx="4.4" cy="-1.4" r="1.5" fill="#efe7d5"/><circle cx="4.4" cy="1.2" r="1.5" fill="#efe7d5"/></g>`;
    return s;
  };
}

/* ---------- where home is ---------- */
function kennelObj(){ return (S.objs || []).find(o=>o.bp === 'kennel') || null; }
/* the mouth of it, which is where she actually lies */
function kennelSpot(){
  const k = kennelObj(); if(!k) return null;
  const f = footprint(BPMAP[k.bp], k.rot);
  return { x:(k.tx + f.w/2)*T, y:(k.ty + f.h + 0.2)*T, obj:k };
}
/* weather she will not lie out in */
function kennelWeather(){ return ['rain','storm','frost'].includes(S.weather); }

/* ---------- the four rules ---------- */
if(typeof dogDecide === 'function'){
  const _decideKennel = dogDecide;
  dogDecide = function(){
    const goal = _decideKennel.apply(this, arguments);
    try{
      const home = kennelSpot(); if(!home) return goal;
      const d = S.dog; if(!d) return goal;

      /* duty still beats having a house — a dog that ignores loose stock
         because it is raining is not a farm dog */
      if(goal && goal.mode === 'work') return goal;

      /* 1. somewhere to retreat to, while the dragon is still a stranger */
      if(S.dragon && typeof dogDragonStage === 'function' && dogDragonStage() === 0
         && S.dragon.x !== undefined){
        const gap = Math.hypot(d.x - S.dragon.x, d.y - S.dragon.y);
        if(gap < 170 && Math.hypot(d.x - home.x, d.y - home.y) > 10)
          return { mode:'sleep', x:home.x, y:home.y, say:'…', home:1, from:'dragon' };
      }

      /* 2. her own bed, unless it is a fine night and the fire is lit */
      if(goal && goal.mode === 'sleep'){
        const fire = (S.objs || []).find(o=>o.bp === 'firepit');
        const night = (typeof isNight === 'function') && isNight();
        const fireIsBetter = fire && night && !kennelWeather();
        if(!fireIsBetter) return { mode:'sleep', x:home.x, y:home.y, say:goal.say, home:1 };
      }

      /* 3. she will not stand out in the weather with a bed going spare */
      if(goal && (goal.mode === 'follow' || goal.mode === 'sit') && kennelWeather())
        return { mode:'sleep', x:home.x, y:home.y, home:1, from:'weather' };

      /* 4. and she goes home rather than stopping dead in a field */
      if(goal && goal.mode === 'sit' && !S.you)
        return { mode:'sleep', x:home.x, y:home.y, home:1 };
    }catch(e){}
    return goal;
  };
}

/* ---------- a dry bed is worth more than the ground ----------
   tickDog is the live tick (p92 assigned tickDogMind into it, and p118
   wrapped that), so this wraps tickDog rather than tickDogMind — wrapping
   the inner name would leave the wrapper unreachable. */
if(typeof tickDog === 'function'){
  const _tickDogKennel = tickDog;
  tickDog = function(dt){
    const r = _tickDogKennel.apply(this, arguments);
    try{
      const d = S.dog; if(!d) return r;
      const home = kennelSpot();
      if(!home){ d.inKennel = 0; d.homeT = 0; return r; }
      const atHome = Math.hypot(d.x - home.x, d.y - home.y) < 14 && d.state === 'sleep';
      d.inKennel = atHome ? 1 : 0;
      if(!atHome){ d.homeT = 0; return r; }

      /* the base tick already gave her 0.10/s for sleeping; this doubles
         it, so a night in the kennel is worth two on the ground */
      const m = (typeof dogMind === 'function') ? dogMind() : null;
      if(m) m.energy = Math.min(1, m.energy + dt * 0.10);
      d.homeT = (d.homeT || 0) + dt;
      if(!d.kennelKnown && d.homeT > 2){
        d.kennelKnown = 1;
        if(typeof log === 'function')
          log(`${d.name} has taken to the kennel. It is hers now.`, 'good', 'home');
      }
    }catch(e){}
    return r;
  };
}

/* she wakes rested, and a dog with a home settles */
if(typeof advanceDay === 'function'){
  const _advanceDayKennel = advanceDay;
  advanceDay = function(){
    const r = _advanceDayKennel.apply(this, arguments);
    try{
      if(S.dog && kennelObj()){
        const m = (typeof dogMind === 'function') ? dogMind() : null;
        if(m) m.energy = 1;
        S.dog.bond = Math.min(1, (S.dog.bond === undefined ? 0.35 : S.dog.bond) + 0.01);
      }
    }catch(e){}
    return r;
  };
}

/* the name over the door has to change when you rename her */
if(typeof G.renameDog === 'function'){
  const _renameKennel = G.renameDog;
  G.renameDog = function(){
    const r = _renameKennel.apply(this, arguments);
    try{ if(kennelObj() && typeof render === 'function') render(); }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.kennelAudit = function(){
  const k = kennelObj(), d = S.dog;
  if(!k) return { built:false, price:140,
    wouldChange:'she sleeps by the fire, or rough beside you' };
  if(!d) return { built:true, dog:false, note:'a kennel and no dog in it' };
  const home = kennelSpot();
  const goal = (typeof dogDecide === 'function') ? dogDecide() : null;
  const m = (typeof dogMind === 'function') ? dogMind() : null;
  return {
    built:true, dog:d.name,
    at:`${Math.round(home.x)},${Math.round(home.y)}`,
    inKennelNow: !!d.inKennel,
    wants: goal ? (goal.home ? 'the kennel' + (goal.from ? ` (${goal.from})` : '') : goal.mode) : 'nothing',
    weather: S.weather + (kennelWeather() ? ' — she goes in' : ' — she stays out'),
    firepitOnFarm: (S.objs||[]).some(o=>o.bp === 'firepit'),
    energy: m ? +m.energy.toFixed(2) : '—',
    bond: +(d.bond || 0).toFixed(2),
    hasUsedIt: !!d.kennelKnown,
    upgradeable: (typeof canUpgrade === 'function') ? canUpgrade(k) : '—',
  };
};
