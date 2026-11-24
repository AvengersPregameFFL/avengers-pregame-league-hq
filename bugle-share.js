/* Share a single clickable four-panel link preview, never a duplicate attachment. */
(function(){
 const base=new URL('./',document.currentScript.src);
 const issueURL=new URL('stories/index.html',base);
 let meta=null;
 async function prepare(){try{const r=await fetch(new URL('stories/bugle-share.json',base),{cache:'no-store'});if(!r.ok)return;const d=await r.json();if(d.serial&&d.revision){meta=d;issueURL.searchParams.set('issue',d.revision)}}catch(e){}}
 prepare();
 async function share(){const serial=meta?.serial||document.querySelector('.mast-top span:last-child')?.textContent?.replace('ISSUE ','')||document.querySelector('.bugle-newstand-head small')?.textContent?.split('ISSUE ').pop()||'11.26';const data={title:'The Pregame Bugle — Issue '+serial,text:'Alright, fuckers. Another week, another Pregame Bugle. Issue '+serial+' is live.',url:issueURL.href};if(navigator.share){try{await navigator.share(data);return}catch(e){if(e.name==='AbortError')return}}try{if(navigator.clipboard){await navigator.clipboard.writeText(data.text+'\n'+data.url);alert('Bugle link copied.');return}}catch(e){}prompt('Copy the Bugle link',data.url)}
 window.shareBugleIssue=share;window.sharePregameBugle=share;window.shareBugleWithArt=share;
 function wire(){const btn=document.getElementById('shareIssue');if(btn)btn.addEventListener('click',share)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)prepare()});
})();