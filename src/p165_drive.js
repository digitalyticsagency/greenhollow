/* =====================================================================
   THE UTE, WITH YOU IN IT

   p152 bought a ute and then never let anybody touch it. It sat on its
   patch of gravel being a statistic — two more jobs a day per farmhand,
   a condition percentage, a repair bill. The one thing a ute is for, you
   could not do.

   NOW YOU DRIVE IT. Arrows or WASD, and it drives like a vehicle rather
   than like a walking character with the speed turned up: it has a
   heading, it accelerates, it carries momentum through a corner, and it
   will not turn at all when it is stopped, because nothing does. Reverse
   is slower than forward. The handbrake is the space bar.

   IT COSTS SOMETHING TO DRIVE. Fuel burns with the throttle, not with
   time, so idling is free and flooring it is not. Every kilometre takes
   condition off the machine p152 already tracks, and off-road takes it
   off about twice as fast as gravel — which is the argument for building
   paths, an argument the game has never previously made.

   AND IT DOES THE JOB IT IS FOR: CARRYING. The tray holds 60 units.
   Pull up at a ripe bed, press E, and the crop goes in the back instead
   of into the barn — then you have to drive it to a building that can
   take it. That is the loop: harvest is quick, haulage is the work, and
   a bed at the far fence is genuinely further away than one by the house.

   WHAT IT WILL DO TO YOUR FARM. Drive across a planted bed at speed and
   you will damage the crop, which is correct and which people will do
   once. The horn puts every bird within range into the air. At night the
   headlights are the only thing you can see by. Hit a building and you
   will feel it in the condition figure.
   ===================================================================== */

const RIG = {
  on:false, o:null, x:0, y:0, hd:-Math.PI/2, sp:0, keys:{},
  tray:{}, trayQty:0, horn:0, lamp:false, bump:0, t:0, dust:[], crushed:{},
  odo:0, offroad:0, lastMsg:0
};
const RIG_CAP     = 60;          /* units in the tray */
const RIG_FWD     = 330;         /* px/s flat out — walking is 165 */
const RIG_REV     = 120;
/* Drag is 0.9/s, so terminal speed is ACC/0.9, not RIG_FWD. At 250 it
   topped out at 277px/s and never reached the figure above — measured.
   330 puts terminal past the cap so the cap is what actually limits it. */
const RIG_ACC     = 330;
const RIG_BRAKE   = 520;
const RIG_TURN    = 2.3;         /* rad/s at speed */
const RIG_FUELKM  = 0.055;       /* tank fractions per 1000px at full throttle */
const RIG_WEARKM  = 0.014;       /* condition per 1000px on gravel; double off it */
const RIG_UNLOAD  = ['cabin','shed','packing','cellar','farm_stand','workshop','gift_shop'];

/* ---------- what you can and cannot drive over ---------- */
/* Not blockedTile: that one is written for a person on foot, and it treats
   a raised bed as an obstacle. A ute can cross a bed. The bed will not
   enjoy it. Buildings, tanks, ponds and trees stop it dead. */
function rigSoft(bp){
  if(!bp) return true;
  if(bp.kind === 'plot' && bp.id !== 'greenhouse') return true;
  if(bp.kind === 'decor' || bp.cat === 'land'){
    return !['tree_native','tree_shade','tree_olive','gate','sign'].includes(bp.id);
  }
  return false;
}
function rigBlocked(px, py){
  const tx = Math.floor(px/T), ty = Math.floor(py/T);
  if(tx < FARM.x || ty < FARM.y || tx >= FARM.x+FARM.w || ty >= FARM.y+FARM.h) return true;
  return (S.objs || []).some(o=>{
    const bp = BPMAP[o.bp]; if(!bp) return false;
    if(o === RIG.o) return false;                     /* its own parking bay */
    if(rigSoft(bp)) return false;
    const f = footprint(bp, o.rot);
    return tx >= o.tx && tx < o.tx+f.w && ty >= o.ty && ty < o.ty+f.h;
  });
}
function rigOnRoad(){
  const roads = (typeof roadLookup === 'function') ? roadLookup() : new Set();
  return roads.has(Math.floor(RIG.x/T) + ',' + Math.floor(RIG.y/T));
}
/* whatever the ute is standing on */
function rigOver(kinds){
  const tx = Math.floor(RIG.x/T), ty = Math.floor(RIG.y/T);
  return (S.objs || []).find(o=>{
    const bp = BPMAP[o.bp]; if(!bp || o === RIG.o) return false;
    if(kinds && !kinds(bp, o)) return false;
    const f = footprint(bp, o.rot);
    return tx >= o.tx-1 && tx < o.tx+f.w+1 && ty >= o.ty-1 && ty < o.ty+f.h+1;
  });
}

