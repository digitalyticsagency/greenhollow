/* =====================================================================
   ENGINE — world grid, camera, placement with rotation, simulation
   ===================================================================== */
const WT = 26, HT = 18;                    // world size in tiles
const WPX = WT*T, HPX = HT*T;
const FARM = {x:2, y:2, w:WT-5, h:HT-4};   // fenced property, in tiles
const DAY_MS = 45000;

let S = null;                              // save state
let sel = null;                            // selected object id
let ghost = null;                          // {bp, rot, tx, ty} while placing
let cam = {x:0, y:0, z:1};
let acc = 0, lastT = 0, rafId = 0;

/* ---------------- helpers ---------------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
function fmt(v){ return '$'+Math.round(v).toLocaleString(); }
function clamp(v,a,b){ return v<a?a:v>b?b:v; }
function footprint(bp, rot){ return (rot===90||rot===270) ? {w:bp.h,h:bp.w} : {w:bp.w,h:bp.h}; }
function obAt(tx,ty){
  return S.objs.find(o=>{
    const f = footprint(BPMAP[o.bp], o.rot);
    return tx>=o.tx && tx<o.tx+f.w && ty>=o.ty && ty<o.ty+f.h;
  });
}
function overlaps(tx,ty,f,skipId){
  if(tx<FARM.x||ty<FARM.y||tx+f.w>FARM.x+FARM.w||ty+f.h>FARM.y+FARM.h) return true;
  return S.objs.some(o=>{
    if(o.id===skipId) return false;
    const g = footprint(BPMAP[o.bp], o.rot);
    return !(tx+f.w<=o.tx || tx>=o.tx+g.w || ty+f.h<=o.ty || ty>=o.ty+g.h);
  });
}

/* ---------------- fresh farm ---------------- */
function newState(){
  const st = {
    v:4, day:1, season:3, weather:'sun', cash:520, xp:0, lvl:1,
    auto:{}, autoCfg:{moist:0.5, reserve:10}, autoLog:[], snd:{amb:true,mus:true}, muted:false,
    objs:[], nid:1, store:{}, water:60, feed:24, powerBal:0,
    contracts:[], log:[], speed:1, tips:true,
    seen:{}, totalEarned:0, harvests:0, seedsPlanted:0, prices:{}, tut:0
  };
  Object.keys(GOODS).forEach(k=> st.prices[k] = 1);
  S = st;
  place('cabin', 10, 6, 0, true);
  place('bed', 7, 11, 0, true);
  place('bed', 11, 11, 0, true);
  place('tank', 4, 6, 0, true);
  place('tree_native', 3, 3, 0, true);
  place('tree_shade', 18, 3, 0, true);
  place('tree_shade', 4, 14, 0, true);
  place('path', 10, 10, 0, true);
  place('hedge', 15, 13, 0, true);
  rollContracts();
  return st;
}

function place(bpId, tx, ty, rot, free){
  const bp = BPMAP[bpId];
  const o = {id:S.nid++, bp:bpId, tx, ty, rot:rot||0};
  if(bp.kind==='plot'){ o.crop=null; o.stage=0; o.water=0.5; o.pest=0; }
  if(bp.kind==='perennial'){ o.stage=0.25; }
  if(bp.kind==='animal'){ o.animals=0; o.ready=0; o.prog=0; o.hungry=0; }
  if(bp.kind==='process'){ o.recipe=-1; o.prog=0; o.ready=0; }
  if(bp.kind==='water'){ o.store = 0; o.cap = bp.cap; }
  if(bp.kind==='shop'){ o.ready=0; }
  o.tier = 0;
  if(typeof initCare==='function') initCare(o);
  if(bp.kind==='animal'){ o.herd=[]; }
  S.objs.push(o);
  if(!free) S.cash -= bp.cost;
  return o;
}

