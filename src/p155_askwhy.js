/* =====================================================================
   ASK THE FARM WHY

   There are eighty-four audit handles reading true state — every one of
   them written to answer a question I had while building something, and
   not one of them reachable by the person playing. Meanwhile the farm
   knows exactly why your money moved this month and has no way to say so.

   This is a question box over the top of them.

   IT ANSWERS FROM MEASUREMENT, NOT FROM SCRIPT. Every answer is computed
   when you ask it: the egg price is quoted by asking sellPrice, the
   saturation by asking what the farm produces, the occupancy by counting
   beds against demand. Nothing is a canned string with a number dropped
   into it — if the answer is "nothing is wrong", it says that, because it
   looked.

   IT VOLUNTEERS THE CAUSE. "Why is my income down" is not answered with a
   figure, it is answered with the largest thing that changed and by how
   much. The whole economy pass this session added ceilings that are
   invisible by design — the wholesale tier, the local market softening,
   occupancy — and a player has no way to discover any of them from the
   outside. This is where they come from.

   WHAT IT WILL NOT DO. It will not pretend to understand a sentence. It
   matches on the words it knows, and if it does not recognise the
   question it says so and lists what it can answer, rather than guessing
   and being confidently wrong. The questions are on buttons for that
   reason: the box is there for the person who would rather type.
   ===================================================================== */