/* ---------- getting in and out ---------- */
function rigDrivable(){
  return uteObjs().find(o=>!o.broken && (o.cond === undefined || o.cond > 0.05));
}
G.driveUte = function(){
  if(RIG.on) return;
  if(typeof DRONE === 'object' && DRONE.on) return toast('Land the drone first','bad');
  const o = rigDrivable();
  if(!o){
    const any = uteObjs()[0];
    return toast(any ? 'It will not start — it is broken down' : 'No ute on the place', 'bad');
  }
  if(o.fuel === undefined) o.fuel = 1;
  if(o.fuel <= 0.01) return toast('The tank is empty. Fill it in the yard.','bad');
  RIG.o = o;
  const f = footprint(BPMAP[o.bp], o.rot);
  RIG.x = (o.tx + f.w/2)*T; RIG.y = (o.ty + f.h/2)*T;
  RIG.hd = -Math.PI/2; RIG.sp = 0; RIG.on = true; RIG.keys = {};
  RIG.crushed = {}; RIG.odo = 0; RIG.offroad = 0; RIG.dust = [];
  o.out = 1;                                  /* the bay is empty while you have it */
  if(typeof G.wakeTheWorld === 'function') G.wakeTheWorld();
  let host = document.getElementById('rigwrap');
  if(!host){ host = document.createElement('div'); host.id = 'rigwrap'; document.body.appendChild(host); }
  host.innerHTML = rigPanel();
  document.addEventListener('keydown', rigKey);
  document.addEventListener('keyup', rigKeyUp);
  if(typeof log === 'function') log('In the ute.', '', 'farm');
  try{ sfx('click'); }catch(e){}
};
G.parkUte = function(){
  if(!RIG.on) return;
  const o = RIG.o;
  /* it stays where you left it, which is the only honest thing to do with
     a vehicle: the parked object moves to the tile you stopped on. */
  if(o){
    const f = footprint(BPMAP[o.bp], o.rot);
    const tx = Math.max(FARM.x, Math.min(FARM.x+FARM.w-f.w, Math.round(RIG.x/T - f.w/2)));
    const ty = Math.max(FARM.y, Math.min(FARM.y+FARM.h-f.h, Math.round(RIG.y/T - f.h/2)));
    /* Stopping half on top of the packing shed should not send the ute
       back to the bay it started in — that is a teleport, and it happened.
       Take the nearest clear tile to where it actually stopped instead. */
    const clear = (cx, cy)=>cx >= FARM.x && cy >= FARM.y
      && cx+f.w <= FARM.x+FARM.w && cy+f.h <= FARM.y+FARM.h
      && !rigBlocked((cx+f.w/2)*T, (cy+f.h/2)*T);
    let put = clear(tx, ty) ? {x:tx, y:ty} : null;
    for(let r0 = 1; !put && r0 <= 5; r0++){
      for(let dx = -r0; !put && dx <= r0; dx++){
        for(let dy = -r0; !put && dy <= r0; dy++){
          if(Math.max(Math.abs(dx), Math.abs(dy)) !== r0) continue;
          if(clear(tx+dx, ty+dy)) put = {x:tx+dx, y:ty+dy};
        }
      }
    }
    if(put){ o.tx = put.x; o.ty = put.y; }
    o.out = 0;
  }
  /* and you get out where the ute is */
  if(S.you){ S.you.x = RIG.x; S.you.y = RIG.y + 14; S.you.path = []; S.you.state = 'idle'; }
  RIG.on = false; RIG.sp = 0;
  document.removeEventListener('keydown', rigKey);
  document.removeEventListener('keyup', rigKeyUp);
  const host = document.getElementById('rigwrap'); if(host) host.remove();
  const lay = document.getElementById('riglay'); if(lay) lay.remove();
  const carrying = RIG.trayQty;
  if(typeof log === 'function'){
    log(`Parked the ute. ${(RIG.odo/1000).toFixed(1)}km`
      + (carrying ? `, ${carrying} units still on the tray.` : '.'), '', 'farm');
  }
  if(typeof ui === 'function') ui();
};

