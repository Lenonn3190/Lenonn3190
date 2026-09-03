# Sala de Inovação Powertrain — passeio em primeira pessoa

Reconstrução 3D navegável da sala de apresentação dos temas de inovação do
powertrain, remontada a partir de uma única fotografia tirada do mezanino. No
fundo da sala há um telão de projeção de 3,3 m que alterna os painéis do
departamento, e uma TV de parede sobre cada bancada repetindo o mesmo canal.

`index.html` é autossuficiente: um único arquivo, sem dependências, sem CDN de
biblioteca 3D e com a fotografia de referência embutida. Basta abrir no navegador
(ou publicar em qualquer hospedagem estática, incluindo GitHub Pages).

## Como navegar

| Ação | Computador | Celular |
| --- | --- | --- |
| Andar | `W` `A` `S` `D` ou setas | manche na metade esquerda da tela |
| Olhar | mouse (clique para capturar o cursor) ou arraste | arraste na metade direita |
| Correr | `Shift` | — |
| Ir a uma parada | `1` a `7` ou os botões do canto superior direito | botões |
| Soltar o cursor | `Esc` | — |

## O telão e as TVs

Três canais, que trocam sozinhos a cada 14 segundos — o botão **Telão** no rodapé
fixa e avança o canal na hora:

1. **Andon das células** — estado das células (operando / atenção / parada),
   produção por hora contra a meta, paradas do turno e OEE. Números de exemplo,
   marcados como tal no próprio painel.
2. **Painel Gerencial de Férias · ETG 103ki** — KPIs do ciclo, distribuição mensal
   de blocos, blocos por área, regra N-40 e fila de apontamento.
3. **Gestão de Estoque | Powertrain** — as cinco famílias (Bloco, Cabeçote,
   Transmissão, Motor e Cilindro 2W), cada uma com o disponível, meta e mínimo,
   barra de atingimento, tendência do dia, saldo por local (FND, USI com as
   operações, MMO), DR rejeitado contra o máximo e a cobertura em dias úteis.

Cada painel é desenhado em `canvas` 2D e enviado como textura; a mesma textura
alimenta o telão e as quatro TVs de parede, então todas as telas trocam de canal
juntas. Os dados ficam em objetos no topo do bloco do telão (`ANDON`, `FER`,
`EST`), fáceis de trocar. Estados sempre trazem a palavra escrita ao lado da cor.

## A estação de visão computacional

A bancada do meio, do lado direito de quem entra, é uma célula de inspeção: um
bloco de motor de alumínio de quatro cilindros preso na placa de fixação, uma
câmera Intelbras presa no braço logo acima, apontada para baixo, com anel de luz
próprio, mais o CLP na prateleira e a torre de sinalização na quina da bancada.

A **TV logo acima dessa bancada não repete o telão** — ela mostra o frontend do
sistema: a imagem da câmera com a região de interesse, uma caixa de detecção por
cilindro com o diâmetro medido, o achado de porosidade quando aparece, e ao lado
o laudo da peça (aprovado ou reprovado), as características medidas contra a
tolerância e os indicadores do turno. Uma peça nova entra a cada 3,4 segundos e
uma em cada seis reprova, para a tela não ficar parada. Os dados vivem no objeto
`VIS`, no bloco do frontend.

## A liberação de acesso por EPI

A bancada da esquerda, perto da entrada, é a segunda célula de visão — de
segurança. Uma câmera comum, presa na coluna, olha quem chega na porta do forno
fusor. Sobre a mesa há um portão pequeno com trava eletromagnética, leitor de
crachá e placa de advertência: **a folha do portão só abre quando todos os EPIs
são reconhecidos**, e o LED da trava acompanha o veredito.

A TV acima mostra o frontend: a imagem da câmera com o operador diante da boca do
forno e uma caixa de detecção por EPI (capacete, protetor facial, auricular,
avental e perneira aluminizados, luvas de raspa, botina), a lista dos EPIs
exigidos com a confiança de cada um, o estado da trava escrito por extenso e o
histórico das últimas tentativas. O ciclo roda sozinho — chega alguém, o sistema
lê, libera ou bloqueia — e cerca de uma tentativa em quatro é barrada.

A folha do portão é a única geometria viva da cena: ela é regerada a cada quadro
no ângulo atual e enviada num buffer próprio, separado do buffer estático.