const ASK = [
  {
    id:'money', k:['money','income','earn','profit','poor','down','less','cash','broke','revenue'],
    q:'Why is my income what it is?',
    run(){
      const lines = incomeLines();
      const total = lines.reduce((a,x)=>a + x.v, 0);
      const out = outgoings();
      const bits = [];
      bits.push(`You take ${fmt(Math.round(total))} a month and pay out ${fmt(Math.round(out.total))}, `
        + `so you are ${total >= out.total ? 'ahead by ' + fmt(Math.round(total-out.total))
          : 'behind by ' + fmt(Math.round(out.total-total))}.`);
      lines.forEach(l=>bits.push(`· ${l.n}: ${fmt(Math.round(l.v))}${l.d ? ' — ' + l.d : ''}`));
      /* the ceilings, only if they are actually biting */
      try{
        const blend = retailBlend();
        if(blend < 0.995) bits.push(`You are producing ${Math.round(totalOutput())} units a month. `
          + `Past ${RETAIL.units} the surplus goes wholesale, so you are averaging `
          + `${Math.round(blend*100)}% of the retail price.`);
      }catch(e){}
      try{
        const soft = Object.keys(GOODS).map(g=>({ g, q:monthlyOutput(g), s:saturation(g) }))
          .filter(x=>x.s < 0.98).sort((a,b)=>a.s-b.s).slice(0,3);
        soft.forEach(x=>bits.push(`· ${GOODS[x.g].n} is at ${Math.round(x.s*100)}% of its normal price `
          + `because you make ${Math.round(x.q)} a month and the valley only wants so many.`));
      }catch(e){}
      try{
        const occ = occupancy();
        if(occ < 0.98) bits.push(`Your beds are ${Math.round(occ*100)}% full — `
          + `${Math.round(guestDemand())} parties a month looking, ${Math.round(guestCapacity())} beds. `
          + `More charm brings more of them; more beds on their own will not.`);
      }catch(e){}
      try{
        const comp = obligationsMonthly();
        if(comp) bits.push(`Compliance is ${fmt(comp)} a month: `
          + obligationsDue().map(o=>o.n.toLowerCase()).join(', ') + '.');
        const band = rateBand();
        if(band.mul > 1) bits.push(`You are rated as ${band.n}, which is ${band.mul}x the base rate.`);
      }catch(e){}
      return bits;
    }
  },
  {
    /* not 'water' — the water topic owns that word, and having it here sent
       "how is the water" to the crops answer */
    id:'crops', k:['crop','grow','plant','harvest','yield','bed','soil','weed','dry bed'],
    q:'Why are my crops doing what they are doing?',
    run(){
      const plots = (S.objs||[]).filter(o=>(BPMAP[o.bp]||{}).kind === 'plot');
      if(!plots.length) return ['You have no beds in the ground.'];
      const planted = plots.filter(o=>o.crop);
      const bits = [`${planted.length} of ${plots.length} beds have something in them.`];
      const dry = planted.filter(o=>(o.water||0) < 0.35).length;
      const weedy = planted.filter(o=>(o.weeds||0) > 0.5).length;
      const pest = planted.filter(o=>o.pest).length;
      const poor = plots.filter(o=>(o.fert === undefined ? 1 : o.fert) < 0.45).length;
      if(dry)   bits.push(`${dry} ${dry===1?'is':'are'} dry. Growth stalls under about a third.`);
      if(weedy) bits.push(`${weedy} ${weedy===1?'is':'are'} weedy, which halves what you get.`);
      if(pest)  bits.push(`${pest} ${pest===1?'has':'have'} pests.`);
      if(poor)  bits.push(`${poor} ${poor===1?'bed is':'beds are'} worn out — fertility under 45%. `
        + `Rotate them or feed them.`);
      const wrong = planted.filter(o=>{
        const cr = CROPS[o.crop]; const bp = BPMAP[o.bp];
        return cr && !bp.shelter && cr.seasons && !cr.seasons.includes(S.season); }).length;
      if(wrong) bits.push(`${wrong} ${wrong===1?'is':'are'} out of season, which halves their speed. `
        + `A greenhouse or tunnel ignores that.`);
      if(bits.length === 1) bits.push('Nothing is wrong with any of them.');
      return bits;
    }
  },
  {
    id:'animals', k:['animal','stock','herd','flock','sick','hungry','egg','milk','pen','coop'],
    q:'How are the animals?',
    run(){
      const pens = (S.objs||[]).filter(o=>(BPMAP[o.bp]||{}).kind === 'animal');
      if(!pens.length) return ['You have no stock.'];
      const bits = [];
      pens.forEach(o=>{
        const bp = BPMAP[o.bp];
        const problems = [];
        if(!o.animals) problems.push('empty');
        if(o.hungry) problems.push('hungry, so not producing');
        if(o.sick) problems.push('ill, output halved');
        if((o.care === undefined ? 1 : o.care) < 0.5) problems.push('needs cleaning out');
        const y = (typeof yieldMul === 'function') ? Math.round(yieldMul(o)*100) : 100;
        bits.push(`· ${bp.name}: ${o.animals || 0} head, ${y}% of normal output`
          + (problems.length ? ' — ' + problems.join(', ') : ''));
      });
      const feedDays = (typeof S.feed === 'number')
        ? Math.floor(S.feed / Math.max(0.01, pens.reduce((a,o)=>a + (BPMAP[o.bp].feed||0)*(o.animals||0), 0)))
        : null;
      if(feedDays !== null && isFinite(feedDays))
        bits.push(`Feed in the barn lasts about ${feedDays} more day${feedDays===1?'':'s'}.`);
      return bits;
    }
  },
  {
    id:'power', k:['power','electric','solar','battery','kw','short','grid'],
    q:'What is happening with the power?',
    run(){
      const st = stat();
      const bits = [`Generating ${Math.round(st.power)} kW, using ${Math.round(st.use)} kW.`];
      if(st.short) bits.push('You are short, so greenhouses and workshops are running at 40%.');
      else bits.push('Comfortable. Weather moves solar output a long way, so check on a dull day.');
      if(st.buffer) bits.push(`Battery buffer ${Math.round(st.buffer)}.`);
      return bits;
    }
  },
  {
    id:'people', k:['people','worker','farmhand','family','who','staff','busy','idle','wwoof'],
    q:'What is everybody doing?',
    run(){
      const rows = (typeof dollFolk === 'function') ? dollFolk() : [];
      if(!rows.length) return ['Nobody is about.'];
      const bits = rows.map(r=>`· ${r.name} (${r.role}) — ${r.where} — ${r.asleep ? 'asleep' : r.act}`);
      try{
        const jobs = (typeof jobBoard === 'function') ? jobBoard() : [];
        const hands = (S.workers||[]).length;
        if(jobs.length > hands) bits.push(`${jobs.length} jobs on the board and ${hands} `
          + `farmhand${hands===1?'':'s'} to do them. Three of them will go unstaffed.`);
      }catch(e){}
      try{
        const m = machineWorking();
        bits.push(m ? `A ute is available today, so each hand does ${MACH_BOOST} more jobs.`
          : 'No working ute today — the hands are on foot.');
      }catch(e){}
      return bits;
    }
  },
  {
    id:'water', k:['water','tank','dam','rain','dry','irrigat'],
    q:'How is the water?',
    run(){
      const st = stat();
      const bits = [`${Math.round(S.water||0)} L in hand, ${Math.round(st.waterCap)} L of storage, `
        + `${Math.round(st.waterGain)} L a day coming in.`];
      if((S.water||0) < st.waterCap*0.2) bits.push('Low. Beds will start going unwatered.');
      if(st.autowater) bits.push('Automatic watering is on.');
      return bits;
    }
  },
  {
    id:'birds', k:['bird','nest','chick','finch','feed the birds'],
    q:'What are the birds doing?',
    run(){
      try{
        const a = G.birdLivesAudit();
        const b = [`${a.birds} birds, capacity ${a.capacity} — ${a.fromTrees} from trees, `
          + `${a.fromNestBoxes} from nest boxes.`];
        if(a.eggs) b.push(`${a.eggs} egg${a.eggs===1?'':'s'} in the nests.`);
        if(a.chicks) b.push(`${a.chicks} chick${a.chicks===1?'':'s'} growing.`);
        b.push(`${a.happyEnoughToPlay} are content enough to fly together.`);
        return b;
      }catch(e){ return ['The birds are not saying.']; }
    }
  },
  {
    id:'standing', k:['reputation','standing','charm','fame','guest','review','visitor','market'],
    q:'How do people see this place?',
    run(){
      const st = stat();
      const bits = [`Charm ${Math.round(st.charm)}, which multiplies what visitors pay by `
        + `${(typeof charmMul === 'function' ? charmMul() : 1).toFixed(2)}.`];
      if(typeof S.fame === 'number') bits.push(`Standing ${Math.round(S.fame)} in the valley.`);
      try{
        bits.push(`${Math.round(guestDemand())} parties a month are looking for somewhere, `
          + `and you can sleep ${Math.round(guestCapacity())}.`);
      }catch(e){}
      return bits;
    }
  },
];

