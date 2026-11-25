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
function sheetRowsFrom(id,gid){var url='https://docs.google.com/spreadsheets/d/'+encodeURIComponent(id)+'/gviz/tq?tqx=out:csv&gid='+gid+'&cache='+Math.floor(Date.now()/300000);return fetch(url,{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Sheet access '+r.status);return r.text()}).then(function(t){if(/^\s*</.test(t)||!t.includes(','))throw Error('Sheet is not publicly readable');return csv(t)})}
var reportStatus=null;
function status(id,message,ok,current){if(reportStatus)reportStatus(id,message,ok,current);var p=document.getElementById('sync-'+id);if(!p){var sec=document.getElementById(id);if(!sec)return;p=el('p','live-sync-status');p.id='sync-'+id;var h=sec.querySelector('h1');h.insertAdjacentElement('afterend',p)}p.textContent=message;p.className='live-sync-status '+(ok?'live-sync-ok':'live-sync-warn')}
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
var w=standingsHQ(entries,rosters,v[1],leagueInfo);status('standings','LIVE · Sleeper · '+(leagueInfo.season||'2026')+' · '+new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}),true);replace('standings',w);var story=document.querySelector('.hp-story-slide:not(.hp-story-schedule) .hp-story-big');if(story&&entries[0])story.textContent=entries[0].manager.toUpperCase()+' · '+entries[0].w+'–'+entries[0].l}).catch(function(e){status('standings','Sleeper live update unavailable. Showing last saved standings. '+e.message,false)})}