## O totem de ausências e frota

A quarta bancada — antes sem tema próprio — recebe um **totem em retrato** em cima
da mesa, virado para o corredor, com o painel **Gerenciamento de ausências e
saídas com carro da frota** (Powertrain · ETG). Ele reproduz o monitor enviado
pelo cliente: KPIs (ausentes agora, presença, saídas de hoje, em férias, em
viagem, retornos em 7 dias), a lista de **ausências agora** (colaborador, setor,
motivo e retorno) e a **frota de veículos** (placa, status Livre/Em uso/Manutenção
e condutor), com o leitor de crachá no rodapé para registrar a saída do carro.

O painel é desenhado em um canvas landscape (2048×1024) com a coluna retrato ao
centro; o totem recorta essa coluna, e o telão de parede acima vê o mesmo painel
pillarboxed. É a parada **07 · Ausências & frota**.

## A célula de PDI e o tablet do CheckSync

A quarta bancada é a da inspeção de PDI. Sobre a mesa há um tablet numa base
inclinada com o **CheckSync ETG aberto na tela de nova inspeção** — equipamento,
responsável, assinatura e o checklist com os botões Conforme / Ressalva / Não
Conf. / N/A —, além do leitor de código de barras e da bandeja de documentos.

Na TV acima, a **célula com dois robôs**: um motor montado sobre o palete gira na
mesa a 12 °/s enquanto os dois braços varrem a peça, e o checklist ao lado avança
um ponto a cada trecho da volta — coletor, tampa de válvulas, chicote, bomba
d'água, polia, cárter, volante e etiqueta. O ponto da vez fica marcado na própria
peça, com a chamada saindo dela.

Essa vista 3D é desenhada por software dentro do canvas: um projetor próprio
(`pr3`) com ordenação por profundidade e sombreamento por normal, montando o
motor, o palete, a mesa e os robôs a partir de caixas, prismas e tubos. O
redesenho cai para 2 fps quando a câmera está longe da TV, para não gastar upload
de textura à toa.

**Comparar foto** sobrepõe a fotografia original ao render, na mesma posição de
câmera e no mesmo campo de visão em que ela foi tirada.

## Um modo só: tela cheia, no dedo

O botão **Entrar na sala** abre em tela cheia (e trava em paisagem no celular).
Daí para frente é tudo direto:

| No celular | No computador |
| --- | --- |
| Arraste na tela para olhar | Mouse para olhar (clique prende o cursor) |
| Manche no canto esquerdo para andar | `W` `A` `S` `D` ou setas, `Shift` corre |
| Toque numa baliza para ir até ela | Clique numa baliza, com o cursor preso |
| Botões das paradas no canto | `1` a `7` ou os botões do canto |

As sete paradas aparecem na sala como **balizas flutuantes** na altura dos olhos,
em âmbar; a que estiver no meio da vista acende em azul e mostra o nome logo
abaixo do centro — é o alvo do toque. O **Tour guiado** percorre todas sozinho,
com uma legenda explicando cada uma; qualquer baliza tocada retoma o controle.
O botão **Tela cheia** entra e sai a qualquer momento.

## A estação de visão computacional

A bancada do meio, do lado direito de quem entra, é uma célula de inspeção: um
bloco de motor de alumínio de quatro cilindros preso na placa de fixação, uma
câmera Intelbras presa no braço logo acima, apontada para baixo, com anel de luz
próprio, mais o CLP na prateleira e a torre de sinalização na quina da bancada.

A **TV logo acima dessa bancada não repete o telão** — ela mostra o frontend do
sistema: a imagem da câmera com a região de interesse, uma caixa de detecção por
cilindro com o diâmetro medido, o achado de porosidade quando aparece, e ao lado
o laudo da peça (aprovado ou reprovado), as características medidas contra a
tolerância e os indicadores do turno. Uma peça nova entra a cada 3,4 segundos e
uma em cada seis reprova, para a tela não ficar parada. Os dados vivem no objeto
`VIS`, no bloco do frontend.

## A liberação de acesso por EPI

A bancada da esquerda, perto da entrada, é a segunda célula de visão — de
segurança. Uma câmera comum, presa na coluna, olha quem chega na porta do forno
fusor. Sobre a mesa há um portão pequeno com trava eletromagnética, leitor de
crachá e placa de advertência: **a folha do portão só abre quando todos os EPIs
são reconhecidos**, e o LED da trava acompanha o veredito.

