/* =====================================================================
   THE FARM REEL — TAKE PICTURES OF YOUR OWN FARM, AND PLAY THEM BACK

   Asked for a film of the game. The honest place for that is inside the
   game: the scene is one SVG with a known viewBox, so a frame is a
   serialise, a draw onto a canvas and a data URI. No library, no server,
   nothing to install, and it works on the published page as well as
   locally.

   WHAT IT DOES. Press record and it takes a frame every so often while
   you carry on playing — the sun crosses, the lights come on, the birds
   go up, somebody walks into the dairy. Press stop and it plays the
   frames back as a reel you can scrub, and offers the lot as a strip you
   can save.

   IT CAPTURES THE SCENE, NOT THE WINDOW. Frames come from the SVG rather
   than the browser window, so what you get is the farm at a fixed
   1160x800 regardless of how the panels are sized or where the camera is
   scrolled — which is what makes a sequence of them cut together instead
   of jittering.

   WHY IT IS CHEAP. Frames are WebP at about 9KB each at half size, so a
   sixty frame reel is around half a megabyte held in memory and nothing
   is written until you ask for it. The capture is throttled and skips a
   frame rather than queueing if one is still encoding, so recording never
   drags the simulation — the whole point is to film the game running at
   its normal speed.
   ===================================================================== */

const REEL = {
  on: false, frames: [], every: 1.4, t: 0, busy: false,
  w: 580, h: 400, q: 0.62, max: 90, playing: false, at: 0,
};

/* one frame: the whole scene, defs included, as a standalone SVG */
function reelSVG(){
  const bg = document.getElementById('bg');
  const fg = document.getElementById('fg');
  const defs = document.getElementById('defsHost');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WPX} ${HPX}">`
    + (defs ? defs.innerHTML : '')
    + (bg ? bg.innerHTML : '')
    + (fg ? fg.innerHTML : '')
    + `</svg>`;
}

