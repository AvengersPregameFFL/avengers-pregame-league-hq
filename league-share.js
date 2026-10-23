document.addEventListener('DOMContentLoaded',function(){
const btn=document.getElementById('share-league');if(!btn)return;
const url='https://avengerspregameffl.github.io/avengers-pregame-league-hq/';
const msg='Avengers Pregame FFL League HQ: '+url;
const panel=document.createElement('div');panel.hidden=true;panel.id='league-share-options';
panel.style.cssText='position:fixed;z-index:99999;left:12px;right:12px;bottom:12px;max-width:480px;margin:auto;background:#fffaf0;color:#14111f;border:3px solid #14111f;border-radius:12px;padding:16px;box-shadow:0 0 0 200vmax #0009';
panel.innerHTML='<strong>SHARE LEAGUE HQ</strong><p>Choose how to send the link:</p><a id="share-sms">Send by text message</a><a id="share-wa">Send with WhatsApp</a><a id="share-email">Send by email</a><button id="share-copy">Copy link</button><button id="share-close">Close</button><p id="share-feedback" aria-live="polite"></p>';
document.body.appendChild(panel);
panel.querySelector('#share-sms').href='sms:?body='+encodeURIComponent(msg);
panel.querySelector('#share-wa').href='https://wa.me/?text='+encodeURIComponent(msg);
panel.querySelector('#share-email').href='mailto:?subject=Avengers%20Pregame%20FFL&body='+encodeURIComponent(msg);
panel.querySelectorAll('a,button').forEach(function(el){el.style.cssText='display:block;width:100%;box-sizing:border-box;padding:10px;margin-top:7px;background:#ffd400;color:#14111f;border:1px solid #14111f;border-radius:6px;text-align:center;font-weight:800;text-decoration:none;cursor:pointer'});
btn.addEventListener('click',function(){panel.hidden=false});
panel.querySelector('#share-close').addEventListener('click',function(){panel.hidden=true});
panel.querySelector('#share-copy').addEventListener('click',async function(){try{await navigator.clipboard.writeText(url);panel.querySelector('#share-feedback').textContent='Copied! Paste into any message.'}catch(e){window.prompt('Copy this link:',url)}});
});