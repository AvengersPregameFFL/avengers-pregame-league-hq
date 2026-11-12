/* Prime Time & Pick'em — one data source, screenshot-verified through Week 9. */
(function(){
"use strict";
const nick={DK:"Dakota",Hunter:"Hunter",Mike:"Mike",Jake:"Jake",Travis:"Travis",Alyssa:"Alyssa",Aaron:"Aaron",Nick:"Nick"};
const names=["DK","Hunter","Mike","Jake","Travis","Alyssa","Aaron","Nick"];
const escape=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function table(head,rows){return '<div class="tablewrap"><table class="prime-table"><thead><tr>'+head.map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';}
function result(points){return points[0]+'–'+points[1]}
function leaderboard(data,mode){
 let rows=names.map(name=>{
  let p=mode==="ALL"?["TNF","SNF","MNF"].reduce((acc,k)=>acc.map((x,i)=>x+data.baseline[name][k][i]),[0,0,0]):[...data.baseline[name][mode]];
  for(const g of data.games){if(g.includedInBaseline||(mode!=="ALL"&&g.kind!==mode))continue;const pick=g.picks[name];if(pick==null)p[2]++;else p[pick===g.winner?0:1]++}
  return {name,p,rate:p[0]+p[1]?100*p[0]/(p[0]+p[1]):0};
 }).sort((a,b)=>b.p[0]-a.p[0]||b.rate-a.rate||a.p[1]-b.p[1]||a.name.localeCompare(b.name));
 return table(["Rank","Manager","Correct–Wrong","Missed","Accuracy"],rows.map((x,i)=>[String(i+1),'<a href="#coach-'+(x.name==="DK"?"Dakota":x.name==="Alyssa"?"Allysa":x.name)+'">'+escape(nick[x.name])+'</a>',result(x.p),String(x.p[2]),x.rate.toFixed(1)+"%"]));
}
function gameTable(game){
 return table(["Manager","Pick","Result"],names.map(name=>{
 const p=game.picks[name];const state=p==null?"MISSED":p===game.winner?"CORRECT":"WRONG";
 return [nick[name],p||"No pick",'<strong class="'+(state==="CORRECT"?"green":state==="WRONG"?"red":"")+'">'+state+'</strong>'];
 }));
}
function primeUI(data){
 const section=document.getElementById("primetime");if(!section)return;
 const games=[...data.games].sort((a,b)=>b.week-a.week||({TNF:0,SNF:1,MNF:2}[a.kind]-{TNF:0,SNF:1,MNF:2}[b.kind]));
 let markup='<a class="back" href="#home">← Main menu</a><h1>Prime-Time Pick’em</h1>'+
 '<div class="panel" style="border:3px solid #171717;background:#fff1bf;color:#171717"><h2>VERIFIED THROUGH WEEK 9</h2><p>Thursday, Sunday night, and Monday night — all eight managers. Weeks 6–9 are reconstructed from league Sleeper Pool screenshots and official NFL finals. Historical Week 1–5/6 aggregate records remain included.</p><p class="muted">Week 10 selections not submitted yet. A missed pick counts as missed, never as a wrong prediction.</p></div>'+
 '<div class="panel"><h2>Combined Prime-Time Standings · Through Week 9</h2>'+leaderboard(data,"ALL")+'</div>'+
 '<div class="panel"><h2>Thursday Night Rankings</h2>'+leaderboard(data,"TNF")+'</div>'+
 '<div class="panel"><h2>Sunday Night Rankings</h2>'+leaderboard(data,"SNF")+'</div>'+
 '<div class="panel"><h2>Monday Night Rankings</h2>'+leaderboard(data,"MNF")+'</div>'+
 '<div class="panel"><h2>Week 10 · Upcoming Prime-Time Games</h2><p>Thursday: WAS @ NYG · Sunday: PIT @ CIN · Monday: LAC @ BAL. No unsubmitted picks are assumed.</p></div>'+
 '<h2>Week-by-Week Selections · Weeks 6–9</h2><p class="muted">Screenshots used to verify individual picks; Thursday of Week 6 is already included in historical baseline and is not counted twice.</p>';
 for(const w of [9,8,7,6]){
  markup+='<details class="panel season-week" '+(w===9?"open":"")+'><summary>Week '+w+' · All Three Prime-Time Games</summary>';
  for(const k of ["TNF","SNF","MNF"]){const g=games.find(g=>g.week===w&&g.kind===k);if(!g)continue;markup+='<h3>'+k+' · '+escape(g.teams)+' · Winner '+g.winner+'</h3>'+gameTable(g)}
  markup+='</details>';
 }
 markup+='<p class="muted">Data: screenshot-confirmed league selections + previously archived early-season records. For future weeks, submit the latest Sleeper pool screenshots so this ledger can be extended accurately.</p>';
 section.innerHTML=markup;
}
function pickUI(data){
 const section=document.getElementById("pickem");if(!section)return;
 const rows=names.map(name=>{const history=data.baseline_week1_to_5[name].concat([6,7,8,9].map(w=>data.weekly[w][name]));return {name,history,total:history.reduce((a,b)=>a+b,0)};}).sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name));
 let html='<a class="back" href="#home">← Main menu</a><h1>Pick’em</h1><p><a class="back" href="#primetime">SEE PRIME-TIME THURSDAY, SUNDAY &amp; MONDAY →</a></p>'+
 '<div class="panel" style="border:3px solid #171717;background:#fff1bf;color:#171717"><h2>2026 POOL STANDINGS · VERIFIED THROUGH WEEK 9</h2><p>Overall all-game Pick’em points are separate from Prime-Time Picks. Weeks 1–5 from the league Bible; Weeks 6–9 from the commissioner’s Sleeper pool screenshots.</p></div>'+
 '<div class="panel"><h2>Season Pick’em Leaders · Through Week 9</h2>'+table(["Rank","Manager","Correct Picks","Week 9"],rows.map((x,i)=>[String(i+1),nick[x.name],String(x.total),String(data.weekly["9"][x.name])]))+'</div>';
 for(const w of [9,8,7,6]){
 const rank=names.map(name=>({name,score:data.weekly[w][name]})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
 html+='<details class="panel season-week" '+(w===9?"open":"")+'><summary>Week '+w+' · Final Pool Results</summary>'+table(["Rank","Manager","Correct Picks"],rank.map((r,i)=>[String(i+1),nick[r.name],String(r.score)]))+'</details>';
 }
 html+='<p class="muted">Season totals count recorded Pool points, not tiebreaker guesses. Updated from available Week 6–9 results; new weeks require confirmed selections/results.</p>';
 section.innerHTML=html;
}
/* Independent feeds: a failed network request must NEVER erase the verified static Week 9 rankings. */
fetch("./data/prime-time-picks.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("prime-time feed "+r.status);return r.json()}).then(d=>{if(d.updated_through_week>=9)primeUI(d)}).catch(e=>console.warn("Using saved verified Prime-Time rankings",e));
fetch("./data/pickem-weekly-verified.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("pool feed "+r.status);return r.json()}).then(d=>{if(d.verified_through_week>=9)pickUI(d)}).catch(e=>console.warn("Using saved verified Pick'em rankings",e));
})();