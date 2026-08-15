/* =====================================================================
   EIGHTY SETTINGS IS NOT A CHOICE, IT IS A WALL

   Counted: twelve groups and eighty-odd settings, opening on Display's
   twenty-three. A new player is asked to have an opinion on pest
   frequency, breeding frequency, weather volatility and season length
   before they have grown anything, and they have no basis for any of it.
   So they either shut the panel or fiddle and make the game worse.

   The fix is not to hide things from the starter version. Taking options
   away from somebody because they are new is a poor trade, and the moment
   they want one they cannot find it. Progressive disclosure instead:
   everything is still there, in one click, and nothing is in the way.

     Getting started   six settings, open. The ones that change how the
                       game feels rather than how it is tuned.
     Easier to use     six more, open, and open in BOTH versions. These
                       are not complexity, they are whether somebody can
                       use the thing at all — text size, contrast, motion.
                       A player who needs larger text needs it on day one
                       more than on day fifty, so this is the one group
                       that is never collapsed and never version-gated.
     everything else   the original twelve groups, collapsed.

   HOW IT IS BUILT. It re-groups the rows the existing settingsHTML has
   already rendered rather than laying them out again. p13 owns the markup
   for a switch, a slider and a segmented pick; p21 rewrites some option
   labels afterwards and p22 appends the save card. Re-implementing any of
   that here would mean two copies to keep in step, and the second one
   would drift. This parses the finished string, moves the rows, and hands
   the rest back untouched — so a setting added anywhere in the build
   lands in the right place with no change here.

   Rows are matched to keys by the setOpt call in their own markup, which
   is the only place the key survives into the DOM.
   ===================================================================== */

/* The ones worth meeting first: how it feels, not how it is tuned. */
const SET_FIRST = ['difficulty', 'dayLen', 'autoSave', 'confirmSell', 'volMaster', 'sfx'];

/* Never collapsed, never gated, in every version. */
const SET_ACCESS = ['uiScale', 'contrast', 'motion', 'particles', 'reduceBlur', 'tooltips'];

/* Which groups the player has opened. The panel is rebuilt from a string
   on every repaint, and setOpt repaints — so without this, changing one
   Display setting closed Display underneath you, every time. Kept for the
   session rather than in the save: it is a view state, not a preference. */
const SET_OPEN = new Set();
G.setGroupToggle = function(title, on){
  if(on) SET_OPEN.add(title); else SET_OPEN.delete(title);
};

/* which setting a rendered row belongs to */
function setRowKey(el){
  const m = /setOpt\('([A-Za-z0-9_]+)'/.exec(el.innerHTML || '');
  return m ? m[1] : null;
}

if(typeof settingsHTML === 'function'){
  const _settingsBase = settingsHTML;
  settingsHTML = function(){
    const html = _settingsBase.apply(this, arguments);
    try{
      const box = document.createElement('div');
      box.innerHTML = html;

      /* walk the flat sequence the base produces: a .ph heading, then its
         rows, then the next heading — and finally the restore button and
         whatever p21 and p22 have appended after it */
      const groups = [];
      const tail = [];
      let cur = null;
      [...box.children].forEach(el=>{
        if(el.classList.contains('ph')){
          cur = { title: el.innerHTML, rows: [] };
          groups.push(cur);
        } else if(el.classList.contains('setrow') && cur){
          cur.rows.push(el);
        } else {
          tail.push(el);
        }
      });
      if(!groups.length) return html;         /* markup changed — leave it alone */

      const byKey = {};
      groups.forEach(g=>g.rows.forEach(r=>{
        const k = setRowKey(r);
        if(k) byKey[k] = r;
      }));

      const pick = (keys)=>keys.map(k=>byKey[k]).filter(Boolean);
      const first  = pick(SET_FIRST);
      const access = pick(SET_ACCESS);
      const moved  = new Set([...first, ...access]);

      const wrap = (nodes)=>nodes.map(n=>n.outerHTML).join('');
      let out = '';

      if(first.length)
        out += `<div class="ph">Getting started</div>${wrap(first)}`;
      if(access.length)
        out += `<div class="ph">Easier to use</div>
          <div class="muted setnote">Text size, contrast and motion. Always here, in both
            versions — these are not extras.</div>${wrap(access)}`;

      /* the rest, collapsed, in the order the build declared them */
      const rest = groups
        .map(g=>({ title:g.title, rows:g.rows.filter(r=>!moved.has(r)) }))
        .filter(g=>g.rows.length);
      if(rest.length){
        out += `<div class="ph setmore">Everything else</div>`;
        out += rest.map(g=>{
          const t = g.title.replace(/"/g, '&quot;');
          return `<details class="setgrp"${SET_OPEN.has(g.title) ? ' open' : ''}
            ontoggle="G.setGroupToggle('${t}', this.open)">
            <summary><span>${g.title}</span><span class="setcount">${g.rows.length}</span></summary>
            <div class="setgrpbody">${wrap(g.rows)}</div></details>`;
        }).join('');
      }

      return out + tail.map(n=>n.outerHTML).join('');
    }catch(e){ return html; }
  };
}

(function settingsCss(){
  const s = document.createElement('style');
  s.textContent = `
  .setnote{ font-size:11.5px; padding:0 12px 6px; line-height:1.5; }
  .ph.setmore{ margin-top:10px; }
  .setgrp{ border-top:1px solid var(--line); }
  .setgrp > summary{ list-style:none; cursor:pointer; padding:10px 12px;
    display:flex; align-items:center; gap:8px; font-size:12px; font-weight:650;
    color:var(--ink2); user-select:none; }
  .setgrp > summary::-webkit-details-marker{ display:none; }
  .setgrp > summary::before{ content:'▸'; font-size:10px; color:var(--ink3);
    transition:transform .16s ease; }
  .setgrp[open] > summary::before{ transform:rotate(90deg); }
  .setgrp > summary:hover{ color:var(--ink); }
  .setgrp > summary > span:first-of-type{ flex:1; }
  .setcount{ font-size:10.5px; font-weight:600; color:var(--ink3);
    background:rgba(255,255,255,.06); border-radius:999px; padding:1px 7px; }
  .setgrp[open] > summary{ color:var(--ink); }
  .setgrpbody{ padding-bottom:4px; }
  @media (prefers-reduced-motion: reduce){ .setgrp > summary::before{ transition:none } }
  `;
  document.head.appendChild(s);
})();

/* ---------- handle ---------- */
G.settingsAudit = function(){
  const box = document.createElement('div');
  try{ box.innerHTML = settingsHTML(); }catch(e){ return { error:e.message }; }
  const open = [...box.querySelectorAll('.ph')].map(p=>p.textContent.trim());
  const groups = [...box.querySelectorAll('.setgrp')].map(d=>({
    group: d.querySelector('summary span').textContent.trim(),
    settings: d.querySelectorAll('.setrow').length,
    collapsedByDefault: !d.hasAttribute('open'),
  }));
  const shown = box.querySelectorAll('.setrow').length;
  const openRows = [...box.children].filter(el=>el.classList && el.classList.contains('setrow')).length;
  return {
    totalSettings: shown,
    visibleWithoutClicking: openRows,
    openSections: open,
    collapsedGroups: groups,
    accessAlwaysOpen: SET_ACCESS.filter(k=>box.innerHTML.indexOf(`setOpt('${k}'`) >= 0).length
      + ' of ' + SET_ACCESS.length,
    tailKept: /resetSettings/.test(box.innerHTML) && /exportSave/.test(box.innerHTML),
  };
};
