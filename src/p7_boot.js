/* =====================================================================
   ACTIONS, INPUT, LOOP, SAVE
   ===================================================================== */
const SVGCSS = `
.ob{cursor:pointer;transition:filter .15s;}
.ob:hover{filter:brightness(1.09) drop-shadow(0 0 6px rgba(240,193,75,.55));}
.selring{animation:dash 1.4s linear infinite;}
@keyframes dash{to{stroke-dashoffset:-24}}
@keyframes swayA{0%,100%{transform:rotate(-1.1deg)}50%{transform:rotate(1.1deg)}}
.sway{animation:swayA 5.5s ease-in-out infinite;}
@keyframes rip{0%{opacity:.45;transform:scale(.6)}100%{opacity:0;transform:scale(1.7)}}
.ripple{transform-box:fill-box;transform-origin:center;animation:rip 3.6s ease-out infinite;}
@keyframes sp{to{transform:rotate(360deg)}}
.spin{animation:sp 3.4s linear infinite;}
.spinSlow{animation:sp 9s linear infinite;}
@keyframes tw{0%,100%{opacity:.35}50%{opacity:1}}
.twinkle{animation:tw 2.3s ease-in-out infinite;}
@keyframes fl{0%,100%{opacity:.75;transform:scale(.9)}50%{opacity:1;transform:scale(1.12)}}
.flame{transform-box:fill-box;transform-origin:center;animation:fl 1.1s ease-in-out infinite;}
@keyframes bz{0%{transform:translate(0,0)}25%{transform:translate(5px,-4px)}50%{transform:translate(-4px,-7px)}
  75%{transform:translate(-6px,2px)}100%{transform:translate(0,0)}}
.bee{animation:bz 3.4s ease-in-out infinite;}
@keyframes pk{0%,100%{transform:translateY(0)}45%{transform:translateY(1.3px)}}
.peck{transform-box:fill-box;transform-origin:center;animation:pk 2.7s ease-in-out infinite;}
@keyframes bwalkA{0%,100%{transform:translateY(0) rotate(-1.5deg)}50%{transform:translateY(-1.1px) rotate(1.5deg)}}
@keyframes brunA{0%,100%{transform:translateY(0) rotate(-4deg) scaleY(1)}
  50%{transform:translateY(-2.6px) rotate(4deg) scaleY(1.08)}}
.bwalk{transform-box:fill-box;transform-origin:center bottom;}
.bwalk.walking{animation:bwalkA .52s ease-in-out infinite;}
.bwalk.running{animation:brunA .21s ease-in-out infinite;}
#herd{pointer-events:none;}
@keyframes pu{0%,100%{opacity:.55;transform:scale(.85)}50%{opacity:1;transform:scale(1.25)}}
.pulse{transform-box:fill-box;transform-origin:center;animation:pu 1.5s ease-in-out infinite;}
@media(prefers-reduced-motion:reduce){.sway,.ripple,.spin,.spinSlow,.twinkle,.flame,.bee,.peck,.pulse,.bwalk{animation:none!important}}
`;

