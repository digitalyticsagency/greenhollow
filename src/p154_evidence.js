/* =====================================================================
   A CLEARER PICTURE, AND SOMETHING TO USE IT ON

   Two things. The feed was hard to read, and it showed you nothing worth
   reading.

   THE PICTURE. Measured: the monitor was fitting 374 world pixels into a
   230 pixel cell, a 1.63x downscale, so a 40px tile came out at 24.6px and
   a person — drawn about one tile tall — was a smudge. Then scanlines at
   .035 and a 34px inset vignette went over the top of that. The cells are
   larger now, the view is tighter so a tile lands near its true size, the
   scanlines are halved and the vignette is a third of what it was. There
   is a zoom on each feed as well, because a camera on the yard and a
   camera down the back paddock do not want the same framing.

   THE EVIDENCE. Cameras log what crosses them with a timestamp. That is
   the raw material of the thing that actually happens on a farm: you come
   out in the morning and the stock are on the road, and the question is
   how.

   So stock now get out at night, for a reason — a fox worked the fence, a
   gate was left unlatched, or a strainer post finally went. And the reason
   is not told to you. It is written into the camera log at the time it
   happened, and only by the cameras that could actually see that part of
   the farm. Review the night, read the times, and name the cause.

   Get it right and you fix that cause: the fence is restrung, the gate
   gets a spring catch, and it will not go the same way again for a good
   while. Get it wrong and you have repaired the wrong thing.

   Which makes the cameras worth their money in the only way that counts:
   with none, the stock are out and you will never know why. With one over
   the pen, you have a suspect. The coverage you bought is the evidence you
   have.
   ===================================================================== */

/* ---------- 1. a picture you can read ---------- */
const CAMQ = { zoom: 1 };                 /* 0 wide, 1 normal, 2 close */
const CAM_SPANS = [1.35, 0.82, 0.52];     /* multiplier on the camera's reach */

if(typeof feedBox === 'function'){
  const _feedBoxBase = feedBox;
  feedBox = function(o){
    const b = _feedBoxBase.apply(this, arguments);
    /* re-frame around the same centre at the chosen zoom */
    const cx = b.x + b.w/2, cy = b.y + b.h/2;
    /* Absolute, not relative to Normal — dividing by CAM_SPANS[1] made
       Normal exactly the old framing, which was the 1.25x downscale being
       complained about. Straight multipliers put Normal at about 1:1. */
    const k = CAM_SPANS[CAMQ.zoom];
    const w = b.w * k, h = b.h * k;
    let x = cx - w/2, y = cy - h/2;
    x = Math.max(-T, Math.min(WPX + T - w, x));
    y = Math.max(-T, Math.min(HPX + T - h, y));
    return { x, y, w, h };
  };
}
G.camZoom = function(d){
  CAMQ.zoom = Math.max(0, Math.min(2, CAMQ.zoom + d));
  try{ camRefresh(); }catch(e){}
  const l = document.getElementById('camzoomlabel');
  if(l) l.textContent = ['Wide','Normal','Close'][CAMQ.zoom];
};

(function camQualityCss(){
  const s = document.createElement('style');
  s.textContent = `
  /* bigger cells: the old 230px minimum is what forced the downscale */
  .camgrid{ grid-template-columns:repeat(auto-fit,minmax(300px,1fr)) !important; }
  /* half the scanlines, a third of the vignette */
  .camscan{ background:repeating-linear-gradient(rgba(255,255,255,.018) 0 1px, transparent 1px 4px) !important;
    box-shadow:inset 0 0 12px rgba(0,0,0,.30) !important; }
  /* infrared that you can still see through */
  .camsvg.ir{ filter:sepia(.75) hue-rotate(62deg) saturate(2.1) brightness(1.22) contrast(1.05) !important; }
  .camsvg{ image-rendering:auto; shape-rendering:geometricPrecision }
  .camzoom{ display:flex; gap:6px; align-items:center; justify-content:flex-end;
    margin:8px 0 2px; font-size:12px; opacity:.85 }
  .camzoom button{ padding:3px 9px }
  .evrow{ display:grid; grid-template-columns:64px 1fr; gap:10px; padding:6px 0;
    border-bottom:1px solid var(--line2,#33402c); font-size:14px }
  .evrow:last-child{ border-bottom:0 }
  .evtime{ font-family:ui-monospace,monospace; opacity:.75 }
  .evkey{ color:#e2a05c }
  `;
  document.head.appendChild(s);
})();

