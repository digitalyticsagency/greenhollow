/* =====================================================================
   TWO FIXES, FIVE FUN BUTTONS, AND GUESTS WHO ACTUALLY STAY

   Fix one: entering the code only opened a market on the transition
   from locked to unlocked. Since the unlock flag persists, anyone
   entering the code a second time — or on any later visit — got
   nothing at all. That is the "market not opening when code given".

   Fix two: the panel fold button sat at the top-right of the panel,
   directly over its header, covering the title. It is now a slim tab
   on the panel edge, clear of everything.

   Then: five weather buttons that fire the matching animation, and
   paying guests who stay in your tents and domes, wander about, talk,
   and can be watched with the roof off.
   ===================================================================== */

/* ---------- fix 1: the code always opens a market ---------- */
if(typeof G.tryUnlock === 'function'){
  const _tryUnlockAlways = G.tryUnlock;
  G.tryUnlock = function(){
    const v = ((document.getElementById('unlockin')||{}).value || '').trim();
    const correct = (typeof UNLOCK_CODE === 'string') && v === UNLOCK_CODE;
    const r = _tryUnlockAlways.apply(this, arguments);
    /* Do not gate this on the lock transition: the flag persists, so a
       returning player entering the code would otherwise get nothing. */
    if(correct && typeof marketInit === 'function'){
      marketInit();
      if(!S.market.active){
        S.market.next = S.day;
        if(typeof marketStart === 'function') marketStart();
      } else if(typeof G.openMarket === 'function'){
        setTimeout(()=>G.openMarket(), 300);
      }
    }
    return r;
  };
}

/* ---------- fix 2: the fold tab clears the panel header ---------- */
(function foldTabCss(){
  const s = document.createElement('style');
  s.textContent = `
  @media(min-width:981px){
    /* A slim tab centred on the panel's inner edge. The old position -
       top-right, 8px down - sat straight over the panel header. */
    .foldbtn{ top:50% !important; transform:translateY(-50%);
      width:13px !important; height:56px !important; border-radius:5px;
      display:flex; align-items:center; justify-content:center;
      font-size:11px; opacity:.55; }
    .foldbtn:hover{ opacity:1; }
    .foldbtn-left { right:2px !important; }
    .foldbtn-right{ left:2px  !important; }
  }`;
  document.head.appendChild(s);
})();

/* ---------- five weather buttons ---------- */
const FUN = [
  {k:'sun',   label:'☀️', name:'Clear',     tip:'Blue sky and a high sun.'},
  {k:'rain',  label:'🌧️', name:'Rain',      tip:'Steady rain, splashes on the ground.'},
  {k:'storm', label:'⛈️', name:'Storm',     tip:'Wind, sheets of rain and lightning. The family run inside.'},
  {k:'frost', label:'❄️', name:'Snow',      tip:'Drifting snow and a cold light.'},
  {k:'heat',  label:'🔥', name:'Heat',      tip:'Heat haze rippling off the paddocks.'},
];

G.setFun = function(k){
  if(!WEATHERS[k]){ toast('Unknown weather','bad'); return; }
  S.weather = k;
  if(typeof syncWeatherFx === 'function') syncWeatherFx();
  if(typeof tintClouds === 'function') tintClouds();
  if(typeof SND !== 'undefined' && SND.weather) SND.weather(k);
  const f = FUN.find(x=>x.k===k);
  toast(f ? f.name : k, 'good');
  if(typeof log === 'function') log(`Weather set to ${(f?f.name:k).toLowerCase()}.`, '', 'weather');
  /* a storm should actually do the storm thing straight away */
  if(k === 'storm' && typeof lightningStrike === 'function'){
    setTimeout(lightningStrike, 900);
  }
  paintFun();
  if(typeof sfx === 'function') sfx('click');
  render();
};

function paintFun(){
  document.querySelectorAll('.funbtn').forEach(b=>
    b.classList.toggle('on', b.dataset.k === S.weather));
}

setTimeout(()=>{
  const bar = document.querySelector('.tbtn') && document.querySelector('.tbtn').parentElement;
  if(!bar || document.getElementById('funbar')) return;
  const wrap = document.createElement('span');
  wrap.id = 'funbar';
  FUN.forEach(f=>{
    const b = document.createElement('button');
    b.className = 'tbtn funbtn';
    b.dataset.k = f.k;
    b.textContent = f.label;
    b.title = f.name;
    b.dataset.tip = `<b>${f.name}</b>${f.tip}`;
    b.addEventListener('click', ()=>G.setFun(f.k));
    wrap.appendChild(b);
  });
  bar.insertBefore(wrap, bar.firstChild);
  paintFun();
  setInterval(paintFun, 2000);
}, 600);

