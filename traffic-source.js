// Only a campaign label is retained; no referrer URL, IP or cross-site identity.
const allowed=['instagram','tiktok','instagram_influencer'];
export function trafficSource(){
 if(navigator.doNotTrack==='1'||navigator.globalPrivacyControl)return 'unknown';
 const incoming=new URLSearchParams(location.search).get('canal');
 try{
  const saved=sessionStorage.getItem('texugo-source');
  if(saved==='unknown'||allowed.includes(saved))return saved;
  const source=allowed.includes(incoming)?incoming:'unknown';sessionStorage.setItem('texugo-source',source);return source;
 }catch{return allowed.includes(incoming)?incoming:'unknown';}
}
export function withTrafficSource(value){
 const source=trafficSource();if(source==='unknown')return value;
 const url=new URL(value,location.href);url.searchParams.set('canal',source);
 return value.startsWith('/')?url.pathname+url.search+url.hash:url.href;
}