/* ---------- 2. the night something got out ---------- */
const CAUSES = [
  { id:'fox',   n:'A fox worked the fence',
    fix:'The netting is dug in properly now.',
    tell:(cam)=>({ cam, who:'a fox along the fence line', kind:'wild' }) },
  { id:'gate',  n:'A gate was left unlatched',
    fix:'That gate has a spring catch on it now.',
    tell:(cam)=>({ cam, who:'the gate swinging', kind:'gate' }) },
  { id:'post',  n:'A strainer post gave way',
    fix:'The strainer is replaced and the wire restrung.',
    tell:(cam)=>({ cam, who:'a fence post going over', kind:'fence' }) },
];
function incState(){
  if(!S.incident) S.incident = { open:null, solved:0, wrong:0, fixed:{}, day:-1 };
  return S.incident;
}
function penObjs(){
  return (S.objs || []).filter(o=>(BPMAP[o.bp] || {}).kind === 'animal' && (o.animals || 0) > 0);
}
/* which cameras could actually see a spot */
function camsCovering(x, y){
  const out = [];
  cameraPosts().forEach((o,i)=>{
    const v = cameraView(o);
    if(Math.hypot(x - v.ax, y - v.ay) < CAM_RANGE * 1.25) out.push('Camera ' + (i+1));
  });
  return out;
}
function nightIncident(){
  const I = incState();
  if(I.day === S.day) return;
  I.day = S.day;
  if(I.open) return;                                  /* one at a time */
  const pens = penObjs();
  if(!pens.length) return;
  if((S.day || 1) < 8) return;                        /* not in the first week */

  /* causes you have already dealt with are much less likely to repeat */
  const pool = CAUSES.filter(c=>!(I.fixed[c.id] && (S.day || 1) - I.fixed[c.id] < 40));
  if(!pool.length) return;
  if(Math.random() > 0.055) return;

  const pen = pens[Math.floor(Math.random()*pens.length)];
  const bp = BPMAP[pen.bp], f = footprint(bp, pen.rot);
  const px = (pen.tx + f.w/2)*T, py = (pen.ty + f.h/2)*T;
  const cause = pool[Math.floor(Math.random()*pool.length)];
  const witnesses = camsCovering(px, py);
  const hour = 1 + Math.floor(Math.random()*4);       /* small hours */
  const at = String(hour).padStart(2,'0') + ':' + String(Math.floor(Math.random()*60)).padStart(2,'0');

  /* the tell goes in the log only if something was watching that ground */
  if(witnesses.length){
    const t = cause.tell(witnesses[0]);
    CAM.log.unshift({ cam:t.cam, who:t.who, kind:t.kind, at, day:S.day || 1, night:true, evidence:true });
    /* and the stock going through, a few minutes later */
    CAM.log.unshift({ cam:witnesses[0], who:`${bp.animal || 'stock'} on the move`, kind:'stray',
      at:String(hour).padStart(2,'0') + ':' + String(Math.min(59, +at.slice(3) + 4)).padStart(2,'0'),
      day:S.day || 1, night:true, evidence:true });
  }

  const lost = Math.max(1, Math.round((pen.animals || 4) * 0.35));
  pen.animals = Math.max(0, (pen.animals || 0) - lost);
  I.open = { cause:cause.id, pen:pen.id, penName:bp.name, lost, at, day:S.day || 1,
             witnesses, seen:witnesses.length > 0 };

  if(typeof log === 'function')
    log(`${lost} out of the ${bp.name.toLowerCase()} overnight. ${witnesses.length
      ? `${witnesses.join(' and ')} ${witnesses.length > 1 ? 'were' : 'was'} pointed that way.`
      : 'Nothing was watching that part of the farm.'}`, 'bad', 'farm');
  if(typeof toast === 'function') toast('Stock out overnight', 'bad');
  try{ sfx('error'); }catch(e){}
}
if(typeof tickPeople === 'function'){
  const _tickInc = tickPeople;
  tickPeople = function(){
    const r = _tickInc.apply(this, arguments);
    try{ nightIncident(); }catch(e){}
    return r;
  };
}

