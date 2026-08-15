/* =====================================================================
   A FARM DOG

   Everything on this farm has a job. The dog does not. She follows you
   round, lies down when you stop, goes and fetches whatever has got out,
   and sleeps by the fire when there is one lit. That is the whole
   feature, and it is the point of it.

   She hooks into three things that already exist: S.you for somebody to
   follow, S.strays for something to fetch, and the seatable firepit from
   the bench work for somewhere to sleep. Nothing new is simulated - she
   moves on the same per-frame tick everything else does, and she does not
   pathfind, because a dog that clips a hedge corner looks more like a dog
   than one that walks the long way round.

   She costs $180 from Animals, once. After that she is just there.
   ===================================================================== */

function dogInit(){
  if(!S.dog) return null;
  if(S.dog.x === undefined){
    const y = (typeof S.you === 'object' && S.you) ? S.you : {x:(FARM.x+3)*T, y:(FARM.y+3)*T};
    S.dog.x = y.x - 18; S.dog.y = y.y + 10;
  }
  if(!S.dog.name) S.dog.name = ['Moss','Pip','Fly','Nell','Tam','Bracken'][Math.floor(Math.random()*6)];
  if(S.dog.dir === undefined) S.dog.dir = 1;
  if(S.dog.state === undefined) S.dog.state = 'follow';
  if(S.dog.t === undefined) S.dog.t = 0;
  return S.dog;
}

G.buyDog = function(){
  if(S.dog) return toast('You already have a dog','bad');
  if(S.cash < 180) return toast('A pup is $180','bad'), sfx('error');
  S.cash -= 180;
  S.dog = {};
  dogInit();
  sfx('build');
  toast(`${S.dog.name} has come home with you`,'gold');
  log(`${S.dog.name} arrived — a farm dog. She will not be much help for a while.`,'gold','home');
  render(); ui(); if(typeof renderBuild==='function') renderBuild(); G.save();
};
G.renameDog = function(v){ if(S.dog){ S.dog.name = (v||'').trim() || S.dog.name; G.save(); } };

/* ---------- where she wants to be ---------- */
function dogTarget(){
  const d = dogInit(); if(!d) return null;

  /* 1. anything out of its pen is the job */
  const strays = (typeof strayList === 'function') ? strayList() : (S.strays || []);
  if(strays && strays.length){
    const s = strays[0];
    if(s && s.x !== undefined) return {x:s.x, y:s.y, mode:'work', stray:s};
  }
  /* 2. a lit firepit at night is better than anything */
  const night = (typeof isNight === 'function') && isNight();
  if(night){
    const fire = (S.objs||[]).find(o=>o.bp === 'firepit');
    if(fire){
      const f = footprint(BPMAP[fire.bp], fire.rot);
      return {x:(fire.tx + f.w/2)*T, y:(fire.ty + f.h + 0.4)*T, mode:'sleep'};
    }
  }
  /* 3. otherwise, wherever you are */
  if(S.you) return {x:S.you.x - 20, y:S.you.y + 12, mode:'follow'};
  return null;
}

/* ---------- movement, on the frame tick ---------- */
function tickDog(dt){
  const d = dogInit(); if(!d) return;
  const t = dogTarget(); if(!t) return;
  d.t = (d.t || 0) + dt;

  const dx = t.x - d.x, dy = t.y - d.y;
  const dist = Math.hypot(dx, dy);
  /* she trots to heel and sprints at a job */
  const speed = t.mode === 'work' ? 118 : 74;
  const stopAt = t.mode === 'sleep' ? 6 : t.mode === 'work' ? 14 : 26;

  if(dist > stopAt){
    const k = Math.min(1, (speed * dt) / dist);
    d.x += dx * k; d.y += dy * k;
    if(Math.abs(dx) > 2) d.dir = dx < 0 ? -1 : 1;
    d.state = t.mode === 'work' ? 'run' : 'walk';
  } else {
    d.state = t.mode === 'sleep' ? 'sleep' : (t.mode === 'work' ? 'work' : 'sit');
    /* reaching a stray sends it home, which is the one useful thing she does */
    if(t.mode === 'work' && t.stray){
      /* same per-frame spam guard as p92 — this path is superseded but
         must not be able to bring the problem back */
      d.roundCool = Math.max(0, (d.roundCool || 0) - 0.05);
      if(typeof G.roundUp === 'function' && d.roundCool <= 0){
        G.roundUp();
        d.roundCool = 4;
        log(`${d.name} brought the loose stock back in.`, 'good', 'farm');
        toast(`${d.name} rounded them up`,'good');
      }
    }
  }
}

