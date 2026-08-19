/* =====================================================================
   THE CAMERA POST SEES SOMETHING

   You can buy a camera post out of the AI category, plant it in a field,
   and it does nothing except stand there. Asked whether it could show a
   live picture of wherever you put it. It can, and cheaply, because the
   whole farm is one live SVG: a monitor is a second view of the same
   document, cropped to the ground the camera covers. Nothing is
   re-rendered, nothing is copied per frame — the feed is the farm, seen
   through a smaller window. Verified with getBBox that a <use> of the
   scene resolves to real geometry before any of this was built.

   THE FEED. A camera looks the way it was placed, so the window sits
   forward of the post rather than centred on it, and the post is at the
   bottom edge of its own picture the way a real one would be. After dark
   it switches to infrared — green, grainier, and it can see, which is a
   reason to own one. There is a timestamp, a label and a recording dot,
   because that is what the thing looks like.

   WHAT MAKES IT WORTH THE $220. A camera that only shows you a picture is
   a toy. This one watches: anything that crosses its ground is logged with
   the time and the camera it was seen on — a fox at the coop at 03:14, a
   guest wandering into the yard, a farmhand arriving at the dairy. Each
   subject is logged once per visit rather than every frame, so the log
   reads as events and not as noise, and the entries survive so you can
   come back in the morning and find out what came through in the night.

   Cameras are cheap and the wall takes all of them, so a farm with four
   posts has a four-way monitor and a night's worth of movements on it.
   ===================================================================== */

const CAM = { feeds: {}, log: [], seen: {}, t: 0, span: 9.5 };
const CAM_RANGE = 5.2 * 40;        /* how far down the paddock it reads, in world px */

function cameraPosts(){
  return (S.objs || []).filter(o=>o.bp === 'camera_post');
}
/* where the lens is pointed: forward of the post, by however it was placed */
function cameraView(o){
  const bp = BPMAP[o.bp] || {};
  const f = footprint(bp, o.rot);
  const cx = (o.tx + f.w/2)*T, cy = (o.ty + f.h/2)*T;
  const rot = ((o.rot || 0) % 4 + 4) % 4;
  const dir = [{x:0,y:1},{x:-1,y:0},{x:0,y:-1},{x:1,y:0}][rot];
  const reach = CAM_RANGE * 0.55;
  return { cx, cy, ax: cx + dir.x*reach, ay: cy + dir.y*reach, dir, rot };
}

/* everything on the farm that could walk past a camera */
function cameraSubjects(){
  const out = [];
  const add = (p, what, kind)=>{ if(p && typeof p.x === 'number') out.push({ x:p.x, y:p.y, what, kind, id:p.id || what }); };
  (S.family || []).forEach(p=>add(p, p.name, 'family'));
  (S.workers || []).forEach(p=>add(p, p.name, 'farmhand'));
  (S.guests || []).forEach(p=>add(p, p.name, 'guest'));
  if(S.you) add(S.you, 'You', 'you');
  if(S.dog) add(S.dog, S.dog.name || 'the dog', 'dog');
  if(S.dragon) add(S.dragon, S.dragon.name || 'the dragon', 'dragon');
  try{ if(typeof wildList === 'function') (wildList() || []).forEach(w=>add(w, w.kind || 'something wild', 'wild')); }catch(e){}
  try{ if(typeof strayList === 'function') (strayList() || []).forEach(s=>add(s, (s.kind || 'stock') + ' out of its pen', 'stray')); }catch(e){}
  return out;
}

function camClock(){
  const f = (typeof dayFrac === 'function') ? dayFrac() : 0;
  const mins = Math.round(f*24*60) % (24*60);
  return String(Math.floor(mins/60)).padStart(2,'0') + ':' + String(mins%60).padStart(2,'0');
}