/* ---------- the controls ---------- */
function rigKey(e){
  if(!RIG.on) return;
  const k = e.key.toLowerCase();
  if(k === 'escape'){ e.preventDefault(); return G.parkUte(); }
  if(k === 'e'){ e.preventDefault(); return G.utePick(); }
  if(k === 'h'){ e.preventDefault(); return G.uteHorn(); }
  if(k === 'l'){ e.preventDefault(); RIG.lamp = !RIG.lamp; return rigFace(); }
  if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' '].includes(k)){
    e.preventDefault(); RIG.keys[k] = 1;
  }
}
function rigKeyUp(e){ RIG.keys[e.key.toLowerCase()] = 0; }
const rigHeld = (...ks)=>ks.some(k=>RIG.keys[k]);

/* ---------- the drive ---------- */
function rigTick(dt){
  if(!RIG.on){ const l = document.getElementById('riglay'); if(l) l.remove(); return; }
  const o = RIG.o;
  if(!o || o.broken){ toast('It has stopped','bad'); return G.parkUte(); }
  RIG.t += dt;
  if(RIG.horn > 0) RIG.horn -= dt;

  const dead = o.fuel <= 0.001;
  const throttle = !dead && rigHeld('arrowup','w') ? 1 : 0;
  const back     = rigHeld('arrowdown','s') ? 1 : 0;
  const hand     = rigHeld(' ') ? 1 : 0;

  /* longitudinal */
  if(throttle) RIG.sp += RIG_ACC * dt;
  else if(back){
    if(RIG.sp > 4) RIG.sp -= RIG_BRAKE * dt;          /* pedal first, gear second */
    else if(!dead) RIG.sp -= RIG_ACC * 0.7 * dt;
  }
  if(hand) RIG.sp -= Math.sign(RIG.sp) * RIG_BRAKE * 1.3 * dt;
  RIG.sp -= RIG.sp * 0.9 * dt;                        /* rolling drag */
  if(Math.abs(RIG.sp) < 1.2) RIG.sp = 0;
  RIG.sp = Math.max(-RIG_REV, Math.min(RIG_FWD, RIG.sp));

  /* steering: proportional to how fast the wheels are actually turning,
     so it will not pivot on the spot and it understeers when you are
     flying, which is what makes the handbrake worth having */
  const grip = Math.min(1, Math.abs(RIG.sp) / 90);
  const steer = (rigHeld('arrowleft','a') ? -1 : 0) + (rigHeld('arrowright','d') ? 1 : 0);
  RIG.steer = steer;
  if(steer) RIG.hd += steer * RIG_TURN * grip * dt * (RIG.sp < 0 ? -1 : 1) * (hand ? 1.5 : 1);

  /* move, and refuse to move into anything solid */
  const nx = RIG.x + Math.cos(RIG.hd) * RIG.sp * dt;
  const ny = RIG.y + Math.sin(RIG.hd) * RIG.sp * dt;
  const nose = 16 * Math.sign(RIG.sp || 1);
  if(rigBlocked(nx + Math.cos(RIG.hd)*nose, ny + Math.sin(RIG.hd)*nose)){
    const hit = Math.abs(RIG.sp);
    if(hit > 70){
      o.cond = Math.max(0, (o.cond === undefined ? 1 : o.cond) - hit/RIG_FWD * 0.035);
      RIG.bump = 0.5;
      if(RIG.t - RIG.lastMsg > 2){
        RIG.lastMsg = RIG.t;
        toast('You hit something', 'bad');
        try{ sfx('bad'); }catch(e){}
      }
    }
    RIG.sp = -RIG.sp * 0.25;
  } else {
    const moved = Math.hypot(nx-RIG.x, ny-RIG.y);
    RIG.x = nx; RIG.y = ny; RIG.odo += moved;
    const road = rigOnRoad();
    if(!road) RIG.offroad += moved;
    /* fuel goes with the throttle, wear goes with the ground */
    if(throttle) o.fuel = Math.max(0, o.fuel - RIG_FUELKM * moved/1000);
    o.cond = Math.max(0, (o.cond === undefined ? 1 : o.cond)
      - RIG_WEARKM * moved/1000 * (road ? 1 : 2));
    rigCrush(moved);
    if(Math.abs(RIG.sp) > 40 && Math.random() < moved/26){
      RIG.dust.push({ x:RIG.x - Math.cos(RIG.hd)*15, y:RIG.y - Math.sin(RIG.hd)*15,
                      r:2 + Math.random()*3, a:road ? 0.5 : 0.32, t:0 });
    }
  }
  if(RIG.bump > 0) RIG.bump -= dt*2;
  RIG.dust = RIG.dust.filter(p=>{ p.t += dt; p.r += dt*11; p.a -= dt*0.85; return p.a > 0.02; });

  if(dead && RIG.t - RIG.lastMsg > 6){
    RIG.lastMsg = RIG.t; toast('Out of fuel', 'bad');
  }
  /* you are in it */
  if(S.you){ S.you.x = RIG.x; S.you.y = RIG.y; S.you.path = []; S.you.state = 'idle'; }
  rigPaintWorld();
  rigFace();
}