function askAnswer(text){
  const t = (text || '').toLowerCase();
  if(!t.trim()) return null;
  let best = null, score = 0;
  ASK.forEach(a=>{
    let s = 0;
    a.k.forEach(k=>{ if(t.indexOf(k) >= 0) s += k.length; });
    if(s > score){ score = s; best = a; }
  });
  if(!best) return { unknown:true };
  let lines = [];
  try{ lines = best.run() || []; }catch(e){ lines = ['That went wrong on the way to an answer.']; }
  return { topic:best.q, lines };
}

G.openAsk = function(pre){
  const res = pre ? askAnswer(pre) : null;
  modal(`<h2>Ask the farm</h2>
    <p class="sub">It answers from what is actually true right now, not from a script. If it does
      not know a question it will say so.</p>
    <input id="askbox" type="text" placeholder="why is my income down?"
      value="${pre ? String(pre).replace(/"/g,'&quot;') : ''}"
      style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid var(--line2,#33402c);
             background:var(--card,#1b2418);color:inherit;font:inherit"
      onkeydown="if(event.key==='Enter')G.askIt()">
    <div style="display:flex;gap:8px;margin-top:8px"><button class="btn" onclick="G.askIt()">Ask</button></div>
    <div id="askout" style="margin-top:12px">${res ? askHTML(res) : ''}</div>
    <h3 style="margin:16px 0 6px;font-size:15px">Or one of these</h3>
    <div class="mkgrid">${ASK.map(a=>
      `<button class="mkcard" onclick="G.openAsk('${a.q.replace(/'/g,"\\'")}')"><b>${a.q}</b></button>`).join('')}</div>
    <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Close</button></div>`);
  setTimeout(()=>{ const b = document.getElementById('askbox'); if(b && !pre) b.focus(); }, 60);
};
function askHTML(res){
  if(res.unknown)
    return `<div class="rows"><p class="sub">Not something it keeps track of. It can answer about
      money, crops, animals, power, people, water, birds and how the place is seen.</p></div>`;
  return `<div class="rows"><div class="row" style="display:block">
    <b>${res.topic}</b>
    <div style="margin-top:7px;line-height:1.55">${res.lines.map(l=>
      `<div style="margin:3px 0;color:var(--ink-2,#b4bfa9)">${l}</div>`).join('')}</div></div></div>`;
}
G.askIt = function(){
  const b = document.getElementById('askbox');
  const out = document.getElementById('askout');
  if(!b || !out) return;
  const res = askAnswer(b.value);
  out.innerHTML = res ? askHTML(res) : '';
};

if(typeof syncWorldButtons === 'function'){
  const _syncAsk = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncAsk.apply(this, arguments);
    try{
      const host = document.getElementById('zoomctl');
      if(host && !document.getElementById('askbtn')){
        const b = document.createElement('button');
        b.id = 'askbtn'; b.textContent = '?';
        b.title = 'Ask the farm';
        b.setAttribute('data-tip','<b>Ask the farm</b>Why is the money down, what are the crops doing, who is where.');
        b.onclick = ()=>G.openAsk();
        host.insertBefore(b, host.firstChild);
      }
    }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.askAudit = function(){
  const probes = ['why is my income down','crops','how are the animals','power',
                  'who is doing what','water','birds','reputation','what is the moon made of'];
  return {
    topics: ASK.length,
    answers: probes.map(p=>{
      const r = askAnswer(p);
      return { asked:p, matched: r && !r.unknown ? r.topic : 'not recognised',
               lines: r && r.lines ? r.lines.length : 0 };
    }),
  };
};