/* Standings-only command center. All styles are scoped to its root. */
function standingsHQ(entries,rosters,users,info){
 var root=el('div','ap-standings-hq'),style=el('style');style.textContent=`
 #standings .ap-standings-hq{background:#10182d;color:#f4f7ff;padding:12px;border:2px solid #172033;border-radius:14px;box-shadow:4px 4px 0 #111827;font-family:Arial,sans-serif}
 #standings .ap-standings-hq *{box-sizing:border-box}
 #standings .ap-standings-hq button{font:700 12px Arial,sans-serif;min-height:44px;cursor:pointer;border:1px solid #526583;border-radius:8px;background:#202e49;color:#fff;padding:8px;box-shadow:none;transform:none}
 #standings .ap-standings-hq button[aria-pressed=true]{background:#ffd43b;color:#10182d;border-color:#ffd43b}
 #standings .ap-standings-hq a{color:#fff;text-decoration:underline;text-underline-offset:3px}
 #standings .ap-standings-hq h2,#standings .ap-standings-hq h3{color:#ffd43b!important;text-shadow:none!important;font:800 17px Arial,sans-serif!important;margin:14px 0 8px!important;transform:none!important}
 #standings .ap-standings-hq p,#standings .ap-standings-hq small{color:#bdcbe1!important;font:12px/1.5 Arial,sans-serif!important;margin:4px 0!important}
 #standings .ap-standings-hq .ap-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin:12px 0}
 #standings .ap-standings-hq .ap-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
 #standings .ap-standings-hq .ap-stat,#standings .ap-standings-hq .ap-team{background:#1d2943;border:1px solid #344663;border-radius:8px;padding:9px;min-width:0}
 #standings .ap-standings-hq .ap-stat{text-align:center;color:#ffd43b;font-weight:800}
 #standings .ap-standings-hq .ap-team{margin:6px 0;border-left:4px solid #8393ad}
 #standings .ap-standings-hq .ap-line{display:grid;grid-template-columns:22px 30px minmax(0,1fr) auto;gap:7px;align-items:center;font:700 14px Arial,sans-serif}
 #standings .ap-standings-hq .ap-name{min-width:0;overflow-wrap:anywhere}
 #standings .ap-standings-hq .ap-name small{display:block}
 #standings .ap-standings-hq .ap-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin-top:8px;font:700 12px/1.4 Arial,sans-serif;color:#f4f7ff}
 #standings .ap-standings-hq .ap-metrics span{min-width:0;overflow-wrap:anywhere}
 #standings .ap-standings-hq summary{cursor:pointer;color:#ffd43b;font:700 12px/1.5 Arial,sans-serif;padding:8px 0}
 #standings .ap-standings-hq .ap-bar{height:7px;background:#344663;border-radius:4px;overflow:hidden;margin:5px 0}
 #standings .ap-standings-hq .ap-bar i{display:block;height:100%;background:#ffd43b}
 #standings .ap-standings-hq .ap-proj{border-left-color:#49a8f5}
 #standings .ap-standings-hq .ap-bubble{border-left-color:#e5b849}
 #standings .ap-standings-hq .ap-clinch{border-left-color:#41b978}
 #standings .ap-standings-hq .ap-out{border-left-color:#e16b72}
 #standings .ap-standings-hq [hidden]{display:none!important}
 `;root.appendChild(style);
 var nameMap={dakota:'Dakota',dk25313:'Dakota',hunter:'Hunter',hboogie1003:'Hunter',mike:'Mike',infinitybrocklet:'Mike',jake:'Jake',fondlerballer:'Jake',travis:'Travis',tgriffy93:'Travis',allysa:'Allysa',alyssa:'Allysa',dentalhygenius:'Allysa',aaron:'Aaron',mexipez1999:'Aaron',nick:'Nick',noreilly1993:'Nick'};
 var div={Nick:'Heroes',Allysa:'Heroes',Travis:'Heroes',Aaron:'Heroes',Dakota:'Villains',Hunter:'Villains',Mike:'Villains',Jake:'Villains'};
 var logos={Nick:['flash','23'],Allysa:['wanda','W'],Dakota:['jug','J'],Travis:['four','4'],Hunter:['venom','V'],Mike:['infinity','∞'],Aaron:['justice','★'],Jake:['loki','L']};
 var norm=function(x){return String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'')}, byUser=new Map(users.map(function(u){return [u.user_id,u]}));
 var teams=rosters.map(function(r){var u=byUser.get(r.owner_id)||{}, n=nameMap[norm(u.username)]||nameMap[norm(u.display_name)]||u.display_name||'Roster '+r.roster_id, a=r.settings||{}, e=entries.find(function(e){return e.manager===n});return {id:r.roster_id,n:n,team:e?e.team:(u.metadata||{}).team_name||n,w:num(a.wins),l:num(a.losses),t:num(a.ties),pf:num(a.fpts)+num(a.fpts_decimal)/100,pa:num(a.fpts_against)+num(a.fpts_against_decimal)/100,division:div[n],aw:0,al:0,at:0,streak:'—',movement:'—'}});
 var games=function(t){return t.w+t.l+t.t}, win=function(t){return t.w+t.t/2}, rank=function(a,b){return win(b)-win(a)||b.pf-a.pf}, ordered=teams.slice().sort(rank), complete=Math.min.apply(null,teams.map(games)), regularEnd=Number((info.settings||{}).playoff_week_start)-1, remaining=Number.isFinite(regularEnd)&&regularEnd>=complete?regularEnd-complete:null, ready=teams.length===8&&teams.filter(t=>t.division==='Heroes').length===4&&teams.filter(t=>t.division==='Villains').length===4;
 function seeds(list){if(!ready)return [];var h=list.filter(t=>t.division==='Heroes').sort(rank),v=list.filter(t=>t.division==='Villains').sort(rank);return h.slice(0,2).concat(v.slice(0,2),h.slice(2).concat(v.slice(2)).sort(rank).slice(0,1)).sort(rank)}
 var projected=seeds(teams), metricsReady=false, scenarios=null, failure='',active=root.dataset.apTab||'Overall';
 var prior=document.querySelector('#standings .ap-standings-hq');if(prior)active=prior.dataset.apTab||active;
 function display(t){return t.n==='Dakota'?'DK':t.n==='Allysa'?'Alyssa':t.n}
 function record(t){return t.w+'–'+t.l+(t.t?'–'+t.t:'')}
 function signed(n){return (n>0?'+':'')+n.toFixed(1)}
 function add(parent,tag,cls,txt){var e=el(tag,cls,txt);parent.appendChild(e);return e}
 function btn(parent,label,fn){var b=add(parent,'button','',label);b.type='button';b.addEventListener('click',fn);return b}
 var top=add(root,'div','ap-summary');[['Week '+(complete+1),'Next / current'],[teams.length,'Franchises'],[remaining===null?'—':remaining,'Weeks left']].forEach(function(x){var d=add(top,'div','ap-stat',x[0]);add(d,'small','',x[1]).style.display='block'});
 var tabs=add(root,'div','ap-tabs'),body=add(root,'div','ap-body'),buttons={};
 ['Overall','Divisions','Playoffs','Analytics'].forEach(function(k){buttons[k]=btn(tabs,k,function(){active=k;render()})});
 function state(t){var s=scenarios&&scenarios[t.id];if(s&&s.total&&s.min===s.total)return ['Clinched','ap-clinch'];if(s&&s.total&&s.max===0)return ['Eliminated','ap-out'];var seed=projected.findIndex(x=>x.id===t.id);return seed>=0?['Projected #'+(seed+1),'ap-proj']:['In the hunt / unconfirmed','ap-bubble']}
 function card(t,parent,pos){var st=state(t),c=add(parent,'div','ap-team '+st[1]),line=add(c,'div','ap-line');add(line,'span','',pos);var l=logos[t.n]||['','?'];add(line,'span','team-logo team-logo-'+l[0],l[1]);var name=add(line,'div','ap-name'),a=add(name,'a','',display(t));a.href='#coach-'+encodeURIComponent(t.n);add(name,'small','',t.team);add(line,'strong','',record(t));var m=add(c,'div','ap-metrics');['PF '+fmt(t.pf),'PA '+fmt(t.pa),'GB '+(win(ordered[0])-win(t)).toFixed(1)].forEach(x=>add(m,'span','',x));var d=add(c,'details');add(d,'summary','',st[0]+' · More stats');var extra=add(d,'div','ap-metrics');['Win % '+(games(t)?(100*win(t)/games(t)).toFixed(1)+'%':'—'),'Streak '+t.streak,'Rank move '+t.movement,'All-play '+(metricsReady?t.aw+'–'+t.al+(t.at?'–'+t.at:''):'—'),'Luck '+(metricsReady?signed(win(t)-(t.aw+t.at/2)/7):'—'),'Avg PF '+(games(t)?fmt(t.pf/games(t)):'—')].forEach(x=>add(extra,'span','',x));return c}
 function render(){root.dataset.apTab=active;Object.keys(buttons).forEach(k=>buttons[k].setAttribute('aria-pressed',String(k===active)));body.replaceChildren();
 if(active==='Overall'){add(body,'h2','','Overall standings');ordered.forEach((t,i)=>card(t,body,i+1));add(body,'p','','Overall order: record, then points for. Playoff qualification uses divisions.')}
 if(active==='Divisions'){['Heroes','Villains'].forEach(function(d){add(body,'h2','',d.toUpperCase());teams.filter(t=>t.division===d).sort(rank).forEach((t,i)=>card(t,body,i+1))});add(body,'p','','Two qualifiers per division plus one overall wild card, per existing league bracket configuration.')}
 if(active==='Playoffs'){add(body,'h2','','Projected playoff bracket');if(!ready)add(body,'p','','Division mapping unavailable; no seed projection.');else{projected.forEach((t,i)=>{var c=card(t,body,i+1);add(c,'small','',i<3?'First-round bye':'First-round matchup: #4 vs #5')});add(body,'p','','Semifinals: #1 vs winner of #4/#5; #2 vs #3. Current points for breaks projected record ties.')}
 add(body,'h2','','Playoff scenario explorer');add(body,'p','',scenarios?'Win/loss combinations weighted equally, not predictive odds. Current PF is held fixed for provisional seeds; clinch/elimination labels use conservative bounds across unknown future PF tiebreaks. Exact scoring ties are excluded.':failure||'Loading remaining schedule…');
 ordered.forEach(function(t){var d=add(body,'details','ap-team'),s=scenarios&&scenarios[t.id];add(d,'summary','',display(t)+' · '+state(t)[0]);if(!s){add(d,'p','','Scenario data unavailable until the full remaining schedule loads.');return}add(d,'p','','Equal-outcome scenario share: '+(100*s.hit/s.total).toFixed(1)+'% · '+s.hit+' of '+s.total+' combinations at current PF. Possible seeds: '+(Array.from(s.seeds).sort().join(', ')||'none'));Object.keys(s.by).sort((a,b)=>b-a).forEach(function(k){var b=s.by[k];add(d,'p','',k+' remaining wins: '+b.hit+'/'+b.total+' qualify at current PF'+(b.min===b.total?' · guaranteed across PF ties':b.max===0?' · no path across PF ties':' · needs other results and/or tiebreaks'));if(b.example)add(d,'small','','Example qualifying results: '+b.example)});});}
 if(active==='Analytics'){add(body,'h2','','Scoring comparison');['pf','pa'].forEach(function(k){add(body,'h3','',k==='pf'?'Points for':'Points against / schedule difficulty');var max=Math.max(1,...teams.map(t=>t[k]));teams.slice().sort((a,b)=>b[k]-a[k]).forEach(function(t){var c=add(body,'div','ap-team');add(c,'strong','',display(t)+' · '+fmt(t[k]));var bar=add(c,'div','ap-bar');add(bar,'i').style.width=(100*t[k]/max)+'%'});});add(body,'h2','','All-play & schedule luck');if(!metricsReady)add(body,'p','','Completed matchup history unavailable or loading.');else teams.slice().sort((a,b)=>(b.aw+b.at/2)-(a.aw+a.at/2)).forEach(function(t){var c=add(body,'div','ap-team');add(c,'strong','',display(t)+' · '+t.aw+'–'+t.al+(t.at?'–'+t.at:''));add(c,'p','','Expected wins '+((t.aw+t.at/2)/7).toFixed(2)+' · Actual minus expected '+signed(win(t)-(t.aw+t.at/2)/7)+' · Opponent avg '+(games(t)?fmt(t.pa/games(t)):'—'))});}
 }
 btn(root,'Share standings',async function(){var txt='AVENGERS PREGAME · '+info.season+' standings\n'+ordered.map((t,i)=>(i+1)+'. '+display(t)+' '+record(t)+' · '+fmt(t.pf)+' PF').join('\n'),url=location.href.split('#')[0]+'#standings';try{if(navigator.share){var canvas=document.createElement('canvas');canvas.width=1000;canvas.height=180+ordered.length*92;var ctx=canvas.getContext('2d');ctx.fillStyle='#10182d';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#ffd43b';ctx.font='bold 42px Arial';ctx.fillText('AVENGERS PREGAME',35,58);ctx.font='bold 24px Arial';ctx.fillText(info.season+' LEAGUE STANDINGS',35,101);ordered.forEach((t,i)=>{var y=132+i*92;ctx.fillStyle='#1d2943';ctx.fillRect(25,y,950,80);ctx.fillStyle='#ffffff';ctx.font='bold 28px Arial';ctx.fillText((i+1)+'. '+display(t)+'  '+record(t),42,y+32);ctx.font='22px Arial';ctx.fillText(t.team.slice(0,52),42,y+62);ctx.fillText(fmt(t.pf)+' PF',750,y+32)});var blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));var file=blob&&new File([blob],'avengers-standings.png',{type:'image/png'});if(file&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file]});return}await navigator.share({title:'Avengers Pregame standings',text:txt,url:url});return}if(navigator.clipboard)await navigator.clipboard.writeText(txt+'\n'+url);else throw Error('Share unavailable');}catch(e){if(e.name!=='AbortError')add(root,'p','','Sharing unavailable on this device. Copy the standings link: '+url)}});
 render();
 async function load(){try{if(!Number.isInteger(complete)||complete<0||complete>18||teams.length!==8)throw Error('Incomplete roster data');var weeks=Array.from({length:complete},(_,i)=>i+1);var history=await Promise.all(weeks.map(w=>sleep('/league/'+league+'/matchups/'+w)));var previous=teams.map(t=>({...t,w:0,l:0,t:0,pf:0}));var streaks=new Map(teams.map(t=>[t.id,[]]));history.forEach(function(rows,idx){if(!Array.isArray(rows)||rows.length!==8||rows.some(r=>r.points==null)||new Set(rows.map(r=>r.roster_id)).size!==8)throw Error('Incomplete matchup history');var groups=new Map();rows.forEach(r=>{var g=groups.get(r.matchup_id)||[];g.push(r);groups.set(r.matchup_id,g)});if(groups.size!==4||Array.from(groups.values()).some(g=>g.length!==2))throw Error('Invalid historical pairings');rows.forEach(function(r){var t=teams.find(t=>t.id===r.roster_id);if(!t)throw Error('Unknown roster');rows.filter(o=>o.roster_id!==r.roster_id).forEach(o=>{if(r.points>o.points)t.aw++;else if(r.points<o.points)t.al++;else t.at++});var opp=groups.get(r.matchup_id).find(o=>o.roster_id!==r.roster_id),res=r.points>opp.points?'W':r.points<opp.points?'L':'T';streaks.get(t.id).push(res);if(idx<complete-1){var p=previous.find(p=>p.id===t.id);p[res.toLowerCase()]++;p.pf+=r.points}})});previous.sort(rank);teams.forEach(t=>{var a=streaks.get(t.id),last=a[a.length-1],n=0;for(var i=a.length-1;i>=0&&a[i]===last;i--)n++;t.streak=last?last+n:'—';var m=previous.findIndex(p=>p.id===t.id)-ordered.findIndex(p=>p.id===t.id);t.movement=complete>1?(m>0?'↑'+m:m<0?'↓'+(-m):'—'):'—'});metricsReady=true;render()}catch(e){failure='Historical stats unavailable: '+e.message;render()}
 try{if(!ready||remaining===null||remaining>3)throw Error('Scenario explorer requires a verified division map and at most three remaining weeks.');var future=await Promise.all(Array.from({length:remaining},(_,i)=>sleep('/league/'+league+'/matchups/'+(complete+i+1))));var pairs=[];future.forEach((rows,i)=>{var m=new Map();rows.forEach(r=>{var a=m.get(r.matchup_id)||[];a.push(r.roster_id);m.set(r.matchup_id,a)});if(rows.length!==8||new Set(rows.map(r=>r.roster_id)).size!==8||m.size!==4||Array.from(m.values()).some(a=>a.length!==2||a.some(id=>!teams.some(t=>t.id===id))))throw Error('Remaining schedule incomplete');m.forEach(a=>pairs.push({a:a[0],b:a[1],week:complete+i+1}))});var result={};teams.forEach(t=>result[t.id]={total:0,hit:0,min:0,max:0,seeds:new Set(),by:{}});for(var mask=0;mask<2**pairs.length;mask++){var list=teams.map(t=>({...t})),wins={},out=[];pairs.forEach((p,i)=>{var winner=(mask>>i)&1?p.b:p.a,loser=winner===p.a?p.b:p.a;list.find(t=>t.id===winner).w++;list.find(t=>t.id===loser).l++;wins[winner]=(wins[winner]||0)+1;out.push('W'+p.week+' '+display(teams.find(t=>t.id===winner)))});var qual=seeds(list);list.forEach(t=>{var s=result[t.id],k=wins[t.id]||0,b=s.by[k]||(s.by[k]={total:0,hit:0,min:0,max:0});s.total++;b.total++;var idx=qual.findIndex(q=>q.id===t.id);if(idx>=0){s.hit++;b.hit++;s.seeds.add(idx+1);if(!b.example)b.example=out.join(', ')}var worst=seeds(list.map(q=>({...q,pf:q.id===t.id?-1:1}))),best=seeds(list.map(q=>({...q,pf:q.id===t.id?1:-1})));if(worst.some(q=>q.id===t.id)){s.min++;b.min++}if(best.some(q=>q.id===t.id)){s.max++;b.max++}})}scenarios=result;render()}catch(e){failure=e.message;render()}}
 load();return root;
}
function pickem(){
 function showVerified(data){
  if(!data||!data.baseline_week1_to_5||!data.weekly)throw Error('Invalid verified Pickem ledger');
  var w=Number(data.verified_through_week),names={DK:'Dakota',Hunter:'Hunter',Mike:'Mike',Jake:'Jake',Travis:'Travis',Alyssa:'Allysa',Aaron:'Aaron',Nick:'Nick'};
  if(w<10)throw Error('Verified Pickem ledger ends before Week 10');
  var rows=Object.keys(names).map(function(k){var weeks=[];for(var week=1;week<=w;week++){var val=week<=5?(data.baseline_week1_to_5[k]||[])[week-1]:(data.weekly[String(week)]||{})[k];if(val==null||!Number.isFinite(Number(val)))throw Error('Missing '+k+' W'+week);weeks.push(Number(val))}
   return{name:names[k],weeks:weeks,total:weeks.reduce(function(a,b){return a+b},0)}
  }).sort(function(a,b){return b.total-a.total||a.name.localeCompare(b.name)});
  var box=el('div'),leader=panel('SEASON PICK’EM · VERIFIED THROUGH WEEK '+w);
  rows.forEach(function(r,i){leader.appendChild(row((i+1)+'. '+r.name,r.total+' correct'))});box.appendChild(leader);
  for(var week=w;week>=1;week--){var p=panel('WEEK '+week+' · VERIFIED RESULTS');rows.slice().sort(function(a,b){return b.weeks[week-1]-a.weeks[week-1]}).forEach(function(r){p.appendChild(row(r.name,r.weeks[week-1]+' correct'))});box.appendChild(p)}
  status('pickem','VERIFIED · Complete Week 1–'+w+' Pickem ledger · all 8 managers',true,true);replace('pickem',box);
 }
 function showPartial(rows){
  if(rows[0]&&/^week$/i.test(safe(rows[0][0]).trim()))rows.shift();
  var entries=rows.filter(function(r){return /^\d{1,2}$/.test(safe(r[0]).trim())&&r[1]}),weeks=[...new Set(entries.map(function(r){return Number(r[0])}))];
  if(!entries.length)throw Error('No CSV rows');
  var totals={},box=el('div'),leader=panel('PARTIAL PICK’EM · GOOGLE SHEET FALLBACK');
  entries.forEach(function(r){totals[r[1]]=(totals[r[1]]||0)+num(r[3])});
  Object.keys(totals).sort(function(a,b){return totals[b]-totals[a]}).forEach(function(n){leader.appendChild(row(n,totals[n]+' correct (partial)'))});box.appendChild(leader);
  status('pickem','PARTIAL · '+weeks.length+' weeks visible; verified ledger unavailable',true,false);replace('pickem',box);
 }
 fetch('./data/pickem-weekly-verified.json?ts='+Date.now(),{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Verified ledger HTTP '+r.status);return r.json()}).then(showVerified).catch(function(e){
  sheetRows(gids.pickem).then(showPartial).catch(function(err){status('pickem','Pickem connection unavailable: '+e.message+'; '+err.message,false,false)});
 });
}
function survivor(){sheetRows(gids.survivor).then(function(rows){var h=rows.shift();if(!h||h[0]!=='Manager')throw Error('Unexpected Survivor columns');var list=rows.filter(function(r){return r[0]}).map(function(r){var wins=0,picks=[];for(var i=1;i<=18;i++){var col=i<=2?2+(i-1)*2:10+(i-3)*2;var pick=r[col],out=r[col+1];if(safe(out).toLowerCase()==='correct')wins++;if(pick)picks.push('W'+i+': '+pick+' ('+(out||'Pending')+')')}return{name:r[0],wins:wins,revives:num(r[6]),state:r[7]||'Unknown',picks:picks,notes:r[9]||''}}).sort(function(a,b){return b.wins-a.wins||a.revives-b.revives});var box=el('div','surv-board');box.appendChild(el('h2','','THE LAST ONES STANDING'));list.forEach(function(v){var item=el('div','surv-entry'+(v.state.toLowerCase().indexOf('eliminat')>=0?' surv-out':'')),head=el('div','surv-head'),link=el('a','surv-name',v.name),state=el('span','surv-state',v.state.toLowerCase().indexOf('eliminat')>=0?'ELIMINATED':'STILL ALIVE');link.href='#coach-'+v.name;if(v.wins===list[0].wins&&v.revives===list[0].revives&&v.state.toLowerCase().indexOf('eliminat')<0){var crown=el('span','leader-crown','👑');crown.setAttribute('aria-label','Current Survivor leader');head.appendChild(crown)}head.appendChild(link);head.appendChild(state);item.appendChild(head);var track=el('div','surv-track');track.setAttribute('role','img');track.setAttribute('aria-label',v.name+': '+v.wins+' winning picks, '+v.revives+' revives used');var win=el('div','surv-seg surv-win'),rev=el('div','surv-seg surv-revive');win.style.width=(Math.min(v.wins,18)/18*100)+'%';rev.style.width=(Math.min(v.revives,18)/18*100)+'%';track.appendChild(win);track.appendChild(rev);item.appendChild(track);item.appendChild(el('div','surv-stats',v.wins+' winning picks · '+v.revives+' revives used'));var det=el('details'),sum=el('summary','', 'Week-by-week picks');det.appendChild(sum);det.appendChild(el('p','muted',v.picks.join(' · ')));if(v.notes)det.appendChild(el('p','muted',v.notes));item.appendChild(det);box.appendChild(item)});status('survivor','CURRENT SURVIVOR STANDINGS',true);replace('survivor',box)}).catch(function(e){status('survivor','Saved survivor standings shown',false)})}
function records(){fetch('./data/record-book.json?ts='+Date.now(),{cache:'no-store'}).then(function(response){if(!response.ok)throw Error('Record Book HTTP '+response.status);return response.json()}).then(function(snapshot){if(!snapshot||!Array.isArray(snapshot.rows)||!Number.isInteger(snapshot.verifiedThroughWeek))throw Error('Invalid Record Book snapshot');return snapshot}).then(function(snapshot){var rows=snapshot.rows;
var norm=function(v){return safe(v).trim().toLowerCase().replace(/[^a-z0-9]/g,'')};
var hi=rows.findIndex(function(r){var h=r.map(norm);return h.includes('scope')&&h.includes('record')&&h.some(function(x){return x==='holders'||x==='holder'})});
if(hi<0)throw Error('Record Book headers not found');
var h=rows[hi].map(norm),col=function(n){return h.indexOf(n)},get=function(r,n){var i=col(n);return i>=0?safe(r[i]).trim():''};
var sheetYear=(rows.slice(0,hi).flat().join(' ').match(/\b20\d{2}\b/)||[])[0]||'2026';
var entries=rows.slice(hi+1).filter(function(r){return get(r,'record')&&get(r,'value')}).map(function(r){var week=get(r,'weeks'),year=get(r,'year')||(week.match(/\b20\d{2}\b/)||[])[0]||sheetYear;return {scope:get(r,'scope'),title:get(r,'record'),holder:get(r,'holders')||get(r,'holder'),team:get(r,'teams'),value:get(r,'value'),unit:get(r,'unit'),week:week,year:year,detail:get(r,'details')}});
if(!entries.length)throw Error('No populated records');
var box=el('div','record-board');
var groups=[{name:'SINGLE-WEEK RECORDS',match:function(x){return /single|week/i.test(x.scope)}},{name:'SEASON & CAREER RECORDS',match:function(x){return !/single|week/i.test(x.scope)}}];
groups.forEach(function(g){var matches=entries.filter(g.match);if(!matches.length)return;
var section=el('section','record-group');section.appendChild(el('h2','record-group-title',g.name));
matches.forEach(function(r){var card=el('article','record-entry');var top=el('div','record-entry-top');top.appendChild(el('strong','record-name',r.title));top.appendChild(el('strong','record-value',r.value+(r.unit?' '+r.unit:'')));card.appendChild(top);
var meta=el('div','record-meta',r.holder+' · '+r.year+(r.week?' · '+r.week:''));card.appendChild(meta);
if(r.team&&r.team!==r.holder)card.appendChild(el('div','record-team',r.team));
if(r.detail&&r.detail.length<130)card.title=r.detail;
section.appendChild(card)});box.appendChild(section)});
status('records','SNAPSHOT · verified through Week '+snapshot.verifiedThroughWeek+(snapshot.verifiedThroughWeek<10?' · HISTORICAL / REVIEW REQUIRED':''),true,snapshot.verifiedThroughWeek>=10);replace('records',box);
}).catch(function(e){status('records','Saved records displayed · live refresh unavailable: '+e.message,false)})}
function awards(){sheetRows(gids.awards).then(function(rows){if(!rows.length||rows[0][0]!=='Comic Award / Metric')throw Error('Unexpected Awards columns');var box=el('div','live-award-grid');rows.slice(1).filter(function(r){return r[0]&&r[1]}).forEach(function(r){
var p=panel(r[0]);p.classList.add('live-award-card');p.appendChild(el('p','live-award-description',r[1]));
var meta=el('div','live-award-meta'),winner=el('div','live-award-winner');
winner.appendChild(el('span','live-award-field','CURRENT WINNER / STATUS'));
winner.appendChild(el('strong','live-award-winner-name',r[3]||'Not awarded'));meta.appendChild(winner);
if(r[5])meta.appendChild(el('span','live-award-frequency',r[5]));
p.appendChild(meta);
if(r[4]){var detail=el('div','live-award-context');detail.appendChild(el('span','live-award-field','AWARD DETAILS'));detail.appendChild(el('p','',r[4]));p.appendChild(detail)}
box.appendChild(p);
});status('awards','SHEET LOADED · award definitions and listed winners · recency NOT VERIFIED',true,false);replace('awards',box)}).catch(function(e){status('awards','Saved awards shown. Live updates unavailable. '+e.message,false)})}
function accuracy(){
 fetch('./data/optimal-lineups.json?ts='+Date.now(),{cache:'no-store'}).then(function(response){
  if(!response.ok)throw Error('Sleeper optimal lineup snapshot HTTP '+response.status);
  return response.json();
 }).then(function(data){
  var rows=data.rows||[],weeks=[...new Set(rows.map(function(r){return Number(r.week)}))].sort(function(a,b){return a-b});
  if(!weeks.length)throw Error('No completed weekly lineup records');
  var complete=weeks.filter(function(w){return rows.filter(function(r){return Number(r.week)===w}).length===8});
  if(!complete.length)throw Error('No complete eight-team weeks');
  var byRoster={};
  rows.filter(function(r){return complete.indexOf(Number(r.week))>=0}).forEach(function(r){
   var id=Number(r.roster_id),actual=Number(r.actual),optimal=Number(r.optimal);
   if(!Number.isFinite(actual)||!Number.isFinite(optimal)||optimal<=0||actual>optimal+0.02)throw Error('Invalid optimal lineup points for roster '+id+' week '+r.week);
   if(!byRoster[id])byRoster[id]={id:id,actual:0,max:0,count:0};
   byRoster[id].actual+=actual;byRoster[id].max+=optimal;byRoster[id].count++;
  });
  var teams={1:['Dakota','Juggernauts Jumbo Package'],2:['Mike','Team InfinityBrocklet'],3:['Travis','Fantastic Four Skin'],4:['Aaron',"Jerry's Justice League"],5:['Allysa','Wanda WacksEmOff'],6:['Hunter','Hurts Venom Inside Her'],7:['Jake','Loki Down Bad'],8:['Nick','Flash 23 Blast']};
  var records=Object.keys(byRoster).map(function(k){var r=byRoster[k],t=teams[k]||['Roster '+k,''];return{name:t[0],team:t[1],actual:r.actual,max:r.max,accuracy:100*r.actual/r.max,count:r.count}});
  if(records.length!==8||records.some(function(r){return r.count!==complete.length}))throw Error('Missing coach records in completed weeks');
  records.sort(function(a,b){return b.accuracy-a.accuracy});
  var box=el('div','accuracy-board');
  records.forEach(function(r,i){
   var item=el('div','accuracy-entry'),position=el('span','accuracy-position',String(i+1)),details=el('div','accuracy-details');
   var coach=el('a','accuracy-coach',r.name);coach.href='#coach-'+encodeURIComponent(r.name);details.appendChild(coach);
   details.appendChild(el('span','accuracy-team',r.team));
   details.appendChild(el('span','accuracy-possible','SCORED / POSSIBLE: '+r.actual.toFixed(2)+' / '+r.max.toFixed(2)));
   var meter=el('div','accuracy-meter');meter.setAttribute('role','meter');meter.setAttribute('aria-label',r.name+' lineup accuracy');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100');meter.setAttribute('aria-valuenow',r.accuracy.toFixed(1));
   var fill=el('span','accuracy-meter-fill');fill.style.width=Math.min(100,r.accuracy).toFixed(1)+'%';meter.appendChild(fill);details.appendChild(meter);
   item.appendChild(position);item.appendChild(details);item.appendChild(el('strong','accuracy-score',r.accuracy.toFixed(1)+'%'));box.appendChild(item);
  });
  var generated=Date.parse(data.generated_at||'');
  var age=Date.now()-generated;
  var fresh=Number.isFinite(age)&&age>=0&&age<36*3600000;
  status('accuracy','SEASON LINEUP ACCURACY · WEEKS '+complete[0]+'–'+complete[complete.length-1]+' · SOURCE '+(Number.isFinite(generated)?new Date(generated).toLocaleString():'UNKNOWN')+(fresh?'':' · DATA DELAYED'),true,fresh);
  replace('accuracy',box);
 }).catch(function(e){status('accuracy','Coach accuracy unavailable: '+e.message,false)});
}
function refreshCoachProfiles(){
 Promise.all([sleep('/league/'+league+'/rosters'),fetch('./data/optimal-lineups.json?ts='+Date.now(),{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Optimal feed unavailable');return r.json()})]).then(function(result){
  var rosters=result[0],rows=result[1].rows||[],complete=[...new Set(rows.map(function(r){return r.week}))].filter(function(w){return rows.filter(function(r){return r.week===w}).length===8});
  var mapping={1:'Dakota',2:'Mike',3:'Travis',4:'Aaron',5:'Allysa',6:'Hunter',7:'Jake',8:'Nick'};
  rosters.forEach(function(r){
   var name=mapping[r.roster_id],sec=document.getElementById('coach-'+name);
   var tile=document.querySelector('#teams a.tile[href="#coach-'+name+'"]');
   if(tile){var summary=tile.querySelector('small'),settingsForTile=r.settings||{};if(summary){var teamLabel=summary.textContent.replace(/\s*·\s*\d+\s*[–-]\s*\d+(?:\s*[–-]\s*\d+)?\s*$/,'');summary.textContent=teamLabel+' · '+Number(settingsForTile.wins||0)+'–'+Number(settingsForTile.losses||0)+(Number(settingsForTile.ties||0)?'–'+Number(settingsForTile.ties):'');}}
   if(!sec)return;
   var values=sec.querySelectorAll('.grid .stat .value'),settings=r.settings||{},pf=Number(settings.fpts||0)+Number(settings.fpts_decimal||0)/100;
   if(values[0])values[0].textContent=(settings.wins||0)+'–'+(settings.losses||0);
   if(values[1])values[1].textContent=pf.toFixed(2);
   var mine=rows.filter(function(x){return x.roster_id===r.roster_id&&complete.indexOf(x.week)>=0});
   var actual=mine.reduce(function(a,x){return a+Number(x.actual)},0),best=mine.reduce(function(a,x){return a+Number(x.optimal)},0);
   if(values[2])values[2].textContent=best>0?(100*actual/best).toFixed(1)+'%':'—';
   // Fourth coach dashboard tile is Pick’em accuracy; updated by the verified Pick’em feed in index.html.
   var note=sec.querySelector('.coach-live-note');
   if(!note){note=el('p','coach-live-note');sec.querySelector('.grid').insertAdjacentElement('afterend',note)}
   note.textContent='Sleeper standings live · lineup efficiency Weeks '+(complete.length?complete[0]+'–'+complete[complete.length-1]:'unavailable')+' · Pick’em and Survivor below are historical unless independently verified';
  });
 }).catch(function(e){document.querySelectorAll('[id^="coach-"]').forEach(function(sec){var note=sec.querySelector('.coach-live-note');if(!note){note=el('p','coach-live-note');var grid=sec.querySelector('.grid');if(grid)grid.insertAdjacentElement('afterend',note)}if(note)note.textContent='Archived profile snapshot · live refresh unavailable: '+e.message})});
}
function init(){
var ids=['standings','pickem','survivor','records','awards','accuracy'];
var state={},pending=new Set(),inFlight=false,lastStart=0,cycle=0;
var indicator=document.createElement('div');
indicator.id='hq-data-freshness';
indicator.setAttribute('role','status');
indicator.setAttribute('aria-live','polite');
indicator.style.cssText='margin:10px 0;padding:9px 12px;background:#17132b;color:#fff;border:2px solid #ffd400;font:700 12px/1.4 Arial,sans-serif;border-radius:4px;cursor:pointer';
indicator.title='Tap for individual source freshness';
var home=document.getElementById('home');
if(home){var heading=home.querySelector('.hp-heading')||home.firstElementChild;if(heading)heading.insertAdjacentElement('beforebegin',indicator);else home.prepend(indicator)}
function clock(t){return t?new Date(t).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):'never'}
function render(){
 var failed=ids.filter(function(id){return state[id]&&state[id].ok===false});
 var good=ids.filter(function(id){return state[id]&&state[id].ok===true});
 var old=good.filter(function(id){return state[id].current===false||Date.now()-state[id].success>300000});
 indicator.textContent=inFlight?'LEAGUE DATA · Checking '+pending.size+' sources…':failed.length?'LEAGUE DATA · '+failed.length+' connection'+(failed.length===1?'':'s')+' unavailable · DETAILS':old.length?'LEAGUE DATA · '+good.length+'/'+ids.length+' loaded · '+old.length+' delayed/review · DETAILS':good.length===ids.length?'LEAGUE DATA · '+ids.length+'/'+ids.length+' sources current · '+clock(Math.min.apply(null,good.map(function(id){return state[id].success}))):'LEAGUE DATA · Waiting for source checks';
 indicator.style.borderColor=failed.length?'#ff786b':'#ffd400';
}
reportStatus=function(id,message,ok,current){
 if(ids.indexOf(id)<0)return;
 var previous=state[id]||{};
 state[id]={ok:ok,current:ok?(current!==false):false,success:ok?Date.now():previous.success||0,attempt:Date.now(),message:message};
 pending.delete(id);
 if(inFlight&&pending.size===0)inFlight=false;
 render();
};
indicator.addEventListener('click',function(){
 window.alert('League data freshness:\n\n'+ids.map(function(id){var x=state[id];return id.toUpperCase()+': '+(!x?'not checked':(x.ok?(x.current?'updated ':'loaded, source delayed · checked ')+clock(x.success):'unavailable; last success '+clock(x.success)))+(x?'\n'+x.message:'')}).join('\n\n'));
});
function refresh(force){
 if(document.hidden&&!force)return;
 if(inFlight||(!force&&Date.now()-lastStart<120000))return;
 inFlight=true;lastStart=Date.now();cycle++;
 pending=new Set(ids);render();
 standings();pickem();survivor();records();awards();accuracy();refreshCoachProfiles();
}
refresh(true);
setInterval(function(){refresh(false);render()},30000);
document.addEventListener('visibilitychange',function(){if(!document.hidden)refresh(true)});
window.addEventListener('focus',function(){refresh(true)});
window.addEventListener('online',function(){refresh(true)});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
