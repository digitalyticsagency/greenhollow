/* =====================================================================
   THE CRAFT, PROPERLY

   The old saucer was a grey lens with a green beam and one blinking
   lamp. This is the set piece of the whole storm - it deserves more.

   What it has now: a chromatic hull with a violet underglow, a rotating
   ring of nine coloured lamps, a spinning drive core, a plasma corona
   that pulses on its own clock, a tractor beam with travelling bands and
   motes drifting up it, and hit feedback that actually reads as damage -
   sparks, a shield flash, and smoke once it is badly hurt.

   All of it is transform and opacity on small elements. No filters: the
   art rules ban feGaussianBlur in the scene layer, and a per-frame blur
   on something this size would cost more than everything else on screen
   put together. The glow is stacked translucent shapes instead, which is
   how the rest of the game does it.
   ===================================================================== */

/* ---------- the palette ---------- */
const UFO_LAMPS = ['#ff5bb0','#ffd166','#6ef2c8','#5bc8ff','#c08bff',
                   '#ff8a5b','#7cf0c0','#8fb4ff','#ff6ec7'];

/* one saucer, drawn from the top-down three-quarter angle everything
   else uses: you see the dome, the upper hull, and a sliver of rim */
function ufoArt(w){
  const R  = w * 0.5;
  let s = '';

  /* --- plasma corona: three stacked translucent discs, no filter --- */
  s += `<g class="ufo-corona">`;
  s += `<ellipse cx="0" cy="2" rx="${n(R*1.30)}" ry="${n(R*0.52)}" fill="#8b5bff" opacity=".10"/>`;
  s += `<ellipse cx="0" cy="2" rx="${n(R*1.10)}" ry="${n(R*0.44)}" fill="#5bc8ff" opacity=".12"/>`;
  s += `<ellipse cx="0" cy="2" rx="${n(R*0.92)}" ry="${n(R*0.36)}" fill="#7cf0c0" opacity=".14"/>`;
  s += `</g>`;

  /* --- underside, seen as a sliver below the rim --- */
  s += `<ellipse cx="0" cy="${n(R*0.14)}" rx="${n(R*0.86)}" ry="${n(R*0.24)}" fill="#241a3d"/>`;

  /* --- the drive core, spinning, visible under the hull --- */
  s += `<g class="ufo-core">`;
  s += `<circle cx="0" cy="${n(R*0.13)}" r="${n(R*0.30)}" fill="#3a1f6b"/>`;
  s += `<circle cx="0" cy="${n(R*0.13)}" r="${n(R*0.21)}" fill="#7a3df0" opacity=".85"/>`;
  s += `<circle cx="0" cy="${n(R*0.13)}" r="${n(R*0.12)}" fill="#d9c2ff"/>`;
  for(let i=0;i<3;i++){
    const a = (i/3)*Math.PI*2;
    s += `<ellipse cx="${n(Math.cos(a)*R*0.20)}" cy="${n(R*0.13 + Math.sin(a)*R*0.07)}"
            rx="${n(R*0.07)}" ry="${n(R*0.03)}" fill="#ffffff" opacity=".7"/>`;
  }
  s += `</g>`;

  /* --- main hull: dark rim, chromatic body, lit from the upper left --- */
  s += `<ellipse cx="0" cy="0" rx="${n(R*0.98)}" ry="${n(R*0.34)}" fill="#1d1832"/>`;
  s += `<ellipse cx="0" cy="${n(-R*0.03)}" rx="${n(R*0.94)}" ry="${n(R*0.31)}" fill="#6f7ba8"/>`;
  s += `<ellipse cx="0" cy="${n(-R*0.06)}" rx="${n(R*0.88)}" ry="${n(R*0.27)}" fill="#98a6cf"/>`;
  /* chromatic sheen - warm on the sunlit side, cold on the shadow side */
  s += `<path d="M${n(-R*0.88)} ${n(-R*0.06)} a${n(R*0.88)} ${n(R*0.27)} 0 0 1 ${n(R*1.76)} 0 Z"
          fill="#dfe7ff" opacity=".55"/>`;
  s += `<ellipse cx="${n(-R*0.34)}" cy="${n(-R*0.14)}" rx="${n(R*0.36)}" ry="${n(R*0.10)}"
          fill="#ffffff" opacity=".45"/>`;
  s += `<ellipse cx="${n(R*0.40)}" cy="${n(-R*0.02)}" rx="${n(R*0.30)}" ry="${n(R*0.08)}"
          fill="#7a5bd0" opacity=".35"/>`;

  /* --- rotating lamp ring --- */
  s += `<g class="ufo-ring">`;
  for(let i=0;i<9;i++){
    const a  = (i/9)*Math.PI*2;
    const cx = Math.cos(a)*R*0.74, cy = Math.sin(a)*R*0.22 - R*0.02;
    s += `<circle class="ufo-lamp" cx="${n(cx)}" cy="${n(cy)}" r="${n(R*0.062)}"
            fill="${UFO_LAMPS[i]}" style="animation-delay:${(i*0.12).toFixed(2)}s"/>`;
    s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R*0.028)}" fill="#ffffff" opacity=".85"/>`;
  }
  s += `</g>`;

  /* --- dome: glass, with a horizon line and a highlight --- */
  s += `<ellipse cx="0" cy="${n(-R*0.30)}" rx="${n(R*0.46)}" ry="${n(R*0.34)}" fill="#2b3f6e" opacity=".9"/>`;
  s += `<ellipse cx="0" cy="${n(-R*0.32)}" rx="${n(R*0.42)}" ry="${n(R*0.30)}" fill="#6fd3ff" opacity=".55"/>`;
  s += `<path d="M${n(-R*0.42)} ${n(-R*0.32)} a${n(R*0.42)} ${n(R*0.30)} 0 0 1 ${n(R*0.84)} 0 Z"
          fill="#d6f4ff" opacity=".45"/>`;
  s += `<ellipse class="ufo-pilot" cx="0" cy="${n(-R*0.30)}" rx="${n(R*0.13)}" ry="${n(R*0.11)}" fill="#1b2a4a"/>`;
  s += `<ellipse cx="${n(-R*0.16)}" cy="${n(-R*0.44)}" rx="${n(R*0.14)}" ry="${n(R*0.07)}"
          fill="#ffffff" opacity=".7"/>`;

  /* --- antenna with a pulsing tip --- */
  s += `<rect x="-1" y="${n(-R*0.72)}" width="2" height="${n(R*0.20)}" rx="1" fill="#8fa0c8"/>`;
  s += `<circle class="ufo-tip" cx="0" cy="${n(-R*0.74)}" r="${n(R*0.055)}" fill="#ff5bb0"/>`;

  /* --- scan sweep across the hull --- */
  s += `<g class="ufo-sweepwrap"><ellipse class="ufo-sweep" cx="0" cy="${n(-R*0.06)}"
          rx="${n(R*0.16)}" ry="${n(R*0.26)}" fill="#ffffff" opacity=".18"/></g>`;

  return s;
}

