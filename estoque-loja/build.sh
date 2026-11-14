#!/usr/bin/env bash
# Gera o APK sem Gradle. Requer: aapt2, android.jar, dx.jar (dalvik-dx), uber-apk-signer.jar
# Uso: TOOLS=/caminho/das/ferramentas ./build.sh
set -euo pipefail
TOOLS=${TOOLS:-/tmp/claude-0/tools}
SRC=app/src/main
OUT=build
rm -rf "$OUT" && mkdir -p "$OUT/res" "$OUT/gen" "$OUT/classes" "$OUT/dex"
"$TOOLS/aapt2_64" compile --dir "$SRC/res" -o "$OUT/res.zip"
"$TOOLS/aapt2_64" link -I "$TOOLS/android.jar" --manifest "$SRC/AndroidManifest.xml" \
  -A "$SRC/assets" --java "$OUT/gen" -o "$OUT/unsigned.apk" "$OUT/res.zip"
javac --release 8 -nowarn -classpath "$TOOLS/android.jar" -d "$OUT/classes" \
  $(find "$SRC/java" "$OUT/gen" -name '*.java') 2>&1 | grep -v -e '^Picked up' -e 'warning' || true
java -cp "$TOOLS/dx.jar" com.android.dx.command.Main --dex --min-sdk-version=21 \
  --output="$OUT/dex/classes.dex" "$OUT/classes"
(cd "$OUT/dex" && zip -q -u ../unsigned.apk classes.dex)
java -jar "$TOOLS/signer.jar" -a "$OUT/unsigned.apk" -o "$OUT/signed" ${KS:+--ks "$KS" --ksAlias "$KS_ALIAS" --ksPass "$KS_PASS" --ksKeyPass "$KS_PASS"}
cp "$OUT"/signed/*.apk EstoqueLoja.apk
echo "OK -> $(pwd)/EstoqueLoja.apk"
