/* Shared issue sharing: prefetch the actual four-panel image before the user taps. */
(function(){
 const script=document.currentScript;
 const base=new URL('./',script.src);
 const issueURL=new URL('stories/index.html',base);
 const coverURL=new URL('stories/bugle-share-cover.png',base);
 let file=null,meta=null;
 const prepare=async()=>{try{const response=await fetch(new URL('stories/bugle-share.json',base),{cache:'no-store'});if(!response.ok)throw Error('issue metadata');const data=await response.json();if(!data.serial||!data.cover||!data.revision)throw Error('invalid metadata');meta=data;coverURL.pathname=new URL('stories/'+data.cover,base).pathname;issueURL.searchParams.set('issue',data.revision);const art=await fetch(coverURL,{cache:'no-store'});if(!art.ok)throw Error('cover unavailable');const blob=await art.blob();if(!blob.type.startsWith('image/'))throw Error('invalid cover');file=new File([blob],'Pregame-Bugle-'+data.revision+'.png',{type:'image/png'});}catch(e){console.warn('Bugle preview unavailable',e)}};
 let ready=prepare();
 function shareData(){const serial=meta?.serial||document.querySelector('.mast-top span:last-child')?.textContent?.replace('ISSUE ','')||'11.26';return {title:'The Pregame Bugle — Issue '+serial,text:'Alright, fuckers. Another week, another Pregame Bugle. Issue '+serial+' is live.',url:issueURL.href}}
 async function share(){const data=shareData();if(navigator.share){try{if(file&&navigator.canShare?.({files:[file]})){await navigator.share({title:data.title,text:data.text+'\n'+data.url,files:[file]});return}await navigator.share(data);return}catch(e){if(e.name==='AbortError')return}}try{if(navigator.clipboard){await navigator.clipboard.writeText(data.text+'\n'+data.url);alert('Bugle link copied. The four-panel comic preview is available from the link.');return}}catch(e){}prompt('Copy the Bugle link',data.url)}
 window.shareBugleIssue=share;window.sharePregameBugle=share;window.shareBugleWithArt=share;
 function wire(){const btn=document.getElementById('shareIssue');if(btn){btn.addEventListener('click',share)}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!file)ready=prepare()});
})();