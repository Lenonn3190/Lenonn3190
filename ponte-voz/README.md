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
| Modelo descontinuado | O seletor de modelos é preenchido pela própria API, em ⚙ → *Testar conexão*, ordenado por versão |
| Assunto ou registro errado na tradução | Campo de contexto da atividade vai junto em cada pedido |
| Ficar sem internet | As frases essenciais funcionam offline, sem chave nenhuma |
| App gravar a própria voz sintetizada | A síntese é cancelada ao começar a gravar |
| Microfone ruim em ambiente barulhento | Dá para escolher o microfone do headset em ⚙ |
| Tela apagando no meio da conversa | Wake Lock mantém o aparelho aceso |
| Cada um ouvir a língua que não entende | Modo fone separa as vozes por lado do par Bluetooth |
| TTS do Gemini fora do ar | Cai para a síntese do aparelho e avisa, em vez de ficar mudo |
| Modelo de voz descontinuado | O seletor de modelo de voz também é preenchido pela API |
| Mudança no formato da chave | Aceita `AQ.` e `AIza`, e avisa que o formato antigo se encerra em setembro de 2026 |
| Cabeçalho de autenticação barrado | *Testar conexão* detecta e cai para `?key=`, guardando o método que funciona |
| Modelo indisponível (404), aposentado ou sobrecarregado (503) | O app desce para o próximo modelo e refaz a tradução sozinho |
| Modelo pendurado | Corta em 30 s e troca de modelo, em vez de acusar falta de internet |
| Latência alta | `thinkingLevel: LOW` — medido: 6,1 s → 2,4 s |
| Voz demorando e travando a conversa | O microfone é liberado com o texto; a voz chega depois, em segundo plano |
| Mesma frase repetida | O áudio já gerado é reaproveitado, sem nova chamada |
| Voz atrasada atropelando a fala seguinte | Uma fala nova cancela a voz anterior |
| Erro da API ilegível na barra de status | O texto completo aparece no painel, que quebra linha e rola |

---

## Instalação

### 1. Pegue a chave da API (grátis)

Em <https://aistudio.google.com/apikey>, crie uma chave. As novas vêm no
formato `AQ.Ab8…`; o formato antigo `AIza…` ainda é aceito pelo app, mas o
Google encerra essas chaves em **setembro de 2026**, então prefira gerar uma
nova. O nível gratuito cobre com folga um dia inteiro de conversa.

A chave vai no cabeçalho `x-goog-api-key`, não em `?key=`: é o que o Google
recomenda, é o que funciona com as chaves novas, e mantém a chave fora da URL
(que vaza em log e histórico). Se o cabeçalho for barrado no seu ambiente, o
botão *Testar conexão* detecta e cai para `?key=` sozinho, avisando qual dos
dois está em uso.

**Assinatura Gemini Pro não serve aqui.** As assinaturas de consumidor (Google
AI Pro / Ultra) valem dentro do app do Gemini e do AI Studio; o uso por chave
de API é cobrado à parte, via Cloud Billing. Pagar a assinatura não aumenta
nem libera nada para este app. O que vale é o nível gratuito da chave, ou
ativar faturamento na chave se você estourar a cota.

### 2. Publique o app

**O microfone só funciona em HTTPS.** Abrir o arquivo direto (`file://`) ou por
um IP da rede local em HTTP **não vai funcionar** — o navegador bloqueia o
microfone. Qualquer uma das duas opções abaixo resolve isso de graça.

#### Netlify (recomendado)

O `netlify.toml` na raiz do repositório já está pronto: publica a pasta
`ponte-voz/` na raiz do site, então o app fica em
`https://<seu-site>.netlify.app/` — sem subcaminho.

- **Pelo Git:** em <https://app.netlify.com>, *Add new site → Import an existing
  project*, escolha o repositório. Não mexa em nada: as configurações vêm do
  `netlify.toml`.
- **Sem Git:** arraste a pasta `ponte-voz/` para
  <https://app.netlify.com/drop>. Publica na hora, sem conta.

#### GitHub Pages

1. No repositório, **Settings → Pages**
2. Em *Source*, escolha a branch e a pasta raiz (`/`)
3. O app fica em `https://<seu-usuario>.github.io/ponte-voz/`

Nos dois casos, o endereço resultante é o link que você manda para o convidado.

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

## Antes da visita: as duas coisas que mais melhoram a tradução

