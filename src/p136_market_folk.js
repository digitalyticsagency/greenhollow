/* =====================================================================
   EIGHT PEOPLE AT THE MARKET, AND THEY ALL KNOW EACH OTHER

   The crowd on the market street was sixteen identical dots in six
   colours. These are eight named traders with their own faces, their own
   pitches and one thread running through all of them, and the only way to
   pull it is to talk to people and carry what they tell you.

   THE THREAD, and it is deliberately one thread rather than eight:

     Bram the baker is three months behind with Odile the miller, and will
     not say why — his oven cracked in the frost and he cannot afford the
     brick. Odile is ready to stop his flour. Her daughter Wren runs the
     cheese and is quietly planning to leave the valley, which Odile does
     not know and Perrin the fiddler would be very sorry to hear, because
     he has never managed to say what he thinks of her. Hesper has not
     spoken to Gil since he took the corner pitch while she was ill; Gil
     took it to keep his sister Nessa's flower stall afloat, and Nessa has
     no idea. Tam the steward knows all of it and will tell you none of it
     until you are somebody worth telling.

   WHAT YOU LEARN IS THE MECHANIC. Ask Bram kindly and he mentions the
   oven. That unlocks a line with Odile you did not have before. Take it
   and the debt gets settled between them; take the cruel version and it
   does not. Three threads resolve that way, each through two or three
   people, and none of them can be brute-forced — you cannot say the
   useful thing to Odile until Bram has told you.

   IT MOVES YOUR STANDING, WHICH IS REAL MONEY. Not a new number: S.fame,
   the standing p39 already keeps, which lifts what everything sells for
   and cuts what supplies cost, to a cap of forty-five per cent. Kindness
   and discretion earn it a point or two at a time; being blunt, greedy or
   a gossip loses it. Resolving a thread is worth five.

   That is the whole design principle here — the reward for being decent
   to people is the same reward as being good at farming, so it is not a
   morality tick-box bolted to the side.
   ===================================================================== */

const FOLK = [
  { id:'odile',  n:'Odile',  trade:'the mill',        p:0.16,
    shirt:'#4f5f8a', hair:'#4a3a2a', hat:'#6b5335', build:1.05 },
  { id:'bram',   n:'Bram',   trade:'the bakery',      p:0.30,
    shirt:'#c8583f', hair:'#2e2620', hat:null,       build:1.0 },
  { id:'wren',   n:'Wren',   trade:'the cheese',      p:0.44,
    shirt:'#7fa87a', hair:'#8a5f3a', hat:null,       build:0.92 },
  { id:'perrin', n:'Perrin', trade:'a fiddle',        p:0.57,
    shirt:'#a98fd6', hair:'#3a3026', hat:'#5f4a6a', build:0.96, fiddle:1 },
  { id:'hesper', n:'Hesper', trade:'the dairy',       p:0.68,
    shirt:'#8a6a45', hair:'#c8c2b4', hat:'#7a6a52', build:0.98 },
  { id:'gil',    n:'Gil',    trade:'the vegetables',  p:0.79,
    shirt:'#5f8f5a', hair:'#4a3a2a', hat:null,       build:1.06 },
  { id:'nessa',  n:'Nessa',  trade:'the flowers',     p:0.88,
    shirt:'#e8a3c0', hair:'#6a4a2a', hat:null,       build:0.9 },
  { id:'tam',    n:'Tam',    trade:'the market',      p:0.97,
    shirt:'#3f4a5a', hair:'#8a8272', hat:'#2f3742', build:1.02 },
];

function folkState(){
  if(!S.mkfolk) S.mkfolk = { know:{}, done:{}, said:{} };
  return S.mkfolk;
}
function knows(k){ return !!folkState().know[k]; }
function learn(k){ folkState().know[k] = 1; }
function threadDone(k){ return !!folkState().done[k]; }

/* standing is the currency of being decent here — the same S.fame that
   p39 turns into money on everything you sell */
function fameShift(d, why){
  marketInit();
  S.fame = Math.max(0, S.fame + d);
  if(typeof log === 'function' && why)
    log(`${why} (${d > 0 ? '+' : ''}${d} standing)`, d > 0 ? 'good' : 'bad', 'farm');
  if(typeof ui === 'function') try{ ui(); }catch(e){}
}

