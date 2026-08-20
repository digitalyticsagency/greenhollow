/* =====================================================================
   TAKE THE DAY AS SOMEBODY ELSE

   Everything the player does goes through one door: goDo(obj, kind, fn)
   paths S.you to the thing and runs the job on arrival. Every button, every
   click on a bed, every collection. That makes "play as anyone" a question
   about who S.you *is*, rather than a second control system bolted on
   beside the first.

   So you swap bodies. Pick your partner, a farmhand or the WWOOFer and you
   become them: your clicks path them, the camera follows them, their name
   is over their head, and every existing job in the game works unchanged
   because none of it knows anything happened.

   AND THE ONE YOU LEFT CARRIES ON. Your own body does not vanish while you
   are somebody else — it is handed to the same routine that runs everyone
   else, so you can look across the yard and watch yourself tending the
   beds. Come back and you step into it again, wherever it has got to.

   The person you are wearing is taken off their routine for as long as you
   have them, which is the honest trade: you get their hands, and the farm
   loses whatever they would have done with them. Switch to the hand who
   was minding the dairy and the batch stops being minded.

   Nothing here is a second simulation. It is one identity swap, applied to
   the one function everything already went through.
   ===================================================================== */

function paState(){
  if(!S.playas) S.playas = { who:'__self', parked:null };
  return S.playas;
}
/* everyone you could be */
function bodies(){
  const out = [];
  (S.family || []).forEach(f=>{ if(f.id !== '__self') out.push({ id:f.id, name:f.name,
    role:f.role, p:f }); });
  (S.workers || []).forEach(w=>out.push({ id:w.id, name:w.name,
    role:w.wwoof ? 'working visitor' : 'farmhand', p:w }));
  return out;
}
function findBody(id){ return bodies().find(b=>b.id === id) || null; }

/* the look of whoever you are, so the avatar reads as them */
function wearAppearance(src){
  if(!S.you) return;
  S.you.name = src.name;
  S.you.shirt = src.shirt || S.you.shirt;
  S.you.sc = src.sc || S.you.sc;
  S.you.wearing = src.id || null;
}

G.playAs = function(id){
  const P = paState();
  if(P.who === id) return;
  youInit();

  /* going back to yourself */
  if(id === '__self'){
    const parked = P.parked;
    /* put the borrowed body back where it stands, and let it resume */
    if(parked && parked.borrowedId){
      const b = findBody(parked.borrowedId);
      if(b){ b.p.x = S.you.x; b.p.y = S.you.y; b.p.controlled = 0; b.p.path = []; }
    }
    /* step back into your own, wherever it walked to */
    const self = (S.family || []).find(f=>f.id === '__self');
    if(self){ S.you.x = self.x; S.you.y = self.y; }
    S.family = (S.family || []).filter(f=>f.id !== '__self');
    if(parked && parked.self) wearAppearance(parked.self);
    S.you.path = []; S.you.job = null; S.you.state = 'idle';
    P.who = '__self'; P.parked = null;
    if(typeof log === 'function') log('You are yourself again.', '', 'home');
  } else {
    const b = findBody(id);
    if(!b) return;
    /* park your own body as somebody the routine will look after */
    if(P.who === '__self'){
      P.parked = {
        self: { id:null, name:S.you.name || 'You', shirt:S.you.shirt, sc:S.you.sc },
        borrowedId: null,
      };
      S.family = S.family || [];
      if(!S.family.some(f=>f.id === '__self'))
        S.family.push({ id:'__self', role:'adult',
          name:(P.parked.self.name || 'You'), shirt:P.parked.self.shirt || '#7d5f4a',
          sc:P.parked.self.sc || 1, hat:null, x:S.you.x, y:S.you.y, t:0, dir:1 });
    } else {
      /* stepping straight from one body to another: hand the last one back */
      const prev = findBody(P.parked && P.parked.borrowedId);
      if(prev){ prev.p.x = S.you.x; prev.p.y = S.you.y; prev.p.controlled = 0; }
    }
    /* wear them */
    S.you.x = b.p.x; S.you.y = b.p.y;
    S.you.path = []; S.you.job = null; S.you.state = 'idle';
    b.p.controlled = 1;
    wearAppearance({ id:b.id, name:b.name, shirt:b.p.shirt, sc:b.p.sc });
    P.parked = P.parked || { self:null, borrowedId:null };
    P.parked.borrowedId = b.id;
    P.who = id;
    if(typeof log === 'function')
      log(`You are working as ${b.name} for the moment. Your own day carries on without you.`,
        'gold', 'home');
  }
  try{ if(typeof G.focusAt === 'function') G.focusAt(S.you.x, S.you.y); }catch(e){}
  try{ render(); ui(); paintPeople(); }catch(e){}
  G.closeModal();
};

