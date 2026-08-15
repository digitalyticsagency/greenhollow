/* =====================================================================
   THE MARKET IS FOUR THINGS IN ONE SCROLL

   Measured on a farm with stock to enter: the dialog runs to 1221px of
   content inside a 619px window. You see the judging and half the
   sideshow, and everything else — the relief fund, the supplies stall,
   the last five games — is below the fold with nothing to say it is
   there. Four separate activities stacked into one column.

   They are not sections of one thing, they are four things you go to a
   market to do, so they get tabs rather than the collapse the settings
   panel got. Collapsing suits a list you scan; tabs suit a place you
   arrive at knowing what you came for.

   THE TAB HAS TO SURVIVE A GAME. Every sideshow game ends by calling
   G.openMarket to get back, so without remembering the tab you would play
   the bale toss, come back, and land on Judging with the sideshow out of
   sight again. It reopens where you left it.

   COUNTS ON THE TABS, and they count what is still open to you rather
   than what exists — a game you have played today is disabled, so a
   sideshow reading 0 means you are done there rather than that it is
   empty. That is the number worth having on a market that runs five days.

   BUILT BY MOVING THE RENDERED NODES, not by re-authoring the sections.
   The base owns judging and the relief fund, p44 the supplies stall, p46
   five of the seven games, p47 the line about the common. Six modules
   write into this dialog. Re-laying it out here would mean re-declaring
   all of that, and it would drift the first time any of them changed.
   The nodes are moved into panels with their handlers attached, so the
   buttons are the same buttons.
   ===================================================================== */

let MKTAB = null;                 /* the tab you were last on, for the session */

function mktabLabel(h4){
  const t = (h4.textContent || '').trim();
  /* the fund's full name is too long for a tab */
  return /relief/i.test(t) ? 'Relief fund' : t;
}

/* what is still open to you in a section, which is not the same as how
   many things are in it */
function mktabOpenCount(nodes){
  let n = 0;
  nodes.forEach(el=>{
    el.querySelectorAll('button').forEach(b=>{ if(!b.disabled) n++; });
  });
  return n;
}

G.mktabPick = function(i){
  MKTAB = i;
  const wrap = document.getElementById('mktabs');
  if(!wrap) return;
  [...wrap.querySelectorAll('.chip')].forEach((c, n)=>c.classList.toggle('on', n === i));
  [...document.querySelectorAll('.mktabpanel')].forEach((p, n)=>{
    p.style.display = n === i ? '' : 'none';
  });
};

if(typeof G.openMarket === 'function'){
  const _openMarketTabs = G.openMarket;
  G.openMarket = function(){
    const r = _openMarketTabs.apply(this, arguments);
    try{
      const body = document.getElementById('modalBody');
      if(!body || body.querySelector('#mktabs')) return r;

      const kids = [...body.children];
      const firstH4 = kids.findIndex(el=>el.tagName === 'H4');
      if(firstH4 < 0) return r;                 /* not the market, or it changed */

      const head = kids.slice(0, firstH4);
      const foot = kids.filter(el=>el.classList && el.classList.contains('mfoot'));
      const sections = [];
      let cur = null;
      kids.slice(firstH4).forEach(el=>{
        if(el.classList && el.classList.contains('mfoot')) return;
        if(el.tagName === 'H4'){ cur = { h4:el, nodes:[] }; sections.push(cur); }
        else if(cur) cur.nodes.push(el);
      });
      if(sections.length < 2) return r;         /* nothing to gain from one tab */

      /* rebuild: head, tab bar, one panel each, foot */
      body.innerHTML = '';
      head.forEach(el=>body.appendChild(el));

      const bar = document.createElement('div');
      bar.id = 'mktabs';
      bar.className = 'filters mktabbar';
      body.appendChild(bar);

      sections.forEach((s, i)=>{
        const panel = document.createElement('div');
        panel.className = 'mktabpanel';
        s.nodes.forEach(n=>panel.appendChild(n));
        body.appendChild(panel);

        const open = mktabOpenCount(s.nodes);
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.innerHTML = `${mktabLabel(s.h4)}${open ? ` <span class="mkcount">${open}</span>` : ''}`;
        chip.onclick = ()=>G.mktabPick(i);
        bar.appendChild(chip);
      });

      foot.forEach(el=>body.appendChild(el));

      /* back to where you were, or the first tab with something left to do */
      let start = (MKTAB !== null && MKTAB < sections.length) ? MKTAB : -1;
      if(start < 0) start = sections.findIndex(s=>mktabOpenCount(s.nodes) > 0);
      G.mktabPick(start < 0 ? 0 : start);
    }catch(e){}
    return r;
  };
}

(function mktabCss(){
  const s = document.createElement('style');
  s.textContent = `
  .mktabbar{ margin:14px 0 4px; }
  .mktabpanel > h4:first-child{ margin-top:6px; }
  .mkcount{ display:inline-block; min-width:15px; margin-left:4px; padding:0 4px;
    border-radius:999px; background:rgba(0,0,0,.28); font-size:10px; font-weight:700; }
  .chip.on .mkcount{ background:rgba(0,0,0,.22); }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.marketTabAudit = function(){
  const body = document.getElementById('modalBody');
  const bar = document.getElementById('mktabs');
  if(!bar) return { tabbed:false, note:'the market dialog is not open' };
  const panels = [...document.querySelectorAll('.mktabpanel')];
  return {
    tabbed:true,
    tabs: [...bar.querySelectorAll('.chip')].map(c=>c.textContent.trim()),
    onTab: MKTAB,
    panelsShowing: panels.filter(p=>p.style.display !== 'none').length,
    buttonsTotal: body ? body.querySelectorAll('button').length : 0,
    dialogHeight: body ? body.scrollHeight : 0,
    windowCap: Math.round(window.innerHeight * 0.86),
    stillScrolls: body ? body.scrollHeight > window.innerHeight*0.86 : null,
  };
};
