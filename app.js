import {storeParams,routePath,toStoreUrl,localizeCatalog,showcaseApi} from './github-runtime.js?v=8e97f07349bc';
import {trafficSource,withTrafficSource} from './traffic-source.js';
const main = document.querySelector('#main');
const params = storeParams;
let origin = params.get('origem') === 'uehara' ? 'uehara' : 'principal';
const esc = text => String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = cents => (cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const home = `/?origem=${origin}`;
document.querySelector('#home-link').href = home;
document.querySelector('#catalog-link').href = `${home}#packs`;
document.querySelector('#recover-link').href = `/recuperar?origem=${origin}`;
document.querySelector('#previews-link').href = `${home}#previas`;
document.querySelectorAll('.policy-links a').forEach(a=>{a.href=`${a.getAttribute('href')}?origem=${origin}`;});
function updateOrigin(value) {
  origin = value === 'uehara' ? 'uehara' : 'principal';
  document.querySelector('#home-link').href = `/?origem=${origin}`;
  document.querySelector('#catalog-link').href = `/?origem=${origin}#packs`;
  document.querySelector('#recover-link').href = `/recuperar?origem=${origin}`;
  document.querySelector('#previews-link').href = `/?origem=${origin}#previas`;
}
async function api(path, options={}) {return showcaseApi(path,{...options,headers:{'Content-Type':'application/json',...options.headers}});}
function homepagePreviews(packs) {
  // Pairs stay together; alternate collections between these intentional pairs.
  const selection = [
    ['respostas','rp03'], ['safadezas','sf3'],
    ['respostas','rp02'], ['respostas','rp01'],
    ['safadezas','sf1'], ['anime','anm03'],
    ['respostas','rp07'], ['respostas','rp06'],
    ['safadezas','sf2'], ['anime','anm04'],
    ['safadezas','sf5'], ['safadezas','sf6']
  ];
  return selection.map(([id,clip]) => {
    const pack=packs.find(p=>p.id===id);
    const path=pack?.previews.find(path=>path.endsWith(`/${clip}-20261013.mp4`));
    return path?{pack,path}:null;
  }).filter(Boolean);
}
function startPreviewMarquee(rail) {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(reduced.matches)return;
  const originals=[...rail.children];
  for(const tile of originals){const clone=tile.cloneNode(true);clone.setAttribute('aria-hidden','true');clone.tabIndex=-1;rail.append(clone);}
  let hovering=false,focused=false,manualPaused=false,pauseUntil=0,last=0,position=0,visible=true;
  const toggle=document.createElement('button');toggle.type='button';toggle.className='rail-toggle';toggle.textContent='Pausar prévias';toggle.setAttribute('aria-pressed','false');
  rail.closest('section').querySelector('.section-head').append(toggle);
  toggle.addEventListener('click',()=>{manualPaused=!manualPaused;toggle.textContent=manualPaused?'Retomar prévias':'Pausar prévias';toggle.setAttribute('aria-pressed',String(manualPaused));});
  const pause=()=>{pauseUntil=performance.now()+3500;position=rail.scrollLeft;};
  rail.addEventListener('pointerenter',()=>{if(matchMedia('(hover: hover)').matches)hovering=true;});
  rail.addEventListener('pointerleave',()=>{hovering=false;});
  rail.addEventListener('focusin',()=>{focused=true;});
  rail.addEventListener('focusout',()=>{focused=rail.contains(document.activeElement);});
  for(const name of ['pointerdown','touchstart','wheel','keydown'])rail.addEventListener(name,pause,{passive:true});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:0}).observe(rail);
  function frame(now){
    const elapsed=last?Math.min(now-last,50):0;last=now;
    if(visible&&!document.hidden&&!reduced.matches&&!manualPaused&&!hovering&&!focused&&now>pauseUntil&&!document.querySelector('dialog[open]')){
      const distance=rail.children[originals.length].offsetLeft-rail.children[0].offsetLeft;
      if(distance>0){position=(position+elapsed*0.052)%distance;rail.scrollLeft=position;}
    }else position=rail.scrollLeft;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
const catalogData = localizeCatalog(await api('/api/catalog').catch(()=>null));
// First-party counts only: daily session IDs, no IP, fingerprint or personal URLs.
if(catalogData && ['/', '/checkout'].includes(routePath) && navigator.doNotTrack!=='1' && !navigator.globalPrivacyControl) {
  try {
    let session=sessionStorage.getItem('texugo-visit');
    // Carry only the anonymous visit ID from the static showcase, never in query/logs.
    const incomingVisit=new URLSearchParams(location.hash.slice(1)).get('visita');
    if(routePath==='/checkout'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(incomingVisit||'')){
      session=incomingVisit;sessionStorage.setItem('texugo-visit',session);
      history.replaceState(null,'',routePath+location.search);
    }
    if(!session){session=crypto.randomUUID();sessionStorage.setItem('texugo-visit',session);}
    void api('/api/visits',{method:'POST',body:JSON.stringify({session,origin,trafficSource:trafficSource(),page:routePath==='/'?'home':'checkout'})}).catch(()=>{});
  } catch { /* Metrics never block checkout. */ }
}
if (!catalogData) { main.innerHTML = '<p class="error">Não foi possível carregar a loja. Atualize a página para tentar novamente.</p>'; }
else {
  document.querySelector('#demo-banner').hidden = catalogData.mode === 'production';
  if(catalogData.mode==='sandbox')document.querySelector('#demo-banner').textContent='HOMOLOGAÇÃO · Use apenas conta e cartão de TESTE. Nenhuma compra real. Canais reais não são liberados aqui.';
  const checkoutUrl = id => withTrafficSource(`/checkout?pack=${encodeURIComponent(id)}&origem=${origin}`);
  const purchaseConditions = () => '<aside class="purchase-conditions" aria-label="Acesso e atendimento"><strong>Acesso vitalício às figurinhas</strong><p>Atendimento: todos os dias, das 9h às 22h (horário de Brasília).</p><details><summary>Sobre a recuperação do acesso</summary><p>O acesso vitalício é liberado após a confirmação do pagamento, sem mensalidade. '+(true?'No cartão, receba atendimento e entrega pelo WhatsApp. No Pix, o acesso é automático e pode ser recuperado por e-mail em “Meus acessos”.':'Se o link pessoal expirar, recupere-o em “Meus acessos” usando o e-mail da compra sempre que precisar. O pagamento e a entrega automática podem funcionar fora do horário de atendimento.')+'</p></details></aside>';
  const securePurchaseNotice = () => `<aside class="secure-purchase" aria-label="Compra segura"><span aria-hidden="true">✓</span><div><strong>Compra segura · Mercado Pago</strong><p>${catalogData.mode==='demo'?'Nesta prévia, pagamentos e e-mails são simulados. Nenhuma cobrança é realizada.':'Pagamento processado pelo Mercado Pago. Os dados do seu cartão não são armazenados na loja. No Pix, pague pelo aplicativo do seu banco e confira o valor e o destinatário antes de confirmar.'}</p><small>${true?'Pix: acesso automático por e-mail. Cartão: entrega pelo atendimento no WhatsApp após aprovação.':'Seu acesso é liberado após a confirmação do pagamento e também enviado por e-mail.'}</small></div></aside>`;
  const serviceUrl = pack => `https://wa.me/5588992367356?text=${encodeURIComponent(`Olá, Texugo das Figs! Gostaria de atendimento sobre o ${pack.id==='premium'?'Premium Pack':`pack ${pack.title}`}.`)}`;
  const mediaMarkup = (path, label, lazy=false) => path.endsWith('.mp4')
    ? `<video ${lazy?`data-src="${esc(path)}"`:`src="${esc(path)}" controls`} muted loop playsinline preload="none" aria-label="${esc(label)}"></video>`
    : `<img src="${esc(path)}" alt="${esc(label)}" loading="lazy">`;
  const previewObserver = new IntersectionObserver(entries=>{
    for(const entry of entries) {
      const video=entry.target;
      if(entry.isIntersecting) {if(!video.src)video.src=video.dataset.src;video.play().catch(()=>{});}
      else video.pause();
    }
  },{rootMargin:'100px'});
  const dialog=document.createElement('dialog');
  dialog.className='preview-dialog';dialog.setAttribute('aria-labelledby','preview-title');document.body.append(dialog);
  let previewPack,previewIndex=0;
  function drawPreview() {
    const items=[...new Set([previewPack.featuredPreview,...previewPack.previews])];
    const pageSize=6,pageCount=Math.ceil(items.length/pageSize),page=Math.floor(previewIndex/pageSize);
    dialog.querySelectorAll('video').forEach(video=>video.pause());
    dialog.style.setProperty('--accent',previewPack.color);
    dialog.dataset.pack=previewPack.id;
    dialog.innerHTML=`<div class="preview-head"><div><span class="eyebrow">Conheça as figurinhas${previewPack.adult?' · +18':''}</span><h2 id="preview-title">${esc(previewPack.title)}</h2></div><button class="preview-close" aria-label="Fechar prévias">×</button></div><p class="preview-description">${esc(previewPack.description)}</p><div class="preview-gallery" aria-label="Prévias de ${esc(previewPack.title)}">${items.slice(previewIndex,previewIndex+pageSize).map((path,i)=>`<figure><div class="preview-cell">${mediaMarkup(path,`Prévia ${previewIndex+i+1} de ${previewPack.title}`)}</div><figcaption>Prévia ${previewIndex+i+1}</figcaption></figure>`).join('')}</div><div class="preview-controls" ${pageCount===1?'hidden':''}><button class="button secondary" data-direction="-1" aria-label="Prévia anterior">Anterior</button><span aria-live="polite">Página ${page+1} de ${pageCount}</span><button class="button secondary" data-direction="1" aria-label="Próxima prévia">Próxima</button></div><p class="preview-gallery-note">${items.length} prévias disponíveis · até 6 por tela</p><details class="preview-about"><summary>Sobre este pack</summary><p>${esc(previewPack.longDescription)}</p></details><div class="preview-buy"><div><span class="count" style="color:${previewPack.color}">${esc(previewPack.count)} figurinhas</span><strong class="price">${money(previewPack.amountCents)}</strong></div><div class="preview-buy-actions"><a class="button" href="${checkoutUrl(previewPack.id)}">Comprar ${esc(previewPack.title)}</a><a class="button secondary service-button" href="${esc(serviceUrl(previewPack))}" target="_blank" rel="noopener noreferrer">Atendimento via WhatsApp</a></div></div>`;
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)dialog.querySelectorAll('video').forEach(video=>video.play().catch(()=>{}));
    dialog.querySelector('.preview-close').addEventListener('click',()=>dialog.close());
    dialog.querySelectorAll('[data-direction]').forEach(b=>b.addEventListener('click',()=>{previewIndex=((page+Number(b.dataset.direction)+pageCount)%pageCount)*pageSize;drawPreview();dialog.querySelector(`[data-direction="${b.dataset.direction}"]`).focus();}));
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-preview]');if(!button)return;
    previewPack=catalogData.packs.find(p=>p.id===button.dataset.preview);if(!previewPack)return;
    previewIndex=0;drawPreview();dialog.showModal();document.body.classList.add('preview-open');
  });
  dialog.addEventListener('close',()=>{dialog.querySelectorAll('video').forEach(v=>v.pause());document.body.classList.remove('preview-open');});
  shop();
  function shop() {
    main.innerHTML = `<section class="hero"><div><span class="eyebrow">A loja do Texugo</span><h1>Sua conversa merece <em>figurinhas incríveis.</em></h1><p>Humor, memes, anime e figurinhas de todos os temas para seu WhatsApp.</p><div class="hero-proof"><div class="hero-icons" aria-hidden="true"><span><svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-8 13l-1 5 5-2a9 9 0 1 0 4-16Z"/><circle cx="8" cy="11" r="1"/><circle cx="12" cy="11" r="1"/><circle cx="16" cy="11" r="1"/></svg></span><span><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><path d="M8 14h8c-1 5-7 5-8 0Z"/></svg></span><span><svg viewBox="0 0 24 24"><path d="m14 2-9 12h6l-1 8 9-13h-6l1-7Z"/></svg></span></div><div><strong>+ de ${catalogData.total} figurinhas</strong><small>prontas para usar</small></div></div></div><div class="hero-art"><img src="./media/logo-recortada-20261014.png" alt="Logo original Texugo das Figs" width="1354" height="1161"></div></section>
    <section id="packs"><div class="section-head"><div><span class="eyebrow">Escolha pela sua vibe</span><h2>Um pack para cada momento.</h2></div><input class="search" id="search" type="search" placeholder="Buscar um pack…" aria-label="Buscar packs"></div><div class="filters" aria-label="Filtrar packs">${[['all','Todos'],['humor','Humor'],['fandoms','Fandoms'],['games','Games'],['esportes','Esportes'],['lifestyle','Dia a dia']].map(([id,label])=>`<button class="filter" data-category="${id}" aria-pressed="${id==='all'}">${label}</button>`).join('')}</div><div class="grid" id="grid"></div></section>
    <section class="premium-promo" aria-label="Promoção Premium"><div><span class="eyebrow">Mais figurinhas. Melhor custo-benefício.</span><h2>Todos os 10 packs. Uma única compra.</h2><p><strong>+ de ${catalogData.total} figurinhas</strong> para responder, rir e entrar na resenha. Acesso vitalício aos packs atuais, sem mensalidade.</p></div><div class="premium-promo-buy"><strong>${money(1990)}</strong><a class="button" href="${checkoutUrl('premium')}">Quero o Premium</a></div></section>
    <div class="benefits"><span>Pagamento único</span><span>Pix ou cartão no checkout</span><span>Acesso após confirmação</span><span>Pix automático · Cartão pelo WhatsApp</span></div>
    <section class="steps"><h2>Da compra ao seu WhatsApp, sem complicação.</h2><div class="step-grid"><div><span>01 · ESCOLHA</span><b>Encontre sua coleção</b><p>Avulso por R$ 9,90 ou todos os packs atuais no Premium por R$ 19,90.</p></div><div><span>02 · PAGUE</span><b>Escolha Pix ou cartão</b><p>Pix com entrega automática. Cartão pelo link seguro do Mercado Pago.</p></div><div><span>03 · ACESSE</span><b>Abra seus packs</b><p>No Pix, receba o acesso por e-mail. No cartão aprovado, vá ao WhatsApp com a mensagem do pacote pronta.</p></div></div></section>
    <section class="faq"><h2>Antes de mandar a primeira figurinha.</h2><details><summary>O que recebo no Premium?</summary><p>Acesso aos 10 packs atuais. Esta compra não promete lançamentos futuros. O acervo anunciado possui ${catalogData.total} figurinhas.</p></details><details><summary>K-Pop e Divas Pop são um único pack?</summary><p>Sim. As duas coleções estão reunidas no pack K-Pop e Divas Pop, com uma única compra e um único canal.</p></details><details><summary>Preciso falar no WhatsApp para receber?</summary><p>No Pix, a entrega é automática por e-mail. No cartão, após a aprovação, envie a mensagem preenchida no WhatsApp para receber seu pacote pelo atendimento.</p></details><details><summary>Fechei a página. Como recupero?</summary><p>No Pix, use “Meus acessos” com o e-mail da compra. No cartão com entrega pelo WhatsApp, procure o atendimento.</p></details><details><summary>Posso compartilhar meu acesso?</summary><p>O link da sua compra é pessoal. Não compartilhe. Os conteúdos ficam em canais do WhatsApp; esse formato não oferece bloqueio absoluto contra repasse de links.</p></details></section>`;
    const showcase=document.createElement('section');showcase.id='previas';showcase.className='preview-showcase';
    document.querySelector('.faq details p').textContent=`Acesso aos 10 packs atuais, com ${catalogData.total} figurinhas no acervo anunciado. Esta compra não promete lançamentos futuros.`;
    showcase.innerHTML=`<div class="section-head"><div><span class="eyebrow">Vitrine Texugo</span><h2>Escolha pela prévia.</h2></div><p>Clique para explorar as figurinhas de cada pack.</p></div><div class="preview-rail">${homepagePreviews(catalogData.packs).map(({pack:p,path})=>`<button class="preview-tile" data-preview="${p.id}" style="--accent:${p.color}" aria-label="Ver prévias de ${esc(p.title)}">${mediaMarkup(path,`Figurinha de ${p.title}`,true)}<span>${esc(p.title)}${p.adult?' · +18':''}</span></button>`).join('')}</div>`;
    document.querySelector('#packs').before(showcase);
    startPreviewMarquee(showcase.querySelector('.preview-rail'));
    document.querySelector('.steps').insertAdjacentHTML('beforebegin',securePurchaseNotice());
    document.querySelector('.steps').insertAdjacentHTML('beforebegin',purchaseConditions());
    showcase.querySelectorAll('video[data-src]').forEach(video=>previewObserver.observe(video));
    let category = 'all';
    const draw = () => {
      const query = document.querySelector('#search').value.trim().toLocaleLowerCase('pt-BR');
      const packs = catalogData.packs.filter(p=>(category==='all'||p.category===category)&&p.title.toLocaleLowerCase('pt-BR').includes(query));
      document.querySelector('#grid').innerHTML = packs.map(p=>`<article class="card" id="pack-${p.id}" tabindex="-1" data-pack="${p.id}" style="--accent:${p.color}"><img class="cover" src="${p.image}" alt="Capa de ${esc(p.title)}" loading="lazy" width="1181" height="1181"><div class="card-body"><span class="count">${esc(p.count)} figurinhas</span><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><div class="card-bottom"><span class="price">${money(p.amountCents)}</span><a class="button" href="${checkoutUrl(p.id)}">${p.id==='premium'?'Levar todos os packs':'Comprar pack'}</a><a class="button secondary service-button" href="${esc(serviceUrl(p))}" target="_blank" rel="noopener noreferrer">Atendimento via WhatsApp</a><button class="preview-link" data-preview="${p.id}">Ver prévias e detalhes do pack <span></span></button>${p.sharedChannel?'<small>Canal compartilhado: K-Pop + Divas Pop.</small>':''}</div></div></article>`).join('') || '<p class="empty">Nenhum pack encontrado. Tente outro nome.</p>';
    };
    document.querySelector('#search').addEventListener('input',draw);
    document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{
      category=button.dataset.category;
      document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      draw();
    }));
    draw();
  }
}