/* a borrowed body does not run its own routine — you are using its hands */
if(typeof routine === 'function'){
  const _routinePA = routine;
  routine = function(p){
    if(p && p.controlled) return { x:p.x, y:p.y, act:'with you', state:'idle' };
    return _routinePA.apply(this, arguments);
  };
}
/* and it is not drawn twice: the avatar is standing in for it */
if(typeof paintPeople === 'function'){
  const _paintPA = paintPeople;
  paintPeople = function(){
    const r = _paintPA.apply(this, arguments);
    try{
      bodies().forEach(b=>{
        const el = document.querySelector(`[data-p="${b.id}"]`);
        if(!el) return;
        if(b.p.controlled){ el.style.display = 'none'; }
        else if(el.style.display === 'none' && !el.dataset.shrouded) el.style.display = '';
      });
    }catch(e){}
    return r;
  };
}

/* ---------- the panel ---------- */
G.openPlayAs = function(){
  const P = paState();
  const list = bodies();
  modal(`<h2>Whose day is it?</h2>
    <p class="sub">Take anyone's hands for a while. Your own day carries on without you —
      you can watch yourself getting on with it — and whoever you borrow stops doing
      whatever they were doing.</p>
    <div class="mkgrid">
      <button class="mkcard${P.who === '__self' ? ' on' : ''}" onclick="G.playAs('__self')">
        <b>Yourself</b>
        <span class="muted">${P.who === '__self' ? 'This is you.' : 'Step back into your own day.'}</span>
        <span class="lprice">${P.who === '__self' ? 'Current' : 'Go back'}</span></button>
      ${list.map(b=>`<button class="mkcard${P.who === b.id ? ' on' : ''}"
        onclick="G.playAs('${b.id}')">
        <b>${b.name}</b>
        <span class="muted">${b.role}${b.p.wwoof ? ` · from ${b.p.wwoof.from}` : ''}${
          b.p.skill !== undefined ? ` · skill ${(+b.p.skill).toFixed(1)}` : ''}<br>
          ${b.p.controlled ? 'You are wearing this one.' : (b.p.act || 'about the place')}</span>
        <span class="lprice">${P.who === b.id ? 'Current' : 'Be them'}</span></button>`).join('')}
    </div>
    ${list.length ? '' : '<p class="sub">There is nobody else here yet.</p>'}
    <div class="mfoot"><button class="btn ghost" onclick="G.closeModal()">Close</button></div>`);
};

/* into the household roster, which is where you already look for people */
if(typeof G.openHousehold === 'function'){
  const _openHouseholdPA = G.openHousehold;
  G.openHousehold = function(){
    const r = _openHouseholdPA.apply(this, arguments);
    try{
      const foot = document.querySelector('.mfoot');
      if(foot && !document.getElementById('pabtn2')){
        const b = document.createElement('button');
        b.id = 'pabtn2'; b.className = 'btn';
        b.textContent = 'Be somebody else';
        b.onclick = ()=>G.openPlayAs();
        foot.insertBefore(b, foot.firstChild);
      }
    }catch(e){}
    return r;
  };
}
if(typeof syncWorldButtons === 'function'){
  const _syncPA = syncWorldButtons;
  syncWorldButtons = function(){
    const r = _syncPA.apply(this, arguments);
    try{
      const host = document.getElementById('zoomctl');
      if(host && !document.getElementById('pabtn')){
        const b = document.createElement('button');
        b.id = 'pabtn'; b.textContent = '🔄';
        b.title = 'Whose day is it?';
        b.setAttribute('data-tip','<b>Whose day is it?</b>Take anyone&rsquo;s hands for a while.');
        b.onclick = ()=>G.openPlayAs();
        host.insertBefore(b, host.firstChild);
      }
      const b2 = document.getElementById('pabtn');
      if(b2) b2.style.display = bodies().length ? '' : 'none';
    }catch(e){}
    return r;
  };
}

/* ---------- handle ---------- */
G.playAsAudit = function(){
  const P = paState();
  const b = P.who === '__self' ? null : findBody(P.who);
  return {
    playingAs: P.who === '__self' ? 'yourself' : (b ? b.name + ' (' + b.role + ')' : P.who),
    avatarNamed: (S.you || {}).name,
    avatarAt: S.you ? `${Math.round(S.you.x)},${Math.round(S.you.y)}` : '-',
    borrowedBodyHidden: b ? !!b.p.controlled : 'n/a',
    yourOwnBodyParked: (S.family || []).some(f=>f.id === '__self'),
    yourOwnBodyDoing: ((S.family || []).find(f=>f.id === '__self') || {}).act || '-',
    switchable: bodies().map(x=>x.name + ' (' + x.role + ')'),
  };
};
