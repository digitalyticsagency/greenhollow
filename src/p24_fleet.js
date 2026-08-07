/* =====================================================================
   THE AI FLEET — when a module is switched on you see the machine that
   does the work: a drone that flies out and lifts the crop, a robot that
   trundles to the pens, sprinklers that actually spray, a seed drill
   that walks the beds, and a van that leaves with the order.
   ===================================================================== */

const FLEET = [];
const FLEET_MAX = 6;

/* Its own layer, a sibling of the backdrop and foreground, so a scene
   redraw never wipes a machine out mid-flight. */
function fleetLayer(){
  const scene = document.getElementById('scene');
  if(!scene) return null;
  let l = document.getElementById('fleet');
  if(l && +l.getAttribute('width') === WPX) return l;
  if(l) l.remove();
  l = document.createElementNS('http://www.w3.org/2000/svg','svg');
  l.setAttribute('id','fleet');
  l.setAttribute('width', WPX); l.setAttribute('height', HPX);
  l.setAttribute('viewBox', `0 0 ${WPX} ${HPX}`);
  l.style.cssText = 'position:absolute;left:0;top:0;z-index:2;pointer-events:none;overflow:visible';
  scene.appendChild(l);
  return l;
}

/* ---------------- the machines ---------------- */
function droneArt(){
  return `<g class="fl-drone">
    <ellipse class="fl-shadow" cx="0" cy="26" rx="11" ry="4" fill="#0d1607" opacity=".3"/>
    <g class="fl-body">
      <rect x="-9" y="-5" width="18" height="10" rx="3" fill="#2f3a42"/>
      <rect x="-9" y="-5" width="18" height="4" rx="2" fill="#48555e"/>
      <circle cx="0" cy="0" r="2.6" fill="#6fb6d8"/>
      ${[[-10,-7],[10,-7],[-10,7],[10,7]].map(([x,y])=>`
        <line x1="0" y1="0" x2="${x*0.75}" y2="${y*0.75}" stroke="#3d4a52" stroke-width="1.8"/>
        <circle cx="${x}" cy="${y}" r="6" fill="#8fb6cc" opacity=".28" class="fl-rotor"/>
        <circle cx="${x}" cy="${y}" r="2" fill="#5f6b73"/>`).join('')}
      <rect class="fl-cargo" x="-4" y="4" width="8" height="6" rx="1.5" fill="#7cc24f"/>
    </g></g>`;
}
function robotArt(){
  return `<g class="fl-robot">
    <ellipse cx="1" cy="9" rx="10" ry="3.4" fill="#0d1607" opacity=".32"/>
    <rect x="-10" y="-2" width="20" height="8" rx="2" fill="#3a444c"/>
    <rect x="-10" y="-2" width="20" height="3" rx="1.5" fill="#4f5c66"/>
    <rect x="-8" y="-8" width="16" height="7" rx="2.5" fill="#e8a33d"/>
    <rect x="-5" y="-6.5" width="10" height="3.4" rx="1.2" fill="#2b3138"/>
    <circle class="fl-beacon" cx="0" cy="-10" r="2" fill="#ffd97a"/>
    <circle cx="-6" cy="6" r="3" fill="#22282d"/><circle cx="6" cy="6" r="3" fill="#22282d"/>
  </g>`;
}
function seederArt(){
  return `<g class="fl-seeder">
    <ellipse cx="1" cy="8" rx="11" ry="3.2" fill="#0d1607" opacity=".3"/>
    <rect x="-11" y="-4" width="14" height="9" rx="2" fill="#4d8f3c"/>
    <rect x="-11" y="-4" width="14" height="3" rx="1.5" fill="#67ad45"/>
    <rect x="3" y="-2" width="9" height="7" rx="1.5" fill="#8b6640"/>
    <circle cx="-7" cy="5" r="3.4" fill="#22282d"/><circle cx="1" cy="5" r="2.6" fill="#22282d"/>
    <g class="fl-seed">${[0,1,2,3].map(i=>`<circle cx="${8+i*2}" cy="${6+i}" r="1" fill="#c9a06a"/>`).join('')}</g>
  </g>`;
}
function vanArt(){
  return `<g class="fl-van">
    <ellipse cx="1" cy="9" rx="14" ry="3.6" fill="#0d1607" opacity=".32"/>
    <rect x="-14" y="-7" width="20" height="13" rx="2" fill="#f0ece0"/>
    <rect x="-14" y="-7" width="20" height="4" rx="2" fill="#fff"/>
    <path d="M6 -5 L13 0 L13 6 L6 6 Z" fill="#d8d2c4"/>
    <rect x="7" y="-4" width="5" height="4" rx="1" fill="#8fb6cc"/>
    <rect x="-11" y="-4" width="9" height="6" rx="1" fill="#7cc24f" opacity=".8"/>
    <circle cx="-8" cy="7" r="3.2" fill="#22282d"/><circle cx="8" cy="7" r="3.2" fill="#22282d"/>
  </g>`;
}
const FLEET_ART = {drone:droneArt, robot:robotArt, seeder:seederArt, van:vanArt};

