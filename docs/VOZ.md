# La voz de Yayen («Digital»)

Yayen habla con **Piper**, un motor de voz que corre en tu propio equipo (sin Internet ni cuentas), con la voz en
español `es_ES-mls_10246-low` y un ajuste propio:

| Ajuste | Qué hace |
|---|---|
| `digital` (por defecto) | +2 semitonos, un pelín más rápida (×1,03), coro y eco leves: suena a personaje |
| `natural` | La voz tal cual |

En los dos, el servidor recorta el silencio del principio y acorta las pausas largas para que suene fluida.

## Instalar (una vez)

En el equipo (Debian/Ubuntu) donde corre tu servidor:

```sh
sudo sh tools/instalar-voz.sh            # deja Piper y la voz en /opt/yayen/piper (cámbialo con DESTINO=…)
```

Luego en `server/.env`:

```sh
YAYEN_PIPER=/opt/yayen/piper/bin/piper
YAYEN_MODEL=/opt/yayen/piper/voces/es_ES-mls_10246-low.onnx
YAYEN_PRESET=digital
```

Comprueba:

```sh
curl -s -o prueba.mp3 -w '%{http_code} %{content_type}\n' \
  -X POST -H 'X-Yayen: 1' -d '{"text":"Todo está bien. Todo en orden."}' http://127.0.0.1:8787/api/yayen/voz
```

## Cómo funciona

1. La pantalla manda el texto: `POST /api/yayen/voz` con `{"text": "…"}` (máx. 400 caracteres).
2. El servidor genera el audio con Piper, le aplica el ajuste con `ffmpeg` y lo guarda en caché (la misma frase no se
   vuelve a generar).
3. La pantalla lo reproduce y Yayen mueve la boca mientras suena. Al cerrar la capa se corta.

Si el servidor responde 503 (Piper no instalado), la pantalla usa la voz del navegador y vuelve a probar a los 5 minutos.
Ojo: Chromium en Linux casi nunca trae voces en español, por eso conviene Piper.

## Dónde suena

Suena por la salida de audio del equipo **donde está abierta la página** (la pantalla). En un thin client hace falta un
altavoz pequeño (USB o el conector de 3,5 mm). Si la pantalla está en modo kiosco, añade
`--autoplay-policy=no-user-gesture-required` al arranque de Chromium para que pueda sonar aunque no la hayas tocado.

## Otra voz

Cualquier voz de Piper sirve: descárgala (`.onnx` + `.onnx.json`) y cambia `YAYEN_MODEL`. El ajuste «digital» se aplica
igual.
