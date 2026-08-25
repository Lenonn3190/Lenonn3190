# Ponte — tradutor de voz PT ⇄ JA

Aplicativo web (PWA) para duas pessoas conversarem cara a cara quando uma fala
português e a outra fala japonês. O celular fica deitado na mesa entre os dois:
o lado de cima aparece de cabeça para baixo, virado para o japonês; o de baixo,
virado para você. Cada um tem o seu próprio botão de falar.

Não precisa instalar nada, não precisa de loja de aplicativos, e o convidado só
precisa abrir um link.

---

## Como funciona

```
  toque no botão  →  grava a fala      (MediaRecorder)
                  →  converte para WAV 16 kHz mono, direto no navegador
                  →  envia ao Google Gemini numa única chamada:
                       transcreve  +  traduz  +  gera o romaji  +  avisa ambiguidades
                  →  mostra o texto nos dois painéis ao mesmo tempo
                  →  fala a tradução em voz alta (síntese do próprio aparelho)
```

Um turno leva de **2 a 4 segundos**. É *push-to-talk* de propósito: streaming em
tempo real depende de conexão estável e cai em Wi-Fi ruim — aqui, se a rede
oscilar, você repete o toque e pronto.

A gravação **para sozinha** quando você fica ~1,6 s em silêncio, então na prática
é um toque só por fala.

### O que foi feito para ser robusto

| Risco | Como está resolvido |
|---|---|
| Áudio não entendido | O texto aparece nas duas línguas na tela — dá para ler e apontar mesmo se o som falhar |
| Japonês difícil de pronunciar | Romaji sempre embaixo do japonês |
| Jargão da empresa traduzido errado | Glossário obrigatório injetado no pedido de tradução |
| Pronome/assunto ambíguo | As 4 falas anteriores vão junto como contexto, e o intérprete avisa na tela quando assumiu um sentido |
| Formato de áudio incompatível entre Android e iPhone | Tudo é reconvertido para WAV no navegador antes de enviar |
| Voz distante ou ambiente barulhento | Normalização de pico do áudio antes do envio |
| Rede instável | Tempo limite de 45 s + uma repetição automática em erro de rede, 429 e 5xx |
| Erro de tradução | A mensagem de erro aparece **nas duas línguas** — o japonês entende o que houve |
| Modelo descontinuado | O seletor de modelos é preenchido pela própria API, em ⚙ → *Testar conexão* |
| Ficar sem internet | As frases essenciais funcionam offline, sem chave nenhuma |
| Tela apagando no meio da conversa | Wake Lock mantém o aparelho aceso |

---

## Instalação

### 1. Pegue a chave da API (grátis)

Em <https://aistudio.google.com/apikey>, crie uma chave. Ela começa com `AIza…`.
O nível gratuito do Gemini cobre com folga um dia inteiro de conversa.

### 2. Publique o app

**O microfone só funciona em HTTPS.** Abrir o arquivo direto (`file://`) ou por
um IP da rede local em HTTP **não vai funcionar** — o navegador bloqueia o
microfone. A forma mais simples de ter HTTPS de graça é o GitHub Pages:

1. No repositório, vá em **Settings → Pages**
2. Em *Source*, escolha a branch e a pasta raiz (`/`)
3. O app fica em `https://<seu-usuario>.github.io/ponte-voz/`

Esse é o link que você manda para o convidado.

### 3. Configure no celular

Abra o link, toque em **⚙**, cole a chave e toque em **Testar conexão**.
A chave fica salva só naquele aparelho.

No Android: menu do Chrome → *Adicionar à tela inicial*.
No iPhone: botão de compartilhar → *Adicionar à Tela de Início*.
Vira um ícone igual a um app instalado.

### 4. Verifique as vozes

Ainda em **⚙**, confira se aparece *✓ 日本語*. Se não aparecer, o aparelho não
tem a voz japonesa instalada e a tradução vai só aparecer escrita.
No Android: *Configurações → Sistema → Idiomas → Conversão de texto em voz →
instalar japonês*. No iPhone a voz japonesa (Kyoko) já vem de fábrica.

---

## Antes da visita: preencha o glossário

Este é o passo que mais melhora a qualidade e o que quase ninguém faz.
Toque em **用語集** e cadastre os termos que a tradução automática erraria:

| Português | 日本語 | Observação |
|---|---|---|
| romaneio | 積荷リスト | lista de embarque |
| ETG | ETG | nome da empresa, não traduzir |
| ordem de produção | 製造指図 | |
| torno CNC | CNC旋盤 | |

Cadastre também nomes próprios, códigos de peça e siglas internas. O intérprete
é instruído a usar exatamente esses equivalentes, sempre.

---

## Chave compartilhada (opcional)

Por padrão cada celular guarda a própria chave. Se preferir que ninguém precise
digitar chave nenhuma, publique o proxy da pasta `worker/` no Cloudflare Workers
(plano grátis) — a chave passa a viver só no servidor:

```bash
npm i -g wrangler
cd worker
wrangler login
wrangler secret put GEMINI_API_KEY     # cola a chave quando pedir
wrangler deploy
```

Ajuste `ALLOWED_ORIGINS` no `wrangler.toml` para o endereço onde o app está
publicado — sem isso, qualquer pessoa com a URL do worker gasta a sua cota.
Depois é só colar a URL do worker em **⚙ → Servidor intermediário**, e deixar o
campo da chave vazio.

---

## Estrutura

```
ponte-voz/
├── index.html          o app inteiro (HTML + CSS + JS, sem dependências)
├── manifest.json       metadados da PWA
├── sw.js               service worker (abre offline)
├── icon-192.png
├── icon-512.png
└── worker/
    ├── worker.js       proxy opcional que guarda a chave
    └── wrangler.toml
```

Zero dependências, zero build. Editar o `index.html` e dar push já publica.

---

## Limites conhecidos

- Uma pessoa por vez. Se os dois falarem juntos, o áudio sai embolado.
- Sem internet só as frases essenciais funcionam — tradução ao vivo precisa de rede.
- A qualidade da transcrição cai bastante com ruído alto de fundo; num galpão,
  fale perto do aparelho.
- A voz sintetizada depende do que está instalado no aparelho. O texto na tela
  não depende de nada e é sempre o plano de contingência.
