/* =====================================================================
   CAREER & ECONOMY — you work from home. Money arrives monthly, but so
   do the bills, and every hour spent earning is an hour not farmed.
   ===================================================================== */

/* 112 work-from-home professions.
   [name, field, base monthly pay, hours/week, skill ceiling]         */
const PROF_RAW = [
['Digital marketing specialist','Marketing',5200,32,9],
['SEO consultant','Marketing',5400,30,9],
['Paid media buyer','Marketing',6100,34,9],
['Email marketing manager','Marketing',4900,32,8],
['Content strategist','Marketing',5000,30,8],
['Social media manager','Marketing',3900,34,7],
['Marketing analyst','Marketing',5300,34,8],
['Brand strategist','Marketing',6200,28,9],
['Affiliate manager','Marketing',4600,30,7],
['Conversion rate optimiser','Marketing',5900,28,9],
['Marketing automation specialist','Marketing',5700,32,8],
['Community manager','Marketing',3600,32,6],
['Influencer partnerships lead','Marketing',4400,30,7],
['Product marketing manager','Marketing',6800,36,10],
['Growth lead','Marketing',7200,38,10],
['Frontend developer','Engineering',6600,36,10],
['Backend developer','Engineering',7000,36,10],
['Full-stack developer','Engineering',7400,38,11],
['Mobile app developer','Engineering',7100,36,10],
['DevOps engineer','Engineering',7800,38,11],
['Site reliability engineer','Engineering',8200,40,11],
['QA automation engineer','Engineering',5800,34,9],
['Data engineer','Engineering',7600,36,11],
['Machine learning engineer','Engineering',8600,38,12],
['Security engineer','Engineering',8000,38,11],
['Cloud architect','Engineering',8800,38,12],
['Database administrator','Engineering',6400,34,9],
['Embedded systems developer','Engineering',6900,36,10],
['Game developer','Engineering',6200,38,10],
['WordPress developer','Engineering',4200,30,7],
['Shopify developer','Engineering',4800,30,8],
['Technical writer','Engineering',5100,30,8],
['Solutions architect','Engineering',8400,38,12],
['Data analyst','Data',5500,34,9],
['Data scientist','Data',7700,36,11],
['Business intelligence developer','Data',6300,34,10],
['Analytics engineer','Data',6700,34,10],
['Research analyst','Data',4900,32,8],
['Statistician','Data',6100,32,10],
['Quantitative analyst','Data',8900,40,12],
['UX designer','Design',6000,34,9],
['UI designer','Design',5600,32,9],
['Product designer','Design',6800,34,10],
['Graphic designer','Design',4100,32,7],
['Motion designer','Design',5200,32,8],
['Illustrator','Design',3900,30,7],
['3D artist','Design',5400,34,9],
['Brand identity designer','Design',5800,30,9],
['Design systems lead','Design',7300,36,11],
['UX researcher','Design',6100,32,9],
['Video editor','Media',4300,34,7],
['Podcast producer','Media',4000,30,7],
['Audio engineer','Media',4500,32,8],
['Animator','Media',5000,34,8],
['Photographer / retoucher','Media',3800,28,7],
['Screenwriter','Media',4700,28,8],
['YouTube channel producer','Media',4200,34,8],
['Voice-over artist','Media',3700,24,7],
['Copywriter','Writing',4400,30,8],
['UX writer','Writing',5500,30,9],
['Technical documentation writer','Writing',5000,32,8],
['Grant writer','Writing',4800,28,8],
['Editor / proofreader','Writing',3600,30,6],
['Ghostwriter','Writing',5200,28,9],
['Journalist','Writing',4100,32,7],
['Translator','Writing',3900,30,7],
['Localisation specialist','Writing',4600,30,8],
['Bookkeeper','Finance',3800,30,6],
['Accountant','Finance',5700,34,9],
['Financial analyst','Finance',6900,36,10],
['Tax preparer','Finance',4500,28,7],
['Payroll specialist','Finance',4200,32,7],
['Financial controller','Finance',8100,38,11],
['Insurance underwriter','Finance',5600,34,9],
['Mortgage broker','Finance',6200,32,9],
['Credit analyst','Finance',5800,34,9],
['Customer support agent','Support',3100,34,5],
['Technical support engineer','Support',4600,34,8],
['Customer success manager','Support',5400,34,9],
['Account manager','Support',5200,34,8],
['Sales development rep','Sales',4300,36,7],
['Account executive','Sales',6600,38,10],
['Sales engineer','Sales',7100,36,10],
['Partnerships manager','Sales',6000,32,9],
['E-commerce manager','Sales',5500,34,9],
['Dropshipping operator','Sales',3400,30,6],
['Amazon FBA seller','Sales',4000,32,7],
['Online tutor','Education',3300,26,6],
['Curriculum designer','Education',5100,30,8],
['Instructional designer','Education',5600,32,9],
['Language teacher','Education',3200,28,6],
['Course creator','Education',4700,30,8],
['Academic researcher','Education',5300,34,9],
['Corporate trainer','Education',5900,30,9],
['Virtual assistant','Admin',2900,32,5],
['Executive assistant','Admin',4100,34,7],
['Project manager','Admin',6300,36,10],
['Scrum master','Admin',6700,34,10],
['Operations manager','Admin',6500,36,10],
['Recruiter','Admin',5000,34,8],
['HR generalist','Admin',4900,34,8],
['Data entry specialist','Admin',2600,30,4],
['Transcriptionist','Admin',2800,28,4],
['Medical coder','Health',4400,32,7],
['Telehealth counsellor','Health',5800,30,9],
['Nutrition coach','Health',3500,26,6],
['Medical writer','Health',6100,32,10],
['Health data analyst','Health',5700,34,9],
['Paralegal','Legal',4500,32,7],
['Contract reviewer','Legal',5900,32,9],
['Compliance analyst','Legal',6200,34,10],
['Patent researcher','Legal',6400,32,10],
['Etsy craft seller','Craft',2700,26,5],
['Pattern designer','Craft',3100,26,6],
['Print-on-demand designer','Craft',3000,28,6],
];
const PROFS = PROF_RAW.map((p,i)=>({
  id:'p'+i, name:p[0], field:p[1], pay:p[2], hrs:p[3], ceil:p[4]
}));
const FIELDS = Array.from(new Set(PROFS.map(p=>p.field)));

