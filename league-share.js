document.addEventListener('DOMContentLoaded',function(){
var button=document.getElementById('share-league');if(!button)return;
button.addEventListener('click',async function(){
 var url='https://jumbojuggernaut.github.io/avengers-pregame-league-hq/';
 var data={title:'Avengers Pregame FFL',text:'Check out our fantasy football league HQ!',url:url};
 try{
  if(navigator.share){await navigator.share(data);return}
  if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(url)}
  else{var field=document.createElement('textarea');field.value=url;field.style.position='fixed';field.style.opacity='0';document.body.appendChild(field);field.select();if(!document.execCommand('copy'))throw Error('Copy unavailable');field.remove()}
  var previous=button.textContent;button.textContent='✓ COPIED';setTimeout(function(){button.textContent=previous},2200)
 }catch(e){if(e&&e.name==='AbortError')return;window.prompt('Copy and share the league link:',url)}
});
});