/* ---------- naming the cause ---------- */
G.openIncident = function(){
  const I = incState();
  const o = I.open;
  if(!o) return G.openCameras();
  const night = CAM.log.filter(e=>e.day === o.day && e.night);
  modal(`<h2>Last night</h2>
    <p class="sub">${o.lost} out of the ${o.penName.toLowerCase()}, some time around ${o.at}.
      ${o.seen ? 'This is what the cameras have.' :
        'Nothing on the place was pointed at that fence, so there is nothing to look at.'}</p>
    ${o.seen ? `<div class="rows">${night.map(e=>
      `<div class="evrow"><span class="evtime">${e.at}</span>
        <span>${e.cam} · <span class="${e.evidence ? 'evkey' : ''}">${e.who}</span></span></div>`).join('')
      || '<p class="sub">The night was quiet on every camera.</p>'}</div>` : ''}
    <h3 style="margin:16px 0 6px;font-size:15px">What let them out?</h3>
    <div class="mkgrid">${CAUSES.map(c=>
      `<button class="mkcard" onclick="G.blameIt('${c.id}')"><b>${c.n}</b>
        <span class="lprice">Fix that</span></button>`).join('')}</div>
    <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Leave it for now</button></div>`);
};
G.blameIt = function(id){
  const I = incState();
  const o = I.open; if(!o) return;
  const right = id === o.cause;
  const c = CAUSES.find(x=>x.id === id);
  if(right){
    I.fixed[id] = S.day || 1;
    I.solved = (I.solved || 0) + 1;
    if(typeof log === 'function') log(`${c.fix} That should hold.`, 'good', 'farm');
    if(typeof toast === 'function') toast('Cause found and fixed', 'good');
  } else {
    I.wrong = (I.wrong || 0) + 1;
    const real = CAUSES.find(x=>x.id === o.cause);
    if(typeof log === 'function')
      log(`Spent the morning on the ${c.n.toLowerCase()}. It was not that — `
        + `${real.n.toLowerCase()}, and it is still like that.`, 'bad', 'farm');
    if(typeof toast === 'function') toast('Wrong thing fixed', 'bad');
  }
  I.open = null;
  G.closeModal();
};

/* the cameras panel gets the zoom and a way into the incident */
if(typeof G.openCameras === 'function'){
  const _openCamBase = G.openCameras;
  G.openCameras = function(){
    const r = _openCamBase.apply(this, arguments);
    try{
      const grid = document.getElementById('camgrid');
      if(grid){
        const bar = document.createElement('div');
        bar.className = 'camzoom';
        bar.innerHTML = `<span id="camzoomlabel">${['Wide','Normal','Close'][CAMQ.zoom]}</span>
          <button class="btn ghost" onclick="G.camZoom(-1)">−</button>
          <button class="btn ghost" onclick="G.camZoom(1)">+</button>`;
        grid.parentNode.insertBefore(bar, grid);
        const I = incState();
        if(I.open){
          const warn = document.createElement('div');
          warn.className = 'note';
          warn.style.cssText = 'border-left:2px solid #e2705c;padding-left:14px;margin:0 0 12px';
          warn.innerHTML = `<b>${I.open.lost} out of the ${I.open.penName.toLowerCase()} last night.</b>
            <div style="margin-top:7px"><button class="btn" onclick="G.openIncident()">Review the night</button></div>`;
          grid.parentNode.insertBefore(warn, bar);
        }
      }
    }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.evidenceAudit = function(){
  const I = incState();
  return {
    feedZoom: ['Wide','Normal','Close'][CAMQ.zoom],
    worldPxAcross: (()=>{ const p = cameraPosts()[0]; if(!p) return 'no camera';
      return Math.round(feedBox(p).w); })(),
    openIncident: I.open ? `${I.open.lost} from the ${I.open.penName} at ${I.open.at}, `
      + `${I.open.seen ? I.open.witnesses.join('/') + ' saw it' : 'nothing watching'}` : 'none',
    trueCause: I.open ? I.open.cause : null,
    solved: I.solved || 0, wrongCalls: I.wrong || 0,
    causesFixed: Object.keys(I.fixed || {}),
    evidenceInLog: CAM.log.filter(e=>e.evidence).length,
    cameras: cameraPosts().length,
  };
};
