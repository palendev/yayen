/*! Yayen · asistente con personaje para paneles y dashboards · MIT · https://github.com/palendev/yayen
 *
 *   <link rel="stylesheet" href="yayen.css">
 *   <script src="yayen.js"></script>
 *   const yy = Yayen.mount(document.querySelector('#yayen'), {
 *     status: () => ({ level: 'ok', title: 'Todo en orden', text: 'Todo tranquilo por aquí.' }),
 *     options: [{ id: 'news', label: '¿Qué hay de nuevo?' }],
 *     answer: async id => ({ title: '¡Todo bien!', text: 'Todo está bien. Todo en orden.' }),
 *   });
 *
 * Sin dependencias ni build. Ver README.md y docs/INTEGRAR.md.
 */
(function (root) {
  'use strict';

  /* Iconos (24×24, trazo) para las opciones. Puedes pasar los tuyos como cadena SVG. */
  const p = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICONS = {
    refresh: p('<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v5h-5"/>'),
    bell: p('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>'),
    server: p('<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01M11 7.5h6M11 16.5h6"/>'),
    eyeOff: p('<path d="m3 3 18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.2 3.8M6.2 6.2C3.5 8 2 12 2 12s3.5 6 10 6c1 0 2-.2 2.9-.5"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
    file: p('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6M9 9h2"/>'),
    users: p('<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'),
    moon: p('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
    speaker: p('<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>'),
    send: p('<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>'),
    star: p('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
  };

  /* ---------- el personaje (SVG 200×200): dos hojas, visor, cuerpo con rayas; caras por data-face ---------- */
  function svg(n) {
    const W = '#f5f5f7';
    const eye = (d, cls) => `<g class="${cls}" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="${d}" stroke="#8ee8ff" stroke-opacity=".22" stroke-width="12"/><path d="${d}" stroke="${W}" stroke-width="5.5"/></g>`;
    const star = (x, y, r, c, cls) => `<path class="yy-star ${cls}" fill="${c}" d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z"/>`;
    const id = s => `yy${n}-${s}`;
    let stripes = '';
    for (let k = -4; k <= 4; k++) stripes += `<rect x="${100 + k * 18 - 5.5}" y="90" width="11" height="120" fill="url(#${id(k % 2 ? 'cy' : 'pu')})"/>`;
    return `<svg viewBox="0 0 200 200" aria-hidden="true"><defs>
      <radialGradient id="${id('glow')}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#8a2be2" stop-opacity=".5"/><stop offset="1" stop-color="#8a2be2" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id('head')}" cx="34%" cy="26%" r="80%"><stop offset="0" stop-color="#4c4566"/><stop offset=".42" stop-color="#1c1928"/><stop offset="1" stop-color="#08070c"/></radialGradient>
      <radialGradient id="${id('spec')}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id('rim')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2fb6ff"/><stop offset="1" stop-color="#a35cff"/></linearGradient>
      <linearGradient id="${id('visor')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f0d1c"/><stop offset=".7" stop-color="#030308"/><stop offset="1" stop-color="#0a1230"/></linearGradient>
      <clipPath id="${id('vclip')}"><rect x="60" y="40" width="80" height="52" rx="22"/></clipPath>
      <linearGradient id="${id('wing')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c8f6ff"/><stop offset=".35" stop-color="#5fd0ff"/><stop offset="1" stop-color="#1f62ff"/></linearGradient>
      <linearGradient id="${id('arm')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d3854"/><stop offset="1" stop-color="#121019"/></linearGradient>
      <linearGradient id="${id('pu')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfa6ff"/><stop offset="1" stop-color="#7a3df0"/></linearGradient>
      <linearGradient id="${id('cy')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9af0ff"/><stop offset="1" stop-color="#1f8cff"/></linearGradient>
      <radialGradient id="${id('ball')}" cx="34%" cy="28%" r="78%"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".32" stop-color="#fff" stop-opacity="0"/><stop offset=".72" stop-color="#000" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity=".65"/></radialGradient>
      <clipPath id="${id('bclip')}"><circle cx="100" cy="148" r="33"/></clipPath>
    </defs>
    <circle class="yy-glow" cx="100" cy="100" r="96" fill="url(#${id('glow')})"/>
    <ellipse class="yy-shadow" cx="100" cy="186" rx="44" ry="6"/>
    <g class="yy-float">
      <g class="yy-wing"><g id="${id('wingref')}" transform="translate(30 62) rotate(-28)">
        <path d="M0-38C15-26 21-5 17 15C14 30 5 39 0 39C-7 35-17 23-18 4C-19-14-11-29 0-38Z" fill="url(#${id('wing')})" stroke="#bff3ff" stroke-opacity=".7" stroke-width="1.4"/>
        <g stroke="#e6fbff" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round" fill="none">
          <path d="M0-30C2-8 2 14 0 33"/><path d="M-13-8L0 2"/><path d="M-15 8L0 17"/><path d="M-11 23L0 29"/><path d="M12-12L1-3"/><path d="M14 4L1 12"/></g>
        <path d="M-6-30C-13-20-15-6-14 6" stroke="#fff" stroke-opacity=".6" stroke-width="2.5" stroke-linecap="round" fill="none"/></g></g>
      <g class="yy-wing yy-wing-r"><use href="#${id('wingref')}" transform="translate(200 0) scale(-1 1)"/></g>
      <ellipse cx="50" cy="113" rx="16" ry="8" transform="rotate(30 50 113)" fill="url(#${id('arm')})" stroke="#6a5f92" stroke-width="1.4"/>
      <ellipse cx="150" cy="113" rx="16" ry="8" transform="rotate(-30 150 113)" fill="url(#${id('arm')})" stroke="#6a5f92" stroke-width="1.4"/>
      <circle cx="100" cy="148" r="34" fill="#15121e"/>
      <g clip-path="url(#${id('bclip')})"><g transform="rotate(-42 100 148)">${stripes}</g><circle cx="100" cy="148" r="33" fill="url(#${id('ball')})"/></g>
      <circle cx="100" cy="148" r="33.5" fill="none" stroke="#2c2840" stroke-width="1.5"/>
      <ellipse cx="86" cy="130" rx="9" ry="4.5" transform="rotate(-35 86 130)" fill="#fff" opacity=".35"/>
      <circle cx="100" cy="66" r="54" fill="url(#${id('head')})"/>
      <circle cx="100" cy="66" r="53.2" fill="none" stroke="url(#${id('rim')})" stroke-opacity=".5" stroke-width="1.6"/>
      <ellipse cx="74" cy="28" rx="20" ry="9" transform="rotate(-28 74 28)" fill="url(#${id('spec')})"/>
      <rect x="60" y="40" width="80" height="52" rx="22" fill="url(#${id('visor')})" stroke="#2e2848" stroke-width="1.6"/>
      <g clip-path="url(#${id('vclip')})" fill="#fff"><path d="M70 92L96 40H108L82 92Z" opacity=".05"/><path d="M88 92L114 40H118L92 92Z" opacity=".04"/>
        <rect x="60" y="84" width="80" height="8" fill="#2f7bff" opacity=".12"/></g>
      <g class="yy-face">
        ${eye('M73 68Q81 56 89 68M111 68Q119 56 127 68', 'yy-e-happy')}
        ${eye('M73 62Q81 70 89 62M111 62Q119 70 127 62', 'yy-e-closed')}
        <g class="yy-e-open"><rect x="76" y="56" width="9" height="14" rx="4.5" fill="${W}"/><rect x="115" y="56" width="9" height="14" rx="4.5" fill="${W}"/>
          <rect x="78" y="58" width="3" height="4" rx="1.5" fill="#0a0812" opacity=".5"/><rect x="117" y="58" width="3" height="4" rx="1.5" fill="#0a0812" opacity=".5"/></g>
        <g class="yy-e-worry"><rect x="77" y="60" width="8" height="10" rx="4" fill="${W}"/><rect x="115" y="60" width="8" height="10" rx="4" fill="${W}"/>
          <path d="M71 51L87 56M129 51L113 56" stroke="${W}" stroke-width="4.5" stroke-linecap="round"/></g>
        <g class="yy-glasses"><rect x="66" y="54" width="30" height="16" rx="6" fill="#120a20" stroke="url(#${id('rim')})" stroke-width="2.5"/><rect x="104" y="54" width="30" height="16" rx="6" fill="#120a20" stroke="url(#${id('rim')})" stroke-width="2.5"/>
          <path d="M96 60h8" stroke="#a35cff" stroke-width="2.5"/><path d="M71 58h8" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/></g>
        ${eye('M93 79Q100 86 107 79', 'yy-m-smile')}${eye('M93 82H107', 'yy-m-flat')}${eye('M93 84Q100 78 107 84', 'yy-m-frown')}
        <g class="yy-m-o"><ellipse cx="100" cy="81" rx="4.5" ry="5" fill="${W}"/></g>
        <g class="yy-m-grin"><path d="M90 77Q100 91 110 77Z" fill="${W}" stroke="${W}" stroke-width="2" stroke-linejoin="round"/></g>
        <path class="yy-sweat" d="M150 86C146 92 146 96 150 97C154 96 154 92 150 86Z" fill="#7cc8ff"/></g>
      ${star(22, 16, 8, '#5fd0ff', 'yy-s1')}${star(176, 18, 8, '#b07aff', 'yy-s2')}${star(188, 42, 4, '#e2c8ff', 'yy-s3')}
      <g class="yy-zzz"><text x="160" y="40">z</text><text x="172" y="24">z</text></g>
    </g></svg>`;
  }

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const store = {
    get(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (_) { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* sin almacenamiento */ } },
  };
  const SPOTS = { // posiciones de hasta 7 opciones alrededor de Yayen (unidades de diseño)
    full: { w: 1280, h: 400, cy: 190, rx: 320, ry: 150, p: [[-290, -95], [-330, 0], [-290, 95], [0, 150], [290, 95], [330, 0], [290, -95]] },
    compact: { w: 560, h: 440, cy: 232, rx: 205, ry: 160, p: [[-185, -105], [-210, 0], [-185, 105], [0, 155], [185, 105], [210, 0], [185, -105]] },
  };
  const ORDER = [0, 6, 1, 5, 2, 4, 3]; // con menos de 7, se reparten simétricas
  let instances = 0;

  function mount(el, cfg = {}) {
    const n = ++instances;
    const o = Object.assign({
      name: 'Yayen',
      status: () => ({ level: 'ok', title: 'Todo en orden', text: '' }),
      options: [],
      answer: async () => ({ title: '', text: '' }),
      onNavigate: null,
      voice: { url: null, browser: true },
      hermes: { url: null, headers: {} },
      holdMs: 450,
      idleCloseMs: 45000,
      lite: 'auto',
      rotateMs: 9000,
    }, cfg);
    const S = { menu: false, temp: null, target: null, voice: store.get('yayen.voz', true), line: 0 };
    const lite = o.lite === 'auto' ? (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency || 4) <= 2 : !!o.lite;
    document.documentElement.classList.toggle('yy-lite', !!lite);

    /* ---------- tarjeta ---------- */
    el.classList.add('yy-hero');
    el.innerHTML = `<div class="yy-wrap"><div class="yy" role="button" tabindex="0" aria-label="${esc(o.name)}: toca para ver opciones, mantén pulsado para hablar">${svg(`${n}a`)}</div><span class="yy-badge ok">✓</span></div>
      <button class="yy-say" type="button"><span class="yy-who">${esc(o.name)}</span><span class="yy-bub"><b data-k="t"></b><span data-k="p"></span></span></button>`;
    const heroYy = el.querySelector('.yy');

    /* ---------- capa de opciones ---------- */
    const opts = o.options.slice(0, 7);
    const ov = document.createElement('div');
    ov.className = 'yy-ov'; ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML = `<div class="yy-stage">
      <svg class="yy-orbit" preserveAspectRatio="none"><defs><linearGradient id="yy-orbit-g${n}" x1="0" x2="1"><stop offset="0" stop-color="#2fb6ff"/><stop offset="1" stop-color="#a35cff"/></linearGradient></defs><ellipse style="stroke:url(#yy-orbit-g${n})"/></svg>
      <div class="yy-cloud" role="status" aria-live="polite">
        <span class="yy-via"><i></i><span data-k="via">Local</span></span>
        <span class="yy-puffs" aria-hidden="true"><i class="p1"></i><i class="p2"></i><i class="p3"></i><i class="p4"></i><i class="p5"></i><i class="p6"></i><i class="p7"></i><i class="t1"></i><i class="t2"></i><i class="t3"></i></span>
        <b><span data-k="t"></span><span class="yy-dots"><i></i><i></i><i></i></span></b>
        <span class="yy-heard" data-k="heard" hidden></span>
        <p data-k="p"></p>
        <form class="yy-ask" data-k="ask" hidden><input data-k="q" type="text" autocomplete="off" placeholder="Escríbele a Hermes…" aria-label="Mensaje para Hermes"><button type="submit" aria-label="Enviar">${ICONS.send}</button></form>
      </div>
      <div class="yy yy-big" role="button" tabindex="0" aria-label="${esc(o.name)}">${svg(`${n}b`)}</div>
      <div class="yy-opts">${opts.map((x, i) => `<button class="yy-opt" type="button" data-opt="${esc(x.id)}"><i>${x.icon && x.icon.startsWith('<') ? x.icon : ICONS[x.icon] || ICONS.star}<s></s></i><span>${esc(x.label)}</span></button>`).join('')}</div>
      <button class="yy-voice" type="button" aria-pressed="true" aria-label="Voz">${ICONS.speaker}<span>Voz</span></button>
    </div>`;
    document.body.appendChild(ov);
    const stage = ov.querySelector('.yy-stage'), big = ov.querySelector('.yy-big');
    const q = k => ov.querySelector(`[data-k="${k}"]`);

    function layout() {
      const W = innerWidth, H = innerHeight;
      const L = SPOTS[W / H < 2 ? 'compact' : 'full'], k = Math.min(W / L.w, H / L.h), cx = L.w / 2;
      Object.assign(stage.style, { width: `${L.w}px`, height: `${L.h}px`, transform: `translate(${(W - L.w * k) / 2}px, ${(H - L.h * k) / 2}px) scale(${k})` });
      big.style.top = `${L.cy}px`;
      const orbit = ov.querySelector('.yy-orbit'), e = orbit.querySelector('ellipse');
      orbit.setAttribute('viewBox', `0 0 ${L.w} ${L.h}`);
      e.setAttribute('cx', cx); e.setAttribute('cy', L.cy); e.setAttribute('rx', L.rx); e.setAttribute('ry', L.ry);
      const slots = ORDER.slice(0, opts.length).sort((a, b) => a - b);
      [...ov.querySelectorAll('.yy-opt')].forEach((b, i) => {
        const [dx, dy] = L.p[slots[i]];
        b.classList.toggle('l', dx < 0); b.classList.toggle('r', dx > 0); b.classList.toggle('b', dx === 0);
        Object.assign(b.style, { left: `${cx + dx}px`, top: `${L.cy + dy}px`, transitionDelay: S.menu ? `${i * 45}ms` : '0ms' });
        b.style.setProperty('--fx', `${-dx}px`); b.style.setProperty('--fy', `${-dy}px`); b.style.setProperty('--d', `${i * 45}ms`);
      });
    }
    addEventListener('resize', layout);

    /* ---------- cara y tarjeta ---------- */
    const allYy = () => [heroYy, big];
    function current() {
      const st = Object.assign({ level: 'ok', title: '', text: '' }, o.status() || {});
      const lines = Array.isArray(st.text) ? st.text : [st.text];
      return Object.assign(st, { text: lines[S.line % lines.length] || '' });
    }
    function paint() {
      const st = current();
      const face = S.temp || st.face || { error: 'error', warn: 'warn', sleep: 'sleep', ok: 'ok' }[st.level] || 'ok';
      allYy().forEach(y => { y.dataset.face = face; });
      const badge = el.querySelector('.yy-badge');
      const b = { error: ['error', '!'], warn: ['warn', '!'], sleep: ['night', 'z'], ok: ['ok', '✓'] }[st.level] || ['ok', '✓'];
      badge.className = `yy-badge ${b[0]}`; badge.textContent = b[1];
      el.querySelector('[data-k="t"]').textContent = st.title;
      el.querySelector('[data-k="p"]').textContent = st.text;
      el.classList.toggle('night', st.level === 'sleep');
      S.heroTarget = st.go || null;
    }
    const rotate = setInterval(() => { if (!S.menu) { S.line++; paint(); } }, o.rotateMs);
    function bump(cls) { allYy().forEach(y => { y.classList.remove(cls); void y.getBoundingClientRect(); y.classList.add(cls); setTimeout(() => y.classList.remove(cls), 1200); }); }

    /* ---------- voz: primero la del servidor (Piper), si no la del navegador ---------- */
    const synth = root.speechSynthesis;
    const talking = on => allYy().forEach(y => y.classList.toggle('talk', on));
    let seq = 0, audio = null, serverVoice = !!(o.voice && o.voice.url);
    function stopVoice() { seq++; if (audio) { audio.pause(); audio = null; } if (synth) synth.cancel(); talking(false); }
    function browserSpeak(text) {
      if (!synth || o.voice?.browser === false) return;
      try {
        const u = new SpeechSynthesisUtterance(text.replace(/(\d+)\s*%/g, '$1 por ciento'));
        const vs = synth.getVoices(), v = vs.find(x => /^es[-_](DO|MX|US|419)/i.test(x.lang)) || vs.find(x => /^es/i.test(x.lang));
        if (v) u.voice = v;
        u.lang = v?.lang || 'es-ES'; u.rate = 1; u.pitch = 1.15;
        u.onstart = () => talking(true); u.onend = u.onerror = () => talking(false);
        synth.speak(u);
      } catch (_) { talking(false); }
    }
    async function speak(text) {
      if (!S.voice || !text) return;
      stopVoice();
      const my = seq;
      if (serverVoice) {
        try {
          const r = await fetch(o.voice.url, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, o.voice.headers || {}), body: JSON.stringify({ text }) });
          if (my !== seq) return;
          if (r.ok) {
            const url = URL.createObjectURL(await r.blob());
            if (my !== seq) return URL.revokeObjectURL(url);
            audio = new Audio(url);
            audio.onplaying = () => talking(true);
            audio.onended = audio.onerror = () => { talking(false); URL.revokeObjectURL(url); };
            return await audio.play();
          }
          if (r.status === 503) { serverVoice = false; setTimeout(() => { serverVoice = true; }, 300000); }
        } catch (_) { if (my !== seq) return; }
      }
      browserSpeak(text);
    }
    const vbtn = ov.querySelector('.yy-voice');
    const syncVoice = () => { vbtn.setAttribute('aria-pressed', String(S.voice)); vbtn.classList.toggle('off', !S.voice); };
    vbtn.addEventListener('click', () => { S.voice = !S.voice; store.set('yayen.voz', S.voice); if (!S.voice) stopVoice(); syncVoice(); });
    syncVoice();

    /* ---------- nube ---------- */
    let timer = null, idle = null;
    const later = (fn, ms) => { clearTimeout(timer); timer = setTimeout(fn, ms); };
    const touchIdle = () => { clearTimeout(idle); idle = setTimeout(close, o.idleCloseMs); };
    const cloud = (on, thinking = false) => { ov.classList.toggle('answer', on); ov.classList.toggle('thinking', on && thinking); };
    const via = hermes => { ov.classList.toggle('hermes', hermes); q('via').textContent = hermes ? 'Hermes' : 'Local'; };
    function say(r, asAnswer = true) {
      q('t').textContent = r.title || '';
      q('p').textContent = r.text || '';
      S.target = r.go ?? null;
      ov.classList.toggle('linked', S.target != null);
      if (asAnswer) { cloud(true); speak(r.text || r.title); }
    }

    function open(hermes) {
      S.menu = true;
      ov.classList.add('on'); ov.setAttribute('aria-hidden', 'false');
      q('heard').hidden = true; q('ask').hidden = true;
      layout(); touchIdle();
      if (hermes) return hermesMode();
      via(false); cloud(false);
      S.temp = 'happy'; paint(); bump('hop'); bump('flap');
      say({ title: pick(['¿Qué necesitas?', 'Dime.', '¿En qué te ayudo?']), text: o.hermes?.url ? 'Toca una opción, o mantenme pulsado para hablar con Hermes.' : 'Toca una opción.' }, false);
      later(() => { S.temp = null; paint(); }, 1300);
    }
    function close() {
      S.menu = false; S.temp = null; S.target = null;
      clearTimeout(timer); clearTimeout(idle); stopVoice();
      ov.classList.remove('on', 'answer', 'thinking', 'hermes', 'linked');
      ov.setAttribute('aria-hidden', 'true');
      layout(); paint();
    }
    async function choose(id) {
      touchIdle(); via(false); q('heard').hidden = true; q('ask').hidden = true;
      S.temp = 'think'; paint(); cloud(true, true); say({ title: pick(['Déjame ver', 'Un segundo', 'A ver']) }, false);
      const started = Date.now();
      let r;
      try { r = await o.answer(id, api); } catch (err) { r = { title: 'No pude', text: String(err.message || err), face: 'warn' }; }
      await new Promise(ok => setTimeout(ok, Math.max(0, 900 - (Date.now() - started))));
      if (!S.menu) return;
      S.temp = r && r.face === 'happy' ? 'happy' : null;
      cloud(true); say(r || { title: '', text: '' }); paint();
      if (S.temp) { bump('hop'); later(() => { S.temp = null; paint(); }, 1400); }
    }

    /* ---------- Hermes (mantener pulsado): escribir ahora; voz cuando haya oído local ---------- */
    function hermesMode() {
      via(true); cloud(true); S.temp = 'listen'; paint(); bump('flap');
      if (!o.hermes?.url) {
        say({ title: 'Todavía no hablo con Hermes', text: 'Cuando lo conectes (docs/HERMES.md), mantenme pulsado y háblale. Por ahora, toca una opción.' });
        return later(() => { S.temp = null; paint(); }, 1600);
      }
      say({ title: 'Te escucho', text: '¿Qué le digo a Hermes?' }, false);
      q('ask').hidden = false; setTimeout(() => q('q').focus(), 50);
    }
    q('ask').addEventListener('submit', async e => {
      e.preventDefault();
      const text = q('q').value.trim();
      if (!text) return;
      q('q').value = ''; q('ask').hidden = true; touchIdle();
      q('heard').hidden = false; q('heard').textContent = `«${text}»`;
      S.temp = 'think'; paint(); cloud(true, true); say({ title: 'Hermes está pensando' }, false);
      let r;
      try {
        const res = await fetch(o.hermes.url, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, o.hermes.headers || {}), body: JSON.stringify({ text }) });
        const data = await res.json().catch(() => ({}));
        r = res.ok ? { title: '', text: data.reply || 'Hermes no dijo nada.' } : { title: 'Hermes no respondió', text: data.error || `Error ${res.status}`, face: 'warn' };
      } catch (err) { r = { title: 'Hermes no respondió', text: 'No pude llegar al servidor.', face: 'warn' }; }
      if (!S.menu) return;
      S.temp = null; cloud(true); say(r); paint();
    });

    /* ---------- gestos: toque abre/cierra, mantener = Hermes ---------- */
    function press(target, onTap, onHold) {
      let t = null, long = false;
      target.addEventListener('pointerdown', e => { long = false; try { target.setPointerCapture(e.pointerId); } catch (_) {} t = setTimeout(() => { long = true; onHold(); }, o.holdMs); });
      target.addEventListener('pointerup', () => clearTimeout(t));
      target.addEventListener('pointercancel', () => clearTimeout(t));
      target.addEventListener('click', e => { e.stopPropagation(); if (!long) onTap(); });
      target.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); } });
      target.addEventListener('contextmenu', e => e.preventDefault());
    }
    press(heroYy, () => open(false), () => open(true));
    press(big, close, () => { touchIdle(); hermesMode(); });
    ov.addEventListener('click', e => { if (e.target === ov || e.target === stage) close(); });
    ov.querySelector('.yy-opts').addEventListener('click', e => { const b = e.target.closest('[data-opt]'); if (b) choose(b.dataset.opt); });
    ov.querySelector('.yy-cloud').addEventListener('click', e => {
      if (e.target.closest('.yy-ask')) return;
      const go = S.target; close(); if (go != null && o.onNavigate) o.onNavigate(go);
    });
    el.querySelector('.yy-say').addEventListener('click', () => { if (S.heroTarget != null && o.onNavigate) o.onNavigate(S.heroTarget); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.menu) close(); });

    const api = {
      update: paint,
      open: () => open(false), close, speak, say: r => { if (!S.menu) open(false); say(r); },
      destroy() { clearInterval(rotate); close(); ov.remove(); el.innerHTML = ''; },
    };
    layout(); paint();
    return api;
  }

  root.Yayen = { mount, icons: ICONS, svg: n => svg(`x${++instances}${n || ''}`) };
})(window);