const G = {
  /* ---------- build & placement ---------- */
  cat(c){ curCat = c; renderBuild(); },
  pick(idOrObj, isPickAction){
    if(isPickAction) return G.pickFruit(idOrObj);
    const bp = BPMAP[idOrObj];
    if(!bp) return;
    if(S.lvl < bp.lvl) return toast(`Unlocks at level ${bp.lvl}`,'bad');
    if(S.cash < bp.cost) return toast(`You need ${fmt(bp.cost-S.cash)} more`,'bad');
    sfx('click');
    ghost = {bp, rot:0, tx:FARM.x+2, ty:FARM.y+2, moving:0};
    $('#viewport').classList.add('placing');
    render(); ui();
  },
  startMove(id){
    const o = S.objs.find(z=>z.id===id); if(!o) return;
    ghost = {bp:BPMAP[o.bp], rot:o.rot, tx:o.tx, ty:o.ty, moving:id};
    $('#viewport').classList.add('placing');
    render(); ui(); toast('Drop it where you want it','');
  },
  cancel(){ ghost = null; $('#viewport').classList.remove('placing'); render(); ui(); },
  rotGhost(){ if(ghost){ ghost.rot = (ghost.rot+90)%360; render(); } },
  rotate(id){
    const o = S.objs.find(z=>z.id===id); if(!o) return;
    const bp = BPMAP[o.bp], nr = (o.rot+90)%360, f = footprint(bp,nr);
    if(overlaps(o.tx,o.ty,f,o.id)) return toast('No room to turn it there','bad');
    o.rot = nr; sfx('rotate'); render(); ui();
  },
  commit(){
    if(!ghost) return;
    const f = footprint(ghost.bp, ghost.rot);
    if(overlaps(ghost.tx, ghost.ty, f, ghost.moving)) return toast('Something is in the way','bad');
    if(ghost.moving){
      const o = S.objs.find(z=>z.id===ghost.moving);
      o.tx=ghost.tx; o.ty=ghost.ty; o.rot=ghost.rot;
      G.cancel(); toast('Moved','good'); return;
    }
    if(S.cash < ghost.bp.cost) return toast('Not enough cash','bad');
    const o = place(ghost.bp.id, ghost.tx, ghost.ty, ghost.rot);
    sfx('build');
    addXP(Math.round(ghost.bp.cost/16)+2);
    log(`Built ${ghost.bp.name} for ${fmt(ghost.bp.cost)}.`,'gold');
    sel = o.id;
    if(S.cash < ghost.bp.cost){ G.cancel(); } else { render(); ui(); }
    G.save();
  },

  /* ---------- farming actions ---------- */
  plant(id, ck){
    const o = S.objs.find(z=>z.id===id), bp = BPMAP[o.bp], cr = CROPS[ck];
    const cost = Math.round(cr.seed*E.slots(o)*(1-stat().seedoff));
    if(S.cash < cost) return toast('Not enough cash','bad');
    S.cash -= cost; S.seedsPlanted++;
    o.crop = ck; o.stage = 0; o.pest = 0; o.weeds = 0; o.water = Math.max(o.water, 0.6);
    sfx('plant'); log(`Sowed ${cr.name}.`);
    render(); ui(); G.save();
  },
  water(id){
    const o = S.objs.find(z=>z.id===id);
    if(S.water < 8) return toast('No water left — build tanks','bad');
    S.water -= 8; o.water = 1;
    sfx('water'); toast('Watered','good'); render(); ui();
  },
  waterAll(){
    let cnt=0;
    S.objs.forEach(o=>{ if(BPMAP[o.bp].kind==='plot' && o.crop && o.water<0.85 && S.water>=8){
      S.water-=8; o.water=1; cnt++; } });
    if(cnt) sfx('water'); else sfx('error');
    toast(cnt?`Watered ${cnt} beds`:'Nothing needs water', cnt?'good':'');
    render(); ui();
  },
  treat(id){
    const o = S.objs.find(z=>z.id===id);
    if(S.cash<18) return toast('Not enough cash','bad');
    S.cash -= 18; o.pest = 0; toast('Pests dealt with','good'); render(); ui();
  },
  clearCrop(id){
    const o = S.objs.find(z=>z.id===id);
    o.crop=null; o.stage=0; o.pest=0; render(); ui();
  },
  harvest(id){
    const o = S.objs.find(z=>z.id===id), bp = BPMAP[o.bp];
    if(!o.crop || o.stage<1) return;
    const cr = CROPS[o.crop];
    const qty = Math.max(1, Math.round(cr.yield*E.slots(o)*(1+stat().workbonus)*cropMul(o)));
    give(o.crop, qty);
    addXP(4+Math.round(qty/2)); S.harvests++;
    o.fert = clamp(o.fert - 0.16, 0.15, 1); o.last = o.crop;
    o.crop=null; o.stage=0; o.weeds=0;
    sfx('harvest');
    const p = tileCentre(o);
    floatNum(`+${qty} ${cr.name}`, p.x, p.y, '#cdeeb0');
    log(`Harvested ${qty} × ${cr.name}.`,'good');
    render(); ui(); G.save();
  },
  pickFruit(id){
    const o = S.objs.find(z=>z.id===id), bp = BPMAP[o.bp];
    if(o.stage<1) return;
    const qty = Math.round(E.qty(o)*(1+stat().workbonus));
    give(bp.good, qty); addXP(4+Math.round(qty/2)); o.stage = 0;
    sfx('harvest');
    const p = tileCentre(o);
    floatNum(`+${qty} ${GOODS[bp.good].n}`, p.x, p.y, '#cdeeb0');
    log(`Picked ${qty} × ${GOODS[bp.good].n}.`,'good');
    render(); ui(); G.save();
  },
  buyAnimal(id){
    const o = S.objs.find(z=>z.id===id), bp = BPMAP[o.bp];
    if(o.animals>=E.cap(o)) return toast('Pen is full — upgrade it for more room','bad'), sfx('error');
    if(S.cash<bp.buy) return toast('Not enough cash','bad');
    S.cash -= bp.buy; o.animals++; syncHerd(o); addXP(6); sfx('collect');
    log(`Bought a ${bp.animal}.`);
    render(); ui(); G.save();
  },
  collect(id){
    const o = S.objs.find(z=>z.id===id), bp = BPMAP[o.bp];
    if(o.ready<=0) return;
    const qty = o.ready;
    if(bp.kind==='animal'){ give(bp.good, qty); log(`Collected ${qty} × ${GOODS[bp.good].n}.`,'good'); }
    else if(bp.outKeep || o.outKeep){
      const out = o.outKeep || bp.recipes[Math.max(0,o.recipe)].out;
      Object.keys(out).forEach(k=> give(k, out[k]));
      log(`Collected a crafted batch.`,'good');
    }
    addXP(3+qty); sfx('collect');
    o.ready = 0;
    const p = tileCentre(o);
    floatNum(`+${qty}`, p.x, p.y, '#cdeeb0');
    render(); ui(); G.save();
  },
  setRecipe(id,i){
    const o = S.objs.find(z=>z.id===id);
    o.recipe = (o.recipe===i ? -1 : i); o.prog = 0;
    render(); ui();
  },

  /* ---------- money ---------- */
  sell(gid){
    const q = S.store[gid]||0; if(!q) return;
    const v = q*sellPrice(gid);
    delete S.store[gid]; earn(v, Math.round(v/22)); sfx('coin');
    toast(`Sold ${q} × ${GOODS[gid].n} for ${fmt(v)}`,'gold');
    log(`Sold ${q} × ${GOODS[gid].n} for ${fmt(v)}.`,'gold');
    ui(); G.save();
  },
  sellAll(){
    let v=0, c=0;
    Object.keys(S.store).forEach(k=>{ v += S.store[k]*sellPrice(k); c += S.store[k]; delete S.store[k]; });
    if(!v) return;
    earn(v, Math.round(v/22)); sfx('sell');
    toast(`Sold ${c} items for ${fmt(v)}`,'gold');
    log(`Sold the barn: ${c} items, ${fmt(v)}.`,'gold');
    ui(); G.save();
  },
  buyFeed(q){
    const cost = q*4;
    if(S.cash<cost) return toast('Not enough cash','bad');
    S.cash -= cost; S.feed += q; toast(`+${q} feed`,'good'); ui();
  },
  deliver(cid){
    const c = S.contracts.find(z=>z.id===cid); if(!c) return;
    if((S.store[c.gid]||0) < c.qty) return toast('Not enough in the barn','bad');
    S.store[c.gid] -= c.qty; if(S.store[c.gid]<=0) delete S.store[c.gid];
    earn(c.pay, Math.round(c.pay/12));
    c.done = true; sfx('sell');
    S.contracts = S.contracts.filter(z=>!z.done);
    toast(`Order filled — ${fmt(c.pay)}`,'gold');
    log(`Filled ${c.who}'s order for ${fmt(c.pay)}.`,'gold');
    if(S.contracts.length<3) rollContracts(1);
    ui(); G.save();
  },
  sellObj(id){
    const o = S.objs.find(z=>z.id===id); if(!o) return;
    const bp = BPMAP[o.bp];
    if(bp.kind==='home') return toast('You cannot remove the house','bad');
    const refund = Math.round(bp.cost*0.55);
    S.cash += refund; S.objs = S.objs.filter(z=>z.id!==id); sel = null; sfx('remove');
    toast(`Removed — ${fmt(refund)} back`,'');
    render(); ui(); G.save();
  },

  clean(id){ const o=S.objs.find(z=>z.id===id); if(!o) return;
    o.care=1; sfx('water'); toast('Pen mucked out','good');
    (o.herd||[]).forEach(a=>a.happy=clamp(a.happy+0.15,0,1));
    render(); ui(); G.save(); },
  vet(id){ const o=S.objs.find(z=>z.id===id); if(!o||!o.sick) return;
    if(S.cash<45) return toast('Not enough cash','bad'), sfx('error');
    S.cash-=45; o.sick=0; (o.herd||[]).forEach(a=>a.health=clamp(a.health+0.4,0,1));
    sfx('collect'); toast('The vet has been','good'); log('Vet treated the herd for $45.');
    render(); ui(); G.save(); },
  weed(id){ const o=S.objs.find(z=>z.id===id); if(!o) return;
    o.weeds=0; sfx('plant'); toast('Bed weeded','good'); render(); ui(); G.save(); },
  manure(id){ const o=S.objs.find(z=>z.id===id); if(!o) return;
    if(S.cash<30) return toast('Not enough cash','bad'), sfx('error');
    S.cash-=30; o.fert=1; sfx('plant'); toast('Soil fed','good'); render(); ui(); G.save(); },
  toggleAuto(id){ if(!S.auto) S.auto={};
    S.auto[id] = !S.auto[id]; sfx('click');
    const a=AUTOMAP[id];
    toast(`${a.n} ${S.auto[id]?'online':'offline'}`, S.auto[id]?'good':'');
    ui(); G.save(); },
  setCfg(k,v){ if(!S.autoCfg) S.autoCfg={moist:0.5,reserve:10}; S.autoCfg[k]=v; renderRight(); G.save(); },
  toggleSound(){
    const m = !SND.isMuted();
    SND.setMuted(m);
    const b=$('#sndBtn'); if(b){ b.textContent = m?'🔇':'🔊'; b.classList.toggle('on', !m); }
    if(!m) sfx('click');
    S.muted = m; G.save();
  },

  /* ---------- view ---------- */
  zoom(d){ const r=$('#world').getBoundingClientRect(); zoomAt(d, r.width/2, r.height/2); },
  fit(){ fitView(); },
  setSpeed(s){ S.speed = s; ui(); },
  mobTab(which, btn){
    $$('#mobtabs button').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
    $('#left').classList.toggle('open', which==='left');
    $('#right').classList.toggle('open', which==='right');
  },
  rt(t, btn){
    rightTab = t;
    $$('.ptab').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
    renderRight();
  },

  /* ---------- meta ---------- */
  save(loud){
    try{ localStorage.setItem('greenhollow', JSON.stringify(S)); if(loud) toast('Saved','good'); }
    catch(e){ if(loud) toast('Could not save','bad'); }
  },
  load(){
    try{
      const raw = localStorage.getItem('greenhollow');
      if(!raw) return false;
      const d = JSON.parse(raw);
      if(!d || d.v !== 5) return false;
      S = d;
      Object.keys(GOODS).forEach(k=>{ if(S.prices[k]===undefined) S.prices[k]=1; });
      if(!S.auto) S.auto={}; if(!S.autoCfg) S.autoCfg={moist:0.5,reserve:10};
      if(!S.snd) S.snd={amb:true,mus:true};
      if(typeof settingsInit==='function') settingsInit();
      if(typeof careerInit==='function') careerInit();
      if(typeof youInit==='function') youInit();
      if(S.landId && LANDMAP[S.landId] && typeof resizeLand==='function') resizeLand(LANDMAP[S.landId]);
      S.objs.forEach(o=>{ if(o.tier===undefined) o.tier=0; initCare(o);
        if(BPMAP[o.bp].kind==='animal' && !o.herd) o.herd=[]; });
      return true;
    }catch(e){ return false; }
  },
  confirmReset(){
    modal(`<h2>Start a new farm?</h2>
      <p class="sub">This clears everything you have built here.</p>
      <div class="mfoot"><button class="mbtn ghost" onclick="G.closeModal()">Keep playing</button>
      <button class="mbtn" style="background:linear-gradient(180deg,#c05540,#94402f);border-color:#e2705c" onclick="G.reset()">Start over</button></div>`);
  },
  reset(){
    localStorage.removeItem('greenhollow');
    newState(); sel=null; ghost=null; terrainCache='';
    $('#log').innerHTML = '';
    G.closeModal(); render(); fitView(); ui();
    log('A new farm at Greenhollow.','good');
    toast('New farm','good');
  },
  closeModal(){ $('#modal').classList.remove('show'); },
  openHelp(){
    const st = stat();
    modal(`<h2>How Greenhollow works</h2>
      <p class="sub">One piece of land. Build it, work it, and make it pay.</p>
      <h4>The loop</h4>
      <ul>
        <li><b>Build</b> a bed from the left panel — click it, then click the land to drop it.</li>
        <li><b>Plant</b> a seed from the Selected panel, then <b>water</b> it. Dry beds do not grow at all.</li>
        <li><b>Harvest</b> when the golden marker pulses, then <b>sell</b> in the Market tab.</li>
        <li><b>Craft</b> raw produce into jam, cheese and boxes — they are worth several times more.</li>
        <li><b>Fill orders</b> from the Orders tab. They pay well above the market price.</li>
      </ul>
      <h4>Four things that decide how rich you get</h4>
      <div class="mgrid">
        <div class="mcard"><b>💧 Water</b><small>Tanks and ponds store it, rain fills it. No water, no growth. An irrigation ring waters everything for you.</small></div>
        <div class="mcard"><b>⚡ Power</b><small>Greenhouses, pumps and workshops use it. Solar dies in a storm — a turbine does not.</small></div>
        <div class="mcard"><b>🌾 Feed</b><small>Every animal eats daily. A fodder patch grows it free. Run out and production stops.</small></div>
        <div class="mcard"><b>🌸 Charm</b><small>Flowers, trees, ponds, lights and paths. Charm multiplies every dollar visitors spend.</small></div>
      </div>
      <h4>Controls</h4>
      <ul>
        <li><kbd>R</kbd> rotate while placing · <kbd>Esc</kbd> cancel · <kbd>Del</kbd> remove selected</li>
        <li><kbd>Space</kbd> pause · <kbd>1</kbd> normal · <kbd>2</kbd> fast · <kbd>W</kbd> water every bed</li>
        <li>Drag empty land to pan · scroll to zoom · drag a building to move it</li>
      </ul>
      <div class="mfoot"><button class="mbtn" onclick="G.closeModal()">Got it — let me farm</button></div>`);
  },
};
function modal(html){ $('#modalBody').innerHTML = html; $('#modal').classList.add('show'); }
function tileCentre(o){
  const f = footprint(BPMAP[o.bp], o.rot);
  const r = $('#world').getBoundingClientRect();
  return {x: r.left + cam.x + (o.tx+f.w/2)*T*cam.z, y: r.top + cam.y + (o.ty+f.h/2)*T*cam.z};
}