/* ---------- how she looks ---------- */
function dogArt(){
  const d = dogInit(); if(!d) return '';
  const sleeping = d.state === 'sleep';
  const sc = 1;
  const body = sleeping
    ? `<ellipse cx="0" cy="2" rx="9" ry="4.6" fill="#8a6a4a"/>
       <ellipse cx="-1.5" cy="0.6" rx="6.5" ry="3.2" fill="#a07d56" opacity=".85"/>
       <circle cx="7.5" cy="0.6" r="3.8" fill="#8a6a4a"/>
       <ellipse cx="10.6" cy="1.4" rx="2.4" ry="1.5" fill="#6d5238"/>
       <path d="M5.6 -2.4 q2.4 -3 4 -0.6" fill="none" stroke="#6d5238" stroke-width="2" stroke-linecap="round"/>
       <path class="dogtail" d="M-8.6 1 q-4.6 -1.4 -3.4 -4.4" fill="none" stroke="#8a6a4a" stroke-width="2.2" stroke-linecap="round"/>`
    : `<ellipse cx="0" cy="0" rx="7.6" ry="4.4" fill="#8a6a4a"/>
       <ellipse cx="-1.2" cy="-1.2" rx="5.6" ry="2.8" fill="#a07d56" opacity=".8"/>
       <rect x="-4.6" y="3" width="2" height="4.4" rx="1" fill="#7a5c3f"/>
       <rect x="-1" y="3.2" width="2" height="4.2" rx="1" fill="#8a6a4a"/>
       <rect x="2.6" y="3" width="2" height="4.4" rx="1" fill="#7a5c3f"/>
       <rect x="5" y="3.2" width="2" height="4.2" rx="1" fill="#8a6a4a"/>
       <circle cx="7.4" cy="-3.2" r="3.6" fill="#8a6a4a"/>
       <ellipse cx="10.4" cy="-2.4" rx="2.4" ry="1.6" fill="#6d5238"/>
       <circle cx="11.9" cy="-2.8" r="0.7" fill="#2b2118"/>
       <circle cx="8.2" cy="-4" r="0.7" fill="#2b2118"/>
       <path d="M5.4 -6 q1.2 -3.4 3.2 -1.4 z" fill="#6d5238"/>
       <path class="dogtail" d="M-7.2 -1.4 q-4.4 -2.2 -2.6 -5.4" fill="none" stroke="#8a6a4a" stroke-width="2.2" stroke-linecap="round"/>`;
  return `<g id="dog" class="dog ${d.state}" transform="translate(${n(d.x)},${n(d.y)})">
    <ellipse cx="1.6" cy="7.4" rx="8" ry="2.6" fill="url(#gShadow)" opacity=".55"/>
    <g transform="scale(${d.dir},1)">${body}</g>
    <text class="nlab" y="-16" text-anchor="middle">${d.name}</text></g>`;
}

/* drawn with the people, so she sits in the same depth order */
if(typeof render === 'function'){
  const _renderDog = render;
  render = function(){
    const r = _renderDog.apply(this, arguments);
    try{
      const old = document.getElementById('dog');
      if(old) old.remove();
      if(S.dog){
        const fg = document.getElementById('fg');
        const html = dogArt();
        if(fg && html){
          const tmp = document.createElementNS('http://www.w3.org/2000/svg','g');
          tmp.innerHTML = html;
          fg.appendChild(tmp.firstChild);
        }
      }
    }catch(e){}
    return r;
  };
}

