# Estoque Loja (APK Android)

App para controlar o estoque de DOG FONE, DOG ÓCULOS MACHO, DOG ÓCULOS FÊMEA, GATO FONE e GATO ÓCULOS, por cor.

- **Instalar:** baixe `EstoqueLoja.apk` no celular, abra e permita "instalar apps de fontes desconhecidas".
- Botões **+ / −** somam ou tiram 1 unidade. Toque no **número** para dar entrada, saída ou ajustar várias de uma vez.
- Selos **ZERADO** e **BAIXO** (limite configurável em *Mais opções*). Aba **⚠ Baixos** mostra só o que precisa repor.
- **Histórico** com data e hora de cada movimentação.
- **Enviar relatório** compartilha o estoque como texto (WhatsApp etc.).
- **Backup:** *Mais opções → Fazer backup* envia os dados como texto; *Restaurar backup* cola esse texto de volta.

Os dados ficam salvos só no celular. Desinstalar o app apaga o estoque, então faça backup antes.

Código: `app/src/main/assets/index.html` (interface) e `MainActivity.java`. Compilar: `./build.sh`.