/* ---------- what each of them will say ----------
   Options can be gated on what you already carry, which is what makes
   this a web rather than eight separate conversations. */
function folkLines(f){
  const F = folkState();
  const L = { intro:'', opts:[] };
  const O = (t, d, fame, fn, gate)=>({ t, d, fame, fn, gate });

  if(f.id === 'bram'){
    L.intro = threadDone('oven')
      ? `Bram is up to his elbows in dough and looks like a man who slept.
         "Odile's letting the flour through again. I don't know what you said."`
      : `Bram has a good stall and almost nothing on it. "Short bake today," he says,
         before you have asked. "Short bake all week, if I'm honest."`;
    if(!threadDone('oven')){
      L.opts.push(O('Ask what has gone wrong, and mean it.', 'kind', 2, ()=>{
        learn('oven');
        return `He looks at you for a moment. "Oven cracked in the frost. I can get the brick
          in a month. Odile wants paying now, and I can't tell her I'm baking on half a fire —
          she'd be within her rights to stop me altogether."`;
      }));
      L.opts.push(O('Tell him he ought to sort himself out.', 'blunt', -2, ()=>
        `"Aye," he says, and goes back to the dough, and does not look up again.`));
    }
    L.opts.push(O('Buy a loaf and say nothing.', 'kind', 1, ()=>
      `He wraps it in paper and gives you the bigger one.`));
  }

  if(f.id === 'odile'){
    L.intro = threadDone('oven')
      ? `Odile is counting sacks. "You did me a favour, telling me. I don't like being the
         one everybody's frightened of."`
      : `Odile has flour to her elbows and an account book she keeps looking at.
         "Three months," she says to nobody. "Three."`;
    if(knows('oven') && !threadDone('oven')){
      L.opts.push(O('Tell her about the oven — quietly, on his behalf.', 'kind', 5, ()=>{
        folkState().done.oven = 1;
        return `She stops counting. "Cracked? The great fool. Why did he not say?" A pause.
          "Because I'd have made a meal of it, that's why." She closes the book.
          "Tell him the flour keeps coming. And tell him I said he's a fool."`;
      }));
      L.opts.push(O('Tell her he is baking on half a fire and cannot pay.', 'gossip', -3, ()=>
        `She hears you out, and by evening the whole row knows. Bram will not look at you.`));
    }
    L.opts.push(O('Ask what flour is doing this week.', 'plain', 0, ()=>
      `"Holding. Ask me again on Friday and I'll say something ruder."`));
  }

  if(f.id === 'wren'){
    L.intro = threadDone('leaving')
      ? `Wren has a letter in her apron pocket and keeps touching it. "He came and found me.
         Perrin. He'd been at it three years, apparently."`
      : `Wren has the cheese laid out beautifully and is looking straight past it,
         out at the road.`;
    if(!threadDone('leaving')){
      L.opts.push(O('Ask what she is looking at.', 'kind', 2, ()=>{
        learn('leaving');
        return `"The coach road." She says it like a confession. "There's a place going in the
          city, dairy work, proper money. I've not told Mother. I've not told anybody."`;
      }));
      L.opts.push(O('Tell her the cheese will not sell itself.', 'blunt', -2, ()=>
        `"No," she says. "It won't." She does not look at you again.`));
    }
    L.opts.push(O('Buy a wheel of the hard cheese.', 'plain', 1, ()=>
      `She cuts you a corner to taste first, which she does not do for everybody.`));
  }

  if(f.id === 'perrin'){
    L.intro = threadDone('leaving')
      ? `Perrin plays something quick and rather good. "She knows. That's the main thing."`
      : `Perrin is tuning and retuning a fiddle that was in tune when you got here.`;
    if(knows('leaving') && !threadDone('leaving')){
      L.opts.push(O('Tell him Wren is thinking of going.', 'kind', 5, ()=>{
        folkState().done.leaving = 1;
        return `The tuning stops. "Going." He puts the fiddle down, which you suspect he has not
          done all day. "Three years I've been meaning to say something to that girl."
          He is already walking. "Right. Right."`;
      }));
    }
    L.opts.push(O('Ask for a tune.', 'kind', 1, ()=>
      `He plays a reel and half the row starts tapping. Somebody buys you a drink for it.`));
  }

  if(f.id === 'hesper'){
    L.intro = threadDone('pitch')
      ? `Hesper has the corner back, and Gil's stall beside her. "He explained himself.
         Took him long enough."`
      : `Hesper works her stall with her back half-turned to the corner pitch, which she does
         not look at once.`;
    if(!threadDone('pitch')){
      L.opts.push(O('Ask about the corner.', 'plain', 1, ()=>{
        learn('feud');
        return `"That's my corner. Forty years my corner. I had a bad winter and Gil had it off
          me before I was back on my feet, and he's never once said why."`;
      }));
      if(knows('why-pitch')){
        L.opts.push(O('Tell her why Gil took it.', 'kind', 5, ()=>{
          folkState().done.pitch = 1;
          return `"For Nessa?" She sits down on a crate. "He could have said. Forty years I've
            known that family and he could have said." She is quiet a while.
            "Send him over. Not now. This afternoon."`;
        }));
      }
    }
  }

  if(f.id === 'gil'){
    L.intro = threadDone('pitch')
      ? `Gil looks like a man who has put something heavy down. "She wants me over this
         afternoon. That's the worst part, that is — knowing she'd have understood."`
      : `Gil has the corner pitch and the best trade on the row, and does not look pleased
         about either.`;
    if(knows('feud') && !threadDone('pitch')){
      L.opts.push(O('Ask him straight why he took the corner.', 'kind', 2, ()=>{
        learn('why-pitch');
        return `He is a long time answering. "Nessa's flowers weren't paying. Corner takes twice
          the trade of a middle pitch." He shrugs. "I'm not telling Hesper my sister was going
          under. And I'm not telling Nessa I did it, either."`;
      }));
      L.opts.push(O('Tell him everyone thinks he is a thief.', 'blunt', -3, ()=>
        `"Let them," he says, and that is the end of the conversation.`));
    }
    L.opts.push(O('Buy a box of whatever is best today.', 'plain', 1, ()=>
      `He picks it himself and puts two extra in the bottom.`));
  }

  if(f.id === 'nessa'){
    L.intro = threadDone('pitch')
      ? `Nessa has more flowers out than usual. "Gil told me. About the corner. I could
         have hit him."`
      : `Nessa's flowers are the best-looking thing on the row and she is selling almost
         none of them.`;
    L.opts.push(O('Ask how trade is.', 'kind', 1, ()=>{
      learn('nessa-thin');
      return `"Slow. Flowers are the first thing people stop buying." She says it lightly.
        "Gil keeps putting money in the tin when he thinks I'm not looking."`;
    }));
    if(knows('why-pitch') && !threadDone('pitch')){
      L.opts.push(O('Tell her what her brother did for her.', 'gossip', -2, ()=>
        `She goes very still. "He did WHAT?" It is not your news to give, and it lands badly.`));
    }
    L.opts.push(O('Buy the biggest bunch she has.', 'kind', 2, ()=>
      `She wraps it in brown paper and string and will not take the full price.`));
  }

  if(f.id === 'tam'){
    const rep = (typeof S.fame === 'number') ? S.fame : 0;
    L.intro = rep >= 24
      ? `Tam runs the market and misses nothing. "You've been about. People have said."`
      : `Tam runs the market. He looks at you the way a man looks at a stranger's dog.`;
    if(rep >= 24){
      L.opts.push(O('Ask what he makes of the row this year.', 'kind', 2, ()=>
        `"Bram'll be right once his oven's fixed. Wren'll stay now, I reckon. And Hesper and
          Gil are speaking, which is more than they managed in two years." He almost smiles.
          "Funny how that all came round at once."`));
    } else {
      L.opts.push(O('Introduce yourself.', 'plain', 1, ()=>
        `"I know who you are." He goes back to his list. Come back when the row has an
          opinion of you.`));
    }
  }

  return L;
}

