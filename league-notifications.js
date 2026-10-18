(function(){
const APP_ID="0f86d84f-b2a8-401a-8c7e-f1dacf8d7094";
const base="/avengers-pregame-league-hq/";
let sdk=null;
function status(s){const e=document.getElementById("push-status");if(e)e.textContent=s}
function update(){const b=document.getElementById("push-toggle");if(!b||!sdk)return;const on=!!sdk.User.PushSubscription.optedIn;b.disabled=false;b.textContent=on?"Turn Off Game Alerts":"Enable Game Alerts";status(on?"Alerts enabled on this device.":"Alerts disabled on this device.")}
document.addEventListener("DOMContentLoaded",()=>{
 const box=document.createElement("section");box.className="panel";box.id="league-push";box.innerHTML='<h2>GAME DAY ALERTS</h2><p class="push-explain">Tap the button to turn phone notifications on or off. When enabled, get a reminder 1 hour before Thursday, Sunday and Monday kickoff to check your lineup, injuries, Pick’em and Survivor. No phone number needed.</p><button type="button" id="push-toggle" disabled>Loading notifications...</button><p id="push-status" aria-live="polite">Connecting...</p>';
 const home=document.querySelector(".home");const hero=home&&home.querySelector(".hero");if(hero)hero.insertAdjacentElement("afterend",box);else(document.querySelector(".wrap")||document.body).prepend(box);
 const button=document.getElementById("push-toggle");
 button.style.cssText="background:#ffd400;color:#141923;font-size:13px;font-weight:800;border:0;border-radius:7px;padding:8px 11px;cursor:pointer;max-width:100%;width:auto;display:inline-block";box.style.cssText="padding:14px 16px;margin:10px 0 16px";const h=box.querySelector("h2");if(h)h.style.cssText="font-size:18px;margin:0 0 7px";const p=box.querySelector(".push-explain");if(p)p.style.cssText="font-size:13px;line-height:1.4;margin:0 0 9px";const st=box.querySelector("#push-status");if(st)st.style.cssText="font-size:12px;margin:7px 0 0";
 button.addEventListener("click",async()=>{if(!sdk)return;button.disabled=true;try{if(sdk.User.PushSubscription.optedIn){await sdk.User.PushSubscription.optOut()}else{if(Notification.permission==="denied"){status("Unblock notifications in your browser site settings.");return}await sdk.Notifications.requestPermission();if(Notification.permission==="granted")await sdk.User.PushSubscription.optIn()}}catch(e){console.error(e);status("Unable to change notifications. Check browser permissions.")}finally{update()}});
 if(!("Notification" in window)||!("serviceWorker" in navigator)){status("This browser does not support web push.");button.textContent="Not supported";return}
 window.OneSignalDeferred=window.OneSignalDeferred||[];
 window.OneSignalDeferred.push(async OneSignal=>{try{await OneSignal.init({appId:APP_ID,serviceWorkerPath:base+"onesignal/OneSignalSDKWorker.js",serviceWorkerParam:{scope:base+"onesignal/"},serviceWorkerOverrideForTypical:true,notifyButton:{enable:false}});sdk=OneSignal;sdk.User.PushSubscription.addEventListener("change",update);update()}catch(e){console.error(e);status("OneSignal error: "+(e&&e.message?e.message:String(e)));button.textContent="Retry Notification Setup";button.disabled=false;button.onclick=()=>location.reload()}});
});
})();