/* ---------------- dispatch ---------------- */
function depot(){
  const h = S.objs.find(o=>o.bp==='ai_hub');
  if(h){ const f=footprint(BPMAP[h.bp],h.rot); return {x:(h.tx+f.w/2)*T, y:(h.ty+f.h/2)*T}; }
  return {x:(FARM.x+FARM.w/2)*T, y:(FARM.y+FARM.h/2)*T};
}
function centreOf(o){
  const f = footprint(BPMAP[o.bp], o.rot);
  return {x:(o.tx+f.w/2)*T, y:(o.ty+f.h/2)*T};
}
function dispatch(kind, targets, opts){
  if(!targets || !targets.length) return;
  if(S.settings && S.settings.aiVisuals === false) return;
  if(FLEET.length >= FLEET_MAX) return;
  const l = fleetLayer(); if(!l) return;
  const d = depot();
  const stops = targets.slice(0, 4).map(centreOf);
  const g = document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('class','fl');
  g.innerHTML = FLEET_ART[kind]();
  l.appendChild(g);
  FLEET.push({
    kind, el:g, x:d.x, y:d.y, home:d,
    stops, at:0, state:'travel', t:0, dir:1, life:0,
    speed:(opts&&opts.speed) || (kind==='drone'?230:130),
    work:(opts&&opts.work) || 0.7,
    carrying:false,
  });
}

/* ---------------- the loop ---------------- */
function tickFleet(dt){
  if(!FLEET.length) return;
  for(let i=FLEET.length-1; i>=0; i--){
    const a = FLEET[i];
    /* a hard lifetime, so nothing can ever be left circling the farm */
    a.life += dt;
    if(a.life > 25){ retire(a,i); continue; }
    const goal = a.state==='home' ? a.home : a.stops[a.at];
    if(!goal){ retire(a,i); continue; }

    if(a.state==='travel' || a.state==='home'){
      const dx = goal.x-a.x, dy = goal.y-a.y, d = Math.hypot(dx,dy);
      if(d < 4){
        if(a.state==='home'){ retire(a,i); continue; }
        a.state='work'; a.t=0;
        paintAgent(a);
        continue;
      }
      const v = a.speed*dt;
      a.x += dx/d*Math.min(d,v); a.y += dy/d*Math.min(d,v);
      if(Math.abs(dx) > 0.5) a.dir = dx>0 ? 1 : -1;
    } else if(a.state==='work'){
      a.t += dt;
      if(a.t > a.work){
        a.carrying = (a.kind==='drone' || a.kind==='van');
        a.at++;
        a.state = (a.at >= a.stops.length) ? 'home' : 'travel';
        a.t = 0;
      }
    }
    paintAgent(a);
  }
}
function retire(a, i){
  if(a.el){ a.el.classList.add('fl-gone'); const el=a.el; setTimeout(()=>el.remove(), 400); }
  FLEET.splice(i,1);
}
function paintAgent(a){
  if(!a.el) return;
  const lift = a.kind==='drone' ? -18 : 0;
  a.el.setAttribute('transform', `translate(${n(a.x)},${n(a.y+lift)}) scale(${a.dir},1)`);
  a.el.classList.toggle('working', a.state==='work');
  a.el.classList.toggle('carrying', !!a.carrying);
}