/* ---------- guests who stay ---------- */
/* Tourism buildings earn money; now they visibly hold somebody. Guests
   appear when you have somewhere to put them, wander round their tent,
   and say what they are enjoying. */
const GUEST_NAMES = ['Marta','Ellis','Jun','Priya','Tomas','Alina','Owen','Sana','Ravi','Beth'];
const GUEST_SHIRTS = ['#c47fa8','#5fb0d4','#e8a33d','#8f6fc4','#6bbf7a','#d4726a'];

const GUEST_LINES = {
  day:   ['Look at that view.','Best sleep I have had in years.','Is that the sea?',
          'Smells like rain coming.','The birds start early here.'],
  night: ['So many stars.','Cosy in here.','Listen — nothing at all.','Fire is lovely.'],
  storm: ['Glad we are under cover!','Hear that thunder?','Cosier for it, honestly.'],
  spa:   ['This water is perfect.','Ten more minutes.','Worth every cent.'],
};

function guestHomes(){
  return (S.objs||[]).filter(o=>{
    const a = (BPMAP[o.bp]||{}).art || '';
    return a === 'glamping' || a === 'dome';
  });
}

function guestsInit(){
  if(!S.guests) S.guests = [];
  const homes = guestHomes();
  /* one guest per tent or dome, and they leave if you remove it */
  S.guests = S.guests.filter(g => homes.some(h => h.id === g.home));
  homes.forEach((h, i)=>{
    if(S.guests.some(g => g.home === h.id)) return;
    const f = footprint(BPMAP[h.bp], h.rot);
    S.guests.push({
      id: 'gst' + h.id,
      home: h.id,
      name: GUEST_NAMES[(S.guests.length + i) % GUEST_NAMES.length],
      shirt: GUEST_SHIRTS[(S.guests.length + i) % GUEST_SHIRTS.length],
      x: (h.tx + f.w*0.5)*T, y: (h.ty + f.h + 0.4)*T,
      dir: 1, t: Math.random()*4, wx:0, wy:0, said: 0,
    });
  });
}

/* where a guest wants to be right now */
function guestGoal(g){
  const h = (S.objs||[]).find(o=>o.id === g.home);
  if(!h) return null;
  const f = footprint(BPMAP[h.bp], h.rot);
  const cx = (h.tx + f.w*0.5)*T, cy = (h.ty + f.h*0.5)*T;
  const night = (typeof isNight === 'function') && isNight();
  const storm = S.weather === 'storm';
  /* inside at night or in a storm, out on the deck otherwise */
  if(night || storm) return {x:cx, y:cy - f.h*T*0.12, act:'inside', inside:true};
  /* the spa, if this one is upgraded enough to have one */
  if((h.tier||0) >= 2 && Math.random() < 0.004)
    return {x:cx + f.w*T*0.26, y:cy + f.h*T*0.30, act:'in the spa', inside:false};
  return {x:cx + (g.wx||0), y:cy + f.h*T*0.34 + (g.wy||0), act:'on the deck', inside:false};
}

function tickGuests(dt){
  guestsInit();
  const night = (typeof isNight === 'function') && isNight();
  (S.guests||[]).forEach(g=>{
    const goal = guestGoal(g);
    if(!goal) return;
    g.act = goal.act; g.inside = goal.inside;
    const dx = goal.x - g.x, dy = goal.y - g.y, d = Math.hypot(dx, dy);
    if(d > 3){
      const spd = 42*dt;
      g.x += dx/d*Math.min(d, spd); g.y += dy/d*Math.min(d, spd);
      if(Math.abs(dx) > 0.4) g.dir = dx > 0 ? 1 : -1;
    } else {
      g.t = (g.t||0) + dt;
      if(g.t > 4){ g.t = 0; g.wx = (Math.random()-0.5)*30; g.wy = (Math.random()-0.5)*18; }
    }
    /* they talk now and then, about what is actually happening */
    g.said = (g.said||0) - dt;
    if(g.said <= 0 && Math.random() < dt*0.10){
      g.said = 18 + Math.random()*22;
      const pool = S.weather === 'storm' ? GUEST_LINES.storm
                 : g.act === 'in the spa' ? GUEST_LINES.spa
                 : night ? GUEST_LINES.night : GUEST_LINES.day;
      if(typeof speak === 'function') speak(g, pool[Math.floor(Math.random()*pool.length)]);
    }
  });
  paintGuests();
}

function guestLayer(){
  guestsInit();
  if(!(S.guests||[]).length) return '';
  return `<g id="guests">` + S.guests.map(g=>
    `<g class="npc guest" data-g="${g.id}" transform="translate(${n(g.x)},${n(g.y)})">
      <g class="youbob"><g transform="scale(${g.dir},1)">${person(0,0,1.0,g.shirt,null)}</g></g>
      <text class="nlab" y="-24" text-anchor="middle">${g.name}</text></g>`).join('') + `</g>`;
}

