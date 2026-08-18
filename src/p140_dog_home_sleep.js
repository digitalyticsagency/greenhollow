/* =====================================================================
   PICK YOUR DOG, FILL YOUR GUEST WING, SLEEP IN YOUR OWN BED

   Three things that were each one missing connection.

   THE DOG. You pressed "Take her home" and got a brown dog. Always the
   same brown dog, because every colour in dogArt is a literal in the
   drawing code. Now you choose a breed and a coat first, and the choice
   is real: six breeds that differ in size and in what they are good at,
   six coats that repaint her properly rather than tinting her.

   THE GUEST WING. guestHomes() matches on art === 'glamping' || 'dome'.
   The guest wing is neither. Nor is the bunk annexe, nor the worker
   cottage. So you could spend $420 on a four by three building whose
   whole description is about people staying in it, and nobody ever came:
   it was a shed with bunks drawn inside it. Anything with kind 'housing'
   is now somewhere a guest can live, and its `slots` count is honoured —
   the guest wing has said slots:3 since the day it was written and the
   game only ever put one person in a building. Three bunks, three guests.

   YOUR BED. The household is put to bed properly by p102 — partner in the
   main bedroom, a child in each of theirs. You were not in that list. You
   fell asleep wherever you happened to be standing, which at midnight was
   usually the middle of the main bedroom, 31 pixels off your own pillow
   and lying on top of your partner. Measured, before this: you at 458,354
   and your partner at 455,352, with your own bed empty at 427.

   You now walk to your side of the bed and lie on it.
   ===================================================================== */

/* ---------- breeds and coats ---------- */
const DOG_BREEDS = [
  { id:'collie',  n:'Border collie',   sc:0.98, good:'stock',
    d:'Quick and busy. Best with animals, and never once still.' },
  { id:'kelpie',  n:'Kelpie',          sc:0.94, good:'stock',
    d:'Bred for heat and distance. Will work all day and ask for more.' },
  { id:'lab',     n:'Labrador',        sc:1.06, good:'family',
    d:'Soft-mouthed and endlessly friendly. Good with children, poor at gates.' },
  { id:'terrier', n:'Farm terrier',    sc:0.82, good:'vermin',
    d:'Small, loud, and absolutely certain about rats.' },
  { id:'shep',    n:'Shepherd',        sc:1.12, good:'guard',
    d:'Big and watchful. Strangers get announced twice.' },
  { id:'lurcher', n:'Lurcher',         sc:1.04, good:'speed',
    d:'Long-legged and fast over open ground. Sleeps the rest of the time.' },
];
const DOG_COATS = [
  { id:'sable', n:'Sable',        base:'#8a6a4a', lite:'#a07d56', dark:'#6d5238', mid:'#7a5c3f' },
  { id:'black', n:'Black',        base:'#3a3a40', lite:'#55555e', dark:'#24242a', mid:'#313137' },
  { id:'red',   n:'Red',          base:'#a8552c', lite:'#c47a44', dark:'#7d3c1e', mid:'#994c26' },
  { id:'cream', n:'Cream',        base:'#ddc6a0', lite:'#f0dfc2', dark:'#b09668', mid:'#cfb78e' },
  { id:'merle', n:'Blue merle',   base:'#7d8794', lite:'#9ba6b2', dark:'#59636f', mid:'#6f7a86' },
  { id:'tri',   n:'Black and tan',base:'#33333a', lite:'#8a6a4a', dark:'#212127', mid:'#5c4a36' },
];
function dogBreed(){ return DOG_BREEDS.find(b=>b.id === (S.dog||{}).breed) || DOG_BREEDS[0]; }
function dogCoat(){ return DOG_COATS.find(c=>c.id === (S.dog||{}).coat) || DOG_COATS[0]; }

/* repaint her: the drawing code writes the sable palette as literals, so
   the coat is applied by substitution rather than by rewriting p85's art */
