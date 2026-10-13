import {apiBase,storeParams,routePath,toStoreUrl,localizeCatalog} from './github-runtime.js';
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
async function api(path, options={}) {
  const response = await fetch(apiBase+path,{...options,credentials:'omit',headers:{'Content-Type':'application/json',...options.headers}});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir. Tente novamente.');
  return data;
}
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
  if (routePath === '/checkout') checkout();
  else if (routePath.startsWith('/pedido/')) void delivery();
  else if (routePath === '/recuperar') recover();
  else if(['/condicoes','/privacidade','/atendimento'].includes(routePath))void informationPage();
  else shop();
  async function informationPage(){
    try{
      const info=await api('/api/store-information');
      const seller=info.seller?`<h2>Responsável pela loja</h2><p>${esc(info.seller.name)} · Pessoa física<br>CPF: ${esc(info.seller.cpf)}<br>${esc(info.seller.address)}</p>`:'<p class="note">Prévia de informações comerciais. A identificação do responsável ainda não foi habilitada para publicação.</p>';
      const contact=`<h2>Fale com a loja</h2><p>${esc(info.supportHours)}. O processamento automático de pagamento e entrega não depende desse horário.</p><div class="hero-actions"><a class="button" href="mailto:texugodasfigs@gmail.com">Enviar e-mail</a><a class="button secondary" href="https://wa.me/5588992367356?text=${encodeURIComponent('Olá, Texugo das Figs! Preciso de atendimento sobre uma compra.')}" target="_blank" rel="noopener noreferrer">Atendimento no WhatsApp</a></div>`;
      const content={
        '/condicoes':`<h1>Condições de compra</h1><p>Versão da oferta: 13/10/2026.</p><h2>O que você compra</h2><p>Coleções digitais de figurinhas, conforme as prévias e a descrição de cada pack. Os 10 packs individuais custam R$ 9,90 cada. Premium custa R$ 19,90 e inclui os 10 packs atuais, sem promessa de lançamentos futuros. K-Pop e Divas Pop agora formam um único pack. Safadezas contém humor adulto; esse pack e o Premium exigem confirmação de idade mínima de 18 anos.</p><h2>Pagamento e entrega</h2><p>Pagamento único, sem mensalidade. Pix pelo aplicativo do seu banco ou cartão/outras opções disponíveis no checkout Mercado Pago. Confira o preço total e as condições exibidas pelo provedor antes de pagar. Não há cobrança de frete de produto físico.</p><p>Informe e confira seu e-mail antes do pagamento. Depois da confirmação validada no servidor, os botões dos canais são liberados e o link pessoal é enviado por e-mail. A confirmação pode levar alguns instantes; não pague novamente durante a espera. Confira também o spam. Se precisar corrigir o e-mail ou houver falha de entrega, procure o atendimento.</p><h2>Acesso vitalício</h2><p>A compra garante acesso vitalício às figurinhas dos packs adquiridos, sem mensalidade. O link pessoal tem validade técnica de 90 dias; sua expiração não encerra a garantia de acesso. Use “Meus acessos” com o e-mail da compra para recuperá-lo sempre que precisar.</p><p>Os conteúdos ficam em canais do WhatsApp, um serviço de terceiros. Se um canal mudar ou houver indisponibilidade que impeça o acesso, fale com a loja para regularização da entrega ou solução cabível. Não compartilhe seu link pessoal. O formato de canal não oferece bloqueio absoluto contra encaminhamento de links.</p><h2>Cancelamento, arrependimento e reembolso</h2><p>Você pode solicitar atendimento, cancelamento ou reembolso pelo e-mail e WhatsApp indicados abaixo. Informe o e-mail da compra e o nome do pack ou número do pedido. Seus direitos legais são preservados; o produto ser digital não é apresentado como renúncia automática ao direito de arrependimento. A solicitação será analisada conforme o caso e a legislação aplicável. Pagamentos estornados ou contestados podem ter o acesso suspenso.</p><p>Não envie senha, código de autenticação bancária ou cartão completo. A loja não exige comprovante no fluxo automático normal.</p>`,
        '/privacidade':`<h1>Privacidade</h1><p>Última atualização: 13/10/2026.</p><h2>Dados e finalidades</h2><p>Usamos e-mail, pack, valor, origem da vitrine, identificadores e situação do pedido/pagamento para processar sua compra, entregar e recuperar acessos, atender solicitações, prevenir fraude e tratar estornos e obrigações aplicáveis. Dados necessários à compra não são autorização para receber publicidade.</p><h2>Pagamentos e prestadores</h2><p>Mercado Pago processa os pagamentos. A loja não armazena número completo de cartão, código de segurança ou senha bancária. GitHub Pages hospeda a vitrine pública; Hostinger hospeda o sistema de compras; Gmail é usado para e-mails transacionais; Google Drive guarda cópias de backup criptografadas. Esses serviços podem tratar dados conforme seus próprios termos e infraestrutura, inclusive fora do Brasil. WhatsApp processa sua navegação e interação quando você abre os canais ou o atendimento; Instagram e TikTok são links externos.</p><h2>Visitas e armazenamento no navegador</h2><p>Contagens próprias usam identificador temporário da sessão, dia, página da vitrine/checkout e origem. A tabela de visitas não grava seu IP e esse código não usa fingerprint. Respeitamos os sinais DNT/GPC. Registros técnicos de segurança e infraestrutura podem envolver IP. O navegador também guarda credenciais pessoais de acesso; no painel exclusivo do proprietário há cookie protegido de sessão.</p><h2>Conservação e segurança</h2><p>Registros de visitas com mais de 90 dias têm limpeza configurada. Pedidos e dados necessários à entrega e recuperação são conservados para suporte, obrigações aplicáveis e defesa de direitos; pedidos e backups não possuem eliminação automática configurada. Você pode solicitar avaliação de acesso, correção e exclusão quando cabível. Dados que precisem ser conservados não são necessariamente eliminados de imediato.</p><p>Usamos controles de acesso, conexão HTTPS na loja publicada, tokens pessoais e backups criptografados. Nenhum sistema oferece segurança absoluta. Não compartilhe seu link de acesso ou códigos de autenticação.</p><h2>Seus direitos</h2><p>Solicite confirmação do tratamento, acesso, correção, informações sobre compartilhamento e demais direitos aplicáveis pelo e-mail da loja. Podemos conferir sua identidade de forma proporcional para não divulgar dados a terceiros. A análise respeita os prazos e hipóteses legais.</p>`,
        '/atendimento':`<h1>Atendimento e cancelamento</h1><p>Atendemos todos os dias, das 9h às 22h (horário de Brasília).</p><p>Para dúvida sobre uma compra, correção de e-mail, falta de acesso, cancelamento, reembolso ou privacidade, use os contatos abaixo. Informe o e-mail da compra e o pack ou número do pedido. Não envie senha bancária, código de autenticação ou cartão completo.</p><p>Se já pagou e o pedido estiver aguardando confirmação, não pague novamente. Verifique o e-mail e o spam. O atendimento humano pode ajudar quando a entrega automática não resolver.</p><p>Pedidos de arrependimento/cancelamento têm confirmação de recebimento pelo atendimento e análise conforme a legislação aplicável. Guarde sua solicitação e a resposta da loja.</p>`
      };
      main.innerHTML=`<article class="information-page"><a class="eyebrow" href="${home}"> Voltar à loja</a>${content[routePath]}${seller}${contact}</article>`;
    }catch{main.innerHTML='<p class="error">Não foi possível abrir estas informações. Tente novamente ou contate texugodasfigs@gmail.com.</p>';}
  }
  function shop() {
    main.innerHTML = `<section class="hero"><div><span class="eyebrow">A loja do Texugo · Figurinhas para seu WhatsApp</span><h1>Sua conversa merece<br><em>uma boa figurinha.</em></h1><p>Escolha um tema por <strong>${money(990)}</strong> ou leve os <strong>10 packs no Premium por ${money(1990)}</strong>. Pagou, confirmou, acessou: seus canais são liberados no site e o link chega por e-mail.</p><nav class="pack-topics" aria-label="Ir direto a um pack"><ul>${catalogData.packs.map(p=>`<li><a href="#pack-${p.id}" data-pack-topic="${p.id}"><strong>${esc(p.title)}</strong></a></li>`).join('')}</ul></nav><div class="hero-stats" aria-label="Resumo do acervo"><div><strong>+ de ${catalogData.total}</strong><span>figurinhas no Premium</span></div><div><strong>10 packs</strong><span>temas para todas as conversas</span></div><div><strong>Vitalício</strong><span>acesso · pagamento único</span></div></div><div class="hero-actions"><a class="button" href="#packs">Escolher meu pack</a><a class="button secondary" href="#previas">Ver as figurinhas</a></div></div><div class="hero-art"><img src="./media/logo-principal.jpeg" alt="Logo original Texugo das Figs" width="1600" height="874"></div></section>
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
  function checkout() {
    const selectedId=params.get('pack')==='kpop'?'divas-pop':params.get('pack');
    const pack = catalogData.packs.find(p=>p.id===selectedId);
    if (!pack) { main.innerHTML=`<h1>Pack não encontrado.</h1><a class="button" href="${home}">Escolher um pack</a>`; return; }
    if (pack.id !== 'premium' && params.get('etapa') !== 'pagamento') { offer(pack); return; }
    const questions=[
      ['Como vou receber meu pack?','Após a confirmação do pagamento, esta página libera os botões para acessar os canais dos packs comprados. O link pessoal também chega ao e-mail informado.'],
      ['Meu e-mail não chegou. O que faço?',`Confira o spam e a lixeira. Você pode pedir o reenvio em <a class="legal-inline" href="/recuperar?origem=${origin}">Meus acessos</a>, usando o mesmo e-mail da compra. Se digitou o e-mail errado, fale com o atendimento.`],
      ['E se eu fechar a página?','Tudo bem: depois da aprovação, o link de acesso será enviado por e-mail. Guarde esse e-mail para acessar novamente.'],
      ['Preciso enviar comprovante?','Não no fluxo automático desta página. O sistema consulta a confirmação do Mercado Pago e associa o pagamento ao seu pedido.'],
      ['Paguei o Pix e ainda não liberou','A confirmação pode levar alguns instantes. Aguarde na página do pedido, confira o e-mail e não pague novamente. Se a demora persistir, fale com o atendimento informando seu pedido.'],
      ['O que vem no Premium?','Todos os 10 packs atuais. K-Pop e Divas Pop agora formam um único pack. Esta compra não promete lançamentos futuros.'],
      ['Tem mensalidade?','Não. É um pagamento único, com acesso vitalício às figurinhas após a confirmação do pagamento.'],
      ['Não consegui abrir o canal ou encontrar o pack.','Abra o botão do pack na página de acesso e confira se seu WhatsApp está atualizado. Se o problema continuar, fale com o atendimento.'],
      ['O Pix venceu. Como pago?','Se ainda não pagou, volte à loja e inicie uma nova compra para gerar outro código. Se já pagou antes do vencimento, não pague novamente: aguarde a confirmação ou procure o atendimento.']
    ];
    main.innerHTML=`<section class="checkout payment-checkout" aria-label="Pagamento do pack"><div class="payment-card"><a class="brand offer-brand" href="${home}"><img src="./media/icone02.png" alt=""><span>Texugo <strong>das Figs</strong></span></a><span class="eyebrow">Compra e entrega online</span><div id="payment-choice"><h1 tabindex="-1" id="payment-title">Como você prefere pagar?</h1><p class="offer-subtitle">Escolha a opção mais fácil para você.</p><div class="payment-pack"><img src="${esc(pack.image)}" alt="Capa de ${esc(pack.title)}"><div><strong>${esc(pack.title)}</strong><span>${money(pack.amountCents)}</span></div></div><div class="payment-actions">${catalogData.pixEnabled?'<button class="button method-pix" type="button" data-method="pix"><strong>Pix</strong><small>Copie o código e pague pelo seu banco</small></button>':''}<button class="button method-card" type="button" data-method="checkout"><strong>Cartão</strong><small>Ou outras opções no Mercado Pago</small></button><button class="button method-help" type="button" id="payment-help">Dúvidas</button></div><details class="offer-about"><summary>Sobre seu acesso e a compra segura</summary>${securePurchaseNotice()}${purchaseConditions()}<p>Pagamento único. ${pack.id==='premium'?'Inclui os 10 packs atuais.':''} ${pack.sharedChannel?'K-Pop e Divas Pop agora formam um único pack.':''}</p></details><a class="offer-back" href="${home}#packs"> Voltar à loja</a></div><div id="payment-details" hidden><button type="button" class="payment-back" id="change-payment"> Trocar forma de pagamento</button><h1 id="method-title" tabindex="-1"></h1><p id="method-description"></p><p class="payment-pack-line">${esc(pack.title)} · <strong>${money(pack.amountCents)}</strong></p><form id="buy-form"><input type="hidden" name="payment-method" value="checkout"><label for="email">E-mail para receber os acessos</label><input id="email" type="email" autocomplete="email" maxlength="254" placeholder="voce@exemplo.com" required><p class="note">Confira com atenção: seus acessos serão enviados para esse endereço.</p>${(pack.adult||pack.id==='premium')?'<label class="check"><input id="adult" type="checkbox" required><span>Tenho 18 anos ou mais. Entendo que o pack Safadezas contém humor adulto.</span></label>':''}<p class="note">Pagamento único · Acesso vitalício · Atendimento diário das 9h às 22h (horário de Brasília).</p><button class="button full" id="pay" type="submit"></button><p class="error" id="error" role="alert"></p><p class="note">Antes de pagar, confira as <a class="legal-inline" href="/condicoes?origem=${origin}" target="_blank" rel="noopener">condições de compra</a> e o <a class="legal-inline" href="/privacidade?origem=${origin}" target="_blank" rel="noopener">aviso de privacidade</a>. Isso não autoriza envio de publicidade.</p></form><p class="note payment-wait">A confirmação pode levar alguns instantes após o pagamento. Não pague novamente enquanto estiver aguardando. Se preferir fechar a página, tudo bem: após a aprovação, enviaremos o link de acesso ao e-mail informado. Confira também o spam.</p>${securePurchaseNotice()}</div><div id="payment-faq" hidden><h1 id="faq-title" tabindex="-1">Dúvidas</h1><p class="offer-subtitle">Respostas rápidas para comprar sem complicação.</p><div class="payment-questions">${questions.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div><a class="button method-help" href="${esc(serviceUrl(pack))}" target="_blank" rel="noopener noreferrer">Ainda preciso de ajuda no WhatsApp</a><button class="button method-pix full" type="button" id="faq-back">Voltar ao pagamento</button></div></div></section>`;
    const buyForm=document.querySelector('#buy-form');
    document.querySelector('.payment-card').style.borderColor=pack.color;
    document.querySelector('#payment-details > .secure-purchase').remove();
    buyForm.insertAdjacentHTML('beforebegin',securePurchaseNotice());
    buyForm.insertAdjacentHTML('beforebegin',purchaseConditions());
    const showStep=id=>{
      for(const step of ['payment-choice','payment-details','payment-faq'])document.getElementById(step).hidden=step!==id;
      document.querySelector(`#${id} h1`).focus();
    };
    document.querySelectorAll('[data-method]').forEach(button=>button.addEventListener('click',()=>{
      const pix=button.dataset.method==='pix';
      buyForm.elements['payment-method'].value=button.dataset.method;
      document.querySelector('#method-title').textContent=pix?'Pagar com Pix':'Pagar com cartão';
      document.querySelector('#method-description').textContent=pix?'Informe seu e-mail para gerar um código exclusivo do seu pedido. Pague pelo aplicativo de qualquer banco, sem instalar o Mercado Pago.':'Informe seu e-mail. Na próxima etapa, você escolhe as opções disponíveis no checkout seguro do Mercado Pago.';
      const pay=document.querySelector('#pay');
      pay.className=`button full ${pix?'method-pix':'method-card'}`;
      pay.textContent=`${catalogData.mode==='demo'?'Simular':pix?'Gerar':'Continuar para'} ${pix?'Pix Copia e Cola':'o pagamento'} · ${money(pack.amountCents)}`;
      showStep('payment-details');
    }));
    document.querySelector('#payment-help').addEventListener('click',()=>showStep('payment-faq'));
    document.querySelector('#faq-back').addEventListener('click',()=>showStep('payment-choice'));
    document.querySelector('#change-payment').addEventListener('click',()=>showStep('payment-choice'));
    document.querySelector('#buy-form').addEventListener('submit',async event=>{
      event.preventDefault(); const button=document.querySelector('#pay'); button.disabled=true;
      document.querySelector('#error').textContent='';
      try {
        const paymentMethod=buyForm.elements['payment-method'].value;
        const order=await api('/api/orders',{method:'POST',body:JSON.stringify({packId:pack.id,origin,paymentMethod,
          email:document.querySelector('#email').value.trim(),adultConfirmed:document.querySelector('#adult')?.checked===true})});
        // Fragmento não é enviado ao servidor nem incluído em Referer.
        try { sessionStorage.setItem(`texugo:${order.id}`,order.token); } catch {}
        location.assign(toStoreUrl(order.checkoutUrl));
      } catch(error) { document.querySelector('#error').textContent=error.message; button.disabled=false; }
    });
  }
  function offer(pack) {
    const premium=catalogData.packs.find(p=>p.id==='premium');
    main.innerHTML=`<section class="offer-section" aria-labelledby="offer-title"><div class="offer-card"><a class="brand offer-brand" href="${home}"><img src="./media/icone02.png" alt=""><span>Texugo <strong>das Figs</strong></span></a><span class="eyebrow">Compra e entrega online</span><h1 id="offer-title">Uma oferta para você 🎁</h1><p class="offer-subtitle">Antes de continuar, aproveite o acervo completo.</p><div class="offer-message"><img src="./media/icone02.png" alt=""><p>Você escolheu <strong>${esc(pack.title)}</strong> por <strong>${money(pack.amountCents)}</strong>.</p></div><div class="offer-message"><img src="./media/icone02.png" alt=""><p>Super promoção: por mais <strong>${money(premium.amountCents-pack.amountCents)}</strong>, leve <strong>todos os 10 packs atuais</strong> no Premium por <strong>${money(premium.amountCents)}</strong>!</p></div><div class="offer-actions"><a class="button" id="accept-premium" href="${checkoutUrl('premium')}">Quero todos os packs · ${money(premium.amountCents)}</a><a class="button secondary" id="continue-pack" href="${checkoutUrl(pack.id)}&etapa=pagamento">Continuar com este pack · ${money(pack.amountCents)}</a></div><details class="offer-about"><summary>Sobre seu acesso</summary><p>Após a confirmação do pagamento, você recebe os botões dos canais na página da compra e um link pessoal por e-mail. O Premium inclui os 10 packs atuais, sem promessa de lançamentos futuros. K-Pop e Divas Pop agora formam um único pack.</p></details><a class="offer-back" href="${home}#packs"> Voltar à loja</a></div></section>`;
  }
  async function delivery() {
    const id=routePath.split('/').pop();
    let token=new URLSearchParams(location.hash.slice(1)).get('token');
    if (token) { try {sessionStorage.setItem(`texugo:${id}`,token);} catch {} }
    else { try {token=sessionStorage.getItem(`texugo:${id}`);} catch {} }
    if (!token) { main.innerHTML='<section class="recover"><h1>Recupere seu acesso.</h1><p>Abra o link pessoal enviado por e-mail ou solicite o reenvio.</p><a class="button" href="/recuperar">Recuperar por e-mail</a></section>'; return; }
    const headers={Authorization:`Bearer ${token}`};
    let refreshTimer;
    async function refresh() {
      clearTimeout(refreshTimer);
      try {
        const order=await api(`/api/orders/${id}`,{headers});
        updateOrigin(order.origin);
        const approved=order.status==='approved';
        const sandbox=catalogData.mode==='sandbox'&&!order.deliveryEnabled;
        if(catalogData.mode==='sandbox'&&order.deliveryEnabled)document.querySelector('#demo-banner').textContent='HOMOLOGAÇÃO · Canal real de Respostas liberado pelo proprietário somente para este pedido. Pagamentos reais continuam desativados.';
        const accessMarkup=order.links.map(p=>p.available===false||!p.url?`<button class="access" type="button" disabled aria-disabled="true">${esc(p.title)} · canal bloqueado no teste</button>`:`<a class="access" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Acessar ${esc(p.title)} <span></span></a>`).join('');
        const labels={approved:['✓','Suas figurinhas estão aqui.','Abra os canais abaixo para acessar suas coleções.'],pending:['◷','Aguardando confirmação.','Assim que o pagamento for confirmado, seus acessos aparecerão aqui. Não envie comprovantes pelo checkout.'],rejected:['!','Pagamento não aprovado.','Nenhum acesso foi liberado. Você pode voltar à loja e tentar novamente.'],revoked:['!','Acesso suspenso.','Este pedido foi cancelado, estornado ou contestado. Fale com o suporte se precisar de ajuda.']};
        const [icon,title,description]=approved&&sandbox?['✓','Pagamento fictício validado.','Este é um teste de pagamento e e-mail. Os canais reais não são liberados nesta etapa. Você não precisa preencher o e-mail novamente.']:labels[order.status]||labels.pending;
        main.innerHTML=`<section class="delivery"><div class="status-icon">${icon}</div><span class="eyebrow">${esc(order.pack)} · ${money(order.amountCents)}</span><h1>${title}</h1><p role="status">${description}</p>${approved?`<div class="access-list">${accessMarkup}</div><p class="note">${order.mailStatus==='simulated'?'Demonstração: o e-mail está disponível na prévia abaixo; nenhum envio real foi feito.':order.mailStatus==='sent'?'O envio do e-mail foi aceito pelo serviço. Confira sua caixa de entrada e o spam.':sandbox?'Seu e-mail de teste está na fila de envio. Ele abre esta página de confirmação, não um canal real.':'Seu e-mail de acesso está na fila de envio. Você já pode usar os botões acima.'}</p><p class="note">${sandbox?'O e-mail de teste leva a esta confirmação. A entrega das figurinhas pelos canais ainda não foi testada.':'Seu link de acesso é pessoal. Guarde-o e não compartilhe.'}</p>`:`<button class="button secondary" id="refresh">Verificar novamente</button>`}<p class="error" id="error" role="alert"></p>${catalogData.mode==='demo'?`<aside class="demo-tools"><strong>LABORATÓRIO DE COMPRA · SEM COBRANÇA</strong><p>Simule os resultados para conferir o que o cliente verá. Reembolso suspende o pedido; inicie outra compra para testar de novo.</p><div class="demo-buttons">${[['approved','Aprovar pagamento'],['pending','Manter pendente'],['rejected','Recusar'],['refunded','Simular reembolso']].map(([status,label])=>`<button data-demo="${status}">${label}</button>`).join('')}</div>${approved?'<button class="button secondary" id="email-preview">Ver e-mail simulado</button><pre id="email-text" hidden></pre>':''}</aside>`:''}<a class="button secondary" href="/?origem=${order.origin}">Voltar à loja</a></section>`;
        document.querySelector('#refresh')?.addEventListener('click',refresh);
        if(approved&&!sandbox)document.querySelector('.access-list').insertAdjacentHTML('afterend',purchaseConditions());
        if(order.status==='pending') {
          document.querySelector('#refresh').insertAdjacentHTML('beforebegin','<p class="note payment-wait">Já pagou? A confirmação pode levar alguns instantes. Não é preciso pagar novamente nem enviar comprovante. Caso não queira aguardar nesta página, pode fechá-la: assim que o pagamento for aprovado, enviaremos o link ao e-mail informado para você acessar seu pack novamente. Confira também o spam.</p>');
          if(order.pix) {
            const pix=order.pix;
            document.querySelector('.payment-wait').insertAdjacentHTML('beforebegin',`<section class="pix-box" aria-labelledby="pix-title"><h2 id="pix-title">${pix.simulated?'Prévia do Pix · sem cobrança':pix.expired?'Código Pix expirado':'Pague com Pix pelo seu banco'}</h2><p>${pix.simulated?'Esta demonstração não gera pagamento.':pix.expired?'Não pague este código. Se já pagou antes do vencimento, aguarde a confirmação.':'Não é necessário instalar o Mercado Pago. Copie o código ou escaneie o QR Code usando o aplicativo do seu banco.'}</p>${!pix.expired?`${pix.image?`<img class="pix-qr" src="data:image/png;base64,${esc(pix.image)}" alt="QR Code Pix deste pedido" width="240" height="240">`:''}<label for="pix-code">Pix Copia e Cola</label><textarea id="pix-code" readonly rows="3">${esc(pix.code)}</textarea><button class="button full" id="copy-pix" type="button" ${pix.simulated?'disabled':''}>Copiar código Pix</button><p id="pix-feedback" role="status"></p>`:''}<p class="note">Validade: ${esc(new Date(pix.expiresAt).toLocaleString('pt-BR'))}. Valor: ${money(order.amountCents)}.</p></section>`);
            document.querySelector('#copy-pix')?.addEventListener('click',async()=>{
              try {await navigator.clipboard.writeText(pix.code);document.querySelector('#pix-feedback').textContent='Código copiado! Abra o Pix Copia e Cola no aplicativo do seu banco.';}
              catch {document.querySelector('#pix-code').select();document.querySelector('#pix-feedback').textContent='Selecione e copie o código acima manualmente.';}
            });
          }
        }
        document.querySelectorAll('[data-demo]').forEach(button=>button.addEventListener('click',async()=>{
          button.disabled=true;
          try {await api(`/api/orders/${id}/demo`,{method:'POST',headers,body:JSON.stringify({status:button.dataset.demo})});await refresh();}
          catch(error){document.querySelector('#error').textContent=error.message;button.disabled=false;}
        }));
        document.querySelector('#email-preview')?.addEventListener('click',async()=>{
          try {const mail=await api(`/api/orders/${id}/email-preview`,{headers});const box=document.querySelector('#email-text');box.textContent=mail.text;box.hidden=false;}
          catch(error){document.querySelector('#error').textContent=error.message;}
        });
        if(order.status==='pending'&&catalogData.mode!=='demo') refreshTimer=setTimeout(refresh,8000);
      } catch(error) {main.innerHTML=`<section class="recover"><h1>Não foi possível abrir o pedido.</h1><p class="error">${esc(error.message)}</p><a class="button" href="/recuperar">Recuperar acesso por e-mail</a></section>`;}
    }
    await refresh();
  }
  function recover() {
    main.innerHTML='<section class="recover"><span class="eyebrow">Sua coleção, de volta</span><h1>Recuperar meus acessos.</h1><p>Use o mesmo e-mail informado na compra. Se houver pedidos aprovados, enviaremos os links pessoais para esse endereço.</p><form id="recover-form"><label for="email">E-mail da compra</label><input id="email" type="email" autocomplete="email" maxlength="254" required><button class="button full">Enviar meus acessos</button><p id="message" role="status"></p></form><p class="note">Confira também o spam. Nenhuma senha é necessária.</p></section>';
    document.querySelector('#recover-form').addEventListener('submit',async event=>{
      event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;
      try{const result=await api('/api/recover',{method:'POST',body:JSON.stringify({email:document.querySelector('#email').value.trim()})});document.querySelector('#message').textContent=result.message;}
      catch(error){document.querySelector('#message').textContent=error.message;}
      button.disabled=false;
    });
  }
}
