/* =====================================================================
   FARMHANDS, FAMILY, CARRYING, AND THE HORIZON BEYOND YOUR FENCE
   ===================================================================== */

/* ---------------------------------------------------------------
   1. HORIZON — layered depth beyond the property, per biome.
      Not true 3D: receding bands with atmospheric haze and parallax,
      which is what reads as distance on a top-down map.
   --------------------------------------------------------------- */
function horizonLayer(){
  const l = LANDMAP[S.landId];
  if(!l) return '';
  const B = l.biome, W = WPX, H = HPX;
  const band = (y,h,fill,op)=>`<rect x="${-W*0.3}" y="${n(y)}" width="${W*1.6}" height="${n(h)}" fill="${fill}" opacity="${op}"/>`;
  /* silhouette ridge: a jagged skyline at depth d (0 far, 1 near) */
  const ridge = (y, amp, fill, seed, op)=>{
    let d = `M${-W} ${n(y+amp)}`;
    for(let x=-W*0.3; x<=W*1.3; x+=64){
      const k = hash(seed + x*0.013);
      d += ` L${n(x)} ${n(y + amp - k*amp*1.9)}`;
    }
    d += ` L${W*1.3} ${n(y+amp*2)} L${-W*0.3} ${n(y+amp*2)} Z`;
    return `<path d="${d}" fill="${fill}" opacity="${op}"/>`;
  };
  let far='', mid='', near='';

  if(B==='mount' || B==='plateau'){
    far  = band(-260, 300, '#8fa4bd', .55) + ridge(-140, 120, '#7d92ad', 3, .8) + ridge(-120, 96, '#fbfdff', 3.4, .5);
    mid  = ridge(-40, 80, '#6b8299', .95, 5) ? ridge(-40, 80, '#6b8299', 5, .95) : '';
    near = ridge(20, 50, '#55705f', 7, 1);
  } else if(B==='lake' || B==='pond'){
    far  = band(-200, 240, '#7fa8c4', .6) + ridge(-90, 70, '#6d8f7a', 11, .75);
    mid  = `<rect x="${-W*0.3}" y="${-40}" width="${W*1.6}" height="150" fill="#4f8fb0" opacity=".85"/>` +
           `<rect x="${-W*0.3}" y="${-40}" width="${W*1.6}" height="150" fill="url(#gWater)" opacity=".5"/>`;
    for(let i=0;i<6;i++) mid += `<ellipse class="ripple" cx="${n(hash(i*2.3)*W*2-W*0.4)}" cy="${n(-30+hash(i*5)*130)}"
      rx="${n(14+hash(i)*26)}" ry="2.2" fill="#dff4fb" opacity=".3" style="animation-delay:${(hash(i)*3).toFixed(1)}s"/>`;
    near = ridge(96, 26, '#5d8442', 13, 1);
  } else if(B==='coast'){
    far  = band(-220, 200, '#9fc6da', .7);
    mid  = `<rect x="${-W*0.3}" y="${-30}" width="${W*1.6}" height="170" fill="#3f83a8"/>` +
           `<rect x="${-W*0.3}" y="${-30}" width="${W*1.6}" height="170" fill="url(#gWater)" opacity=".6"/>`;
    for(let i=0;i<4;i++) mid += `<rect class="surf" x="${-W*0.3}" y="${n(20+i*17)}" width="${W*1.6}" height="3"
      fill="#ffffff" opacity=".38" style="animation-delay:${(i*0.5).toFixed(1)}s"/>`;
    near = band(130, 46, '#e0d4ae', 1) + band(130, 10, '#efe6c8', 1);
  } else if(B==='forest'){
    far = band(-200, 240, '#5c7f5a', .5);
    mid = ''; near = '';
    for(let i=0;i<26;i++){
      const x = -W*0.4 + hash(i*1.7)*W*1.9, y = -30 + hash(i*3.9)*150;
      mid += conifer(x, y, 18+hash(i)*16, i);
    }
    near = ridge(120, 22, '#3d6b34', 17, 1);
  } else if(B==='river'){
    far  = band(-200, 220, '#9dbb92', .55) + ridge(-70, 56, '#6d8f6a', 19, .8);
    mid  = `<path d="M${-W} 40 Q ${W*0.3} -60 ${W*0.8} 30 T ${W*2} 10 L ${W*2} 130 Q ${W*0.9} 150 ${W*0.35} 70 T ${-W} 150 Z"
             fill="#4f8fb0" opacity=".9"/>`;
    near = ridge(120, 24, '#5d8442', 23, 1);
  } else if(B==='hill' || B==='valley'){
    far  = band(-220, 250, '#a8bd8e', .5) + ridge(-100, 90, '#8aa876', 29, .75);
    mid  = ridge(-20, 66, '#7a9a63', 31, .9);
    near = ridge(80, 40, '#5f8a48', 37, 1);
  } else if(B==='moor'){
    far  = band(-200, 230, '#b0ad86', .55) + ridge(-70, 46, '#93916f', 41, .7);
    mid  = ridge(10, 32, '#8a8a63', 43, .9);
    near = band(120, 40, '#7d8259', .9);
  } else if(B==='oasis'){
    far  = band(-220, 250, '#e2cf9e', .7) + ridge(-90, 76, '#d4bd85', 47, .8);
    mid  = ridge(-10, 52, '#c4a86d', 53, .9);
    near = ridge(96, 34, '#b09257', 59, 1);
  } else { /* orchard and anything else */
    far = band(-200, 230, '#9dbb7e', .5);
    mid = '';
    for(let i=0;i<20;i++){
      const x = -W*0.3 + hash(i*2.1)*W*1.7, y = -20 + hash(i*4.3)*140;
      mid += canopy(x,y,16+hash(i)*8,'url(#gCanopy)',i,false);
    }
    near = ridge(120, 22, '#5f8a48', 61, 1);
  }
  /* the same treatment mirrored along the bottom edge, flipped and hazier */
  const bottom = `<g transform="translate(0,${H}) scale(1,-1)" opacity=".72">${far}${mid}</g>`;
  return `<g id="horizon">
    <g class="hz-far"  data-par="0.25">${far}</g>
    <g class="hz-mid"  data-par="0.5">${mid}</g>
    <g class="hz-near" data-par="0.78">${near}</g>
    ${bottom}
    <rect x="${-W*0.3}" y="${-300}" width="${W*1.6}" height="${H+600}" fill="url(#gHaze)" pointer-events="none"/>
  </g>`;
}
/* horizon layers drift slower than the camera, which is what sells depth */
function parallax(){
  const g = document.getElementById('horizon');
  if(!g) return;
  ['hz-far','hz-mid','hz-near'].forEach(c=>{
    const el = g.querySelector('.'+c); if(!el) return;
    const p = parseFloat(el.dataset.par);
    el.setAttribute('transform', `translate(${n(-cam.x*(1-p)/cam.z*0.5)},${n(-cam.y*(1-p)/cam.z*0.35)})`);
  });
}

