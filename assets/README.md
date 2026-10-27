# Yayen para imprimir y para marca

Yayen es una creación de **Jordan Palen** ([palen.dev](https://palen.dev)). Aquí están sus archivos para usarlo fuera de
la pantalla: mousepads, stickers, camisetas, tazas, presentaciones y redes.

| Archivo | Para qué |
|---|---|
| `yayen.svg` | **El Yayen principal** (contento). Vectorial: sirve para cualquier tamaño de impresión |
| `yayen-4096.png` | El principal en PNG de 4096 px de ancho con fondo transparente |
| `svg/yayen-<pose>.svg` | Cada pose en vectorial (28 poses: gestos y acciones) |
| `png/yayen-<pose>.png` | Las mismas poses en PNG de 1024 px de ancho, transparente (vista previa, web, redes) |

Poses incluidas: neutral, contento, alegre, risa, orgulloso (majestuoso), guiño, enamorado, cool (gafas), sorpresa,
curioso, escéptico, idea, piensa, tímido, preocupado, triste, enfadado (humo), furioso, mareado, dormido, trabajando
(laptop), leyendo, compilando, analizando, desplegando, música, celebrando y esperando.

## Al mandarlo a imprimir

- **Usa el SVG.** Es vectorial: queda nítido en un mousepad de 90 × 40 cm igual que en un sticker. Si la imprenta pide
  PDF, ábrelo en Inkscape o Illustrator y exporta a PDF; si pide PNG, exporta a 300 ppp del tamaño final (un mousepad de
  90 × 40 cm a 300 ppp son unos 10 630 × 4724 px).
- **Colores.** Están en RGB de pantalla. Los cian y morados muy saturados pierden algo de brillo en CMYK; pide una
  prueba de color si el tono importa.
- **Transparencias y brillos.** El aura, los brillos, el aro del suelo y la sombra son degradados y desenfoques
  semitransparentes. Lucen en fondos oscuros (como un mousepad negro); en fondo blanco o en serigrafía puedes quitarlos:
  en el SVG son los elementos con `class="aura"`, `class="gl"`, `class="floor"` y `class="shadow"`.
- **Logo.** El cuerpo lleva el logo de palen.dev (`class="logo"`), dibujado en vectorial.
- **Texto.** Las poses con texto («ja», «hmm…», «COMPILANDO», «REC») usan la fuente Geist (o la que haya). Para
  imprenta, convierte el texto a trazados (Inkscape: *Trayecto → Objeto a trayecto*).
- **Tamaño mínimo.** Por debajo de ~2 cm de alto los ojos y las rayas del cuerpo se empastan; para iconos pequeños
  usa la cabeza sola o la pose `contento`.

## Colores de Yayen

| Parte | Color |
|---|---|
| Cabeza y visor | `#1c1928` → `#08070c` (negro con brillo) |
| Hojas | `#c8f6ff` → `#5fd0ff` → `#1f62ff` |
| Rayas del cuerpo | cian `#9af0ff` → `#1f8cff`, morado `#cfa6ff` → `#7a3df0` |
| Borde de la cabeza | `#2fb6ff` → `#a35cff` |
| Ojos y boca | `#f2f8ff` con brillo azul |
| Logo palen.dev | azul `#5a8cff` y blanco `#f4f2ff`, contorno `#0d0a1c` |
| Aura | `#8a2be2` → `#2f7bff` |

## Volver a generarlos

Los archivos salen del mismo código que lo anima (`src/yayen-vivo.js`), así que siempre coinciden con el Yayen de la
pantalla. Para sacar una pose nueva: abre `demo/vivo.html`, ponla y en la consola del navegador ejecuta
`copy(new XMLSerializer().serializeToString(yayen.svg()))`; pega el resultado en un archivo `.svg`.