/* ---------- the watching ---------- */
function camTick(dt){
  const posts = cameraPosts();
  if(!posts.length) return;
  CAM.t += dt;
  if(CAM.t < 0.55) return;                    /* four times a second is plenty */
  CAM.t = 0;
  const night = (typeof isNight === 'function') && isNight();
  const subs = cameraSubjects();
  posts.forEach((o, i)=>{
    const v = cameraView(o);
    const name = 'Camera ' + (i+1);
    subs.forEach(s=>{
      const d = Math.hypot(s.x - v.ax, s.y - v.ay);
      const key = o.id + '|' + s.id;
      const inside = d < CAM_RANGE;
      if(inside && !CAM.seen[key]){
        CAM.seen[key] = 1;
        CAM.log.unshift({ cam:name, who:s.what, kind:s.kind, at:camClock(),
                          day:S.day || 1, night });
        if(CAM.log.length > 60) CAM.log.pop();
        /* the ones you would actually want waking up for */
        if((s.kind === 'wild' || s.kind === 'stray') && typeof log === 'function')
          log(`${name} picked up ${s.what} at ${camClock()}.`, 'bad', 'farm');
      } else if(!inside && CAM.seen[key]){
        delete CAM.seen[key];
      }
    });
  });
}
if(typeof tickPeople === 'function'){
  const _tickCam = tickPeople;
  tickPeople = function(dt){
    const r = _tickCam.apply(this, arguments);
    try{ camTick(typeof dt === 'number' ? dt : 1/30); }catch(e){}
    return r;
  };
}

/* ---------- the monitor ---------- */
/* A post near the boundary aimed at the fence looks out at nothing, and the
   feed came back half black because the window ran off the edge of the
   world. The window slides back inside instead — the same thing a real
   camera on a corner post does, which is point slightly along the fence
   rather than over it. */
function feedBox(o){
  const v = cameraView(o);
  const half = CAM_RANGE * 0.9;
  const w = half*2, h = half*1.4;
  let x = v.ax - half, y = v.ay - half*0.7;
  x = Math.max(-T, Math.min(WPX + T - w, x));
  y = Math.max(-T, Math.min(HPX + T - h, y));
  return { x, y, w, h };
}
function feedSVG(o, i){
  const b = feedBox(o);
  const vb = `${n(b.x)} ${n(b.y)} ${n(b.w)} ${n(b.h)}`;
  const night = (typeof isNight === 'function') && isNight();
  const id = 'camfeed' + i;
  return `<div class="camcell">
    <svg id="${id}" class="camsvg ${night ? 'ir' : ''}" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">
      <use href="#bg"/><use href="#fg"/>
    </svg>
    <div class="camscan"></div>
    <div class="camtop"><span class="camrec"></span>Camera ${i+1}${night ? ' · IR' : ''}</div>
    <div class="cambot"><span>Day ${S.day || 1}</span><span class="camtime">${camClock()}</span></div>
  </div>`;
}

let CAM_TIMER = null;
G.openCameras = function(){
  const posts = cameraPosts();
  if(!posts.length){
    return modal(`<h2>Cameras</h2>
      <p class="sub">You have not put any up. A camera post is in Build → Automation,
        ${fmt(BPMAP.camera_post ? BPMAP.camera_post.cost : 220)}. Point it at whatever you would
        rather not lose — it watches the ground in front of it and writes down what crosses it.</p>
      <div class="mfoot"><button class="btn" onclick="G.closeModal()">Right</button></div>`);
  }
  modal(`<h2>Cameras</h2>
    <p class="sub">${posts.length} post${posts.length>1?'s':''} on the place, live.</p>
    <div class="camgrid" id="camgrid">${posts.map((o,i)=>feedSVG(o,i)).join('')}</div>
    <h3 style="margin:16px 0 6px;font-size:15px">What has gone past</h3>
    <div class="rows" id="camlog"></div>
    <div class="mfoot"><button class="btn ghost" onclick="G.closeCameras()">Close</button></div>`);
  camLogRows();
  if(CAM_TIMER) clearInterval(CAM_TIMER);
  CAM_TIMER = setInterval(()=>{
    if(!document.getElementById('camgrid')){ clearInterval(CAM_TIMER); CAM_TIMER = null; return; }
    camRefresh();
  }, 900);
};
G.closeCameras = function(){
  if(CAM_TIMER){ clearInterval(CAM_TIMER); CAM_TIMER = null; }
  G.closeModal();
};
/* the picture is live on its own — only the chrome needs repainting */
function camRefresh(){
  const posts = cameraPosts();
  const night = (typeof isNight === 'function') && isNight();
  posts.forEach((o,i)=>{
    const svg = document.getElementById('camfeed'+i);
    if(!svg) return;
    const b = feedBox(o);
    svg.setAttribute('viewBox', `${n(b.x)} ${n(b.y)} ${n(b.w)} ${n(b.h)}`);
    svg.classList.toggle('ir', !!night);
  });
  document.querySelectorAll('.camtime').forEach(e=>{ e.textContent = camClock(); });
  camLogRows();
}
function camLogRows(){
  const box = document.getElementById('camlog');
  if(!box) return;
  if(!CAM.log.length){ box.innerHTML = `<p class="sub">Nothing has crossed them yet.</p>`; return; }
  box.innerHTML = CAM.log.slice(0, 12).map(e=>
    `<div class="row"><span>${e.cam} · <b>${e.who}</b>${e.night ? ' <span class="muted">(dark)</span>' : ''}</span>
     <b>day ${e.day} · ${e.at}</b></div>`).join('');
}