/* ---------------- derived farm-wide numbers ---------------- */
function stat(){
  let power=0, use=0, charm=0, feedGain=0, waterCap=0, waterGain=0, tour=0,
      fert=0, seedoff=0, pricebonus=0, workbonus=0, craftspeed=0, tourmul=1,
      autowater=0, pollinate=0, shelter=0, ducks=0, buffer=0;
  S.objs.forEach(o=>{
    const b = BPMAP[o.bp];
    if(b.power>0) power += E.gen(o); else if(b.power<0) use += -b.power;
    charm += E.charm(o);
    if(b.kind==='feed') feedGain += E.feed(o);
    if(b.kind==='water'){ waterCap += E.wcap(o); waterGain += E.gain(o); }
    if(b.kind==='tourism') tour += E.income(o);
    fert += b.fert||0; seedoff += b.seedoff||0; pricebonus += b.price||0;
    workbonus += b.speedwork||0; craftspeed += b.craftspeed||0;
    tourmul += b.tour||0; autowater += b.autowater||0; shelter += b.shelter||0;
    if(b.pollinate) pollinate += o.animals||0;
    if(b.animal==='duck') ducks += o.animals||0;
    if(b.buffer) buffer += 1;
  });
  const w = WEATHERS[S.weather];
  const gen = power * (BPMAP.wind && S.objs.some(o=>o.bp==='wind') ? 1 : 1) * w.power;
  const genAdj = S.objs.reduce((a,o)=>{
    const b=BPMAP[o.bp];
    if(b.kind!=='power'||!b.power) return a;
    return a + E.gen(o)*(b.storm ? (1.6 - w.power*0.4) : w.power);
  }, 0) * (typeof autoOn==='function' && autoOn('agrivoltaic') ? 1.25 : 1)
    + (S.objs.some(o=>o.bp==='cabin') ? 8*w.power : 0);
  use += (typeof autoPower==='function' ? autoPower() : 0);
  return {power:Math.round(genAdj), use, charm, feedGain, waterCap, waterGain, tour,
    fert, seedoff:Math.min(0.6,seedoff), pricebonus, workbonus, craftspeed, tourmul,
    autowater, pollinate, shelter, ducks, buffer,
    short: genAdj + buffer*3 < use};
}
function charmMul(){ const c = stat().charm; return 1 + Math.min(2.2, c/90); }
function sellPrice(gid){
  const g = GOODS[gid];
  return Math.max(1, Math.round(g.p * (S.prices[gid]||1) * (1+stat().pricebonus)));
}