/* =====================================================================
   INPUT
   ===================================================================== */
function bindInput(){
  const vp = $('#viewport'), world = $('#world');
  let dragging=null, moved=0, dragObj=null;

  world.addEventListener('mousedown', e=>{
    if(e.button!==0) return;
    const t = screenToTile(e.clientX, e.clientY);
    moved = 0;
    if(ghost){ dragging={mode:'ghost'}; return; }
    const hit = e.target.closest && e.target.closest('.ob');
    if(hit){
      const o = S.objs.find(z=>z.id===+hit.dataset.id);
      dragObj = o ? {o, sx:e.clientX, sy:e.clientY, ox:o.tx, oy:o.ty} : null;
      dragging = {mode:'obj'};
    } else {
      dragging = {mode:'pan', sx:e.clientX, sy:e.clientY, cx:cam.x, cy:cam.y};
      vp.classList.add('panning');
    }
  });

  window.addEventListener('mousemove', e=>{
    if(ghost){
      const t = screenToTile(e.clientX, e.clientY);
      const f = footprint(ghost.bp, ghost.rot);
      const tx = clamp(t.tx - Math.floor(f.w/2), FARM.x, FARM.x+FARM.w-f.w);
      const ty = clamp(t.ty - Math.floor(f.h/2), FARM.y, FARM.y+FARM.h-f.h);
      if(tx!==ghost.tx || ty!==ghost.ty){ ghost.tx=tx; ghost.ty=ty; render(); }
    }
    if(!dragging) return;
    moved += Math.abs(e.movementX)+Math.abs(e.movementY);
    if(dragging.mode==='pan'){
      cam.x = dragging.cx + (e.clientX-dragging.sx);
      cam.y = dragging.cy + (e.clientY-dragging.sy);
      applyCam();
    } else if(dragging.mode==='obj' && dragObj && moved>6){
      const t = screenToTile(e.clientX, e.clientY);
      const o = dragObj.o, f = footprint(BPMAP[o.bp], o.rot);
      const tx = clamp(t.tx - Math.floor(f.w/2), FARM.x, FARM.x+FARM.w-f.w);
      const ty = clamp(t.ty - Math.floor(f.h/2), FARM.y, FARM.y+FARM.h-f.h);
      if((tx!==o.tx||ty!==o.ty) && !overlaps(tx,ty,f,o.id)){ o.tx=tx; o.ty=ty; render(); }
    }
  });

  window.addEventListener('mouseup', e=>{
    vp.classList.remove('panning');
    if(ghost && dragging && dragging.mode==='ghost' && moved<8){ G.commit(); }
    else if(dragging && dragging.mode==='obj' && dragObj){
      if(moved<8){ sel = dragObj.o.id; rightTab='insp';
        $$('.ptab').forEach((b,i)=>b.classList.toggle('on', i===0));
        render(); ui(); }
      else { G.save(); ui(); }
    }
    else if(dragging && dragging.mode==='pan' && moved<8){ sel=null; render(); ui(); }
    dragging=null; dragObj=null;
  });

  /* touch: pan + tap */
  let tstart=null;
  world.addEventListener('touchstart', e=>{
    const t0=e.touches[0];
    tstart={x:t0.clientX,y:t0.clientY,cx:cam.x,cy:cam.y,moved:0,tg:e.target};
  }, {passive:true});
  world.addEventListener('touchmove', e=>{
    if(!tstart) return;
    const t0=e.touches[0];
    tstart.moved += Math.abs(t0.clientX-tstart.x)+Math.abs(t0.clientY-tstart.y);
    if(ghost){
      const t = screenToTile(t0.clientX, t0.clientY);
      const f = footprint(ghost.bp, ghost.rot);
      ghost.tx = clamp(t.tx-Math.floor(f.w/2), FARM.x, FARM.x+FARM.w-f.w);
      ghost.ty = clamp(t.ty-Math.floor(f.h/2), FARM.y, FARM.y+FARM.h-f.h);
      render();
    } else {
      cam.x = tstart.cx + (t0.clientX-tstart.x); cam.y = tstart.cy + (t0.clientY-tstart.y);
      applyCam();
    }
  }, {passive:true});
  world.addEventListener('touchend', e=>{
    if(!tstart) return;
    if(tstart.moved < 12){
      if(ghost) G.commit();
      else {
        const hit = tstart.tg.closest && tstart.tg.closest('.ob');
        sel = hit ? +hit.dataset.id : null;
        render(); ui();
      }
    }
    tstart=null;
  });

  world.addEventListener('wheel', e=>{
    e.preventDefault();
    const r = world.getBoundingClientRect();
    zoomAt(e.deltaY>0?-0.12:0.12, e.clientX-r.left, e.clientY-r.top);
  }, {passive:false});

  /* tooltips */
  document.addEventListener('mousemove', e=>{
    const el = e.target.closest && e.target.closest('[data-tip]');
    if(el){ if(el!==tipTarget){ tipTarget=el; showTip(el.dataset.tip, e.clientX, e.clientY); }
      else { const t=tip(); const r=t.getBoundingClientRect();
        let tx=e.clientX+16, ty=e.clientY+16;
        if(tx+r.width>innerWidth-8) tx=e.clientX-r.width-14;
        if(ty+r.height>innerHeight-8) ty=e.clientY-r.height-14;
        t.style.left=Math.max(6,tx)+'px'; t.style.top=Math.max(6,ty)+'px'; }
      return;
    }
    const ob = e.target.closest && e.target.closest('.ob');
    if(ob){
      const o = S.objs.find(z=>z.id===+ob.dataset.id);
      if(o){ if(ob!==tipTarget){ tipTarget=ob; showTip(objTip(o), e.clientX, e.clientY); }
        else showTip(objTip(o), e.clientX, e.clientY);
        return; }
    }
    if(tipTarget) hideTip();
  });
  document.addEventListener('mouseleave', hideTip);

  /* keys */
  window.addEventListener('keydown', e=>{
    if(e.target.tagName==='INPUT') return;
    const k = e.key.toLowerCase();
    if(k==='escape'){ if(ghost) G.cancel(); else { sel=null; render(); ui(); } G.closeModal(); }
    else if(k==='r'){ if(ghost) G.rotGhost(); else if(sel) G.rotate(sel); }
    else if(k==='delete'||k==='backspace'){ if(sel){ e.preventDefault(); G.sellObj(sel); } }
    else if(k===' '){ e.preventDefault(); G.setSpeed(S.speed===0?1:0); }
    else if(k==='1'){ G.setSpeed(1); }
    else if(k==='2'){ G.setSpeed(3); }
    else if(k==='w'){ G.waterAll(); }
    else if(k==='h'){ G.openHelp(); }
    else if(k==='u'){ if(sel) upgrade(sel); }
    else if(k==='m'){ G.toggleSound(); }
    else if(k==='f'){ fitView(); }
  });

  $$('.ptab').forEach(b=> b.addEventListener('click', ()=>G.rt(b.dataset.rt, b)));
  $('#modal').addEventListener('click', e=>{ if(e.target.id==='modal') G.closeModal(); });
  window.addEventListener('resize', ()=>{ applyCam(); });
}

