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
 // Add a compact persistent navigation bar, linking only to verified in-document sections.
 if(!document.getElementById('clubhouse-navigation')){
 const nav=document.createElement('nav');nav.id='clubhouse-navigation';nav.setAttribute('aria-label','Clubhouse navigation');
 [['HOME','#home'],['LEAGUE HQ','#tesla-hq'],['FRANCHISES','#teams'],['RIVALRY','#rivalries'],['BUGLE','./stories/index.html']].forEach(([label,href])=>{const a=document.createElement('a');a.textContent=label;a.href=href;nav.append(a)});
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