/* ---------------- scene rendering ---------------- */
let terrainCache = '';
function terrain(){
  if(terrainCache) return terrainCache;
  let s = `<rect width="${WPX}" height="${HPX}" fill="url(#gMeadow)"/>`;
  for(let i=0;i<220;i++){
    s += `<ellipse cx="${n(hash(i*1.7)*WPX)}" cy="${n(hash(i*2.9+4)*HPX)}" rx="${n(4+hash(i)*11)}" ry="${n(2+hash(i+3)*5)}" fill="#b3aa78" opacity=".45"/>`;
  }
  [[40,50],[130,36],[300,30],[640,28],[980,40],[1150,150],[1180,520],[70,700],[420,790],[820,800],[1130,700],[26,340]]
    .forEach((p,k)=>{ s += canopy(p[0],p[1],16+hash(k)*9,'url(#gCanopyD)',k+20,true); });
  /* road along the right edge */
  s += `<path d="M${WPX-52} -20 L${WPX-14} ${HPX+20} L${WPX+40} ${HPX+20} L${WPX+40} -20 Z" fill="#a89f88"/>`;
  s += `<path d="M${WPX-34} -20 L${WPX+4} ${HPX+20}" stroke="#8b8371" stroke-width="2" opacity=".6"/>`;
  /* the property */
  const px=FARM.x*T, py=FARM.y*T, pw=FARM.w*T, ph=FARM.h*T;
  s += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="6" fill="url(#gLawn)"/>`;
  for(let i=0;i<Math.floor(pw/48);i++)
    s += `<rect x="${n(px+i*48)}" y="${py}" width="24" height="${ph}" fill="#fff" opacity=".035"/>`;
  s += grain(px,py,pw,ph,0.16);
  /* scattered grass tufts and clover so the lawn is not flat colour */
  for(let i=0;i<520;i++){
    const gx = px+2+hash(i*1.31)*(pw-4), gy = py+2+hash(i*2.77+9)*(ph-4);
    const len = 2.4+hash(i*3.7)*3.4, lean = (hash(i*5.1)-0.5)*2.6;
    const c = i%9===0 ? '#9dc46a' : i%5===0 ? '#5b8438' : '#79a44e';
    s += `<path d="M${n(gx)} ${n(gy)} q ${n(lean)} ${n(-len*0.6)} ${n(lean*1.7)} ${n(-len)}"
      stroke="${c}" stroke-width="${(0.6+hash(i)*0.5).toFixed(1)}" fill="none" stroke-linecap="round" opacity=".75"/>`;
  }
  for(let i=0;i<26;i++){
    const gx = px+hash(i*4.3)*pw, gy = py+hash(i*6.1+3)*ph;
    s += `<ellipse cx="${n(gx)}" cy="${n(gy)}" rx="${n(14+hash(i)*26)}" ry="${n(9+hash(i+5)*16)}"
      fill="${i%3?'#6d9445':'#87ad5b'}" opacity=".3"/>`;
  }
  /* boundary hedge */
  const hb=15;
  s += `<g transform="translate(${px-hb/2},${py-hb/2})">${hedge(pw+hb,hb)}</g>`;
  s += `<g transform="translate(${px-hb/2},${py+ph-hb/2})">${hedge(pw+hb,hb)}</g>`;
  s += `<g transform="translate(${px-hb/2},${py-hb/2})">${hedge(hb,ph+hb)}</g>`;
  s += `<g transform="translate(${px+pw-hb/2},${py-hb/2})">${hedge(hb,ph+hb)}</g>`;
  /* driveway from the road */
  const dy = py+ph*0.32;
  s += `<path d="M${WPX-40} ${n(dy+16)} C ${WPX-150} ${n(dy)}, ${n(px+pw-60)} ${n(dy)}, ${n(px+pw-4)} ${n(dy)}" stroke="#9d9276" stroke-width="30" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M${WPX-40} ${n(dy+16)} C ${WPX-150} ${n(dy)}, ${n(px+pw-60)} ${n(dy)}, ${n(px+pw-4)} ${n(dy)}" stroke="url(#gGravel)" stroke-width="25" fill="none" stroke-linecap="round"/>`;
  terrainCache = s;
  return s;
}


/* =====================================================================
   ROAD NETWORK — path tiles are merged into one continuous surface so
   neighbouring pieces join instead of stacking as separate pills.
   ===================================================================== */
const MERGE_ROAD = {path:1};
function roadTiles(){
  const set = new Set();
  S.objs.forEach(o=>{
    if(!MERGE_ROAD[o.bp]) return;
    const f = footprint(BPMAP[o.bp], o.rot);
    for(let x=0;x<f.w;x++) for(let y=0;y<f.h;y++) set.add((o.tx+x)+','+(o.ty+y));
  });
  return set;
}
function roadLayer(){
  const set = roadTiles();
  if(!set.size) return '';
  const has = (x,y)=> set.has(x+','+y);
  let base='', edge='', rut='', stones='';
  set.forEach(k=>{
    const [x,y] = k.split(',').map(Number);
    const px=x*T, py=y*T;
    /* base tile, overlapping by 1px so joins are seamless */
    base += `<rect x="${px-0.5}" y="${py-0.5}" width="${T+1}" height="${T+1}" fill="url(#gGravel)"/>`;
    const L=has(x-1,y), R=has(x+1,y), U=has(x,y-1), D=has(x,y+1);
    /* round only genuinely outer corners, by cutting the corner back to grass */
    const cut = (cx,cy,sx,sy)=>{
      const r=9;
      edge += `<path d="M${cx} ${cy+sy*r} L${cx} ${cy} L${cx+sx*r} ${cy}
        A${r} ${r} 0 0 ${sx*sy>0?0:1} ${cx} ${cy+sy*r} Z" fill="url(#gLawn)"/>`;
    };
    if(!L&&!U) cut(px,py, 1, 1);
    if(!R&&!U) cut(px+T,py, -1, 1);
    if(!L&&!D) cut(px,py+T, 1, -1);
    if(!R&&!D) cut(px+T,py+T, -1, -1);
    /* worn, darker grass margin where the surface meets lawn */
    if(!U) edge += `<rect x="${px}" y="${py-2}" width="${T}" height="4" fill="#6f8f48" opacity=".5"/>`;
    if(!D) edge += `<rect x="${px}" y="${py+T-2}" width="${T}" height="4" fill="#6f8f48" opacity=".5"/>`;
    if(!L) edge += `<rect x="${px-2}" y="${py}" width="4" height="${T}" fill="#6f8f48" opacity=".5"/>`;
    if(!R) edge += `<rect x="${px+T-2}" y="${py}" width="4" height="${T}" fill="#6f8f48" opacity=".5"/>`;
    /* wheel ruts follow whichever way the run travels */
    if(L||R){
      rut += `<rect x="${px-1}" y="${py+T*0.28}" width="${T+2}" height="3.2" fill="#8f8468" opacity=".5"/>`;
      rut += `<rect x="${px-1}" y="${py+T*0.62}" width="${T+2}" height="3.2" fill="#8f8468" opacity=".5"/>`;
    }
    if(U||D){
      rut += `<rect x="${px+T*0.28}" y="${py-1}" width="3.2" height="${T+2}" fill="#8f8468" opacity=".45"/>`;
      rut += `<rect x="${px+T*0.62}" y="${py-1}" width="3.2" height="${T+2}" fill="#8f8468" opacity=".45"/>`;
    }
    /* size-varied aggregate */
    for(let i=0;i<11;i++){
      const sx = px+2+hash(x*31+y*17+i)*(T-4), sy = py+2+hash(x*13+y*29+i*3)*(T-4);
      const rr = 0.5+hash(i+x+y)*1.5;
      stones += `<circle cx="${n(sx)}" cy="${n(sy)}" r="${n(rr)}" fill="${i%3?'#8f8468':'#e0d6bd'}" opacity=".6"/>`;
    }
    /* spill of loose stones onto the grass at the edges */
    if(!D) for(let i=0;i<4;i++)
      stones += `<circle cx="${n(px+4+hash(i*7+x)*(T-8))}" cy="${n(py+T+1+hash(i*11+y)*4)}" r="${n(0.6+hash(i)*0.9)}" fill="#b6a988" opacity=".7"/>`;
    if(!U) for(let i=0;i<4;i++)
      stones += `<circle cx="${n(px+4+hash(i*5+y)*(T-8))}" cy="${n(py-1-hash(i*9+x)*4)}" r="${n(0.6+hash(i+2)*0.9)}" fill="#b6a988" opacity=".7"/>`;
  });
  return `<g class="roadlay">${base}${edge}${rut}${stones}
    <g opacity=".22">${Array.from(set).map(k=>{const[x,y]=k.split(',').map(Number);
      return `<rect x="${x*T}" y="${y*T}" width="${T}" height="${T}" filter="url(#fGrain)" style="mix-blend-mode:overlay"/>`;}).join('')}</g></g>`;
}

function objTransform(o, bp){
  const f = footprint(bp, o.rot);
  const ox = o.tx*T, oy = o.ty*T;
  return `translate(${n(ox + f.w*T/2)},${n(oy + f.h*T/2)}) rotate(${o.rot}) translate(${n(-bp.w*T/2)},${n(-bp.h*T/2)})`;
}

function drawObj(o){
  const bp = BPMAP[o.bp];
  if(MERGE_ROAD[o.bp]){
    /* surface is drawn once by roadLayer(); this is just the hit area */
    const f = footprint(bp, o.rot);
    return `<g class="ob road-hit" data-id="${o.id}">
      <rect x="${o.tx*T}" y="${o.ty*T}" width="${f.w*T}" height="${f.h*T}" fill="transparent"/></g>`;
  }
  const fn = ART[bp.art] || ART.shed;
  const art = fn(bp.w*T, bp.h*T, o) + tierSkin(bp.w*T, bp.h*T, tOf(o), bp);
  return `<g class="ob${sel===o.id?' selob':''}" data-id="${o.id}" transform="${objTransform(o,bp)}">${art}</g>`;
}

function render(){
  const objs = S.objs.slice().sort((a,b)=>{
    const A=BPMAP[a.bp], B=BPMAP[b.bp];
    const ra = A.cat==='land'&&(A.art==='path'||A.art==='ring'||A.art==='parking') ? 0 : 1;
    const rb = B.cat==='land'&&(B.art==='path'||B.art==='ring'||B.art==='parking') ? 0 : 1;
    if(ra!==rb) return ra-rb;
    return (a.ty+BPMAP[a.bp].h) - (b.ty+BPMAP[b.bp].h);
  });
  let g = '';
  if(ghost){
    const f = footprint(ghost.bp, ghost.rot);
    for(let x=FARM.x;x<FARM.x+FARM.w;x++) for(let y=FARM.y;y<FARM.y+FARM.h;y++){}
    g += `<g class="gridlay">`;
    for(let x=FARM.x;x<=FARM.x+FARM.w;x++) g += `<line x1="${x*T}" y1="${FARM.y*T}" x2="${x*T}" y2="${(FARM.y+FARM.h)*T}" stroke="#fff" stroke-opacity=".13" stroke-width="1"/>`;
    for(let y=FARM.y;y<=FARM.y+FARM.h;y++) g += `<line x1="${FARM.x*T}" y1="${y*T}" x2="${(FARM.x+FARM.w)*T}" y2="${y*T}" stroke="#fff" stroke-opacity=".13" stroke-width="1"/>`;
    g += `</g>`;
    const bad = overlaps(ghost.tx, ghost.ty, f, ghost.moving) || S.cash < (ghost.moving?0:ghost.bp.cost);
    const fake = {id:-1, bp:ghost.bp.id, tx:ghost.tx, ty:ghost.ty, rot:ghost.rot,
      crop:null, stage:0.6, water:.6, animals:2, ready:0, store:(ghost.bp.cap||0)*0.6, cap:ghost.bp.cap};
    g += `<g opacity=".72">${drawObj(fake)}</g>`;
    g += `<rect x="${ghost.tx*T}" y="${ghost.ty*T}" width="${f.w*T}" height="${f.h*T}" rx="4"
      fill="${bad?'#e2705c':'#7cc24f'}" fill-opacity=".2" stroke="${bad?'#e2705c':'#7cc24f'}" stroke-width="2.5"/>`;
  }
  let selRing = '';
  if(sel){
    const o = S.objs.find(z=>z.id===sel);
    if(o){ const f = footprint(BPMAP[o.bp], o.rot);
      selRing = `<rect x="${o.tx*T-2}" y="${o.ty*T-2}" width="${f.w*T+4}" height="${f.h*T+4}" rx="5"
        fill="none" stroke="#f0c14b" stroke-width="2.5" stroke-dasharray="7 5" class="selring"/>`; }
  }
  $('#scene').innerHTML =
    `<svg width="${WPX}" height="${HPX}" viewBox="0 0 ${WPX} ${HPX}" xmlns="http://www.w3.org/2000/svg">
      ${DEFS()}${terrain()}
      ${roadLayer()}
      <g id="obs">${objs.map(drawObj).join('')}</g>
      ${herdLayer()}
      ${selRing}${g}
    </svg>`;
  renderLabels();
}

function renderLabels(){
  const L = $('#wlabels');
  let h = '';
  S.objs.forEach(o=>{
    const bp = BPMAP[o.bp];
    const f = footprint(bp, o.rot);
    if(f.w < 3 && f.h < 3) return;
    if(bp.kind==='decor') return;          // paths, hedges, fences, trees stay quiet
    const cx = (o.tx + f.w/2)*T, by = (o.ty + f.h)*T;
    let txt = bp.name, cls = '';
    const st = objState(o);
    if(st.alert){ txt = st.alert; cls = ' alert'; }
    else if(st.ready){ txt = st.ready; cls = ' ready'; }
    h += `<div class="wlab${cls}" style="left:${n(cx)}px;top:${n(by+3)}px">${txt}</div>`;
  });
  L.innerHTML = h;
  L.style.transform = `translate(${cam.x}px,${cam.y}px) scale(${cam.z})`;
  L.style.transformOrigin = '0 0';
}

/* short status used by labels + inspector */
function objState(o){
  const bp = BPMAP[o.bp];
  const r = {alert:'', ready:''};
  if(bp.kind==='plot'){
    if(!o.crop) r.alert = 'Empty — plant';
    else if(o.stage>=1) r.ready = 'Harvest ' + CROPS[o.crop].name;
    else if(o.water<0.18) r.alert = 'Thirsty!';
    else if(o.pest) r.alert = 'Pests!';
  } else if(bp.kind==='perennial'){
    if(o.stage>=1) r.ready = 'Pick ' + GOODS[bp.good].n;
  } else if(bp.kind==='animal'){
    if(!o.animals) r.alert = 'Buy ' + bp.animal + 's';
    else if(o.ready>0) r.ready = 'Collect ' + o.ready;
    else if(o.hungry) r.alert = 'Hungry!';
  } else if(bp.kind==='process'){
    if(o.ready>0) r.ready = 'Collect batch';
    else if(o.recipe<0) r.alert = 'Idle — set a recipe';
  } else if(bp.kind==='shop'){
    if(!Object.keys(S.store).length) r.alert = 'Nothing to sell';
  }
  return r;
}

/* ---------------- camera ---------------- */
function applyCam(){
  $('#scene').style.transform = `translate(${cam.x}px,${cam.y}px) scale(${cam.z})`;
  const L=$('#wlabels');
  L.style.transform = `translate(${cam.x}px,${cam.y}px) scale(${cam.z})`;
}
function fitView(){
  const w = $('#world').clientWidth, h = $('#world').clientHeight;
  cam.z = clamp(Math.min(w/WPX, h/HPX)*0.98, 0.3, 2);
  cam.x = (w - WPX*cam.z)/2; cam.y = (h - HPX*cam.z)/2;
  applyCam();
}
function zoomAt(delta, px, py){
  const z0 = cam.z, z1 = clamp(cam.z*(1+delta), 0.32, 2.6);
  if(z1===z0) return;
  const wx = (px - cam.x)/z0, wy = (py - cam.y)/z0;
  cam.z = z1; cam.x = px - wx*z1; cam.y = py - wy*z1;
  applyCam();
}
function screenToTile(cx,cy){
  const r = $('#world').getBoundingClientRect();
  const wx = (cx - r.left - cam.x)/cam.z, wy = (cy - r.top - cam.y)/cam.z;
  return {tx:Math.floor(wx/T), ty:Math.floor(wy/T), wx, wy};
}

/* ---------------- simulation ---------------- */
function rollWeather(){
  const se = S.season;
  const tbl = [
    ['sun','sun','sun','heat','cloud','rain'],            // summer
    ['sun','cloud','cloud','rain','rain','storm'],        // autumn
    ['cloud','rain','rain','frost','frost','storm'],      // winter
    ['sun','sun','cloud','rain','cloud','rain'],          // spring
  ][se];
  S.weather = tbl[Math.floor(Math.random()*tbl.length)];
}

function advanceDay(){
  S.day++;
  if((S.day-1) % 28 === 0) { S.season = (S.season+1)%4; log(`${SEASONS[S.season].n} begins.`,'gold'); }
  rollWeather();
  const se = SEASONS[S.season], we = WEATHERS[S.weather], st = stat();

  /* --- water --- */
  const rain = we.rain * (1 + se.rain);
  S.water = clamp(S.water + rain + st.waterGain, 0, Math.max(1,st.waterCap));
  /* --- power --- */
  S.powerBal = st.power - st.use;
  const powerOK = !st.short;

  /* --- feed --- */
  S.feed += st.feedGain;

  /* --- crops --- */
  let thirsty=0, grew=0;
  S.objs.forEach(o=>{
    const bp = BPMAP[o.bp];
    if(bp.kind==='plot' && o.crop){
      const cr = CROPS[o.crop];
      const evap = 0.16 * we.evap * se.evap * cr.thirst * (bp.shelter?0.7:1);
      if(st.autowater && powerOK && S.water>3){ o.water = 1; S.water -= 3; }
      o.water = clamp(o.water - evap, 0, 1);
      if(o.water < 0.16){ thirsty++; }
      else {
        let g = (1/cr.days) * se.growth * we.growth * (1 + st.fert) * (1 + Math.min(0.35, st.pollinate*0.05));
        g *= E.speed(o) * cropMul(o);
        if(bp.shelter) g *= 1; else if(S.weather==='storm') g *= 0.7;
        if(!bp.shelter && !cr.seasons.includes(S.season)) g *= 0.5;
        if(o.pest) g *= 0.45;
        if(bp.power<0 && !powerOK) g *= 0.5;
        o.stage = clamp(o.stage + g, 0, 1);
        grew++;
      }
      /* pests */
      if(!o.pest && Math.random() < 0.05*(1 - Math.min(0.8, st.ducks*0.12))) o.pest = 1;
    }
    if(bp.kind==='plot') dailySoil(o);
    if(bp.kind==='perennial'){
      let g = (1/E.cycle(o)) * se.growth * we.growth * (1 + st.fert) * (1 + Math.min(0.35, st.pollinate*0.05));
      o.stage = clamp(o.stage + g, 0, 1);
    }
    if(bp.kind==='animal' && o.animals>0){
      const need = bp.feed * o.animals;
      if(S.feed >= need){ S.feed -= need; o.hungry = 0; o.prog += 1/E.cycle(o); }
      else { o.hungry = 1; }
      dailyHusbandry(o);
      if(o.prog >= 1){
        o.prog = 0;
        o.ready += Math.max(1, Math.round(E.per(o) * o.animals * yieldMul(o)));
      }
    }
    if(bp.kind==='process' && o.recipe>=0 && o.ready===0){
      const rc = bp.recipes[o.recipe];
      if(o.prog>0 || canCraft(rc)){
        if(o.prog===0) takeCraft(rc);
        o.prog += (1/rc.days) * (1 + st.craftspeed) * (powerOK?1:0.4);
        if(o.prog>=1){ o.prog=0; Object.keys(rc.out).forEach(k=> o.ready += rc.out[k]); o.outKeep = rc.out; }
      }
    }
    if(bp.kind==='shop'){
      const rate = E.rate(o) * (1 + Math.min(1.6, st.charm/110));
      let n0 = Math.floor(rate + (Math.random()<(rate%1)?1:0));
      while(n0-- > 0){
        const keys = Object.keys(S.store).filter(k=>S.store[k]>0);
        if(!keys.length) break;
        const pick = bp.markup ? (keys.find(k=>GOODS[k].craft) || keys[0]) : keys[Math.floor(Math.random()*keys.length)];
        S.store[pick]--; if(S.store[pick]<=0) delete S.store[pick];
        earn(sellPrice(pick) * (bp.markup||1) * 0.92, 0);
      }
    }
  });

  /* --- tourism --- */
  if(st.tour>0){
    const inc = st.tour * charmMul() * se.tour * we.tour * st.tourmul;
    if(inc>0.5) earn(inc, 0);
  }

  /* --- market drift --- */
  Object.keys(S.prices).forEach(k=>{
    S.prices[k] = clamp(S.prices[k] + (Math.random()-0.5)*0.13, 0.72, 1.5);
  });

  /* --- contracts --- */
  S.contracts.forEach(c=>{ c.left--; });
  const gone = S.contracts.filter(c=>c.left<=0 && !c.done);
  if(gone.length) log(`${gone.length} order expired.`,'bad');
  S.contracts = S.contracts.filter(c=>c.left>0 && !c.done);
  if(S.contracts.length < 3 && Math.random()<0.6) rollContracts(1);

  /* --- the AI does its rounds --- */
  if(typeof runAutomation==='function') runAutomation();

  /* --- messages --- */
  if(thirsty) log(`${thirsty} bed${thirsty>1?'s are':' is'} too dry to grow.`,'bad');
  if(st.short) log('Not enough power — production is slowed.','bad');
  if(S.feed <= 0 && S.objs.some(o=>BPMAP[o.bp].kind==='animal' && o.animals>0))
    log('Out of feed! Animals stopped producing.','bad');
  if(S.weather==='storm' && Math.random()<0.35 && st.shelter<2){
    const beds = S.objs.filter(o=>BPMAP[o.bp].kind==='plot' && o.crop && o.stage>0.2 && !BPMAP[o.bp].shelter);
    if(beds.length){ const b = beds[Math.floor(Math.random()*beds.length)];
      b.stage = Math.max(0, b.stage-0.3); log('Storm damage in an unsheltered bed. Plant hedges!','bad'); }
  }
  if(typeof SND!=='undefined'){ SND.weather(S.weather); SND.seasonTint(); }
  render(); ui();
}

function canCraft(rc){ return Object.keys(rc.in).every(k => (S.store[k]||0) >= rc.in[k]); }
function takeCraft(rc){ Object.keys(rc.in).forEach(k=>{ S.store[k]-=rc.in[k]; if(S.store[k]<=0) delete S.store[k]; }); }

/* ---------------- economy ---------------- */
function earn(v, xp, at){
  v = Math.round(v);
  S.cash += v; S.totalEarned += v;
  if(xp) addXP(xp);
  if(at) floatNum('+'+fmt(v), at.x, at.y, '#f0c14b');
}
function addXP(v){
  S.xp += v;
  while(S.xp >= xpFor(S.lvl)){
    S.xp -= xpFor(S.lvl); S.lvl++;
    const un = BP.filter(b=>b.lvl===S.lvl);
    toast(`Level ${S.lvl}! ${un.length?un.length+' new buildings unlocked':''}`,'gold');
    log(`Reached level ${S.lvl}.`,'gold');
    if(un.length) log('Unlocked: '+un.map(b=>b.name).join(', '),'good');
  }
}
function give(gid, qty){ S.store[gid] = (S.store[gid]||0) + qty; }

function rollContracts(count){
  count = count || 3;
  const pool = Object.keys(GOODS);
  for(let i=0;i<count;i++){
    const owned = new Set();
    S.objs.forEach(o=>{ const b=BPMAP[o.bp];
      if(b.good) owned.add(b.good);
      if(b.kind==='plot') Object.keys(CROPS).forEach(c=>owned.add(c));
      if(b.recipes) b.recipes.forEach(r=>Object.keys(r.out).forEach(k=>owned.add(k)));
    });
    const list = owned.size ? Array.from(owned) : ['lettuce','carrot'];
    const gid = list[Math.floor(Math.random()*list.length)];
    const base = GOODS[gid].p;
    const qty = Math.max(3, Math.round((GOODS[gid].craft?3:9) * (0.7+Math.random()*0.9)));
    const days = Math.max(4, Math.round(qty/2 + 4));
    const pay = Math.round(base*qty*(1.5+Math.random()*0.5));
    const names = ['Village grocer','Farmers market','The Bakehouse','Riverside cafe','Wholesale co-op','Hotel kitchen'];
    S.contracts.push({id:'c'+Date.now()+i, who:names[Math.floor(Math.random()*names.length)],
      gid, qty, left:days, pay, done:false});
  }
}
