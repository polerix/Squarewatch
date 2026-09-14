export const ZONE = 'America/Moncton';
const DAY = 86400000;
export function localDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:ZONE, year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(now);
  const p = Object.fromEntries(parts.map(x => [x.type,x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
export const iso = d => d.toISOString().slice(0,10);
export function parseDay(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error('Choose a valid date.');
  const d = new Date(`${s}T00:00:00Z`);
  if (!Number.isFinite(+d) || iso(d) !== s) throw new Error('Choose a valid date.');
  return d;
}
const date = (y,m,d) => new Date(Date.UTC(y,m-1,d));
const add = (d,n) => new Date(+d+n*DAY);
const nthMonday = (y,m,n) => {const d=date(y,m,1); return add(d,(8-d.getUTCDay())%7+(n-1)*7);};
export function easter(y) {
  const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),n=h+l-7*m+114;
  return date(y,Math.floor(n/31),n%31+1);
}
const FED='Federal holiday', NB='NB public holiday';
export const SEASONS = [
 {id:'newyear',name:'New Year’s Day',kind:[FED,NB],icon:'✦',motif:'✦  🥂  ✧  ✦',color:'#c7a5ff',caption:'A fresh year. One more great movie.',pool:['harry','apartment','trading','nye'],trope:'celebration',when:y=>date(y,1,1)},
 {id:'family',name:'Family Day',kind:[NB],icon:'♥',motif:'♥  🧣  ☕  ♥',color:'#f78fc5',caption:'Make room on the couch.',pool:['paddington','fox','mitchells','muppets'],trope:'family',when:y=>nthMonday(y,2,3)},
 {id:'goodfriday',name:'Good Friday',kind:[FED,NB],icon:'🕊',motif:'🕊  ✧  🕊',color:'#cfb3ef',caption:'Stories of faith, endurance, and renewal.',pool:['benhur','egypt','wonderful','easterparade'],trope:'reflection',quiet:true,when:y=>add(easter(y),-2)},
 {id:'eastermonday',name:'Easter Monday',kind:['Federal / NB public service'],icon:'🌷',motif:'🌷  🐇  🥚  🌷',color:'#dcc384',caption:'A little spring on the screen.',pool:['hop','rabbit','easterparade','paddington','fox'],trope:'family',when:y=>add(easter(y),1)},
 {id:'victoria',name:'Victoria Day',kind:[FED,'NB day of rest'],icon:'♛',motif:'♛  ✧  🌸  ♛',color:'#c3a5ff',caption:'Royal stories for the May long weekend.',pool:['victoria','kingsspeech','queen','paddington'],trope:'period',when:y=>{const d=date(y,5,24);return add(d,-((d.getUTCDay()+6)%7));}},
 {id:'canada',name:'Canada Day',kind:[FED,NB],icon:'🍁',motif:'🍁  ✦  🍁  ✦',color:'#ff7d89',caption:'Canadian stories, coast to coast.',pool:['boncop','oneweek','seduction','stillmine','angryinuk'],trope:'canadian',when:y=>date(y,7,date(y,7,1).getUTCDay()===0?2:1)},
 {id:'newbrunswick',name:'New Brunswick Day',kind:[NB],icon:'🌊',motif:'🌊  🌲  ⚓  🌊',color:'#f0c858',caption:'From the Miramichi to Moncton.',pool:['stillmine','bay','acadia','evangeline','edith'],trope:'canadian',when:y=>nthMonday(y,8,1)},
 {id:'acadian',name:'National Acadian Day',kind:['Cultural observance'],icon:'⭐',motif:'⭐  🔵  ⚪  🔴  ⭐',color:'#f3d05d',caption:'Bonne fête de l’Acadie.',pool:['acadia','evangeline','edith'],trope:'documentary',when:y=>date(y,8,15)},
 {id:'labour',name:'Labour Day',kind:[FED,NB],icon:'⚒',motif:'⚒  ☕  ✦  ⚒',color:'#82d7e6',caption:'Clock out. Cue the opening credits.',pool:['ninefive','pride','sorry','road'],trope:'work',when:y=>nthMonday(y,9,1)},
 {id:'truth',name:'National Day for Truth and Reconciliation',short:'Truth & Reconciliation',kind:[FED],icon:'🧡',motif:'🧡',color:'#f5a05c',caption:'Make time to listen, learn, and reflect.',featured:'bloodquantum',pool:['bloodquantum','indianhorse','rhymes','beans','angryinuk'],trope:'reflection',quiet:true,note:'Indigenous stories and perspectives. Some films depict residential schools, racism, and violence. Read the film’s content guidance before watching.',when:y=>date(y,9,30)},
 {id:'thanksgiving',name:'Canadian Thanksgiving',kind:[FED,'NB day of rest'],icon:'🍂',motif:'🍂  🥧  🍁  🍂',color:'#edac64',caption:'Second helpings. Excellent company.',pool:['planes','april','holidays','fox','stillmine'],trope:'gathering',note:'Thanksgiving follows the Canadian calendar: the second Monday in October. Some films feature American celebrations.',when:y=>nthMonday(y,10,2)},
 {id:'halloween',name:'Halloween',kind:['Cultural observance'],icon:'🎃',motif:'🎃  🦇  👻  🕸',color:'#ffa45d',caption:'Good films. Bad decisions. One more square.',pool:['psycho','troll','things','thing','trick','halloween'],trope:'horror',when:y=>date(y,10,31)},
 {id:'remembrance',name:'Remembrance Day',kind:[FED,NB],icon:'✿',motif:'✿',color:'#ef7584',caption:'Remember service. Reflect on the cost of war.',pool:['passchendaele','hyena','1917','bestyears'],trope:'reflection',quiet:true,note:'A quiet programme of remembrance. These dramas include depictions of war and its aftermath.',when:y=>date(y,11,11)},
 {id:'christmas',name:'Christmas Day',kind:[FED,NB],icon:'🎄',motif:'🎄  ❄  🎁  ❄',color:'#a4ef68',caption:'Season’s screenings, with a little mischief.',pool:['elf','homealone','muppets','wonderful','blackchristmas'],trope:'christmas',when:y=>date(y,12,25)},
 {id:'boxing',name:'Boxing Day',kind:[FED,'NB day of rest'],icon:'🎁',motif:'🎁  ❄  🧣  🎁',color:'#91d9ec',caption:'Leftovers, blankets, and an encore.',pool:['homealone','elf','paddington','muppets','mitchells'],trope:'family',when:y=>date(y,12,26)},
 {id:'newyearseve',name:'New Year’s Eve',kind:['Cultural observance'],icon:'🥂',motif:'✦  🥂  ✧  🕛',color:'#c7a5ff',caption:'The last triple feature of the year.',pool:['harry','nye','apartment','trading'],trope:'celebration',when:y=>date(y,12,31)}
];
export function holidays(year) {return SEASONS.map(s=>({...s,date:iso(s.when(year))})).sort((a,b)=>a.date.localeCompare(b.date));}
export function nextHoliday(day) {const y=parseDay(day).getUTCFullYear();return [...holidays(y),...holidays(y+1)].find(s=>s.date>=day);}
export function occurrence(id,day) {const y=parseDay(day).getUTCFullYear();const s=SEASONS.find(s=>s.id===id);if(!s)throw new Error('Unknown occasion');const d=s.when(y);return {...s,date:iso(iso(d)>=day?d:s.when(y+1))};}
export function daysUntil(day,target) {return Math.round((+parseDay(target)-+parseDay(day))/DAY);}
export function dailyPicks(season,day) {const n=Math.floor(+parseDay(day)/DAY);const pinned=season.featured&&season.pool.includes(season.featured)?[season.featured]:[];const rotating=season.pool.filter(id=>!pinned.includes(id));return [...pinned,...Array.from({length:Math.min(3-pinned.length,rotating.length)},(_,i)=>rotating[(n+i)%rotating.length])];}
export const COMMON = ['A meaningful glance','An unexpected visitor','A shared meal','A difficult choice','A secret comes out','An old photograph','A journey begins','Music changes the mood','Someone offers help','A misunderstanding','An unlikely friendship','A story from the past','A letter or message','A familiar place revisited','A change of heart','A promise is made','An unexpected obstacle','Someone asks for forgiveness','A quiet moment alone','A plan goes wrong','A conversation at a table','An emotional reunion','A new beginning','A final farewell'];
export const TROPES = {
 horror:["Car engine won’t start","A local gives a warning","A dark basement","Jump scare is a cat","A creepy child sings","The power dies","No cellular signal","An ancient cemetery","Bathroom mirror fake-out","Someone trips","The group splits up","A porcelain doll","Tape distortion","Shower interruption","A blood-covered survivor","A masked figure vanishes","A ritual goes wrong","Police dismiss a report","A voice is mimicked","An unsettling radio tune","Door locks itself","A camera drops","The flashlight dies","Floorboards creak"],
 christmas:['A big-city visitor','A bakery in trouble','A magical snow globe','A snowstorm delays travel','A grump finds joy','A secret identity','Mistletoe encounter','Ice skating mishap','A mug of hot cocoa','An ugly sweater','A mysterious Santa','Tree-lighting trouble','A wish for Santa','Unexpected carolers','Perfectly timed snow','Christmas Eve deadline','A generous change of heart','Decorating montage','A treasured ornament','Old sweethearts reunite','Baking competition','A festive pet','Car stuck in snow','Gingerbread disaster'],
 family:['A family road trip','A child saves the day','A homemade gift','A bedtime story','A mischievous pet','Siblings disagree','An improvised meal','A family tradition'],
 celebration:['A midnight countdown','A toast','A new resolution','A party invitation','An unexpected kiss','A clock in close-up','Someone arrives late','Dancing together'],
 gathering:['A cooking mishap','An awkward family question','A crowded dinner table','Unexpected dinner guest','Travel delays','An old family argument','A toast of gratitude','A second helping'],
 canadian:['A small-town street','A waterfront','A road through trees','A local gathering','Two languages heard','A regional accent','A snowy landscape','Someone leaves home'],
 documentary:['An archival photograph','An interview','A map','A personal memory','A community gathering','A historical document','A location revisited','A song or performance'],
 reflection:['A personal testimony','An act of remembrance','An archival image','A moment of silence','A difficult homecoming','A letter read aloud','A community remembers','A story passed on'],
 period:['A formal introduction','A handwritten letter','A grand entrance','An elaborate outfit','A public speech','A secret conversation','A question of duty','An unexpected alliance'],
 work:['An unreasonable boss','A break-room conversation','A workplace rule','A pay dispute','A new colleague','An unexpected promotion','Workers stand together','Someone quits']
};
export function tropesFor(season) {return [...new Set([...(TROPES[season.trope]||[]),...COMMON])].slice(0,24);}
export function newCard(season,random=Math.random) {const a=tropesFor(season);for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}a.splice(12,0,'FREE SPACE');return a;}
export const WINS=[...Array.from({length:5},(_,r)=>Array.from({length:5},(_,c)=>r*5+c)),...Array.from({length:5},(_,c)=>Array.from({length:5},(_,r)=>r*5+c)),[0,6,12,18,24],[4,8,12,16,20]];
export function winningLines(marked) {return WINS.filter(line=>line.every(i=>marked.has(i)));}
export function availabilityState(record,now=Date.now()) {if(!record?.checkedAt || !Number.isFinite(Date.parse(record.checkedAt)))return 'unknown';if(record.error || now-Date.parse(record.checkedAt)>2*DAY)return 'stale';return record.offers?.length?'checked':'empty';}
