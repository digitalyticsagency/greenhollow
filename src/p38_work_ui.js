/* =====================================================================
   A JOB YOU HAVE TO SIT THROUGH, PANELS THAT GET OUT OF THE WAY,
   A DONATE BUTTON, AND A DOME WORTH UPGRADING

   Accepting a client job used to pay instantly: click, money, carry on
   farming. That is not work. A job now holds you at the desk for its
   full hours, blocks farm jobs while it runs, and only pays when it is
   finished — which is what makes the hours you spend on it a real
   trade against the hours the land needs.
   ===================================================================== */

/* ---------- 1. a job is a commitment ---------- */

/* in-game hours tick with the clock, so game speed and day length apply */
function busyNow(){ return S.career && S.career.busy; }

const _takeJobCommit = takeJob;
takeJob = function(id){
  careerInit();
  if(busyNow()){
    toast('You are already on a job — finish it first','bad');
    if(typeof sfx === 'function') sfx('error');
    return;
  }
  const j = S.career.jobs.find(z=>z.id===id);
  if(!j) return;
  if(S.career.hours < j.hrs){
    toast(`Only ${S.career.hours.toFixed(1)}h left today`,'bad');
    if(typeof sfx === 'function') sfx('error');
    return;
  }
  /* take it off the board and start the clock. Nothing is paid yet. */
  S.career.busy = {id:j.id, kind:j.kind, who:j.who, pay:j.pay, hrs:j.hrs, left:j.hrs};
  S.career.jobs = S.career.jobs.filter(z=>z.id!==id);

  /* sit down at the desk */
  const H = (typeof houseRect === 'function') ? houseRect() : null;
  if(H && S.you && ROOMS.study){
    const r = ROOMS.study;
    S.you.x = H.x + (r.x + r.w*0.5)*H.w;
    S.you.y = H.y + (r.y + r.h*0.55)*H.h;
    S.you.state = 'desk'; S.you.path = []; S.you.job = null;
    if(typeof paintYou === 'function') paintYou();
  }
  log(`Started ${j.kind} for ${j.who} — ${j.hrs}h at the desk.`, '', 'money');
  toast(`On the clock: ${j.kind} (${j.hrs}h)`, 'good');
  if(typeof sfx === 'function') sfx('click');
  paintBusy();                     /* show the bar immediately, not on the next tick */
  ui(); G.save();
};

/* burn the hours down, then pay */
let busyAcc = 0;
function tickBusy(dtms){
  const b = busyNow();
  if(!b) return;
  /* DAY_MS of real time is 24 in-game hours */
  const dayMs = (typeof DAY_MS_OVERRIDE === 'number' && DAY_MS_OVERRIDE) ? DAY_MS_OVERRIDE
              : (typeof DAY_MS === 'number' ? DAY_MS : 45000);
  b.left -= (dtms / dayMs) * 24;

  if(S.you && S.you.state !== 'desk' && !S.you.job){
    S.you.state = 'desk';
  }
  if(b.left <= 0){
    S.career.hours = Math.max(0, S.career.hours - b.hrs);
    S.career.worked += b.hrs;
    S.cash += b.pay; S.totalEarned += b.pay;
    S.career.cxp += Math.round(b.hrs*9);
    while(S.career.cxp >= skillNext() && S.career.skill < prof().ceil){
      S.career.cxp -= skillNext(); S.career.skill++;
      toast(`${prof().name} — skill level ${S.career.skill}`,'gold');
      if(typeof sfx==='function') sfx('level');
    }
    log(`Delivered ${b.kind} for ${b.who} — ${fmt(b.pay)}.`, 'gold', 'money');
    toast(`Paid ${fmt(b.pay)}`, 'gold');
    if(typeof sfx==='function') sfx('coin');
    S.career.busy = null;
    S.you.state = 'idle';
    if(typeof rollJobs==='function') rollJobs();
    ui(); G.save();
  }
  paintBusy();
}

