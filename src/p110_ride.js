/* =====================================================================
   RIDING OUT, AND THE PEOPLE YOU PASS OVER

   The dragon has been sitting on its roost with opinions. Now you can get
   on it.

   AN OVERLAY, NOT THE WORLD CAMERA. The ride is drawn into its own
   full-bleed SVG above the game rather than by flying the farm camera
   around. That is a deliberate choice: the farm camera is tied to the
   world grid, the minimap, placement and the parallax backdrop, and
   bending all of that into a side-scroller would put every one of those
   at risk for a feature that wants none of them. The ride owns its own
   space, and when it ends the farm is exactly where you left it.

   IT MOVES, AND IT IS 2D. Five parallax bands - sky, far range, mid
   ridge, near hills, ground - each scrolling at its own rate, which is
   the whole trick of depth in a flat scene. Clouds and birds drift on top
   at their own speeds again.

   FIVE PLACES, AND YOU DO NOT CHOOSE. Sunrise coast, the high passes, a
   lantern-lit valley at dusk, a storm front, and a sea of cloud above
   everything. Picked at random each time you take off, so the view is a
   reason to go again.

   THE PEOPLE ARE THE POINT. Each scene is populated with folk who were
   there before you arrived and are doing something - fishing, herding,
   hanging washing, hauling a cart, sweeping a step. Each has a
   temperament, and what they do when a dragon passes over their heads
   comes out of it rather than being scripted:

     bold      stops work, waves, cheers you
     curious   shades their eyes and watches
     timid     drops what they are holding and runs for cover
     busy      does not look up. Some people have work to do.

   They remember. Pass over the same person twice and a timid one is
   already half-expecting you; a bold one greets you sooner. Frighten
   somebody and their neighbours notice, because fear spreads and cheer
   does not.

   THE MINI-GAME. Fly low and slow enough to be seen and the bold ones
   cheer - that is the score. Come in too fast or too low over a timid
   one and you scatter them, which costs you. It rewards the thing the
   scene is for: looking at it.
   ===================================================================== */

const SCENES = [
  { id:'coast', n:'the sunrise coast',
    sky:['#ffd9a0','#ff9e6a','#7a4a72'], far:'#6a4a7a', mid:'#4a3a66', near:'#2f2a4a', gnd:'#1e1a33',
    accent:'#ffd18a', water:1 },
  { id:'passes', n:'the high passes',
    sky:['#bfe0f0','#7fb0d8','#3f6a96'], far:'#8fa8c0', mid:'#5f7c9c', near:'#3d5674', gnd:'#2a3a52',
    accent:'#ffffff', snow:1 },
  { id:'lanterns', n:'the lantern valley',
    sky:['#2a2450','#4a3a72','#141026'], far:'#3a2f5c', mid:'#2a2246', near:'#1c1730', gnd:'#100c1e',
    accent:'#ffc65a', lanterns:1 },
  { id:'storm', n:'the storm front',
    sky:['#4a5260','#2f3846','#161c26'], far:'#3a4552', mid:'#2a333e', near:'#1d242c', gnd:'#12171d',
    accent:'#9fd8ff', storm:1 },
  { id:'cloudsea', n:'the sea of cloud',
    sky:['#ffeccf','#ffc9a0','#c98fa8'], far:'#e8c4d0', mid:'#cfa4bc', near:'#a87f9c', gnd:'#8a6a86',
    accent:'#fff4dc', cloudsea:1 },
];

const FOLK_JOBS = [
  {k:'fisher',  v:'casting a line'},
  {k:'herder',  v:'moving the goats'},
  {k:'washer',  v:'hanging the washing'},
  {k:'carter',  v:'hauling a cart'},
  {k:'sweeper', v:'sweeping the step'},
  {k:'child',   v:'chasing about'},
];
const TEMPERS = ['bold','curious','timid','busy'];

let RIDE = null;
function riding(){ return !!RIDE; }