/* --- hours: the real currency. Every farm job costs time. --- */
const HOURS_PER_DAY = 10;
const TASK_HOURS = {
  plant:0.4, water:0.25, harvest:0.6, collect:0.35, clean:0.5,
  weed:0.4, manure:0.3, build:1.2, upgrade:1.5, craft:0.2, vet:0.3
};

function careerInit(){
  if(S.career) return;
  S.career = {
    profId:'p0', skill:1, cxp:0, hours:HOURS_PER_DAY, worked:0,
    salaryDay:30, loan:0, rate:0.045, jobs:[], hired:0, burnout:0
  };
}
function prof(){ careerInit(); return PROFS.find(p=>p.id===S.career.profId) || PROFS[0]; }

/* pay scales with skill, but each level costs more xp than the last */
function salary(){
  const p = prof(), c = S.career;
  return Math.round(p.pay * (0.55 + c.skill*0.16) * (1 - c.burnout*0.3));
}
function skillNext(){ return Math.round(120*Math.pow(S.career.skill,1.5)); }

/* --- monthly outgoings: this is what keeps the game honest --- */
function outgoings(){
  careerInit();
  const built = S.objs.filter(o=>BPMAP[o.bp].kind!=='decor').length;
  const tiers = S.objs.reduce((a,o)=>a+tOf(o),0);
  const rates   = Math.round(120 + built*26 + tiers*34);            // council rates on what you own
  const upkeep  = Math.round(S.objs.reduce((a,o)=>a+(BPMAP[o.bp].cost||0)*0.012,0));
  const wages   = S.career.hired*1400;
  const interest= Math.round(S.career.loan * S.career.rate);
  const ai      = (typeof autoFees==='function' ? autoFees()*30 : 0);
  return {rates, upkeep, wages, interest, ai, total: rates+upkeep+wages+interest+ai};
}

