# Darle acceso a Hermes

Cuando mantienes pulsado a Yayen, lo que le dices va a **Hermes** (tu agente de IA) y la respuesta sale en la nube y
en voz alta. Yayen **nunca** habla directo con Hermes desde el navegador: pasa por tu servidor, que es el único que
conoce el token.

```
pantalla ──POST /api/yayen/hermes {"text"}──▶ tu servidor ──Bearer HERMES_TOKEN──▶ Hermes
         ◀──────────── {"reply"} ────────────               ◀──── respuesta ────
```

## 1. Prepara Hermes

1. Activa la **API HTTP** de Hermes y crea una **clave/token** solo para Yayen (consulta la documentación de tu Hermes).
   Muchas exponen una API compatible con OpenAI en `/v1/chat/completions`; si la tuya usa otra ruta, también vale.
2. Anota la dirección en tu red (por ejemplo `http://192.168.1.50:8642`). Mejor si solo se ve dentro de tu LAN.

## 2. Pon las credenciales en el servidor

```sh
cp server/.env.example server/.env
chmod 600 server/.env           # solo tu usuario puede leerlo
```

| Clave | Qué poner |
|---|---|
| `HERMES_URL` | URL base de la API, sin barra final |
| `HERMES_CHAT_PATH` | Ruta para mandar mensajes (`/v1/chat/completions` por defecto) |
| `HERMES_TOKEN` | La clave. Se envía como `Authorization: Bearer …` |
| `HERMES_MODEL` | Solo si la API pide modelo o perfil |
| `HERMES_TIMEOUT` | Segundos máximos de espera (60) |
| `YAYEN_SYSTEM_PROMPT` | (Opcional) La personalidad: por defecto, respuestas cortas, cercanas y sin listas |

**Nunca** pongas el token en el HTML, en el JavaScript ni en git (`server/.env` ya está en `.gitignore`).

Prueba desde el servidor:

```sh
curl -s -X POST -H 'X-Yayen: 1' -d '{"text":"¿Cómo va todo?"}' http://127.0.0.1:8787/api/yayen/hermes
# {"reply": "…"}
```

Errores que verás en la nube: «Hermes rechazó el token» (401), «La ruta no existe» (404), «No pude llegar a Hermes»
(dirección o red).

## 3. Conéctalo en la pantalla

```js
Yayen.mount(el, { /* … */, hermes: { url: '/api/yayen/hermes', headers: { 'X-Yayen': '1' } } });
```

Hoy se le **escribe** (aparece un campo en la nube). Hablarle con el micrófono llegará con un reconocimiento de voz local
(Whisper); el navegador solo deja usar el micrófono en páginas `https://` o `localhost`.

## Seguridad

- El token solo vive en el servidor, en un archivo con permisos 600.
- Los `POST` exigen la cabecera `X-Yayen: 1`: una web ajena no puede mandarla sin permiso CORS.
- Deja el servidor en tu LAN (`YAYEN_HOST=127.0.0.1` o la IP interna), no lo publiques a Internet.
- Si Hermes puede ejecutar acciones (reiniciar, apagar…), que **pidan confirmación en pantalla** (por ejemplo con PIN);
  Yayen solo transmite texto.

## Ejemplo real: así está en el panel del rack

- El servidor del panel corre en un contenedor de Proxmox y Hermes en otro contenedor de la misma red.
- Las claves van en `/etc/homelab-panel/secrets.env` (dueño `root`, grupo del servicio, permisos 640), como
  `HERMES_URL`, `HERMES_CHAT_PATH`, `HERMES_TOKEN` y `HERMES_MODEL`; la configuración solo los referencia como
  `${HERMES_TOKEN}`. El instalador añade las claves nuevas vacías sin tocar las que ya tienen valor.
- El dueño pega el token directamente en ese archivo (nunca por chat) y reinicia el servicio.
- La pantalla (un thin client en modo kiosco) solo ve el panel; nunca recibe tokens.