/* ---------- talking ---------- */
G.talkFolk = function(id){
  const f = FOLK.find(x=>x.id === id); if(!f) return;
  const L = folkLines(f);
  modal(`<h2>${f.n}</h2>
    <p class="sub" style="font-size:13px;line-height:1.6">${L.intro}</p>
    ${L.opts.length ? `<div class="folkopts">${L.opts.map((o,i)=>`
      <button class="folkopt" onclick="G.folkSay('${id}',${i})">
        <span class="fo-t">${o.t}</span>
        <span class="fo-d fo-${o.d}">${o.d}</span></button>`).join('')}</div>`
      : `<p class="sub">There is nothing more to say today.</p>`}
    <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Leave them to it</button></div>`);
};

G.folkSay = function(id, i){
  const f = FOLK.find(x=>x.id === id); if(!f) return;
  const L = folkLines(f);
  const o = L.opts[i]; if(!o) return;
  let reply = '';
  try{ reply = o.fn() || ''; }catch(e){}
  if(o.fame) fameShift(o.fame, `${f.n} at the market`);
  modal(`<h2>${f.n}</h2>
    <p class="sub" style="font-size:13px;line-height:1.6">${reply}</p>
    ${o.fame ? `<div class="ledrow"><span>Standing</span>
      <b style="color:${o.fame>0?'var(--green)':'var(--red)'}">${o.fame>0?'+':''}${o.fame}</b></div>` : ''}
    <div class="mfoot">
      <button class="btn" onclick="G.talkFolk('${id}')">Go on</button>
      <button class="btn ghost" onclick="G.closeModal()">Leave it there</button>
    </div>`);
};

