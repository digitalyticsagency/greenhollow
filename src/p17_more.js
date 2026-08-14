/* =====================================================================
   FIXES + ROADS + RECREATION + EXPANSION + A LIVING HORIZON
   ===================================================================== */

/* ---------------------------------------------------------------
   BUG 1 — "Fit" framed the whole world canvas instead of your land.
   The canvas is much bigger than the property (it carries the
   horizon), so fitting it left the farm tiny in a sea of margin.
   --------------------------------------------------------------- */
fitView = function(){
  const world = document.getElementById('world');
  if(!world) return;
  const arc = document.getElementById('sunarc');
  const arcH = (arc && arc.style.display !== 'none') ? arc.getBoundingClientRect().height : 0;

  /* The container can report zero height while the grid is still settling
     (or if a layout rule collapses it). Fall back to the window rather than
     dividing by nothing and flinging the camera off-screen. */
  let w = world.clientWidth, h = world.clientHeight;
  if(w < 40){
    const left = document.getElementById('left'), right = document.getElementById('right');
    const sideW = (left ? left.clientWidth : 0) + (right ? right.clientWidth : 0);
    w = Math.max(240, window.innerWidth - sideW);
  }
  if(h < 40 + arcH){
    const top = document.getElementById('top'), tabs = document.getElementById('mobtabs');
    const chrome = (top ? top.offsetHeight : 0) + (tabs ? tabs.offsetHeight : 0);
    h = Math.max(240, window.innerHeight - chrome);
  }
  const availH = Math.max(120, h - arcH);

  const pad = T * 1.2;
  const pw = FARM.w*T + pad*2, ph = FARM.h*T + pad*2;
  cam.z = clamp(Math.min(w/pw, availH/ph), 0.18, 2.6);
  const px = FARM.x*T - pad, py = FARM.y*T - pad;
  cam.x = (w - pw*cam.z)/2 - px*cam.z;
  cam.y = (availH - ph*cam.z)/2 - py*cam.z + arcH;

  /* Post-condition: the property must actually be visible. If anything above
     went wrong, put it somewhere sane rather than leaving a blank screen. */
  const sx = FARM.x*T*cam.z + cam.x, sy = FARM.y*T*cam.z + cam.y;
  const sw = FARM.w*T*cam.z, sh = FARM.h*T*cam.z;
  if(!isFinite(sx) || !isFinite(sy) || sx+sw < 20 || sy+sh < 20 || sx > w-20 || sy > h-20){
    cam.z = clamp(Math.min(w/pw, availH/ph), 0.18, 2.6) || 0.6;
    cam.x = w/2  - (FARM.x + FARM.w/2)*T*cam.z;
    cam.y = arcH + availH/2 - (FARM.y + FARM.h/2)*T*cam.z;
  }
  applyCam();
};
/* run after layout has settled, so a fit during a resize measures real boxes */
G.fit = function(){
  sfx('click');
  fitView();
  requestAnimationFrame(()=> requestAnimationFrame(fitView));
};

/* ---------------------------------------------------------------
   BUG 2 — the rain bed was far too loud. A constant band-passed
   noise layer at that gain is fatiguing; it is now much quieter,
   softer in tone, and has its own volume slider.
   --------------------------------------------------------------- */
SETTINGS.push({g:'Audio', k:'volWeather', n:'Weather volume', t:'range', min:0, max:100, def:35, unit:'%',
  d:'Rain and storm beds. Lower this if wet days get tiring.'});

/* ---------------------------------------------------------------
   ROADS — people follow the gravel unless the detour is silly
   --------------------------------------------------------------- */
function isRoadTile(x,y){
  return S.objs.some(o=>{
    if(!MERGE_ROAD[o.bp] && o.bp!=='ring' && o.bp!=='parking') return false;
    const f = footprint(BPMAP[o.bp], o.rot);
    return x>=o.tx && x<o.tx+f.w && y>=o.ty && y<o.ty+f.h;
  });
}
/* weighted A*: a road step costs a third of a step across open ground,
   so a route will happily bend a long way to pick up a path */
