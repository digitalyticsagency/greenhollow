/* =====================================================================
   WEATHER, PROPERLY — the CSS version drew endless parallel lines across
   the whole screen, which reads as scratches. This is a particle system
   on a canvas: discrete drops at three depths, splashes where they land,
   wind-driven angle, gusts, wet ground, drifting snow and heat haze.
   ===================================================================== */

const WX = {
  canvas:null, ctx:null, w:0, h:0, dpr:1,
  drops:[], splashes:[], flakes:[], motes:[], gusts:[],
  kind:'', intensity:0, target:0, angle:0.22, gustT:0, running:false,
};

function wxEnsure(){
  const world = document.getElementById('world');
  if(!world) return false;
  if(!WX.canvas){
    const c = document.createElement('canvas');
    c.id = 'wxcanvas';
    c.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:21;';
    world.appendChild(c);
    WX.canvas = c; WX.ctx = c.getContext('2d');
    /* the old CSS layer is retired */
    const legacy = document.getElementById('wxfx'); if(legacy) legacy.remove();
  }
  /* measure the container, never the canvas itself: reading the canvas's own
     rect after setting its intrinsic size feeds back and inflates it */
  const w = Math.min(4000, Math.max(0, world.clientWidth));
  const h = Math.min(4000, Math.max(0, world.clientHeight));
  if(w < 8 || h < 8) return false;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if(WX.w !== w || WX.h !== h || WX.dpr !== dpr){
    WX.w = w; WX.h = h; WX.dpr = dpr;
    WX.canvas.width  = Math.round(w*dpr);
    WX.canvas.height = Math.round(h*dpr);
    WX.ctx.setTransform(dpr,0,0,dpr,0,0);
    wxPopulate();
  }
  return true;
}

/* ---------------- particles ---------------- */
function makeDrop(storm){
  /* three depth bands: far drops are short, faint and slow */
  const band = Math.random();
  const depth = band < 0.45 ? 0 : band < 0.8 ? 1 : 2;
  const base = storm ? 1.5 : 1;
  return {
    x: Math.random()*(WX.w+240) - 120,
    y: Math.random()*-WX.h,
    depth,
    len:  (depth===0 ? 5+Math.random()*5 : depth===1 ? 9+Math.random()*8 : 15+Math.random()*13) * base,
    spd:  (depth===0 ? 420 : depth===1 ? 700 : 1050) * base * (0.85+Math.random()*0.3),
    a:    depth===0 ? 0.18+Math.random()*0.12 : depth===1 ? 0.3+Math.random()*0.16 : 0.42+Math.random()*0.22,
    w:    depth===0 ? 0.7 : depth===1 ? 1.0 : 1.5,
  };
}
function makeFlake(){
  return {
    x: Math.random()*(WX.w+120)-60,
    y: Math.random()*-WX.h,
    r: 0.9 + Math.random()*2.2,
    spd: 22 + Math.random()*46,
    drift: (Math.random()-0.5)*22,
    ph: Math.random()*Math.PI*2,
    a: 0.5 + Math.random()*0.5,
  };
}
function makeMote(){
  return {
    x: Math.random()*(WX.w+200)-100,
    y: Math.random()*WX.h,
    r: 14 + Math.random()*48,
    spd: 26 + Math.random()*60,
    a: 0.04 + Math.random()*0.09,
  };
}

function wxPopulate(){
  const storm = WX.kind === 'storm';
  if(WX.kind==='rain' || WX.kind==='storm'){
    const want = Math.min(900, Math.round((storm ? 620 : 330) * (WX.w*WX.h)/(1200*700)));
    while(WX.drops.length < want) WX.drops.push(makeDrop(storm));
    if(WX.drops.length > want) WX.drops.length = want;
  } else WX.drops.length = 0;

  if(WX.kind==='frost'){
    const want = Math.min(200, Math.round(150 * (WX.w*WX.h)/(1200*700)));
    while(WX.flakes.length < want) WX.flakes.push(makeFlake());
    if(WX.flakes.length > want) WX.flakes.length = want;
  } else WX.flakes.length = 0;

  if(WX.kind==='heat'){
    while(WX.motes.length < 26) WX.motes.push(makeMote());
    if(WX.motes.length > 26) WX.motes.length = 26;
  } else WX.motes.length = 0;
}

