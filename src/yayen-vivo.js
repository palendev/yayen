/*! Yayen vivo · personaje animado con gestos, acciones y efectos · MIT · https://github.com/palendev/yayen
 *
 *   <script src="yayen-vivo.js"></script>
 *   const yy = YayenVivo.crear(document.querySelector('#yayen'));
 *   yy.gesto('risa');                 // cara + efecto («ja ja ja»)
 *   yy.accion('compilando', { items: ['server.py', 'yayen.js'] });
 *   yy.despertar();                   // secuencia: bostezo, estirarse, mirar alrededor…
 *   yy.efecto('confeti');             // efecto suelto
 *   yy.hablar(true);                  // la boca se mueve
 *
 * Sin dependencias. Cada gesto es un conjunto de números (cabeza, ojos, párpados, cejas, boca); entre gestos
 * se pasa con muelles. Las acciones añaden objetos (computadora, libro, panel holográfico…) y los efectos son
 * partículas (humo, «ja ja», corazones…). Catálogo completo: YayenVivo.catalogo() y docs/CATALOGO.md.
 */
(function (root) {
  'use strict';

  /* ======================================================================================
     1. Esqueleto: valores neutros y catálogo de gestos
     ====================================================================================== */
  // yaw/pitch -1..1 · roll grados · gx/gy mirada -1..1 · lid párpado 0..1 · hap ojos sonrientes 0..1
  // sx/sy tamaño del ojo · brow 0..1 · bA ángulo de ceja (+ enfado, − preocupación) · smile −1..1 · open boca 0..1
  // flap aleteo · wing hojas arriba (estirarse) · armL/armR brazos (grados) · glasses gafas · glow aura · scale tamaño
  const NEUTRO = { yaw: 0, pitch: 0, roll: 0, gx: 0, gy: 0, lidL: 0, lidR: 0, hapL: 0, hapR: 0, sxL: 1, syL: 1, sxR: 1, syR: 1,
    brow: 0, bA: 0, smile: .35, open: 0, flap: 0, wing: 0, armL: 0, armR: 0, glasses: 0, glow: .35, tint: 0 };

  const GESTOS = {
    neutral:     { nombre: 'Neutral' },
    contento:    { nombre: 'Contento', hapL: 1, hapR: 1, smile: .9, roll: -4, glow: .5 },
    alegre:      { nombre: 'Alegre', hapL: 1, hapR: 1, smile: 1, open: .55, pitch: -.35, syL: 1.1, syR: 1.1, flap: 1, glow: .7, fx: ['chispas'] },
    risa:        { nombre: 'Risa', hapL: 1, hapR: 1, smile: 1, open: .75, pitch: -.3, roll: 6, flap: .8, fx: ['jaja'], vaiven: 'risa' },
    orgulloso:   { nombre: 'Majestuoso', pitch: -.35, roll: -5, lidL: .32, lidR: .32, smile: .6, wing: .5, glow: 1, scale: 1.04, fx: ['brillo'] },
    curioso:     { nombre: 'Curioso', roll: 12, yaw: .35, gx: .6, gy: -.5, sxL: .9, syL: .95, sxR: 1.15, syR: 1.2, smile: .1, brow: .5, bA: -6 },
    esceptico:   { nombre: 'Escéptico', yaw: -.3, roll: -6, gx: -.5, lidL: .45, lidR: .08, sxR: 1.08, smile: -.15, brow: .8, bA: 9, fx: ['hmm'] },
    confundido:  { nombre: 'Confundido', roll: 14, gx: .3, gy: -.4, sxL: .85, syL: .85, sxR: 1.15, syR: 1.15, smile: -.2, brow: .6, bA: -10, fx: ['pregunta'] },
    sorpresa:    { nombre: 'Sorpresa', pitch: -.45, sxL: 1.2, syL: 1.35, sxR: 1.2, syR: 1.35, open: .9, smile: 0, brow: .9, bA: -12, flap: .6, fx: ['exclamacion'] },
    idea:        { nombre: 'Idea', pitch: -.4, gy: -.8, sxL: 1.1, syL: 1.15, sxR: 1.1, syR: 1.15, smile: .8, brow: .6, bA: -8, glow: .8, fx: ['bombilla'] },
    piensa:      { nombre: 'Pensando', yaw: .45, pitch: -.4, gx: .8, gy: -.8, lidL: .2, lidR: .2, smile: -.05, roll: 6, armR: -35, fx: ['puntos'] },
    escucha:     { nombre: 'Escuchando', roll: -14, yaw: -.2, sxL: 1.1, syL: 1.15, sxR: 1.1, syR: 1.15, open: .35, smile: 0, brow: .4, bA: -6 },
    concentrado: { nombre: 'Concentrado', pitch: .15, lidL: .38, lidR: .38, smile: 0, brow: .7, bA: 6, gy: .2 },
    guino:       { nombre: 'Guiño', roll: -8, lidL: 0, lidR: 0, hapL: 0, hapR: 1, smile: .9, fx: ['chispas'], guino: true },
    timido:      { nombre: 'Tímido', yaw: -.5, pitch: .4, roll: -10, gx: -.7, gy: .6, hapL: .45, hapR: .45, smile: .5, tint: .8 },
    enamorado:   { nombre: 'Enamorado', hapL: .7, hapR: .7, smile: .95, roll: 8, tint: 1, flap: .4, fx: ['corazones'] },
    preocupado:  { nombre: 'Preocupado', pitch: .25, sxL: .9, syL: .9, sxR: .9, syR: .9, gy: .35, smile: -.6, brow: 1, bA: -16, fx: ['sudor'] },
    triste:      { nombre: 'Triste', pitch: .45, gy: .6, sxL: .95, syL: .85, sxR: .95, syR: .85, lidL: .25, lidR: .25, smile: -.9, brow: .9, bA: -18, wing: -.4, glow: .15, fx: ['lagrima'] },
    enfadado:    { nombre: 'Enfadado', pitch: .3, lidL: .35, lidR: .35, smile: -.7, brow: 1, bA: 20, armL: 20, armR: 20, fx: ['humo'], vaiven: 'tiembla' },
    furioso:     { nombre: 'Furioso', pitch: .35, lidL: .42, lidR: .42, smile: -1, open: .3, brow: 1, bA: 26, flap: .9, glow: 0, fx: ['humo-fuerte'], vaiven: 'tiembla-fuerte' },
    mareado:     { nombre: 'Mareado', lidL: .3, lidR: .1, sxR: 1.15, smile: -.3, open: .2, fx: ['espiral'], vaiven: 'mareo' },
    sueno:       { nombre: 'Con sueño', pitch: .45, roll: 9, lidL: .82, lidR: .88, smile: .05, gy: .4, wing: -.3, glow: .2 },
    dormido:     { nombre: 'Dormido', pitch: .55, roll: 12, lidL: 1, lidR: 1, smile: .1, wing: -.4, glow: .12, fx: ['zzz'], vaiven: 'respira' },
    cool:        { nombre: 'Con gafas', glasses: 1, smile: .7, roll: -6, pitch: -.15 },
  };

  /* ======================================================================================
     2. Dibujo base (SVG 200×200; el lienzo deja sitio arriba para los efectos)
     ====================================================================================== */
  function baseSVG(p) {
    let stripes = '';
    for (let k = -4; k <= 4; k++) stripes += `<rect x="${100 + k * 18 - 5.5}" y="90" width="11" height="120" fill="url(#${p}-${k % 2 ? 'cy' : 'pu'})"/>`;
    return `<svg viewBox="-45 -55 290 260" class="yv" role="img" aria-label="Yayen" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="${p}-aura" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#8a2be2" stop-opacity=".55"/><stop offset=".55" stop-color="#2f7bff" stop-opacity=".18"/><stop offset="1" stop-color="#2f7bff" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}-head" cx="34%" cy="26%" r="80%"><stop offset="0" stop-color="#4c4566"/><stop offset=".42" stop-color="#1c1928"/><stop offset="1" stop-color="#08070c"/></radialGradient>
  <radialGradient id="${p}-spec" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <linearGradient id="${p}-rim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2fb6ff"/><stop offset="1" stop-color="#a35cff"/></linearGradient>
  <linearGradient id="${p}-visor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f0d1c"/><stop offset=".7" stop-color="#030308"/><stop offset="1" stop-color="#0a1230"/></linearGradient>
  <linearGradient id="${p}-wing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c8f6ff"/><stop offset=".35" stop-color="#5fd0ff"/><stop offset="1" stop-color="#1f62ff"/></linearGradient>
  <linearGradient id="${p}-arm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d3854"/><stop offset="1" stop-color="#121019"/></linearGradient>
  <linearGradient id="${p}-pu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfa6ff"/><stop offset="1" stop-color="#7a3df0"/></linearGradient>
  <linearGradient id="${p}-cy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9af0ff"/><stop offset="1" stop-color="#1f8cff"/></linearGradient>
  <radialGradient id="${p}-ball" cx="34%" cy="28%" r="78%"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".32" stop-color="#fff" stop-opacity="0"/><stop offset=".72" stop-color="#000" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity=".65"/></radialGradient>
  <linearGradient id="${p}-holo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2fb6ff" stop-opacity=".28"/><stop offset="1" stop-color="#a35cff" stop-opacity=".12"/></linearGradient>
  <clipPath id="${p}-cbody"><circle cx="100" cy="148" r="33"/></clipPath>
  <clipPath id="${p}-cvisor"><rect class="visorClip" x="60" y="40" width="80" height="52" rx="22"/></clipPath>
  <mask id="${p}-mL" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200"><rect width="200" height="200" fill="#fff"/><rect class="lidL" fill="#000"/><ellipse class="cutL" fill="#000"/></mask>
  <mask id="${p}-mR" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200"><rect width="200" height="200" fill="#fff"/><rect class="lidR" fill="#000"/><ellipse class="cutR" fill="#000"/></mask>
  <g id="${p}-wingShape" transform="translate(30 62) rotate(-28)">
    <path d="M0-38C15-26 21-5 17 15C14 30 5 39 0 39C-7 35-17 23-18 4C-19-14-11-29 0-38Z" fill="url(#${p}-wing)" stroke="#bff3ff" stroke-opacity=".7" stroke-width="1.4"/>
    <g stroke="#e6fbff" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round" fill="none"><path d="M0-30C2-8 2 14 0 33"/><path d="M-13-8L0 2"/><path d="M-15 8L0 17"/><path d="M-11 23L0 29"/><path d="M12-12L1-3"/><path d="M14 4L1 12"/></g>
    <path d="M-6-30C-13-20-15-6-14 6" stroke="#fff" stroke-opacity=".6" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  </g>
</defs>
<circle class="aura" cx="100" cy="100" r="104" fill="url(#${p}-aura)"/>
<ellipse class="shadow" cx="100" cy="190" rx="44" ry="6" fill="#000" opacity=".5"/>
<g class="back"></g>
<g class="all">
  <g class="wingL"><use href="#${p}-wingShape"/></g>
  <g class="wingR"><use href="#${p}-wingShape" transform="translate(200 0) scale(-1 1)"/></g>
  <g class="body">
    <circle cx="100" cy="148" r="34" fill="#15121e"/>
    <g clip-path="url(#${p}-cbody)"><g transform="rotate(-42 100 148)">${stripes}</g><circle cx="100" cy="148" r="33" fill="url(#${p}-ball)"/></g>
    <circle cx="100" cy="148" r="33.5" fill="none" stroke="#2c2840" stroke-width="1.5"/>
    <ellipse cx="86" cy="130" rx="9" ry="4.5" transform="rotate(-35 86 130)" fill="#fff" opacity=".35"/>
  </g>
  <g class="armL"><ellipse cx="50" cy="113" rx="16" ry="8" transform="rotate(30 50 113)" fill="url(#${p}-arm)" stroke="#6a5f92" stroke-width="1.4"/></g>
  <g class="armR"><ellipse cx="150" cy="113" rx="16" ry="8" transform="rotate(-30 150 113)" fill="url(#${p}-arm)" stroke="#6a5f92" stroke-width="1.4"/></g>
  <g class="head">
    <circle cx="100" cy="66" r="54" fill="url(#${p}-head)"/>
    <circle cx="100" cy="66" r="53.2" fill="none" stroke="url(#${p}-rim)" stroke-opacity=".5" stroke-width="1.6"/>
    <ellipse class="spec" cx="74" cy="28" rx="20" ry="9" transform="rotate(-28 74 28)" fill="url(#${p}-spec)"/>
    <rect class="visorRect" x="60" y="40" width="80" height="52" rx="22" fill="url(#${p}-visor)" stroke="#2e2848" stroke-width="1.6"/>
    <g clip-path="url(#${p}-cvisor)">
      <path class="glare" d="M70 92L96 40H108L82 92Z" fill="#fff" opacity=".05"/>
      <rect x="40" y="84" width="120" height="8" fill="#2f7bff" opacity=".12"/>
      <rect class="screenGlow" x="40" y="40" width="120" height="52" fill="#5fd0ff" opacity="0"/>
      <ellipse class="blushL" cx="72" cy="78" rx="7" ry="3.5" fill="#ff7ac8" opacity="0"/>
      <ellipse class="blushR" cx="128" cy="78" rx="7" ry="3.5" fill="#ff7ac8" opacity="0"/>
      <rect class="haloL" fill="#8ee8ff" opacity=".18" mask="url(#${p}-mL)"/>
      <rect class="haloR" fill="#8ee8ff" opacity=".18" mask="url(#${p}-mR)"/>
      <rect class="eyeL" fill="#f5f5f7" mask="url(#${p}-mL)"/>
      <rect class="eyeR" fill="#f5f5f7" mask="url(#${p}-mR)"/>
      <path class="browL" stroke="#f5f5f7" stroke-width="4" stroke-linecap="round" fill="none" opacity="0"/>
      <path class="browR" stroke="#f5f5f7" stroke-width="4" stroke-linecap="round" fill="none" opacity="0"/>
      <path class="mouth" stroke="#f5f5f7" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <ellipse class="mouthO" fill="#f5f5f7" opacity="0"/>
      <g class="glasses" opacity="0"><rect class="gL" width="30" height="16" rx="6" fill="#120a20" stroke="url(#${p}-rim)" stroke-width="2.5"/><rect class="gR" width="30" height="16" rx="6" fill="#120a20" stroke="url(#${p}-rim)" stroke-width="2.5"/><path class="gB" stroke="#a35cff" stroke-width="2.5"/></g>
    </g>
  </g>
  <g class="props"></g>
</g>
<g class="fx"></g>
</svg>`;
  }

  /* ======================================================================================
     3. Utilidades SVG
     ====================================================================================== */
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); if (parent) parent.appendChild(el); return el; };
  const set = (el, a) => { for (const k in a) el.setAttribute(k, a[k]); };
  const f = n => (Math.round(n * 100) / 100).toString();
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = l => l[Math.floor(Math.random() * l.length)];
  const star = (x, y, r) => `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
  const FONT = 'Geist, Inter, system-ui, sans-serif';

  /* ======================================================================================
     4. Efectos (partículas). Cada uno: { cada: ms entre partículas, crear(ctx) → partícula }
        Una partícula es { el, vida (ms), mover(el, k 0..1, t) }
     ====================================================================================== */
  const EFECTOS = {
    humo: { nombre: 'Humo', cada: 420, crear(c) {
      const side = pick([-1, 1]), g = mk('g', {}, c.fx);
      const puff = mk('circle', { r: 6, fill: '#b7b2c6' }, g); mk('circle', { r: 4, cx: 5, cy: -3, fill: '#d6d2e2' }, g);
      return { el: g, vida: 1600, mover(el, k) { const x = 100 + side * (22 + k * 18) + c.P.yaw * 7, y = 18 - k * 48; set(el, { transform: `translate(${f(x)} ${f(y)}) scale(${f(.6 + k * 1.4)})`, opacity: f((1 - k) * .85) }); } }; } },
    'humo-fuerte': { nombre: 'Humo fuerte', cada: 160, crear(c) { const p = EFECTOS.humo.crear(c); set(p.el.firstChild, { fill: '#8f88a4' }); p.vida = 1200; return p; } },
    jaja: { nombre: '«Ja ja ja»', cada: 380, crear(c) {
      c.ja = (c.ja || 0) + 1; const side = c.ja % 2 ? -1 : 1;
      const t = mk('text', { 'font-family': FONT, 'font-weight': 800, 'font-size': 15, fill: side < 0 ? '#8ee8ff' : '#e2c8ff', 'text-anchor': 'middle' }, c.fx); t.textContent = 'ja';
      const x0 = 100 + side * rnd(42, 62);
      return { el: t, vida: 1400, mover(el, k) { set(el, { x: f(x0 + Math.sin(k * 9) * 3), y: f(40 - k * 55), opacity: f(k < .15 ? k / .15 : 1 - (k - .15) / .85), transform: `rotate(${side * 12} ${f(x0)} ${f(40 - k * 55)})` }); } }; } },
    chispas: { nombre: 'Chispas', cada: 260, crear(c) {
      const x = rnd(20, 180), y = rnd(-20, 70), col = pick(['#5fd0ff', '#b07aff', '#ffe9a8', '#e2c8ff']);
      const s = mk('path', { d: star(0, 0, 6), fill: col }, c.fx);
      return { el: s, vida: 900, mover(el, k) { const sc = Math.sin(k * Math.PI); set(el, { transform: `translate(${f(x)} ${f(y - k * 8)}) rotate(${f(k * 90)}) scale(${f(sc)})`, opacity: f(sc) }); } }; } },
    brillo: { nombre: 'Brillo majestuoso', cada: 300, crear(c) {
      const a = rnd(0, Math.PI * 2), r0 = rnd(70, 95), s = mk('circle', { r: rnd(1.2, 2.6), fill: pick(['#e2c8ff', '#8ee8ff', '#fff']) }, c.back);
      return { el: s, vida: 2600, mover(el, k) { set(el, { cx: f(100 + Math.cos(a) * r0), cy: f(100 + Math.sin(a) * r0 - k * 40), opacity: f(Math.sin(k * Math.PI) * .9) }); } }; } },
    corazones: { nombre: 'Corazones', cada: 520, crear(c) {
      const x0 = rnd(60, 140), g = mk('path', { d: 'M0 3C-6-3-12 2-6 8L0 13L6 8C12 2 6-3 0 3Z', fill: pick(['#ff7ac8', '#ff5fa2', '#e2c8ff']) }, c.fx);
      return { el: g, vida: 1800, mover(el, k) { set(el, { transform: `translate(${f(x0 + Math.sin(k * 7) * 8)} ${f(30 - k * 70)}) scale(${f(.8 + k * .5)})`, opacity: f(1 - k) }); } }; } },
    sudor: { nombre: 'Sudor', cada: 1300, crear(c) {
      const d = mk('path', { d: 'M0 0C-4 6-4 10 0 11C4 10 4 6 0 0Z', fill: '#7cc8ff' }, c.fx);
      return { el: d, vida: 1200, mover(el, k) { set(el, { transform: `translate(${f(150 + c.P.yaw * 7)} ${f(60 + k * 22)})`, opacity: f(k < .2 ? k * 5 : 1 - (k - .2) / .8) }); } }; } },
    lagrima: { nombre: 'Lágrima', cada: 1500, crear(c) {
      const d = mk('path', { d: 'M0 0C-3 5-3 8 0 9C3 8 3 5 0 0Z', fill: '#8ee8ff' }, c.fx), x = c.eyeX.L;
      return { el: d, vida: 1500, mover(el, k) { set(el, { transform: `translate(${f(x)} ${f(c.eyeY + 8 + k * 50)})`, opacity: f(1 - k) }); } }; } },
    pregunta: { nombre: 'Interrogación', cada: 1800, crear(c) { return pop(c, '?', '#e2c8ff', 150, 5); } },
    exclamacion: { nombre: 'Exclamación', cada: 2200, crear(c) { return pop(c, '!', '#ffd36b', 152, 2); } },
    hmm: { nombre: '«Hmm…»', cada: 2600, crear(c) { const p = pop(c, 'hmm…', '#c9b8ff', 160, 10, 11); p.vida = 2200; return p; } },
    puntos: { nombre: 'Puntos de pensar', cada: 2400, crear(c) {
      const g = mk('g', {}, c.fx);
      [[150, 16, 3], [160, 4, 4.5], [172, -10, 7]].forEach(([x, y, r]) => mk('circle', { cx: x, cy: y, r, fill: '#e9e3ff' }, g));
      return { el: g, vida: 2300, mover(el, k) { const n = Math.min(3, Math.floor(k * 4)); [...el.children].forEach((ch, i) => ch.setAttribute('opacity', i < n ? .9 : 0)); } }; } },
    bombilla: { nombre: 'Bombilla', cada: 3000, crear(c) {
      const g = mk('g', {}, c.fx);
      mk('circle', { cx: 0, cy: 0, r: 16, fill: '#ffe9a8', opacity: .25 }, g);
      mk('path', { d: 'M0-10C-7-10-10-4-8 1C-6 5-4 6-4 10H4C4 6 6 5 8 1C10-4 7-10 0-10Z', fill: '#ffe07a', stroke: '#fff3c4', 'stroke-width': 1.2 }, g);
      mk('rect', { x: -4, y: 11, width: 8, height: 4, rx: 1.5, fill: '#b9b2c8' }, g);
      return { el: g, vida: 2900, mover(el, k) { const s = k < .15 ? k / .15 : 1; set(el, { transform: `translate(${f(100 + c.P.yaw * 7)} ${f(-22 - Math.sin(k * 6) * 2)}) scale(${f(s)})`, opacity: f(k > .85 ? (1 - k) / .15 : 1) }); } }; } },
    espiral: { nombre: 'Mareo', cada: 3000, crear(c) {
      const g = mk('g', {}, c.fx);
      [-24, 0, 24].forEach((dx, i) => mk('path', { d: star(dx, 0, 6), fill: ['#ffe9a8', '#8ee8ff', '#e2c8ff'][i] }, g));
      return { el: g, vida: 3000, mover(el, k, t) { set(el, { transform: `translate(${f(100 + c.P.yaw * 7)} 0) rotate(${f(t * .4 % 360)}) scale(1 .45)` }); } }; } },
    zzz: { nombre: 'Zzz', cada: 1100, crear(c) {
      const t = mk('text', { 'font-family': FONT, 'font-weight': 800, 'font-size': rnd(11, 17), fill: '#c9b8ff' }, c.fx); t.textContent = 'z';
      return { el: t, vida: 2200, mover(el, k) { set(el, { x: f(150 + k * 20 + Math.sin(k * 6) * 4), y: f(30 - k * 50), opacity: f(Math.sin(k * Math.PI)) }); } }; } },
    confeti: { nombre: 'Confeti', cada: 60, crear(c) {
      const r = mk('rect', { width: 4, height: 7, rx: 1, fill: pick(['#5fd0ff', '#a35cff', '#ffe07a', '#ff7ac8', '#7cf0b0']) }, c.fx);
      const x0 = rnd(0, 200), vx = rnd(-20, 20), spin = rnd(-400, 400);
      return { el: r, vida: 1800, mover(el, k) { set(el, { transform: `translate(${f(x0 + vx * k)} ${f(-50 + k * 250)}) rotate(${f(spin * k)})`, opacity: f(1 - k * k) }); } }; } },
    notas: { nombre: 'Notas musicales', cada: 600, crear(c) {
      const t = mk('text', { 'font-family': 'serif', 'font-size': 18, fill: pick(['#8ee8ff', '#e2c8ff']) }, c.fx); t.textContent = pick(['♪', '♫']);
      const side = pick([-1, 1]);
      return { el: t, vida: 1800, mover(el, k) { set(el, { x: f(100 + side * (60 + k * 15)), y: f(70 - k * 70 + Math.sin(k * 10) * 4), opacity: f(Math.sin(k * Math.PI)) }); } }; } },
  };
  function pop(c, txt, col, x, y, size = 26) {
    const t = mk('text', { 'font-family': FONT, 'font-weight': 800, 'font-size': size, fill: col, 'text-anchor': 'middle' }, c.fx); t.textContent = txt;
    return { el: t, vida: 1700, mover(el, k) { const s = k < .2 ? 1 + Math.sin(k / .2 * Math.PI) * .3 : 1; set(el, { x: f(x + c.P.yaw * 7), y: f(y - Math.min(k, .2) * 20), opacity: f(k > .8 ? (1 - k) / .2 : 1), transform: `scale(${f(s)})`, 'transform-origin': `${x} ${y}` }); } };
  }

  /* ======================================================================================
     5. Acciones (con objetos). Cada una: { nombre, pose (gesto base), montar(c, opciones) → actualizar(t, dt) }
     ====================================================================================== */
  const NOMBRES_FN = ['iniciar()', 'leerConfig()', 'conectarAPI()', 'renderPanel()', 'sondear()', 'guardarCache()', 'enviarVoz()', 'validar()'];
  function holo(c, x, y, w, h, titulo) {
    const g = mk('g', { class: 'holo' }, c.props);
    mk('rect', { x, y, width: w, height: h, rx: 6, fill: `url(#${c.p}-holo)`, stroke: '#5fd0ff', 'stroke-opacity': .7, 'stroke-width': 1.2 }, g);
    const tt = mk('text', { x: x + 6, y: y + 10, 'font-family': FONT, 'font-size': 7, 'font-weight': 700, fill: '#bff3ff' }, g); tt.textContent = titulo;
    mk('path', { d: `M${x + w / 2 - 6} ${y + h}L${x + w / 2} ${y + h + 10}L${x + w / 2 + 6} ${y + h}`, fill: 'none', stroke: '#5fd0ff', 'stroke-opacity': .4 }, g);
    return g;
  }
  const ACCIONES = {
    trabajando: { nombre: 'Trabajando (computadora)', pose: { pitch: .38, gy: .7, gx: 0, armL: -18, armR: 18, smile: .2, lidL: .12, lidR: .12 }, montar(c) {
      const g = mk('g', { transform: 'translate(100 150)' }, c.props);
      mk('path', { d: 'M-40 4H40L34 14H-34Z', fill: '#2b2740', stroke: '#4a4266' }, g);                                    // base
      mk('rect', { x: -34, y: -30, width: 68, height: 36, rx: 3, fill: '#1c1928', stroke: '#6a5f92', 'stroke-width': 1.4 }, g); // tapa (por detrás)
      mk('circle', { cx: 0, cy: -12, r: 5, fill: '#a35cff', opacity: .8 }, g); mk('circle', { cx: 1.5, cy: -14, r: 1.6, fill: '#e2c8ff' }, g);
      const keys = []; for (let i = 0; i < 10; i++) keys.push(mk('rect', { x: -30 + i * 6, y: 7, width: 4.5, height: 2.5, rx: .8, fill: '#5fd0ff', opacity: .15 }, g));
      const code = mk('g', {}, c.props);
      let nextKey = 0, nextLine = 0;
      c.screen = .55;
      return (t) => {
        if (t > nextKey) { keys.forEach(k => k.setAttribute('opacity', .15)); pick(keys).setAttribute('opacity', 1); pick(keys).setAttribute('opacity', .8); nextKey = t + 90; }
        c.typing = Math.sin(t / 60);
        if (t > nextLine) { const w = rnd(10, 34), l = mk('rect', { x: 158 + rnd(0, 14), y: 128, width: w, height: 2.6, rx: 1.3, fill: pick(['#5fd0ff', '#b07aff', '#7cf0b0']) }, code); l.dataset.t0 = t; nextLine = t + 260; }
        [...code.children].forEach(l => { const k = (t - l.dataset.t0) / 1600; if (k > 1) l.remove(); else set(l, { transform: `translate(${f(k * 6)} ${f(-k * 70)})`, opacity: f(k < .1 ? k * 10 : 1 - k) }); });
      };
    } },
    leyendo: { nombre: 'Leyendo (libro)', pose: { pitch: .32, gy: .6, armL: -22, armR: 22, smile: .25, lidL: .08, lidR: .08 }, montar(c) {
      const g = mk('g', { transform: 'translate(100 146)' }, c.props);
      mk('path', { d: 'M0-18C-12-22-26-22-36-18V12C-26 8-12 8 0 12Z', fill: '#f3eefc', stroke: '#c9b8ff' }, g);
      mk('path', { d: 'M0-18C12-22 26-22 36-18V12C26 8 12 8 0 12Z', fill: '#e9e2fa', stroke: '#c9b8ff' }, g);
      for (let i = 0; i < 5; i++) { mk('path', { d: `M-31 ${-12 + i * 5}H-6`, stroke: '#9b8fc0', 'stroke-width': 1.2, opacity: .7 }, g); mk('path', { d: `M6 ${-12 + i * 5}H31`, stroke: '#9b8fc0', 'stroke-width': 1.2, opacity: .7 }, g); }
      const hoja = mk('path', { d: 'M0-18C12-22 26-22 36-18V12C26 8 12 8 0 12Z', fill: '#fdfbff', stroke: '#c9b8ff' }, g);
      mk('path', { d: 'M0-18V12', stroke: '#7a3df0', 'stroke-width': 1.5 }, g);
      return (t) => {
        c.scan = Math.sin(t / 700);                                   // los ojos recorren la línea
        const k = (t % 4200) / 4200, flip = k > .82 ? (k - .82) / .18 : 0;
        set(hoja, { transform: `scale(${f(Math.cos(flip * Math.PI))} 1)`, opacity: flip ? 1 : 0 });
      };
    } },
    compilando: { nombre: 'Compilando (función por función)', pose: { yaw: .42, gx: .75, gy: -.1, roll: 4, smile: .1, lidL: .18, lidR: .18, brow: .4, bA: 5 }, montar(c, o) {
      const items = (o && o.items && o.items.length ? o.items : NOMBRES_FN).slice();
      const g = holo(c, 162, 18, 80, 98, 'COMPILANDO');
      const filas = mk('g', {}, g), barra = mk('rect', { x: 168, y: 106, width: 0, height: 4, rx: 2, fill: '#7cf0b0' }, g);
      mk('rect', { x: 168, y: 106, width: 68, height: 4, rx: 2, fill: '#ffffff', opacity: .12 }, g);
      let i = 0, t0 = 0;
      const fila = (n, y) => {
        const fg = mk('g', { transform: `translate(0 ${y})` }, filas);
        const ic = mk('g', { transform: 'translate(172 0)' }, fg);
        mk('circle', { r: 3.2, fill: 'none', stroke: '#5fd0ff', 'stroke-width': 1.4, 'stroke-dasharray': '6 14' }, ic);
        const tx = mk('text', { x: 179, y: 2.4, 'font-family': 'ui-monospace, Menlo, monospace', 'font-size': 6.4, fill: '#e6fbff' }, fg); tx.textContent = n;
        return { fg, ic };
      };
      let actual = null;
      return (t) => {
        if (!actual || t - t0 > 1100) {
          if (actual) { actual.ic.innerHTML = ''; mk('path', { d: 'M-3 0L-1 2.4L3.2-2.4', fill: 'none', stroke: '#7cf0b0', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, actual.ic); }
          if (filas.children.length >= 8) { filas.innerHTML = ''; c.efecto('chispas', 500); }
          actual = fila(items[i % items.length], 34 + filas.children.length * 9); i++; t0 = t;
        }
        const k = (t - t0) / 1100;
        set(actual.ic, { transform: `translate(172 0) rotate(${f(k * 720)})` });
        set(barra, { width: f(((filas.children.length - 1 + k) / 8) * 68) });
      };
    } },
    analizando: { nombre: 'Analizando (gráfica)', pose: { yaw: .42, gx: .75, gy: 0, roll: 3, smile: .2, brow: .3, bA: 4 }, montar(c) {
      const g = holo(c, 162, 18, 80, 80, 'ANALIZANDO'); const bars = [];
      for (let i = 0; i < 7; i++) bars.push(mk('rect', { x: 168 + i * 9.6, width: 6, rx: 1.5, fill: i % 2 ? '#a35cff' : '#5fd0ff' }, g));
      const line = mk('path', { fill: 'none', stroke: '#7cf0b0', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, g);
      return (t) => {
        let d = '';
        bars.forEach((b, i) => { const h = 12 + 26 * (.5 + .5 * Math.sin(t / 600 + i * .9)); set(b, { y: f(90 - h), height: f(h) }); d += `${i ? 'L' : 'M'}${f(171 + i * 9.6)} ${f(86 - h - 4)}`; });
        line.setAttribute('d', d);
      };
    } },
    buscando: { nombre: 'Buscando (lupa)', pose: { smile: .15, brow: .5, bA: -4, armR: -40 }, montar(c) {
      const g = mk('g', {}, c.props);
      mk('circle', { r: 13, fill: '#8ee8ff', 'fill-opacity': .12, stroke: '#e6fbff', 'stroke-width': 3 }, g);
      mk('path', { d: 'M9 9L22 22', stroke: '#6a5f92', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
      mk('path', { d: 'M-6-6A9 9 0 0 1 2-9', stroke: '#fff', 'stroke-width': 2, fill: 'none', opacity: .7 }, g);
      return (t) => { const x = 100 + Math.sin(t / 700) * 60, y = 60 + Math.sin(t / 350) * 25; set(g, { transform: `translate(${f(x)} ${f(y)})` }); c.lookAt = { x: (x - 100) / 60, y: (y - 60) / 40 }; };
    } },
    descargando: { nombre: 'Descargando', pose: { pitch: -.3, gy: -.7, gx: .4, yaw: .2, smile: .3 }, montar(c) { return transferencia(c, 1); } },
    subiendo: { nombre: 'Subiendo', pose: { pitch: -.3, gy: -.7, gx: .4, yaw: .2, smile: .3 }, montar(c) { return transferencia(c, -1); } },
    desplegando: { nombre: 'Desplegando (cohete)', pose: { pitch: -.35, gy: -.8, gx: .5, yaw: .25, smile: .6, flap: .4 }, montar(c) {
      const g = mk('g', {}, c.props);
      mk('path', { d: 'M0-14C6-8 6 4 4 10H-4C-6 4-6-8 0-14Z', fill: '#f3eefc', stroke: '#c9b8ff' }, g);
      mk('circle', { cx: 0, cy: -3, r: 2.6, fill: '#5fd0ff' }, g);
      mk('path', { d: 'M-4 4L-9 12H-4ZM4 4L9 12H4Z', fill: '#a35cff' }, g);
      const fuego = mk('path', { fill: '#ffb347' }, g);
      return (t) => {
        const k = (t % 2600) / 2600, y = 150 - k * 220, x = 170 + Math.sin(k * 3) * 6;
        set(g, { transform: `translate(${f(x)} ${f(y)})`, opacity: f(k > .9 ? (1 - k) * 10 : 1) });
        set(fuego, { d: `M-3 10L0 ${f(16 + Math.random() * 6)}L3 10Z` });
        c.lookAt = { x: .8, y: Math.max(-1, (y - 60) / 80) };
        if (k > .97) c.efecto('chispas', 300);
      };
    } },
    esperando: { nombre: 'Esperando (reloj de arena)', pose: { yaw: .3, gx: .6, gy: .2, lidL: .3, lidR: .3, smile: 0, roll: 5 }, montar(c) {
      const g = mk('g', {}, c.props);
      const vidrio = 'M-8-13C-8-4-1.5-2-1.5 0C-1.5 2-8 4-8 13H8C8 4 1.5 2 1.5 0C1.5-2 8-4 8-13Z';
      mk('path', { d: vidrio, fill: '#8ee8ff', 'fill-opacity': .12 }, g);
      const arena = mk('path', { fill: '#ffd36b' }, g), hilo = mk('path', { stroke: '#ffd36b', 'stroke-width': 1.2 }, g);
      mk('path', { d: vidrio, fill: 'none', stroke: '#e6fbff', 'stroke-width': 1.3, 'stroke-linejoin': 'round' }, g);
      mk('path', { d: 'M-11-14H11M-11 14H11', stroke: '#c9b8ff', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
      return (t) => {
        const k = (t % 3200) / 3200, flip = k > .86 ? (k - .86) / .14 : 0, s = Math.min(1, k / .86);
        set(g, { transform: `translate(172 112) scale(1.35) rotate(${f(flip * 180)})` });
        const a = 1 - s, top = -2 - 9 * a, bot = 12 - 9 * s;   // arriba se vacía, abajo crece el montón
        set(arena, { d: `M${f(-6.5 * a)} ${f(top)}H${f(6.5 * a)}L0 -1.5Z M-7 12C-5 ${f(bot)} 5 ${f(bot)} 7 12Z` });
        set(hilo, { d: flip || s >= 1 ? '' : `M0-1.5V${f(bot + 1)}`, opacity: .8 });
      };
    } },
    sincronizando: { nombre: 'Sincronizando', pose: { smile: .3, gy: -.3, pitch: -.1 }, montar(c) {
      const g = mk('g', {}, c.props);
      mk('path', { d: 'M38 0A38 38 0 0 1-30 23', fill: 'none', stroke: '#5fd0ff', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
      mk('path', { d: 'M-38 0A38 38 0 0 1 30-23', fill: 'none', stroke: '#a35cff', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
      mk('path', { d: 'M-30 23L-24 30M-30 23L-38 26', stroke: '#5fd0ff', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
      mk('path', { d: 'M30-23L24-30M30-23L38-26', stroke: '#a35cff', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
      return (t) => set(g, { transform: `translate(170 22) rotate(${f(-t / 5 % 360)}) scale(.5)`, opacity: .95 });
    } },
    musica: { nombre: 'Escuchando música', pose: { hapL: .8, hapR: .8, smile: .8 }, montar(c) {
      const g = mk('g', {}, c.props);
      mk('path', { d: 'M48 66C48 20 152 20 152 66', fill: 'none', stroke: '#3d3854', 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
      mk('rect', { x: 40, y: 54, width: 14, height: 26, rx: 6, fill: '#a35cff', stroke: '#e2c8ff' }, g);
      mk('rect', { x: 146, y: 54, width: 14, height: 26, rx: 6, fill: '#a35cff', stroke: '#e2c8ff' }, g);
      c.bucle('notas');
      return (t) => { c.groove = Math.sin(t / 260); set(g, { transform: `translate(${f(c.P.yaw * 7)} ${f(c.P.pitch * 5)}) rotate(${f(c.P.roll + c.groove * 6)} 100 112)` }); };
    } },
    grabando: { nombre: 'Grabando', pose: { glasses: 1, smile: .7, roll: -6 }, montar(c) {
      const g = mk('g', {}, c.props);
      const dot = mk('circle', { cx: 18, cy: -26, r: 5, fill: '#ff453a' }, g);
      const tx = mk('text', { x: 27, y: -22, 'font-family': FONT, 'font-weight': 800, 'font-size': 11, fill: '#ff8a80' }, g); tx.textContent = 'REC';
      return (t) => dot.setAttribute('opacity', Math.sin(t / 300) > 0 ? 1 : .2);
    } },
    celebrando: { nombre: 'Celebrando', pose: { hapL: 1, hapR: 1, smile: 1, open: .6, flap: 1, pitch: -.3, wing: .6, glow: .9 }, montar(c) { c.bucle('confeti'); c.bucle('chispas'); return (t) => { c.groove = Math.sin(t / 180); }; } },
    hablando: { nombre: 'Hablando', pose: { smile: .4 }, montar(c) { c.talk = true; return () => {}; } },
  };
  function transferencia(c, dir) {
    const g = mk('g', {}, c.props);
    mk('path', { d: 'M150 20C146 20 143 17 143 13C143 9 146 6 150 6C151 0 158-3 163 0C167-4 175-2 176 4C181 4 184 8 184 12C184 17 180 20 176 20Z', fill: '#e9e3ff', stroke: '#c9b8ff' }, g);
    const dots = []; for (let i = 0; i < 4; i++) dots.push(mk('path', { d: 'M-3-2L0 2L3-2', fill: 'none', stroke: '#5fd0ff', 'stroke-width': 2, 'stroke-linecap': 'round' }, g));
    mk('rect', { x: 64, y: 186, width: 72, height: 5, rx: 2.5, fill: '#fff', opacity: .12 }, g);
    const bar = mk('rect', { x: 64, y: 186, width: 0, height: 5, rx: 2.5, fill: '#7cf0b0' }, g);
    return (t) => {
      dots.forEach((d, i) => { const k = ((t / 1200) + i / 4) % 1, kk = dir > 0 ? k : 1 - k; set(d, { transform: `translate(${f(163 - kk * 40)} ${f(26 + kk * 52)}) rotate(${dir > 0 ? 40 : 220})`, opacity: f(Math.sin(k * Math.PI)) }); });
      bar.setAttribute('width', f((t / 60) % 72));
    };
  }

  /* ======================================================================================
     6. El personaje
     ====================================================================================== */
  let instancias = 0;
  function crear(contenedor, opciones = {}) {
    const o = Object.assign({ seguir: true, vida: true, ligero: 'auto', majestuoso: true }, opciones);
    const p = `yv${++instancias}`;
    contenedor.innerHTML = baseSVG(p);
    const svg = contenedor.querySelector('svg');
    const q = c => svg.querySelector('.' + c);
    const E = {}; ['aura', 'shadow', 'back', 'all', 'wingL', 'wingR', 'body', 'armL', 'armR', 'head', 'spec', 'visorRect', 'visorClip', 'glare', 'screenGlow', 'blushL', 'blushR',
      'haloL', 'haloR', 'eyeL', 'eyeR', 'lidL', 'lidR', 'cutL', 'cutR', 'browL', 'browR', 'mouth', 'mouthO', 'glasses', 'gL', 'gR', 'gB', 'props', 'fx'].forEach(k => { E[k] = q(k); });
    const ligero = o.ligero === 'auto' ? ((navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency || 4) <= 2) : !!o.ligero;

    const P = {}, V = {}, T = {};
    for (const k in NEUTRO) { P[k] = NEUTRO[k]; V[k] = 0; T[k] = NEUTRO[k]; }
    const ctx = { p, P, fx: E.fx, back: E.back, props: E.props, eyeX: { L: 80, R: 120 }, eyeY: 62, screen: 0, typing: 0, scan: null, lookAt: null, groove: 0, talk: false,
      efecto: (id, ms) => efecto(id, ms), bucle: id => bucles.add(id) };
    let gesto = 'neutral', accion = null, accionUpd = null, accionPose = {}, bucles = new Set(), sueltos = [], particulas = [], ultimo = {};
    let hablar = false, secuencia = null, scale = 1, scaleV = 0;

    function objetivo() {
      const g = GESTOS[gesto] || GESTOS.neutral;
      for (const k in NEUTRO) T[k] = k in accionPose ? accionPose[k] : (k in g ? g[k] : NEUTRO[k]);
      if (accion && gesto !== 'neutral') for (const k in NEUTRO) if (k in g) T[k] = g[k];   // un gesto explícito manda sobre la pose de la acción
      bucles = new Set([...(g.fx || []), ...ctx._bAccion || []]);
    }
    function setGesto(id) { if (!GESTOS[id]) throw new Error(`Gesto desconocido: ${id}`); gesto = id; objetivo(); return api; }
    function setAccion(id, opts) {
      E.props.innerHTML = ''; ctx.screen = 0; ctx.typing = 0; ctx.scan = null; ctx.lookAt = null; ctx.groove = 0; ctx.talk = false; ctx._bAccion = [];
      accion = null; accionUpd = null; accionPose = {};
      if (id) {
        const a = ACCIONES[id]; if (!a) throw new Error(`Acción desconocida: ${id}`);
        accion = id; accionPose = a.pose || {};
        const antes = new Set(bucles); ctx.bucle = x => { ctx._bAccion.push(x); };
        accionUpd = a.montar(ctx, opts || {});
        ctx.bucle = x => bucles.add(x);
      }
      objetivo(); return api;
    }
    function efecto(id, ms = 1600) { if (!EFECTOS[id]) throw new Error(`Efecto desconocido: ${id}`); sueltos.push({ id, hasta: performance.now() + ms }); return api; }

    /* mirada */
    let mira = null, ultimoMov = -1e9, idle = { x: 0, y: 0 }, sigIdle = 0;
    const onMove = e => {
      if (!o.seguir) return;
      const r = svg.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * .38;
      mira = { x: Math.max(-1, Math.min(1, (e.clientX - cx) / (innerWidth * .45))), y: Math.max(-1, Math.min(1, (e.clientY - cy) / (innerHeight * .45))) };
      ultimoMov = performance.now();
    };
    addEventListener('pointermove', onMove, { passive: true });

    /* parpadeo y salto */
    let blink = 0, blinkPh = 0, nextBlink = performance.now() + 1200, hop = 0, hopV = 0;
    const saltar = (fuerza = 9) => { hopV -= fuerza; };

    const STIFF = { gx: 260, gy: 260, lidL: 220, lidR: 220 };
    const SOFT = o.majestuoso ? .82 : 1;
    function paso(dt, now) {
      // mirada: dedo > objeto de la acción > vida propia > gesto
      let gxT = T.gx, gyT = T.gy, yawT = T.yaw, pitchT = T.pitch;
      if (ctx.lookAt) { gxT = ctx.lookAt.x; gyT = ctx.lookAt.y; yawT = T.yaw * .3 + ctx.lookAt.x * .4; pitchT = T.pitch * .3 + ctx.lookAt.y * .3; }
      else if (ctx.scan !== null) { gxT = ctx.scan * .55; }
      else if (o.seguir && mira && now - ultimoMov < 2500 && !secuencia) { gxT = mira.x; gyT = mira.y; yawT = T.yaw + mira.x * .55; pitchT = T.pitch + mira.y * .45; }
      else if (o.vida && !accion && !secuencia && ['neutral', 'contento', 'orgulloso', 'cool', 'concentrado'].includes(gesto)) {
        if (now > sigIdle) {
          const r = Math.random();
          idle = r < .3 ? { x: 0, y: 0 } : { x: rnd(-.9, .9), y: rnd(-.6, .5) };
          sigIdle = now + rnd(1400, 4200);
          if (r > .93 && !bucles.size) efecto(pick(['chispas', 'brillo']), 900);
        }
        gxT = idle.x; gyT = idle.y; yawT = T.yaw + idle.x * .45; pitchT = T.pitch + idle.y * .35;
      }
      const tgt = Object.assign({}, T, { gx: gxT, gy: gyT, yaw: yawT, pitch: pitchT });
      if (hablar || ctx.talk) tgt.open = .22 + .38 * (Math.sin(now / 85) * .5 + .5) * (Math.sin(now / 230) * .5 + .5);
      for (const k in NEUTRO) {
        const s = (STIFF[k] || 110) * SOFT, d = 2 * Math.sqrt(s) * .78;
        V[k] += ((tgt[k] - P[k]) * s - V[k] * d) * dt;
        P[k] += V[k] * dt;
      }
      const sc = (GESTOS[gesto] && GESTOS[gesto].scale) || 1;
      scaleV += ((sc - scale) * 90 - scaleV * 14) * dt; scale += scaleV * dt;
      // parpadeo al azar (a veces doble); no parpadea si está dormido
      if (P.lidL < .9) {
        if (now > nextBlink && blinkPh === 0) blinkPh = 1;
        if (blinkPh === 1) { blink += dt * 14; if (blink >= 1) { blink = 1; blinkPh = 2; } }
        else if (blinkPh === 2) { blink -= dt * 9; if (blink <= 0) { blink = 0; blinkPh = 0; nextBlink = now + (Math.random() < .18 ? 160 : rnd(1800, 6000)); } }
      }
      hopV += (-hop * 240 - hopV * 14) * dt; hop += hopV * dt;
      // efectos: bucles del gesto/acción + sueltos
      const activos = new Set(bucles);
      sueltos = sueltos.filter(s => s.hasta > now); sueltos.forEach(s => activos.add(s.id));
      const cap = ligero ? 10 : 40;
      activos.forEach(id => {
        const ef = EFECTOS[id]; if (!ef) return;
        if (!ultimo[id] || now - ultimo[id] > ef.cada * (ligero ? 2 : 1)) {
          ultimo[id] = now;
          if (particulas.length < cap) { const pt = ef.crear(ctx); pt.t0 = now; particulas.push(pt); }
        }
      });
      particulas = particulas.filter(pt => { const k = (now - pt.t0) / pt.vida; if (k >= 1) { pt.el.remove(); return false; } pt.mover(pt.el, k, now); return true; });
      if (accionUpd) accionUpd(now, dt);
      if (secuencia) secuencia(now);
    }

    function vaiven(t) {
      const v = (GESTOS[gesto] || {}).vaiven;
      if (v === 'tiembla') return { x: Math.sin(t * 60) * .6, r: 0 };
      if (v === 'tiembla-fuerte') return { x: Math.sin(t * 70) * 1.4, r: Math.sin(t * 50) * 1.2 };
      if (v === 'risa') return { x: 0, r: Math.sin(t * 18) * 4, y: Math.abs(Math.sin(t * 18)) * -2 };
      if (v === 'mareo') return { x: Math.sin(t * 2.2) * 5, r: Math.sin(t * 2.2) * 9 };
      if (v === 'respira') return { x: 0, r: 0, s: Math.sin(t * 1.3) * .015 };
      return { x: 0, r: 0 };
    }

    function dibujar(now) {
      const t = now / 1000, v = vaiven(t);
      const breathe = 1 + (o.majestuoso ? Math.sin(t * 1.1) * .012 : 0) + (v.s || 0);
      const bob = Math.sin(t * (o.majestuoso ? 1.2 : 1.6)) * (o.majestuoso ? 4 : 3) + hop * -18 + (v.y || 0);
      const s = scale * breathe;
      set(E.all, { transform: `translate(${f(100 + v.x)} ${f(110 + bob)}) scale(${f(s)}) rotate(${f(v.r + ctx.groove * 3)}) translate(-100 -110)` });
      set(E.shadow, { rx: f(44 - hop * 10 + Math.sin(t * 1.2) * 2), opacity: f(.5 - hop * .1) });
      if (!ligero) set(E.aura, { opacity: f(P.glow * (.75 + Math.sin(t * 1.4) * .25)), transform: `translate(100 100) scale(${f(.92 + P.glow * .15 + Math.sin(t * 1.4) * .03)}) translate(-100 -100)` });
      else E.aura.setAttribute('opacity', f(P.glow * .6));
      const hx = P.yaw * 7, hy = P.pitch * 5;
      set(E.head, { transform: `translate(${f(hx)} ${f(hy)}) rotate(${f(P.roll)} 100 112)` });
      set(E.spec, { transform: `translate(${f(-P.yaw * 8)} ${f(-P.pitch * 5)}) rotate(-28 74 28)` });
      set(E.body, { transform: `translate(${f(P.yaw * 2.5)} 0) rotate(${f(P.roll * .25)} 100 148)` });
      // hojas: vaivén + aleteo + estirarse (wing)
      const sway = Math.sin(t * (o.majestuoso ? 1.5 : 1.9)) * 5, fl = P.flap * Math.sin(t * 24) * 16, up = P.wing * 28;
      set(E.wingL, { transform: `rotate(${f(-sway - fl - up - P.roll * .4)} 46 74)` });
      set(E.wingR, { transform: `rotate(${f(sway + fl + up - P.roll * .4)} 154 74)` });
      // brazos (escribir en la computadora = typing)
      const ty = ctx.typing * 6;
      set(E.armL, { transform: `rotate(${f(P.armL + ty)} 60 110)` });
      set(E.armR, { transform: `rotate(${f(P.armR - ty)} 140 110)` });
      // visor (falso 3D)
      const vsx = 1 - Math.abs(P.yaw) * .13, vx = 100 + P.yaw * 9, vy = 66 + P.pitch * 4;
      const vt = `translate(${f(vx)} ${f(vy)}) scale(${f(vsx)} 1) translate(-100 -66)`;
      set(E.visorRect, { transform: vt }); set(E.visorClip, { transform: vt });
      set(E.glare, { transform: `translate(${f(-P.yaw * 14)} 0)` });
      E.screenGlow.setAttribute('opacity', f(ctx.screen * (.12 + Math.sin(t * 3) * .03)));
      E.blushL.setAttribute('opacity', f(P.tint * .55)); E.blushR.setAttribute('opacity', f(P.tint * .55));
      set(E.blushL, { cx: f(vx - 28 * vsx), cy: f(vy + 12) }); set(E.blushR, { cx: f(vx + 28 * vsx), cy: f(vy + 12) });
      // ojos
      const gx = P.gx * 10 + P.yaw * 4, gy = P.gy * 6 + P.pitch * 2;
      const wink = (GESTOS[gesto] || {}).guino;
      [['L', -1], ['R', 1]].forEach(([sd, side]) => {
        const near = 1 + side * P.yaw * .14;
        const w = 9.5 * P['sx' + sd] * near, h = 14.5 * P['sy' + sd] * near;
        const cx = vx + side * 19.5 * vsx + gx, cy = vy - 4 + gy;
        ctx.eyeX[sd] = cx; ctx.eyeY = cy;
        const lid = Math.min(1, Math.max(P['lid' + sd], wink && sd === 'R' ? 0 : blink));
        const r = Math.min(w, h) / 2;
        set(E['eye' + sd], { x: f(cx - w / 2), y: f(cy - h / 2), width: f(w), height: f(h), rx: f(r) });
        set(E['halo' + sd], { x: f(cx - w / 2 - 3), y: f(cy - h / 2 - 3), width: f(w + 6), height: f(h + 6), rx: f(r + 3) });
        set(E['lid' + sd], { x: f(cx - w), y: f(cy - h / 2 - 4), width: f(w * 2), height: f(lid * (h + 4)) });
        const hp = P['hap' + sd], ry = h * .6;
        set(E['cut' + sd], { cx: f(cx), cy: f(cy + h * .5 + ry + 2 - hp * (h * .55 + 2)), rx: f(w * 1.05), ry: f(ry), opacity: hp > .02 ? 1 : 0 });
        const bx = cx, by = cy - h / 2 - 5 - (P.bA < 0 ? 1.5 : 0), a = P.bA * side * -1 * Math.PI / 180, dx = Math.cos(a) * 6.5, dy = Math.sin(a) * 6.5;
        set(E['brow' + sd], { d: `M${f(bx - dx)} ${f(by - dy)}L${f(bx + dx)} ${f(by + dy)}`, opacity: f(Math.max(0, P.brow)) });
      });
      // gafas
      E.glasses.setAttribute('opacity', f(P.glasses));
      set(E.gL, { x: f(vx - 34 * vsx), y: f(vy - 12) }); set(E.gR, { x: f(vx + 4 * vsx), y: f(vy - 12) }); set(E.gB, { d: `M${f(vx - 4)} ${f(vy - 6)}h8` });
      // boca
      const mx = vx + P.yaw * 4 + P.gx * 2, my = vy + 15 + P.pitch * 1.5, mw = 7 - P.open * 2.5;
      set(E.mouth, { d: `M${f(mx - mw)} ${f(my)}Q${f(mx)} ${f(my + P.smile * 8)} ${f(mx + mw)} ${f(my)}`, opacity: f(Math.max(0, 1 - P.open * 1.6)) });
      set(E.mouthO, { cx: f(mx), cy: f(my + 1), rx: f(3 + P.open * 2.5), ry: f(Math.max(0, P.open * 6)), opacity: f(Math.min(1, P.open * 2)) });
    }

    let last = performance.now(), raf = 0, vivo = true;
    function frame(now) {
      if (!vivo) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      paso(dt, now); dibujar(now);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    /* ---------- secuencias ---------- */
    function correr(pasos) {
      const t0 = performance.now(); let i = 0;
      return new Promise(fin => {
        secuencia = now => {
          while (i < pasos.length && now - t0 >= pasos[i][0]) { pasos[i][1](); i++; }
          if (i >= pasos.length) { secuencia = null; fin(api); }
        };
      });
    }
    const pon = o => () => Object.assign(T, o);
    function despertar() {
      setAccion(null); gesto = 'dormido'; objetivo();
      return correr([
        [0, pon({ lidL: .7, lidR: 1 })], [250, pon({ lidL: 1 })], [500, pon({ lidL: .55, lidR: .65 })], [720, pon({ lidL: 1, lidR: 1 })],
        [1000, () => { bucles = new Set(); Object.assign(T, { lidL: .4, lidR: .5, pitch: .2, roll: 4 }); }],
        [1400, pon({ lidL: 1, lidR: 1, hapL: 1, hapR: 1, open: 1, pitch: -.45, wing: 1, armL: -30, armR: 30, smile: 0 })],          // bostezo y estirarse
        [2600, pon({ open: 0, wing: 0, armL: 0, armR: 0, hapL: 0, hapR: 0, lidL: .2, lidR: .2, pitch: 0, smile: .3 })],
        [3000, pon({ roll: -10 })], [3200, pon({ roll: 10 })], [3400, pon({ roll: -6 })], [3600, pon({ roll: 0 })],          // sacude la cabeza
        [3800, pon({ gx: -.8, yaw: -.4, lidL: 0, lidR: 0 })], [4400, pon({ gx: .8, yaw: .4 })], [5000, pon({ gx: 0, yaw: 0 })], // mira alrededor
        [5300, () => { setGesto('alegre'); saltar(10); }], [6600, () => setGesto('contento')],
      ]);
    }
    function dormir() {
      setAccion(null);
      return correr([
        [0, () => setGesto('sueno')], [600, pon({ open: .9, hapL: 1, hapR: 1 })], [1800, pon({ open: 0, hapL: 0, hapR: 0 })],
        [2200, pon({ lidL: .95, lidR: .95 })], [2500, pon({ lidL: .7, lidR: .75 })], [2900, () => setGesto('dormido')],
      ]);
    }
    function saludar() {
      return correr([[0, () => { setGesto('alegre'); saltar(6); }], [0, pon({ armR: -55 })],
        ...[150, 450, 750, 1050].map((ms, i) => [ms, pon({ armR: i % 2 ? -55 : -85 })]), [1400, pon({ armR: 0 })], [1500, () => setGesto('contento')]]);
    }
    function enfadarse() {
      return correr([[0, () => setGesto('concentrado')], [500, () => setGesto('enfadado')], [2200, () => setGesto('furioso')]]);
    }

    /* ---------- toque y mantener ---------- */
    let holdT = null, held = false, back = null, antes = 'neutral';
    if (o.interactivo !== false) {
      svg.style.cursor = 'pointer'; svg.style.touchAction = 'none';
      svg.addEventListener('pointerdown', e => { held = false; try { svg.setPointerCapture(e.pointerId); } catch (_) {} holdT = setTimeout(() => { held = true; antes = gesto; setGesto('escucha'); }, 450); });
      svg.addEventListener('pointerup', () => {
        clearTimeout(holdT);
        if (held) { held = false; clearTimeout(back); back = setTimeout(() => setGesto(antes), 900); return; }
        if (gesto === 'dormido' || gesto === 'sueno') { despertar(); return; }
        saltar(); mira = { x: 0, y: 0 }; ultimoMov = performance.now();
        const prev = gesto; setGesto('contento'); T.flap = 1; efecto('chispas', 700);
        clearTimeout(back); back = setTimeout(() => setGesto(prev === 'contento' ? 'neutral' : prev), 1300);
      });
      svg.addEventListener('pointercancel', () => clearTimeout(holdT));
    }

    const api = {
      gesto: setGesto, accion: setAccion, efecto, despertar, dormir, saludar, enfadarse, saltar: f => (saltar(f), api),
      hablar: on => { hablar = !!on; return api; },
      mirar: (x, y) => { mira = { x, y }; ultimoMov = performance.now(); return api; },
      opcion: (k, v) => { o[k] = v; return api; },
      get estado() { return { gesto, accion }; },
      svg: () => svg,
      destruir() { vivo = false; cancelAnimationFrame(raf); removeEventListener('pointermove', onMove); contenedor.innerHTML = ''; },
    };
    objetivo();
    return api;
  }

  /* ======================================================================================
     7. Estados del panel → gesto + acción (sugerencia; cada app decide)
     ====================================================================================== */
  const ESTADOS = {
    ok: { gesto: 'contento' }, aviso: { gesto: 'preocupado' }, error: { gesto: 'enfadado' }, caido: { gesto: 'furioso' },
    noche: { gesto: 'dormido' }, revisando: { accion: 'buscando' }, desplegando: { accion: 'desplegando' }, compilando: { accion: 'compilando' },
    descargando: { accion: 'descargando' }, subiendo: { accion: 'subiendo' }, sincronizando: { accion: 'sincronizando' }, analizando: { accion: 'analizando' },
    trabajando: { accion: 'trabajando' }, leyendo: { accion: 'leyendo' }, esperando: { accion: 'esperando' }, grabando: { accion: 'grabando' },
    hablando: { accion: 'hablando' }, celebrando: { accion: 'celebrando' }, pensando: { gesto: 'piensa' }, escuchando: { gesto: 'escucha' },
  };

  root.YayenVivo = {
    crear,
    catalogo: () => ({
      gestos: Object.entries(GESTOS).map(([id, g]) => ({ id, nombre: g.nombre, efectos: g.fx || [] })),
      acciones: Object.entries(ACCIONES).map(([id, a]) => ({ id, nombre: a.nombre })),
      efectos: Object.entries(EFECTOS).map(([id, e]) => ({ id, nombre: e.nombre })),
      secuencias: ['despertar', 'dormir', 'saludar', 'enfadarse'],
      estados: ESTADOS,
    }),
    // Para ampliar el catálogo sin tocar este archivo:
    registrarGesto: (id, def) => { GESTOS[id] = def; },
    registrarEfecto: (id, def) => { EFECTOS[id] = def; },
    registrarAccion: (id, def) => { ACCIONES[id] = def; },
  };
})(typeof window !== 'undefined' ? window : this);
