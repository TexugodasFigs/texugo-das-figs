# Guia final — Texugo das Figs

Este guia mostra como preencher as informações da loja e publicar o site no GitHub Pages sem precisar programar.

## 1. Descompacte o site

1. Extraia o arquivo ZIP recebido.
2. Abra a pasta `texugo-das-figs`.
3. Confirme que `index.html` está logo dentro dessa pasta, ao lado de `data.js`, `app.js`, `styles.css` e da pasta `assets`.

## 2. Redes sociais e contato já configurados

O site já está configurado com Instagram, TikTok, WhatsApp e e-mail do Texugo das Figs. Você só precisa seguir as instruções abaixo caso queira alterar algum endereço futuramente.

1. Clique com o botão direito em `data.js`.
2. Escolha **Abrir com → Bloco de Notas**.
3. No início do arquivo, localize a parte chamada `socials`.
4. Troque somente o conteúdo que fica entre aspas depois de cada nome.

Use estes formatos:

- E-mail: `mailto:seunome@provedor.com`
- Instagram: `https://www.instagram.com/seu_usuario/`
- TikTok: `https://www.tiktok.com/@seu_usuario`
- WhatsApp: `https://wa.me/55DDDNUMERO`

No WhatsApp, use somente números, começando por `55`, seguido do DDD e do telefone. Não coloque espaços, parênteses, traços ou sinal de mais.

Exemplo para o número `(85) 99999-9999`: `https://wa.me/5585999999999`

Depois de editar, escolha **Arquivo → Salvar**.

## 3. Links do Mercado Pago já configurados

Os 12 packs já possuem seus respectivos links de pagamento. Ainda em `data.js`, cada pack possui uma informação chamada `payment`. Para substituir um link futuramente:

1. No Mercado Pago, crie ou copie o link de pagamento do pack.
2. Procure o pack correspondente em `data.js`.
3. Substitua o endereço atual pelo novo link completo.
4. Mantenha o link entre aspas.

Exemplo:

`payment:"https://mpago.la/SEU_LINK"`

Repita o processo para os 12 packs. O Premium também precisa de um link próprio.

## 4. Faça a conferência final

Antes de publicar, abra `index.html` e confirme:

- Instagram, TikTok, e-mail e WhatsApp abrem corretamente.
- O botão **Comprar** de cada pack leva ao link certo.
- Os preços exibidos são os mesmos do Mercado Pago.
- O Premium está com o link e o preço corretos.
- Nenhum texto `COLE_AQUI` ou `SEU_EMAIL_AQUI` permaneceu nos arquivos.

## 5. Crie o repositório no GitHub

1. Entre em `https://github.com` e faça login.
2. No canto superior direito, clique no símbolo **+** e depois em **New repository**.
3. Dê um nome simples, como `texugo-das-figs`.
4. Selecione **Public** para usar o GitHub Pages gratuito.
5. Clique em **Create repository**.

## 6. Envie os arquivos

1. Dentro do novo repositório, clique em **uploading an existing file**. Se essa opção não aparecer, use **Add file → Upload files**.
2. Arraste para a página todo o conteúdo da pasta `texugo-das-figs`.
3. É importante que `index.html` fique na raiz do repositório, e não escondido dentro de outra pasta.
4. Aguarde todos os arquivos terminarem de carregar.
5. No campo de mensagem, escreva `Publicação inicial do site`.
6. Clique em **Commit changes**.

## 7. Ative o GitHub Pages

1. No repositório, abra **Settings**.
2. No menu lateral, clique em **Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**.
4. Em **Branch**, selecione `main`.
5. Na pasta, selecione `/(root)`.
6. Clique em **Save**.

Após alguns minutos, o endereço aparecerá na mesma tela. Normalmente ele terá este formato:

`https://SEU_USUARIO.github.io/texugo-das-figs/`

## 8. Como atualizar o site depois

1. Faça a alteração nos arquivos do seu computador.
2. No GitHub, abra o repositório.
3. Use **Add file → Upload files**.
4. Envie novamente os arquivos alterados.
5. Clique em **Commit changes**.

O GitHub Pages publicará a nova versão automaticamente após o envio.

## Checklist de segurança

- Não coloque senhas, dados bancários ou códigos de acesso nos arquivos.
- O site deve conter somente links públicos de pagamento.
- Teste cada link de compra antes de divulgar a loja.
- Guarde uma cópia do ZIP final como backup.
