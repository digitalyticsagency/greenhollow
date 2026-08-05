/* =====================================================================
   UI — panels, tooltips, input, loop
   ===================================================================== */
let curCat = 'grow', rightTab = 'insp';

/* ---------------- toast / float / log ---------------- */
function toast(msg, cls){
  const d = document.createElement('div');
  d.className = 'toast '+(cls||'');
  d.textContent = msg;
  $('#toasts').appendChild(d);
  setTimeout(()=>{ d.style.transition='opacity .4s'; d.style.opacity=0; setTimeout(()=>d.remove(),400); }, 2400);
}
function floatNum(txt, x, y, col){
  const d = document.createElement('div');
  d.className = 'floatnum'; d.textContent = txt;
  d.style.left = x+'px'; d.style.top = y+'px'; d.style.color = col||'#7cc24f';
  document.body.appendChild(d);
  setTimeout(()=>d.remove(), 1200);
}
function log(msg, cls){
  S.log.unshift({d:S.day, m:msg, c:cls||''});
  if(S.log.length>60) S.log.pop();
  const el = $('#log');
  if(el) el.innerHTML = S.log.map(l=>`<div class="lg ${l.c}"><time>D${l.d}</time><span>${l.m}</span></div>`).join('');
}

/* ---------------- tooltips ---------------- */
const tip = () => $('#tip');
let tipTarget = null;
function showTip(html, x, y){
  const t = tip();
  t.innerHTML = html; t.classList.add('show');
  const r = t.getBoundingClientRect();
  let tx = x+16, ty = y+16;
  if(tx + r.width > innerWidth-8) tx = x - r.width - 14;
  if(ty + r.height > innerHeight-8) ty = y - r.height - 14;
  t.style.left = Math.max(6,tx)+'px'; t.style.top = Math.max(6,ty)+'px';
}
function hideTip(){ tip().classList.remove('show'); tipTarget=null; }

function objTip(o){
  const bp = BPMAP[o.bp], st = stat();
  let h = `<b>${bp.name}</b><span class="tg">${bp.desc}</span><hr>`;
  if(bp.kind==='plot'){
    if(o.crop){
      const cr = CROPS[o.crop];
      const pct = Math.round(o.stage*100);
      h += `<div class="tl"><span>Crop</span><b>${cr.name}</b></div>`;
      h += `<div class="tl"><span>Growth</span><b>${pct}%</b></div>`;
      h += `<div class="tl"><span>Soil moisture</span><b class="${o.water<0.2?'warn':''}">${Math.round(o.water*100)}%</b></div>`;
      h += `<div class="tl"><span>Harvest value</span><span class="tk">${fmt(cr.yield*(bp.slots||1)*sellPrice(o.crop))}</span></div>`;
      if(o.pest) h += `<div class="warn">Pest damage — growth cut by half.</div>`;
      if(!bp.shelter && !cr.seasons.includes(S.season)) h += `<div class="warn">Out of season here — growing at half speed.</div>`;
    } else h += `<div class="tg">Empty. Select it and choose a seed.</div>`;
  } else if(bp.kind==='perennial'){
    h += `<div class="tl"><span>Ripeness</span><b>${Math.round(o.stage*100)}%</b></div>`;
    h += `<div class="tl"><span>Yields</span><b>${bp.qty} ${GOODS[bp.good].n}</b></div>`;
  } else if(bp.kind==='animal'){
    h += `<div class="tl"><span>${bp.animal}s</span><b>${o.animals}/${bp.cap}</b></div>`;
    h += `<div class="tl"><span>Waiting</span><b>${o.ready} ${GOODS[bp.good].n}</b></div>`;
    h += `<div class="tl"><span>Eats</span><b>${(bp.feed*o.animals).toFixed(1)} feed/day</b></div>`;
    if(o.hungry) h += `<div class="warn">Hungry — no feed left, production stopped.</div>`;
  } else if(bp.kind==='process'){
    h += o.recipe>=0
      ? `<div class="tl"><span>Batch</span><b>${Math.round(o.prog*100)}%</b></div>`
      : `<div class="tg">No recipe set.</div>`;
    if(o.ready) h += `<div class="tl"><span>Ready</span><b>${o.ready} crafted</b></div>`;
  } else if(bp.kind==='water'){
    h += `<div class="tl"><span>Capacity</span><b>${bp.cap} L</b></div>`;
    if(bp.gain) h += `<div class="tl"><span>Refills</span><b>+${bp.gain} L/day</b></div>`;
  } else if(bp.kind==='power'){
    h += `<div class="tl"><span>Output</span><b>${bp.power} kW</b></div>`;
  } else if(bp.kind==='tourism'){
    h += `<div class="tl"><span>Base income</span><span class="tk">${fmt(bp.income)}/day</span></div>`;
    h += `<div class="tl"><span>With your charm</span><span class="tk">${fmt(bp.income*charmMul()*st.tourmul)}/day</span></div>`;
  } else if(bp.kind==='shop'){
    h += `<div class="tl"><span>Sells</span><b>~${(bp.rate*(1+Math.min(1.6,st.charm/110))).toFixed(1)} items/day</b></div>`;
  }
  if(bp.charm) h += `<div class="tl"><span>Charm</span><b>+${bp.charm}</b></div>`;
  h += `<hr><span class="tg">Click to select · drag to move</span>`;
  return h;
}