/* ---------------- sprinklers, which stay on the bed ---------------- */
function sprinkle(targets){
  if(S.settings && S.settings.aiVisuals === false) return;
  const l = fleetLayer(); if(!l) return;
  targets.slice(0,10).forEach((o,i)=>{
    const c = centreOf(o);
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','fl-spray');
    g.setAttribute('transform', `translate(${n(c.x)},${n(c.y)})`);
    g.style.animationDelay = (i*0.12)+'s';
    g.innerHTML = `
      <circle cx="0" cy="0" r="3" fill="#5f6b73"/>
      <circle class="sp-ring" cx="0" cy="0" r="8"  fill="none" stroke="#9fd6ee" stroke-width="2"/>
      <circle class="sp-ring" cx="0" cy="0" r="14" fill="none" stroke="#9fd6ee" stroke-width="1.6" style="animation-delay:.35s"/>
      <circle class="sp-ring" cx="0" cy="0" r="20" fill="none" stroke="#9fd6ee" stroke-width="1.2" style="animation-delay:.7s"/>
      ${[0,60,120,180,240,300].map(deg=>`
        <line class="sp-jet" x1="0" y1="0" x2="${(Math.cos(deg*Math.PI/180)*22).toFixed(1)}"
          y2="${(Math.sin(deg*Math.PI/180)*22).toFixed(1)}" stroke="#bfe6f7" stroke-width="1.4" opacity=".7"/>`).join('')}`;
    l.appendChild(g);
    setTimeout(()=>g.remove(), 2600);
  });
}

/* ---------------- hook the modules up ---------------- */
if(typeof runAutomation === 'function'){
  const _runFleet = runAutomation;
  runAutomation = function(){
    /* note what each module is about to act on, before it acts */
    const dry  = S.objs.filter(o=>BPMAP[o.bp].kind==='plot' && o.crop && o.water < ((S.autoCfg&&S.autoCfg.moist)||0.5));
    const ripe = S.objs.filter(o=>['plot','perennial'].includes(BPMAP[o.bp].kind) && o.stage>=1);
    const pens = S.objs.filter(o=>BPMAP[o.bp].kind==='animal' && (o.ready>0 || (o.care||1)<0.9));
    const bare = S.objs.filter(o=>BPMAP[o.bp].kind==='plot' && !o.crop);
    const hadStock = Object.keys(S.store||{}).length;

    _runFleet();
    if(!hub()) return;

    if(autoOn('irrigation') && dry.length) sprinkle(dry);
    if(autoOn('harvest')    && ripe.length) dispatch('drone', ripe, {speed:250, work:0.6});
    if(autoOn('livestock')  && pens.length) dispatch('robot', pens, {speed:120, work:0.9});
    if(autoOn('agronomy')   && bare.length) dispatch('seeder', bare, {speed:110, work:0.8});
    if(autoOn('logistics')  && hadStock){
      const stand = S.objs.filter(o=>['shop','process'].includes(BPMAP[o.bp].kind));
      dispatch('van', stand.length ? stand : [S.objs.find(o=>o.bp==='cabin')].filter(Boolean), {speed:150, work:0.7});
    }
  };
}

/* fold the fleet into the single animation frame */
(function fleetFrame(){
  let last = performance.now();
  (function step(now){
    requestAnimationFrame(step);
    const dt = Math.min(0.1, (now-last)/1000); last = now;
    if(S) tickFleet(dt);
  })(performance.now());
})();

/* the layer must be rebuilt if the land resizes */
if(typeof resizeLand === 'function'){
  const _rl = resizeLand;
  resizeLand = function(l){ _rl(l); const f=document.getElementById('fleet'); if(f) f.remove(); };
}

/* ---------------- a button to watch it happen ---------------- */
G.runAiNow = function(){
  if(!hub()) return toast('Build a control hub first','bad'), sfx('error');
  if(!autoList().length) return toast('Switch a module on first','bad'), sfx('error');
  runAutomation();
  sfx('collect');
  toast('AI dispatched','good');
  ui();
};

