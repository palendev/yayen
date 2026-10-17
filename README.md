# Yayen

**Yayen** es una mascota-asistente para paneles, dashboards y pantallas táctiles: un personajito con dos hojas, visor y
cuerpo de rayas que te dice cómo va todo, responde en una nube de pensamiento, habla con su propia voz y, si lo mantienes
pulsado, le pasa tu pregunta a **Hermes** (tu agente de IA).

Nació en el panel del rack de [palen.dev](https://palen.dev) / JMTS y aquí está separado para que cualquiera lo ponga
donde quiera. **Sin dependencias ni build**: un `.js`, un `.css` y, si quieres voz y Hermes, un servidor de Python
con la biblioteca estándar.

<p align="center"><img src="docs/img/tarjeta.png" width="420" alt="Yayen en su tarjeta: todo en orden"> <img src="docs/img/tarjeta-fallo.png" width="420" alt="Yayen con un fallo"></p>

| Toque: opciones y respuesta en la nube | Mantener pulsado: Hermes |
|---|---|
| <img src="docs/img/respuesta.png" alt="Respuesta en la nube blanca"> | <img src="docs/img/hermes-respuesta.png" alt="Respuesta de Hermes"> |

## Qué hace

- **Cara según el estado**: contento (todo bien), serio (aviso), preocupado con gota de sudor (fallo), dormido (noche),
  con gafas (modo grabación), escuchando, pensando. La insignia verde/ámbar/roja dice el estado; los colores del
  personaje son solo decoración.
- **Un toque**: se abren hasta 7 opciones en órbita. Tu app responde (con tus datos) y Yayen lo muestra en una **nube
  blanca de pensamiento** y lo dice en voz alta. **Otro toque cierra.** Si la respuesta apunta a una sección, tocar la
  nube te lleva allí.
- **Mantener pulsado**: modo **Hermes**. Escribes (y más adelante hablas) y Yayen le pregunta a Hermes a través de tu
  servidor; el token de Hermes nunca llega al navegador.
- **Voz propia «Digital»**: Piper local (sin Internet) con un ajuste de tono, coro y eco. Si no está instalada, usa la
  voz del navegador.
- **Modo ligero** automático en equipos modestos (p. ej. un thin client como pantalla): sin animaciones continuas.
- Cabe en pantallas apaisadas muy bajas (diseñado para 1280×400) y en vertical.

## Empezar en 1 minuto

```sh
git clone https://github.com/palendev/yayen && cd yayen
python3 server/yayen_server.py      # abre http://127.0.0.1:8787
```

Sin nada más ya ves la demo (voz del navegador, sin Hermes). Para su voz y Hermes:

```sh
sudo sh tools/instalar-voz.sh        # Piper + voz + ffmpeg (una vez, ~70 MB)
cp server/.env.example server/.env   # y rellena HERMES_URL / HERMES_TOKEN
chmod 600 server/.env
python3 server/yayen_server.py
```

## Ponerlo en tu app

```html
<link rel="stylesheet" href="yayen.css">
<div id="yayen"></div>
<script src="yayen.js"></script>
<script>
  const yy = Yayen.mount(document.getElementById('yayen'), {
    status: () => ({ level: 'ok', title: 'Todo en orden', text: ['Todo tranquilo por aquí.', 'Las 14 páginas están arriba.'] }),
    options: [{ id: 'news', label: '¿Qué hay de nuevo?', icon: 'bell' }],
    answer: async id => ({ title: '¡Todo bien!', text: 'Todo está bien. Todo en orden.', face: 'happy' }),
    voice:  { url: '/api/yayen/voz',    headers: { 'X-Yayen': '1' } },
    hermes: { url: '/api/yayen/hermes', headers: { 'X-Yayen': '1' } },
  });
  // cuando cambien tus datos:
  yy.update();
</script>
```

Todo el detalle (opciones, caras, navegación, estilos, tamaños): **[docs/INTEGRAR.md](docs/INTEGRAR.md)**.

## En el panel real

Así se ve en la pantalla táctil del rack (1280×400), integrado en el Inicio del panel del homelab:

| Inicio | Opciones | Respuesta |
|---|---|---|
| <img src="docs/capturas/real-t45-inicio.png" alt="Yayen en el Inicio del panel"> | <img src="docs/capturas/real-t45-menu.png" alt="Opciones en órbita"> | <img src="docs/capturas/real-t45-nube.png" alt="Respuesta en la nube"> |

## Guías

| | |
|---|---|
| [docs/INTEGRAR.md](docs/INTEGRAR.md) | API de `Yayen.mount`, dónde colocarlo, estados, opciones, estilos |
| [docs/VOZ.md](docs/VOZ.md) | Voz «Digital» con Piper local: instalación, ajuste, dónde suena |
| [docs/HERMES.md](docs/HERMES.md) | Darle acceso a Hermes: credenciales, `.env`, seguridad y un ejemplo real |
| [docs/PERSONAJE.md](docs/PERSONAJE.md) | El personaje: partes, caras, animaciones y cómo personalizarlo |

## Estructura

```
src/yayen.js            el personaje, la tarjeta, la capa de opciones, la nube, la voz y los gestos
src/yayen.css           estilos (variables --yy-* para adaptarlo a tu marca)
demo/index.html         demo con datos de ejemplo
server/yayen_server.py  servidor de ejemplo: demo + /api/yayen/voz (Piper) + /api/yayen/hermes (puente)
server/.env.example     dónde van las credenciales (copiar a server/.env)
tools/instalar-voz.sh   instala Piper, la voz y ffmpeg
```

## Licencia

Código bajo [MIT](LICENSE). El diseño del personaje Yayen es de Jordan Palen (palen.dev); puedes usarlo en tus
proyectos con el código.