function findPathWeighted(sx,sy,gx,gy){
  const key=(x,y)=>x+','+y;
  const H=(x,y)=>(Math.abs(x-gx)+Math.abs(y-gy))*0.34;
  const open=[{x:sx,y:sy,g:0,f:0,p:null}], best={[key(sx,sy)]:0};
  let goal=null, guard=0;
  while(open.length && guard++ < 9000){
    let bi=0; for(let i=1;i<open.length;i++) if(open[i].f<open[bi].f) bi=i;
    const cur = open.splice(bi,1)[0];
    if(Math.abs(cur.x-gx)<=1 && Math.abs(cur.y-gy)<=1){ goal=cur; break; }
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{
      const nx=cur.x+d[0], ny=cur.y+d[1];
      if(blockedTile(nx,ny)) return;
      const step = isRoadTile(nx,ny) ? 0.34 : 1;
      const g = cur.g + step, k = key(nx,ny);
      if(best[k]!==undefined && best[k]<=g) return;
      best[k]=g;
      open.push({x:nx,y:ny,g,f:g+H(nx,ny),p:cur});
    });
  }
  if(!goal) return null;
  const path=[]; let c=goal;
  while(c){ path.unshift({x:c.x,y:c.y}); c=c.p; }
  return {path:path.slice(1), cost:goal.g};
}
/* Replace the plain router. If following the road would take more than
   ~75% longer in actual steps, the walker judges it not worth it. */
const _findPathPlain = findPath;
findPath = function(sx,sy,gx,gy){
  if(!S.objs.some(o=>MERGE_ROAD[o.bp]||o.bp==='ring'||o.bp==='parking'))
    return _findPathPlain(sx,sy,gx,gy);
  const roadRoute = findPathWeighted(sx,sy,gx,gy);
  const direct = _findPathPlain(sx,sy,gx,gy);
  if(!roadRoute) return direct;
  if(!direct || !direct.length) return roadRoute.path;
  if(roadRoute.path.length > direct.length * 1.75) return direct;   // detour not worth it
  return roadRoute.path;
};

/* ---------------------------------------------------------------
   RECREATION — things for the children and the adults to actually do
   --------------------------------------------------------------- */
const REC = [
 {id:'sandpit',   name:'Sandpit',            w:3,h:2, cost:70,  lvl:2, charm:7,  who:'child', act:'digging in the sand'},
 {id:'treehouse', name:'Treehouse',          w:3,h:3, cost:210, lvl:3, charm:16, who:'child', act:'up the treehouse'},
 {id:'trampoline',name:'Trampoline',         w:3,h:3, cost:160, lvl:3, charm:11, who:'child', act:'on the trampoline'},
 {id:'swingset',  name:'Swing set',          w:3,h:2, cost:95,  lvl:2, charm:9,  who:'child', act:'on the swings'},
 {id:'pitch',     name:'Ball pitch',         w:6,h:4, cost:180, lvl:3, charm:12, who:'child', act:'kicking a ball about'},
 {id:'mudkitchen',name:'Mud kitchen',        w:2,h:2, cost:55,  lvl:2, charm:6,  who:'child', act:'making mud pies'},
 {id:'bbq',       name:'Barbecue &amp; table',   w:4,h:3, cost:150, lvl:2, charm:12, who:'adult', act:'firing up the barbecue'},
 {id:'hottub',    name:'Wood-fired hot tub', w:3,h:3, cost:380, lvl:4, charm:22, who:'adult', act:'in the hot tub'},
 {id:'boules',    name:'Boules court',       w:6,h:2, cost:120, lvl:3, charm:10, who:'adult', act:'playing boules'},
 {id:'cinema',    name:'Outdoor cinema',     w:5,h:4, cost:320, lvl:5, charm:20, who:'adult', act:'watching a film outside'},
 {id:'readnook',  name:'Reading nook',       w:3,h:2, cost:90,  lvl:2, charm:9,  who:'adult', act:'reading in the shade'},
 {id:'sauna',     name:'Garden sauna',       w:3,h:3, cost:340, lvl:4, charm:18, who:'adult', act:'in the sauna'},
];
REC.forEach(r=>{
  const bp = {id:r.id, name:r.name, art:'rec_'+r.id, cat:'leisure', w:r.w, h:r.h,
    cost:r.cost, lvl:r.lvl, kind:'rec', charm:r.charm, who:r.who, act:r.act,
    desc:`Somewhere for the ${r.who==='child'?'children':'adults'} to spend time. Raises household morale.`,
    tip:'Recreation lifts morale, morale pulls back burnout, and burnout is what your salary is scaled by.'};
  BP.push(bp); BPMAP[r.id] = bp;
});
CATS.push({id:'leisure', n:'Leisure', tip:'Play and rest. Morale is worth real money through your salary.'});