function paintGuests(){
  (S.guests||[]).forEach(g=>{
    const el = document.querySelector(`[data-g="${g.id}"]`);
    if(!el) return;
    el.setAttribute('transform', `translate(${n(g.x)},${n(g.y)})`);
    const flip = el.querySelector('.youbob > g');
    if(flip) flip.setAttribute('transform', `scale(${g.dir},1)`);
    /* under a roof you cannot see them, unless the roof is off */
    const hidden = g.inside && !SET('roofOff');
    el.style.opacity = hidden ? '0' : '';
  });
}

/* ---------- roof access for tents and domes ---------- */
/* The house cutaway already exists; this gives the tourism buildings the
   same treatment so lifting the roof shows the guest in bed. */
function tentInteriors(){
  if(!SET('roofOff')) return '';
  let s = '';
  guestHomes().forEach(h=>{
    const bp = BPMAP[h.bp], f = footprint(bp, h.rot);
    const w = f.w*T, hh = f.h*T;
    const X = h.tx*T, Y = h.ty*T;
    const dome = (bp.art === 'dome');
    s += `<g class="tentcut" transform="translate(${n(X)},${n(Y)})">`;
    /* floor */
    s += `<rect x="${n(w*0.10)}" y="${n(hh*0.10)}" width="${n(w*0.80)}" height="${n(hh*0.52)}"
      rx="${dome ? n(Math.min(w,hh)*0.30) : 4}" fill="#c9a878"/>`;
    for(let i=1;i<5;i++)
      s += `<line x1="${n(w*0.10)}" y1="${n(hh*(0.10+i*0.104))}" x2="${n(w*0.90)}" y2="${n(hh*(0.10+i*0.104))}"
        stroke="#ab8a5f" stroke-width="0.5" opacity=".65"/>`;
    /* a made bed */
    s += `<rect x="${n(w*0.18)}" y="${n(hh*0.16)}" width="${n(w*0.34)}" height="${n(hh*0.30)}" rx="2" fill="#8a6a45"/>`;
    s += `<rect x="${n(w*0.19)}" y="${n(hh*0.22)}" width="${n(w*0.32)}" height="${n(hh*0.22)}" rx="1.6" fill="#7f8fa6"/>`;
    s += `<rect x="${n(w*0.19)}" y="${n(hh*0.17)}" width="${n(w*0.32)}" height="${n(hh*0.06)}" rx="1.6" fill="#fbfdff"/>`;
    /* a rug, a lamp and a bag */
    s += `<ellipse cx="${n(w*0.68)}" cy="${n(hh*0.34)}" rx="${n(w*0.14)}" ry="${n(hh*0.11)}" fill="#9c5b52" opacity=".9"/>`;
    s += `<circle class="fx-bulb" cx="${n(w*0.80)}" cy="${n(hh*0.18)}" r="${n(hh*0.035)}" fill="#ffe9a8"/>`;
    s += `<rect x="${n(w*0.62)}" y="${n(hh*0.48)}" width="${n(w*0.11)}" height="${n(hh*0.09)}" rx="1.4" fill="#6b5642"/>`;
    /* outline so it reads as a cutaway */
    s += `<rect x="${n(w*0.10)}" y="${n(hh*0.10)}" width="${n(w*0.80)}" height="${n(hh*0.52)}"
      rx="${dome ? n(Math.min(w,hh)*0.30) : 4}" fill="none" stroke="#f2e9d8" stroke-width="1.4" opacity=".9"/>`;
    s += `</g>`;
  });
  return s;
}

/* guests and their interiors ride with the people layer */
const _peopleLayerGuests = peopleLayer;
peopleLayer = function(){
  return tentInteriors() + _peopleLayerGuests.apply(this, arguments) + guestLayer();
};

const _tickPeopleGuests = tickPeople;
tickPeople = function(dt){
  const r = _tickPeopleGuests.apply(this, arguments);
  if(S && S.speed !== 0) tickGuests(dt);
  return r;
};

(function funCss(){
  const s = document.createElement('style');
  s.textContent = `
  #funbar{display:inline-flex;gap:2px;margin-right:6px;}
  .funbtn{font-size:13px;padding:3px 6px;min-width:26px;line-height:1.2;}
  .funbtn.on{background:linear-gradient(180deg,#4d8f3c,#3a6f2c);border-color:#5fae48;}
  #guests .guest{transition:opacity .5s ease;}
  .tentcut{pointer-events:none;}
  `;
  document.head.appendChild(s);
})();
