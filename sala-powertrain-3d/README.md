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
| Ir a uma parada | `1` a `5` ou os botões do canto superior direito | botões |
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

**Comparar foto** sobrepõe a fotografia original ao render, na mesma posição de
câmera e no mesmo campo de visão em que ela foi tirada. **Arco de solda** liga o
disparo periódico do arco em uma das estações.

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