/* ---------- the tractor beam ---------- */
function ufoBeam(w, len){
  const R = w*0.5;
  let s = `<g class="ufo-beamwrap">`;
  s += `<path class="ufo-beam" d="M${n(-R*0.22)} 0 L${n(R*0.22)} 0
          L${n(R*0.50)} ${n(len)} L${n(-R*0.50)} ${n(len)} Z" fill="#7cf0c0" opacity=".22"/>`;
  s += `<path class="ufo-beam2" d="M${n(-R*0.12)} 0 L${n(R*0.12)} 0
          L${n(R*0.30)} ${n(len)} L${n(-R*0.30)} ${n(len)} Z" fill="#d6fff0" opacity=".20"/>`;
  /* travelling bands down the cone */
  for(let i=0;i<3;i++){
    s += `<ellipse class="ufo-band" cx="0" cy="0" rx="${n(R*0.34)}" ry="${n(R*0.07)}"
            fill="none" stroke="#bfffe6" stroke-width="1.4" opacity=".5"
            style="animation-delay:${(i*0.66).toFixed(2)}s"/>`;
  }
  /* motes drifting up the beam - this is what sells a tractor beam */
  for(let i=0;i<6;i++){
    const dx = (hash(i*3.7)-0.5) * R*0.6;
    s += `<circle class="ufo-mote" cx="${n(dx)}" cy="0" r="1.6" fill="#eafff6"
            style="animation-delay:${(i*0.35).toFixed(2)}s"/>`;
  }
  /* pool of light where it lands */
  s += `<ellipse class="ufo-pool" cx="0" cy="${n(len)}" rx="${n(R*0.52)}" ry="${n(R*0.16)}"
          fill="#9dffd8" opacity=".28"/>`;
  s += `</g>`;
  return s;
}