(function fleetCss(){
  const st = document.createElement('style');
  st.textContent = `
  .fl{transition:opacity .35s;}
  .fl-gone{opacity:0;}
  @keyframes flRotor{to{transform:rotate(360deg)}}
  .fl-rotor{transform-box:fill-box;transform-origin:center;animation:flRotor .12s linear infinite;}
  @keyframes flHover{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}
  .fl-drone .fl-body{transform-box:fill-box;transform-origin:center;animation:flHover 1.5s ease-in-out infinite;}
  @keyframes flBeacon{0%,100%{opacity:.35}50%{opacity:1}}
  .fl-beacon{animation:flBeacon .9s ease-in-out infinite;}
  @keyframes flBump{0%,100%{transform:translateY(0)}50%{transform:translateY(-1px)}}
  .fl-robot,.fl-seeder,.fl-van{transform-box:fill-box;transform-origin:center bottom;animation:flBump .28s ease-in-out infinite;}
  /* the drone lowers a line and lifts a crate while it works */
  /* the crate grows down from the drone's belly. scaleY composites;
     animating the rect's height would repaint it every frame instead. */
  .fl .fl-cargo{transform-box:fill-box;transform-origin:center top;
    transform:scaleY(0);transition:transform .3s ease-out;}
  .fl.carrying .fl-cargo{transform:scaleY(1);}
  .fl.working .fl-body{animation-duration:.5s;}
  @keyframes flSeed{0%{opacity:0;transform:translate(0,0)}40%{opacity:.9}100%{opacity:0;transform:translate(6px,7px)}}
  .fl.working .fl-seed circle{animation:flSeed .6s linear infinite;}
  .fl-seed circle:nth-child(2){animation-delay:.15s}
  .fl-seed circle:nth-child(3){animation-delay:.3s}
  .fl-seed circle:nth-child(4){animation-delay:.45s}
  /* sprinklers */
  @keyframes spRing{0%{r:3;opacity:.85}100%{r:24;opacity:0}}
  .sp-ring{animation:spRing 1.3s ease-out infinite;}
  @keyframes spSpin{to{transform:rotate(360deg)}}
  .fl-spray{transform-box:fill-box;transform-origin:center;}
  .fl-spray line{transform-box:fill-box;transform-origin:0 0;}
  @keyframes spJet{0%,100%{opacity:.15}50%{opacity:.8}}
  .sp-jet{animation:spJet 1.1s ease-in-out infinite;}
  @media(prefers-reduced-motion:reduce){
    .fl-rotor,.fl-drone .fl-body,.fl-beacon,.fl-robot,.fl-seeder,.fl-van,.sp-ring,.sp-jet{animation:none!important}}
  `;
  document.head.appendChild(st);
})();

/* a Run now button on the AI panel */
(function aiPanelButton(){
  const _auto = autoHTML;
  autoHTML = function(){
    let h = _auto();
    if(!hub()) return h;
    return h.replace('<div class="ph">Modules</div>',
      `<div style="padding:0 10px 8px">
         <button class="btn wide" onclick="G.runAiNow()"
           data-tip="${esc('<b>Run the AI now</b>Dispatches every switched-on module immediately so you can watch the machines work, instead of waiting for the morning round.')}">
           ▶ Run the AI now — watch it work</button>
       </div>
       <div class="ph">Modules</div>`);
  };
})();

/* =====================================================================
   You could pan the camera clean off the world into empty black, which
   reads as the screen vanishing. The camera is now kept so the land is
   always at least partly in view.
   ===================================================================== */
(function clampCamera(){
  const _apply = applyCam;
  applyCam = function(){
    const world = document.getElementById('world');
    if(world && S){
      const vw = world.clientWidth, vh = world.clientHeight;
      const arc = document.getElementById('sunarc');
      const top = (arc && arc.style.display !== 'none') ? arc.getBoundingClientRect().height : 0;
      /* keep at least a third of the property on screen in each axis */
      const px = FARM.x*T*cam.z, py = FARM.y*T*cam.z;
      const pw = FARM.w*T*cam.z, ph = FARM.h*T*cam.z;
      const keepX = Math.min(pw, vw) * 0.34;
      const keepY = Math.min(ph, vh) * 0.34;
      cam.x = clamp(cam.x, keepX - px - pw, vw - px - keepX);
      cam.y = clamp(cam.y, top + keepY - py - ph, vh - py - keepY);
    }
    _apply();
  };
})();
