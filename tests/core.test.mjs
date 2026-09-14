import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SEASONS,localDay,holidays,nextHoliday,occurrence,daysUntil,dailyPicks,tropesFor,newCard,winningLines,WINS,availabilityState,parseDay} from '../core.mjs';
const movies=JSON.parse(fs.readFileSync(new URL('../data/movies.json',import.meta.url)));
test('2026 official federal/NB dates and cultural dates',()=>{
 const expected={newyear:'01-01',family:'02-16',goodfriday:'04-03',eastermonday:'04-06',victoria:'05-18',canada:'07-01',newbrunswick:'08-03',acadian:'08-15',labour:'09-07',truth:'09-30',thanksgiving:'10-12',halloween:'10-31',remembrance:'11-11',christmas:'12-25',boxing:'12-26',newyearseve:'12-31'};
 for(const h of holidays(2026))assert.equal(h.date,`2026-${expected[h.id]}`,h.id);
 assert.equal(holidays(2027).find(h=>h.id==='goodfriday').date,'2027-03-26');
 assert.equal(holidays(2029).find(h=>h.id==='canada').date,'2029-07-02');
 assert.equal(SEASONS.filter(s=>s.kind.includes('Federal holiday')).length,10);
 assert.equal(SEASONS.filter(s=>s.kind.includes('NB public holiday')).length,8);
});
test('occasion dates remain active until the next Atlantic day',()=>{
 assert.equal(nextHoliday('2026-09-14').id,'truth');
 assert.equal(nextHoliday('2026-09-30').id,'truth');
 assert.equal(nextHoliday('2026-10-01').id,'thanksgiving');
 assert.equal(nextHoliday('2026-10-13').id,'halloween');
 assert.equal(nextHoliday('2026-11-01').id,'remembrance');
 assert.equal(nextHoliday('2026-11-12').id,'christmas');
 assert.equal(nextHoliday('2026-12-26').id,'boxing');
 assert.equal(nextHoliday('2026-12-31').id,'newyearseve');
 assert.equal(nextHoliday('2027-01-01').id,'newyear');
 assert.equal(occurrence('halloween','2026-11-01').date,'2027-10-31');
 assert.equal(daysUntil('2026-03-07','2026-03-09'),2);
});
test('timezone remains Atlantic on DST boundaries and year rollover',()=>{
 assert.equal(localDay(new Date('2026-10-01T02:59:59Z')),'2026-09-30');
 assert.equal(localDay(new Date('2026-10-01T03:00:00Z')),'2026-10-01');
 assert.equal(localDay(new Date('2027-01-01T03:59:59Z')),'2026-12-31');
 assert.equal(localDay(new Date('2027-01-01T04:00:00Z')),'2027-01-01');
 assert.equal(localDay(new Date('2026-11-01T05:30:00Z')),'2026-11-01');
 assert.throws(()=>parseDay('2026-02-30'));assert.throws(()=>parseDay('bad'));
});
test('holiday selection has no gaps across twelve years',()=>{
 for(let year=2024;year<=2035;year++)for(let d=new Date(Date.UTC(year,0,1));d.getUTCFullYear()===year;d.setUTCDate(d.getUTCDate()+1)){
  const day=d.toISOString().slice(0,10),next=nextHoliday(day);assert.ok(next.date>=day);assert.ok(daysUntil(day,next.date)<100);
 }
});
test('every season has a deterministic daily rotation with valid distinct films',()=>{
 assert.equal(new Set(movies.map(m=>m.id)).size,movies.length);
 for(const s of SEASONS){const seen=new Set();let previous;
  for(let n=0;n<s.pool.length;n++){
   const day=`2026-01-${String(n+1).padStart(2,'0')}`,picks=dailyPicks(s,day);
   assert.equal(picks.length,3);assert.equal(new Set(picks).size,3);
   assert.deepEqual(picks,dailyPicks(s,day));if(previous)assert.notDeepEqual(picks,previous);
   for(const id of picks){assert.ok(movies.some(m=>m.id===id));seen.add(id);}previous=picks;
  }assert.equal(seen.size,s.pool.length);
 }
});
test('every seasonal Bingo card has 24 distinct tropes and a fixed free centre',()=>{
 for(const s of SEASONS){assert.equal(new Set(tropesFor(s)).size,24);const card=newCard(s);assert.equal(card.length,25);assert.equal(card[12],'FREE SPACE');assert.equal(new Set(card).size,25);}
 assert.equal(winningLines(new Set([12])).length,0);
 for(const line of WINS){const marks=new Set([12,...line]);assert.equal(winningLines(marks).length,1);marks.delete(line.find(i=>i!==12));assert.equal(winningLines(marks).length,0);}
 assert.equal(winningLines(new Set(Array.from({length:25},(_,i)=>i))).length,12);
});
test('stale, failed, empty, missing, and fresh availability stay distinct',()=>{
 const now=Date.parse('2026-09-14T12:00:00Z'),fresh={checkedAt:'2026-09-14T10:00:00Z',offers:[{}]};
 assert.equal(availabilityState(undefined,now),'unknown');assert.equal(availabilityState({checkedAt:'bad'},now),'unknown');
 assert.equal(availabilityState(fresh,now),'checked');assert.equal(availabilityState({...fresh,offers:[]},now),'empty');
 assert.equal(availabilityState({...fresh,error:'network'},now),'stale');
 assert.equal(availabilityState({...fresh,checkedAt:'2026-09-10T10:00:00Z'},now),'stale');
});
test('all entrypoint assets exist; data and source URLs remain Canadian',()=>{
 const root=new URL('../',import.meta.url),html=fs.readFileSync(new URL('index.html',root),'utf8');
 for(const [,path] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(!/^(https?:|\.\/$)/.test(path))assert.ok(fs.existsSync(new URL(path,root)),path);}
 for(const m of movies){assert.ok(m.url.startsWith('https://www.justwatch.com/ca/movie/')||m.url.startsWith('https://www.nfb.ca/film/')||m.url.startsWith('https://gem.cbc.ca/'));}
});

test('Blood Quantum stays first for Truth and Reconciliation while the other slots rotate',()=>{
 const season=SEASONS.find(s=>s.id==='truth');assert.equal(season.pool[0],'bloodquantum');
 const seen=new Set();for(let n=1;n<=30;n++){const picks=dailyPicks(season,`2026-09-${String(n).padStart(2,'0')}`);assert.equal(picks[0],'bloodquantum');assert.equal(new Set(picks).size,3);picks.slice(1).forEach(id=>seen.add(id));}
 assert.equal(seen.size,4);
});
