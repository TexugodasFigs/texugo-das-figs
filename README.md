# Texugo das Figs — guia simples

Este site foi feito para funcionar gratuitamente no GitHub Pages. Não precisa instalar nada.

## Antes de publicar

Os contatos, redes sociais e os 12 links do Mercado Pago já estão configurados. Antes do envio ao GitHub, abra `index.html` e faça uma última conferência dos botões. Se algum endereço mudar futuramente, ele poderá ser atualizado no arquivo `data.js`.

## Como adicionar um novo pack

1. Coloque a imagem da capa dentro de `assets/packs`.
2. Abra `data.js`.
3. Copie um bloco de pack já existente, cole antes do último `]` e altere título, preço, imagem, descrição e link de pagamento.

## Como trocar as prévias

As áreas de prévia já possuem a marca d'água **PRÉVIA** e o nome do pack logo abaixo. Por enquanto elas usam recortes das capas para mostrar o funcionamento.

Quando você tiver as figurinhas que deseja exibir:

1. Coloque as imagens dentro de `assets/previas`. Para figurinhas animadas, use GIF, WebP animado ou APNG. O site também aceita pequenos vídeos MP4, WebM e OGG, reproduzidos automaticamente, sem som e em repetição.
2. Abra `data.js` e acrescente ao pack correspondente o campo `previews`, como neste exemplo:

   `previews:["assets/previas/respostas-01.webp","assets/previas/respostas-02.gif"]`

3. Mantenha somente versões com marca d'água ou em resolução reduzida para proteger o conteúdo.

As prévias da vitrine e dos detalhes levam o cliente diretamente ao pack escolhido, sem abrir outra página.

Para economizar bateria e dados no celular, as imagens e animações das prévias só são carregadas enquanto estão próximas da área visível. A vitrine avança automaticamente, mas continua aceitando a rolagem manual. A animação pausa quando o visitante interage com a faixa ou sai dessa parte da página.

## Como funciona a página única

- Os packs comuns aparecem na vitrine compacta.
- O Premium fica em destaque mais abaixo.
- O botão **Ver detalhes** e cada prévia levam à área de detalhes da mesma página.
- A capa de cada pack já inclui seu texugo correspondente.

## Como publicar no GitHub Pages

1. Crie um repositório novo no GitHub.
2. Envie todos os arquivos desta pasta para o repositório.
3. No repositório, abra **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch **main**, a pasta **/(root)** e clique em **Save**.

O endereço do site aparecerá nessa mesma tela após alguns minutos.

## Página de confirmação

Configure no Mercado Pago o retorno aprovado para `obrigado.html`. Exemplo: `https://seuusuario.github.io/seurepositorio/obrigado.html`.