/* ---------- they stand at their pitches and move about ---------- */
function folkArt(f, x, y, t){
  const b = f.build;
  const bob = Math.sin(t*1.6 + f.p*9) * 1.6;
  const sway = Math.sin(t*0.9 + f.p*5) * 2.4;
  let s = `<g transform="translate(${n(x + sway)},${n(y + bob)}) scale(${b})">`;
  s += `<ellipse cx="0" cy="17" rx="9" ry="3.2" fill="#000" opacity=".18"/>`;
  /* legs */
  s += `<rect x="-5" y="8" width="4" height="9" rx="2" fill="#3f4a5a"/>`;
  s += `<rect x="1" y="8" width="4" height="9" rx="2" fill="#3f4a5a"/>`;
  /* body */
  s += `<rect x="-7" y="-5" width="14" height="15" rx="5" fill="${f.shirt}"/>`;
  /* arms — the fiddler's bow arm actually saws */
  if(f.fiddle){
    const saw = Math.sin(t*7)*7;
    s += `<rect x="-13" y="-3" width="9" height="3.4" rx="1.7" fill="${f.shirt}"
      transform="rotate(${n(-18+saw)} -7 -2)"/>`;
    s += `<rect x="-15" y="-6" width="10" height="3" rx="1.4" fill="#8a5f3a"/>`;
  } else {
    s += `<rect x="-10" y="-3" width="4" height="10" rx="2" fill="${f.shirt}"/>`;
  }
  s += `<rect x="6" y="-3" width="4" height="10" rx="2" fill="${f.shirt}"/>`;
  /* head, hair, hat */
  s += `<circle cx="0" cy="-11" r="6" fill="#efc9a4"/>`;
  s += `<path d="M-6 -13 q6 -6 12 0 q-6 -3 -12 0 z" fill="${f.hair}"/>`;
  if(f.hat){
    s += `<ellipse cx="0" cy="-15" rx="9" ry="2.6" fill="${f.hat}"/>`;
    s += `<path d="M-5 -15 q5 -7 10 0 z" fill="${f.hat}"/>`;
  }
  s += `<circle cx="-2" cy="-11.5" r="0.85" fill="#2b2118"/>`;
  s += `<circle cx="2.2" cy="-11.5" r="0.85" fill="#2b2118"/>`;
  s += `</g>`;
  return s;
}