/* ---------- the layer, rebuilt ---------- */
if(typeof ufoLayer === 'function'){
  ufoLayer = function(){
    const u = S.ufo;
    if(!u) return '';
    const w = 96, R = w*0.5;
    const hurt = u.hp <= 2 ? ' ufo-critical' : (u.hp < u.hpMax ? ' ufo-hurt' : '');
    let s = `<g id="ufo" class="ufo${hurt}" transform="translate(${n(u.x)},${n(u.y)})">`;

    if(u.phase === 'beam' || u.phase === 'lift') s += ufoBeam(w, u.beamLen);

    s += `<g class="ufo-hull">${ufoArt(w)}</g>`;

    /* damage: smoke once it is really struggling */
    if(u.hp <= 3){
      for(let i=0;i<3;i++)
        s += `<circle class="ufo-smoke" cx="${n((i-1)*R*0.22)}" cy="${n(-R*0.05)}"
                r="${n(R*0.10)}" fill="#2b2438" opacity=".0"
                style="animation-delay:${(i*0.5).toFixed(2)}s"/>`;
    }
    /* shield flash, retriggered by the hit class */
    s += `<ellipse class="ufo-shield" cx="0" cy="${n(-R*0.04)}" rx="${n(R*1.06)}" ry="${n(R*0.40)}"
            fill="none" stroke="#9dffd8" stroke-width="2" opacity="0"/>`;
    /* sparks, likewise */
    s += `<g class="ufo-sparks">`;
    for(let i=0;i<8;i++){
      const a = (i/8)*Math.PI*2;
      s += `<circle cx="${n(Math.cos(a)*R*0.5)}" cy="${n(Math.sin(a)*R*0.18)}" r="1.7"
              fill="${UFO_LAMPS[i]}" style="--ax:${n(Math.cos(a)*R*0.55)}px; --ay:${n(Math.sin(a)*R*0.25)}px"/>`;
    }
    s += `</g>`;

    if(u.hp < u.hpMax){
      const pct = u.hp/u.hpMax;
      s += `<rect x="${n(-R*0.8)}" y="${n(-R*0.92)}" width="${n(R*1.6)}" height="4.4" rx="2.2" fill="#00000077"/>`;
      s += `<rect x="${n(-R*0.8)}" y="${n(-R*0.92)}" width="${n(R*1.6*pct)}" height="4.4" rx="2.2"
              fill="${pct > 0.5 ? '#7cf0c0' : pct > 0.25 ? '#ffd166' : '#ff5b6e'}"/>`;
    }
    return s + '</g>';
  };
}

/* paintUfo has to keep the new beam in step, not just the old one */
if(typeof paintUfo === 'function'){
  const _paintUfoFx = paintUfo;
  paintUfo = function(){
    const r = _paintUfoFx.apply(this, arguments);
    const u = S.ufo; if(!u) return r;
    const el = document.getElementById('ufo'); if(!el) return r;
    const R = 48;
    const b2 = el.querySelector('.ufo-beam2');
    if(b2) b2.setAttribute('d', `M${n(-R*0.12)} 0 L${n(R*0.12)} 0 L${n(R*0.30)} ${n(u.beamLen)} L${n(-R*0.30)} ${n(u.beamLen)} Z`);
    const pool = el.querySelector('.ufo-pool');
    if(pool) pool.setAttribute('cy', n(u.beamLen));
    const wrap = el.querySelector('.ufo-beamwrap');
    if(wrap) wrap.style.display = (u.phase==='beam'||u.phase==='lift') ? '' : 'none';
    el.style.setProperty('--beamlen', n(u.beamLen) + 'px');
    return r;
  };
}