/* driving over a planted bed at speed damages it, once per bed per trip */
function rigCrush(moved){
  if(Math.abs(RIG.sp) < 60) return;
  const bed = rigOver((bp,o)=>bp.kind === 'plot' && o.crop);
  if(!bed) return;
  const key = bed.tx + ',' + bed.ty;
  if(RIG.crushed[key]) return;
  RIG.crushed[key] = 1;
  bed.stage = Math.max(0, (bed.stage || 0) - 0.3);
  bed.weeds = Math.min(1, (bed.weeds || 0) + 0.25);
  if(typeof log === 'function'){
    log(`Drove across the ${CROPS[bed.crop] ? CROPS[bed.crop].n : bed.crop} at ${bed.tx},${bed.ty}. It is flattened.`,
      'bad', 'farm');
  }
  toast('You have driven over the crop', 'bad');
}

/* ---------- the two things the tray is for ---------- */
G.utePick = function(){
  if(!RIG.on) return;
  /* unloading takes priority: if you are at a building that can take it,
     that is obviously what pressing the button means */
  const shed = rigOver(bp=>RIG_UNLOAD.includes(bp.id));
  if(shed && RIG.trayQty > 0){
    let n0 = 0;
    Object.keys(RIG.tray).forEach(k=>{ give(k, RIG.tray[k]); n0 += RIG.tray[k]; });
    const names = Object.keys(RIG.tray).map(k=>`${RIG.tray[k]} ${GOODS[k] ? GOODS[k].n : k}`).join(', ');
    RIG.tray = {}; RIG.trayQty = 0;
    if(typeof log === 'function') log(`Unloaded at the ${BPMAP[shed.bp].name.toLowerCase()}: ${names}.`, 'good', 'farm');
    toast(`${n0} units into the barn`, 'good');
    try{ sfx('build'); }catch(e){}
    return rigFace();
  }
  if(RIG.trayQty >= RIG_CAP) return toast('The tray is full — take it to a shed','bad');

  const bed = rigOver((bp,o)=>(bp.kind === 'plot' && o.crop && o.stage >= 1)
                           || (bp.kind === 'perennial' && o.stage >= 1));
  if(!bed) return toast(shed ? 'Nothing on the tray' : 'Pull up at a ripe bed or a shed');
  const bp = BPMAP[bed.bp];
  const st = stat();
  let gid, q;
  if(bp.kind === 'plot'){
    const cr = CROPS[bed.crop];
    gid = bed.crop;
    q = Math.max(1, Math.round(cr.yield * E.slots(bed) * (1 + st.workbonus)
        * (typeof cropMul === 'function' ? cropMul(bed) : 1)));
    bed.fert = clamp(bed.fert - 0.16, 0.15, 1); bed.last = bed.crop;
    bed.crop = null; bed.stage = 0; bed.weeds = 0;
  } else {
    gid = bp.good; q = E.qty(bed); bed.stage = 0;
  }
  const room = RIG_CAP - RIG.trayQty;
  const took = Math.min(q, room);
  RIG.tray[gid] = (RIG.tray[gid] || 0) + took;
  RIG.trayQty += took;
  if(took < q) give(gid, q - took);          /* what will not fit is carried by hand */
  if(typeof addXP === 'function') addXP(2);
  toast(`${took} ${GOODS[gid] ? GOODS[gid].n : gid} on the tray`, 'good');
  try{ sfx('click'); }catch(e){}
  rigFace();
};
G.uteHorn = function(){
  if(!RIG.on) return;
  RIG.horn = 0.55;
  try{ sfx('bad'); }catch(e){}
  let up = 0;
  if(typeof FLOCK === 'object' && Array.isArray(FLOCK.list)){
    FLOCK.list.forEach(b=>{
      const d = Math.hypot(b.x - RIG.x, b.y - RIG.y);
      if(d > 260) return;
      up++;
      b.fear = 1;
      const a = Math.atan2(b.y - RIG.y, b.x - RIG.x);
      b.lx = b.x + Math.cos(a) * 300;
      b.ly = Math.max(FARM.y*T, b.y + Math.sin(a) * 220 - 60);
    });
  }
  if(up && typeof log === 'function') log(`Sounded the horn. ${up} bird${up>1?'s':''} went up.`, '', 'farm');
  rigFace();
};
G.uteFuel = function(){
  const o = rigDrivable() || uteObjs()[0];
  if(!o) return;
  if(o.fuel === undefined) o.fuel = 1;
  const need = 1 - o.fuel;
  if(need < 0.02) return toast('The tank is full');
  const cost = Math.round(need * 190);
  if(S.cash < cost) return toast('Not enough for a fill','bad');
  S.cash -= cost; o.fuel = 1;
  if(typeof log === 'function') log(`Filled the ute, ${fmt(cost)}.`, '', 'money');
  try{ sfx('build'); }catch(e){}
  if(RIG.on) rigFace(); else if(typeof G.openMachinery === 'function') G.openMachinery();
};

