import {storeParams,routePath,toStoreUrl,localizeCatalog,showcaseApi} from './github-runtime.js';
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
const catalogData = localizeCatalog(await api('/api/catalog').catch(()=>null));
// First-party counts only: daily session IDs, no IP, fingerprint or personal URLs.
if(catalogData && ['/', '/checkout'].includes(routePath) && navigator.doNotTrack!=='1' && !navigator.globalPrivacyControl) {
  try {
    let session=sessionStorage.getItem('texugo-visit');
    if(!session){session=crypto.randomUUID();sessionStorage.setItem('texugo-visit',session);}
    void api('/api/visits',{method:'POST',body:JSON.stringify({session,origin,page:routePath==='/'?'home':'checkout'})}).catch(()=>{});
  } catch { /* Metrics never block checkout. */ }
}
if (!catalogData) { main.innerHTML = '<p class="error">Não foi possível carregar a loja. Atualize a página para tentar novamente.</p>'; }
else {
  document.querySelector('#demo-banner').hidden = catalogData.mode === 'production';
  if(catalogData.mode==='sandbox')document.querySelector('#demo-banner').textContent='HOMOLOGAÇÃO · Use apenas conta e cartão de TESTE. Nenhuma compra real. Canais reais não são liberados aqui.';
  const checkoutUrl = id => `/checkout?pack=${encodeURIComponent(id)}&origem=${origin}`;
  const purchaseConditions = () => '<aside class="purchase-conditions" aria-label="Acesso e atendimento"><strong>Acesso vitalício às figurinhas</strong><p>Atendimento: todos os dias, das 9h às 22h (horário de Brasília).</p><details><summary>Sobre a recuperação do acesso</summary><p>O acesso vitalício é liberado após a confirmação do pagamento, sem mensalidade. Se o link pessoal expirar, recupere-o em “Meus acessos” usando o e-mail da compra sempre que precisar. O pagamento e a entrega automática podem funcionar fora do horário de atendimento.</p></details></aside>';
  const securePurchaseNotice = () => `<aside class="secure-purchase" aria-label="Compra segura"><span aria-hidden="true">✓</span><div><strong>Compra segura · Mercado Pago</strong><p>${catalogData.mode==='demo'?'Nesta prévia, pagamentos e e-mails são simulados. Nenhuma cobrança é realizada.':'Pagamento processado pelo Mercado Pago. Os dados do seu cartão não são armazenados na loja. No Pix, pague pelo aplicativo do seu banco e confira o valor e o destinatário antes de confirmar.'}</p><small>Seu acesso é liberado após a confirmação do pagamento e também enviado por e-mail.</small></div></aside>`;
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
    main.innerHTML = `<section class="hero"><div><span class="eyebrow">A loja do Texugo · Figurinhas para seu WhatsApp</span><h1>Sua conversa merece<br><em>uma boa figurinha.</em></h1><p>Escolha um pacote de figurinhas por <strong>${money(990)}</strong> ou leve os <strong>10 pacotes no Premium por ${money(1990)}</strong>. Pagou, confirmou, acessou: seus canais são liberados no site e o link chega por e-mail.</p><h2 class="pack-list-title">Lista de pacotes</h2><nav class="pack-topics" aria-label="Ir direto a um pack"><ul>${catalogData.packs.map(p=>`<li><a href="#pack-${p.id}" data-pack-topic="${p.id}"><strong>${esc(p.title)}</strong></a></li>`).join('')}</ul></nav><div class="hero-stats" aria-label="Resumo do acervo"><div><strong>+ de ${catalogData.total}</strong><span>figurinhas no Premium</span></div><div><strong>10 pacotes</strong><span>temas para todas as conversas</span></div><div><strong>Vitalício</strong><span>acesso · pagamento único</span></div></div><div class="hero-actions"><a class="button" href="#packs">Escolher meu pack</a><a class="button secondary" href="#previas">Ver as figurinhas</a></div></div><div class="hero-art"><img src="./media/logo-principal.jpeg" alt="Logo original Texugo das Figs" width="1600" height="874"></div></section>
    <section class="premium-promo" aria-label="Promoção Premium"><div><span class="eyebrow">Mais figurinhas. Melhor custo-benefício.</span><h2>Todos os 10 packs. Uma única compra.</h2><p><strong>+ de ${catalogData.total} figurinhas</strong> para responder, rir e entrar na resenha. Acesso vitalício aos packs atuais, sem mensalidade.</p></div><div class="premium-promo-buy"><strong>${money(1990)}</strong><a class="button" href="${checkoutUrl('premium')}">Quero o Premium</a></div></section>
    <div class="benefits"><span>Pagamento único</span><span>Pix ou cartão no checkout</span><span>Acesso após confirmação</span><span>Recuperação por e-mail</span></div>
    <section id="packs"><div class="section-head"><div><span class="eyebrow">Escolha pela sua vibe</span><h2>Um pack para cada momento.</h2></div><input class="search" id="search" type="search" placeholder="Buscar um pack…" aria-label="Buscar packs"></div><div class="filters" aria-label="Filtrar packs">${[['all','Todos'],['humor','Humor'],['fandoms','Fandoms'],['games','Games'],['esportes','Esportes'],['lifestyle','Dia a dia']].map(([id,label])=>`<button class="filter" data-category="${id}" aria-pressed="${id==='all'}">${label}</button>`).join('')}</div><div class="grid" id="grid"></div></section>
    <section class="steps"><h2>Da compra ao seu WhatsApp, sem complicação.</h2><div class="step-grid"><div><span>01 · ESCOLHA</span><b>Encontre sua coleção</b><p>Avulso por R$ 9,90 ou todos os packs atuais no Premium por R$ 19,90.</p></div><div><span>02 · PAGUE</span><b>Informe seu e-mail e pague</b><p>Finalize no checkout do Mercado Pago. Não é preciso enviar comprovante nesse fluxo.</p></div><div><span>03 · ACESSE</span><b>Abra seus packs</b><p>Após a confirmação, os botões dos canais ficam disponíveis. Guarde também o e-mail de acesso.</p></div></div></section>
    <section class="faq"><h2>Antes de mandar a primeira figurinha.</h2><details><summary>O que recebo no Premium?</summary><p>Acesso aos 10 packs atuais. Esta compra não promete lançamentos futuros. O acervo anunciado possui 705 figurinhas.</p></details><details><summary>K-Pop e Divas Pop são um único pack?</summary><p>Sim. As duas coleções estão reunidas no pack K-Pop e Divas Pop, com uma única compra e um único canal.</p></details><details><summary>Preciso falar no WhatsApp para receber?</summary><p>Não para compras aprovadas neste checkout. Os botões aparecem na página de entrega e o acesso é enviado por e-mail. O WhatsApp fica disponível para dúvidas.</p></details><details><summary>Fechei a página. Como recupero?</summary><p>Guarde o e-mail enviado após a confirmação. Você também pode solicitar um novo acesso em “Meus acessos”, usando o mesmo e-mail da compra.</p></details><details><summary>Posso compartilhar meu acesso?</summary><p>O link da sua compra é pessoal. Não compartilhe. Os conteúdos ficam em canais do WhatsApp; esse formato não oferece bloqueio absoluto contra repasse de links.</p></details></section>`;
    const showcase=document.createElement('section');showcase.id='previas';showcase.className='preview-showcase';
    document.querySelector('.faq details p').textContent=`Acesso aos 10 packs atuais, com ${catalogData.total} figurinhas no acervo anunciado. Esta compra não promete lançamentos futuros.`;
    showcase.innerHTML=`<div class="section-head"><div><span class="eyebrow">Vitrine Texugo</span><h2>Escolha pela prévia.</h2></div><p>Clique para explorar as figurinhas de cada pack.</p></div><div class="preview-rail">${catalogData.packs.filter(p=>p.id!=='premium').map(p=>`<button class="preview-tile" data-preview="${p.id}" style="--accent:${p.color}" aria-label="Ver prévias de ${esc(p.title)}">${mediaMarkup(p.featuredPreview,`Figurinha de ${p.title}`,true)}<span>${esc(p.title)}${p.adult?' · +18':''}</span></button>`).join('')}</div>`;
    document.querySelector('#packs').before(showcase);
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
    document.querySelectorAll('[data-pack-topic]').forEach(link=>link.addEventListener('click',event=>{
      event.preventDefault();
      category='all';document.querySelector('#search').value='';
      document.querySelectorAll('[data-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category==='all')));
      draw();
      const target=document.getElementById(`pack-${link.dataset.packTopic}`);
      history.replaceState(null,'',`#${target.id}`);
      target.focus({preventScroll:true});target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    }));
  }
}