Nenhuma das duas é trocar de modelo. Um modelo maior acerta mais gramática;
estas duas dizem a ele *do que se está falando*, que é onde a tradução
automática realmente erra.

### 1. Descreva a atividade

Em **⚙ → Contexto da atividade**, duas linhas bastam:

> Visita de um engenheiro japonês da Honda à nossa fábrica de motores, para
> auditoria de processo na linha de montagem. Vamos percorrer o chão de
> fábrica e discutir índices de qualidade.

Com isso o intérprete sabe o registro a usar, o domínio técnico e quem está
falando com quem — e passa a desambiguar sozinho o que antes chutaria.

### 2. Preencha o glossário

Este é o passo que quase ninguém faz.
Toque em **用語集** e cadastre os termos que a tradução automática erraria:

| Português | 日本語 | Observação |
|---|---|---|
| romaneio | 積荷リスト | lista de embarque |
| ETG | ETG | nome da empresa, não traduzir |
| ordem de produção | 製造指図 | |
| torno CNC | CNC旋盤 | |

Cadastre também nomes próprios, códigos de peça e siglas internas. O intérprete
é instruído a usar exatamente esses equivalentes, sempre.

Para fábrica de motores existe um atalho: o botão **Carregar termos de fábrica
de motores** cadastra de uma vez os termos de linha de montagem, qualidade e
peças de motor (takt time,不良品, 公差, クランクシャフト, 現場…). Ele não
apaga nem duplica o que você já tinha.

---

## Qual modelo usar

**Não dá para saber de fora qual modelo vai funcionar.** Medido contra a API
com uma chave real, no mesmo minuto:

| modelo | resultado |
|---|---|
| `gemini-flash-latest` | 503 / sem resposta |
| `gemini-3.7-flash` | 503 / sem resposta |
| `gemini-3.6-flash` | 200 em **3,1 s** |

Um modelo pode estar indisponível para a conta (404), ter sido aposentado
(a API o lista e depois o recusa) ou estar simplesmente sobrecarregado (503).
Por isso o app **procura** em vez de apostar:

- em **⚙ → Testar conexão**, cada candidato leva uma chamada mínima de verdade,
  e fica o primeiro que responder — listar não basta;
- durante a conversa, um 404, um 503 ou uma demora acima de 30 s fazem o app
  descer para o próximo modelo e refazer a tradução sozinho;
- quando a API sugere o substituto na mensagem de erro
  (*"use models/gemini-3.6-flash"*), esse é o palpite adotado.

### Latência

O app pede `thinkingLevel: LOW`. Medido no `gemini-3.6-flash`, a mesma
tradução leva **6,1 s** com o raciocínio padrão e **2,4 s** em LOW. Numa
conversa cara a cara esses 3,7 s pesam mais que o ganho de qualidade, que
aqui é nulo — a fala é curta e já vem com glossário e contexto. Modelos
antigos não conhecem o parâmetro e respondem 400; nesse caso ele é retirado
automaticamente.

Em **⚙ → Testar conexão** a lista é preenchida pela própria API e ordenada da
versão mais nova para a mais antiga, então acompanha os lançamentos sem
precisar mexer no código.

Vale usar um modelo **Pro**? Em geral não, para este uso. Numa conversa cara a
cara a latência pesa mais que o último ponto de qualidade: um Pro acrescenta
segundos a cada turno, e as falas aqui são curtas e já vêm com glossário e
contexto. Se quiser comparar, troque no seletor e teste — mas ajuste primeiro
o contexto e o glossário, que rendem mais.

---

## Fone de ouvido

**Dois fones de pares diferentes, num celular só, não funciona.** Não é
limitação do app: `setSinkId` (a API que escolheria a saída de áudio) não
existe no Chrome do Android nem no Safari do iPhone, então não há como mandar
áudios para dois aparelhos Bluetooth distintos.

Com **um par só, um fone em cada pessoa**, a história é outra — veja abaixo.

### Um par Bluetooth, um fone para cada pessoa

Isto **funciona**, e é a melhor opção. Com os dois fones de um par TWS fora do
estojo, o par fica em estéreo normal: o canal esquerdo toca num fone e o
direito no outro. Dá então para mandar cada tradução só para o ouvido de quem
precisa dela — você não leva japonês no ouvido, ele não leva português.

Ligue em **⚙ → Modo fone → Separar as vozes por lado do fone**, diga qual lado
é o seu e toque em **Testar os lados**: o app toca um tom à esquerda e outro à
direita. *Se as duas pessoas ouvirem os dois tons, os fones do seu par não
separam os canais* e o modo não serve — melhor descobrir isso antes da visita.

