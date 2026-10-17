/* Yayen: el asistente del Inicio (prototipo aprobado: https://claude.ai/artifact/8Zkf8FcLQExVfrLHCiu7qV).
   - En la tarjeta de estado: personaje con dos hojas y su globo, con la cara y el mensaje según Dash.overall().
   - Un toque: abre sus opciones en órbita y responde EN LOCAL con los datos de /api/status, en una nube
     blanca de pensamiento y en voz alta (voz del navegador; la voz propia con Piper llega después).
   - Mantener pulsado: hablar con Hermes. Hasta que Hermes esté enlazado lo dice y no escucha nada.
   - Modo ligero automático en equipos con poca RAM o pocos núcleos (la Wyse): sin animaciones continuas.
   No guarda nada en el servidor; la preferencia de voz vive en este navegador. */
(function () {
  'use strict';
  const { esc, ago } = Dash.util;
  const I = Dash.icons;
  const HOLD_MS = 450;
  const store = {
    get(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (_) { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* sin almacenamiento: solo esta sesión */ } },
  };
  const S = { menu: false, hermes: false, temp: null, rest: false, line: 0, voice: store.get('yayen.voz', true), target: null };
  const lite = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency || 4) <= 2;
  document.body.classList.toggle('yy-lite', !!lite);

  /* ---------- el personaje (SVG 200×200) ---------- */
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

  /* ---------- datos → qué dice ---------- */
  function isNight() {
    const h = new Date().getHours(), { nightFrom: a, nightTo: b } = Dash.settings;
    return a > b ? h >= a || h < b : h >= a && h < b;
  }
  const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; };
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

  function mood(d) {
    const o = Dash.overall(d);
    const sleeping = S.rest || (o.level === 'ok' && Dash.settings.nightDim && isNight());
    const face = S.temp || (Dash.settings.recording ? 'cool' : o.level === 'error' ? 'error' : o.level === 'warn' ? 'warn' : sleeping ? 'sleep' : 'ok');
    const badge = o.level === 'error' ? ['error', '!'] : o.level === 'warn' ? ['warn', '!'] : sleeping ? ['night', 'z'] : ['ok', '✓'];
    return { o, face, badge, sleeping };
  }

  /* Habla como una persona, no como un informe: frases cortas, variadas y con lo importante primero. */
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const lower = s => String(s || '').charAt(0).toLowerCase() + String(s || '').slice(1);
  const issueText = x => `${x.name} está ${lower(x.end || x.text || 'con problemas')}`;
  const nodesOf = d => (d.integrations.proxmox?.data?.nodes || []).filter(n => n.status === 'online' && n.maxmem);
  const busiest = d => nodesOf(d).sort((a, b) => b.mem / b.maxmem - a.mem / a.maxmem)[0];

  function okLines(d) {
    const lines = [`${greet()}, Jordan. Todo tranquilo por aquí.`];
    const pages = d.checks.filter(c => c.kind === 'page'), apis = d.checks.filter(c => c.kind === 'api');
    if (pages.length) lines.push(`Las ${pages.length} páginas están arriba${apis.length ? ' y las APIs responden' : ''}. Todo en orden.`);
    const yt = d.integrations.youtube?.data;
    if (yt?.subscribers != null) lines.push(`JordanTechRD ya va por ${Dash.util.number(yt.subscribers)} suscriptores. ¡Vamos bien!`);
    const p = d.integrations.palendev?.data;
    if (p?.last_news) lines.push(`palen.dev publicó ${ago(p.last_news)}. Las noticias van al día.`);
    const top = busiest(d);
    if (top) lines.push(`${top.node} anda al ${pct(top.mem, top.maxmem)} % de RAM. Le estoy echando un ojo.`);
    if (!Dash.settings.recording) lines.push('¿Vas a grabar? Tócame y escondo las IPs.');
    return lines;
  }

  function heroText(d, m) {
    if (Dash.settings.recording) return ['Grabando', 'Tengo las gafas puestas: no se ve ni una IP.'];
    const first = m.o.list[0];
    if (m.o.level !== 'ok') return [m.o.errors ? `Ojo, ${plural(m.o.errors, 'problema', 'problemas')}` : plural(m.o.warns, 'aviso', 'avisos'),
      `${issueText(first)}. Toca aquí y te llevo.`];
    if (m.sleeping) return ['Descansando', 'Ya es tarde. Bajé el brillo, pero sigo pendiente.'];
    const lines = okLines(d);
    return ['Todo en orden', lines[S.line % lines.length]];
  }

  /* ---------- respuestas de las opciones (solo datos locales) ---------- */
  const answer = {
    // «¿Qué hay de nuevo?»: primero lo que falla; si no hay nada, «todo bien» y lo más interesante del día.
    what(d) {
      const o = Dash.overall(d), first = o.list[0];
      if (first) {
        const more = o.list.length > 1 ? ` Y hay ${plural(o.list.length - 1, 'cosa más', 'cosas más')} en la lista.` : ' Lo demás va bien.';
        return { t: o.errors ? 'Ojo con esto' : 'Un aviso', p: `Mira, Jordan: ${issueText(first)}.${more} Toca la nube y te llevo.`, go: first.go, face: first.level === 'error' ? 'error' : 'warn' };
      }
      const news = [];
      const yt = d.integrations.youtube?.data;
      if (yt?.new_comments) news.push(`Tienes ${plural(yt.new_comments, 'comentario nuevo', 'comentarios nuevos')} en YouTube.`);
      const back = d.events.find(e => e.level === 'ok' && Date.now() / 1000 - e.ts < 3 * 3600);
      if (back) news.push(`${back.service} tuvo un tropiezo hace un rato, pero ya volvió.`);
      const p = d.integrations.palendev?.data;
      if (p?.last_news) news.push(`La última noticia de palen.dev salió ${ago(p.last_news)}.`);
      const bk = d.integrations.proxmox?.data?.latest_backup;
      if (bk?.status === 'OK') news.push(`La última copia terminó bien, ${ago(bk.starttime)}.`);
      const open = pick(['Todo está bien, Jordan. Todo en orden.', 'Todo tranquilo, Jordan. Nada que reportar.', 'Todo bien por aquí, Jordan. Todo en orden.']);
      return { t: pick(['¡Todo bien!', 'Nada grave', 'Tranquilo']), p: [open, ...news.slice(0, 2)].join(' '), face: 'happy' };
    },
    srv(d) {
      const pve = d.integrations.proxmox?.data;
      if (!pve) return { t: 'Servidores', p: `Ahora mismo no llego a Proxmox: ${lower(d.integrations.proxmox?.error || 'no está configurado')}.`, face: 'warn' };
      const down = pve.nodes.filter(n => n.status !== 'online'), top = busiest(d);
      const on = pve.guests.filter(g => g.status === 'running').length, off = pve.guests.length - on;
      const parts = [down.length ? `Ojo: ${down.map(n => n.node).join(' y ')} no responde.` : pick(['Los servidores van bien.', 'Los nodos están tranquilos.'])];
      if (top) parts.push(pct(top.mem, top.maxmem) >= 85 ? `${top.node} anda alto de memoria, al ${pct(top.mem, top.maxmem)} %; lo vigilo.` : `El más cargado es ${top.node}, con ${pct(top.mem, top.maxmem)} % de RAM.`);
      parts.push(off ? `Tienes ${on} máquinas encendidas y ${off} apagadas.` : `Las ${on} máquinas están encendidas.`);
      return { t: 'Servidores', p: parts.join(' ') + ' Toca la nube y te llevo.', go: ['proxmox'], face: down.length ? 'error' : null };
    },
    redes(d) {
      const yt = d.integrations.youtube?.data, acc = d.integrations.social?.data?.accounts || [];
      const parts = [];
      if (yt) parts.push(`En YouTube vas por ${Dash.util.number(yt.subscribers)} suscriptores${yt.new_comments ? ` y hoy te dejaron ${plural(yt.new_comments, 'comentario', 'comentarios')}` : ''}.`);
      acc.filter(a => a.connected).forEach(a => parts.push(`En ${a.network_name}, ${a.handle} tiene ${Dash.util.number(a.followers)} seguidores.`));
      const off = acc.filter(a => !a.connected && !a.pending);
      if (off.length) parts.push(`${[...new Set(off.map(a => a.network_name))].join(' y ')} todavía no ${off.length > 1 ? 'están conectados' : 'está conectado'}.`);
      return { t: 'Redes', p: parts.join(' ') || 'Todavía no tengo ninguna red conectada.', go: ['canal'] };
    },
    news(d) {
      const p = d.integrations.palendev?.data;
      if (!p) return { t: 'palen.dev', p: `No consigo llegar a palen.dev: ${lower(d.integrations.palendev?.error || 'no está configurado')}.`, face: 'warn', go: ['palendev'] };
      const stale = Dash.palenStale ? Dash.palenStale(d) : false, drafts = p.cms?.noticias?.borradores;
      const head = stale ? `Ojo, palen.dev va atrasada: la última noticia salió ${ago(p.last_news)}.` : `palen.dev va al día: la última noticia salió ${p.last_news ? ago(p.last_news) : 'hace poco'}.`;
      return { t: 'palen.dev', p: head + (drafts ? ` Tienes ${plural(drafts, 'borrador esperando', 'borradores esperando')} en el CMS.` : ''), face: stale ? 'warn' : null, go: ['palendev'] };
    },
    summary(d) {
      const o = Dash.overall(d);
      if (o.level === 'ok') return { t: 'Listo', p: pick(['Listo, ya revisé todo. Todo en orden, Jordan.', 'Ya está. Revisé páginas, APIs y servidores, y todo responde.']), face: 'happy' };
      return { t: 'Ya revisé', p: `Ya revisé. Lo más importante: ${issueText(o.list[0])}.${o.list.length > 1 ? ` Hay ${plural(o.list.length - 1, 'cosa más', 'cosas más')}.` : ''} Toca la nube y te llevo.`,
        go: o.list[0].go, face: o.errors ? 'error' : 'warn' };
    },
  };

  /* ---------- voz (navegador por ahora) ---------- */
  const synth = window.speechSynthesis;
  const talking = on => document.querySelectorAll('.yy').forEach(y => y.classList.toggle('talk', on));
  function speak(text) {
    if (!S.voice || !synth) return;
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/·/g, ',').replace(/(\d+)\s*%/g, '$1 por ciento'));
      const voices = synth.getVoices();
      const v = voices.find(x => /^es[-_](DO|MX|US|419)/i.test(x.lang)) || voices.find(x => /^es/i.test(x.lang));
      if (v) u.voice = v;
      u.lang = v?.lang || 'es-ES'; u.rate = 1; u.pitch = 1.15;
      u.onstart = () => talking(true);
      u.onend = u.onerror = () => talking(false);
      synth.speak(u);
    } catch (_) { talking(false); }
  }

  /* ---------- capa de opciones ---------- */
  const OPTS = [
    { id: 'check', label: 'Revisar todo', icon: I.refresh },
    { id: 'what', label: '¿Qué hay de nuevo?', icon: I.bell },
    { id: 'srv', label: 'Servidores', icon: I.server },
    { id: 'rec', label: 'Grabar', icon: I.eyeOff },
    { id: 'news', label: 'palen.dev', icon: I.file },
    { id: 'redes', label: 'Redes', icon: I.users },
    { id: 'rest', label: 'Descansa', icon: I.moon },
  ];
  // Diseño en unidades de la pantalla del rack (1280×400) o de teléfono (560×440); se escala al tamaño real.
  const SPOTS = {
    full: { w: 1280, h: 400, cy: 190, rx: 320, ry: 150, p: [[-290, -95], [-330, 0], [-290, 95], [0, 150], [290, 95], [330, 0], [290, -95]] },
    compact: { w: 560, h: 440, cy: 232, rx: 205, ry: 160, p: [[-185, -105], [-210, 0], [-185, 105], [0, 155], [185, 105], [210, 0], [185, -105]] },
  };
  let ov, stage, idleTimer = null, thinkTimer = null;

  function buildOverlay() {
    ov = document.createElement('div');
    ov.className = 'yy-ov'; ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML = `<div class="yy-stage">
      <svg class="yy-orbit" preserveAspectRatio="none"><defs><linearGradient id="yy-orbit-g" x1="0" x2="1"><stop offset="0" stop-color="#2fb6ff"/><stop offset="1" stop-color="#a35cff"/></linearGradient></defs><ellipse/></svg>
      <div class="yy-cloud" role="status" aria-live="polite">
        <span class="yy-via"><i></i><span data-k="via">Local</span></span>
        <span class="yy-puffs" aria-hidden="true"><i class="p1"></i><i class="p2"></i><i class="p3"></i><i class="p4"></i><i class="p5"></i><i class="p6"></i><i class="p7"></i><i class="t1"></i><i class="t2"></i><i class="t3"></i></span>
        <b><span data-k="t">¿Qué hacemos, Jordan?</span><span class="yy-dots"><i></i><i></i><i></i></span></b>
        <span class="yy-heard" data-k="heard" hidden></span>
        <p data-k="p">Toca una opción.</p>
      </div>
      <div class="yy yy-big" data-k="big" role="button" tabindex="0" aria-label="Yayen">${svg('b')}</div>
      <div class="yy-opts">${OPTS.map((o, i) => `<button class="yy-opt ${i < 3 ? 'l' : i === 3 ? 'b' : 'r'}" type="button" data-opt="${o.id}"><i>${o.icon}<s></s></i><span>${o.label}</span></button>`).join('')}</div>
      <button class="yy-voice" type="button" data-k="voice" aria-pressed="true" aria-label="Voz de Yayen">${I.speaker}<span>Voz</span></button>
    </div>`;
    document.body.appendChild(ov);
    stage = ov.querySelector('.yy-stage');
    const q = k => ov.querySelector(`[data-k="${k}"]`);
    q('voice').addEventListener('click', () => { S.voice = !S.voice; store.set('yayen.voz', S.voice); if (!S.voice && synth) synth.cancel(); syncVoice(); });
    ov.addEventListener('click', e => { if (e.target === ov || e.target === stage) close(); });
    ov.querySelector('.yy-opts').addEventListener('click', e => { const b = e.target.closest('[data-opt]'); if (b) act(b.dataset.opt); });
    ov.querySelector('.yy-cloud').addEventListener('click', () => { const go = S.target; close(); if (go) Dash.go(...go); });
    press(q('big'), close, () => { touchIdle(); hermesHold(); });
    syncVoice();
    window.addEventListener('resize', layout);
  }
  const syncVoice = () => { const b = ov.querySelector('[data-k="voice"]'); b.setAttribute('aria-pressed', String(S.voice)); b.classList.toggle('off', !S.voice); };

  function layout() {
    if (!ov) return;
    const z = parseFloat(document.body.style.zoom) || 1, W = innerWidth / z, H = innerHeight / z;
    const L = SPOTS[W / H < 2 ? 'compact' : 'full'], k = Math.min(W / L.w, H / L.h);
    Object.assign(stage.style, { width: `${L.w}px`, height: `${L.h}px`, transform: `translate(${(W - L.w * k) / 2}px, ${(H - L.h * k) / 2}px) scale(${k})` });
    const cx = L.w / 2;
    ov.querySelector('.yy-big').style.top = `${L.cy}px`;
    const o = ov.querySelector('.yy-orbit'); o.setAttribute('viewBox', `0 0 ${L.w} ${L.h}`);
    const e = o.querySelector('ellipse'); e.setAttribute('cx', cx); e.setAttribute('cy', L.cy); e.setAttribute('rx', L.rx); e.setAttribute('ry', L.ry);
    [...ov.querySelectorAll('.yy-opt')].forEach((b, i) => {
      const [dx, dy] = L.p[i];
      Object.assign(b.style, { left: `${cx + dx}px`, top: `${L.cy + dy}px`, transitionDelay: S.menu ? `${i * 45}ms` : '0ms' });
      b.style.setProperty('--fx', `${-dx}px`); b.style.setProperty('--fy', `${-dy}px`); b.style.setProperty('--d', `${i * 45}ms`);
    });
  }

  const later = (fn, ms) => { clearTimeout(thinkTimer); thinkTimer = setTimeout(fn, ms); };
  function touchIdle() { clearTimeout(idleTimer); idleTimer = setTimeout(close, 45000); }
  function cloud(on, thinking = false) { ov.classList.toggle('answer', on); ov.classList.toggle('thinking', on && thinking); }
  function via(hermes) { ov.classList.toggle('hermes', hermes); ov.querySelector('[data-k="via"]').textContent = hermes ? 'Hermes' : 'Local'; }
  function say(r, asAnswer = true) {
    ov.querySelector('[data-k="t"]').textContent = r.t || '';
    ov.querySelector('[data-k="p"]').textContent = r.p || '';
    S.target = r.go || null;
    ov.classList.toggle('linked', !!S.target);
    if (asAnswer) { cloud(true); speak(r.p || r.t); }
  }
  function bump(cls) {
    document.querySelectorAll('.yy').forEach(y => { y.classList.remove(cls); void y.getBoundingClientRect(); y.classList.add(cls); setTimeout(() => y.classList.remove(cls), 1200); });
  }

  function open(hermes) {
    if (!ov) buildOverlay();
    S.menu = true; S.rest = false;
    ov.classList.add('on'); ov.setAttribute('aria-hidden', 'false');
    ov.querySelector('[data-k="heard"]').hidden = true;
    layout(); touchIdle();
    if (hermes) return hermesHold();
    via(false); cloud(false);
    S.temp = 'happy'; paint(); bump('hop'); bump('flap');
    const o = Dash.data ? Dash.overall(Dash.data) : null;
    say({ t: pick(['¿Qué necesitas, Jordan?', 'Dime, Jordan.', '¿En qué te ayudo?']),
      p: o && o.level === 'error' ? 'Hay algo caído; pregúntame qué hay de nuevo.' : 'Toca una opción, o mantenme pulsado para hablar con Hermes.' }, false);
    later(() => { S.temp = null; paint(); }, 1300);
  }
  function close() {
    if (!ov) return;
    S.menu = false; S.hermes = false; S.temp = null; S.target = null;
    clearTimeout(thinkTimer); clearTimeout(idleTimer);
    if (synth) synth.cancel();
    talking(false);
    ov.classList.remove('on', 'answer', 'thinking', 'hermes', 'linked');
    ov.setAttribute('aria-hidden', 'true');
    layout(); paint();
  }

  function think(then, ms = 1100) {
    via(false); ov.querySelector('[data-k="heard"]').hidden = true;
    S.temp = 'think'; paint(); cloud(true, true); say({ t: pick(['Déjame ver', 'Un segundo', 'A ver']), p: '' }, false);
    later(() => { S.temp = null; cloud(true); const r = then(); if (r) { say(r); if (r.face) { S.temp = r.face === 'happy' ? 'happy' : null; if (r.face === 'happy') { bump('hop'); setTimeout(() => { S.temp = null; paint(); }, 1400); } } } paint(); }, ms);
  }

  function act(id) {
    touchIdle();
    const d = Dash.data;
    if (!d) return say({ t: 'Un momento', p: 'Todavía no me llegan los datos del panel. Dame un segundo.' });
    if (id === 'check') { Dash.emit('check'); return think(() => answer.summary(Dash.data), 2600); }
    if (id === 'rec') {
      const next = !Dash.settings.recording;
      return Promise.resolve(Dash.saveSettings({ recording: next }))
        .then(() => { paint(); say(next ? { t: 'Modo grabación', p: 'Listo, me puse las gafas. Ya no se ve ninguna IP.' } : { t: 'Grabación apagada', p: 'Me quité las gafas; las IPs se ven otra vez.' }); })
        .catch(err => say({ t: 'No pude', p: err.message, face: 'warn' }));
    }
    if (id === 'rest') { close(); S.rest = true; paint(); Dash.toast('Me quedo descansando. Tócame cuando me necesites.'); return; }
    think(() => answer[id](Dash.data));
  }

  /* Mantener pulsado = Hermes. Aún sin enlazar: lo dice y no abre el micrófono. */
  function hermesHold() {
    S.hermes = true; via(true); cloud(true);
    S.temp = 'listen'; paint(); bump('flap');
    const h = Dash.data?.integrations?.hermes;
    say(h?.ok ? { t: 'Te escucho', p: 'Habla y suelta para enviar.' }
      : { t: 'Todavía no hablo con Hermes', p: 'Cuando lo conectemos, mantenme pulsado y háblame; yo se lo paso. Por ahora, toca una opción.' });
    later(() => { S.temp = null; paint(); }, 1600);
  }

  /* Toque corto / pulsación larga sobre un elemento. */
  function press(el, onTap, onHold) {
    let timer = null, long = false;
    el.addEventListener('pointerdown', e => {
      long = false;
      try { el.setPointerCapture(e.pointerId); } catch (_) { /* sin captura */ }
      if (onHold) timer = setTimeout(() => { long = true; onHold(); }, HOLD_MS);
    });
    el.addEventListener('pointerup', () => clearTimeout(timer));
    el.addEventListener('pointercancel', () => clearTimeout(timer));
    el.addEventListener('click', e => { e.stopPropagation(); if (!long) onTap(); });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); } });
  }

  /* ---------- en la tarjeta de Inicio ---------- */
  let hero = null;
  function paint() {
    const d = Dash.data;
    const m = d ? mood(d) : { face: 'think', badge: ['night', '…'], o: { level: 'ok', list: [] } };
    document.querySelectorAll('.yy').forEach(y => { y.dataset.face = m.face; });
    if (!hero) return;
    const badge = hero.querySelector('.yy-badge');
    badge.className = `yy-badge ${m.badge[0]}`; badge.textContent = m.badge[1];
    const [t, p] = d ? heroText(d, m) : ['Conectando…', 'Esperando datos del panel.'];
    hero.querySelector('[data-k="yt"]').textContent = t;
    hero.querySelector('[data-k="yp"]').textContent = p;
    hero.classList.toggle('night', !!m.sleeping);
  }

  Dash.yayen = {
    /* Pinta a Yayen dentro de `el` (la tarjeta de estado del Inicio). */
    mount(el) {
      hero = el;
      el.innerHTML = `<div class="yy-hero">
        <div class="yy-wrap"><div class="yy" role="button" tabindex="0" aria-label="Yayen: toca para ver opciones, mantén pulsado para hablar con Hermes">${svg('a')}</div><span class="yy-badge ok">✓</span></div>
        <button class="yy-say" type="button" data-hero><span class="yy-who">Yayen</span><span class="yy-bub"><b data-k="yt">Conectando…</b><span data-k="yp">Esperando datos del panel.</span></span></button>
      </div>`;
      press(el.querySelector('.yy'), () => open(false), () => open(true));
      setInterval(() => { if (Dash.data && !S.menu && Dash.overall(Dash.data).level === 'ok') { S.line++; paint(); } }, 9000);
      Dash.on('settings', paint);
      Dash.on('navigate', () => { if (S.menu) close(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.menu) close(); });
      paint();
    },
    render() { paint(); },
    open, close,
  };
})();