/* a hit should look like a hit */
if(typeof G !== 'undefined' && typeof G.shootUfo === 'function'){
  const _shootFx = G.shootUfo;
  G.shootUfo = function(){
    const before = S.ufo ? S.ufo.hp : 0;
    /* Grab the position here, not in tickUfo. shootUfo clears S.ufo before
       we can look, and relying on the tick meant the wreck never appeared
       when the craft was hit while the sim was paused. */
    if(S.ufo) S._lastUfoPos = { x:S.ufo.x, y:S.ufo.y };
    const r = _shootFx.apply(this, arguments);
    const el = document.getElementById('ufo');
    if(el && S.ufo){
      el.classList.remove('ufo-struck');
      void el.offsetWidth;                    /* restart the animation */
      el.classList.add('ufo-struck');
    }
    if(before === 1 && typeof burstDown === 'function') burstDown();
    return r;
  };
}

/* the wreck: a flash and a shower where it came down */
function burstDown(){
  const layer = document.getElementById('people');
  if(!layer) return;
  const u = S._lastUfoPos;
  if(!u) return;
  const g = document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('class','ufo-burst');
  g.setAttribute('transform', `translate(${n(u.x)},${n(u.y)})`);
  let s = `<circle class="ufo-flash" r="10" fill="#ffffff"/>`;
  for(let i=0;i<14;i++){
    const a = (i/14)*Math.PI*2;
    s += `<circle class="ufo-frag" r="2.4" fill="${UFO_LAMPS[i%UFO_LAMPS.length]}"
            style="--fx:${n(Math.cos(a)*90)}px; --fy:${n(Math.sin(a)*54)}px;
                   animation-delay:${(i*0.02).toFixed(2)}s"/>`;
  }
  g.innerHTML = s;
  layer.appendChild(g);
  setTimeout(()=>g.remove(), 1600);
}
/* remember where it was, because shootUfo clears S.ufo before we can look */
if(typeof tickUfo === 'function'){
  const _tickUfoPos = tickUfo;
  tickUfo = function(dt){
    if(S && S.ufo) S._lastUfoPos = { x:S.ufo.x, y:S.ufo.y };
    return _tickUfoPos.apply(this, arguments);
  };
}