const SABLE = { base:'#8a6a4a', lite:'#a07d56', dark:'#6d5238', mid:'#7a5c3f' };
if(typeof dogArt === 'function'){
  const _dogArtBase = dogArt;
  dogArt = function(){
    let s = _dogArtBase.apply(this, arguments);
    if(!s || !S.dog) return s;
    const c = dogCoat();
    if(c.id !== 'sable'){
      /* Two passes, via placeholders. Substituting straight to the new
         palette lets one rule's output be matched by the next — replace
         base with a colour that another rule also looks for and the dog
         comes out a single flat tone. */
      s = s.split(SABLE.lite).join('@@L@@')
           .split(SABLE.dark).join('@@D@@')
           .split(SABLE.mid ).join('@@M@@')
           .split(SABLE.base).join('@@B@@')
           .split('@@L@@').join(c.lite)
           .split('@@D@@').join(c.dark)
           .split('@@M@@').join(c.mid)
           .split('@@B@@').join(c.base);
    }
    const b = dogBreed();
    if(b.sc !== 1) s = s.replace('<g transform="scale(', `<g transform="scale(${b.sc}) scale(`);
    return s;
  };
}

/* ---------- choosing one ---------- */
let DOG_PICK = { breed:'collie', coat:'sable' };
G.openDogPicker = function(){
  if(S.dog) return toast('You already have a dog','bad');
  const b = DOG_BREEDS.find(x=>x.id === DOG_PICK.breed) || DOG_BREEDS[0];
  modal(`<h2>Choosing a pup</h2>
    <p class="sub">There is a litter of six up the valley, and the woman keeping them
      has no strong feelings about which one you take.</p>
    <div class="mkgrid">
      ${DOG_BREEDS.map(x=>`<button class="mkcard${x.id===DOG_PICK.breed?' on':''}"
        onclick="G.pickDog('breed','${x.id}')"><b>${x.n}</b>
        <span class="muted">${x.d}</span></button>`).join('')}
    </div>
    <h3 style="margin:14px 0 6px">Coat</h3>
    <div class="dogcoats">
      ${DOG_COATS.map(c=>`<button class="coatsw${c.id===DOG_PICK.coat?' on':''}"
        title="${c.n}" onclick="G.pickDog('coat','${c.id}')">
        <span class="sw" style="background:${c.base};border-color:${c.dark}"></span>
        <span>${c.n}</span></button>`).join('')}
    </div>
    <p class="sub" style="margin-top:12px">A ${DOG_COATS.find(c=>c.id===DOG_PICK.coat).n.toLowerCase()}
      ${b.n.toLowerCase()}. ${b.d}</p>
    <div class="mfoot">
      <button class="btn ghost" onclick="G.closeModal()">Not today</button>
      <button class="btn" ${S.cash<180?'disabled':''} onclick="G.buyDog()">Take her home — ${fmt(180)}</button>
    </div>`);
};
G.pickDog = function(what, id){ DOG_PICK[what] = id; G.openDogPicker(); };

/* the purchase carries the choice through */
if(typeof G.buyDog === 'function'){
  const _buyBase = G.buyDog;
  G.buyDog = function(){
    const had = !!S.dog;
    const r = _buyBase.apply(this, arguments);
    if(!had && S.dog){
      S.dog.breed = DOG_PICK.breed;
      S.dog.coat  = DOG_PICK.coat;
      const b = dogBreed(), c = dogCoat();
      if(typeof log === 'function')
        log(`${S.dog.name} is a ${c.n.toLowerCase()} ${b.n.toLowerCase()}.`, 'gold', 'home');
      if(typeof render === 'function') render();
      G.save && G.save();
    }
    return r;
  };
}
/* and the card in the build list opens the chooser instead of buying blind */
if(typeof renderBuild === 'function'){
  const _rbDog = renderBuild;
  renderBuild = function(){
    const r = _rbDog.apply(this, arguments);
    try{
      document.querySelectorAll('#dogcard button').forEach(btn=>{
        if(/take her home/i.test(btn.textContent) && !S.dog)
          btn.setAttribute('onclick','G.openDogPicker()');
      });
    }catch(e){}
    return r;
  };
}

