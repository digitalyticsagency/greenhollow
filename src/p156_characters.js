/* =====================================================================
   PICK WHO YOU ARE

   Every farm has started the same way: $520, a partner, two children, a
   cabin, two beds and a tank. The land was the only choice, and the land
   is weather and shape — nothing about the person standing on it.

   Twelve people now, and the difference is mechanical rather than
   flavour. Each brings their own money, their own profession and skill,
   their own household, their own standing in the valley, sometimes
   buildings they already own, and a problem waiting on day one.

   The trades are real and they bite in different directions. The engineer
   arrives with eleven thousand dollars and no idea what a strainer post
   is. The daughter inherits the place with an orchard and a shed already
   standing — and the mortgage that comes with them. The founder can buy
   anything and the valley will not talk to him. The backpacker has $90, a
   bag, nobody to feed and nothing owed to anyone, which turns out to be
   its own kind of rich.

   None of them is the easy one. The engineer's money runs out, the
   daughter's debt is payable, the founder can buy his way to a standing
   he did not start with. What changes is which of the game's systems you
   meet first, and that is the point: the same farm read from twelve
   different starting positions.

   Chosen before the land, applied after the farm is built, so it lands on
   top of the standard opening rather than fighting it.
   ===================================================================== */

const CHARACTERS = [
  { id:'daughter', n:'The returning daughter', age:34,
    line:'Your mother farmed it for thirty years. Now it is yours, and so is what she owed on it.',
    cash:2400, prof:'p0', skill:2, loan:14000,
    family:[{id:'f1', role:'child', name:'Rosa', shirt:'#e8a33d', sc:0.78}],
    fame:24, shirt:'#7d5f4a', hair:'long',
    gives:[['shed',3,3],['orchard',6,3]],
    problem:'A mortgage of $14,000 against the place, and the interest starts this month.' },

  { id:'chef', n:'The ex-chef', age:41,
    line:'Twenty years of service, and a growing certainty that the good stuff comes from somewhere.',
    cash:6800, prof:'p12', skill:3, loan:0,
    family:[{id:'f1', role:'partner', name:'Sam', shirt:'#8f6fc4', sc:1.1}],
    fame:38, shirt:'#e8e0d2', hair:'short',
    gives:[['kitchen',4,3]],
    charm:14,
    problem:'You know exactly what good produce is worth and cannot yet grow any of it.' },

  { id:'vet', n:'The retired vet', age:63,
    line:'Forty years of other people\'s animals. These ones are yours.',
    cash:5200, prof:'p8', skill:4, loan:0,
    family:[{id:'f1', role:'partner', name:'Joan', shirt:'#6f8fc4', sc:1.08}],
    fame:52, shirt:'#4f7f8c', hair:'bowl',
    gives:[['coop',3,4],['goat_pen',7,4]],
    stockHealth:1,
    problem:'The knees are not what they were. You will need help sooner than you think.' },

  { id:'couple', n:'The young couple', age:26,
    line:'Two incomes, no idea, and a deposit that would not buy a flat in town.',
    cash:3100, prof:'p5', skill:1, loan:6000,
    family:[{id:'f1', role:'partner', name:'Ash', shirt:'#8f6fc4', sc:1.06}],
    fame:8, shirt:'#5fb0d4', hair:'short',
    gives:[],
    problem:'Neither of you has grown anything, and the loan wants paying either way.' },

  { id:'backpacker', n:'The backpacker who stayed', age:24,
    line:'Came for a season on somebody else\'s farm. Never got back on the bus.',
    cash:90, prof:'p5', skill:1, loan:0,
    family:[],
    fame:12, shirt:'#c9822f', hair:'long',
    gives:[],
    problem:'Ninety dollars. Nobody to feed but yourself, and nothing owed to anyone.' },

  { id:'engineer', n:'The redundant engineer', age:47,
    line:'Eighteen years, then a restructure and a handshake. The handshake was generous.',
    cash:11200, prof:'p2', skill:5, loan:0,
    family:[{id:'f1', role:'partner', name:'Del', shirt:'#8f6fc4', sc:1.1},
            {id:'f2', role:'child', name:'Theo', shirt:'#e8a33d', sc:0.76}],
    fame:6, shirt:'#5a6b7a', hair:'short',
    gives:[['solar_ground',9,3]],
    problem:'Money is not your problem. Not knowing a strainer post from a strut is.' },

  { id:'teacher', n:'The schoolteacher', age:38,
    line:'Term time, and every holiday for the last nine years spent out here wishing.',
    cash:4300, prof:'p20', skill:4, loan:2500,
    family:[{id:'f1', role:'partner', name:'Niamh', shirt:'#8f6fc4', sc:1.08},
            {id:'f2', role:'child', name:'Cal', shirt:'#e8a33d', sc:0.8},
            {id:'f3', role:'child', name:'Immy', shirt:'#5fb0d4', sc:0.66}],
    fame:30, shirt:'#8a5f9c', hair:'bun',
    gives:[],
    problem:'Three of you at the table and a job that owns your daylight until four.' },

  { id:'shearer', n:'The shearer', age:36,
    line:'Ten sheds a season up and down the country. You have seen every way to do this badly.',
    cash:3600, prof:'p8', skill:2, loan:0,
    family:[],
    fame:44, shirt:'#a8613c', hair:'short',
    gives:[['sheep',4,4],['ute',8,4]],
    problem:'You are away for weeks at a time, and the place does not stop while you are.' },

  { id:'nurse', n:'The night nurse', age:33,
    line:'Four nights on, four off. The off days are why you bought it.',
    cash:5600, prof:'p8', skill:4, loan:3200,
    family:[{id:'f1', role:'child', name:'Wren', shirt:'#5fb0d4', sc:0.72}],
    fame:26, shirt:'#4f8f8c', hair:'bun',
    stockHealth:1,
    gives:[],
    problem:'You sleep when the farm is awake, and the farm does not care.' },

  { id:'apprentice', n:"The market gardener's apprentice", age:29,
    line:'Three seasons on somebody else\'s beds. You know exactly how you would do it differently.',
    cash:1400, prof:'p5', skill:2, loan:0,
    family:[],
    fame:34, shirt:'#4d8f3c', hair:'long',
    gives:[['bed_large',3,5],['greenhouse',7,5]],
    seed:1,
    problem:'You can grow anything and cannot afford the ground to do it on.' },

  { id:'widow', n:'The widowed neighbour', age:58,
    line:'You have been on this road forty years. Everyone knows you, and everyone is watching.',
    cash:4800, prof:'p20', skill:3, loan:0,
    family:[{id:'f1', role:'adult', name:'Frank', shirt:'#6f8fc4', sc:1.06}],
    fame:76, shirt:'#7a6a8c', hair:'bun',
    gives:[['hay_barn',3,3]],
    problem:'Forty years of goodwill, and the strength to work about half of it.' },

  { id:'founder', n:'The founder who cashed out', age:39,
    line:'Sold the company in March. The valley read about it, and has opinions.',
    cash:26000, prof:'p2', skill:5, loan:0,
    family:[{id:'f1', role:'partner', name:'Kit', shirt:'#8f6fc4', sc:1.1}],
    fame:-18, shirt:'#2f3a4a', hair:'short',
    gives:[['dome',8,4]],
    problem:'You can buy any building on the list. You cannot buy a word from anyone at the market.' },
];
function charById(id){ return CHARACTERS.find(c=>c.id === id) || null; }
function currentChar(){ return charById(S.who) || null; }