/* --- client work: spend hours today, get paid now --- */
function rollJobs(){
  careerInit();
  const p = prof();
  const kinds = [
    ['Quick audit', 0.6, 0.5], ['Campaign sprint', 1.6, 1.5], ['Retainer block', 3.2, 3.0],
    ['Rush job', 1.0, 0.8], ['Strategy session', 1.2, 1.0], ['Full project', 5.0, 4.5]
  ];
  const clients = ['Halcyon Co','Nordvik','Bright & Vane','Merrow Labs','Pike Street','Ashgrove',
                   'Tenby Group','Kestrel Media','Lumen Works','Orchid Digital'];
  while(S.career.jobs.length < 4){
    const k = kinds[Math.floor(Math.random()*kinds.length)];
    const hrs = +(k[1]*(0.75+Math.random()*0.6)).toFixed(1);
    const rate = (p.pay/160) * (1 + S.career.skill*0.13) * (0.9+Math.random()*0.5);
    S.career.jobs.push({
      id:'j'+Date.now()+Math.random().toString(36).slice(2,6),
      who: clients[Math.floor(Math.random()*clients.length)],
      kind: k[0], hrs, pay: Math.round(rate*hrs*8), left: 2+Math.floor(Math.random()*4)
    });
  }
}
function takeJob(id){
  careerInit();
  const j = S.career.jobs.find(z=>z.id===id); if(!j) return;
  if(S.career.hours < j.hrs) return toast(`Only ${S.career.hours.toFixed(1)}h left today`,'bad'), sfx('error');
  S.career.hours -= j.hrs; S.career.worked += j.hrs;
  S.cash += j.pay; S.totalEarned += j.pay;
  S.career.cxp += Math.round(j.hrs*9);
  while(S.career.cxp >= skillNext() && S.career.skill < prof().ceil){
    S.career.cxp -= skillNext(); S.career.skill++;
    toast(`${prof().name} — skill level ${S.career.skill}`,'gold'); sfx('level');
  }
  S.career.jobs = S.career.jobs.filter(z=>z.id!==id);
  rollJobs();
  sfx('coin');
  log(`${j.kind} for ${j.who}: ${j.hrs}h → ${fmt(j.pay)}.`,'gold');
  ui(); G.save();
}
/* farm work also draws down the same clock */
function spendHours(kind){
  careerInit();
  const h = TASK_HOURS[kind] || 0.3;
  S.career.hours = Math.max(0, S.career.hours - h);
  return h;
}
function hoursLeft(){ careerInit(); return S.career.hours; }

/* --- payday and bills, once a month --- */
function monthlyReckoning(){
  careerInit();
  const c = S.career;
  const pay = salary();
  const out = outgoings();
  S.cash += pay;  S.totalEarned += pay;
  S.cash -= out.total;
  if(c.loan > 0){
    const repay = Math.min(c.loan, Math.round(c.loan*0.08));
    if(S.cash > repay){ S.cash -= repay; c.loan -= repay; }
  }
  log(`Payday: ${fmt(pay)} salary. Bills: ${fmt(out.total)}.`, pay>out.total?'gold':'bad');
  toast(`Payday ${fmt(pay)} · bills ${fmt(out.total)}`, pay>out.total?'gold':'bad');
  sfx(pay>out.total?'sell':'error');
  /* overwork burns you out and cuts your pay until you rest */
  const avgWorked = c.worked/30;
  c.burnout = clamp(avgWorked > 6 ? c.burnout+0.15 : c.burnout-0.2, 0, 0.6);
  if(c.burnout > 0.35) log('You are overworked — your pay is suffering. Farm more, bill less.','bad');
  c.worked = 0;
  if(S.cash < 0){
    const need = Math.ceil(-S.cash/500)*500;
    c.loan += need; S.cash += need;
    log(`Overdrawn — the bank extended ${fmt(need)} of credit at 4.5%/mo.`,'bad');
    toast('You went into debt','bad');
  }
}
function borrow(amt){
  careerInit();
  const limit = 6000 + S.lvl*1500;
  if(S.career.loan + amt > limit) return toast(`Credit limit is ${fmt(limit)}`,'bad'), sfx('error');
  S.career.loan += amt; S.cash += amt; sfx('coin');
  log(`Borrowed ${fmt(amt)} at 4.5% a month.`,'gold'); ui(); G.save();
}
function repay(amt){
  careerInit();
  amt = Math.min(amt, S.career.loan, S.cash);
  if(amt <= 0) return sfx('error');
  S.career.loan -= amt; S.cash -= amt; sfx('coin');
  log(`Repaid ${fmt(amt)} of debt.`); ui(); G.save();
}
function switchProf(id){
  careerInit();
  const p = PROFS.find(z=>z.id===id); if(!p) return;
  const cost = Math.round(p.pay*0.6);
  if(S.cash < cost) return toast(`Retraining costs ${fmt(cost)}`,'bad'), sfx('error');
  S.cash -= cost;
  S.career.profId = id;
  S.career.skill = Math.max(1, Math.floor(S.career.skill*0.6));
  S.career.cxp = 0; S.career.jobs = []; rollJobs();
  sfx('upgrade'); toast(`Now working as: ${p.name}`,'gold');
  log(`Retrained as ${p.name} for ${fmt(cost)}.`,'gold');
  ui(); G.save();
}

/* called once per game day */
function careerDay(){
  careerInit();
  const c = S.career;
  c.hours = HOURS_PER_DAY * (1 - c.burnout*0.25);
  c.jobs.forEach(j=>j.left--);
  c.jobs = c.jobs.filter(j=>j.left>0);
  rollJobs();
  if(S.day % c.salaryDay === 0) monthlyReckoning();
}