/* ---------------------------------------------------------------
   2. PEOPLE — farmhands you pay, and the family who live here
   --------------------------------------------------------------- */
const FIRST = ['Ama','Rafi','Noor','Ilias','Sana','Tomas','Mira','Josef','Lena','Kaito',
               'Ruth','Dev','Aiko','Bram','Esme','Otis','Priya','Yusuf','Nell','Cato'];

function peopleInit(){
  if(!S.workers) S.workers = [];
  if(!S.family){
    S.family = [
      {id:'f1', role:'partner', name:'Partner', shirt:'#8f6fc4', sc:1.1, hat:null},
      {id:'f2', role:'child',   name:'Eldest',  shirt:'#e8a33d', sc:0.78, hat:null},
      {id:'f3', role:'child',   name:'Youngest',name2:1, shirt:'#5fb0d4', sc:0.68, hat:null},
    ];
  }
  S.family.forEach(f=>{
    if(f.x===undefined){
      f.x = (FARM.x+4+Math.random()*4)*T; f.y = (FARM.y+4+Math.random()*4)*T;
      f.path=[]; f.state='idle'; f.dir=1; f.t=0; f.act='';
    }
  });
  S.workers.forEach(w=>{
    if(w.x===undefined){ w.x=(FARM.x+2)*T; w.y=(FARM.y+2)*T; w.path=[]; w.state='idle'; w.dir=1; w.t=0; }
  });
}
function workerBeds(){
  return S.objs.filter(o=>o.bp==='worker_cottage').reduce((a,o)=>a + 2 + tOf(o), 0);
}
function hireWorker(){
  peopleInit();
  if(S.workers.length >= workerBeds())
    return toast('Nowhere to house them — build a worker cottage','bad'), sfx('error');
  const name = FIRST[Math.floor(Math.random()*FIRST.length)];
  const skill = 1 + Math.floor(Math.random()*3);
  const wage = 900 + skill*280;
  const sign = Math.round(wage*0.5);
  if(S.cash < sign) return toast(`Signing-on fee is ${fmt(sign)}`,'bad'), sfx('error');
  S.cash -= sign;
  S.workers.push({id:'w'+Date.now(), name, skill, wage,
    x:(FARM.x+2)*T, y:(FARM.y+2)*T, path:[], state:'idle', dir:1, t:0, done:0});
  sfx('build');
  toast(`${name} joined the farm`,'good');
  log(`Hired ${name} (skill ${skill}) at ${fmt(wage)}/month.`,'gold');
  render(); ui(); G.save();
}
function fireWorker(id){
  peopleInit();
  const w = S.workers.find(z=>z.id===id); if(!w) return;
  S.workers = S.workers.filter(z=>z.id!==id);
  log(`${w.name} left the farm.`);
  toast(`${w.name} has gone`,''); sfx('remove');
  render(); ui(); G.save();
}
function workerWages(){ peopleInit(); return S.workers.reduce((a,w)=>a+w.wage,0); }

