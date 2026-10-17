#!/bin/sh
# Voz local de Yayen («Digital»): Piper en un venv propio + la voz es_ES-mls_10246-low + ffmpeg para el ajuste.
# Se corre UNA vez, como root, en el equipo (Debian/Ubuntu) donde corre tu servidor:
#
#   sudo sh tools/instalar-voz.sh
#
# No necesita claves. Descarga ~70 MB (Piper y la voz) y deja todo en /opt/yayen/piper
# (cámbialo con DESTINO=/otra/ruta). Luego pon esas rutas en server/.env (YAYEN_PIPER, YAYEN_MODEL).
set -eu

DESTINO="${DESTINO:-/opt/yayen/piper}"
VOZ="${VOZ:-es_ES-mls_10246-low}"
HF="https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low"
GITHUB="https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-es-mls_10246-low.tar.gz"

[ "$(id -u)" -eq 0 ] || { echo "Córrelo como root (sudo)."; exit 1; }

echo "» Paquetes (ffmpeg y venv de Python)"
apt-get update -qq
apt-get install -y -qq ffmpeg python3-venv >/dev/null

echo "» Piper en $DESTINO"
[ -x "$DESTINO/bin/python3" ] || python3 -m venv "$DESTINO"
"$DESTINO/bin/pip" install -q --upgrade pip piper-tts

echo "» Voz $VOZ"
mkdir -p "$DESTINO/voces"
bajar() { "$DESTINO/bin/python3" -c 'import sys, urllib.request; urllib.request.urlretrieve(sys.argv[1], sys.argv[2])' "$1" "$2"; }
if [ ! -s "$DESTINO/voces/$VOZ.onnx" ]; then
  if bajar "$HF/$VOZ.onnx" "$DESTINO/voces/$VOZ.onnx.tmp" && bajar "$HF/$VOZ.onnx.json" "$DESTINO/voces/$VOZ.onnx.json"; then
    mv "$DESTINO/voces/$VOZ.onnx.tmp" "$DESTINO/voces/$VOZ.onnx"
  else
    echo "  Hugging Face no respondió; uso la copia de GitHub (misma locutora, formato antiguo)."
    rm -f "$DESTINO/voces/$VOZ.onnx.tmp"
    bajar "$GITHUB" /tmp/voz-yayen.tar.gz
    tar xzf /tmp/voz-yayen.tar.gz -C "$DESTINO/voces"
    mv "$DESTINO/voces/es-mls_10246-low.onnx" "$DESTINO/voces/$VOZ.onnx"
    mv "$DESTINO/voces/es-mls_10246-low.onnx.json" "$DESTINO/voces/$VOZ.onnx.json"
    rm -f /tmp/voz-yayen.tar.gz
  fi
fi
chown -R root:root "$DESTINO"; chmod -R a+rX "$DESTINO"

echo "» Prueba"
echo "Hola, soy Yayen." | "$DESTINO/bin/piper" -m "$DESTINO/voces/$VOZ.onnx" -f /tmp/yayen-prueba.wav >/dev/null 2>&1
[ -s /tmp/yayen-prueba.wav ] && echo "  Piper habla ($(wc -c < /tmp/yayen-prueba.wav) bytes)." || { echo "  Piper no generó audio."; exit 1; }
rm -f /tmp/yayen-prueba.wav

echo "Listo. En server/.env:"
echo "  YAYEN_PIPER=$DESTINO/bin/piper"
echo "  YAYEN_MODEL=$DESTINO/voces/$VOZ.onnx"