/* ---------- the ute on the ground ---------- */
function rigPaintWorld(){
  let g = document.getElementById('riglay');
  if(!RIG.on){ if(g) g.remove(); return; }
  if(!g){
    const fg = document.getElementById('fg'); if(!fg) return;
    g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.id = 'riglay'; g.setAttribute('pointer-events','none');
    fg.appendChild(g);
  }
  const deg = RIG.hd * 180/Math.PI + 90;      /* the art is drawn nose-up */
  const night = (typeof isNight === 'function') && isNight();
  const lamp = RIG.lamp || night;
  const jolt = RIG.bump > 0 ? Math.sin(RIG.t*60) * RIG.bump * 2.4 : 0;
  const bounce = Math.abs(RIG.sp) > 20 && !rigOnRoad() ? Math.sin(RIG.t*22) * 0.7 : 0;
  let s = '';

  /* dust and gravel out the back */
  RIG.dust.forEach(p=>{
    s += `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(p.r)}" fill="#cbbb98" opacity="${p.a.toFixed(2)}"/>`;
  });

  /* the beams, which at night are the only thing you can see by */
  if(lamp){
    const a = RIG.hd;
    const spread = 0.33;
    [[-1,1],[1,1]].forEach(([side])=>{
      const ox = Math.cos(a + Math.PI/2) * side * 6, oy = Math.sin(a + Math.PI/2) * side * 6;
      const bx = RIG.x + ox + Math.cos(a)*14, by = RIG.y + oy + Math.sin(a)*14;
      const p1x = bx + Math.cos(a-spread)*120, p1y = by + Math.sin(a-spread)*120;
      const p2x = bx + Math.cos(a+spread)*120, p2y = by + Math.sin(a+spread)*120;
      s += `<path d="M${n(bx)} ${n(by)} L${n(p1x)} ${n(p1y)} L${n(p2x)} ${n(p2y)} Z"
        fill="#ffeeb0" opacity="${night ? 0.26 : 0.12}"/>`;
    });
  }

  s += `<g transform="translate(${n(RIG.x + jolt)},${n(RIG.y + bounce)}) rotate(${n(deg)})">`;
  /* shadow */
  s += `<ellipse cx="0" cy="3" rx="15" ry="21" fill="#16240c" opacity=".26"/>`;
  /* wheels — the front pair turn with the steering */
  const w = (RIG.steer || 0) * 16;
  [[-9,-13,w],[9,-13,w],[-9,13,0],[9,13,0]].forEach(([wx,wy,wr])=>{
    s += `<g transform="translate(${wx},${wy}) rotate(${n(wr)})">
      <rect x="-3.2" y="-5.4" width="6.4" height="10.8" rx="2" fill="#22242a"/>
      <rect x="-3.2" y="${n(-5.4 + ((RIG.odo/9) % 10))}" width="6.4" height="1.5" fill="#44474f" opacity=".8"/>
      </g>`;
  });
  /* tray, cab, glass */
  s += `<rect x="-11" y="-19" width="22" height="38" rx="4" fill="#8c5f4a"/>`;
  s += `<rect x="-11" y="-19" width="22" height="12" rx="4" fill="#fff" opacity=".12"/>`;
  s += `<rect x="-9" y="1" width="18" height="16" rx="2" fill="#5c4636"/>`;   /* the tray */
  /* what is on the tray, stacked, so a full ute looks full */
  const load = RIG.trayQty / RIG_CAP;
  if(load > 0.01){
    const rows = Math.max(1, Math.round(load * 4));
    for(let r0 = 0; r0 < rows; r0++){
      for(let c0 = 0; c0 < 2; c0++){
        s += `<rect x="${-7 + c0*7.4}" y="${n(3 + r0*3.4)}" width="6.4" height="3" rx="1"
          fill="#c8a04e" stroke="#8d6d2f" stroke-width=".4"/>`;
      }
    }
  }
  s += `<rect x="-8.5" y="-15" width="17" height="12" rx="2" fill="url(#gGlass)" opacity=".9"/>`;
  /* you, through the windscreen */
  s += `<circle cx="-3.6" cy="-10" r="2.6" fill="#e0c07a"/>`;
  s += `<circle cx="-3.6" cy="-11" r="2.6" fill="#3a2c22" opacity=".55"/>`;
  /* lamps and the brake lights */
  s += `<circle cx="-6.5" cy="-19" r="2" fill="${lamp ? '#fff4c4' : '#c9cdd2'}"/>`;
  s += `<circle cx="6.5" cy="-19" r="2" fill="${lamp ? '#fff4c4' : '#c9cdd2'}"/>`;
  const braking = rigHeld('arrowdown','s',' ') && RIG.sp > 2;
  s += `<rect x="-9" y="18" width="5" height="2.4" rx="1" fill="${braking ? '#ff5a44' : '#8e3b30'}"/>`;
  s += `<rect x="4" y="18" width="5" height="2.4" rx="1" fill="${braking ? '#ff5a44' : '#8e3b30'}"/>`;
  s += `</g>`;

  /* the horn, drawn as rings because a game cannot make you hear it */
  if(RIG.horn > 0){
    const k = 1 - RIG.horn/0.55;
    [0, 0.35].forEach(off=>{
      const kk = k - off; if(kk <= 0) return;
      s += `<circle cx="${n(RIG.x)}" cy="${n(RIG.y)}" r="${n(18 + kk*230)}" fill="none"
        stroke="#ffd98a" stroke-width="${n(2.4*(1-kk))}" opacity="${(0.5*(1-kk)).toFixed(2)}"/>`;
    });
  }
  g.innerHTML = s;
}