(function ufoFxCss(){
  const s = document.createElement('style');
  s.textContent = `
  #ufo{ cursor:crosshair; }
  /* the ring of lamps turns; squashed on Y because we are looking down */
  #ufo .ufo-ring{ transform-box:fill-box; transform-origin:center;
    animation: ufoRing 5.5s linear infinite; }
  @keyframes ufoRing{ from{ transform:rotate(0deg) } to{ transform:rotate(360deg) } }
  #ufo .ufo-lamp{ animation: ufoLamp 1.05s ease-in-out infinite; }
  @keyframes ufoLamp{ 0%,100%{ opacity:.30 } 50%{ opacity:1 } }

  #ufo .ufo-core{ transform-box:fill-box; transform-origin:center;
    animation: ufoCore 1.9s linear infinite; }
  @keyframes ufoCore{ from{ transform:rotate(0deg) } to{ transform:rotate(-360deg) } }

  #ufo .ufo-corona{ transform-box:fill-box; transform-origin:center;
    animation: ufoCorona 3.6s ease-in-out infinite; }
  @keyframes ufoCorona{ 0%,100%{ transform:scale(1); opacity:.85 }
                        50%    { transform:scale(1.09); opacity:1 } }

  #ufo .ufo-tip{ animation: ufoTip 0.9s ease-in-out infinite; }
  @keyframes ufoTip{ 0%,100%{ opacity:.25; } 50%{ opacity:1; } }

  #ufo .ufo-sweepwrap{ transform-box:fill-box; transform-origin:center;
    animation: ufoSweep 4.2s ease-in-out infinite; }
  @keyframes ufoSweep{ 0%,100%{ transform:translateX(-42px); opacity:0 }
                       50%    { transform:translateX(42px);  opacity:.9 } }

  /* the whole craft rides its own hover */
  #ufo .ufo-hull{ transform-box:fill-box; transform-origin:center;
    animation: ufoHover 3.1s ease-in-out infinite; }
  @keyframes ufoHover{ 0%,100%{ transform:translateY(0)    rotate(-1.6deg) }
                       50%    { transform:translateY(-6px) rotate(1.6deg) } }

  /* beam: bands travel down it, motes drift up */
  #ufo .ufo-band{ animation: ufoBand 2s linear infinite; }
  @keyframes ufoBand{
    0%  { transform: translateY(0)    scale(.5); opacity:0 }
    18% { opacity:.65 }
    100%{ transform: translateY(var(--beamlen,90px)) scale(1.5); opacity:0 } }
  #ufo .ufo-mote{ animation: ufoMote 1.7s ease-in infinite; }
  @keyframes ufoMote{
    0%  { transform: translateY(var(--beamlen,90px)); opacity:0 }
    25% { opacity:.95 }
    100%{ transform: translateY(4px); opacity:0 } }
  #ufo .ufo-pool{ animation: ufoPool 1.6s ease-in-out infinite; }
  @keyframes ufoPool{ 0%,100%{ opacity:.16; transform:scale(.9) } 50%{ opacity:.42; transform:scale(1.12) } }
  #ufo .ufo-beam,#ufo .ufo-beam2{ animation: ufoBeamPulse 1.3s ease-in-out infinite; }
  @keyframes ufoBeamPulse{ 0%,100%{ opacity:.16 } 50%{ opacity:.34 } }

  /* being hit */
  #ufo .ufo-shield{ opacity:0; }
  #ufo.ufo-struck .ufo-shield{ animation: ufoShield .42s ease-out 1; }
  @keyframes ufoShield{ 0%{ opacity:.95; transform:scale(.82) }
                        100%{ opacity:0; transform:scale(1.3) } }
  #ufo .ufo-sparks circle{ opacity:0; }
  #ufo.ufo-struck .ufo-sparks circle{ animation: ufoSpark .5s ease-out 1; }
  @keyframes ufoSpark{ 0%{ opacity:1; translate:0 0 } 100%{ opacity:0; translate:var(--ax) var(--ay) } }
  #ufo.ufo-struck .ufo-hull{ animation: ufoShake .32s ease-out 1, ufoHover 3.1s ease-in-out infinite .32s; }
  @keyframes ufoShake{ 0%,100%{ transform:translateX(0) } 25%{ transform:translateX(-5px) }
                       75%{ transform:translateX(5px) } }
  /* damaged craft list and smoke */
  #ufo.ufo-hurt .ufo-corona{ opacity:.6 }
  #ufo.ufo-critical .ufo-hull{ animation: ufoLimp 1.1s ease-in-out infinite; }
  @keyframes ufoLimp{ 0%,100%{ transform:translateY(0) rotate(-7deg) }
                      50%    { transform:translateY(3px) rotate(6deg) } }
  #ufo .ufo-smoke{ animation: ufoSmoke 1.5s ease-out infinite; }
  @keyframes ufoSmoke{ 0%{ opacity:.6; transform:translate(0,0) scale(.5) }
                       100%{ opacity:0; transform:translate(-14px,-30px) scale(2) } }

  /* the wreck */
  .ufo-burst{ pointer-events:none; }
  .ufo-flash{ animation: ufoFlash .5s ease-out 1 forwards; }
  @keyframes ufoFlash{ 0%{ opacity:1; transform:scale(.4) } 100%{ opacity:0; transform:scale(5) } }
  .ufo-frag{ animation: ufoFrag 1.2s cubic-bezier(.2,.7,.4,1) 1 forwards; }
  @keyframes ufoFrag{ 0%{ opacity:1; translate:0 0 } 100%{ opacity:0; translate:var(--fx) var(--fy) } }

  @media (prefers-reduced-motion: reduce){
    #ufo *{ animation:none !important; }
    .ufo-burst *{ animation-duration:.3s !important; } }
  `;
  document.head.appendChild(s);
})();
