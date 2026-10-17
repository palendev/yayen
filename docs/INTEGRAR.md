# Integrar a Yayen

## 1. Archivos

Copia `src/yayen.js` y `src/yayen.css` a tu proyecto (o sírvelos tal cual). No necesitan nada más.

```html
<link rel="stylesheet" href="yayen.css">
<script src="yayen.js"></script>
```

## 2. Dónde colocarlo

Yayen vive en **una tarjeta** de tu pantalla (personaje a la izquierda y su globo a la derecha) y, al tocarlo, abre una
**capa a pantalla completa** con las opciones. Elige un hueco de al menos ~320 × 140 px; lo ideal es la tarjeta de
«estado general» de tu inicio.

```html
<section class="mi-tarjeta"><div id="yayen"></div></section>
```

El tamaño del personaje se cambia con `--yy-size` (120 px por defecto):

```css
#yayen { --yy-size: 140px; }
```

## 3. Montarlo

```js
const yy = Yayen.mount(document.getElementById('yayen'), opciones);
```

| Opción | Tipo | Qué es |
|---|---|---|
| `name` | texto | Nombre que sale sobre el globo (`'Yayen'`). |
| `status()` | función | Lo que dice la tarjeta ahora. Devuelve `{ level, title, text, go?, face? }` (abajo). Se llama al montar, en cada `yy.update()` y cada `rotateMs`. |
| `options` | lista | Hasta 7 opciones: `{ id, label, icon }`. `icon` es un nombre de `Yayen.icons` (`refresh`, `bell`, `server`, `eyeOff`, `file`, `users`, `moon`, `star`) o tu propio `<svg>`. |
| `answer(id)` | función async | Qué responde al tocar la opción `id`. Devuelve `{ title, text, go?, face? }`. Puede consultar tu API. |
| `onNavigate(go)` | función | Se llama cuando el usuario toca una nube o el globo que tienen `go`. Tú decides qué abrir. |
| `voice` | objeto | `{ url, headers, browser }`. `url` de tu endpoint de voz (ver [VOZ.md](VOZ.md)); `null` = solo la voz del navegador; `browser: false` = callado si no hay servidor. |
| `hermes` | objeto | `{ url, headers }` de tu puente a Hermes (ver [HERMES.md](HERMES.md)); `null` = mantener pulsado solo avisa que no está enlazado. |
| `holdMs` | número | Cuánto mantener pulsado para Hermes (450 ms). |
| `idleCloseMs` | número | La capa se cierra sola tras este tiempo sin tocar (45 s). |
| `lite` | `'auto'`, `true`, `false` | Modo ligero: sin animaciones continuas. `'auto'` lo activa con ≤ 2 GB de RAM o ≤ 2 núcleos. |
| `rotateMs` | número | Cada cuánto cambia de frase cuando `text` es una lista (9 s). |

### `status()`: estado y frases

```js
status: () => ({
  level: 'ok',            // ok · warn · error · sleep  → cara e insignia
  title: 'Todo en orden',
  text: ['Todo tranquilo por aquí.', 'Las APIs responden.'],   // texto o lista que va rotando
  go: null,               // si hay algo que mirar, tocar el globo llama a onNavigate(go)
  face: null,             // fuerza una cara: ok, happy, warn, error, sleep, think, listen, cool (gafas)
})
```

### `answer(id)`: respuestas que suenan humanas

Yayen lee en voz alta `text`, así que escríbelo como lo diría una persona: frases cortas, lo importante primero y sin
listas. Varía la forma de decirlo para que no suene a máquina.

```js
answer: async id => {
  if (id === 'news') {
    const fallos = await miApi.fallos();
    if (fallos.length) return { title: 'Ojo con esto', text: `Mira: ${fallos[0].nombre} está caído. Lo demás va bien. Toca la nube y te llevo.`, go: 'paginas', face: 'error' };
    return { title: '¡Todo bien!', text: 'Todo está bien. Todo en orden.', face: 'happy' };
  }
}
```

## 4. Métodos

| | |
|---|---|
| `yy.update()` | Vuelve a pintar la tarjeta (llámalo cuando cambien tus datos). |
| `yy.open()` / `yy.close()` | Abre o cierra la capa de opciones. |
| `yy.say({ title, text })` | Abre la capa y dice algo (por ejemplo, un aviso que llegó). |
| `yy.speak(texto)` | Solo voz. |
| `yy.destroy()` | Lo quita de la página. |
| `Yayen.svg()` | El personaje suelto en SVG, por si quieres usarlo en otro sitio. |

## 5. Estilos

Cambia las variables en `:root` o en el contenedor:

```css
:root {
  --yy-text: #f5f5f7; --yy-soft: #d6d6dc; --yy-card: #111113; --yy-line: #34343c;
  --yy-accent: #b07aff; --yy-sans: "Tu fuente", system-ui, sans-serif;
}
```

La capa de opciones está diseñada en unidades de 1280×400 (o 560×440 en vertical) y se escala sola a la ventana.
Los objetivos táctiles miden 56 px a esa escala.

## 6. Ejemplo real: el panel del rack

En el panel del homelab de palen.dev (pantalla táctil 1280×400 en un rack de 10″, servida por un contenedor de Proxmox):

- `status()` sale de su `/api/status` (páginas, APIs, servidores, YouTube, palen.dev) y de la hora (de noche duerme).
- Las opciones son: Revisar todo, ¿Qué hay de nuevo?, Servidores, Grabar (oculta las IPs), palen.dev, Redes y Descansa.
- `onNavigate` abre la pestaña correspondiente del panel.
- La voz y Hermes van por el servidor del panel, con las claves en su `secrets.env` (ver [HERMES.md](HERMES.md)).
