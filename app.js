const store=window.STORE;
const packOrder=['premium','respostas','safadezas','anime','eleicoes','kpop','league-of-legends','divas-pop','gym','futebol','cantadas','trabalho'];
store.packs.sort((a,b)=>packOrder.indexOf(a.id)-packOrder.indexOf(b.id));
store.packs.forEach(pack=>{pack.count=pack.id==='premium'?'+ de 640':pack.id==='gym'?'+ de 40':'+ de 60'});
const packs=store.packs;
const badges={premium:'Acervo completo',respostas:'Mais vendido',safadezas:'Ousado',trabalho:'Popular agora',eleicoes:'Em alta',kpop:'Favorito',futebol:'Paixão nacional','divas-pop':'Icônico',gym:'Oferta',anime:'Otaku','league-of-legends':'Gamer',cantadas:'Para o crush'};
const headlines={
  premium:'Uma figurinha para cada momento.',
  respostas:'A resposta certa, sem digitar nada.',
  safadezas:'Sem filtro. Só para os íntimos.',
  anime:'Memes de anime para qualquer batalha.',
  eleicoes:'Quando a política vira piada no grupo.',
  kpop:'Seu fandom merece uma reação à altura.',
  'league-of-legends':'Vitória, derrota e culpa do jungler.',
  'divas-pop':'Quando só uma diva consegue traduzir você.',
  gym:'Treine o corpo. Exercite a zoeira.',
  futebol:'A resenha não termina no apito.',
  cantadas:'Quebre o gelo — ou passe vergonha.',
  trabalho:'Sobreviva ao expediente com bom humor.'
};
const money=value=>value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let activePack=packs[0].id;

const previewObserver='IntersectionObserver' in window?new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    const media=entry.target,source=media.dataset.src;
    if(entry.isIntersecting){
      if(source&&!media.getAttribute('src'))media.setAttribute('src',source);
      if(media.tagName==='VIDEO')media.play().catch(()=>{});
    }else{
      if(media.tagName==='VIDEO'){media.pause();media.removeAttribute('src');media.load()}
      else media.removeAttribute('src');
    }
  });
},{rootMargin:'100px 0px',threshold:.05}):null;

function watchPreviewMedia(root=document){
  root.querySelectorAll('[data-preview-media]:not([data-observed])').forEach(media=>{
    media.dataset.observed='true';
    if(previewObserver)previewObserver.observe(media);
    else media.setAttribute('src',media.dataset.src);
  });
}

function previewMedia(source,title){
  const cleanSource=String(source||'').split('?')[0].toLowerCase();
  if(/\.(mp4|webm|ogg)$/.test(cleanSource)){
    return `<video data-preview-media data-src="${source}" aria-label="Prévia animada do pack ${title}" loop muted playsinline preload="none"></video>`;
  }
  return `<img data-preview-media data-src="${source}" alt="Prévia do pack ${title}" loading="lazy" decoding="async">`;
}

function previewTile(pack,index=0,compact=false){
  const sources=compact?(pack.featuredPreview?[pack.featuredPreview]:[]):pack.previews;
  const custom=sources&&sources.length?sources[index%sources.length]:pack.image;
  return `<button class="preview-tile${compact?' compact':''}" data-select-pack="${pack.id}" style="--accent:${pack.color}" aria-label="Ver detalhes do pack ${pack.title}">
    <span class="preview-picture crop-${index%3}">${previewMedia(custom,pack.title)}${pack.id==='safadezas'?'<em class="adult-badge">+18</em>':''}</span>
    <small>${pack.title}</small>
  </button>`;
}

function packCard(pack){
  return `<article class="pack-card" style="--accent:${pack.color}">
    <div class="pack-cover"><img src="${pack.image}" alt="Capa do pack ${pack.title}" loading="lazy"><span class="status-badge">${badges[pack.id]}</span>${pack.id==='safadezas'?'<span class="adult-badge">+18</span>':''}</div>
    <div class="pack-card-body"><div class="pack-meta"><span>${pack.category}</span><b>${pack.count} figurinhas</b></div><h3>${pack.title}</h3><p>${pack.description}</p>
      <div class="pack-price"><strong>${money(pack.price)}</strong><button class="button primary mini" data-buy="${pack.id}">Comprar</button></div>
      <button class="details-button" data-select-pack="${pack.id}">Ver detalhes do pack <span>⌄</span></button>
    </div>
  </article>`;
}

function renderHomePreviews(){const root=document.querySelector('#home-preview-grid');if(root){root.innerHTML=packs.filter(pack=>pack.id!=='premium').map((pack,index)=>previewTile(pack,index,true)).join('');watchPreviewMedia(root)}}

