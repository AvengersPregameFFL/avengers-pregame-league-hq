/* Read-only Thursday/Monday fantasy player watch. */
(function(){
'use strict';
var league='1395849826633019392';
var snapshot='./data/sleeper-rosters.json';
var nfl='https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
var sleeper='https://api.sleeper.app/v1';
var aliases={Dk25313:'DK',hboogie1003:'Hunter',InfinityBrocklet:'Mike',fondlerballer:'Jake',TGriffy93:'Travis',dentalhygenius:'Allysa',Mexipez1999:'Aaron',noreilly1993:'Nick'};
function get(url){return fetch(url,{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('HTTP '+r.status);return r.json()})}
function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n}
function localDate(d){return new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(d))}
function easternDay(d){return new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short'}).format(new Date(d))}
function label(n){return aliases[n]||n}
function playerName(p,id){return p&&p.name||id}
function nflGames(week){return get(nfl+'?seasontype=2&week='+week+'&year=2026&limit=50').then(function(data){return (data.events||[]).filter(function(g){return ['Thu','Mon'].includes(easternDay(g.date))}).map(function(g){var comp=g.competitions&&g.competitions[0],teams=(comp&&comp.competitors||[]).map(function(c){return c.team&&c.team.abbreviation}).filter(Boolean);return {day:easternDay(g.date),date:g.date,teams:teams,title:(g.shortName||teams.join(' @ '))}})})}
function getSnapshot(){return get(snapshot+'?v='+Math.floor(Date.now()/300000)).catch(function(){return Promise.all([get(sleeper+'/league/'+league+'/rosters'),get(sleeper+'/league/'+league+'/users'),get(sleeper+'/players/nfl')]).then(function(a){var owners={};a[1].forEach(function(u){owners[u.user_id]=u});var players={};a[0].forEach(function(r){(r.players||[]).forEach(function(id){var p=a[2][id]||{};players[id]={name:p.full_name||id,team:p.team,position:p.position}})});var rosters={};a[0].forEach(function(r){var u=owners[r.owner_id]||{};rosters[r.roster_id]={manager:u.display_name||u.username||'Unknown',players:r.players||[],starters:r.starters||[]}});return {rosters:rosters,players:players,weekly_matchups:{}}})})}
function build(day,games,data,week){
var block=el('div','hp-watch-day'),h=el('h4','',day==='Thu'?'THURSDAY NIGHT':'MONDAY NIGHT');block.appendChild(h);
if(!games.length){block.appendChild(el('p','hp-watch-note','No '+(day==='Thu'?'Thursday':'Monday')+' NFL game listed.'));return block}
games.forEach(function(game){block.appendChild(el('div','hp-watch-game',game.title+' · '+localDate(game.date)+' ET'));var matched=[];Object.keys(data.rosters||{}).forEach(function(rid){var r=data.rosters[rid];var match=((data.weekly_matchups||{})[String(week)]||[]).find(function(m){return String(m.roster_id)===String(rid)});var starters=match?match.starters||[]:r.starters||[];(r.players||[]).forEach(function(id){var p=(data.players||{})[id];if(p&&game.teams.includes(p.team)){matched.push({manager:label(r.manager),name:playerName(p,id),team:p.team,position:p.position||'',starting:starters.includes(id)})}})});
matched.sort(function(a,b){return a.manager.localeCompare(b.manager)||Number(b.starting)-Number(a.starting)||a.name.localeCompare(b.name)});
if(!matched.length){block.appendChild(el('p','hp-watch-note','No rostered players found for this game.'));return}
var list=el('div','hp-watch-list');matched.forEach(function(p){var row=el('div','hp-watch-player');row.appendChild(el('strong','',p.manager));row.appendChild(el('span','',p.name+' · '+p.team+' '+p.position));row.appendChild(el('small',p.starting?'hp-watch-start':'hp-watch-bench',p.starting?'STARTER':'BENCH'));list.appendChild(row)});block.appendChild(list) });return block
}
function render(){var root=document.getElementById('hp-player-watch');if(!root)return;root.replaceChildren(el('p','hp-watch-note','Checking live NFL schedule and Sleeper rosters…'));get('https://api.sleeper.app/v1/state/nfl').then(function(state){var week=Number(state.week)||1;return Promise.all([nflGames(week),getSnapshot()]).then(function(a){return {week:week,games:a[0],data:a[1]}})}).then(function(v){root.replaceChildren();root.appendChild(el('div','hp-watch-head','THURSDAY & MONDAY PLAYER WATCH · WEEK '+v.week));root.appendChild(build('Thu',v.games.filter(function(g){return g.day==='Thu'}),v.data,v.week));root.appendChild(build('Mon',v.games.filter(function(g){return g.day==='Mon'}),v.data,v.week));root.appendChild(el('p','hp-watch-note','Read-only Sleeper ownership and weekly starters. Lineups can change before kickoff.'))}).catch(function(){root.replaceChildren(el('p','hp-watch-note','Player watch temporarily unavailable. Roster data will refresh automatically.'))})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
document.addEventListener('visibilitychange',function(){if(!document.hidden)render()});
setInterval(function(){if(!document.hidden)render()},300000);
})();
