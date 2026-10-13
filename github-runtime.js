// Public browser adapter; contains no credentials or delivery channels.
export const apiBase="https://srv2056230.hstgr.cloud";
export const storeParams=new URLSearchParams(location.search);
if(!storeParams.has('origem'))storeParams.set('origem',"principal");
const page=storeParams.get('pagina');
export const routePath=page==='pedido'?'/pedido/'+(storeParams.get('pedido')||''):['checkout','recuperar','condicoes','privacidade','atendimento'].includes(page)?'/'+page:'/';
const base=new URL('./',location.href);
export function toStoreUrl(value) {
  if(value.startsWith('#'))return value;
  const url=new URL(value,apiBase);
  if(url.origin!==apiBase)return value;
  const match=/^\/pedido\/([a-f0-9-]{36})$/.exec(url.pathname);
  const known=['/','/checkout','/recuperar','/condicoes','/privacidade','/atendimento'];
  if(!match&&!known.includes(url.pathname))return value;
  const result=new URL(base);result.search=url.search;result.hash=url.hash;
  result.searchParams.delete('pagina');result.searchParams.delete('pedido');
  if(match){result.searchParams.set('pagina','pedido');result.searchParams.set('pedido',match[1]);}
  else if(url.pathname!=='/')result.searchParams.set('pagina',url.pathname.slice(1));
  if(!result.searchParams.has('origem'))result.searchParams.set('origem',storeParams.get('origem'));
  return result.href;
}
export function localizeCatalog(data){if(data?.packs)for(const p of data.packs){p.image=new URL('.'+p.image,base).href;p.featuredPreview=new URL('.'+p.featuredPreview,base).href;p.previews=p.previews.map(x=>new URL('.'+x,base).href);}return data;}
function links(){for(const a of document.querySelectorAll('a[href]')){const old=a.getAttribute('href');const next=toStoreUrl(old);if(old!==next)a.setAttribute('href',next);}}
new MutationObserver(links).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',event=>{const a=event.target.closest?.('a[href]');if(a){const old=a.getAttribute('href');a.setAttribute('href',toStoreUrl(old));}},true);
