/* Season award races use the same week-by-week history already published in League HQ.
 * No second award ledger or invented award winners. Update weekly history -> race recalculates.
 */
(function(){
'use strict';
var root=document.getElementById('awards'),history=root&&root.querySelector('.award-weekly-history'),
charts=root&&root.querySelector('#award-race-charts'),status=root&&root.querySelector('#award-race-status');
if(!history||!charts||!status)return;
var categories=['Battle Beast','Uncle Ben','Watcher','Doctor Strange','Suicide Squad','Great Power','Punisher','Goblin Glider','Invisible Woman','Kryptonite','14,000,605 Outcomes','Stormbreaker','The Joker'];
var displayName=function(n){return n==='Dakota'?'DK (Dakota)':n;};
var awardDefinitions={"Battle Beast":{"description":"Highest fantasy points scored in a single week.","rule":"Automatic — highest actual lineup score."},"Uncle Ben":{"description":"Lowest fantasy points scored in a single week.","rule":"Automatic — lowest actual lineup score."},"Watcher":{"description":"Biggest lineup mistake measured by usable points left on the bench.","rule":"Automatic — optimal eligible lineup points minus actual points; review eligibility."},"Doctor Strange":{"description":"Best foresight, lineup call, or managerial decision of the week.","rule":"Commissioner selection."},"Suicide Squad":{"description":"Worst managerial decision of the week.","rule":"Commissioner selection; replaces Reverse Flash."},"Great Power":{"description":"A losing manager had a realistic winning lineup available but failed to start it.","rule":"Commissioner review; award only if a legal alternative could change the outcome."},"Punisher":{"description":"Largest winning margin of the week.","rule":"Automatic — winner’s points minus opponent’s points."},"Goblin Glider":{"description":"Largest fantasy scoring decline compared with the previous week.","rule":"Automatic — biggest week-to-week drop."},"Invisible Woman":{"description":"An eligible starting roster position was left empty.","rule":"Manual verification; an empty bench spot does not qualify."},"Kryptonite":{"description":"A starting player or defense scored negative fantasy points.","rule":"Manual verification of negative score in starting lineup."},"14,000,605 Outcomes":{"description":"A perfect NFL Pick’em week: every game selected correctly.","rule":"Automatic — correct picks equal all games played that week."},"Stormbreaker":{"description":"A manager ends the league’s longest active winning streak.","rule":"Award only when a meaningful league-leading streak is snapped."},"The Joker":{"description":"The most ridiculous, brutal, or painful fantasy loss of the week.","rule":"Commissioner selection."}};
function canon(s){
s=String(s||'').trim().replace(/\s+Award$/i,'');
if(s==='Joker')return 'The Joker';
if(s==='Doctor Strange — 14,000,605 Outcomes')return '14,000,605 Outcomes';
if(s==='The Watcher')return 'Watcher';
return s;
}
function element(tag,cls,txt){var x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=String(txt);return x;}
function count(){
var data={};categories.forEach(function(c){data[c]={};});
var finalized=[],invalid=[];
history.querySelectorAll('.panel').forEach(function(panel){
var heading=panel.querySelector('h2'),match=heading&&heading.textContent.match(/^Week\s+(\d+)$/i);
if(!match)return;
var week=Number(match[1]);finalized.push(week);
var seen={};
panel.querySelectorAll('.row').forEach(function(row){
var first=row.querySelector('strong'),winner=row.querySelector('.right a[href^="#coach-"]');
if(!first||!winner)return;
var award=canon(first.textContent),coach=winner.getAttribute('href').slice(7);
if(categories.indexOf(award)===-1||!coach||!/^\w+$/.test(coach))return;
if(!seen[award])seen[award]={};
if(seen[award][coach]){invalid.push(award+' Week '+week);return;}
seen[award][coach]=true;
if(!data[award][coach])data[award][coach]=[];
data[award][coach].push(week);
});
});
return {data:data,weeks:Array.from(new Set(finalized)).sort(function(a,b){return a-b}),duplicates:invalid};
}
function render(){
var results=count(),frag=document.createDocumentFragment();
categories.forEach(function(award){
var entries=Object.keys(results.data[award]).map(function(coach){
return {coach:coach,weeks:results.data[award][coach].slice().sort(function(a,b){return a-b})};
}).sort(function(a,b){return b.weeks.length-a.weeks.length||a.coach.localeCompare(b.coach)});
var max=entries.length?entries[0].weeks.length:0,total=entries.reduce(function(n,r){return n+r.weeks.length},0),leaders=entries.filter(function(x){return x.weeks.length===max});
var card=element('article','award-race-card'),head=element('div','award-race-card-header'),title=element('h3','',award);
head.appendChild(title);card.appendChild(head);
var definition=awardDefinitions[award];if(definition){card.appendChild(element('p','award-race-description',definition.description));card.appendChild(element('p','award-race-criteria',definition.rule));}
var leadText=entries.length?'LEADING: '+leaders.map(function(p){return displayName(p.coach)}).join(' + ')+' · '+max+' '+(max===1?'WIN':'WINS'):'NO CONFIRMED WEEKLY WINNER';
card.appendChild(element('p','award-race-leader',leadText));
if(!entries.length){card.appendChild(element('div','award-race-unclaimed','UNCLAIMED · 0 WINS'));}
else{
var rows=element('div','award-race-rows');
entries.forEach(function(entry){
var leading=entry.weeks.length===max,person=element('div','award-race-person'+(leading?' is-leading':'')),line=element('div','award-race-person-line');
var link=element('a','',displayName(entry.coach));link.href='#coach-'+entry.coach;
line.appendChild(link);line.appendChild(element('strong','',entry.weeks.length+' '+(entry.weeks.length===1?'WIN':'WINS')));person.appendChild(line);
var track=element('div','award-race-track'),fill=element('div','award-race-fill');
track.setAttribute('role','progressbar');track.setAttribute('aria-label',displayName(entry.coach)+' '+award+' awards');
track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(max));track.setAttribute('aria-valuenow',String(entry.weeks.length));
fill.style.width=(100*entry.weeks.length/max).toFixed(1)+'%';track.appendChild(fill);person.appendChild(track);
person.appendChild(element('div','award-race-week-note',entry.weeks.map(function(w){return 'W'+w;}).join(' · ')));
rows.appendChild(person);
});card.appendChild(rows);
}
card.appendChild(element('p','award-race-card-footer','Season title determined after the final award-eligible week. Tied leaders share the title.'));
frag.appendChild(card);
});
charts.replaceChildren(frag);
var weeks=results.weeks,statusText=weeks.length?'TRACKING '+weeks.length+' RECORDED '+(weeks.length===1?'WEEK':'WEEKS')+' · W'+weeks[0]+'–W'+weeks[weeks.length-1]:'NO RECORDED WEEKS YET';
if(results.duplicates.length)statusText+=' · CHECK DUPLICATE WINNERS';
status.textContent=statusText;
}
render();
var historyButton=document.getElementById('award-history-button');
var historyDrawer=document.getElementById('award-history');
if(historyButton&&historyDrawer)historyButton.addEventListener('click',function(){
  historyDrawer.open=true;
  historyDrawer.scrollIntoView({behavior:'smooth',block:'start'});
});
if('MutationObserver' in window){new MutationObserver(render).observe(history,{childList:true,subtree:true,characterData:true});}
})();