/* ---------- a face for each of them ---------- */
function charPortrait(c, sc){
  const s = sc || 1;
  let out = `<svg viewBox="0 0 44 52" width="${n(44*s)}" height="${n(52*s)}">`;
  out += `<rect width="44" height="52" rx="7" fill="#1b2418"/>`;
  out += `<circle cx="22" cy="44" r="17" fill="${c.shirt}"/>`;          /* shoulders */
  out += `<circle cx="22" cy="24" r="11" fill="#e2b98f"/>`;             /* face */
  /* hair, by the same three shapes the people use */
  const hairCol = c.age > 55 ? '#c9c4ba' : '#4a3a2a';
  if(c.hair === 'long')
    out += `<path d="M11 24 q0 -13 11 -13 q11 0 11 13 l0 9 q-3 -7 -11 -7 q-8 0 -11 7 Z" fill="${hairCol}"/>`;
  else if(c.hair === 'bun')
    out += `<path d="M11 23 q0 -12 11 -12 q11 0 11 12 q-4 -5 -11 -5 q-7 0 -11 5 Z" fill="${hairCol}"/>`
         + `<circle cx="33" cy="15" r="4.4" fill="${hairCol}"/>`;
  else if(c.hair === 'bowl')
    out += `<path d="M10.5 24 q0 -13 11.5 -13 q11.5 0 11.5 13 q-5 -4 -11.5 -4 q-6.5 0 -11.5 4 Z" fill="${hairCol}"/>`;
  else
    out += `<path d="M11.5 22 q1 -11 10.5 -11 q9.5 0 10.5 11 q-4 -5 -10.5 -5 q-6.5 0 -10.5 5 Z" fill="${hairCol}"/>`;
  out += `<circle cx="18" cy="25" r="1.2" fill="#2b2118"/><circle cx="26" cy="25" r="1.2" fill="#2b2118"/>`;
  out += `<path d="M19 30 q3 2 6 0" stroke="#b98a68" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
  return out + `</svg>`;
}

/* ---------- choosing ---------- */
G.openCharacters = function(){
  modal(`<h2>Who are you?</h2>
    <p class="sub">Twelve people who ended up on a block. What they bring is money, work, a
      household, a standing in the valley, sometimes a building or two — and a problem
      waiting on the first morning.</p>
    <div class="chargrid">
      ${CHARACTERS.map(c=>`<button class="charcard" onclick="G.pickCharacter('${c.id}')">
        <span class="charface">${charPortrait(c, 0.9)}</span>
        <span class="charmain">
          <b>${c.n}</b>
          <span class="muted">${c.line}</span>
          <span class="charstats">
            <span>${fmt(c.cash)}</span>
            ${c.loan ? `<span class="bad">owes ${fmt(c.loan)}</span>` : `<span class="ok">no debt</span>`}
            <span>${c.family.length ? c.family.length + ' at home' : 'on your own'}</span>
            <span>${c.fame >= 40 ? 'well known' : c.fame < 0 ? 'poorly thought of'
              : c.fame >= 20 ? 'known a little' : 'a stranger here'}</span>
          </span>
          <span class="charprob">${c.problem}</span>
        </span>
      </button>`).join('')}
    </div>
    <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Not now</button></div>`);
};
G.pickCharacter = function(id){
  S.pendingWho = id;
  try{ sfx('click'); }catch(e){}
  /* straight on to the land, which is the choice that was already there */
  modal(landChooser());
};

/* ---------- applying, once the farm exists ---------- */
function applyCharacter(id){
  const c = charById(id);
  if(!c) return;
  S.who = c.id;
  S.cash = c.cash;
  careerInit();
  S.career.profId = c.prof;
  S.career.skill = c.skill;
  S.career.loan = c.loan || 0;
  if(typeof S.fame === 'number' || c.fame !== undefined) S.fame = c.fame || 0;
  if(c.charm) S.charmGift = (S.charmGift || 0) + c.charm;

  /* the household: rebuilt from the character rather than the default three */
  S.family = (c.family || []).map(f=>({ ...f, hat:null }));
  try{ peopleInit(); }catch(e){}

  /* whatever they already owned */
  (c.gives || []).forEach(([bp, dx, dy])=>{
    if(!BPMAP[bp]) return;
    try{ place(bp, FARM.x + dx, FARM.y + dy, 0, true); }catch(e){}
  });
  /* the vet and the nurse keep stock well */
  if(c.stockHealth) (S.objs || []).forEach(o=>{
    if((BPMAP[o.bp] || {}).kind === 'animal'){ o.care = 1; o.sick = 0; }
  });
  /* the apprentice arrives with seed in the bag */
  if(c.seed) S.store = Object.assign(S.store || {}, { lettuce:6, tomato:6, carrot:6 });

  if(typeof log === 'function'){
    log(`${c.n}. ${c.line}`, 'gold', 'home');
    log(c.problem, 'bad', 'home');
  }
  if(typeof toast === 'function') toast(c.n, 'gold');
  try{ render(); ui(); G.save(); }catch(e){}
}

/* the chooser goes in front of the land, and the character lands after the farm */
if(typeof G.newGame === 'function'){
  const _newGameChar = G.newGame;
  G.newGame = function(){
    try{ return G.openCharacters(); }catch(e){}
    return _newGameChar.apply(this, arguments);
  };
}
if(typeof G.pickHome === 'function'){
  const _pickHomeChar = G.pickHome;
  G.pickHome = function(){
    const who = S.pendingWho;
    const r = _pickHomeChar.apply(this, arguments);   /* startFarm resets S entirely */
    try{ if(who) applyCharacter(who); }catch(e){}
    return r;
  };
}

(function charCss(){
  const s = document.createElement('style');
  s.textContent = `
  .chargrid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(310px,1fr)); gap:10px;
    max-height:58vh; overflow-y:auto; padding-right:4px }
  .charcard{ display:flex; gap:11px; text-align:left; padding:11px; border-radius:9px;
    background:var(--card,#1b2418); border:1px solid var(--line2,#33402c); cursor:pointer;
    color:inherit; font:inherit; align-items:flex-start }
  .charcard:hover{ border-color:var(--gold,#d8b45a) }
  .charface{ flex:0 0 auto; line-height:0 }
  .charmain{ display:flex; flex-direction:column; gap:4px; min-width:0 }
  .charmain b{ font-size:14.5px }
  .charmain .muted{ font-size:12.5px; line-height:1.4 }
  .charstats{ display:flex; flex-wrap:wrap; gap:4px 10px; font-size:11.5px;
    font-family:ui-monospace,monospace; opacity:.9; margin-top:2px }
  .charstats .bad{ color:#e2a05c } .charstats .ok{ color:#7cc24f }
  .charprob{ font-size:12px; color:#e2c08c; margin-top:3px; line-height:1.4 }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.characterAudit = function(){
  const c = currentChar();
  return {
    available: CHARACTERS.length,
    playing: c ? c.n : 'the default household',
    startedWith: c ? { cash:c.cash, loan:c.loan||0, skill:c.skill, fame:c.fame,
      household:c.family.length, buildings:(c.gives||[]).map(g=>g[0]) } : null,
    nowHave: { cash:S.cash, loan:(S.career||{}).loan, skill:(S.career||{}).skill,
      fame:S.fame, family:(S.family||[]).length,
      objects:(S.objs||[]).length },
    spread: {
      cash:[Math.min(...CHARACTERS.map(x=>x.cash)), Math.max(...CHARACTERS.map(x=>x.cash))],
      fame:[Math.min(...CHARACTERS.map(x=>x.fame)), Math.max(...CHARACTERS.map(x=>x.fame))],
      household:[Math.min(...CHARACTERS.map(x=>x.family.length)),
                 Math.max(...CHARACTERS.map(x=>x.family.length))],
    },
  };
};
