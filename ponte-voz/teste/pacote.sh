#!/usr/bin/env bash
# Monta o .zip que se arrasta em https://app.netlify.com/drop
#
#   ./teste/pacote.sh            -> ponte-netlify.zip na raiz do repositório
#
# O zip tem os arquivos na RAIZ (index.html, sw.js, ícones...), porque o
# Netlify Drop publica o conteúdo do zip direto. Por isso o netlify.toml de
# dentro do pacote não pode ter `publish = "ponte-voz"` como o da raiz do
# repositório: aqui já estamos dentro dela.
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
app="$raiz/ponte-voz"
saida="$raiz/ponte-netlify.zip"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cp "$app"/index.html "$app"/sw.js "$app"/manifest.json \
   "$app"/icon-192.png "$app"/icon-512.png "$app"/LEIA-ME.txt "$tmp/"
mkdir -p "$tmp/netlify/functions"
cp "$raiz"/netlify/functions/gemini.mjs "$tmp/netlify/functions/"

# netlify.toml do pacote: mesmos cabeçalhos do repositório, sem o publish e
# sem o comentário de cabeçalho dele, que fala de uma pasta que aqui é a raiz.
{
  cat <<'TOML'
# Netlify Drop — os arquivos deste zip já são a raiz do site.

[build]
  publish   = "."
  command   = ""
  functions = "netlify/functions"
TOML
  sed -e '1,/^$/d' -e '/^\[build\]/,/^$/d' "$raiz/netlify.toml"
} > "$tmp/netlify.toml"

# Nunca empacotar uma chave de API por acidente.
if grep -rqE 'AIza[0-9A-Za-z_-]{30,}|AQ\.[A-Za-z0-9_-]{30,}' "$tmp"; then
  echo "ABORTADO: parece haver uma chave de API dentro do pacote." >&2
  grep -rlE 'AIza[0-9A-Za-z_-]{30,}|AQ\.[A-Za-z0-9_-]{30,}' "$tmp" >&2
  exit 1
fi

rm -f "$saida"
(cd "$tmp" && zip -qr "$saida" .)
echo "pacote: $saida"
unzip -l "$saida" | tail -n +4 | head -n -2