/* ---------- taking off ---------- */
G.rideDragon = function(){
  if(!S.dragon){ if(typeof toast==='function') toast('You have no dragon', 'bad'); return; }
  if(riding()) return;
  const d = S.dragon;
  if(d.bond < 0.35){
    if(typeof toast==='function') toast(`${d.name} will not carry you yet — it barely knows you`, 'bad');
    if(typeof log==='function') log(`${d.name} shrugged you off. Its opinion of you is too low.`, 'bad', 'farm');
    return;
  }
  const sc = SCENES[Math.floor(Math.random()*SCENES.length)];
  RIDE = {
    scene: sc, t:0, x:0, speed:150,
    y: 0.42,                 /* height as a fraction of the view */
    vy: 0, folk: [], clouds: [], birds: [],
    cheers:0, scares:0, done:false, over:false,
    dur: 52,
  };
  for(let i=0;i<10;i++) RIDE.clouds.push({x:Math.random()*2600, y:0.06+Math.random()*0.34, s:0.5+Math.random()*1.1});
  for(let i=0;i<8;i++)  RIDE.birds.push({x:Math.random()*2600, y:0.18+Math.random()*0.3, p:Math.random()*6});
  seedFolk(0, 2600);
  rideLayer();
  if(typeof playCue === 'function') try{ playCue('dragon', RIDE.dur); }catch(e){}
  if(typeof log === 'function') log(`You climbed on. ${d.name} took you out over ${sc.n}.`, 'gold', 'farm');
  if(typeof toast === 'function') toast(`Riding out over ${sc.n}`, 'gold');
  document.addEventListener('keydown', rideKey);
  document.addEventListener('keyup', rideKeyUp);
};

function seedFolk(from, to){
  const R = RIDE; if(!R) return;
  for(let x = from + 220; x < to; x += 190 + Math.random()*240){
    const job = FOLK_JOBS[Math.floor(Math.random()*FOLK_JOBS.length)];
    R.folk.push({
      x, job, temper: TEMPERS[Math.floor(Math.random()*TEMPERS.length)],
      state:'work', t:Math.random()*6, seenYou:0, said:0,
      hue: Math.floor(Math.random()*360), phase: Math.random()*6.28,
    });
  }
}

/* ---------- controls ---------- */
let RIDE_KEYS = {};
function rideKey(e){
  if(!riding()) return;
  RIDE_KEYS[e.key] = 1;
  if(e.key === 'Escape') endRide();
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
}
function rideKeyUp(e){ RIDE_KEYS[e.key] = 0; }

/* ---------- the folk have a mind ----------
   Small, but a mind: a temperament, a memory of you, and a reaction that
   comes out of both rather than a script. Fear spreads to a neighbour;
   cheer does not, because that is how crowds work. */
function tickFolk(dt){
  const R = RIDE; if(!R) return;
  const dragonX = R.x + 260;              /* where you are along the world */
  const lowAndSlow = R.y > 0.44 && R.speed < 200;

  R.folk.forEach((f,i)=>{
    f.t += dt;
    const near = Math.abs(f.x - dragonX);
    if(near < 300 && f.state === 'work'){
      f.seenYou++;
      /* what they do about it is their temperament, softened by having
         seen you before */
      const familiar = f.seenYou > 1;
      if(f.temper === 'bold')    f.state = lowAndSlow ? 'cheer' : 'wave';
      else if(f.temper === 'curious') f.state = familiar ? 'wave' : 'watch';
      else if(f.temper === 'timid')   f.state = (lowAndSlow && !familiar) ? 'flee' : 'watch';
      else                            f.state = Math.random() < 0.25 ? 'watch' : 'work';
      f.react = 0;

      if(f.state === 'cheer' && !f.scored){ f.scored = 1; R.cheers++; }
      if(f.state === 'flee'  && !f.scored){
        f.scored = 1; R.scares++;
        /* fear spreads to whoever is closest */
        const nb = R.folk[i+1] || R.folk[i-1];
        if(nb && nb.state === 'work' && nb.temper !== 'bold'){ nb.state = 'watch'; nb.spooked = 1; }
      }
    }
    if(f.state !== 'work'){
      f.react = (f.react||0) + dt;
      if(f.state === 'flee') f.x -= 46*dt;
      if(f.react > 3.4){ f.state = 'work'; f.react = 0; }
    }
  });
  /* keep the road ahead populated */
  const furthest = R.folk.reduce((a,f)=>Math.max(a,f.x), 0);
  if(furthest < R.x + 2400) seedFolk(furthest, R.x + 3200);
  if(R.folk.length > 90) R.folk.splice(0, R.folk.length-90);
}

