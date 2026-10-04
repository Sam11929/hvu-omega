(()=>{
  const VERSION="0.9.1";
  const BASE=new URL("./",document.baseURI).href;
  const CACHE="hvu-omega-ios:"+BASE+":"+VERSION;
  const MARKER="HVU_FULL_OFFLINE_CACHE:"+BASE;
  const MODULES=["./index.html","./reseau_r005.html","./protocoles.html","./autolab.html","./cadran.html","./enfant_univers.html"];
  window.HVU_PWA={version:VERSION,modules:MODULES};
  const BRIDGE_URL_KEY="HVU_BRIDGE_URL";
  const BRIDGE_TOKEN_KEY="HVU_BRIDGE_TOKEN";
  window.hvuBridgeBase=()=>String(localStorage.getItem(BRIDGE_URL_KEY)||"").trim().replace(/\/$/,"");
  window.hvuBridgeToken=()=>String(localStorage.getItem(BRIDGE_TOKEN_KEY)||"").trim();
  window.hvuBridgeMissionUrl=()=>{const b=window.hvuBridgeBase();return b?b+"/api/mission":""};
  window.hvuBridgeHealthUrl=()=>{const b=window.hvuBridgeBase();return b?b+"/health":""};
  window.hvuBridgeHeaders=(extra={})=>{
    const token=window.hvuBridgeToken();
    return token?{...extra,"X-HVU-Token":token}:{...extra};
  };
  window.hvuBridgeConfig=()=>({base:window.hvuBridgeBase(),tokenLoaded:Boolean(window.hvuBridgeToken())});
  window.hvuIsStandalone=()=>window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
  window.hvuIsIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(/Macintosh/i.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  const register=async()=>{
    if(!("serviceWorker" in navigator))throw Error("Le mode hors ligne nécessite un navigateur compatible et une adresse HTTPS.");
    await navigator.serviceWorker.register(new URL("sw.js",BASE).href,{scope:BASE,updateViaCache:"none"});
    return navigator.serviceWorker.ready;
  };
  window.hvuPWAReady=new Promise((resolve,reject)=>{
    if(document.readyState==="complete")register().then(resolve,reject);
    else window.addEventListener("load",()=>register().then(resolve,reject),{once:true});
  });
  window.hvuPWAReady.catch(()=>{});
  const hex=async buffer=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",buffer))].map(x=>x.toString(16).padStart(2,"0")).join("");
  window.hvuCacheAll=async(onProgress)=>{
    if(!("caches" in window)||!crypto.subtle)throw Error("Le préchargement nécessite une adresse HTTPS.");
    let timer;
    try{
      await Promise.race([window.hvuPWAReady,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error("Le mode hors ligne ne répond pas. Recharge la page en ligne et réessaie.")),15000)})]);
    }finally{clearTimeout(timer)}
    const manifestResponse=await fetch(new URL("offline-assets.json",BASE).href,{cache:"reload"});
    if(!manifestResponse.ok)throw Error("Liste des fichiers indisponible.");
    const manifest=await manifestResponse.clone().json();
    if(manifest.version!==VERSION)throw Error("Une nouvelle version est disponible. Recharge la page avant de préparer le mode hors ligne.");
    const cache=await caches.open(CACHE),failed=[],errors=[];
    let done=0,next=0;
    try{localStorage.removeItem(MARKER);localStorage.removeItem("HVU_FULL_OFFLINE_CACHE")}catch{}
    const worker=async()=>{
      while(next<manifest.files.length){
        const item=manifest.files[next++],url=new URL(item.path,BASE).href;
        try{
          const response=await fetch(url,{cache:"reload"});
          if(!response.ok)throw Error("HTTP "+response.status);
          const data=await response.clone().arrayBuffer();
          if(data.byteLength!==item.bytes||await hex(data)!==item.sha256)throw Error("Contenu incomplet ou différent de cette version");
          await cache.put(url,response);
        }catch(e){failed.push(item.path);errors.push({path:item.path,message:e.message})}
        done++;onProgress?.(done,manifest.files.length,failed.length);
      }
    };
    await Promise.all([worker(),worker(),worker()]);
    if(!failed.length){
      await cache.put(new URL("offline-assets.json",BASE).href,manifestResponse);
      try{localStorage.setItem(MARKER,JSON.stringify({version:VERSION,completedAt:new Date().toISOString(),files:done}))}catch{}
    }
    return {done,total:manifest.files.length,failed,errors,version:VERSION};
  };
})();
