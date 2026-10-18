(function(){
const APP_ID="0f86d84f-b2a8-401a-8c7e-f1dacf8d7094";
const base="/avengers-pregame-league-hq/";
let sdk=null;
function status(s){const e=document.getElementById("push-status");if(e)e.textContent=s}
function update(){const b=document.getElementById("push-toggle");if(!b||!sdk)return;const on=!!sdk.User.PushSubscription.optedIn;b.disabled=false;b.textContent=on?"Turn Off Game Alerts":"Enable Game Alerts";status(on?"Alerts enabled on this device.":"Alerts disabled on this device.")}
document.addEventListener("DOMContentLoaded",()=>{
 const box=document.createElement("section");box.className="panel";box.id="league-push";box.innerHTML='<h2>GAME DAY ALERTS</h2><p>Opt in for reminders an hour before Thursday, Sunday and Monday kickoff. Only subscribers receive alerts.</p><button type="button" id="push-toggle" disabled>Loading notifications...</button><p id="push-status" aria-live="polite">Connecting...</p>';
 const home=document.querySelector(".home");const hero=home&&home.querySelector(".hero");if(hero)hero.insertAdjacentElement("afterend",box);else(document.querySelector(".wrap")||document.body).prepend(box);
 const button=document.getElementById("push-toggle");
 button.style.cssText="background:#ffd400;color:#141923;font-weight:800;border:0;border-radius:10px;padding:12px 16px;cursor:pointer";
 button.addEventListener("click",async()=>{if(!sdk)return;button.disabled=true;try{if(sdk.User.PushSubscription.optedIn){await sdk.User.PushSubscription.optOut()}else{if(Notification.permission==="denied"){status("Unblock notifications in your browser site settings.");return}await sdk.Notifications.requestPermission();if(Notification.permission==="granted")await sdk.User.PushSubscription.optIn()}}catch(e){console.error(e);status("Unable to change notifications. Check browser permissions.")}finally{update()}});
 if(!("Notification" in window)||!("serviceWorker" in navigator)){status("This browser does not support web push.");button.textContent="Not supported";return}
 window.OneSignalDeferred=window.OneSignalDeferred||[];
 window.OneSignalDeferred.push(async OneSignal=>{try{await OneSignal.init({appId:APP_ID,serviceWorkerPath:base+"onesignal/OneSignalSDKWorker.js",serviceWorkerParam:{scope:base+"onesignal/"},notifyButton:{enable:false}});sdk=OneSignal;sdk.User.PushSubscription.addEventListener("change",update);update()}catch(e){console.error(e);status("Notification setup unavailable. Check OneSignal web settings.");button.textContent="Notifications unavailable"}});
});
})();