/* a bar so you can see how long is left */
function paintBusy(){
  const b = busyNow();
  let el = document.getElementById('busybar');
  if(!b){ if(el) el.remove(); return; }
  if(!el){
    el = document.createElement('div');
    el.id = 'busybar';
    el.innerHTML = `<div class="bb-in"><b></b><span></span><i></i></div>`;
    document.body.appendChild(el);
  }
  const pct = Math.max(0, Math.min(1, 1 - b.left/b.hrs));
  el.querySelector('b').textContent = `${b.kind} — ${b.who}`;
  el.querySelector('span').textContent = `${b.left.toFixed(1)}h left · ${fmt(b.pay)} on delivery`;
  el.querySelector('i').style.transform = `scaleX(${pct.toFixed(3)})`;
}

/* farm jobs are refused while you are on the clock */
const _goDoBusy = goDo;
goDo = function(obj, kind, fn){
  if(busyNow()){
    toast('You are at the desk until this job is done','bad');
    if(typeof sfx==='function') sfx('error');
    return;
  }
  return _goDoBusy.apply(this, arguments);
};

/* the autopilot must not walk you off mid-job either */
const _youRoutineBusy = (typeof youRoutine === 'function') ? youRoutine : null;
if(_youRoutineBusy){
  youRoutine = function(){
    if(busyNow()){
      const H = houseRect();
      if(H && ROOMS.study){
        const r = ROOMS.study;
        return { x: H.x + (r.x + r.w*0.5)*H.w,
                 y: H.y + (r.y + r.h*0.55)*H.h, act:'at the desk', state:'desk' };
      }
    }
    return _youRoutineBusy.apply(this, arguments);
  };
}

/* drive it from the same ticker the avatar uses */
let busyLast = performance.now();
setInterval(()=>{
  const now = performance.now();
  const dt = now - busyLast; busyLast = now;
  if(S && S.speed !== 0 && !document.hidden) tickBusy(dt * (S.speed || 1));
}, 250);

/* ---------- 2. panels that fold away ---------- */
function togglePanel(side){
  const el = document.getElementById(side);
  if(!el) return;
  const now = !el.classList.contains('folded');
  el.classList.toggle('folded', now);
  const stage = document.getElementById('stage');
  if(stage) stage.classList.toggle('fold-' + side, now);
  settingsInit();
  S.settings['fold_' + side] = now;
  G.save();
  if(typeof sfx === 'function') sfx('click');
  /* the stage changed width, so the camera clamp needs to re-run */
  setTimeout(()=>{ if(typeof applyCam === 'function') applyCam(); }, 260);
}
G.togglePanel = togglePanel;

setTimeout(()=>{
  ['left','right'].forEach(side=>{
    const el = document.getElementById(side);
    if(!el || el.querySelector('.foldbtn')) return;
    const b = document.createElement('button');
    b.className = 'foldbtn foldbtn-' + side;
    b.type = 'button';
    b.title = (side === 'left' ? 'Hide the build panel' : 'Hide the info panel');
    b.setAttribute('aria-label', b.title);
    b.textContent = side === 'left' ? '‹' : '›';
    b.addEventListener('click', e=>{ e.stopPropagation(); togglePanel(side); });
    el.appendChild(b);
    if(SET('fold_' + side)){
      el.classList.add('folded');
      const stage = document.getElementById('stage');
      if(stage) stage.classList.add('fold-' + side);
    }
  });
}, 500);

