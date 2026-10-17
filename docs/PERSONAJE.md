# El personaje

Yayen es un SVG de 200×200 que se dibuja en código (`svg()` en `src/yayen.js`); no hay imágenes que cargar.

## Partes

| Parte | Cómo es |
|---|---|
| Cabeza | Esfera negra brillante con reflejo arriba y un borde fino azul→morado |
| Visor | Cristal oscuro con reflejos en diagonal; dentro, los ojos y la boca blancos con halo cian |
| Hojas | Dos hojas azules con nervaduras, una a cada lado (simétricas); se mecen y aletean al abrir el menú |
| Brazos | Dos cápsulas oscuras |
| Cuerpo | Esfera con rayas diagonales moradas y cian, con luz y sombra |
| Destellos | Estrellitas de cuatro puntas que titilan |

## Caras (`data-face`)

| Cara | Cuándo | Cómo |
|---|---|---|
| `ok` | Todo bien | Ojos ^ ^ y sonrisa |
| `happy` | Buena noticia | Ojos ^ ^, sonrisa grande, salta |
| `warn` | Aviso | Ojos abiertos, boca recta |
| `error` | Fallo | Cejas preocupadas, boca triste, gota de sudor |
| `sleep` | Noche / descanso | Ojos cerrados, «z z» |
| `think` | Pensando | Ojos abiertos, boca recta (y puntitos en la nube) |
| `listen` | Escuchando (Hermes) | Ojos abiertos, boca en «o» |
| `cool` | Modo grabación | Gafas oscuras |

Mientras habla, la boca se mueve (`.talk`). Los ojos parpadean cada pocos segundos.

## Animaciones

Flotar, mecer las hojas, titilar, saltar (`hop`), aletear (`flap`), opciones que salen disparadas desde Yayen con un
destello al llegar, nube que aparece con rebote. En **modo ligero** solo quedan el parpadeo, la boca y las transiciones.
Con «reducir movimiento» del sistema se apagan todas.

## Personalizar

- Colores del cuerpo y las hojas: los degradados `pu`, `cy`, `wing` dentro de `svg()`.
- Tamaño: `--yy-size`.
- Nombre: opción `name`.