function reelShoot(){
  if(REEL.busy) return;                     /* skip, never queue */
  REEL.busy = true;
  const svg = reelSVG();
  const blob = new Blob([svg], { type:'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = ()=>{
    try{
      const c = document.createElement('canvas');
      c.width = REEL.w; c.height = REEL.h;
      const cx = c.getContext('2d');
      cx.fillStyle = '#0d1410'; cx.fillRect(0, 0, c.width, c.height);
      cx.drawImage(img, 0, 0, c.width, c.height);
      const data = c.toDataURL('image/webp', REEL.q);
      REEL.frames.push({ data, day:S.day, hour:(typeof dayFrac === 'function') ? dayFrac() : 0,
                         season:S.season, cash:S.cash });
      if(REEL.frames.length > REEL.max) REEL.frames.shift();
    }catch(e){}
    URL.revokeObjectURL(url);
    REEL.busy = false;
    if(REEL.playing) reelPaint();
  };
  img.onerror = ()=>{ URL.revokeObjectURL(url); REEL.busy = false; };
  img.src = url;
}

function reelTick(dt){
  if(!REEL.on) return;
  REEL.t += dt;
  if(REEL.t < REEL.every) return;
  REEL.t = 0;
  reelShoot();
}
if(typeof tickPeople === 'function'){
  const _tickReel = tickPeople;
  tickPeople = function(dt){
    const r = _tickReel.apply(this, arguments);
    try{ reelTick(typeof dt === 'number' ? dt : 1/30); }catch(e){}
    return r;
  };
}

/* ---------- the panel ---------- */
G.openReel = function(){
  const n0 = REEL.frames.length;
  modal(`<h2>The farm reel</h2>
    <p class="sub">Takes a picture of your land every ${REEL.every.toFixed(1)} seconds while you
      carry on playing, then plays them back. ${n0 ? `You have ${n0} frame${n0>1?'s':''}.`
      : 'Nothing filmed yet.'}</p>
    <div class="mkgrid">
      <button class="mkcard" onclick="G.reelToggle()"><b>${REEL.on ? 'Stop filming' : 'Start filming'}</b>
        <span class="muted">${REEL.on ? 'Recording now — go and do something worth watching.'
          : 'Let a day run, or ride the dragon, and come back.'}</span>
        <span class="lprice">${REEL.on ? 'Stop' : 'Record'}</span></button>
      <button class="mkcard" ${n0 < 2 ? 'disabled':''} onclick="G.reelPlay()"><b>Play it back</b>
        <span class="muted">${n0 < 2 ? 'Film something first.' : `${n0} frames, about ${
          Math.round(n0/8)}s of reel.`}</span>
        <span class="lprice">${n0 < 2 ? '—' : 'Watch'}</span></button>
      <button class="mkcard" ${!n0 ? 'disabled':''} onclick="G.reelSheet()"><b>Save a contact sheet</b>
        <span class="muted">Every frame on one page, with the day and the hour on each.</span>
        <span class="lprice">${!n0 ? '—' : 'Open'}</span></button>
      <button class="mkcard" ${!n0 ? 'disabled':''} onclick="G.reelClear();G.openReel()"><b>Throw it away</b>
        <span class="muted">Clears the frames from memory.</span>
        <span class="lprice">${!n0 ? '—' : 'Clear'}</span></button>
    </div>
    <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Close</button></div>`);
};

G.reelToggle = function(){
  REEL.on = !REEL.on;
  if(REEL.on){ REEL.t = REEL.every; if(typeof G.wakeTheWorld === 'function') G.wakeTheWorld(); }
  if(typeof toast === 'function') toast(REEL.on ? 'Filming' : `Stopped — ${REEL.frames.length} frames`, 'good');
  if(typeof log === 'function')
    log(REEL.on ? 'You started filming the farm.' : `You stopped filming. ${REEL.frames.length} frames.`, '', 'farm');
  G.openReel();
};
G.reelClear = function(){ REEL.frames.length = 0; REEL.at = 0; };

/* playback, in the modal, driven by its own timer so it runs at reel
   speed rather than at whatever the simulation is doing */
let REEL_TIMER = null;
G.reelPlay = function(){
  if(REEL.frames.length < 2) return;
  REEL.playing = true; REEL.at = 0;
  modal(`<h2>The farm reel</h2>
    <div id="reelstage" style="border-radius:10px;overflow:hidden;background:#0d1410"></div>
    <div class="rows" id="reelmeta" style="margin-top:8px"></div>
    <input id="reelscrub" type="range" min="0" max="${REEL.frames.length-1}" value="0"
      style="width:100%;margin-top:8px" oninput="G.reelSeek(this.value)">
    <div class="mfoot">
      <button class="btn ghost" onclick="G.reelStop();G.openReel()">Back</button>
      <button class="btn" id="reelpp" onclick="G.reelPause()">Pause</button>
    </div>`);
  reelPaint();
  if(REEL_TIMER) clearInterval(REEL_TIMER);
  REEL_TIMER = setInterval(()=>{
    if(!REEL.playing) return;
    REEL.at = (REEL.at + 1) % REEL.frames.length;
    reelPaint();
  }, 125);
};
G.reelPause = function(){
  REEL.playing = !REEL.playing;
  const b = document.getElementById('reelpp');
  if(b) b.textContent = REEL.playing ? 'Pause' : 'Play';
};
G.reelSeek = function(v){ REEL.at = Math.max(0, Math.min(REEL.frames.length-1, +v)); reelPaint(); };
G.reelStop = function(){
  REEL.playing = false;
  if(REEL_TIMER){ clearInterval(REEL_TIMER); REEL_TIMER = null; }
};
function reelPaint(){
  const st = document.getElementById('reelstage');
  if(!st) return;
  const f = REEL.frames[REEL.at]; if(!f) return;
  st.innerHTML = `<img src="${f.data}" style="width:100%;display:block" alt="frame">`;
  const m = document.getElementById('reelmeta');
  if(m) m.innerHTML = `<div class="row"><span>Frame</span><b>${REEL.at+1} / ${REEL.frames.length}</b></div>
    <div class="row"><span>Day</span><b>${f.day} · ${SEASONS ? (SEASONS[f.season]||{}).n || '' : ''}</b></div>
    <div class="row"><span>Time</span><b>${reelClock(f.hour)}</b></div>`;
  const sc = document.getElementById('reelscrub');
  if(sc && +sc.value !== REEL.at) sc.value = REEL.at;
}
function reelClock(fr){
  const mins = Math.round(((fr || 0) * 24 * 60)) % (24*60);
  const h = Math.floor(mins/60), m = mins % 60;
  return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
}

/* a contact sheet in a new tab — every frame, captioned. Opened rather
   than downloaded so nothing is written to disk without you saying so;
   it is a normal page and you can save or print it from there. */
G.reelSheet = function(){
  if(!REEL.frames.length) return;
  const cells = REEL.frames.map((f,i)=>`
    <figure><img src="${f.data}" alt="frame ${i+1}">
      <figcaption>${i+1} · day ${f.day} · ${reelClock(f.hour)}</figcaption></figure>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><title>Greenhollow — the farm reel</title>
    <style>body{margin:0;padding:22px;background:#121a10;color:#e8f0e4;
      font:14px/1.5 ui-sans-serif,system-ui,sans-serif}
      h1{font-size:19px;margin:0 0 4px} p{opacity:.7;margin:0 0 18px}
      .g{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
      figure{margin:0;background:#1b2418;border:1px solid #33402c;border-radius:10px;overflow:hidden}
      img{width:100%;display:block} figcaption{padding:6px 9px;font-size:12px;opacity:.75}</style>
    <h1>Greenhollow — the farm reel</h1>
    <p>${REEL.frames.length} frames. Day ${REEL.frames[0].day} to ${REEL.frames[REEL.frames.length-1].day}.</p>
    <div class="g">${cells}</div>`;
  const w = window.open('', '_blank');
  if(!w) return toast && toast('Your browser blocked the new tab', 'bad');
  w.document.write(html); w.document.close();
};

/* a button by the others */
if(typeof syncWorldButtons === 'function'){
  const _syncReel = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncReel.apply(this, arguments);
    try{
      const host = document.getElementById('zoomctl');
      if(host && !document.getElementById('reelbtn')){
        const b = document.createElement('button');
        b.id = 'reelbtn'; b.textContent = '🎞';
        b.title = 'Film the farm';
        b.setAttribute('data-tip','<b>The farm reel</b>Takes a picture every second or so while you play, then plays it back.');
        b.onclick = ()=>G.openReel();
        host.insertBefore(b, host.firstChild);
      }
      const b2 = document.getElementById('reelbtn');
      if(b2) b2.style.opacity = REEL.on ? '1' : '';
    }catch(e){}
    return r;
  };
}
(function reelCss(){
  const s = document.createElement('style');
  s.textContent = `#reelbtn{ font-size:15px; line-height:1 }
  #reelstage img{ image-rendering:auto }`;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.reelAudit = function(){
  const bytes = REEL.frames.reduce((a,f)=>a + f.data.length, 0);
  return {
    filming: REEL.on,
    frames: REEL.frames.length,
    capEvery: REEL.every + 's',
    maxFrames: REEL.max,
    frameSize: REEL.w + 'x' + REEL.h + ' webp q' + REEL.q,
    heldInMemoryKB: Math.round(bytes/1024),
    avgFrameKB: REEL.frames.length ? Math.round(bytes/REEL.frames.length/1024) : 0,
    playing: REEL.playing,
    span: REEL.frames.length ? `day ${REEL.frames[0].day} ${reelClock(REEL.frames[0].hour)} to day ${
      REEL.frames[REEL.frames.length-1].day} ${reelClock(REEL.frames[REEL.frames.length-1].hour)}` : '—',
  };
};