/* ---------- the dash ---------- */
function rigPanel(){
  return `<div id="righud">
    <div class="rgrow">
      <span class="rgtitle">FARM UTE</span>
      <span class="rgspd"><b id="rgkmh">0</b> km/h</span>
      <span class="rggauge">Fuel <b id="rgfuel">100%</b></span>
      <span class="rggauge">Cond <b id="rgcond">100%</b></span>
      <span class="rggauge">Tray <b id="rgtray">0</b>/${RIG_CAP}</span>
      <span style="flex:1"></span>
      <button class="btn ghost" onclick="G.utePick()">E — load / unload</button>
      <button class="btn ghost" onclick="G.uteHorn()">H — horn</button>
      <button class="btn ghost" onclick="G.uteFuel()">Fill</button>
      <button class="btn" onclick="G.parkUte()">Park</button>
    </div>
    <div class="rgrow rgsub">
      <span class="muted">Arrows or WASD · space handbrake · L lights · Esc park</span>
      <span id="rghint" class="rghint"></span>
    </div>
  </div>`;
}
function rigFace(){
  const o = RIG.o; if(!o) return;
  const set = (id, v)=>{ const el = document.getElementById(id); if(el) el.textContent = v; };
  set('rgkmh', Math.abs(Math.round(RIG.sp / 9)));
  set('rgfuel', Math.round((o.fuel === undefined ? 1 : o.fuel) * 100) + '%');
  set('rgcond', Math.round((o.cond === undefined ? 1 : o.cond) * 100) + '%');
  set('rgtray', RIG.trayQty);
  const shed = rigOver(bp=>RIG_UNLOAD.includes(bp.id));
  const bed = rigOver((bp,o2)=>(bp.kind === 'plot' && o2.crop && o2.stage >= 1)
                             || (bp.kind === 'perennial' && o2.stage >= 1));
  const hint = document.getElementById('rghint');
  if(hint){
    hint.textContent = (shed && RIG.trayQty) ? `E to unload at the ${BPMAP[shed.bp].name.toLowerCase()}`
      : bed ? `E to load the ${BPMAP[bed.bp].name.toLowerCase()}`
      : (o.fuel <= 0.001) ? 'Out of fuel'
      : '';
    hint.className = 'rghint' + ((shed && RIG.trayQty) || bed ? ' rgon' : '');
  }
  const f = document.getElementById('rgfuel');
  if(f) f.style.color = (o.fuel < 0.15) ? '#ff8a72' : '';
}