/* ---------- 3. donate ---------- */
G.openDonate = function(){
  const link = (typeof PAYPAL_LINK === 'string' && /^https:\/\//.test(PAYPAL_LINK)) ? PAYPAL_LINK : '';
  modal(`<h2>Support Greenhollow</h2>
    <p class="sub">This game is free to play and made by one person. If you have got a few
    hours out of it, anything you send goes straight back into building more of it —
    more land, more animals, more to do.</p>
    ${link
      ? `<a class="btn" style="display:block;text-align:center;text-decoration:none"
           href="${link}" target="_blank" rel="noopener noreferrer">Donate with PayPal</a>`
      : `<button class="btn" disabled>PayPal link not set up yet</button>`}
    <p class="sub" style="margin-top:10px;font-size:11px">Payment is handled entirely by
    PayPal — the game never sees your card details.</p>
    <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Maybe later</button></div>`);
};

setTimeout(()=>{
  const bar = document.querySelector('.tbtn') && document.querySelector('.tbtn').parentElement;
  if(!bar || document.getElementById('donatebtn')) return;
  const b = document.createElement('button');
  b.id = 'donatebtn'; b.className = 'tbtn donate';
  b.textContent = '♥ Donate';
  b.dataset.tip = '<b>Support the game</b>Free to play. Donations go into building more of it.';
  b.addEventListener('click', ()=>G.openDonate());
  bar.appendChild(b);
}, 520);

/* ---------- 4. the dome, properly ---------- */
/* A geodesic dome is a retreat, so it earns a sauna, a deck of flowers
   and light — not a lattice and a shade sail. */
ARCH_SPECIAL.dome = function(w, h, t, seed){
  let s = '';
  const cx = w*0.5, cy = h*0.46, R = Math.min(w,h)*0.34;
  if(t >= 1){
    /* the triangulated skin that makes it read as geodesic at all */
    for(let ring=1; ring<=2; ring++){
      const rr = R*(ring===1 ? 0.52 : 0.86);
      s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(rr)}" fill="none"
        stroke="#e8eef1" stroke-width="0.7" opacity=".55"/>`;
    }
    for(let i=0;i<8;i++){
      const a=(i/8)*Math.PI*2;
      s += `<line x1="${n(cx+Math.cos(a)*R*0.20)}" y1="${n(cy+Math.sin(a)*R*0.20)}"
        x2="${n(cx+Math.cos(a)*R*0.86)}" y2="${n(cy+Math.sin(a)*R*0.86)}"
        stroke="#e8eef1" stroke-width="0.7" opacity=".55"/>`;
    }
    /* deck wrapping the front of the dome */
    s += deckBoards(w*0.06, h*0.76, w*0.88, h*0.19, seed);
  }
  if(t >= 2){
    /* a barrel sauna alongside, and lights over the deck */
    /* sat down beside the dome rather than across its outline */
    const sx = w*0.03, sy = h*0.57, sw = w*0.23, sh = h*0.17;
    s += `<rect x="${n(sx+1)}" y="${n(sy+1.4)}" width="${n(sw)}" height="${n(sh)}" rx="${n(sh/2)}" fill="#16240c" opacity=".22"/>`;
    s += `<rect x="${n(sx)}" y="${n(sy)}" width="${n(sw)}" height="${n(sh)}" rx="${n(sh/2)}" fill="#a3763f"/>`;
    for(let i=1;i<6;i++)
      s += `<line x1="${n(sx+sw*i/6)}" y1="${n(sy+1)}" x2="${n(sx+sw*i/6)}" y2="${n(sy+sh-1)}"
        stroke="#8a6134" stroke-width="0.6" opacity=".8"/>`;
    s += `<circle cx="${n(sx+sw*0.86)}" cy="${n(sy+sh*0.5)}" r="${n(sh*0.22)}" fill="#5c4a33"/>`;
    /* the flue, with heat coming off it */
    s += `<rect x="${n(sx+sw*0.20)}" y="${n(sy-h*0.06)}" width="${n(w*0.022)}" height="${n(h*0.07)}" rx="1" fill="#8d959a"/>`;
    for(let i=0;i<2;i++)
      s += `<circle class="fx-steam" cx="${n(sx+sw*0.21)}" cy="${n(sy-h*0.07)}" r="${(2.2+i).toFixed(1)}"
        fill="#ffffff" opacity=".2" style="animation-delay:-${(i*1.6).toFixed(1)}s"/>`;
    s += festoon(w*0.06, h*0.74, w*0.94, h*0.74, 7, seed);
  }
  if(t >= 3){
    /* a glazed oculus, a second light run, and flower beds along the deck */
    s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R*0.20)}" fill="url(#gGlass)" opacity=".92"
      stroke="#cfd9de" stroke-width="0.8"/>`;
    s += festoon(w*0.10, h*0.06, w*0.90, h*0.12, 6, seed+3);
    /* colourful planting rather than the usual green */
    const cols = ['#e05c7a','#f0a24b','#f5d94e','#a86fd0','#e8607f','#f2b33d'];
    for(let i=0;i<10;i++){
      const fx = w*(0.09 + i*0.086), fy = h*(0.965 + (i%2)*0.014);
      s += `<circle cx="${n(fx)}" cy="${n(fy)}" r="2.1" fill="${cols[i%cols.length]}"/>`;
      s += `<circle cx="${n(fx)}" cy="${n(fy)}" r="0.8" fill="#fdf3c8"/>`;
    }
    s += `<rect x="${n(w*0.06)}" y="${n(h*0.945)}" width="${n(w*0.88)}" height="${n(h*0.045)}" rx="1.4"
      fill="#5f7a3c" opacity=".55"/>`;
  }
  return s;
};

(function workUiCss(){
  const s = document.createElement('style');
  s.textContent = `
  /* the job bar */
  #busybar{position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:60;
    background:rgba(20,28,18,.94);border:1px solid #3d4a33;border-radius:12px;
    padding:9px 14px;min-width:250px;box-shadow:0 10px 28px rgba(0,0,0,.4);}
  #busybar b{display:block;font-size:12px;color:#e6ecdf;}
  #busybar span{display:block;font-size:10.5px;color:#a9b69c;margin:2px 0 6px;}
  #busybar i{display:block;height:4px;border-radius:2px;background:#7cc24f;
    transform-origin:left center;transition:transform .3s ease;}
  #busybar .bb-in::after{content:'';display:block;}

  /* Folding panels. #stage lays them out as grid columns, so the track
     itself has to collapse - hiding the aside alone would leave a
     250px hole where it used to be. */
  /* Desktop only. Below 980px the panels are already overlay sheets with
     their own tab bar, and forcing a three-column grid there breaks them. */
  @media(min-width:981px){
    #stage{ transition: grid-template-columns .22s ease; }
    #stage.fold-left           { grid-template-columns: 0 minmax(0,1fr) 288px; }
    #stage.fold-right          { grid-template-columns: 250px minmax(0,1fr) 0; }
    #stage.fold-left.fold-right{ grid-template-columns: 0 minmax(0,1fr) 0; }
    #left, #right{ position:relative; transition: opacity .18s ease; }
    #left.folded, #right.folded{ opacity:0; pointer-events:none; overflow:hidden; }
  }
  @media(max-width:980px){
    .foldbtn, .unfold{ display:none !important; }
  }
  .foldbtn{position:absolute;top:8px;z-index:6;width:20px;height:26px;border-radius:6px;
    background:rgba(255,255,255,.09);border:1px solid var(--line,#ffffff1f);
    color:#c6d1ba;font-size:13px;line-height:1;cursor:pointer;padding:0;}
  .foldbtn:hover{background:rgba(255,255,255,.16);}
  .foldbtn-left{right:6px;} .foldbtn-right{left:6px;}
  /* when folded the button itself is hidden with the panel, so a fixed
     handle brings it back */
  .unfold{position:fixed;top:56px;z-index:61;width:22px;height:30px;border-radius:7px;
    background:rgba(20,28,18,.92);border:1px solid #3d4a33;color:#c6d1ba;
    font-size:13px;cursor:pointer;padding:0;}
  .unfold-left{left:0;border-left:none;border-radius:0 7px 7px 0;}
  .unfold-right{right:0;border-right:none;border-radius:7px 0 0 7px;}
  .tbtn.donate{color:#ffc7d4;border-color:#7a4a58;}
  .tbtn.donate:hover{background:rgba(255,120,150,.16);}
  `;
  document.head.appendChild(s);
})();

/* a handle to bring a folded panel back */
setTimeout(()=>{
  ['left','right'].forEach(side=>{
    if(document.querySelector('.unfold-' + side)) return;
    const u = document.createElement('button');
    u.className = 'unfold unfold-' + side;
    u.type = 'button';
    u.textContent = side === 'left' ? '›' : '‹';
    u.title = 'Show the panel';
    u.style.display = 'none';
    u.addEventListener('click', ()=>togglePanel(side));
    document.body.appendChild(u);
  });
  /* keep the handles in step with the panels */
  setInterval(()=>{
    ['left','right'].forEach(side=>{
      const el = document.getElementById(side);
      const u = document.querySelector('.unfold-' + side);
      if(el && u) u.style.display = el.classList.contains('folded') ? 'block' : 'none';
    });
  }, 600);
}, 540);