/* ---------- the tick ---------- */
function tickRide(dt){
  const R = RIDE; if(!R || R.over) return;
  R.t += dt;
  /* steering */
  const up = RIDE_KEYS.ArrowUp || RIDE_KEYS.w, dn = RIDE_KEYS.ArrowDown || RIDE_KEYS.s;
  const fast = RIDE_KEYS.ArrowRight || RIDE_KEYS.d, slow = RIDE_KEYS.ArrowLeft || RIDE_KEYS.a;
  R.vy += ((up?-1:0) + (dn?1:0)) * 0.9 * dt;
  R.vy *= 0.90;
  R.y = Math.max(0.14, Math.min(0.72, R.y + R.vy*dt*2.2));
  R.speed += ((fast?90:0) + (slow?-90:0)) * dt;
  R.speed = Math.max(70, Math.min(300, R.speed + (fast||slow ? 0 : (150-R.speed)*dt*0.5)));
  R.x += R.speed * dt;

  tickFolk(dt);
  R.clouds.forEach(c=>{ c.x -= (14 + c.s*10)*dt; if(c.x < R.x - 400) c.x = R.x + 2400 + Math.random()*400; });
  R.birds.forEach(b=>{ b.x -= 30*dt; b.p += dt*7; if(b.x < R.x - 300) b.x = R.x + 2200; });

  if(R.t > R.dur && !R.done){ R.done = true; endRide(); return; }
  paintRide();
}

/* ---------- drawing ---------- */
function rideLayer(){
  let el = document.getElementById('ridelay');
  if(!el){
    const host = document.getElementById('world') || document.body;
    el = document.createElementNS('http://www.w3.org/2000/svg','svg');
    el.id = 'ridelay';
    el.setAttribute('preserveAspectRatio','none');
    el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:40;';
    host.appendChild(el);
  }
  return el;
}

/* a band of hills at a given scroll rate */
function band(scrollX, rate, baseY, amp, fill, W, H, seed){
  const x0 = -(scrollX*rate) % 900;
  let d = `M${n(x0-900)} ${n(H)}`;
  for(let i=0;i<=18;i++){
    const px = x0 - 900 + i*100;
    const py = baseY*H - (hash(i*3.1+seed)*0.6 + hash(i*1.9+seed)*0.4) * amp*H;
    d += ` L${n(px)} ${n(py)}`;
  }
  d += ` L${n(x0+900)} ${n(H)} Z`;
  return `<path d="${d}" fill="${fill}"/>`;
}

