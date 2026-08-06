/* =====================================================================
   YOU, ON THE LAND — a character who walks to whatever you clicked and
   does the job there — plus the sun's arc from dawn to dusk.
   ===================================================================== */

/* ---------- pathfinding: A* across walkable tiles ---------- */
function blockedTile(x,y){
  if(x<FARM.x||y<FARM.y||x>=FARM.x+FARM.w||y>=FARM.y+FARM.h) return true;
  return S.objs.some(o=>{
    const bp = BPMAP[o.bp];
    if(bp.kind==='decor' && (bp.art==='path'||bp.art==='fence'||bp.art==='hedge')) return false;
    if(bp.kind==='decor' && bp.w<=2 && bp.h<=2) return false;   // step around small trees only
    const f = footprint(bp, o.rot);
    return x>=o.tx && x<o.tx+f.w && y>=o.ty && y<o.ty+f.h;
  });
}
function findPath(sx,sy,gx,gy){
  const key=(x,y)=>x+','+y;
  const open=[{x:sx,y:sy,g:0,f:0,p:null}], seen={[key(sx,sy)]:0};
  const H=(x,y)=>Math.abs(x-gx)+Math.abs(y-gy);
  let best=null, guard=0;
  while(open.length && guard++ < 4000){
    open.sort((a,b)=>a.f-b.f);
    const cur = open.shift();
    if(Math.abs(cur.x-gx)<=1 && Math.abs(cur.y-gy)<=1){ best=cur; break; }
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{
      const nx=cur.x+d[0], ny=cur.y+d[1];
      if(blockedTile(nx,ny)) return;
      const g=cur.g+1, k=key(nx,ny);
      if(seen[k]!==undefined && seen[k]<=g) return;
      seen[k]=g;
      open.push({x:nx,y:ny,g,f:g+H(nx,ny),p:cur});
    });
  }
  if(!best){                       // no route — walk straight and accept it
    return [{x:gx,y:gy}];
  }
  const path=[]; let c=best;
  while(c){ path.unshift({x:c.x,y:c.y}); c=c.p; }
  return path.slice(1);
}

/* ---------- the character ---------- */
function youInit(){
  if(S.you) return;
  S.you = {x:(FARM.x+3)*T, y:(FARM.y+3)*T, path:[], state:'idle', dir:1, t:0, job:null};
}
function youAt(){ youInit(); return {tx:Math.floor(S.you.x/T), ty:Math.floor(S.you.y/T)}; }

/* queue a job: walk there first, then run it on arrival */
function goDo(obj, kind, fn){
  youInit();
  if(S.settings && S.settings.instant){ fn(); return; }
  const f = footprint(BPMAP[obj.bp], obj.rot);
  const gx = obj.tx + Math.floor(f.w/2), gy = obj.ty + f.h;   // stand at the near edge
  const me = youAt();
  S.you.path = findPath(me.tx, me.ty, gx, gy);
  S.you.state = 'walk';
  S.you.job = {kind, fn, ox:obj.tx, oy:obj.ty};
  S.you.t = 0;
}
function tickYou(dt){
  youInit();
  const y = S.you;
  if(y.state==='walk'){
    const spd = (S.settings&&S.settings.walkFast ? 260 : 165) * dt;
    while(spd>0 && y.path.length){
      const n0 = y.path[0];
      const tx = n0.x*T + T/2, ty = n0.y*T + T/2;
      const dx = tx-y.x, dy = ty-y.y, d = Math.hypot(dx,dy);
      if(d < 2){ y.path.shift(); continue; }
      const step = Math.min(d, spd);
      y.x += dx/d*step; y.y += dy/d*step;
      if(Math.abs(dx)>0.5) y.dir = dx>0?1:-1;
      break;
    }
    if(!y.path.length){
      y.state = 'work'; y.t = 0;
      if(SND && !SND.isMuted()) sfx('click');
    }
  } else if(y.state==='work'){
    y.t += dt;
    if(y.t > 0.75){
      const job = y.job; y.job=null; y.state='idle'; y.t=0;
      if(job && job.fn) job.fn();
    }
  }
  paintYou();
}
function youLayer(){
  youInit();
  const y = S.you;
  return `<g id="you" transform="translate(${n(y.x)},${n(y.y)})">
    <g class="youbob"><g transform="scale(${y.dir},1)">${person(0,0,1.15,'#c8583f','#e0c07a')}</g></g></g>`;
}
function paintYou(){
  const el = document.getElementById('you');
  if(!el) return;
  const y = S.you;
  el.setAttribute('transform', `translate(${n(y.x)},${n(y.y)})`);
  const bob = el.firstElementChild;
  if(bob){
    bob.setAttribute('class', 'youbob' + (y.state==='walk'?' walking':y.state==='work'?' working':''));
    const flip = bob.firstElementChild;
    if(flip) flip.setAttribute('transform', `scale(${y.dir},1)`);
  }
}