/* while you have it out, the bay is empty */
if(typeof ART === 'object' && ART.ute){
  const _uteArt = ART.ute;
  ART.ute = function(w, h, o){
    if(o && o.out){
      let s = patch(w, h, '#9aa0a2', 41, 2);
      s += ao(w*0.06, h*0.18, w*0.88, h*0.66, 0.18);
      s += `<ellipse cx="${n(w*0.5)}" cy="${n(h*0.52)}" rx="${n(w*0.24)}" ry="${n(h*0.2)}"
        fill="#5d5348" opacity=".35"/>`;
      [0.3, 0.7].forEach(fx=>{
        s += `<rect x="${n(w*fx-1.4)}" y="${n(h*0.2)}" width="2.8" height="${n(h*0.6)}"
          rx="1" fill="#6d6357" opacity=".45"/>`;
      });
      return s;
    }
    return _uteArt.apply(this, arguments);
  };
}

/* ---------- wiring ---------- */
if(typeof tickPeople === 'function'){
  const _tickRig = tickPeople;
  tickPeople = function(dt){
    const r = _tickRig.apply(this, arguments);
    try{ rigTick(typeof dt === 'number' ? dt : 1/30); }catch(e){}
    return r;
  };
}
/* the yard is where a vehicle lives, so the keys hang there */
if(typeof G.openMachinery === 'function'){
  const _yard = G.openMachinery;
  G.openMachinery = function(){
    const r = _yard.apply(this, arguments);
    try{
      const foot = document.querySelector('.mfoot');
      const o = rigDrivable();
      if(foot){
        const fuel = o ? (o.fuel === undefined ? 1 : o.fuel) : 0;
        const b = document.createElement('button');
        b.className = 'btn'; b.style.marginRight = '6px';
        b.textContent = 'Drive it';
        b.disabled = !o || fuel <= 0.01;
        b.onclick = ()=>{ G.closeModal(); G.driveUte(); };
        foot.insertBefore(b, foot.firstChild);
        if(o){
          const f2 = document.createElement('button');
          f2.className = 'btn ghost'; f2.style.marginRight = '6px';
          f2.textContent = `Fill the tank — ${fmt(Math.round((1-fuel)*190))}`;
          f2.disabled = fuel > 0.98;
          f2.onclick = ()=>G.uteFuel();
          foot.insertBefore(f2, foot.firstChild);
          const line = document.createElement('div');
          line.className = 'muted';
          line.style.cssText = 'font-size:11px;margin:6px 0 2px';
          line.textContent = `Fuel ${Math.round(fuel*100)}%. Driving wears it about twice as fast `
            + 'off the gravel as on it.';
          foot.parentNode.insertBefore(line, foot);
        }
      }
    }catch(e){}
    return r;
  };
}
/* it cannot be sold or wrecked out from under you */
if(typeof wreck === 'function'){
  const _wreckRig = wreck;
  wreck = function(o){
    if(RIG.on && o === RIG.o){ toast('You are sitting in it','bad'); return; }
    return _wreckRig.apply(this, arguments);
  };
}

