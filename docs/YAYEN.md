# Yayen: el asistente del Inicio

Diseño aprobado: <https://claude.ai/artifact/8Zkf8FcLQExVfrLHCiu7qV> · voces de ejemplo: <https://claude.ai/artifact/7j1BmwCvxbKCTccd4w2yvm> (elegida: **Digital**).
Código: `wyse-dashboard/static/js/yayen.js` (lo monta la pestaña Inicio) y el bloque «Yayen» de `static/css/app.css`.

## Cómo se usa

| Gesto | Qué hace |
|---|---|
| Un toque sobre Yayen | Abre sus opciones en órbita. Responden **en local**, con los datos de `/api/status`, dentro de una nube blanca. |
| Otro toque (Yayen, la nube o el fondo) | Cierra el panel. Si la nube lleva a una pestaña, tocarla te lleva allí. |
| Mantener pulsado (0,45 s) | Habla con **Hermes**. Hasta que esté enlazado, solo lo avisa y no abre el micrófono. |

## Lo que hay que rellenar (en el CT 111)

Todo va en `/etc/homelab-panel/secrets.env`, nunca en git ni por chat. `config.lab.json → yayen` ya los lee como `${VARIABLE}`.
Al desplegar, `deploy/instalar.sh` añade al final de `secrets.env` las claves nuevas que falten (vacías); nunca cambia las que ya tienen valor.

| Clave | Qué poner |
|---|---|
| `HERMES_URL` | URL base de la API de Hermes (LXC 102) en la LAN, sin barra final. Ej.: `http://10.0.10.X:8642` |
| `HERMES_CHAT_PATH` | Ruta para mandarle mensajes. Si es compatible con OpenAI: `/v1/chat/completions` (valor por defecto) |
| `HERMES_TOKEN` | Clave o token de su API (se envía como `Authorization: Bearer …`) |
| `HERMES_MODEL` | Solo si su API pide un modelo o perfil; vacío = el de Hermes |
| `YAYEN_STT_URL` | Whisper local (Wyoming) para entenderte. Ej.: `tcp://10.0.10.X:10300` |
| `YAYEN_TTS_URL` | Piper local (Wyoming) para la voz de Yayen. Ej.: `tcp://10.0.10.X:10200` |
| `YAYEN_TTS_VOICE` | Voz base de Piper (`es-mls_10246-low`); Yayen le aplica el ajuste «Digital» |

Después: `systemctl restart homelab-panel`.

## Pendiente

1. **Enlace con Hermes:** el servidor del panel hará de puente (`/api/yayen/hermes`), con el token solo en el servidor.
2. **Voz local:** Whisper y Piper en VM 110 o en LAB01; la pantalla graba mientras mantienes pulsado y reproduce la respuesta.
3. **Micrófono en la Wyse:** Chromium solo lo permite en páginas seguras. En el kiosco hace falta
   `--unsafely-treat-insecure-origin-as-secure=http://10.0.10.30:8080` o servir el panel por HTTPS (NPM).
4. **Salida de voz:** opción «Dónde habla Yayen» (computadora, Wyse o ambas).