/* art for each, built from parts we already have */
ART.rec_sandpit = (w,h)=>{
  let s = patch(w,h,'#93bd64',71,1);
  s += `<ellipse cx="${n(w/2)}" cy="${n(h/2+1)}" rx="${n(w*0.4)}" ry="${n(h*0.36)}" fill="#b9ab82"/>`;
  s += `<ellipse cx="${n(w/2)}" cy="${n(h/2)}" rx="${n(w*0.37)}" ry="${n(h*0.32)}" fill="#e6d9ae"/>`;
  s += `<rect x="${n(w*0.2)}" y="${n(h*0.6)}" width="6" height="4" rx="1" fill="#c8583f"/>`;
  s += `<circle cx="${n(w*0.7)}" cy="${n(h*0.42)}" r="2.6" fill="#3f8fb8"/>`;
  return s;
};
ART.rec_treehouse = (w,h)=>{
  let s = canopy(w/2, h*0.55, Math.min(w,h)*0.46, 'url(#gCanopy)', 12, false);
  s += `<g transform="translate(${n(w*0.24)},${n(h*0.2)})">${building(w*0.5,h*0.34,{roof:'url(#gRoofRed)',skirt:0})}</g>`;
  s += `<path d="M${n(w*0.5)} ${n(h*0.54)} L${n(w*0.62)} ${n(h*0.92)}" stroke="#8b6640" stroke-width="2.4"/>`;
  for(let i=0;i<4;i++) s += `<rect x="${n(w*0.5+i*w*0.03)}" y="${n(h*0.6+i*h*0.08)}" width="7" height="2" rx="1" fill="#a8814f"/>`;
  return s;
};
ART.rec_trampoline = (w,h)=>{
  let s = patch(w,h,'#8cb35f',73,1);
  s += `<ellipse cx="${n(w/2)}" cy="${n(h/2+2)}" rx="${n(w*0.42)}" ry="${n(h*0.38)}" fill="#16240c" opacity=".3"/>`;
  s += `<ellipse cx="${n(w/2)}" cy="${n(h/2)}" rx="${n(w*0.42)}" ry="${n(h*0.38)}" fill="#2f4756"/>`;
  s += `<ellipse cx="${n(w/2)}" cy="${n(h/2)}" rx="${n(w*0.34)}" ry="${n(h*0.3)}" fill="#3d5a6b"/>`;
  s += `<ellipse cx="${n(w/2)}" cy="${n(h/2)}" rx="${n(w*0.34)}" ry="${n(h*0.3)}" fill="none" stroke="#8fa8b0" stroke-width="1.4"/>`;
  return s;
};
ART.rec_swingset = (w,h)=>{
  let s = patch(w,h,'#8cb35f',77,1);
  s += `<path d="M${n(w*0.15)} ${n(h*0.85)} L${n(w*0.35)} ${n(h*0.2)} L${n(w*0.85)} ${n(h*0.2)}" stroke="#a8814f" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M${n(w*0.85)} ${n(h*0.2)} L${n(w*0.9)} ${n(h*0.85)}" stroke="#a8814f" stroke-width="2.6" stroke-linecap="round"/>`;
  ['#c8583f','#3f8fb8'].forEach((c,i)=>{
    const x = w*(0.45+i*0.22);
    s += `<g class="swingy" style="transform-origin:${n(x)}px ${n(h*0.2)}px">
      <line x1="${n(x)}" y1="${n(h*0.22)}" x2="${n(x)}" y2="${n(h*0.62)}" stroke="#6d5b44" stroke-width="1"/>
      <rect x="${n(x-3.5)}" y="${n(h*0.62)}" width="7" height="2.4" rx="1" fill="${c}"/></g>`;
  });
  return s;
};
ART.rec_pitch = (w,h)=>{
  let s = patch(w,h,'#7fb254',79,1);
  s += `<rect x="3" y="3" width="${n(w-6)}" height="${n(h-6)}" rx="2" fill="none" stroke="#fff" stroke-width="1.4" opacity=".55"/>`;
  s += `<line x1="${n(w/2)}" y1="3" x2="${n(w/2)}" y2="${n(h-3)}" stroke="#fff" stroke-width="1.2" opacity=".45"/>`;
  s += `<circle cx="${n(w/2)}" cy="${n(h/2)}" r="${n(h*0.18)}" fill="none" stroke="#fff" stroke-width="1.2" opacity=".45"/>`;
  s += `<rect x="1" y="${n(h*0.38)}" width="3" height="${n(h*0.24)}" fill="#e8eef0"/>`;
  s += `<rect x="${n(w-4)}" y="${n(h*0.38)}" width="3" height="${n(h*0.24)}" fill="#e8eef0"/>`;
  s += `<circle cx="${n(w*0.42)}" cy="${n(h*0.56)}" r="2.2" fill="#fff"/>`;
  return s;
};
ART.rec_mudkitchen = (w,h)=>{
  let s = patch(w,h,'#8cb35f',83,1);
  s += `<rect x="${n(w*0.2)}" y="${n(h*0.42)}" width="${n(w*0.6)}" height="${n(h*0.32)}" rx="2" fill="url(#gTimber)"/>`;
  s += `<circle cx="${n(w*0.36)}" cy="${n(h*0.52)}" r="3" fill="#4b3520"/>`;
  s += `<rect x="${n(w*0.56)}" y="${n(h*0.46)}" width="7" height="5" rx="1" fill="#8fa8b0"/>`;
  return s;
};
ART.rec_bbq = (w,h)=>{
  let s = gravel(w,h,'rect',4);
  s += `<rect x="${n(w*0.1)}" y="${n(h*0.2)}" width="${n(w*0.3)}" height="${n(h*0.3)}" rx="2" fill="#4d565f"/>`;
  s += `<rect x="${n(w*0.12)}" y="${n(h*0.24)}" width="${n(w*0.26)}" height="3" fill="#2a3238"/>`;
  s += `<circle class="flame" cx="${n(w*0.25)}" cy="${n(h*0.3)}" r="2.4" fill="#e8862e"/>`;
  s += `<rect x="${n(w*0.5)}" y="${n(h*0.36)}" width="${n(w*0.42)}" height="${n(h*0.26)}" rx="2" fill="#c69a68"/>`;
  for(let i=0;i<3;i++) s += `<rect x="${n(w*0.52+i*w*0.13)}" y="${n(h*0.66)}" width="7" height="3" rx="1" fill="#a8814f"/>`;
  return s;
};
ART.rec_hottub = (w,h)=>{
  const R = Math.min(w,h)*0.38;
  let s = ART.deck(w,h);
  s += `<circle cx="${n(w/2)}" cy="${n(h/2)}" r="${n(R+2)}" fill="#7d5931"/>`;
  s += `<circle cx="${n(w/2)}" cy="${n(h/2)}" r="${n(R)}" fill="url(#gWater)"/>`;
  for(let i=0;i<5;i++) s += `<circle class="pulse" cx="${n(w/2+(hash(i)-0.5)*R)}" cy="${n(h/2+(hash(i+3)-0.5)*R)}"
    r="1.6" fill="#fff" opacity=".5" style="animation-delay:${(i*0.4).toFixed(1)}s"/>`;
  s += `<rect x="${n(w*0.08)}" y="${n(h*0.66)}" width="${n(w*0.16)}" height="${n(h*0.2)}" rx="1.5" fill="#5d544d"/>`;
  return s;
};
ART.rec_boules = (w,h)=>{
  let s = gravel(w,h,'rect',3);
  s += `<rect x="1" y="1" width="${n(w-2)}" height="${n(h-2)}" rx="2" fill="none" stroke="#8b6640" stroke-width="1.8"/>`;
  [0.3,0.42,0.55,0.68].forEach((t,i)=> s += `<circle cx="${n(w*t)}" cy="${n(h*(0.4+0.2*hash(i)))}" r="2.2" fill="#9aa3ac"/>`);
  s += `<circle cx="${n(w*0.8)}" cy="${n(h*0.5)}" r="1.4" fill="#c8583f"/>`;
  return s;
};
ART.rec_cinema = (w,h)=>{
  let s = patch(w,h,'#8cb35f',89,1);
  s += `<rect x="${n(w*0.12)}" y="${n(h*0.1)}" width="${n(w*0.76)}" height="${n(h*0.34)}" rx="2" fill="#e8eef0"/>`;
  s += `<rect x="${n(w*0.12)}" y="${n(h*0.1)}" width="${n(w*0.76)}" height="${n(h*0.34)}" rx="2" fill="#8fb6d4" opacity=".5"/>`;
  s += `<rect x="${n(w*0.12)}" y="${n(h*0.42)}" width="${n(w*0.76)}" height="3" fill="#5d544d"/>`;
  for(let r0=0;r0<2;r0++) for(let i=0;i<4;i++)
    s += `<rect x="${n(w*(0.2+i*0.16))}" y="${n(h*(0.6+r0*0.16))}" width="7" height="5" rx="1.5" fill="#7d5931"/>`;
  return s;
};
ART.rec_readnook = (w,h)=>{
  let s = patch(w,h,'#8cb35f',91,1);
  s += canopy(w*0.24, h*0.4, Math.min(w,h)*0.34, 'url(#gCanopy)', 4, true);
  s += `<rect x="${n(w*0.46)}" y="${n(h*0.46)}" width="${n(w*0.42)}" height="${n(h*0.3)}" rx="3" fill="#a8814f"/>`;
  s += `<rect x="${n(w*0.48)}" y="${n(h*0.42)}" width="${n(w*0.38)}" height="${n(h*0.2)}" rx="3" fill="#d8c9a8"/>`;
  return s;
};
ART.rec_sauna = (w,h)=>{
  let s = building(w,h,{roof:'url(#gRoofRed)', chimney:1});
  s += `<path class="steam" d="M${n(w*0.3)} ${n(h*0.2)} q 3 -6 0 -11" stroke="#e8eef0" stroke-width="2" fill="none" opacity=".5"/>`;
  s += `<path class="steam" d="M${n(w*0.45)} ${n(h*0.18)} q -3 -7 0 -13" stroke="#e8eef0" stroke-width="1.6" fill="none" opacity=".4" style="animation-delay:1.1s"/>`;
  return s;
};