function setupPreviewRotation(){
  const rail=document.querySelector('#home-preview-grid');
  if(!rail||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let paused=false,visible=false,resumeTimer;
  if('IntersectionObserver' in window){
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting},{threshold:.05}).observe(rail);
  }else visible=true;
  const pause=()=>{paused=true;clearTimeout(resumeTimer)};
  const resume=()=>{clearTimeout(resumeTimer);resumeTimer=setTimeout(()=>{paused=false},2200)};
  rail.addEventListener('pointerenter',pause);rail.addEventListener('pointerleave',resume);
  rail.addEventListener('pointerdown',pause);rail.addEventListener('pointerup',resume);
  rail.addEventListener('focusin',pause);rail.addEventListener('focusout',resume);
  setInterval(()=>{
    if(paused||!visible||document.hidden||rail.scrollWidth<=rail.clientWidth)return;
    const tile=rail.querySelector('.preview-tile');
    const step=(tile?tile.getBoundingClientRect().width:100)+12;
    const end=rail.scrollWidth-rail.clientWidth-4;
    rail.scrollTo({left:rail.scrollLeft>=end?0:Math.min(rail.scrollLeft+step,end),behavior:'smooth'});
  },2600);
}

function setupViewportAnimations(){
  const ticker=document.querySelector('.trust-ticker');
  if(!ticker)return;
  if(!('IntersectionObserver' in window)){ticker.classList.add('is-visible');return}
  new IntersectionObserver(entries=>{
    entries.forEach(entry=>entry.target.classList.toggle('is-visible',entry.isIntersecting));
  },{threshold:.05}).observe(ticker);
}

function setupCatalog(){
  const grid=document.querySelector('#pack-grid');if(!grid)return;
  const labels={all:'Todos',humor:'Humor',fandoms:'Cultura pop',lifestyle:'Dia a dia',games:'Games',esportes:'Esportes'};
  const filters=document.querySelector('#filters');let active='all';
  Object.entries(labels).forEach(([key,label])=>{const button=document.createElement('button');button.textContent=label;button.dataset.filter=key;if(key==='all')button.className='active';filters.append(button)});
  function draw(){const query=document.querySelector('#search').value.toLowerCase();const list=packs.filter(pack=>(active==='all'||pack.category===active)&&(`${pack.title} ${pack.description}`.toLowerCase().includes(query)));grid.innerHTML=list.map(packCard).join('');document.querySelector('#empty-state').hidden=!!list.length}
  filters.addEventListener('click',event=>{if(!event.target.dataset.filter)return;active=event.target.dataset.filter;filters.querySelectorAll('button').forEach(button=>button.classList.toggle('active',button===event.target));draw()});
  document.querySelector('#search').addEventListener('input',draw);draw();
}

function setupDetails(){
  const tabs=document.querySelector('#detail-tabs');if(!tabs)return;
  tabs.innerHTML=packs.map(pack=>`<button data-detail-tab="${pack.id}" style="--accent:${pack.color}">${pack.title}${pack.id==='safadezas'?'<span class="tab-adult">+18</span>':''}</button>`).join('');
  renderDetail(activePack);
}

function renderDetail(id){
  const pack=packs.find(item=>item.id===id)||packs[0];activePack=pack.id;
  document.querySelectorAll('[data-detail-tab]').forEach(button=>button.classList.toggle('active',button.dataset.detailTab===pack.id));
  const root=document.querySelector('#detail-panel');if(!root)return;
  root.style.setProperty('--accent',pack.color);
  root.querySelectorAll('[data-preview-media]').forEach(media=>{if(previewObserver)previewObserver.unobserve(media)});
  root.innerHTML=`<div class="detail-cover"><img src="${pack.image}" alt="Capa do pack ${pack.title}"><span>${badges[pack.id]}</span>${pack.id==='safadezas'?'<span class="adult-badge">+18</span>':''}</div>
    <div class="detail-copy"><div class="detail-topline"><span>${pack.category}</span><span>Pagamento único</span></div><h3>${headlines[pack.id]}</h3><p>${pack.longDescription}</p>
      <div class="detail-preview-heading"><b>Veja algumas prévias</b><small>Espaços preparados para as imagens reais</small></div><div class="detail-preview-row">${[0,1,2,3,4].map(index=>previewTile(pack,index)).join('')}</div>
      <div class="detail-benefits"><span>✓ Figurinhas estáticas</span><span>✓ Figurinhas animadas</span><span>✓ Acesso vitalício</span><span>✓ ${pack.count} figurinhas</span></div>
      <div class="detail-buy"><div><small>PACK COMPLETO POR</small><strong>${money(pack.price)}</strong></div><button class="button primary" data-buy="${pack.id}">Comprar agora ↗</button></div>
    </div>`;
  watchPreviewMedia(root);
}

function selectPack(id,scroll=true){renderDetail(id);if(scroll)document.querySelector('#detalhes').scrollIntoView({behavior:'smooth',block:'start'})}

function buy(id){
  const pack=store.packs.find(item=>item.id===id);
  if(!pack||!pack.payment.startsWith('http'))return;
  window.open(pack.payment,'_blank','noopener,noreferrer');
}

document.addEventListener('click',event=>{
  const selector=event.target.closest('[data-select-pack]'),tab=event.target.closest('[data-detail-tab]'),buyButton=event.target.closest('[data-buy]');
  if(selector)selectPack(selector.dataset.selectPack,true);if(tab)selectPack(tab.dataset.detailTab,false);if(buyButton)buy(buyButton.dataset.buy);
});
document.querySelectorAll('[data-social]').forEach(link=>{link.href=store.socials[link.dataset.social];link.target='_blank';link.rel='noopener'});
renderHomePreviews();setupPreviewRotation();setupViewportAnimations();setupCatalog();setupDetails();
