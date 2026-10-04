const VERSION="0.9.1";
const BASE=self.registration.scope;
const PREFIX="hvu-omega-ios:"+BASE+":";
const CACHE=PREFIX+VERSION;
const CORE=["./index.html","./pwa.js","./offline-assets.json","./manifest.webmanifest","./apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png"];
const absolute=path=>new URL(path,BASE).href;
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE.map(path=>new Request(absolute(path),{cache:"reload"})))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=="GET"||request.cache==="reload"||url.origin!==self.location.origin||!url.href.startsWith(BASE))return;
  const relative=url.pathname.slice(new URL(BASE).pathname.length);
  const fresh=request.mode==="navigate"||/\.html$/.test(relative)||["pwa.js","offline-assets.json","manifest.webmanifest"].includes(relative);
  let write=Promise.resolve();
  const result=(async()=>{
    const cache=await caches.open(CACHE);
    const key=request.mode==="navigate"?url.origin+url.pathname:request;
    const cached=await cache.match(key);
    if(cached&&!fresh)return cached;
    try{
      const response=await fetch(request);
      if(response.ok){write=cache.put(key,response.clone()).catch(()=>{});await write}
      return response;
    }catch(error){
      if(cached)return cached;
      if(request.mode==="navigate"){
        const clean=new URL(url.href);clean.search="";
        const exact=await cache.match(clean.href);
        if(exact)return exact;
        if(relative===""||relative==="index.html")return await cache.match(absolute("index.html"))||Response.error();
      }
      return Response.error();
    }
  })();
  event.respondWith(result);
  event.waitUntil(result.then(()=>write).catch(()=>{}));
});
