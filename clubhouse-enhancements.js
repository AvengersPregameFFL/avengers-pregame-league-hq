/* Progressive enhancements; never replace original league content or data. */
(()=>{'use strict';
const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
ready(()=>{
 const home=document.getElementById('home');
 if(!home)return;
 // Existing site already owns its hero, carousel, rivalry artwork and archive. Remove duplicate injected promotional sections.
 ['tesla-intro','tesla-rivalry'].forEach(id=>document.getElementById(id)?.remove());
 const old=document.getElementById('tesla-hq');if(old)old.remove();
 const links=[['Standings','Current rankings and season records','#standings'],['Weekly Reports','Results and weekly analysis','#league-schedule'],['Records','Milestones and historical achievements','#records'],['Awards','Official honors and winners','#awards'],["Pick’em",'Weekly predictions and accuracy','#pickem'],['Survivor','Picks, eliminations and re-buys','#survivor']];
 const section=document.createElement('section');section.id='tesla-hq';section.setAttribute('aria-label','League HQ navigation');
 const eyebrow=document.createElement('div');eyebrow.className='eyebrow';eyebrow.textContent='YOUR LEAGUE. YOUR LEGACY.';
 const title=document.createElement('h2');title.textContent='League HQ';section.append(eyebrow,title);
 links.forEach(([name,desc,href])=>{if(!document.querySelector(href))return;const a=document.createElement('a');a.className='hq-link';a.href=href;const span=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small'),arrow=document.createElement('b');strong.textContent=name;small.textContent=desc;arrow.textContent='→';span.append(strong,small);a.append(span,arrow);section.append(a)});
 const standings=home.querySelector('.hp-compact-standings-heading');if(standings)standings.before(section);else home.append(section);

 if(!document.getElementById('commissioner-office')){
 const page=document.createElement('section');page.id='commissioner-office';page.className='page';
 const coaches=['DK','Hunter','Mike','Jake','Travis','Allysa','Aaron','Nick'];
 page.innerHTML='<a class="back" href="#home">← Home</a><div class="club-kicker">LEAGUE ADMINISTRATION</div><h1>Commissioner’s Office</h1><p class="muted">Official administration for eight franchises.</p><div class="club-office-grid"><article class="panel"><h2>League Dues</h2><p><strong>$50</strong> per franchise · <strong>$400</strong> total buy-in</p><p>Payment status has not been verified.</p><div class="tablewrap"><table class="table"><thead><tr><th>Coach</th><th>Due</th><th>Payment</th></tr></thead><tbody>'+coaches.map(n=>'<tr><td>'+n+'</td><td>$50</td><td>Unverified</td></tr>').join('')+'</tbody></table></div></article><article class="panel"><h2>League Rules</h2><p>Eight franchises · full-point PPR · two FLEX positions · $50 buy-in.</p><p>Quarterback passing and rushing touchdowns each score six points. Team names must be comic-book themed.</p><p>Refer to Sleeper for remaining current platform settings.</p><a href="https://sleeper.com/leagues/1395849826633019392" target="_blank" rel="noopener noreferrer">OPEN SLEEPER →</a></article><article class="panel"><h2>League Booze Tracker</h2><p>No verified contributions or expenses are available for publication.</p></article><article class="panel"><h2>Announcements</h2><p>No verified commissioner announcement is currently published in this section.</p><a href="./stories/index.html">READ THE PREGAME BUGLE →</a></article></div>';
 home.before(page);
 }
 // Add a compact persistent navigation bar, linking only to verified in-document sections.
 if(!document.getElementById('clubhouse-navigation')){
 const nav=document.createElement('nav');nav.id='clubhouse-navigation';nav.setAttribute('aria-label','Clubhouse navigation');
 [['HOME','#home'],['LEAGUE HQ','#tesla-hq'],['FRANCHISES','#teams'],['RIVALRY','#rivalries'],['OFFICE','#commissioner-office'],['BUGLE','./stories/index.html']].forEach(([label,href])=>{const a=document.createElement('a');a.textContent=label;a.href=href;nav.append(a)});
 const header=document.querySelector('.header');if(header)header.after(nav);else home.before(nav);
 }
 // Fix prior link to missing commissioner anchor: only point to verified existing content.
 document.querySelectorAll('a[href="#hq-ledger-link"]').forEach(a=>{a.href='#home';a.title='Commissioner ledger not published yet'});
 // Prevent a fixed Week 6 header from masquerading as live data.
 const pill=document.querySelector('.header-actions .pill');
 if(pill){pill.textContent='FETCHING LEAGUE WEEK…';fetch('https://api.sleeper.app/v1/league/1395849826633019392').then(r=>{if(!r.ok)throw Error('Sleeper unavailable');return r.json()}).then(data=>{const w=Number(data.settings?.leg);pill.textContent=Number.isInteger(w)&&w>0?'WEEK '+w+' · SLEEPER':'LEAGUE WEEK UNAVAILABLE'}).catch(()=>{pill.textContent='LEAGUE WEEK UNAVAILABLE'})}
 // Keyboard and assistive technology support for the existing feature carousel.
 document.querySelectorAll('.hq-feature-tab').forEach(tab=>{tab.setAttribute('type','button');tab.addEventListener('click',()=>{document.querySelectorAll('.hq-feature-tab').forEach(b=>b.setAttribute('aria-pressed',String(b===tab)))})});
});
})();