G.driveAudit = function(){
  const o = uteObjs()[0];
  return {
    owned: uteObjs().length,
    driving: RIG.on,
    speed: Math.round(RIG.sp),
    kmh: Math.abs(Math.round(RIG.sp/9)),
    heading: +(RIG.hd).toFixed(2),
    tray: { ...RIG.tray }, trayQty: RIG.trayQty, cap: RIG_CAP,
    fuel: o ? +(o.fuel === undefined ? 1 : o.fuel).toFixed(3) : null,
    cond: o ? +(o.cond === undefined ? 1 : o.cond).toFixed(3) : null,
    odoM: Math.round(RIG.odo), offroadM: Math.round(RIG.offroad),
    bedsCrushed: Object.keys(RIG.crushed).length,
    layer: !!document.getElementById('riglay'),
    unloadsAt: RIG_UNLOAD
  };
};

(function rigCss(){
  const s = document.createElement('style');
  s.textContent = `
  #rigwrap{ position:fixed; left:50%; transform:translateX(-50%); bottom:14px; z-index:70;
    width:min(760px,94vw) }
  #righud{ background:rgba(13,20,16,.96); border:1px solid var(--line2,#33402c);
    border-radius:11px; padding:8px 10px; box-shadow:0 10px 34px rgba(0,0,0,.5) }
  .rgrow{ display:flex; align-items:center; gap:10px; flex-wrap:wrap }
  .rgsub{ margin-top:6px; font-size:11px }
  .rgtitle{ font-size:11px; letter-spacing:.14em; color:#9fd6a8 }
  .rgspd b{ font-size:19px; font-variant-numeric:tabular-nums }
  .rgspd{ font-size:11px; color:#cfe0cf }
  .rggauge{ font-size:11px; color:#9bb09b }
  .rggauge b{ color:#e8f0e4; font-variant-numeric:tabular-nums }
  .rghint{ color:#8fa38f }
  .rghint.rgon{ color:#ffe08a; font-weight:600 }
  @media (max-width:620px){
    .rgrow .btn{ padding:5px 7px; font-size:11px }
    .rgtitle{ display:none }
  }`;
  document.head.appendChild(s);
})();