/* recreation lifts morale each day, and the family use it */
function recreationDay(){
  const recs = S.objs.filter(o=>BPMAP[o.bp].kind==='rec');
  if(!recs.length) return;
  const kid = recs.filter(o=>BPMAP[o.bp].who==='child').length;
  const adult = recs.filter(o=>BPMAP[o.bp].who==='adult').length;
  const lift = Math.min(0.09, (kid*0.02 + adult*0.025));
  S.morale = clamp((S.morale||0.6) + lift, 0, 1);
  if(S.career) S.career.burnout = clamp(S.career.burnout - lift*0.5, 0, 0.6);
}

/* ---------------------------------------------------------------
   The family use the recreation and the craft buildings
   --------------------------------------------------------------- */
const _routine = routine;
routine = function(p){
  const f = dayFrac();
  if(f < 0.24 || f > 0.88) return _routine(p);
  const want = p.role==='child' ? 'child' : 'adult';
  const recs = S.objs.filter(o=>BPMAP[o.bp].kind==='rec' && BPMAP[o.bp].who===want);
  /* children play mid-afternoon; adults unwind in the evening */
  const playtime = p.role==='child' ? (f>0.55 && f<0.78) : (f>0.70 && f<0.86);
  if(playtime && recs.length){
    const o = recs[Math.floor(hash(p.id.length*3 + Math.floor(f*9))*recs.length)];
    const ft = footprint(BPMAP[o.bp], o.rot);
    return {x:(o.tx+ft.w/2)*T, y:(o.ty+ft.h+0.4)*T, act:BPMAP[o.bp].act};
  }
  /* partner does a turn in whichever craft building is running */
  if(p.role==='partner' && f>0.52 && f<0.70){
    const craft = S.objs.filter(o=>BPMAP[o.bp].kind==='process' && o.recipe>=0);
    if(craft.length){
      const o = craft[0], ft = footprint(BPMAP[o.bp], o.rot);
      return {x:(o.tx+ft.w/2)*T, y:(o.ty+ft.h+0.4)*T, act:'working in the '+BPMAP[o.bp].name.toLowerCase()};
    }
  }
  return _routine(p);
};

