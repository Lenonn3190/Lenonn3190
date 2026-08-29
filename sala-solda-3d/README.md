# Laboratório de Solda — passeio em primeira pessoa

Reconstrução 3D navegável de um laboratório móvel de solda montado em contêiner,
remontada a partir de uma única fotografia tirada do mezanino.

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

**Comparar foto** sobrepõe a fotografia original ao render, na mesma posição de
câmera e no mesmo campo de visão em que ela foi tirada — o controle deslizante
regula a opacidade. **Arco de solda** liga o disparo periódico do arco em uma das
bancadas, que acende a sala de azul por um instante.

## Como foi feito

O renderizador é WebGL escrito à mão (sem three.js): um único buffer entrelaçado
com toda a geometria estática, dividido em faixas por textura, e um segundo passe
aditivo para os halos das luminárias e do arco.

- **Texturas** geradas em `canvas` 2D: carpete em réguas, chapa metálica, faixa de
  janela estourada, teto laqueado.
- **Iluminação** com ambiente hemisférico, entrada difusa pelas duas faixas de
  janela, até 12 luzes pontuais escolhidas por proximidade e névoa exponencial.
  Albedo convertido de sRGB para linear antes da luz e comprimido de volta no fim.
- **Colisão** por círculo contra caixas alinhadas: bancadas, guarda-corpo, cilindros
  de gás e o vão do mezanino, que não pode ser atravessado.

Medidas do módulo: 19,0 × 4,4 m, pé-direito 2,75 m, 10 bancadas em duas fileiras,
altura do olhar 1,62 m.