/* ---------------- the frame ---------------- */
function wxFrame(dt){
  if(!wxEnsure()) return;
  const ctx = WX.ctx;

  /* fade in and out of a weather state rather than snapping */
  WX.intensity += (WX.target - WX.intensity) * Math.min(1, dt*1.4);
  if(WX.intensity < 0.01 && !WX.target){
    if(WX.running){ ctx.clearRect(0,0,WX.w,WX.h); WX.running = false; }
    return;
  }
  WX.running = true;
  ctx.clearRect(0,0,WX.w,WX.h);

  const storm = WX.kind === 'storm';
  /* wind sets the slant; a storm also gusts */
  const wind = (typeof windNow==='function') ? windNow() : 0.5;
  WX.gustT += dt;
  const gust = storm ? Math.sin(WX.gustT*0.7)*0.16 + Math.sin(WX.gustT*2.3)*0.06 : 0;
  const targetAngle = 0.10 + wind*0.16 + gust;
  WX.angle += (targetAngle - WX.angle) * Math.min(1, dt*2);
  const ax = Math.sin(WX.angle), ay = Math.cos(WX.angle);

  if(WX.kind==='rain' || WX.kind==='storm'){
    /* a wet sheen and a slight darkening over the land */
    ctx.fillStyle = storm ? 'rgba(30,44,66,0.20)' : 'rgba(42,62,84,0.10)';
    ctx.globalAlpha = WX.intensity;
    ctx.fillRect(0,0,WX.w,WX.h);
    ctx.globalAlpha = 1;

    ctx.lineCap = 'round';
    for(const d of WX.drops){
      const v = d.spd*dt;
      d.x += ax*v; d.y += ay*v;
      if(d.y > WX.h + 20 || d.x < -140 || d.x > WX.w + 140){
        /* land it: a splash where it hits, then recycle to the top */
        if(d.depth > 0 && d.y > WX.h && WX.splashes.length < 160 && Math.random() < 0.5){
          WX.splashes.push({x:d.x - ax*d.len, y:Math.random()*WX.h, life:0, max:0.20+Math.random()*0.12});
        }
        Object.assign(d, makeDrop(storm));
        d.y = -20 - Math.random()*120;
        continue;
      }
      ctx.globalAlpha = d.a * WX.intensity;
      ctx.strokeStyle = d.depth===2 ? '#dceefb' : d.depth===1 ? '#c9e2f4' : '#b7d6ec';
      ctx.lineWidth = d.w;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - ax*d.len, d.y - ay*d.len);
      ctx.stroke();
    }

    /* splashes: a small expanding ring where a drop lands */
    for(let i=WX.splashes.length-1; i>=0; i--){
      const s = WX.splashes[i];
      s.life += dt;
      if(s.life > s.max){ WX.splashes.splice(i,1); continue; }
      const t = s.life/s.max;
      const rr = 0.8 + t*3.4;
      ctx.globalAlpha = (1-t)*(1-t) * 0.55 * WX.intensity;
      ctx.strokeStyle = '#eaf6ff';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, rr, rr*0.4, 0, 0, Math.PI*2);
      ctx.stroke();
      /* two micro-droplets kicked up out of the impact */
      if(t < 0.6){
        ctx.globalAlpha = (1-t) * 0.45 * WX.intensity;
        ctx.fillStyle = '#eaf6ff';
        ctx.fillRect(s.x - rr, s.y - rr*1.1, 0.9, 0.9);
        ctx.fillRect(s.x + rr, s.y - rr*0.9, 0.9, 0.9);
      }
    }

    /* a storm throws sheets of rain across the view */
    if(storm){
      if(WX.gusts.length < 3 && Math.random() < dt*1.1)
        WX.gusts.push({x:-WX.w*0.4, y:Math.random()*WX.h*0.5, life:0, spd:WX.w*0.85});
      for(let i=WX.gusts.length-1; i>=0; i--){
        const g = WX.gusts[i];
        g.life += dt; g.x += g.spd*dt;
        if(g.x > WX.w*1.4){ WX.gusts.splice(i,1); continue; }
        const grad = ctx.createLinearGradient(g.x, 0, g.x + WX.w*0.45, 0);
        grad.addColorStop(0,   'rgba(200,226,244,0)');
        grad.addColorStop(0.5, 'rgba(206,230,248,0.16)');
        grad.addColorStop(1,   'rgba(200,226,244,0)');
        ctx.globalAlpha = WX.intensity;
        ctx.fillStyle = grad;
        ctx.fillRect(g.x, 0, WX.w*0.45, WX.h);
      }
    }
  }

  if(WX.kind==='frost'){
    ctx.globalAlpha = WX.intensity*0.14;
    ctx.fillStyle = '#cfe0ea'; ctx.fillRect(0,0,WX.w,WX.h);
    for(const f of WX.flakes){
      f.ph += dt*1.6;
      f.y += f.spd*dt;
      f.x += (Math.sin(f.ph)*f.drift + wind*14)*dt;
      if(f.y > WX.h+8){ Object.assign(f, makeFlake()); f.y = -8; }
      ctx.globalAlpha = f.a * WX.intensity;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI*2); ctx.fill();
    }
  }

  if(WX.kind==='heat'){
    for(const m of WX.motes){
      m.x += m.spd*dt;
      if(m.x - m.r > WX.w){ Object.assign(m, makeMote()); m.x = -m.r*2; }
      ctx.globalAlpha = m.a * WX.intensity;
      ctx.fillStyle = '#d8c9a0';
      ctx.beginPath();
      ctx.ellipse(m.x, m.y, m.r*2.4, m.r*0.5, 0, 0, Math.PI*2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/* ---------------- state ---------------- */
syncWeatherFx = function(){
  if(!wxEnsure()) return;
  const on = (!S.settings || S.settings.particles !== false);
  const land = LANDMAP[S.landId] || {};
  const w = S.weather;
  let kind = '';
  if(on){
    if(w==='storm') kind='storm';
    else if(w==='rain') kind='rain';
    else if(w==='frost') kind='frost';
    else if(w==='heat' || (land.dust && w==='sun')) kind='heat';
  }
  if(kind !== WX.kind){
    WX.kind = kind;
    WX.splashes.length = 0; WX.gusts.length = 0;
    wxPopulate();
  }
  WX.target = kind ? 1 : 0;
};

/* ride the existing animation frame */
(function weatherFrame(){
  let last = performance.now();
  (function step(now){
    requestAnimationFrame(step);
    const dt = Math.min(0.05, (now-last)/1000); last = now;
    if(!S) return;
    if(document.hidden) return;
    wxFrame(dt);
  })(performance.now());
  window.addEventListener('resize', ()=>{ wxEnsure(); wxPopulate(); });
  setTimeout(()=>{ syncWeatherFx(); }, 200);
})();

/* ---------------- lightning, lit properly ---------------- */
lightningStrike = function(){
  const world = document.getElementById('world');
  if(!world) return;
  let flash = document.getElementById('wxflash');
  if(!flash){ flash = document.createElement('div'); flash.id='wxflash'; world.appendChild(flash); }
  let bolt = document.getElementById('wxbolt');
  if(!bolt){ bolt = document.createElement('div'); bolt.id='wxbolt'; world.appendChild(bolt); }

  const W = world.clientWidth, H = world.clientHeight;
  const startX = 80 + Math.random()*(W-160);
  const endY = H*(0.5 + Math.random()*0.3);

  /* a main channel that forks, rather than one zigzag */
  function channel(x, y, toY, spread, step){
    let d = `M${x.toFixed(0)} ${y.toFixed(0)}`;
    const pts = [[x,y]];
    while(y < toY){
      y += step*(0.7+Math.random()*0.6);
      x += (Math.random()-0.5)*spread;
      d += ` L${x.toFixed(0)} ${y.toFixed(0)}`;
      pts.push([x,y]);
    }
    return {d, pts};
  }
  const main = channel(startX, 0, endY, 46, 26);
  let forks = '';
  main.pts.forEach((p,i)=>{
    if(i>2 && i<main.pts.length-1 && Math.random()<0.30){
      const f = channel(p[0], p[1], p[1] + 40 + Math.random()*90, 34, 20);
      forks += `<path d="${f.d}" stroke="#cfe4ff" stroke-width="1.2" fill="none" opacity=".75"/>`;
    }
  });
  bolt.innerHTML = `<svg width="100%" height="100%" style="display:block">
    <path d="${main.d}" stroke="#9fd0ff" stroke-width="7" fill="none" opacity=".35"
      style="filter:blur(4px)"/>
    <path d="${main.d}" stroke="#eaf3ff" stroke-width="3" fill="none" stroke-linejoin="round"/>
    <path d="${main.d}" stroke="#ffffff" stroke-width="1.3" fill="none" stroke-linejoin="round"/>
    ${forks}</svg>`;

  flash.classList.remove('strike'); bolt.classList.remove('strike');
  void flash.offsetWidth;
  flash.classList.add('strike'); bolt.classList.add('strike');
  if(typeof SND!=='undefined'){
    /* thunder arrives after the flash, farther away means longer and softer */
    /* 0 is overhead, 1 is across the valley. The delay and the sound are
       driven by the same number, so a long wait always means a soft roll. */
    const dist = Math.random();
    setTimeout(()=>SND.play('thunder', dist), 90 + dist*1900);
  }
  setTimeout(()=>{ bolt.innerHTML=''; }, 1300);
};

(function wxCss(){
  const old = document.getElementById('wxcss'); if(old) old.remove();
  const st = document.createElement('style'); st.id='wxcss2';
  st.textContent = `
  #wxcanvas{will-change:contents;}
  #wxflash{position:absolute;inset:0;pointer-events:none;z-index:23;background:#e8f1ff;opacity:0;}
  @keyframes wxStrike{
    0%{opacity:0}3%{opacity:.75}7%{opacity:.06}11%{opacity:.62}18%{opacity:.03}
    26%{opacity:.30}34%{opacity:0}100%{opacity:0}}
  #wxflash.strike{animation:wxStrike 1.2s ease-out;}
  #wxbolt{position:absolute;inset:0;pointer-events:none;z-index:24;opacity:0;}
  @keyframes wxBolt{
    0%{opacity:0}3%{opacity:1}8%{opacity:.15}12%{opacity:.9}20%{opacity:0}100%{opacity:0}}
  #wxbolt.strike{animation:wxBolt 1.2s ease-out;}
  @media(prefers-reduced-motion:reduce){#wxflash,#wxbolt{animation:none!important}}`;
  document.head.appendChild(st);
})();

/* a way to see it without waiting for the sky */
/* self-heal: an unknown weather key would throw on every read of
   WEATHERS[S.weather] and take the whole boot down with it */
G.fixWeather = function(){
  if(typeof S === 'undefined' || !S) return;
  if(!WEATHERS[S.weather]){ S.weather = 'sun'; }
};
G.fixWeather();

G.testWeather = function(kind){
  if(!WEATHERS[kind]){ console.warn('[greenhollow] no such weather:', kind, '— try', Object.keys(WEATHERS).join(', ')); return; }
  S.weather = kind; syncWeatherFx();
  if(kind==='storm') setTimeout(lightningStrike, 600);
  toast(WEATHERS[kind] ? WEATHERS[kind].n : kind, '');
};