/* drawn over the street, and added to what you can walk up to */
if(typeof paintTrip === 'function'){
  const _paintTripFolk = paintTrip;
  paintTrip = function(){
    const r = _paintTripFolk.apply(this, arguments);
    try{
      const M = MTRIP;
      if(!M || M.phase !== 'at') return r;
      const el = document.getElementById('mktlay'); if(!el) return r;
      const box = el.getBoundingClientRect();
      const W = Math.max(320, box.width), H = Math.max(240, box.height);
      const roadY = H*0.40 + (H - H*0.40)*0.52;
      let s = '';
      FOLK.forEach(f=>{
        const x = (f.p - M.px)*W*2.6 + W*0.5;
        if(x < -70 || x > W+70) return;
        const y = roadY + 26;
        s += folkArt(f, x, y, M.t);
        const on = M.nearFolk === f;
        s += `<rect x="${n(x-30)}" y="${n(y-46)}" width="60" height="16" rx="8"
          fill="${on ? '#f0c14b' : 'rgba(20,27,16,.75)'}"/>`;
        s += `<text x="${n(x)}" y="${n(y-35)}" text-anchor="middle" font-size="9.5"
          fill="${on ? '#2a2010' : '#eaf3e6'}" style="font-family:inherit">${f.n}</text>`;
      });
      el.innerHTML += s;
    }catch(e){}
    return r;
  };
}

if(typeof tickTrip === 'function'){
  const _tickTripFolk = tickTrip;
  tickTrip = function(dt){
    const r = _tickTripFolk.apply(this, arguments);
    try{
      const M = MTRIP;
      if(M && M.phase === 'at'){
        M.nearFolk = null;
        let best = 1;
        FOLK.forEach(f=>{
          const d = Math.abs(f.p - M.px);
          if(d < 0.045 && d < best){ best = d; M.nearFolk = f; }
        });
        /* a person you can talk to outranks a stall you can shop at */
        if(M.nearFolk){
          const f = M.nearFolk;
          M.near = { n:f.n, d:`talk — ${f.trade}`, go:()=>G.talkFolk(f.id) };
          if(typeof mktBar === 'function') mktBar();
        }
      }
    }catch(e){}
    return r;
  };
}

(function folkCss(){
  const s = document.createElement('style');
  s.textContent = `
  .folkopts{ display:flex; flex-direction:column; gap:6px; margin:10px 0 4px; }
  .folkopt{ display:flex; align-items:center; gap:8px; width:100%; text-align:left;
    font-family:inherit; font-size:12.5px; color:var(--ink); background:var(--panel2);
    border:1px solid var(--line); border-radius:9px; padding:9px 11px; cursor:pointer; }
  .folkopt:hover{ border-color:var(--green); background:rgba(124,194,79,.10); }
  .fo-t{ flex:1; line-height:1.45; }
  .fo-d{ font-size:10px; letter-spacing:.06em; text-transform:uppercase; font-weight:700;
    padding:2px 7px; border-radius:999px; white-space:nowrap; }
  .fo-kind{ color:#0e1a09; background:#7cc24f; }
  .fo-plain{ color:var(--ink2); background:rgba(255,255,255,.08); }
  .fo-blunt{ color:#2a1410; background:#e2705c; }
  .fo-gossip{ color:#2a1410; background:#e8a33d; }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.marketFolkAudit = function(){
  const F = folkState();
  return {
    folk: FOLK.map(f=>`${f.n} — ${f.trade}`),
    threads: {
      'Bram’s oven': threadDone('oven') ? 'settled' : (knows('oven') ? 'you know, Odile does not' : 'not started'),
      'Wren leaving':     threadDone('leaving') ? 'settled' : (knows('leaving') ? 'you know, Perrin does not' : 'not started'),
      'the corner pitch': threadDone('pitch') ? 'settled'
        : (knows('why-pitch') ? 'you know why, Hesper does not'
        : (knows('feud') ? 'you know there is a feud' : 'not started')),
    },
    youKnow: Object.keys(F.know),
    standing: (typeof S.fame === 'number') ? S.fame : 0,
    standingIsWorth: (typeof fameBonus === 'function')
      ? '+' + Math.round(fameBonus()*100) + '% on everything you sell' : '—',
    tamWillTalk: ((S.fame||0) >= 24) ? 'yes' : 'not until 24 standing',
    talkingTo: (typeof MTRIP !== 'undefined' && MTRIP && MTRIP.nearFolk) ? MTRIP.nearFolk.n : 'nobody',
  };
};