/* she moves on the same tick as everything else that walks */
if(typeof tickPeople === 'function'){
  const _tickPeopleDog = tickPeople;
  tickPeople = function(dt){
    const r = _tickPeopleDog.apply(this, arguments);
    try{ if(S.dog) tickDog(typeof dt === 'number' ? Math.min(0.1, dt) : 0.05); }catch(e){}
    return r;
  };
}

/* ---------- buying her, from the Animals tab ---------- */
/* Hooked to renderBuild(), not ui(). The build list is rebuilt by
   G.cat() -> renderBuild(), which never calls ui(), so a paint hung off
   ui() ran on load and then never again when you switched to Animals -
   which is exactly why the dog was not there. The selected category is
   the global curCat, and Animals is 'animal', not the button's label. */
function dogCard(){
  const list = document.getElementById('buildList');
  if(!list) return;
  if(typeof curCat !== 'undefined' && curCat !== 'animal') return;
  if(list.querySelector('#dogcard')) return;
  const card = document.createElement('div');
  card.id = 'dogcard';
  /* deliberately NOT .bitem - that class is a grid built for an icon, a
     name and a price, and it squeezed this into a two-word column */
  card.style.cssText = 'display:block;padding:10px;border-bottom:1px solid var(--line);'
    + 'background:rgba(255,255,255,.03)';
  card.innerHTML = S.dog
    ? `<div style="font-weight:700">${S.dog.name}</div>
       <div class="muted" style="font-size:12px">Your dog. She follows you, brings back anything
       that gets out, and sleeps by the fire.</div>`
    : `<div style="display:flex;gap:8px;align-items:baseline"><b style="flex:1">A farm dog</b><span class="tk">${fmt(180)}</span></div>
       <div class="muted" style="font-size:12px;margin:2px 0 6px">Follows you round, brings back whatever
       has got out, sleeps by the fire. No other use whatsoever.</div>
       <button class="btn wide" ${S.cash<180?'disabled':''} onclick="G.buyDog()">Take her home</button>`;
  /* first, not last. Appended, it sat below fifteen pens and off the
     bottom of the panel, which is a feature nobody can find. */
  if(list.firstChild) list.insertBefore(card, list.firstChild);
  else list.appendChild(card);
}
if(typeof renderBuild === 'function'){
  const _renderBuildDog = renderBuild;
  renderBuild = function(){
    const r = _renderBuildDog.apply(this, arguments);
    try{ dogCard(); }catch(e){}
    return r;
  };
}
/* and once on load, in case Animals is already the open tab */
setTimeout(()=>{ try{ dogCard(); }catch(e){} }, 800);

(function dogCss(){
  const s = document.createElement('style');
  s.textContent = `
  .dog .dogtail{ transform-box:fill-box; transform-origin:100% 100%;
    animation: dogWag 0.5s ease-in-out infinite; }
  .dog.sleep .dogtail{ animation-duration:2.4s; }
  .dog.run .dogtail{ animation-duration:0.28s; }
  @keyframes dogWag{ 0%,100%{ transform:rotate(-16deg) } 50%{ transform:rotate(16deg) } }
  .dog.sleep{ opacity:.95 }
  @media(prefers-reduced-motion:reduce){ .dog .dogtail{ animation:none } }`;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.dogAudit = function(){
  const d = S.dog ? dogInit() : null;
  if(!d) return { owned:false, price:180 };
  const t = dogTarget();
  return {
    owned:true, name:d.name, state:d.state,
    at:`${Math.round(d.x)},${Math.round(d.y)}`,
    wants: t ? t.mode : 'nothing',
    strays: (typeof strayList === 'function' ? strayList().length : (S.strays||[]).length),
    firepitOnFarm: (S.objs||[]).some(o=>o.bp==='firepit'),
    inDom: !!document.getElementById('dog'),
  };
};