/* ---------------- top stats ---------------- */
function renderStats(){
  const st = stat(), se = SEASONS[S.season], we = WEATHERS[S.weather];
  const wcap = Math.max(1, st.waterCap);
  const items = [
    {ic:coin(), v:fmt(S.cash), s:'', tip:`<b>Cash</b>Everything you own is bought with this.<hr><div class="tl"><span>Earned all-time</span><span class="tk">${fmt(S.totalEarned)}</span></div>`},
    {ic:`<svg class="ic" viewBox="0 0 16 16"><path d="M8 1l2 4 4 .6-3 2.9.7 4.1L8 10.7 4.3 12.6 5 8.5 2 5.6 6 5z" fill="#7cc24f"/></svg>`,
      v:'Lv '+S.lvl, s:`<div class="xpwrap"><i style="transform:scaleX(${(S.xp/xpFor(S.lvl)).toFixed(3)})"></i></div>`,
      tip:`<b>Level ${S.lvl}</b>${S.xp} / ${xpFor(S.lvl)} XP<hr><span class="tg">Harvesting, collecting and crafting all give XP. New levels unlock new buildings.</span>`},
    {ic:`<svg class="ic" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="none" stroke="#a7b79a" stroke-width="1.6"/><path d="M8 4v4.4l3 1.8" stroke="#a7b79a" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`,
      v:'Day '+S.day, s:`<small>${se.n}</small>`,
      tip:`<b>Day ${S.day} · ${se.n}</b>A farm day passes every 45 seconds at normal speed.<hr><div class="tl"><span>Growth this season</span><b>×${se.growth.toFixed(2)}</b></div><div class="tl"><span>Visitors</span><b>×${se.tour.toFixed(2)}</b></div>`},
    {ic:`<span style="font-size:14px">${we.ic}</span>`, v:we.n, s:'',
      tip:`<b>${we.n}</b><div class="tl"><span>Crop growth</span><b>×${we.growth.toFixed(2)}</b></div><div class="tl"><span>Solar output</span><b>×${we.power.toFixed(2)}</b></div><div class="tl"><span>Rain</span><b>${we.rain?'+'+we.rain+' L':'none'}</b></div><div class="tl"><span>Visitors</span><b>×${we.tour.toFixed(2)}</b></div>`},
    {ic:`<svg class="ic" viewBox="0 0 16 16"><path d="M8 1.5S3 7 3 10a5 5 0 0010 0c0-3-5-8.5-5-8.5z" fill="#6fb6d8"/></svg>`,
      v:Math.round(S.water)+'', s:`<small>/${wcap}L</small>`, warn:S.water<12,
      tip:`<b>Water</b>Beds drink this when you water them.<hr><div class="tl"><span>Storage</span><b>${Math.round(S.water)} / ${wcap} L</b></div><div class="tl"><span>Refill per day</span><b>+${st.waterGain} L</b></div>${st.waterCap<50?'<div class="warn">Build rain tanks to store more.</div>':''}`},
    {ic:`<svg class="ic" viewBox="0 0 16 16"><path d="M9 1L3 9h4l-1 6 6-8H8z" fill="#f0c14b"/></svg>`,
      v:st.power+'', s:`<small>/${st.use}kW</small>`, warn:st.short,
      tip:`<b>Power</b><div class="tl"><span>Generating</span><b>${st.power} kW</b></div><div class="tl"><span>Using</span><b>${st.use} kW</b></div><hr>${st.short?'<span class="warn">Short of power — greenhouses and workshops run at 40%.</span>':'<span class="tg">Comfortable. Weather changes solar output a lot.</span>'}`},
    {ic:`<svg class="ic" viewBox="0 0 16 16"><path d="M2 12c3-1 4-4 4-7 2 1 3 3 3 5 1-1 2-3 2-5 2 2 3 5 3 7z" fill="#c9c26a"/></svg>`,
      v:Math.round(S.feed)+'', s:'<small>feed</small>', warn:S.feed<4,
      tip:`<b>Animal feed</b>Every animal eats every day.<hr><div class="tl"><span>Growing</span><b>+${st.feedGain}/day</b></div><div class="tl"><span>Eaten</span><b>${S.objs.reduce((a,o)=>a+(BPMAP[o.bp].feed||0)*(o.animals||0),0).toFixed(1)}/day</b></div>${S.feed<4?'<div class="warn">Nearly out — build a fodder patch or buy feed.</div>':''}`},
    {ic:`<svg class="ic" viewBox="0 0 16 16"><path d="M8 2c1 3 3 3 3 6a3 3 0 01-6 0c0-3 2-3 3-6z" fill="#dd6f9c"/></svg>`,
      v:st.charm+'', s:'<small>charm</small>',
      tip:`<b>Charm</b>How lovely the farm looks. Drives every visitor dollar.<hr><div class="tl"><span>Tourism multiplier</span><b>×${charmMul().toFixed(2)}</b></div><div class="tl"><span>Stand speed</span><b>×${(1+Math.min(1.6,st.charm/110)).toFixed(2)}</b></div><hr><span class="tg">Flowers, trees, ponds, lights and paths all add charm.</span>`},
  ];
  $('#stats').innerHTML = items.map(i=>
    `<div class="stat${i.warn?' warn':''}" data-tip="${esc(i.tip)}">${i.ic}<b>${i.v}</b>${i.s||''}</div>`).join('');
}
function coin(){ return `<svg class="ic" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.6" fill="#f0c14b"/><circle cx="8" cy="8" r="4.6" fill="#d9a72e"/><path d="M8 4.6v6.8M6.2 6.2h3.2a1.4 1.4 0 010 2.8H6.6a1.4 1.4 0 000 2.8h3.2" stroke="#8a6410" stroke-width="1" fill="none"/></svg>`; }
function esc(s){ return String(s).replace(/"/g,'&quot;'); }

/* ---------------- build panel ---------------- */
function renderBuild(){
  $('#cats').innerHTML = CATS.map(c=>
    `<button class="cat${curCat===c.id?' on':''}" onclick="G.cat('${c.id}')" data-tip="${esc('<b>'+c.n+'</b>'+c.tip)}">${c.n}</button>`).join('');
  const list = BP.filter(b=>b.cat===curCat && b.id!=='cabin');
  $('#buildList').innerHTML = list.map(b=>{
    const locked = S.lvl < b.lvl, poor = S.cash < b.cost;
    const tipHtml = `<b>${b.name}</b><span class="tg">${b.desc}</span><hr>`+
      `<div class="tl"><span>Cost</span><span class="tk">${fmt(b.cost)}</span></div>`+
      `<div class="tl"><span>Footprint</span><b>${b.w}×${b.h} tiles</b></div>`+
      (b.charm?`<div class="tl"><span>Charm</span><b>+${b.charm}</b></div>`:'')+
      (b.power?`<div class="tl"><span>Power</span><b>${b.power>0?'+':''}${b.power} kW</b></div>`:'')+
      (locked?`<hr><span class="warn">Unlocks at level ${b.lvl}</span>`:
        poor?`<hr><span class="warn">You need ${fmt(b.cost-S.cash)} more</span>`:
        `<hr><span class="tg">${b.tip}</span>`);
    return `<div class="bitem${locked?' locked':''}${poor&&!locked?' poor':''}${ghost&&ghost.bp.id===b.id?' sel':''}"
      ${locked?'':`onclick="G.pick('${b.id}')"`} data-tip="${esc(tipHtml)}">
      <span class="bth">${thumb(b)}</span>
      <span class="bmeta"><b>${b.name}</b><span class="sub">${b.w}×${b.h} · ${kindLabel(b)}</span></span>
      ${locked?`<span class="lockb">Lv ${b.lvl}</span>`:`<span class="cost">${fmt(b.cost)}</span>`}
    </div>`;
  }).join('') || '<div class="empty">Nothing here yet.</div>';
}
function kindLabel(b){
  return {plot:'plantable', perennial:'auto-yield', animal:'livestock', process:'crafting',
    shop:'sells stock', tourism:'visitor income', water:'water', power:'power',
    feed:'animal feed', bonus:'farm upgrade', decor:'decoration', home:'home'}[b.kind] || b.kind;
}
function thumb(b){
  const fn = ART[b.art] || ART.shed;
  const w = b.w*T, h = b.h*T;
  const sc = Math.min(44/w, 34/h, 1.5);
  return `<svg viewBox="0 0 ${w} ${h}" width="${n(w*sc)}" height="${n(h*sc)}">${DEFS()}${fn(w,h,null)}</svg>`;
}

/* ---------------- right panel ---------------- */
function renderRight(){
  const b = $('#rightBody');
  if(rightTab==='market') return void(b.innerHTML = marketHTML());
  if(rightTab==='jobs')   return void(b.innerHTML = jobsHTML());
  if(rightTab==='auto')   return void(b.innerHTML = autoHTML());
  b.innerHTML = inspHTML();
}

function inspHTML(){
  const o = S.objs.find(z=>z.id===sel);
  if(!o) return `<div class="empty">
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#7cc24f" stroke-width="1.4">
      <path d="M3 20h18M6 20V10l6-5 6 5v10"/><path d="M10 20v-5h4v5"/></svg>
    <div><b>Nothing selected</b></div>
    <div style="margin-top:6px">Click anything on your land to see how it is doing and what you can do with it.</div>
    <div style="margin-top:10px;color:var(--green)">Or pick something from Build on the left.</div></div>`;
  const bp = BPMAP[o.bp], st = stat();
  let h = `<div class="insp">
    <div class="title"><span class="th">${thumb(bp)}</span>
      <div><h3>${bp.name}</h3><div class="tsub">
        <span class="tierbadge" style="color:${TIERS[tOf(o)].col};border-color:${TIERS[tOf(o)].col}">${TIERS[tOf(o)].n}</span>
        ${kindLabel(bp)} · ${bp.w}×${bp.h}</div></div></div>
    <p class="desc">${bp.desc}</p><div class="rows">`;

  /* --- state rows --- */
  if(bp.kind==='plot'){
    if(o.crop){
      const cr = CROPS[o.crop];
      h += row('Crop', cr.name);
      h += `<div class="row" style="display:block"><div style="display:flex;justify-content:space-between"><span>Growth</span><b>${Math.round(o.stage*100)}%</b></div>
        <div class="bar"><i style="transform:scaleX(${(o.stage).toFixed(3)});background:linear-gradient(90deg,#4d8f3c,#7cc24f)"></i></div></div>`;
      h += `<div class="row" style="display:block"><div style="display:flex;justify-content:space-between"><span>Soil moisture</span><b>${Math.round(o.water*100)}%</b></div>
        <div class="bar"><i style="transform:scaleX(${(o.water).toFixed(3)});background:${o.water<0.2?'#e2705c':'linear-gradient(90deg,#3f7f9c,#6fb6d8)'}"></i></div></div>`;
      h += row('Harvest', `${cr.yield*(bp.slots||1)} × ${cr.name}`);
      h += row('Worth today', fmt(cr.yield*(bp.slots||1)*sellPrice(o.crop)));
      if(o.pest) h += `<div class="row" style="color:#f0a898"><span>Pests</span><b>growth halved</b></div>`;
      if(!bp.shelter && !cr.seasons.includes(S.season))
        h += `<div class="row" style="color:#f0a898"><span>Season</span><b>wrong — half speed</b></div>`;
    } else h += `<div class="row"><span>Status</span><b>Empty bed</b></div>`;
    h += meter('Soil fertility', o.fert===undefined?1:o.fert, (o.fert||1)<0.4?'#e2705c':'linear-gradient(90deg,#6b5238,#c9a06a)');
    if(o.crop) h += meter('Weeds', o.weeds||0, (o.weeds||0)>0.5?'#e2705c':'#8a9a5a');
    h += row('Yield modifier', Math.round(cropMul(o)*100)+'%');
    if(o.last) h += row('Last crop', CROPS[o.last]?CROPS[o.last].name:'—');
  }
  if(bp.kind==='perennial'){
    h += `<div class="row" style="display:block"><div style="display:flex;justify-content:space-between"><span>Ripeness</span><b>${Math.round(o.stage*100)}%</b></div>
      <div class="bar"><i style="transform:scaleX(${(o.stage).toFixed(3)});background:linear-gradient(90deg,#a1503f,#e2603a)"></i></div></div>`;
    h += row('Each pick', `${bp.qty} × ${GOODS[bp.good].n}`);
    h += row('Worth today', fmt(bp.qty*sellPrice(bp.good)));
  }
  if(bp.kind==='animal'){
    h += row(bp.animal+'s', `${o.animals} / ${E.cap(o)}`);
    if(bp.animal!=='hive'){
      h += meter('Herd health', herdHealth(o), herdHealth(o)<0.45?'#e2705c':'linear-gradient(90deg,#4d8f3c,#7cc24f)');
      h += meter('Contentment', herdHappy(o), 'linear-gradient(90deg,#a98fd6,#d0b8f0)');
      h += meter('Pen cleanliness', o.care===undefined?1:o.care, (o.care||1)<0.4?'#e2705c':'linear-gradient(90deg,#8a6a4a,#c9a06a)');
      h += row('Output', Math.round(yieldMul(o)*100)+'% of normal');
      if(o.sick) h += `<div class="row" style="color:#f0a898"><span>Illness</span><b>halving output</b></div>`;
    }
    h += row('Waiting to collect', `${o.ready} ${GOODS[bp.good].n}`);
    h += row('Eats per day', (bp.feed*o.animals).toFixed(1)+' feed');
    if(o.hungry) h += `<div class="row" style="color:#f0a898"><span>Hungry</span><b>not producing</b></div>`;
  }
  if(bp.kind==='process'){
    if(o.recipe>=0){
      const rc = bp.recipes[o.recipe];
      h += row('Making', Object.keys(rc.out).map(k=>rc.out[k]+' '+GOODS[k].n).join(', '));
      h += `<div class="row" style="display:block"><div style="display:flex;justify-content:space-between"><span>Batch</span><b>${Math.round(o.prog*100)}%</b></div>
        <div class="bar"><i style="transform:scaleX(${(o.prog).toFixed(3)});background:linear-gradient(90deg,#a98fd6,#d0b8f0)"></i></div></div>`;
    }
    if(o.ready) h += row('Ready', o.ready+' crafted');
  }
  if(bp.kind==='water'){ h += row('Capacity', bp.cap+' L'); if(bp.gain) h += row('Refill', '+'+bp.gain+' L/day'); }
  if(bp.kind==='power'){ h += row('Output now', Math.round(bp.power*WEATHERS[S.weather].power)+' kW'); }
  if(bp.kind==='tourism'){
    h += row('Base', fmt(bp.income)+'/day');
    h += row('You earn', fmt(bp.income*charmMul()*st.tourmul)+'/day');
  }
  if(bp.kind==='shop'){ h += row('Sells', (bp.rate*(1+Math.min(1.6,st.charm/110))).toFixed(1)+' items/day'); }
  if(bp.charm) h += row('Charm', '+'+bp.charm);
  h += `</div>`;

  /* --- actions --- */
  h += `<div class="acts">`;
  if(bp.kind==='plot'){
    if(!o.crop){
      h += `</div><div class="ph" style="margin:4px -11px 8px;padding-left:0">Choose a seed</div><div class="seeds">`;
      Object.keys(CROPS).forEach(k=>{
        const cr = CROPS[k];
        const cost = Math.round(cr.seed*(bp.slots||1)*(1-stat().seedoff));
        const inSeason = cr.seasons.includes(S.season) || bp.shelter;
        const days = (cr.days/((bp.speed||1))).toFixed(1);
        const worth = cr.yield*(bp.slots||1)*sellPrice(k);
        h += `<button class="seed" ${S.cash<cost?'disabled':''} onclick="G.plant(${o.id},'${k}')"
          data-tip="${esc(`<b>${cr.name}</b><div class="tl"><span>Seed cost</span><span class="tk">${fmt(cost)}</span></div><div class="tl"><span>Ready in</span><b>~${days} days</b></div><div class="tl"><span>Harvest worth</span><span class="tk">${fmt(worth)}</span></div><div class="tl"><span>Profit</span><span class="tk">${fmt(worth-cost)}</span></div>${inSeason?'':'<hr><span class="warn">Out of season — grows at half speed outdoors.</span>'}`)}">
          <b>${cr.name} ${inSeason?'':'<span style="color:#e2705c">✱</span>'}</b>
          <small>${fmt(cost)} → ${fmt(worth)} · ${days}d</small></button>`;
      });
      h += `</div><div class="acts" style="margin-top:8px">`;
    } else {
      const ready = o.stage>=1;
      h += `<button class="act primary full" ${ready?'':'disabled'} onclick="G.harvest(${o.id})"
        data-tip="${esc(ready?`<b>Harvest</b>Adds ${CROPS[o.crop].yield*(bp.slots||1)} ${CROPS[o.crop].name} to your barn and gives XP.`:'<b>Not ready</b>Keep it watered and wait.')}">
        ${ready?'Harvest now':'Growing — '+Math.round(o.stage*100)+'%'}</button>`;
      h += `<button class="act" onclick="G.water(${o.id})" ${o.water>0.9||S.water<8?'disabled':''}
        data-tip="${esc('<b>Water this bed</b>Uses 8 L from storage. Dry beds stop growing completely.')}">Water (8L)</button>`;
      if(o.pest) h += `<button class="act" onclick="G.treat(${o.id})" ${S.cash<18?'disabled':''}
        data-tip="${esc('<b>Treat pests</b>$18. Removes the pest and restores full growth speed.')}">Treat pests $18</button>`;
      else h += `<button class="act" onclick="G.clearCrop(${o.id})" data-tip="${esc('<b>Pull the crop</b>Frees the bed immediately. You lose what is growing.')}">Clear bed</button>`;
      if((o.weeds||0) > 0.1) h += `<button class="act" onclick="G.weed(${o.id})"
        data-tip="${esc('<b>Weed the bed</b>Free. Weeds choke growth and cut your harvest.')}">Pull weeds</button>`;
    }
    if(o.crop || !o.crop){
      h += `<button class="act" ${S.cash<30||(o.fert||1)>0.95?'disabled':''} onclick="G.manure(${o.id})"
        data-tip="${esc('<b>Spread compost</b>$30. Restores soil fertility, which sets how big your harvest is.')}">Compost $30</button>`;
    }
  }
  if(bp.kind==='perennial'){
    const ready = o.stage>=1;
    h += `<button class="act primary full" ${ready?'':'disabled'} onclick="G.pick(${o.id},1)"
      data-tip="${esc(ready?`<b>Pick</b>${bp.qty} × ${GOODS[bp.good].n} into the barn.`:'<b>Still ripening</b>It regrows on its own — nothing to do.')}"
      >${ready?'Pick '+GOODS[bp.good].n:'Ripening — '+Math.round(o.stage*100)+'%'}</button>`;
  }
  if(bp.kind==='animal'){
    const cost = bp.buy;
    h += `<button class="act primary" ${o.animals>=bp.cap||S.cash<cost?'disabled':''} onclick="G.buyAnimal(${o.id})"
      data-tip="${esc(`<b>Buy a ${bp.animal}</b><div class="tl"><span>Cost</span><span class="tk">${fmt(cost)}</span></div><div class="tl"><span>Produces</span><b>${bp.per} ${GOODS[bp.good].n} every ${bp.cycle}d</b></div><div class="tl"><span>Pays back in</span><b>~${Math.ceil(cost/(bp.per*GOODS[bp.good].p/bp.cycle))} days</b></div>`)}">
      Buy ${bp.animal} ${fmt(cost)}</button>`;
    h += `<button class="act" ${o.ready<=0?'disabled':''} onclick="G.collect(${o.id})"
      data-tip="${esc('<b>Collect</b>Moves what they have produced into your barn.')}">Collect ${o.ready||''}</button>`;
    if(bp.animal!=='hive'){
      h += `<button class="act" ${(o.care||1)>0.92?'disabled':''} onclick="G.clean(${o.id})"
        data-tip="${esc('<b>Muck out the pen</b>Free. Dirty bedding drives illness, drops contentment and stops breeding.')}">Clean pen</button>`;
      h += `<button class="act" ${o.sick?'':'disabled'} onclick="G.vet(${o.id})"
        data-tip="${esc('<b>Call the vet</b>$45. Clears the illness and restores herd health.')}">Vet $45</button>`;
    }
  }
  if(bp.kind==='process'){
    h += `</div><div class="ph" style="margin:4px -11px 8px;padding-left:0">Recipes</div><div class="acts">`;
    bp.recipes.forEach((rc,i)=>{
      const inTxt = Object.keys(rc.in).map(k=>rc.in[k]+' '+GOODS[k].n).join(' + ');
      const outTxt = Object.keys(rc.out).map(k=>rc.out[k]+' '+GOODS[k].n).join(' + ');
      const inVal = Object.keys(rc.in).reduce((a,k)=>a+rc.in[k]*sellPrice(k),0);
      const outVal = Object.keys(rc.out).reduce((a,k)=>a+rc.out[k]*sellPrice(k),0);
      const have = canCraft(rc);
      h += `<button class="act full${o.recipe===i?' primary':''}" onclick="G.setRecipe(${o.id},${i})"
        data-tip="${esc(`<b>${outTxt}</b><div class="tl"><span>Needs</span><b>${inTxt}</b></div><div class="tl"><span>Takes</span><b>${rc.days} day${rc.days>1?'s':''}</b></div><div class="tl"><span>Input worth</span><span class="tk">${fmt(inVal)}</span></div><div class="tl"><span>Output worth</span><span class="tk">${fmt(outVal)}</span></div><div class="tl"><span>Gain</span><span class="tk">+${fmt(outVal-inVal)}</span></div>${have?'':'<hr><span class="warn">You do not have the ingredients yet.</span>'}`)}"
        style="text-align:left;${have?'':'opacity:.6'}">${inTxt} → <b>${outTxt}</b></button>`;
    });
    h += `<button class="act primary full" ${o.ready<=0?'disabled':''} onclick="G.collect(${o.id})">Collect batch ${o.ready||''}</button>`;
  }

  if(canUpgrade(o)){
    const nt = tOf(o)+1, c = upCost(o);
    h += `<button class="act primary full" ${S.cash<c?'disabled':''} onclick="upgrade(${o.id})"
      data-tip="${esc(`<b>Upgrade to ${TIERS[nt].n}</b>${upgradeBlurb(o)}<hr><div class="tl"><span>Cost</span><span class="tk">${fmt(c)}</span></div><div class="tl"><span>Look</span><b>visibly rebuilt</b></div>`)}">
      ⬆ Upgrade to ${TIERS[nt].n} — ${fmt(c)}</button>`;
  } else if(BPMAP[o.bp].kind!=='home'){
    h += `<div class="row" style="justify-content:center;color:var(--gold)"><b>Fully upgraded — Mk IV</b></div>`;
  }
  h += `<button class="act" onclick="G.rotate(${o.id})" data-tip="${esc('<b>Rotate 90°</b>Turns the building. Shortcut: press <kbd>R</kbd>.')}">↻ Rotate</button>`;
  h += `<button class="act" onclick="G.startMove(${o.id})" data-tip="${esc('<b>Move</b>Pick it up and drop it somewhere else. Free.')}">✥ Move</button>`;
  if(bp.kind!=='home'){
    const refund = Math.round(bp.cost*0.55);
    h += `<button class="act danger full" onclick="G.sellObj(${o.id})"
      data-tip="${esc(`<b>Remove</b>Refunds ${fmt(refund)} — 55% of what you paid.`)}">Remove (+${fmt(refund)})</button>`;
  }
  h += `</div></div>`;
  return h;
}
function row(k,v){ return `<div class="row"><span>${k}</span><b>${v}</b></div>`; }

function marketHTML(){
  const keys = Object.keys(S.store).filter(k=>S.store[k]>0)
    .sort((a,b)=> sellPrice(b)*S.store[b] - sellPrice(a)*S.store[a]);
  const total = keys.reduce((a,k)=>a+S.store[k]*sellPrice(k),0);
  let h = `<div style="padding:9px 10px;display:flex;gap:6px;align-items:center;border-bottom:1px solid var(--line)">
    <div style="flex:1"><div style="font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:.07em">Barn value</div>
    <div style="font-size:17px;font-weight:800;color:var(--gold)">${fmt(total)}</div></div>
    <button class="act primary" style="flex:0 0 auto;padding:8px 14px" ${keys.length?'':'disabled'} onclick="G.sellAll()"
      data-tip="${esc('<b>Sell everything</b>Empties the barn at current prices. Keep stock back if you have orders to fill.')}">Sell all</button></div>`;
  if(!keys.length) h += `<div class="empty">Your barn is empty.<div style="margin-top:6px">Harvest a bed or collect from your animals.</div></div>`;
  keys.forEach(k=>{
    const g = GOODS[k], p = sellPrice(k), tr = S.prices[k];
    const arrow = tr>1.08?'<span class="trend up">▲</span>':tr<0.94?'<span class="trend down">▼</span>':'<span class="trend"></span>';
    h += `<div class="mrow" data-tip="${esc(`<b>${g.n}</b><div class="tl"><span>You have</span><b>${S.store[k]}</b></div><div class="tl"><span>Price today</span><span class="tk">${fmt(p)}</span></div><div class="tl"><span>Market</span><b>${Math.round((tr-1)*100)}% vs normal</b></div><hr><span class="tg">Prices drift daily. Hold stock when it is low, sell into a spike.</span>`)}">
      <svg class="gi" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="${g.c}"/><circle cx="6" cy="6" r="2" fill="#fff" opacity=".3"/></svg>
      <span class="nm">${g.n}</span>${arrow}<span class="qt">${S.store[k]}</span><span class="pr">${fmt(p)}</span>
      <button class="sellb" onclick="G.sell('${k}')">Sell</button></div>`;
  });
  h += `<div class="ph" style="margin-top:6px">Supplies</div>
    <div class="mrow"><svg class="gi" viewBox="0 0 16 16"><path d="M2 12c3-1 4-4 4-7 2 1 3 3 3 5 1-1 2-3 2-5 2 2 3 5 3 7z" fill="#c9c26a"/></svg>
      <span class="nm">Animal feed</span><span class="qt">${Math.round(S.feed)}</span>
      <button class="sellb" onclick="G.buyFeed(10)" ${S.cash<40?'disabled':''}
        data-tip="${esc('<b>Buy 10 feed — $40</b>A fodder patch grows this for free. Buying is the emergency option.')}">+10 $40</button></div>`;
  return h;
}

function jobsHTML(){
  if(!S.contracts.length) return `<div class="empty">No orders right now.<div style="margin-top:6px">New ones arrive most days.</div></div>`;
  return S.contracts.map(c=>{
    const have = S.store[c.gid]||0;
    const ok = have >= c.qty;
    const pct = Math.min(100, Math.round(have/c.qty*100));
    return `<div class="ctr${ok?' done':''}" data-tip="${esc(`<b>${c.who}</b>Wants ${c.qty} × ${GOODS[c.gid].n} within ${c.left} days.<hr><div class="tl"><span>Pays</span><span class="tk">${fmt(c.pay)}</span></div><div class="tl"><span>Market value</span><b>${fmt(c.qty*sellPrice(c.gid))}</b></div><div class="tl"><span>Bonus over market</span><span class="tk">+${fmt(Math.max(0,c.pay-c.qty*sellPrice(c.gid)))}</span></div>`)}">
      <div class="ch"><span class="cn">${c.who}</span><span class="cr">${fmt(c.pay)}</span></div>
      <div class="cd">${c.qty} × ${GOODS[c.gid].n} · ${c.left} day${c.left>1?'s':''} left</div>
      <div class="cf"><div class="bar"><i style="transform:scaleX(${(pct/100).toFixed(3)});background:${ok?'#7cc24f':'#e8a33d'}"></i></div>
        <span style="font-size:10px;color:var(--ink3)">${have}/${c.qty}</span>
        <button class="sellb" ${ok?'':'disabled'} onclick="G.deliver('${c.id}')">Deliver</button></div></div>`;
  }).join('');
}

/* ---------------- world badge / hints ---------------- */
function hint(){
  const st = stat();
  const empty = S.objs.filter(o=>BPMAP[o.bp].kind==='plot' && !o.crop).length;
  const ready = S.objs.filter(o=>{ const b=BPMAP[o.bp];
    return (b.kind==='plot'||b.kind==='perennial') && o.stage>=1; }).length;
  const coll  = S.objs.filter(o=>o.ready>0).length;
  const dry   = S.objs.filter(o=>BPMAP[o.bp].kind==='plot'&&o.crop&&o.water<0.25).length;
  if(ghost) return `Placing <b>${ghost.bp.name}</b> <kbd>R</kbd> rotate <kbd>Esc</kbd> cancel`;
  if(dry)   return `<span style="color:#f0a898">${dry} bed${dry>1?'s are':' is'} dry</span> — select and water`;
  if(ready) return `<span style="color:#cdeeb0">${ready} ready to harvest</span> — click the glowing markers`;
  if(coll)  return `<span style="color:#cdeeb0">${coll} building${coll>1?'s have':' has'} something to collect</span>`;
  if(empty) return `${empty} empty bed${empty>1?'s':''} — select one and pick a seed`;
  if(st.charm<30) return `Add flowers, trees and paths to raise charm — it multiplies visitor income`;
  return `Day ${S.day} · ${SEASONS[S.season].n} · ${WEATHERS[S.weather].n}`;
}

function ui(){
  renderStats(); renderBuild(); renderRight();
  $('#wbadge').innerHTML = hint();
  $('#buildHint').textContent = ghost ? 'Esc to stop' : '';
  const on = S.speed===0?'spd1':S.speed===1?'spd2':'spd3';
  ['spd1','spd2','spd3'].forEach(i=>$('#'+i).classList.toggle('on', i===on));
  const dn = $('#daynight');
  const w = WEATHERS[S.weather];
  dn.style.background = S.weather==='storm' ? 'linear-gradient(200deg,rgba(28,36,86,.42),rgba(20,30,50,.5))'
    : S.weather==='rain' ? 'linear-gradient(200deg,rgba(60,90,120,.26),rgba(40,60,90,.3))'
    : S.weather==='frost' ? 'linear-gradient(200deg,rgba(180,215,235,.2),rgba(150,190,220,.16))'
    : S.weather==='heat' ? 'linear-gradient(200deg,rgba(255,190,90,.16),rgba(255,150,60,.12))'
    : 'transparent';
}

function meter(label, v, col){
  const p = Math.round(clamp(v,0,1)*100);
  return `<div class="row" style="display:block"><div style="display:flex;justify-content:space-between">
    <span>${label}</span><b>${p}%</b></div>
    <div class="bar"><i style="transform:scaleX(${(clamp(v,0,1)).toFixed(3)});background:${col}"></i></div></div>`;
}
function upgradeBlurb(o){
  const bp = BPMAP[o.bp], k = bp.kind;
  const map = {
    plot:'+1 planting slot and faster growth.',
    perennial:'Bigger pick and a shorter ripening cycle.',
    animal:'+50% pen capacity and more product per animal.',
    process:'Faster batches.',
    shop:'Sells noticeably faster.',
    tourism:'+50% nightly income.',
    water:'+60% storage and more daily refill.',
    power:'+50% generation.',
    feed:'+50% feed grown per day.',
    bonus:'A stronger farm-wide bonus.',
    decor:'More charm.',
    hub:'Unlocks the next tier of AI modules.',
  };
  return map[k] || 'Better in every way.';
}

function autoHTML(){
  const h0 = hub();
  if(!h0){
    const bpi = BPMAP.ai_hub;
    return `<div class="empty">
      <div style="font-size:30px;margin-bottom:6px">🤖</div>
      <b>No control hub yet</b>
      <div style="margin-top:6px">Automation runs from a <b>Farm control hub</b>. Build one from the
      <b>AI</b> category, then upgrade it — each Mark switches on more modules.</div>
      <div style="margin-top:10px;color:var(--gold)">${fmt(bpi.cost)} · unlocks at level ${bpi.lvl}
      ${S.lvl<bpi.lvl?` (you are level ${S.lvl})`:''}</div></div>`;
  }
  const ht = hubTier(), st = stat();
  let h = `<div style="padding:9px 10px;border-bottom:1px solid var(--line)">
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <b style="font-size:13px">Farm control hub</b>
      <span class="tierbadge" style="color:${TIERS[ht].col};border-color:${TIERS[ht].col}">${TIERS[ht].n}</span></div>
    <div style="font-size:10.5px;color:var(--ink3)">Modules run once every morning, in order.</div></div>`;
  h += `<div class="aurow"><span>Modules active</span><b>${autoList().length} / ${AUTOS.length}</b></div>`;
  h += `<div class="aurow"><span>Power drawn</span><b class="${st.short?'down':''}">${autoPower()} kW</b></div>`;
  h += `<div class="aurow"><span>Service fee</span><b style="color:var(--gold)">${fmt(autoFees())}/day</b></div>`;
  if(S.autoPowered === false)
    h += `<div class="aurow" style="color:#f0a898"><span>Status</span><b>Throttled — short of power</b></div>`;
  if(S.autoLog && S.autoLog.length)
    h += `<div class="aurow" style="display:block"><span>Last run</span>
      <div style="color:#b9e69a;margin-top:2px">${S.autoLog.join(' · ')}</div></div>`;

  h += `<div class="ph">Modules</div>`;
  AUTOS.forEach(a=>{
    const unlocked = ht >= a.hub;
    const on = autoOn(a.id);
    const cls = !unlocked ? 'lock' : on ? '' : 'off';
    h += `<div class="aumod ${cls}" data-tip="${esc(`<b>${a.n}</b>${a.d}<hr><div class="tl"><span>Needs hub</span><b>${TIERS[a.hub].n}</b></div><div class="tl"><span>Power</span><b>${a.power} kW</b></div><div class="tl"><span>Service</span><span class="tk">${fmt(a.fee)}/day</span></div><hr><span class="tg">${a.tip}</span>`)}">
      <span class="ai">${a.ic}</span>
      <span class="am"><b>${a.n}</b><small>${a.d}</small>
        <small style="color:${unlocked?'var(--gold)':'var(--red)'};margin-top:2px">
          ${unlocked ? `${a.power} kW · ${fmt(a.fee)}/day` : `Locked — needs hub ${TIERS[a.hub].n}`}</small></span>
      <button class="sw ${on?'on':''}" ${unlocked?'':'disabled'} onclick="G.toggleAuto('${a.id}')"
        aria-label="Toggle ${a.n}"></button></div>`;
  });

  const cfg = S.autoCfg || (S.autoCfg = {moist:0.5, reserve:10});
  h += `<div class="ph">Settings</div>
    <div style="padding:9px 11px">
      <div style="display:flex;justify-content:space-between;font-size:11.5px">
        <span data-tip="${esc('<b>Watering threshold</b>The irrigation controller tops up any bed that falls below this moisture level.')}">Water beds below</span>
        <b>${Math.round(cfg.moist*100)}%</b></div>
      <input type="range" min="20" max="90" value="${Math.round(cfg.moist*100)}"
        oninput="G.setCfg('moist', this.value/100)">
      <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-top:9px">
        <span data-tip="${esc('<b>Stock reserve</b>Logistics keeps this many of each good in the barn and only sells the surplus. Raise it if the AI keeps selling what your recipes need.')}">Keep in barn</span>
        <b>${cfg.reserve} each</b></div>
      <input type="range" min="0" max="40" value="${cfg.reserve}"
        oninput="G.setCfg('reserve', +this.value)">
    </div>`;
  return h;
}