Três coisas a saber:

- **Os dois fones precisam estar fora do estojo.** Um fone sozinho entra em
  modo mono e passa a tocar a mistura dos dois canais.
- **A voz leva ~3 s** (medido nos dois modelos de TTS do Gemini; trocar de
  modelo não muda nada). `speechSynthesis` não passa pelo Web Audio, então
  não há como panoramizá-la — o TTS do Gemini é a única saída que pode ser
  roteada por lado. Por isso o modo vem desligado por padrão.

  Esses 3 s quase não aparecem no uso: o texto entra na tela antes, **o
  microfone é liberado na hora** e a conversa segue enquanto a voz é gerada.
  Frases repetidas — e numa fábrica elas repetem muito — saem instantâneas,
  porque o áudio fica guardado. Se alguém emenda a próxima fala, a voz
  anterior é cancelada em vez de chegar atrasada e atropelar.
- **Não use o microfone dos fones neste modo.** Ao ativar o microfone
  Bluetooth, o aparelho troca o perfil de áudio para mono e a separação de
  canais desaparece. Deixe o microfone no do celular ou num headset com fio.

Se o TTS falhar, o app fala pela síntese do aparelho (nos dois fones) e avisa
na barra de status, em vez de ficar mudo.

### Alternativas sem separação por lado

- **Divisor Y de 3,5 mm com dois fones.** Os dois ouvem tudo, inclusive a
  língua que não entendem — que é só ruído inofensivo. Não precisa do TTS do
  Gemini, então não tem o custo de latência.
- **Um headset com haste de microfone.** Numa fábrica de motores isso pesa
  muito mais pelo lado da captação que da reprodução: o alto-falante do
  celular não vai ser ouvido com a linha rodando de qualquer jeito, e o
  microfone perto da boca é o que salva a transcrição.

Com o fone conectado, vá em **⚙ → Microfone → Procurar microfones** e escolha
o do headset. Sem isso o navegador pode continuar usando o microfone interno
do aparelho.

---

## Chave compartilhada (opcional)

Por padrão cada celular guarda a própria chave. Se preferir que ninguém precise
digitar chave nenhuma, dá para pôr a chave num proxy do lado do servidor.

### No Netlify

Se já publicou pelo Netlify, a função em `netlify/functions/gemini.mjs` está
junto — não precisa de mais nada instalado:

1. No painel: **Site configuration → Environment variables**
2. Crie `GEMINI_API_KEY` com a chave do Google AI Studio
3. Republique o site
4. No app, em **⚙ → Servidor intermediário**, cole
   `https://<seu-site>.netlify.app/api` e deixe o campo da chave vazio

Um detalhe de limite: uma Netlify Function síncrona é cortada em **10 s**. Uma
fala curta responde em 1-3 s, então na prática funciona, mas uma fala muito
longa pode estourar esse teto. Se acontecer com frequência, use o Cloudflare
abaixo (que não tem esse limite) ou volte a deixar a chave em cada aparelho.

### No Cloudflare Workers

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
netlify.toml                    publica ponte-voz/ na raiz do site
netlify/functions/gemini.mjs    proxy opcional da chave, no Netlify
ponte-voz/
├── index.html                  o app inteiro (HTML + CSS + JS, sem dependências)
├── manifest.json               metadados da PWA
├── sw.js                       service worker (abre offline)
├── icon-192.png
├── icon-512.png
└── worker/
    ├── worker.js               o mesmo proxy, para Cloudflare Workers
    └── wrangler.toml
```

Os dois proxies fazem a mesma coisa — use **um** dos dois, ou nenhum.

Zero dependências, zero build. Editar o `index.html` e dar push já publica.

---

## Limites conhecidos

- Uma pessoa por vez. Se os dois falarem juntos, o áudio sai embolado.
- Sem internet só as frases essenciais funcionam — tradução ao vivo precisa de rede.
- A qualidade da transcrição cai bastante com ruído alto de fundo; num galpão,
  fale perto do aparelho ou use um headset com haste de microfone.
- Dois fones de **pares diferentes** num único celular não são possíveis; um
  par com um fone para cada pessoa funciona (veja "Fone de ouvido").
- A voz sintetizada depende do que está instalado no aparelho. O texto na tela
  não depende de nada e é sempre o plano de contingência.