/* ---------- sun & sky ---------- */
/* 0 = midnight, 0.5 = noon */
function dayFrac(){
  const base = (typeof acc==='number' && typeof DAY_MS==='number') ? acc/DAY_MS : 0.5;
  return (base + 0.25) % 1;                    // days start at dawn, not midnight
}
const SKY = [
  {t:0.00, top:'#0b1220', hz:'#16233a', sun:'#5b6a86', l:0.42},   // night
  {t:0.20, top:'#243a52', hz:'#7c5a58', sun:'#e8905c', l:0.24},   // dawn
  {t:0.28, top:'#5d8fb5', hz:'#e6b07c', sun:'#ffc46b', l:0.10},   // sunrise
  {t:0.50, top:'#8fc4e6', hz:'#cfe6f2', sun:'#fff3c4', l:0.00},   // noon
  {t:0.74, top:'#6fa3c8', hz:'#f0b078', sun:'#ffb04f', l:0.10},   // golden
  {t:0.82, top:'#3c4d70', hz:'#c0705e', sun:'#e8734a', l:0.26},   // sunset
  {t:1.00, top:'#0b1220', hz:'#16233a', sun:'#5b6a86', l:0.42},
];
function lerpHex(a,b,t){
  const p=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const A=p(a), B=p(b);
  return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');
}
function skyNow(){
  const f = dayFrac();
  let i=0; while(i<SKY.length-2 && SKY[i+1].t < f) i++;
  const a=SKY[i], b=SKY[i+1];
  const t = (f-a.t)/Math.max(0.0001,(b.t-a.t));
  return {top:lerpHex(a.top,b.top,t), hz:lerpHex(a.hz,b.hz,t),
          sun:lerpHex(a.sun,b.sun,t), l:a.l+(b.l-a.l)*t, f};
}
function isNight(){ const f=dayFrac(); return f<0.22 || f>0.84; }

/* the arc strip across the top of the land */
function paintSun(){
  const el = document.getElementById('sunarc');
  if(!el) return;
  const s = skyNow(), f = s.f;
  const w = el.clientWidth || 600, h = 46;
  /* sun travels dawn(0.22) → dusk(0.84); the moon takes the rest */
  const up = f>=0.22 && f<=0.84;
  const p = up ? (f-0.22)/0.62 : ((f<0.22? f+0.16 : f-0.84)/0.38);
  const cx = 10 + p*(w-20);
  const cy = h - 6 - Math.sin(p*Math.PI)*(h-18);
  const body = up
    ? `<circle cx="${n(cx)}" cy="${n(cy)}" r="8" fill="${s.sun}"/>
       <circle cx="${n(cx)}" cy="${n(cy)}" r="13" fill="${s.sun}" opacity=".28"/>
       <circle cx="${n(cx)}" cy="${n(cy)}" r="19" fill="${s.sun}" opacity=".12"/>`
    : `<circle cx="${n(cx)}" cy="${n(cy)}" r="7" fill="#dfe7f2"/>
       <circle cx="${n(cx+2.6)}" cy="${n(cy-1.6)}" r="6" fill="${s.top}"/>
       <circle cx="${n(cx)}" cy="${n(cy)}" r="12" fill="#dfe7f2" opacity=".16"/>`;
  let stars = '';
  if(!up) for(let i=0;i<16;i++)
    stars += `<circle cx="${n(hash(i*3.1)*w)}" cy="${n(4+hash(i*7.7)*(h-18))}" r="${(0.6+hash(i)*0.8).toFixed(1)}"
      fill="#fff" opacity="${(0.25+hash(i*2)*0.5).toFixed(2)}"/>`;
  el.innerHTML =
    `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <defs><linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${s.top}"/><stop offset="1" stop-color="${s.hz}"/></linearGradient></defs>
      <rect width="${w}" height="${h}" fill="url(#skyg)"/>
      ${stars}
      <path d="M10 ${h-6} Q ${w/2} ${-h*0.5} ${w-10} ${h-6}" stroke="#ffffff" stroke-opacity=".16"
        stroke-width="1" fill="none" stroke-dasharray="3 5"/>
      ${body}
      <rect y="${h-3}" width="${w}" height="3" fill="#000" opacity=".25"/>
    </svg>
    <span class="clock">${clockLabel()}</span>`;
  /* the land itself picks up the light */
  const dn = document.getElementById('daynight');
  if(dn && (!S.settings || S.settings.daynight !== false)){
    const tint = isNight() ? 'rgba(16,26,52,' : f<0.32||f>0.7 ? 'rgba(90,50,30,' : 'rgba(255,240,200,';
    dn.style.background = `linear-gradient(${180+Math.round((f-0.5)*90)}deg, ${tint}${s.l.toFixed(2)}), ${tint}${(s.l*0.7).toFixed(2)}))`;
  }
  /* shadows lengthen and swing with the sun */
  const ang = up ? (p-0.5)*120 : 0;
  const len = up ? 1 + (1-Math.sin(p*Math.PI))*2.2 : 1;
  document.documentElement.style.setProperty('--sun-x', (Math.sin(ang*Math.PI/180)*len*2.2).toFixed(2)+'px');
  document.documentElement.style.setProperty('--sun-y', (len*2).toFixed(2)+'px');
}
function clockLabel(){
  const f = dayFrac(), mins = Math.round(f*1440);
  const hh = Math.floor(mins/60), mm = mins%60;
  const ampm = hh<12?'am':'pm';
  const h12 = hh%12===0?12:hh%12;
  return `${h12}:${String(mm).padStart(2,'0')}${ampm}`;
}