function folkArt(f, sx, groundY, sc){
  const c = `hsl(${f.hue} 45% 52%)`;
  const bob = f.state === 'cheer' ? Math.sin(f.t*11)*3 : 0;
  const lean = f.state === 'flee' ? -18 : f.state === 'watch' ? -6 : 0;
  let s = `<g transform="translate(${n(sx)},${n(groundY + bob)}) rotate(${lean})">`;
  s += `<ellipse cx="0" cy="1" rx="4.4" ry="1.6" fill="#000" opacity=".22"/>`;
  s += `<rect x="-2.4" y="-9" width="4.8" height="9" rx="2" fill="${c}"/>`;
  s += `<circle cx="0" cy="-11.6" r="2.6" fill="#efc9a4"/>`;
  /* arms say what they are doing */
  if(f.state === 'cheer' || f.state === 'wave')
    s += `<path d="M-2 -7 L-6 ${n(-13-Math.abs(Math.sin(f.t*9))*3)} M2 -7 L6 -12" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`;
  else if(f.state === 'watch')
    s += `<path d="M-2 -7 L-5 -11 M2 -7 L5 -12.5" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`;
  else if(f.state === 'flee')
    s += `<path d="M-2 -7 L-7 -10 M2 -7 L6 -4" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`;
  else
    s += `<path d="M-2 -7 L-5 -3 M2 -7 L5 -3" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`;
  /* the thing they were doing */
  if(f.job.k === 'fisher' && f.state === 'work')
    s += `<line x1="5" y1="-9" x2="15" y2="-2" stroke="#d8c49a" stroke-width="0.8"/>`;
  if(f.job.k === 'washer' && f.state === 'work')
    s += `<rect x="6" y="-12" width="10" height="5" fill="#e8eef2" opacity=".8"/>`;
  if(f.job.k === 'carter' && f.state === 'work')
    s += `<rect x="5" y="-5" width="9" height="5" rx="1" fill="#8a6a45"/>`;
  s += `</g>`;
  /* what they say */
  const say = f.state === 'cheer' ? ['A dragon!','Look at it!','Hoy!'][Math.floor(f.phase)%3]
            : f.state === 'wave'  ? 'Hoy!'
            : f.state === 'flee'  ? '!!'
            : '';
  if(say) s += `<text x="${n(sx+8)}" y="${n(groundY-20)}" font-size="9" fill="${sc.accent}"
    opacity=".9" style="font-family:inherit">${say}</text>`;
  return s;
}