/* farmhands do a daily round of real jobs — cheaper than AI, but they eat wages */
function workersDay(){
  peopleInit();
  if(!S.workers.length) return;
  const housed = Math.min(S.workers.length, workerBeds());
  if(housed < S.workers.length)
    log(`${S.workers.length-housed} farmhand(s) have nowhere to sleep and did not work.`,'bad');
  let watered=0, harvested=0, collected=0, cleaned=0;
  S.workers.slice(0,housed).forEach(w=>{
    let budget = 2 + w.skill;                       // jobs per day
    S.objs.forEach(o=>{
      if(budget<=0) return;
      const bp = BPMAP[o.bp];
      if(bp.kind==='plot' && o.crop && o.water<0.5 && S.water>=8){ S.water-=8; o.water=1; watered++; budget--; }
      else if(bp.kind==='plot' && o.crop && o.stage>=1){
        const cr=CROPS[o.crop];
        const q=Math.max(1,Math.round(cr.yield*E.slots(o)*cropMul(o)*(0.75+w.skill*0.08)));
        give(o.crop,q); o.fert=clamp(o.fert-0.16,0.15,1); o.last=o.crop;
        o.crop=null;o.stage=0;o.weeds=0; harvested+=q; budget--; addXP(1);
      }
      else if(bp.kind==='animal' && o.ready>0){ give(bp.good,o.ready); collected+=o.ready; o.ready=0; budget--; }
      else if(bp.kind==='animal' && (o.care||1)<0.55){ o.care=1; cleaned++; budget--; }
    });
    w.done = (2+w.skill) - budget;
  });
  const bits=[];
  if(watered) bits.push(`watered ${watered}`);
  if(harvested) bits.push(`picked ${harvested}`);
  if(collected) bits.push(`collected ${collected}`);
  if(cleaned) bits.push(`cleaned ${cleaned}`);
  if(bits.length) log(`Farmhands: ${bits.join(', ')}.`,'good');
}

/* ---------------------------------------------------------------
   3. DAILY ROUTINES — the family live to a timetable
   --------------------------------------------------------------- */
