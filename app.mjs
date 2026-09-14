import {SEASONS,ZONE,localDay,parseDay,holidays,nextHoliday,occurrence,daysUntil,dailyPicks,newCard,winningLines,availabilityState} from './core.mjs';
const $ = id => document.getElementById(id);
let movies=[],availability={movies:{}},active,card=[],marked=new Set([12]),previewDay=null,manualSeason='auto',lastDay=localDay();
const fmt = day => new Intl.DateTimeFormat('en-CA',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(parseDay(day));
const safeURL = url => {try {const u=new URL(url);return u.protocol==='https:'?u.href:null;}catch{return null;}};
function node(tag,text,cls) {const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function external(text,url,cls) {const a=node('a',text,cls);a.href=safeURL(url)||'https://www.justwatch.com/ca';a.target='_blank';a.rel='noopener noreferrer';return a;}
function day() {return previewDay||localDay();}
function showError(message) {$('app-error').textContent=message;$('app-error').hidden=false;}
function switchView(view) {
 for(const name of ['movies','bingo','calendar']) $('view-'+name).hidden=name!==view;
 document.querySelectorAll('.tab').forEach(b=>{const on=b.dataset.view===view;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
}
function renderSeason() {
 const today=day();
 const next=manualSeason==='auto'?nextHoliday(today):occurrence(manualSeason,today);
 const changed=!active||next.id!==active.id;
 active=next;
 document.documentElement.style.setProperty('--season',active.color);
 document.body.classList.toggle('reflective',!!active.quiet);
 $('season-kicker').textContent=manualSeason==='auto'?'NEXT ON THE CALENDAR':'SEASON PREVIEW';
 $('season-title').textContent=active.name;
 $('season-caption').textContent=active.caption;
 $('season-icon').textContent=active.icon;
 $('season-motif').textContent=active.motif;
 const countdown=daysUntil(today,active.date);
 $('season-meta').replaceChildren(node('span',fmt(active.date),'pill'),...active.kind.map(t=>node('span',t,'pill')),node('span',countdown===0?'Today':`${countdown} ${countdown===1?'day':'days'} to go`,'countdown'));
 $('date-preview').value=today;
 $('cycle-status').textContent=previewDay?`Previewing ${fmt(today)}. Availability reflects actual checks, not this preview date.`:`Calendar and daily picks follow Atlantic time (${ZONE}).`;
 $('occasion-note').hidden=!active.note;
 $('occasion-note').textContent=active.note||'';
 $('bingo-title').textContent=active.quiet?'Reflective viewing card':`${active.short||active.name} Bingo`;
 $('bingo-help').textContent=active.quiet?'An optional card for noticing storytelling details. Use it at your own pace, or stay with the film lineup.':'Mark a trope when it appears. Five in a row, column, or diagonal makes Bingo.';
 if(changed) shuffleCard();
 renderMovies();renderCalendar();
}
function offerNode(offer) {
 const a=external('',offer.url,'offer');a.append(node('span',offer.provider),node('span',` · ${offer.type}`,'offer-type'));return a;
}
function movieCard(id,index) {
 const m=movies.find(m=>m.id===id);if(!m)return node('p','This film is being updated.');
 const record=availability.movies?.[id];const status=availabilityState(record);
 const c=node('article',undefined,'movie-card');
 const top=node('div',undefined,'movie-topline');top.append(node('span',String(index+1).padStart(2,'0'),'movie-number'),node('span',m.label));
 c.append(top,node('h3',m.title),node('div',[m.year,m.genre,m.runtime].filter(Boolean).join(' · '),'movie-year'),node('p',m.description,'movie-description'));
 const section=node('div',undefined,'offer-section');
 section.append(node('span',status==='stale'?'LAST KNOWN CANADIAN OPTIONS':'WHERE TO WATCH · CANADA','offer-label'));
 const offers=record?.offers||[];
 if(offers.length) {
  const first=node('div',undefined,'offers');offers.slice(0,3).forEach(o=>first.append(offerNode(o)));section.append(first);
  if(offers.length>3){const details=node('details',undefined,'offer-extra');details.append(node('summary',`+ ${offers.length-3} more viewing options`));const rest=node('div',undefined,'offers');offers.slice(3).forEach(o=>rest.append(offerNode(o)));details.append(rest);section.append(details);}
 } else section.append(node('p',status==='empty'?'No Canadian offers were listed at the last check.':'Canadian availability could not be confirmed. Open the source for current options.','empty-offers'));
 let label=record?.checkedAt?`Checked ${fmt(record.checkedAt.slice(0,10))}`:'Not yet verified';
 if(status==='stale')label+=' · Recheck needed';
 if(m.source==='nfb')label+=' · NFB player page; confirm playback on NFB';
 section.append(node('p',label,`check-date ${status==='stale'?'stale':''}`),external(m.source==='nfb'?'Open NFB film page ↗':m.source==='cbc'?'Watch on CBC Gem ↗':'View current options on JustWatch ↗',m.url,'source-link'));
 c.append(section);return c;
}
function renderMovies() {
 $('lineup-date').textContent=fmt(day());
 $('lineup-title').textContent=active.quiet?'Stories to make time for':'A seasonal triple feature';
 $('lineup-intro').textContent=active.featured?`Blood Quantum leads the programme; two more films rotate daily. Explore all ${active.pool.length} films below.`:`Three daily picks for ${active.short||active.name}. Explore all ${active.pool.length} films below.`;
 $('movie-grid').replaceChildren(...dailyPicks(active,day()).map(movieCard));
 $('collection-grid').replaceChildren(...active.pool.map(movieCard));
 $('collection-count').textContent=`(${active.pool.length} films)`;
}
function renderCalendar() {
 const y=parseDay(day()).getUTCFullYear();
 const list=[...holidays(y),...holidays(y+1)].filter(h=>h.date>=day()).slice(0,16);
 $('holiday-list').replaceChildren(...list.map(h=>{
  const b=node('button',undefined,'holiday-item');b.type='button';b.classList.toggle('selected',h.id===active.id);b.setAttribute('aria-pressed',String(h.id===active.id));
  const icon=node('span',h.icon,'holiday-icon');icon.setAttribute('aria-hidden','true');const text=node('span',undefined,'holiday-text');text.append(node('strong',h.name),node('small',`${fmt(h.date)} · ${h.kind.join(' / ')}`));b.append(icon,text);
  b.addEventListener('click',()=>{manualSeason=h.id;$('season-select').value=h.id;renderSeason();switchView('movies');$('season-title').scrollIntoView({block:'center'});});return b;
 }));
}
function shuffleCard() {card=newCard(active);marked=new Set([12]);renderBoard();}
function renderBoard() {
 $('bingo-board').replaceChildren(...card.map((text,i)=>{
  const b=node('button',text,'bingo-cell');b.type='button';b.dataset.index=i;b.classList.toggle('free-space',i===12);b.setAttribute('aria-pressed',String(marked.has(i)));
  if(i===12){b.setAttribute('aria-disabled','true');b.setAttribute('aria-label','Free space, always marked');}
  else b.addEventListener('click',()=>{marked.has(i)?marked.delete(i):marked.add(i);updateMarks();});
  return b;
 }));updateMarks();
}
function updateMarks() {
 const lines=winningLines(marked),winning=new Set(lines.flat());
 document.querySelectorAll('.bingo-cell').forEach((b,i)=>{b.classList.toggle('marked',marked.has(i));b.classList.toggle('winning',winning.has(i));b.setAttribute('aria-pressed',String(marked.has(i)));});
 $('marked-count').textContent=`${marked.size} / 25`;
 $('win-banner').hidden=!lines.length;
 $('win-banner').textContent=active.quiet?'A line completed. Take a moment to reflect.':`BINGO! ${lines.length} ${lines.length===1?'line':'lines'} completed.`;
}
async function loadAvailability() {
 try{const r=await fetch('data/availability.json',{cache:'no-cache'});if(!r.ok)throw Error('Unavailable');const data=await r.json();if(data.country!=='CA'||!data.movies)throw Error('Invalid region');availability=data;}catch{availability={movies:{}};}
}
async function init() {
 try {
  const r=await fetch('data/movies.json');if(!r.ok)throw Error('Catalogue request failed');movies=await r.json();
  await loadAvailability();
  for(const s of SEASONS){const o=node('option',s.name);o.value=s.id;$('season-select').append(o);}
  $('calendar-controls').addEventListener('submit',e=>e.preventDefault());
  $('season-select').addEventListener('change',e=>{manualSeason=e.target.value;renderSeason();});
  $('date-preview').addEventListener('change',e=>{if(!e.target.checkValidity()){e.target.reportValidity();return;}try{parseDay(e.target.value);previewDay=e.target.value;renderSeason();}catch{e.target.reportValidity();}});
  $('today-button').addEventListener('click',()=>{previewDay=null;manualSeason='auto';$('season-select').value='auto';renderSeason();});
  $('new-card').addEventListener('click',shuffleCard);
  document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
  renderSeason();
  const tick=async()=>{const today=localDay();if(today!==lastDay){lastDay=today;await loadAvailability();if(!previewDay)renderSeason();else renderMovies();}};
  setInterval(tick,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
 } catch(e) {showError('The film catalogue could not load. Please reload the page or try again shortly.');$('movie-grid').replaceChildren();$('season-caption').textContent='The programme is temporarily unavailable.';console.error(e);}
}
init();