/* ---------------------------------------------------------------
   EXPANSION — when the land fills up, buy the adjoining paddock
   --------------------------------------------------------------- */
function farmUsage(){
  const used = S.objs.reduce((a,o)=>{
    const f = footprint(BPMAP[o.bp], o.rot); return a + f.w*f.h;
  }, 0);
  return {used, total: FARM.w*FARM.h, pct: used/(FARM.w*FARM.h)};
}
/* Land is the only thing every income figure in the game is divided by,
   which makes it the one sink worth having: money converts into capacity
   rather than into a fine. It was capped at four parcels totalling
   $30,250 - seven percent of a played save's $442,951, after which there
   was nothing left to buy at all. Twelve parcels on the same 1.85 curve
   runs to about $4.5m, so earning keeps meaning something for a long
   time without anything being taken away. */
const EXPAND_MAX = 12;
function expandCost(){
  const n0 = S.expansions||0;
  return Math.round(2400 * Math.pow(1.85, n0));
}
function canExpand(){
  /* the world canvas grows to suit in expandFarm(), so the only real
     limit is how many parcels the neighbours will sell */
  return (S.expansions||0) < EXPAND_MAX;
}
/* later parcels are bigger, so the price curve buys visibly more ground
   rather than the same 4x3 strip at ten times the money */