function homeSpot(){
  const h = S.objs.find(o=>o.bp==='cabin');
  if(!h) return {x:(FARM.x+4)*T, y:(FARM.y+4)*T};
  const f = footprint(BPMAP[h.bp], h.rot);
  return {x:(h.tx+f.w/2)*T, y:(h.ty+f.h+0.6)*T};
}
function spotNear(bpId, fallback){
  const o = S.objs.find(z=>z.bp===bpId);
  if(!o) return fallback || homeSpot();
  const f = footprint(BPMAP[o.bp], o.rot);
  return {x:(o.tx+f.w/2)*T, y:(o.ty+f.h+0.5)*T};
}
/* returns {x,y,act} for this person at this time of day */
function routine(p){
  const f = dayFrac();
  const home = homeSpot();
  if(f < 0.24 || f > 0.88) return {...home, act:'asleep'};
  if(p.role==='child'){
    if(f < 0.38) return {...home, act:'breakfast'};
    if(f < 0.55) return {...spotNear('cabin'), act:'studying'};
    if(f < 0.74) return {...spotNear('playground', spotNear('flowers')), act:'playing'};
    return {...home, act:'with family'};
  }
  if(p.role==='partner'){
    if(f < 0.34) return {...home, act:'house chores'};
    if(f < 0.52){
      const bed = S.objs.find(o=>BPMAP[o.bp].kind==='plot');
      return bed ? {...spotNear(bed.bp), act:'tending the beds'} : {...home, act:'house chores'};
    }
    if(f < 0.70){
      const pen = S.objs.find(o=>BPMAP[o.bp].kind==='animal');
      return pen ? {...spotNear(pen.bp), act:'feeding the animals'} : {...home, act:'house chores'};
    }
    return {...home, act:'making dinner'};
  }
  /* farmhands drift between whatever they are working on */
  const jobs = S.objs.filter(o=>['plot','animal','perennial'].includes(BPMAP[o.bp].kind));
  if(jobs.length){
    const o = jobs[Math.floor(hash(p.id.length + Math.floor(f*7))*jobs.length)];
    const ft = footprint(BPMAP[o.bp], o.rot);
    return {x:(o.tx+ft.w/2)*T, y:(o.ty+ft.h+0.5)*T, act:'working'};
  }
  return {...home, act:'idle'};
}

function tickPeople(dt){
  if(!S || S.speed===0) return;
  peopleInit();
  const all = S.family.concat(S.workers.map(w=>({...w, role:'worker', _w:w})));
  S.family.forEach(p=>movePerson(p, dt));
  S.workers.forEach(p=>movePerson(p, dt));
  paintPeople();
}
function movePerson(p, dt){
  const goal = routine(p);
  p.act = goal.act;
  const d0 = Math.hypot(goal.x-p.x, goal.y-p.y);
  if(d0 > T*0.9){
    const spd = 78*dt;
    const dx = goal.x-p.x, dy = goal.y-p.y, d = Math.hypot(dx,dy);
    p.x += dx/d*Math.min(d,spd); p.y += dy/d*Math.min(d,spd);
    if(Math.abs(dx)>0.5) p.dir = dx>0?1:-1;
    p.state = 'walk';
  } else {
    /* potter about on the spot so nobody stands frozen */
    p.t = (p.t||0) + dt;
    if(p.t > 3){ p.t = 0; p.wx = (Math.random()-0.5)*26; p.wy = (Math.random()-0.5)*20; }
    const tx = goal.x + (p.wx||0), ty = goal.y + (p.wy||0);
    const dx = tx-p.x, dy = ty-p.y, d = Math.hypot(dx,dy);
    if(d > 2){ const spd=26*dt; p.x += dx/d*Math.min(d,spd); p.y += dy/d*Math.min(d,spd);
               if(Math.abs(dx)>0.5) p.dir = dx>0?1:-1; p.state='walk'; }
    else p.state = (goal.act==='asleep') ? 'sleep' : 'busy';
  }
}
function peopleLayer(){
  peopleInit();
  const one = (p, sc, shirt, hat) =>
    `<g class="npc" data-p="${p.id}" transform="translate(${n(p.x)},${n(p.y)})">
      <g class="youbob"><g transform="scale(${p.dir},1)">${person(0,0,sc,shirt,hat)}</g></g>
      <text class="nlab" y="-26" text-anchor="middle">${p.name}</text></g>`;
  return `<g id="people">
    ${S.family.map(f=>one(f, f.sc, f.shirt, f.role==='partner'?'#c47fa8':null)).join('')}
    ${S.workers.map(w=>one(w, 1.05, '#4f8a9c', '#e0c07a')).join('')}
  </g>`;
}
function paintPeople(){
  const upd = p=>{
    const el = document.querySelector(`[data-p="${p.id}"]`);
    if(!el) return;
    el.setAttribute('transform', `translate(${n(p.x)},${n(p.y)})`);
    el.style.opacity = p.state==='sleep' ? 0 : 1;
    const bob = el.firstElementChild;
    if(bob){
      bob.setAttribute('class','youbob'+(p.state==='walk'?' walking':p.state==='busy'?' working':''));
      const fl = bob.firstElementChild;
      if(fl) fl.setAttribute('transform',`scale(${p.dir},1)`);
    }
  };
  S.family.forEach(upd); S.workers.forEach(upd);
}