A TV acima mostra o frontend: a imagem da câmera com o operador diante da boca do
forno e uma caixa de detecção por EPI (capacete, protetor facial, auricular,
avental e perneira aluminizados, luvas de raspa, botina), a lista dos EPIs
exigidos com a confiança de cada um, o estado da trava escrito por extenso e o
histórico das últimas tentativas. O ciclo roda sozinho — chega alguém, o sistema
lê, libera ou bloqueia — e cerca de uma tentativa em quatro é barrada.

A folha do portão é a única geometria viva da cena: ela é regerada a cada quadro
no ângulo atual e enviada num buffer próprio, separado do buffer estático.

## A célula de PDI e o tablet do CheckSync

A quarta bancada é a da inspeção de PDI. Sobre a mesa há um tablet numa base
inclinada com o **CheckSync ETG aberto na tela de nova inspeção** — equipamento,
responsável, assinatura e o checklist com os botões Conforme / Ressalva / Não
Conf. / N/A —, além do leitor de código de barras e da bandeja de documentos.

Na TV acima, a **célula com dois robôs**: um motor montado sobre o palete gira na
mesa a 12 °/s enquanto os dois braços varrem a peça, e o checklist ao lado avança
um ponto a cada trecho da volta — coletor, tampa de válvulas, chicote, bomba
d'água, polia, cárter, volante e etiqueta. O ponto da vez fica marcado na própria
peça, com a chamada saindo dela.

Essa vista 3D é desenhada por software dentro do canvas: um projetor próprio
(`pr3`) com ordenação por profundidade e sombreamento por normal, montando o
motor, o palete, a mesa e os robôs a partir de caixas, prismas e tubos. O
redesenho cai para 2 fps quando a câmera está longe da TV, para não gastar upload
de textura à toa.

**Comparar foto** sobrepõe a fotografia original ao render, na mesma posição de
câmera e no mesmo campo de visão em que ela foi tirada.

## Modo VR e tour guiado

O botão **Modo VR** (na capa ou no rodapé) coloca a sala em estéreo lado a lado
para um celular dentro de um óculos simples. A cabeça vem do giroscópio
(`deviceorientation`, com o pedido de permissão exigido no iOS) e **nada precisa
das mãos**:

| Gesto | O que faz |
| --- | --- |
| Fixar o olhar numa baliza | Teleporta para a parada, depois de 1,4 s de contagem no anel da mira |
| Abaixar o olhar | Anda para frente; quanto mais baixo, mais rápido |
| Olhar bem para cima | Reorienta a sala à sua frente, corrigindo a deriva do giroscópio |
| Tocar na tela | Sai do modo VR |

As sete paradas viram balizas flutuantes na altura dos olhos, em âmbar, e a que
está sob a mira acende em azul. O **Tour guiado** percorre as paradas sozinho, com
uma legenda explicando cada uma — ligue antes de colocar o celular no óculos e a
sala se apresenta sem ninguém tocar em nada; fixar o olhar numa baliza assume o
controle de volta.

## Como foi feito

O renderizador é WebGL escrito à mão (sem three.js): um único buffer entrelaçado
com toda a geometria estática, dividido em faixas por textura, e um segundo passe
aditivo para os halos das luminárias e do arco.

- **Texturas** geradas em `canvas` 2D: carpete em réguas, chapa metálica, faixa de
  janela estourada, teto laqueado e o telão.
- **Iluminação** com ambiente hemisférico, entrada difusa pelas duas faixas de
  janela, até 12 luzes pontuais escolhidas por proximidade e névoa exponencial.
  Albedo convertido de sRGB para linear antes da luz e comprimido de volta no fim.
  O telão é auto-iluminado e joga luz na parte de trás da sala.
- **Colisão** por círculo contra caixas alinhadas: bancadas, guarda-corpo, móveis
  e o vão do mezanino, que não pode ser atravessado.

Medidas do módulo: 19,0 × 4,4 m, pé-direito 2,75 m, 4 bancadas (duas de cada
lado), TVs de 1,22 × 0,61 m sobre elas, telão de 3,3 × 1,64 m e altura do olhar
1,62 m.