/* clicking a post opens its own feed */
if(typeof G.select === 'function'){
  const _selCam = G.select;
  G.select = function(id){
    const r = _selCam.apply(this, arguments);
    try{
      const o = (S.objs || []).find(x=>x.id === id);
      if(o && o.bp === 'camera_post') G.openCameras();
    }catch(e){}
    return r;
  };
}
/* and a button, once you own one */
if(typeof syncWorldButtons === 'function'){
  const _syncCam = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncCam.apply(this, arguments);
    try{
      const host = document.getElementById('zoomctl');
      if(host && !document.getElementById('cambtn')){
        const b = document.createElement('button');
        b.id = 'cambtn'; b.textContent = '📹';
        b.title = 'Cameras';
        b.setAttribute('data-tip','<b>Cameras</b>Live from every post you have put up, and what has gone past them.');
        b.onclick = ()=>G.openCameras();
        host.insertBefore(b, host.firstChild);
      }
      const b2 = document.getElementById('cambtn');
      if(b2) b2.style.display = cameraPosts().length ? '' : 'none';
    }catch(e){}
    return r;
  };
}

(function camCss(){
  const s = document.createElement('style');
  s.textContent = `
  #cambtn{ font-size:15px; line-height:1 }
  .camgrid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:10px }
  .camcell{ position:relative; border-radius:7px; overflow:hidden; background:#070b06;
    border:1px solid var(--line2,#33402c); aspect-ratio:4/3 }
  .camsvg{ width:100%; height:100%; display:block; background:#0d1410 }
  .camsvg.ir{ filter:grayscale(1) sepia(1) hue-rotate(58deg) saturate(3.2) brightness(1.15) contrast(1.15) }
  .camscan{ position:absolute; inset:0; pointer-events:none;
    background:repeating-linear-gradient(rgba(255,255,255,.035) 0 1px, transparent 1px 3px);
    box-shadow:inset 0 0 34px rgba(0,0,0,.55) }
  .camtop,.cambot{ position:absolute; left:0; right:0; display:flex; gap:7px; align-items:center;
    padding:5px 8px; font:500 10.5px/1 ui-monospace,monospace; letter-spacing:.06em;
    color:#dfe9df; text-shadow:0 1px 2px #000; pointer-events:none }
  .camtop{ top:0 } .cambot{ bottom:0; justify-content:space-between }
  .camrec{ width:7px; height:7px; border-radius:50%; background:#e2554a; display:inline-block;
    animation:camblink 1.6s steps(1,end) infinite }
  @keyframes camblink{ 0%,60%{opacity:1} 61%,100%{opacity:.15} }
  @media (prefers-reduced-motion: reduce){ .camrec{ animation:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.cameraAudit = function(){
  const posts = cameraPosts();
  return {
    posts: posts.length,
    range: Math.round(CAM_RANGE) + 'px (' + (CAM_RANGE/40).toFixed(1) + ' tiles)',
    views: posts.map((o,i)=>{
      const v = cameraView(o);
      return `Camera ${i+1} at ${Math.round(v.cx)},${Math.round(v.cy)} looking ` +
        ['south','west','north','east'][v.rot];
    }),
    subjectsTrackable: cameraSubjects().length,
    inFrameNow: posts.reduce((a,o)=>{
      const v = cameraView(o);
      return a + cameraSubjects().filter(s=>Math.hypot(s.x-v.ax, s.y-v.ay) < CAM_RANGE).length;
    }, 0),
    events: CAM.log.length,
    latest: CAM.log.slice(0,5).map(e=>`${e.cam}: ${e.who} day ${e.day} ${e.at}`),
    monitorOpen: !!document.getElementById('camgrid'),
    night: (typeof isNight === 'function') && isNight(),
  };
};