/* ---------------------------------------------------------------
   4. IDLE LIFE — when you have nothing queued, you join in
   --------------------------------------------------------------- */
const CHORES = ['stacking firewood','hanging the washing','fixing a fence','sweeping the yard',
                'mending a gate','carrying water','sorting seed trays'];
function tickIdle(dt){
  if(!S.you || S.you.state!=='idle') { S.idleT = 0; return; }
  if(S.settings && S.settings.familyLife === false) return;
  S.idleT = (S.idleT||0) + dt;
  if(S.idleT < 6) return;
  S.idleT = 0;
  peopleInit();
  /* half the time go and be with someone, otherwise do a chore */
  if(Math.random() < 0.55 && S.family.length){
    const f = S.family[Math.floor(Math.random()*S.family.length)];
    if(f.state==='sleep') return;
    S.you.path = findPath(Math.floor(S.you.x/T), Math.floor(S.you.y/T),
                          Math.floor(f.x/T), Math.floor(f.y/T));
    S.you.state = 'walk';
    S.you.job = {kind:'family', fn:()=>{
      const acts = f.role==='child'
        ? [`played with ${f.name}`, `helped ${f.name} with homework`, `read to ${f.name}`]
        : [`had a cup of tea with ${f.name}`, `talked over the week with ${f.name}`, `walked the fence with ${f.name}`];
      const msg = acts[Math.floor(Math.random()*acts.length)];
      S.morale = clamp((S.morale||0.6) + 0.06, 0, 1);
      if(S.career) S.career.burnout = clamp(S.career.burnout - 0.05, 0, 0.6);
      log('You ' + msg + '.', 'good');
      floatNum('♥', innerWidth/2, innerHeight/2, '#ff9ec4');
    }};
  } else {
    const home = homeSpot();
    S.you.path = findPath(Math.floor(S.you.x/T), Math.floor(S.you.y/T),
                          Math.floor(home.x/T), Math.floor(home.y/T));
    S.you.state = 'walk';
    const chore = CHORES[Math.floor(Math.random()*CHORES.length)];
    S.you.job = {kind:'chore', fn:()=>{
      S.morale = clamp((S.morale||0.6) + 0.03, 0, 1);
      log('You spent a while ' + chore + '.');
    }};
  }
}

/* ---------------------------------------------------------------
   5. CARRYING — you haul what you pick to the house
   --------------------------------------------------------------- */
/* The goods are already banked by the time this runs — this is the walk home
   with the crate, so nothing is ever lost if the trip is interrupted. */
function carryTo(goodId, qty){
  if(!S.you || S.you.state !== 'idle') return false;
  if(S.settings && S.settings.carry === false) return false;
  if(!GOODS[goodId]) return false;
  S.you.carry = {g:goodId, q:qty};
  const home = homeSpot();
  S.you.path = findPath(Math.floor(S.you.x/T), Math.floor(S.you.y/T),
                        Math.floor(home.x/T), Math.floor(home.y/T));
  S.you.state = 'walk';
  S.you.job = {kind:'store', fn:()=>{
    S.you.carry = null;
    sfx('collect');
    render();
  }};
  return true;
}
function carryArt(){
  if(!S.you || !S.you.carry) return '';
  const g = GOODS[S.you.carry.g];
  const c = g ? g.c : '#8b6640';
  return `<g transform="translate(9,-4)">
    <rect x="-6" y="-5" width="12" height="9" rx="1.5" fill="#8b6640"/>
    <rect x="-6" y="-5" width="12" height="2.6" rx="1" fill="#a8814f"/>
    <circle cx="-2.4" cy="-6" r="2.2" fill="${c}"/><circle cx="1.6" cy="-6.6" r="2.4" fill="${c}"/>
    <circle cx="4" cy="-5.4" r="1.9" fill="${c}"/></g>`;
}