function expandSize(){
  const n0 = S.expansions||0;
  return n0 >= 8 ? {w:6,h:5} : n0 >= 4 ? {w:5,h:4} : {w:4,h:3};
}

/* The panel used to say "4x3 more tiles", which reads as twelve. A parcel
   extends the property along two sides, so the actual gain is
   (w+aw)*(h+ah) - w*h - on a 21x14 block that is 122 tiles, not 12. The
   old copy understated it by a factor of ten. */
function expandGain(){
  const sz = expandSize();
  return (FARM.w + sz.w) * (FARM.h + sz.h) - FARM.w * FARM.h;
}
function expandFarm(){
  if(!canExpand()) return toast('No more adjoining land for sale','bad'), sfx('error');
  const c = expandCost();
  if(S.cash < c) return toast(`The neighbour wants ${fmt(c)} for it`,'bad'), sfx('error');
  S.cash -= c;
  S.expansions = (S.expansions||0) + 1;
  /* grow the fenced area; the world canvas grows with it if needed */
  const sz = expandSize(), addW = sz.w, addH = sz.h;
  if(FARM.x + FARM.w + addW > WT-3){ WT += addW+2; WPX = WT*T; }
  if(FARM.y + FARM.h + addH > HT-3){ HT += addH+2; HPX = HT*T; }
  FARM.w += addW; FARM.h += addH;
  terrainCache = '';
  sfx('upgrade');
  toast(`Bought the adjoining paddock — ${FARM.w}×${FARM.h} now`,'gold');
  log(`Bought ${addW}×${addH} tiles of adjoining land for ${fmt(c)}. Rates will rise.`,'gold');
  render(); fitView(); ui(); G.save();
}

/* ---------------------------------------------------------------
   A LIVING HORIZON — the backdrop now tracks the sun and weather
   --------------------------------------------------------------- */
/* Animating a CSS filter over a group this large forced a full repaint every
   frame. Opacity on flat overlay rects composites on the GPU instead. */
