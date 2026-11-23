/* Verified Sleeper draft selections, grouped by coach and year. */
(function(){
'use strict';
var LEAGUE='1395849826633019392', API='https://api.sleeper.app/v1', names={
'Dakota':['dakota','dk','juggernaut','jumbo package'],
'Hunter':['hunter','venom'],
'Mike':['mike','infinitybrocklet','infinity rocket','infinityb'],
'Jake':['jake','loki down bad','fondlerballer'],
'Travis':['travis','fantastic four skin'],
'Allysa':['allysa','alyssa','wanda wacks','wanda'],
'Aaron':['aaron','justice league','mexipez'],
'Nick':['nick','flash 23 blast','tc williams','t.c. williams']
};
var allPromise=null;
function req(path){return fetch(API+path).then(function(r){if(!r.ok)throw Error('Sleeper HTTP '+r.status);return r.json()});}
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function matches(coach,user,team){
 var words=names[coach]||[coach.toLowerCase()];
 var arr=[user&&user.display_name,user&&user.username,user&&user.metadata&&user.metadata.team_name,team].map(norm).filter(Boolean);
 return words.some(function(a){a=norm(a);return arr.some(function(b){return b===a||b.includes(a) && a.length>=4})});
}
function node(tag,cls,txt){var el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el;}
async function leagueYears(){
 var out=[],seen=new Set(),id=LEAGUE;
 for(var i=0;i<12&&id&&!seen.has(id);i++){
  seen.add(id);
  var lg=await req('/league/'+encodeURIComponent(id));
  if(!lg)break;
  var ds=await req('/league/'+encodeURIComponent(id)+'/drafts');
  var users=await req('/league/'+encodeURIComponent(id)+'/users');
  var rosters=await req('/league/'+encodeURIComponent(id)+'/rosters');
  var map={};
  (users||[]).forEach(function(u){map[u.user_id]=u});
  var rosterTeams={};
  (rosters||[]).forEach(function(r){var u=map[r.owner_id]||{};rosterTeams[r.owner_id]=(u.metadata&&u.metadata.team_name)||(r.metadata&&r.metadata.team_name)||''});
  var complete=(ds||[]).filter(function(d){return d&&d.status==='complete'});
  for(var j=0;j<complete.length;j++){
   var draft=complete[j];
   var picks=await req('/draft/'+encodeURIComponent(draft.draft_id)+'/picks');
   var draftUsers=draft.draft_order||{};
   out.push({year:String(draft.season||lg.season),draft:draft,users:map,rosterTeams:rosterTeams,picks:picks||[],draftUsers:draftUsers});
  }
  id=lg.previous_league_id;
 }
 return out.sort(function(a,b){return Number(b.year)-Number(a.year)});
}
function archive(){if(!allPromise)allPromise=leagueYears().catch(function(err){allPromise=null;throw err});return allPromise;}
function ownerOfPick(p,d){
 if(p.picked_by)return String(p.picked_by);
 var uid=Object.keys(d.draftUsers).find(function(id){return Number(d.draftUsers[id])===Number(p.draft_slot)});
 return uid||'';
}
function coachPicks(coach,d){
 var matchedIds=new Set();
 Object.keys(d.users).forEach(function(uid){if(matches(coach,d.users[uid],d.rosterTeams[uid]))matchedIds.add(uid)});
 // Require an identifiable owner; do not assign a draft slot merely from order.
 return (d.picks||[]).filter(function(p){return matchedIds.has(ownerOfPick(p,d))}).sort(function(a,b){return Number(a.pick_no)-Number(b.pick_no)});
}
function fill(el,ds,year){
 var coach=el.getAttribute('data-coach'),toolbar=el.querySelector('.coach-draft-toolbar'),
 status=el.querySelector('.coach-draft-status'),summary=el.querySelector('.coach-draft-summary'),
 list=el.querySelector('.coach-draft-list'),source=el.querySelector('.coach-draft-source');
 var matchesYear=ds.filter(function(d){return d.year===year}),chosen=matchesYear.find(function(d){return coachPicks(coach,d).length})||matchesYear[0];
 summary.replaceChildren();list.replaceChildren();source.hidden=true;
 if(!chosen){status.textContent='No completed Sleeper draft on record for '+year+'.';return;}
 var picks=coachPicks(coach,chosen);
 source.href='https://sleeper.com/draft/nfl/'+encodeURIComponent(chosen.draft.draft_id);source.hidden=false;
 if(!picks.length){status.textContent='Draft exists, but these selections could not be reliably matched to this coach. View the official board to verify ownership.';return;}
 status.textContent='Verified picks recorded from the official Sleeper '+year+' draft.';
 summary.appendChild(node('span','',year+' SEASON'));summary.appendChild(node('span','',picks.length+' PICKS'));
 var first=picks.find(function(p){return Number(p.round)===1});if(first)summary.appendChild(node('span','','FIRST ROUND · #'+first.pick_no));
 picks.forEach(function(p){
  var m=p.metadata||{},player=[m.first_name,m.last_name].filter(Boolean).join(' ').trim()||m.name||p.player_id||'Unknown player';
  var card=node('div','coach-draft-pick'),head=node('div','round');
  head.appendChild(node('span','','ROUND '+p.round));head.appendChild(node('span','','PICK #'+p.pick_no));card.appendChild(head);
  card.appendChild(node('strong','',player));
  card.appendChild(node('div','meta',[m.position,m.team].filter(Boolean).join(' · ')||'Position unavailable'));
  list.appendChild(card);
 });
}
function init(el){
 var coach=el.getAttribute('data-coach'),toolbar=node('div','coach-draft-toolbar'),
 label=node('label','','DRAFT SEASON'),select=node('select','coach-draft-year'),
 status=node('p','coach-draft-status','Open this section to load official Sleeper draft history.'),
 summary=node('div','coach-draft-summary'),list=node('div','coach-draft-list'),
 source=node('a','coach-draft-source','VIEW ORIGINAL SLEEPER DRAFT BOARD →');
 var id='draft-year-'+coach.toLowerCase();select.id=id;label.htmlFor=id;
 toolbar.appendChild(label);toolbar.appendChild(select);el.replaceChildren(toolbar,status,summary,list,source);
 source.target='_blank';source.rel='noopener noreferrer';source.hidden=true;
 var started=false;
 function show(){archive().then(function(ds){
  var years=[...new Set(ds.map(function(d){return d.year}))].sort(function(a,b){return Number(b)-Number(a)});
  if(!years.length){status.textContent='Sleeper has no completed drafts available for this league.';return;}
  select.replaceChildren();
  years.forEach(function(y){var o=node('option','',y);o.value=y;select.appendChild(o)});
  select.value=years[0];fill(el,ds,select.value);
  select.addEventListener('change',function(){fill(el,ds,select.value)});
 }).catch(function(){status.textContent='Sleeper draft history is temporarily unavailable. Please try again later.';started=false})}
 var details=el.closest('details');
 if(details){details.addEventListener('toggle',function(){if(details.open&&!started){started=true;show()}});if(details.open){started=true;show()}}
}
document.querySelectorAll('.coach-draft-history[data-coach]').forEach(init);
})();