function paintRide(){
  const R = RIDE; if(!R) return;
  const el = rideLayer(); if(!el) return;
  const box = el.getBoundingClientRect();
  const W = Math.max(320, box.width), H = Math.max(240, box.height);
  el.setAttribute('viewBox', `0 0 ${Math.round(W)} ${Math.round(H)}`);
  const sc = R.scene;
  let s = '';

  /* sky */
  s += `<defs><linearGradient id="gRide" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${sc.sky[0]}"/><stop offset="0.55" stop-color="${sc.sky[1]}"/>
    <stop offset="1" stop-color="${sc.sky[2]}"/></linearGradient></defs>`;
  s += `<rect x="0" y="0" width="${n(W)}" height="${n(H)}" fill="url(#gRide)"/>`;

  /* sun or moon */
  s += `<circle cx="${n(W*0.78)}" cy="${n(H*0.20)}" r="${n(H*0.075)}" fill="${sc.accent}" opacity=".85"/>`;

  /* clouds, their own rate */
  R.clouds.forEach(c=>{
    const cx0 = ((c.x - R.x*0.30) % (W+600)) - 300;
    const cy0 = c.y*H, rr = 22*c.s;
    s += `<g opacity=".55"><ellipse cx="${n(cx0)}" cy="${n(cy0)}" rx="${n(rr*2)}" ry="${n(rr*0.7)}" fill="#ffffff"/>
      <ellipse cx="${n(cx0-rr*0.7)}" cy="${n(cy0-rr*0.3)}" rx="${n(rr)}" ry="${n(rr*0.6)}" fill="#ffffff"/>
      <ellipse cx="${n(cx0+rr*0.8)}" cy="${n(cy0-rr*0.2)}" rx="${n(rr*0.9)}" ry="${n(rr*0.55)}" fill="#ffffff"/></g>`;
  });

  /* the parallax bands */
  s += band(R.x, 0.10, 0.60, 0.20, sc.far,  W, H, 1);
  s += band(R.x, 0.24, 0.72, 0.16, sc.mid,  W, H, 2);
  s += band(R.x, 0.48, 0.84, 0.11, sc.near, W, H, 3);
  const groundY = H*0.90;
  s += `<rect x="0" y="${n(groundY)}" width="${n(W)}" height="${n(H-groundY)}" fill="${sc.gnd}"/>`;

  /* lanterns / snow / rain, whichever the scene wants */
  if(sc.lanterns) for(let i=0;i<16;i++){
    const lx = ((i*180 - R.x*0.48) % (W+200)) - 100;
    s += `<circle class="rlant" cx="${n(lx)}" cy="${n(groundY - 14 - (i%3)*10)}" r="3.4"
      fill="#ffc65a" opacity=".9" style="--i:${i%5}"/>`;
  }
  if(sc.storm) for(let i=0;i<40;i++){
    const rx = (i*61 + (R.t*420)%W) % W;
    s += `<line x1="${n(rx)}" y1="${n((i*37)%H)}" x2="${n(rx-6)}" y2="${n((i*37)%H + 16)}"
      stroke="#9fd8ff" stroke-opacity=".35" stroke-width="1"/>`;
  }

  /* birds */
  R.birds.forEach(b=>{
    const bx = ((b.x - R.x*0.55) % (W+300)) - 150, by = b.y*H, f = Math.sin(b.p)*3;
    s += `<path d="M${n(bx-5)} ${n(by)} q5 ${n(-3-f)} 5 0 q0 ${n(-3-f)} 5 0" fill="none"
      stroke="#2a2a33" stroke-opacity=".5" stroke-width="1.2"/>`;
  });

  /* the folk on the ground */
  R.folk.forEach(f=>{
    const sx = f.x - R.x;
    if(sx < -60 || sx > W+60) return;
    s += folkArt(f, sx, groundY, sc);
  });

  /* you and the dragon */
  const dx0 = W*0.30, dy0 = R.y*H;
  s += `<g transform="translate(${n(dx0)},${n(dy0)})">`;
  s += (typeof dragonArt === 'function' && S.dragon)
      ? dragonArt({ ...S.dragon, state:'fly' })
      : `<ellipse cx="0" cy="0" rx="20" ry="8" fill="#8a4a3a"/>`;
  /* the rider */
  s += `<g transform="translate(-2,-16)"><rect x="-2.6" y="-8" width="5.2" height="8" rx="2" fill="#c8583f"/>
    <circle cx="0" cy="-10.4" r="2.8" fill="#efc9a4"/>
    <path d="M-2 -6 L-6 -10 M2 -6 L6 -10" stroke="#c8583f" stroke-width="1.6" stroke-linecap="round"/></g>`;
  s += `</g>`;

  /* the score, and how to fly */
  s += `<g><rect x="10" y="10" width="188" height="52" rx="9" fill="#0d1410" opacity=".62"/>
    <text x="20" y="30" font-size="13" fill="#eaf3e6" style="font-family:inherit">
      ${R.cheers} greeted · ${R.scares} scattered</text>
    <text x="20" y="48" font-size="10" fill="#9fb39a" style="font-family:inherit">
      ↑↓ height · ←→ speed · fly low and slow · Esc to land</text></g>`;
  s += `<rect x="${n(W-14)}" y="10" width="4" height="${n(H*0.5)}" rx="2" fill="#ffffff" opacity=".15"/>`;
  s += `<rect x="${n(W-14)}" y="${n(10 + H*0.5*(1-R.t/R.dur))}" width="4"
    height="${n(H*0.5*(R.t/R.dur))}" rx="2" fill="${sc.accent}" opacity=".75"/>`;

  el.innerHTML = s;
}