function tintHorizon(){
  const g = document.getElementById('horizon');
  if(!g || typeof skyNow!=='function') return;
  const s = skyNow(), wx = S.weather;

  let tint = g.querySelector('.hz-tint');
  let grey = g.querySelector('.hz-grey');
  if(!tint){
    const mk = cls => {
      const r = document.createElementNS('http://www.w3.org/2000/svg','rect');
      r.setAttribute('class', cls);
      r.setAttribute('x', -WPX*0.3); r.setAttribute('y', -400);
      r.setAttribute('width', WPX*1.6); r.setAttribute('height', HPX+800);
      r.style.pointerEvents='none';
      g.appendChild(r); return r;
    };
    tint = mk('hz-tint'); grey = mk('hz-grey');
    grey.setAttribute('fill', '#6b7a80');
  }
  /* time of day: warm at the edges of the day, deep blue at night */
  tint.setAttribute('fill', s.hz);
  tint.setAttribute('opacity', (0.08 + s.l*0.55).toFixed(3));
  /* weather: a flat grey veil stands in for desaturation */
  const veil = wx==='storm' ? 0.42 : wx==='rain' ? 0.26 : wx==='cloud' ? 0.13 : 0;
  grey.setAttribute('opacity', veil.toFixed(3));
  g.style.filter = '';
}

/* ---------------------------------------------------------------
   wire it all up
   --------------------------------------------------------------- */
(function wire17(){
  const css = document.createElement('style');
  css.textContent = `
  @keyframes swingy{0%,100%{transform:rotate(-16deg)}50%{transform:rotate(16deg)}}
  .swingy{transform-box:fill-box;animation:swingy 2.4s ease-in-out infinite;}
  @keyframes steamup{0%{opacity:0;transform:translateY(4px)}40%{opacity:.55}100%{opacity:0;transform:translateY(-12px)}}
  .steam{animation:steamup 3.6s ease-out infinite;}
  #horizon{contain:paint;}
  .hz-tint,.hz-grey{transition:opacity 2.5s linear;}
  @media(prefers-reduced-motion:reduce){.swingy,.steam{animation:none!important}}`;
  document.head.appendChild(css);

  /* expansion card at the bottom of the build list */
  const _renderBuild = renderBuild;
  renderBuild = function(){
    _renderBuild();
    const list = document.getElementById('buildList');
    if(!list) return;
    const u = farmUsage();
    const tight = u.pct > 0.55 || !canExpand();
    if(!tight) return;
    const c = expandCost();
    const div = document.createElement('div');
    div.className = 'card';
    div.style.margin = '10px';
    div.innerHTML = canExpand()
      ? `<div class="eyebrow">Land</div>
         <div class="statrow"><span>Your land is</span><b>${Math.round(u.pct*100)}% built</b></div>
         <div class="bar"><i style="transform:scaleX(${Math.min(1,u.pct).toFixed(3)});background:linear-gradient(90deg,#8a6a4a,#c9a06a)"></i></div>
         <div class="muted" style="margin:6px 0">The neighbour will sell you the adjoining paddock —
         about ${expandGain()} more tiles, taking you to ${FARM.w+expandSize().w}×${FARM.h+expandSize().h}.
         Council rates go up with everything you own.</div>
         <button class="btn wide" ${S.cash<c?'disabled':''} onclick="expandFarm()"
           data-tip="${esc(`<b>Buy adjoining land</b>Extends the property on two sides, adding about ${expandGain()} tiles.<hr><div class="tl"><span>Price</span><span class="tk">${fmt(c)}</span></div><div class="tl"><span>Expansions used</span><b>${S.expansions||0} of ${EXPAND_MAX}</b></div><hr><span class="tg">Each parcel costs 85% more than the last.</span>`)}">
           Buy adjoining land — ${fmt(c)}</button>`
      : `<div class="eyebrow">Land</div><div class="muted">You own everything the neighbours will part with.</div>`;
    list.appendChild(div);
  };

  /* daily hooks */
  const _adv17 = advanceDay;
  advanceDay = function(){ _adv17(); recreationDay(); };

  /* keep the backdrop in step with the sky */
  if(typeof paintSun === 'function'){
    const _paintSun = paintSun;
    paintSun = function(){ _paintSun(); tintHorizon(); };
  }

  /* quieter, softer weather bed */
  setTimeout(()=>{ if(SND && SND.applyMix) SND.applyMix(); }, 300);
  setTimeout(()=>{ fitView(); }, 500);
})();