/* ---------- a guest wing that guests live in ---------- */
if(typeof guestHomes === 'function'){
  guestHomes = function(){
    return (S.objs||[]).filter(o=>{
      const bp = BPMAP[o.bp]; if(!bp) return false;
      const a = bp.art || '';
      return a === 'glamping' || a === 'dome' || bp.kind === 'housing';
    });
  };
}
/* one guest per bunk, not one per building */
if(typeof guestsInit === 'function'){
  const _gInitBase = guestsInit;
  guestsInit = function(){
    const r = _gInitBase.apply(this, arguments);
    try{
      const homes = guestHomes();
      homes.forEach((h, hi)=>{
        const bp = BPMAP[h.bp] || {};
        const slots = Math.max(1, bp.slots || 1);
        const here = (S.guests||[]).filter(g=>g.home === h.id);
        if(here.length >= slots) return;
        const f = footprint(bp, h.rot);
        for(let i = here.length; i < slots; i++){
          S.guests.push({
            id: 'gst' + h.id + '_' + i,
            home: h.id,
            name: GUEST_NAMES[(S.guests.length + hi + i) % GUEST_NAMES.length],
            shirt: GUEST_SHIRTS[(S.guests.length + hi + i) % GUEST_SHIRTS.length],
            /* spread them along the frontage so three do not stand in one spot */
            x: (h.tx + f.w*((i+0.5)/slots))*T, y: (h.ty + f.h + 0.4)*T,
            dir: 1, t: Math.random()*4,
            wx: (i - (slots-1)/2) * 16, wy: (i%2)*8,
            said: 0,
          });
        }
      });
    }catch(e){}
    return r;
  };
}

/* ---------- you, in your own bed ---------- */
function yourBedSpot(){
  if(typeof bedPoint !== 'function' || !S.you) return null;
  /* p102's bedPoint reads the room plan and takes an index for the slot
     within the room. The household uses 0..n; you are the other side of
     the main bed, so slot 1 when there is a partner and slot 0 when the
     bed is yours alone. */
  const hasPartner = (S.family||[]).some(f=>f.role === 'partner');
  const me = { id:'__you', role:'you' };
  return bedPoint(me, hasPartner ? 1 : 0);
}
/* p36's youRoutine sends you to a fixed fraction of ROOMS.bedMain — the
   old six-room constant — while the household is placed by p102's
   bedPoint(), which reads the real room plan. Two systems for one bed, so
   you lay down 32px off your own pillow and on top of your partner.

   Correct the goal rather than the position: fighting it frame by frame
   just means whichever pull is larger wins, and the base's is. Here the
   sleep goal is replaced with the same bedPoint() the rest of the
   household uses, so one system places everybody and you still walk there
   normally. */
if(typeof youRoutine === 'function'){
  const _routineBase = youRoutine;
  youRoutine = function(){
    const goal = _routineBase.apply(this, arguments);
    try{
      if(goal && goal.state === 'sleep'){
        const b = yourBedSpot();
        if(b) return { x:b.x, y:b.y, act:goal.act, state:'sleep' };
      }
    }catch(e){}
    return goal;
  };
}

(function dogPickCss(){
  const s = document.createElement('style');
  s.textContent = `
  .dogcoats{ display:flex; flex-wrap:wrap; gap:8px }
  .coatsw{ display:flex; align-items:center; gap:7px; padding:6px 10px; border-radius:9px;
    background:var(--card,#1b2418); border:1px solid var(--line2,#33402c); cursor:pointer;
    color:inherit; font:inherit; font-size:12px }
  .coatsw .sw{ width:16px; height:16px; border-radius:50%; border:2px solid #000 }
  .coatsw.on{ outline:2px solid var(--gold,#d8b45a); outline-offset:1px }
  .mkcard.on{ outline:2px solid var(--gold,#d8b45a); outline-offset:1px }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.dogHomeSleepAudit = function(){
  const b = yourBedSpot();
  const partner = (S.family||[]).find(f=>f.role === 'partner');
  const pSpot = partner && typeof bedPoint === 'function' ? bedPoint(partner, 0) : null;
  return {
    dog: S.dog ? { name:S.dog.name, breed:dogBreed().n, coat:dogCoat().n } : 'no dog',
    breedsOffered: DOG_BREEDS.length, coatsOffered: DOG_COATS.length,
    guestHomes: guestHomes().map(o=>({ what:(BPMAP[o.bp]||{}).name,
      slots:(BPMAP[o.bp]||{}).slots || 1,
      living:(S.guests||[]).filter(g=>g.home === o.id).length })),
    totalGuests: (S.guests||[]).length,
    yourBed: b ? `${Math.round(b.x)},${Math.round(b.y)}` : 'none',
    youAt: S.you ? `${Math.round(S.you.x)},${Math.round(S.you.y)}` : 'nobody',
    youAsleep: (S.you||{}).state === 'sleep',
    offYourPillow: (b && S.you) ? Math.round(Math.hypot(S.you.x-b.x, S.you.y-b.y)) : null,
    apartFromPartner: (pSpot && S.you) ? Math.round(Math.hypot(S.you.x-pSpot.x, S.you.y-pSpot.y)) : null,
  };
};
