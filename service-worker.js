/* League HQ: network-first pages, safe offline fallback, bounded same-origin cache. */
const CACHE='avengers-pregame-hq-v101';
const CORE=['./','./index.html','./league-next-era.html','./commissioner-dues.html','./reports/latest.html','./manifest.webmanifest','./icons/icon.svg','./live-sync.js','./league-notifications.js','./awards-race.js','./awards-race.css','./stories/index.html','./stories/friday-week7.html','./stories/archive.html'];
const OFFLINE_LIMIT=90;
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(async cache=>{
    /* Missing optional content must never prevent service-worker installation. */
    await Promise.allSettled(CORE.map(path=>cache.add(path)));
  }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('avengers-pregame-hq-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
async function store(request,response){
  if(!response||!response.ok||response.type!=='basic')return response;
  const cache=await caches.open(CACHE);
  await cache.put(request,response.clone());
  const keys=await cache.keys();
  if(keys.length>OFFLINE_LIMIT){
    const pinned=new Set(CORE.map(p=>new URL(p,self.registration.scope).pathname));
    for(const key of keys){
      if((await cache.keys()).length<=OFFLINE_LIMIT)break;
      if(!pinned.has(new URL(key.url).pathname))await cache.delete(key);
    }
  }
  return response;
}
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  /* Never cache requests with authentication or sensitive query parameters. */
  if(request.headers.has('Authorization')||[...url.searchParams.keys()].some(k=>/token|secret|key|auth|password/i.test(k)))return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(request);
      if(response.ok)event.waitUntil(store(request,response).catch(()=>{}));
      return response;
    }catch(error){
      const cache=await caches.open(CACHE);
      const hit=await cache.match(request,{ignoreSearch:true});
      if(hit)return hit;
      if(request.mode==='navigate'){
        return new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>League HQ Offline</title><body style="font:16px system-ui;padding:24px;background:#17132b;color:white"><h1>League HQ is offline</h1><p>This page has not been saved for offline use. Reconnect to see current scores and league updates.</p><a style="color:#ffd400" href="./index.html">Return to League HQ</a></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
      }
      return Response.error();
    }
  })());
});