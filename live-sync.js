/* Avengers Pregame: browser-only live read sync. No Google or Sleeper credentials stored. */
(function(){
'use strict';
var sheet='1ThSVhAsQrSrFgq7MlCNmOqqAg4nz3FN27lJkb06jJYg',league='1395849826633019392';
var gids={pickem:2018081380,survivor:920000002,records:920000004,awards:920000003,accuracy:920000005};
var names={Dk25313:'Dakota',hboogie1003:'Hunter',InfinityBrocklet:'Mike',fondlerballer:'Jake',TGriffy93:'Travis',dentalhygenius:'Allysa',Mexipez1999:'Aaron',noreilly1993:'Nick'};
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e}
function safe(s){return String(s==null?'':s)}
function num(s){var n=parseFloat(safe(s).replace(/[^0-9.\-]/g,''));return Number.isFinite(n)?n:0}
function fmt(n){return Number(n||0).toFixed(2)}
function csv(t){var out=[],row=[],v='',quoted=false;for(var i=0;i<t.length;i++){var c=t[i];if(c==='"'){if(quoted&&t[i+1]==='"'){v+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(v);v=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&t[i+1]==='\n')i++;row.push(v);if(row.some(Boolean))out.push(row);row=[];v=''}else v+=c}row.push(v);if(row.some(Boolean))out.push(row);return out}
function sheetRows(gid){var url='https://docs.google.com/spreadsheets/d/'+sheet+'/gviz/tq?tqx=out:csv&gid='+gid+'&cache='+Math.floor(Date.now()/300000);return fetch(url,{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Sheet access '+r.status);return r.text()}).then(function(t){if(/^\s*</.test(t)||!t.includes(','))throw Error('Sheet is not publicly readable');return csv(t)})}
function status(id,message,ok){var p=document.getElementById('sync-'+id);if(!p){var sec=document.getElementById(id);if(!sec)return;p=el('p','live-sync-status');p.id='sync-'+id;var h=sec.querySelector('h1');h.insertAdjacentElement('afterend',p)}p.textContent=message;p.className='live-sync-status '+(ok?'live-sync-ok':'live-sync-warn')}
function replace(id,node){var sec=document.getElementById(id);if(!sec)return;
if(id==='awards'){
  /* Live sheet is supplementary: do not replace or hide the season graphs or weekly history. */
  var oldAwards=sec.querySelector('.live-awards-details');if(oldAwards)oldAwards.remove();
  var drawer=el('details','live-awards-details');
  drawer.appendChild(el('summary','','LIVE AWARD DEFINITIONS & CURRENT STATUS ↓'));
  drawer.appendChild(node);sec.appendChild(drawer);
  sec.querySelectorAll('.award-race-section,.award-history-drawer').forEach(function(part){part.classList.remove('sync-old-hidden')});
  return;
}
var old=sec.querySelector('.live-sync-body');if(old)old.remove();var wrap=el('div','live-sync-body');wrap.appendChild(node);var st=document.getElementById('sync-'+id);st.insertAdjacentElement('afterend',wrap);Array.from(sec.children).forEach(function(child){if(child!==wrap&&child!==st&&child.classList&&!child.classList.contains('back')&&child.tagName!=='H1')child.classList.add('sync-old-hidden')})}
function panel(title){var p=el('div','panel');if(title)p.appendChild(el('h2','',title));return p}
function row(left,right,small){var r=el('div','row'),l=el('div'),rr=el('div','right');l.appendChild(el('strong','',left));if(small)l.appendChild(el('small','',small));rr.textContent=right;r.appendChild(l);r.appendChild(rr);return r}
function sleep(path){return fetch('https://api.sleeper.app/v1'+path,{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Sleeper '+r.status);return r.json()})}
function standings(){Promise.all([sleep('/league/'+league+'/rosters'),sleep('/league/'+league+'/users'),sleep('/league/'+league)]).then(function(v){var users={},rosters=v[0],leagueInfo=v[2];v[1].forEach(function(u){users[u.user_id]=u});if(!rosters.length)throw Error('No Sleeper rosters');var entries=rosters.map(function(r){var u=users[r.owner_id]||{},user=safe(u.username||u.display_name),manager=names[user]||safe(u.display_name||user||'Manager'),team=safe(u.metadata&&u.metadata.team_name||r.metadata&&r.metadata.team_name||manager),set=r.settings||{};return{manager:manager,team:team,w:num(set.wins),l:num(set.losses),t:num(set.ties),pf:num(set.fpts)+num(set.fpts_decimal)/100,pa:num(set.fpts_against)+num(set.fpts_against_decimal)/100}}).sort(function(a,b){return b.w-a.w||a.l-b.l||b.pf-a.pf});/* Keep the homepage comic standings synchronized with the same Sleeper result. */
var homeBoard=document.querySelector('#home .hp-standing-compact');
if(homeBoard){
 var existing={};
 Array.from(homeBoard.querySelectorAll('.hp-team')).forEach(function(node){var a=node.querySelector('a[href^="#coach-"]');if(a)existing[decodeURIComponent(a.getAttribute('href').slice(7))]=node});
 entries.forEach(function(e,i){
  var node=existing[e.manager];if(!node)return;
  var rank=node.querySelector('.hp-rank'),label=node.querySelector('b'),team=node.querySelector('small'),record=node.querySelector('.hp-record');
  if(rank)rank.textContent=String(i+1);
  if(label)label.textContent=e.manager;
  if(team)team.textContent=e.team;
  if(record){record.textContent=e.w+'–'+e.l+(e.t?'–'+e.t:'');record.appendChild(el('small','',fmt(e.pf)+' PF'))}
  homeBoard.appendChild(node);
 });
 homeBoard.setAttribute('data-live-standings','true');
}
var snapshot=document.querySelector('#home .hp-stats');
if(snapshot&&entries.length){
 var cards=snapshot.querySelectorAll('.hp-stat');
 if(cards[1]){var lead=entries.slice().sort(function(a,b){return b.pf-a.pf})[0];var v=cards[1].querySelector('.hp-stat-value'),n=cards[1].querySelector('.hp-stat-note');if(v)v.textContent=lead.manager.toUpperCase();if(n)n.textContent=fmt(lead.pf)+' PF'}
}
var table=el('table','table'),tr=el('tr');['Manager / Team','W–L','PF','PA'].forEach(function(t){tr.appendChild(el('th','',t))});table.appendChild(tr);entries.forEach(function(e){var tr=el('tr'),td=el('td'),a=el('a','link',e.manager);a.href='#coach-'+encodeURIComponent(e.manager);td.appendChild(a);td.appendChild(el('small','',e.team));tr.appendChild(td);[e.w+'–'+e.l+(e.t?'–'+e.t:''),fmt(e.pf),fmt(e.pa)].forEach(function(x){tr.appendChild(el('td','',x))});table.appendChild(tr)});var w=el('div','tablewrap');w.appendChild(table);status('standings','LIVE · Sleeper standings · '+(leagueInfo.season||'2026')+' season',true);replace('standings',w);var story=document.querySelector('.hp-story-slide:not(.hp-story-schedule) .hp-story-big');if(story&&entries[0])story.textContent=entries[0].manager.toUpperCase()+' · '+entries[0].w+'–'+entries[0].l}).catch(function(e){status('standings','Sleeper live update unavailable. Showing last saved standings. '+e.message,false)})}
function pickem(){sheetRows(gids.pickem).then(function(rows){var head=rows.shift();if(!head||head[0]!=='Week')throw Error('Unexpected Pick’em columns');var entries=rows.filter(function(r){return num(r[0])>0&&r[1]}),weeks=[...new Set(entries.map(function(r){return num(r[0])}))].sort(function(a,b){return b-a}),box=el('div');var totals={};entries.forEach(function(r){var name=r[1];if(!totals[name])totals[name]=0;totals[name]+=num(r[3])});var leader=panel('SEASON PICK’EM LEADERBOARD');var highest=Math.max.apply(null,Object.keys(totals).map(function(n){return totals[n]}));Object.keys(totals).sort(function(a,b){return totals[b]-totals[a]}).forEach(function(n){var item=row(n,totals[n]+' correct');if(totals[n]===highest){var nameCell=item.querySelector('strong');if(!nameCell)nameCell=item.querySelector('div');if(nameCell)nameCell.insertBefore(el('span','leader-crown','👑'),nameCell.firstChild)}leader.appendChild(item)});box.appendChild(leader);weeks.forEach(function(week){var inProgress=entries.some(function(r){return num(r[0])===week&&!r[4]});var p=panel('WEEK '+week+(inProgress?' · IN PROGRESS':''));entries.filter(function(r){return num(r[0])===week}).sort(function(a,b){return num(b[3])-num(a[3])}).forEach(function(r){p.appendChild(row(r[1],r[4]?r[3]+' / '+r[4]+' correct':r[3]+' correct so far',r[5]==='TRUE'?'Perfect week':r[4]?'':'IN PROGRESS'))});box.appendChild(p)});status('pickem','LIVE · '+weeks.length+' weeks recorded',true);replace('pickem',box)}).catch(function(e){status('pickem','Saved results shown. Live updates unavailable. '+e.message,false)})}
function survivor(){sheetRows(gids.survivor).then(function(rows){var h=rows.shift();if(!h||h[0]!=='Manager')throw Error('Unexpected Survivor columns');var list=rows.filter(function(r){return r[0]}).map(function(r){var wins=0,picks=[];for(var i=1;i<=18;i++){var col=i<=2?2+(i-1)*2:10+(i-3)*2;var pick=r[col],out=r[col+1];if(safe(out).toLowerCase()==='correct')wins++;if(pick)picks.push('W'+i+': '+pick+' ('+(out||'Pending')+')')}return{name:r[0],wins:wins,revives:num(r[6]),state:r[7]||'Unknown',picks:picks,notes:r[9]||''}}).sort(function(a,b){return b.wins-a.wins||a.revives-b.revives});var box=el('div','surv-board');box.appendChild(el('h2','','THE LAST ONES STANDING'));list.forEach(function(v){var item=el('div','surv-entry'+(v.state.toLowerCase().indexOf('eliminat')>=0?' surv-out':'')),head=el('div','surv-head'),link=el('a','surv-name',v.name),state=el('span','surv-state',v.state.toLowerCase().indexOf('eliminat')>=0?'ELIMINATED':'STILL ALIVE');link.href='#coach-'+v.name;if(v.wins===list[0].wins&&v.revives===list[0].revives&&v.state.toLowerCase().indexOf('eliminat')<0){var crown=el('span','leader-crown','👑');crown.setAttribute('aria-label','Current Survivor leader');head.appendChild(crown)}head.appendChild(link);head.appendChild(state);item.appendChild(head);var track=el('div','surv-track');track.setAttribute('role','img');track.setAttribute('aria-label',v.name+': '+v.wins+' winning picks, '+v.revives+' revives used');var win=el('div','surv-seg surv-win'),rev=el('div','surv-seg surv-revive');win.style.width=(Math.min(v.wins,18)/18*100)+'%';rev.style.width=(Math.min(v.revives,18)/18*100)+'%';track.appendChild(win);track.appendChild(rev);item.appendChild(track);item.appendChild(el('div','surv-stats',v.wins+' winning picks · '+v.revives+' revives used'));var det=el('details'),sum=el('summary','', 'Week-by-week picks');det.appendChild(sum);det.appendChild(el('p','muted',v.picks.join(' · ')));if(v.notes)det.appendChild(el('p','muted',v.notes));item.appendChild(det);box.appendChild(item)});status('survivor','CURRENT SURVIVOR STANDINGS',true);replace('survivor',box)}).catch(function(e){status('survivor','Saved survivor standings shown',false)})}
function records(){sheetRows(gids.records).then(function(rows){var head=rows.findIndex(function(r){return r[0]==='Scope'&&r[2]==='Record'});if(head<0)throw Error('Unexpected Record Book columns');var box=el('div');rows.slice(head+1).filter(function(r){return r[2]&&r[3]}).forEach(function(r){var p=panel(r[2]);p.appendChild(row(r[3],r[5]+' '+(r[6]||''),r[7]||''));if(r[8])p.appendChild(el('p','muted',r[8]));box.appendChild(p)});status('records','LIVE · record book',true);replace('records',box)}).catch(function(e){status('records','Saved records shown. Live updates unavailable. '+e.message,false)})}
function awards(){sheetRows(gids.awards).then(function(rows){if(!rows.length||rows[0][0]!=='Comic Award / Metric')throw Error('Unexpected Awards columns');var box=el('div','live-award-grid');rows.slice(1).filter(function(r){return r[0]&&r[1]}).forEach(function(r){
var p=panel(r[0]);p.classList.add('live-award-card');p.appendChild(el('p','live-award-description',r[1]));
var meta=el('div','live-award-meta'),winner=el('div','live-award-winner');
winner.appendChild(el('span','live-award-field','CURRENT WINNER / STATUS'));
winner.appendChild(el('strong','live-award-winner-name',r[3]||'Not awarded'));meta.appendChild(winner);
if(r[5])meta.appendChild(el('span','live-award-frequency',r[5]));
p.appendChild(meta);
if(r[4]){var detail=el('div','live-award-context');detail.appendChild(el('span','live-award-field','AWARD DETAILS'));detail.appendChild(el('p','',r[4]));p.appendChild(detail)}
box.appendChild(p);
});status('awards','LIVE · award definitions and current winners',true);replace('awards',box)}).catch(function(e){status('awards','Saved awards shown. Live updates unavailable. '+e.message,false)})}
function accuracy(){sheetRows(gids.accuracy).then(function(rows){
var normalize=function(x){return safe(x).trim().toLowerCase().replace(/[^a-z0-9]/g,'')};
var headerIndex=rows.findIndex(function(r){var cells=r.map(normalize);return cells.some(function(x){return x==='manager'||x==='coach'||x==='name'})&&cells.some(function(x){return x.includes('accuracy')||x.includes('efficiency')||x.includes('points')||x==='rank'})});
if(headerIndex<0)throw Error('Coach Accuracy data needs a recognizable Manager and Accuracy header');
var header=rows[headerIndex].map(normalize),column=function(terms){return header.findIndex(function(h){return terms.some(function(t){return h===t||h.includes(t)})})};
var managerCol=column(['manager','coach','name']),rankCol=column(['rank']),teamCol=column(['team']),accuracyCol=column(['seasonaverageaccuracy','seasonaccuracy','averageaccuracy','avgaccuracy','lineupefficiency','accuracy','efficiency']),scoredCol=column(['actualpoints','pointsscored','actualpf','actual']),maxCol=column(['maxpoints','optimalpoints','maxpf','possiblepoints','optimal']);
if(managerCol<0)throw Error('Coach Accuracy manager column missing');
var weeklyCols=header.map(function(h,i){return /^week(?:0?[1-9]|1[0-8])(?:accuracy|efficiency|pct|percent)?$/.test(h)?i:-1}).filter(function(i){return i>=0});
var records=rows.slice(headerIndex+1).filter(function(r){return safe(r[managerCol]).trim()&&normalize(r[managerCol])!=='manager'}).map(function(r){
var actual=scoredCol>=0?num(r[scoredCol]):null,max=maxCol>=0?num(r[maxCol]):null;
var weekPcts=weeklyCols.map(function(i){var raw=safe(r[i]).trim();if(!raw)return null;var v=num(raw);if(!Number.isFinite(v))return null;if(v<=1&&!raw.includes('%'))v*=100;return v>=0&&v<=100?v:null}).filter(function(v){return v!==null});
var raw=accuracyCol>=0?safe(r[accuracyCol]).trim():'',pct=null;
if(weekPcts.length)pct=weekPcts.reduce(function(a,b){return a+b},0)/weekPcts.length;
else if(raw){var v=num(raw);if(Number.isFinite(v)){if(raw.includes('%'))pct=v;else if(v>0&&v<=1)pct=v*100;else if(v>20&&v<=100)pct=v;}}
if(pct===null&&actual!==null&&max>0)pct=actual/max*100;
return {name:safe(r[managerCol]).trim(),team:teamCol>=0?safe(r[teamCol]):'',rank:rankCol>=0?num(r[rankCol]):0,accuracy:pct,actual:actual,max:max}
}).filter(function(r){return r.accuracy!==null&&Number.isFinite(r.accuracy)&&r.accuracy>=0&&r.accuracy<=100});
if(!records.length)throw Error('Season accuracy requires weekly efficiency values, a valid season percentage, or actual and optimal points; ranking numbers are not accuracy');
records.sort(function(a,b){return b.accuracy-a.accuracy||a.rank-b.rank});
var box=el('div','accuracy-board');
records.forEach(function(r,i){
 var item=el('div','accuracy-entry');
 var position=el('span','accuracy-position',String(i+1));
 var details=el('div','accuracy-details');
 var coach=el('a','accuracy-coach',r.name);coach.href='#coach-'+encodeURIComponent(r.name);
 details.appendChild(coach);
 if(r.team)details.appendChild(el('span','accuracy-team',r.team));
 var meter=el('div','accuracy-meter');meter.setAttribute('role','meter');meter.setAttribute('aria-label',r.name+' lineup accuracy');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100');meter.setAttribute('aria-valuenow',r.accuracy.toFixed(1));
 var fill=el('span','accuracy-meter-fill');fill.style.width=r.accuracy.toFixed(1)+'%';meter.appendChild(fill);details.appendChild(meter);
 var score=el('strong','accuracy-score',r.accuracy.toFixed(1)+'%');
 item.appendChild(position);item.appendChild(details);item.appendChild(score);box.appendChild(item);
});
status('accuracy','SEASON LINEUP ACCURACY · LIVE',true);replace('accuracy',box)
}).catch(function(e){status('accuracy','Coach accuracy data unavailable: '+e.message,false)})}
function init(){standings();pickem();survivor();records();awards();accuracy();var lastRefresh=Date.now();function refresh(){if(document.hidden)return;if(Date.now()-lastRefresh<240000)return;lastRefresh=Date.now();pickem();survivor();records();awards();accuracy();standings()}setInterval(refresh,60000);document.addEventListener('visibilitychange',refresh);window.addEventListener('focus',refresh)}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