/* =====================================================================
   LOOP
   ===================================================================== */
function loop(t){
  rafId = requestAnimationFrame(loop);
  if(!lastT) lastT = t;
  const dt = Math.min(250, t-lastT); lastT = t;
  if(S.speed>0){
    if(S.settings && S.settings.dayLen) DAY_MS = S.settings.dayLen*1000;
    acc += dt*S.speed;
    if(acc >= DAY_MS){ acc -= DAY_MS; advanceDay(); }
  }
  const badge = $('#wbadge');
  if(badge && !badge.dataset.h){ }
  /* day progress on the badge border */
  const pct = Math.round(acc/DAY_MS*100);
  badge.style.background = `linear-gradient(90deg, rgba(124,194,79,.28) ${pct}%, rgba(10,16,8,.86) ${pct}%)`;
}

/* animals move on their own light timer, independent of the day clock */
let lifeLast = 0;
setInterval(()=>{
  const now = performance.now();
  const dt = Math.min(0.4, (now - (lifeLast||now))/1000);
  lifeLast = now;
  if(typeof tickLife==='function') tickLife(dt);
}, 120);

let uiTick = 0;
setInterval(()=>{ if(S && S.speed>0){ uiTick++; if(uiTick%3===0){ renderStats(); $('#wbadge').innerHTML = hint(); } } }, 1000);
setInterval(()=>{ if(S && (typeof SET!=='function' || SET('autoSave'))) G.save(); }, 20000);
/* edge panning, off by default */
(function edgePan(){
  let mx=0,my=0,inWorld=false;
  const w=document.getElementById('world');
  if(!w) return;
  w.addEventListener('mousemove',e=>{ const r=w.getBoundingClientRect();
    mx=e.clientX-r.left; my=e.clientY-r.top; inWorld=true; });
  w.addEventListener('mouseleave',()=>inWorld=false);
  setInterval(()=>{
    if(!inWorld || typeof SET!=='function' || !SET('edgePan') || ghost) return;
    const r=w.getBoundingClientRect(), m=48, sp=9;
    let dx=0,dy=0;
    if(mx<m) dx=sp; else if(mx>r.width-m) dx=-sp;
    if(my<m) dy=sp; else if(my>r.height-m) dy=-sp;
    if(dx||dy){ cam.x+=dx; cam.y+=dy; applyCam(); }
  }, 30);
})();

/* =====================================================================
   BOOT
   ===================================================================== */
(function boot(){
  const st = document.createElement('style'); st.textContent = SVGCSS; document.head.appendChild(st);
  const fresh = !G.load();
  if(fresh) newState();
  bindInput();
  ['pointerdown','keydown','touchstart'].forEach(ev=>
    window.addEventListener(ev, ()=>{
      SND.setMuted(!!S.muted);      // set BEFORE unlocking so a muted farm stays silent
      SND.unlock();
      const b=$('#sndBtn'); if(b){ b.textContent = S.muted?'🔇':'🔊'; b.classList.toggle('on', !S.muted); }
    }, {once:true}));
  render(); fitView(); ui();
  S.log.length ? (function(){ const el=$('#log');
    el.innerHTML = S.log.map(l=>`<div class="lg ${l.c}"><time>D${l.d}</time><span>${l.m}</span></div>`).join(''); })()
    : log('Welcome to Greenhollow.','good');
  if(fresh) setTimeout(()=>{ if(typeof landChooser==='function') modal(landChooser()); else G.openHelp(); }, 400);
  rafId = requestAnimationFrame(loop);
})();