/* ---------- landing ---------- */
function endRide(){
  const R = RIDE; if(!R || R.over) return;
  R.over = true;
  document.removeEventListener('keydown', rideKey);
  document.removeEventListener('keyup', rideKeyUp);
  const el = document.getElementById('ridelay');
  if(el) el.remove();
  RIDE_KEYS = {};

  const d = S.dragon;
  const net = R.cheers - R.scares*2;
  if(d){
    d.bond = Math.max(0, Math.min(1, d.bond + (net > 0 ? 0.05 : -0.02)));
    if(d.mind) d.mind.pride = Math.max(0, d.mind.pride - 0.4);   /* it was admired */
  }
  /* Was guarded on typeof S.charm === 'number'. There is no S.charm —
     charm is computed by stat() and S.charmGift is the field that feeds
     it, so the ride has never actually paid the charm it promises. */
  if(net > 0) S.charmGift = (S.charmGift || 0) + Math.min(6, Math.round(net/4));
  if(typeof log === 'function')
    log(`Back on the roost. ${R.cheers} greeted you over ${R.scene.n}`
      + (R.scares ? `, ${R.scares} ran for cover.` : '.'), net>0?'gold':'', 'farm');
  if(typeof toast === 'function')
    toast(R.cheers ? `${R.cheers} greeted you` : 'A quiet ride', net>0?'gold':'');
  RIDE = null;
  if(typeof ui === 'function') try{ ui(); }catch(e){}
  if(typeof save === 'function') try{ save(); }catch(e){}
}
G.endRide = endRide;

if(typeof tickPeople === 'function'){
  const _tickPeopleRide = tickPeople;
  tickPeople = function(dt){
    const r = _tickPeopleRide.apply(this, arguments);
    try{ if(riding()) tickRide(Math.min(0.05, typeof dt==='number'?dt:0.033)); }catch(e){}
    return r;
  };
}

/* ---------- the button, beside the other two ---------- */
if(typeof syncWorldButtons === 'function'){
  const _syncRide = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncRide.apply(this, arguments);
    try{
      const host = document.getElementById('zoomctl');
      if(!host) return r;
      let b = document.getElementById('ridebtn');
      if(!b){
        b = document.createElement('button');
        b.id = 'ridebtn';
        b.textContent = '🐉';
        b.title = 'Ride out';
        b.setAttribute('data-tip','<b>Ride out</b>Take the dragon somewhere. The view is different every time, and the people below will notice you.');
        b.onclick = ()=>G.rideDragon();
        host.insertBefore(b, host.firstChild);
      }
      b.style.display = S.dragon ? '' : 'none';
    }catch(e){}
    return r;
  };
}

(function rideCss(){
  const s = document.createElement('style');
  s.textContent = `
  #ridelay{ animation: rfade .5s ease; }
  @keyframes rfade{ from{ opacity:0 } to{ opacity:1 } }
  #ridebtn{ font-size:15px; line-height:1 }
  .rlant{ animation: rlan 2.4s ease-in-out infinite alternate; animation-delay: calc(var(--i)*.3s); }
  @keyframes rlan{ from{ opacity:.55 } to{ opacity:1 } }
  @media (prefers-reduced-motion: reduce){ #ridelay{ animation:none } .rlant{ animation:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.rideAudit = function(){
  if(!riding()) return { riding:false, haveDragon:!!S.dragon,
    bond: S.dragon ? +S.dragon.bond.toFixed(2) : '—',
    willCarryYou: S.dragon ? S.dragon.bond >= 0.35 : false,
    scenes: SCENES.map(s=>s.n) };
  const R = RIDE;
  const by = {}; R.folk.forEach(f=>{ by[f.state] = (by[f.state]||0)+1; });
  return {
    riding:true, scene:R.scene.n, seconds:+R.t.toFixed(1), of:R.dur,
    height:+R.y.toFixed(2), speed:Math.round(R.speed),
    folkOnTheRoute:R.folk.length, doing:by,
    greeted:R.cheers, scattered:R.scares,
    tempers: TEMPERS,
  };
};
