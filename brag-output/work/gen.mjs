// Genera composition/index.html del promo de tuSpa.
// Uso: node gen.mjs vertical|landscape
import fs from 'node:fs';

const FORMAT = process.argv[2] === 'landscape' ? 'landscape' : 'vertical';
const V = FORMAT === 'vertical';
const W = V ? 1080 : 1920, H = V ? 1920 : 1080, DUR = 24;
const OUT = new URL('../composition/index.html', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const C = { ink: '#1A1A1A', cream: '#F5F3EE', stone: '#9D9488', muted: '#6B6560', line: '#E5E1D8', white: '#FFFFFF', wa: '#25D366' };
const DISPLAY = `'Playfair Display', Georgia, serif`;

// ---- geometría por formato ----
const HEAD = V ? { x: 80, y: 170, w: 920, size: 92 } : { x: 140, y: 330, w: 720, size: 84 };
const PHONE = (() => { const s = V ? 1.5 : 1.06, w = 390 * s, h = 844 * s; return { s, w, h, x: V ? (W - w) / 2 : 1110, y: V ? 560 : (H - h) / 2 }; })();
const DESK = (() => { const s = V ? 1000 / 1440 : 900 / 1440, w = 1440 * s, h = 900 * s; return { s, w, h, x: V ? (W - w) / 2 : 900, y: V ? 760 : (H - h) / 2 + 20, bar: 34 }; })();
const CHIPS = V ? { x: 80, y: 520 } : { x: 140, y: 560 };

const r2 = n => Math.round(n * 100) / 100;
const tw = [];
const T = (sel, from, to, at) => tw.push(`tl.fromTo(${JSON.stringify(sel)}, ${JSON.stringify(from)}, ${JSON.stringify(to)}, ${r2(at)});`);
const html = [];
// El fondo (.bg) queda fuera; todo lo demás va en un bloque #<id>-c que entra y sale como una sola pieza.
const clip = (id, start, dur, inner, style = '') => {
  const lines = inner.split('\n');
  const bg = lines.filter(l => l.includes('class="bg"')).join('\n');
  const content = lines.filter(l => !l.includes('class="bg"')).join('\n');
  html.push(`<div id="${id}" class="clip scene" data-start="${start}" data-duration="${dur}" style="${style}">\n${bg}\n<div id="${id}-c" class="content">\n${content}\n</div>\n</div>`);
};

const SPARK = (size, color = '#fff') => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M9.94 14.06 4.5 12.5l5.44-1.56L11.5 5.5l1.56 5.44L18.5 12.5l-5.44 1.56L11.5 19.5z"/><path d="M19 3v4M21 5h-4M5 17v3M6.5 18.5h-3"/></svg>`;
const CHAT = (size, color) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.6-5.4A8.4 8.4 0 1 1 21 11.5z"/></svg>`;

const headline = (id, text, color = C.ink) => `<div id="${id}" class="head" style="left:${HEAD.x}px;top:${HEAD.y}px;width:${HEAD.w}px;font-size:${HEAD.size}px;color:${color}">${text}</div>`;
const phone = (id, imgs) => `<div id="${id}" class="phone" style="left:${PHONE.x}px;top:${PHONE.y}px;width:${PHONE.w + 24}px;height:${PHONE.h + 24}px">
  <div class="phone-screen" style="width:${PHONE.w}px;height:${PHONE.h}px">
${imgs.map((src, i) => `    <img id="${id}-img${i}" src="assets/shots/${src}.png" alt="" style="opacity:${i ? 0 : 1}">`).join('\n')}
  </div>
</div>`;
const desk = (id, src) => `<div id="${id}" class="desk" style="left:${DESK.x}px;top:${DESK.y}px;width:${DESK.w}px;height:${DESK.h + DESK.bar}px">
  <div class="desk-bar"><i></i><i></i><i></i><span data-layout-ignore>tuspa.pe</span></div>
  <div class="desk-screen" style="width:${DESK.w}px;height:${DESK.h}px"><div id="${id}-cam" class="cam"><img src="assets/shots/${src}.png" alt=""></div></div>
</div>`;

// ---------- Escena 1 · Gancho (0–3 s) ----------
clip('s1', 0, 3.05, `
  <div class="bg" style="background:${C.ink}"></div>
  <div class="hook" style="left:${V ? 80 : 160}px;top:${V ? 700 : 330}px;width:${V ? 920 : 1600}px">
    <div class="hl" id="s1-a"><span>¿Citas por WhatsApp?</span><b id="s1-sa" class="strike"></b></div>
    <div class="hl" id="s1-b"><span>¿Caja en un cuaderno?</span><b id="s1-sb" class="strike"></b></div>
  </div>`);
T('#s1-a', { opacity: 1, scale: 1.06 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }, 0);
T('#s1-b', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 1.0);
T('#s1-sa', { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: 'power2.inOut' }, 2.0);
T('#s1-sb', { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: 'power2.inOut' }, 2.12);
T('#s1-a span, #s1-b span', { opacity: 1 }, { opacity: 0.45, duration: 0.3 }, 2.15);

// ---------- Escena 2 · Revelación (3–6 s) ----------
clip('s2', 3, 3.05, `
  <div class="bg" style="background:${C.ink}"></div>
  <div id="s2-wipe" class="bg" style="background:${C.cream}"></div>
  <div id="s2-logo" class="logo" style="left:${W / 2 - 90}px;top:${V ? 640 : 250}px">${SPARK(90)}</div>
  <div id="s2-name" class="center" style="top:${V ? 860 : 470}px;font-family:${DISPLAY};font-size:${V ? 170 : 150}px;font-weight:600;color:${C.ink}">tuSpa</div>
  <div id="s2-tag" class="center" style="top:${V ? 1080 : 660}px;font-size:${V ? 54 : 48}px;color:${C.muted}">Tu spa, en orden.</div>`);
T('#s2-wipe', { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: 'power3.inOut' }, 3.0);
T('#s2-logo', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.8)' }, 3.4);
T('#s2-name', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 3.6);
T('#s2-tag', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 4.0);
T('#s2-logo', { rotate: 0 }, { rotate: 12, duration: 2.2, ease: 'none', immediateRender: false }, 4.0);

// ---------- Escena 3 · Agenda (6–10 s) ----------
const tap = { x: PHONE.x + 12 + 286 * PHONE.s, y: PHONE.y + 12 + 600 * PHONE.s };
clip('s3', 6, 4.05, `
  <div class="bg" style="background:${C.cream}"></div>
  ${headline('s3-h', 'Tus citas,<br>en orden')}
  ${phone('s3-p', ['M6b-calendario-movil', 'M6d-detalle-movil'])}
  <div id="s3-tap" class="tap" style="left:${tap.x}px;top:${tap.y}px"></div>`);
T('#s3-h', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 6.0);
T('#s3-p', { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 6.1);
T('#s3-tap', { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }, 7.25);
T('#s3-tap', { opacity: 1 }, { opacity: 0, duration: 0.2, immediateRender: false }, 7.6);
T('#s3-p-img1', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 7.5);
T('#s3-p', { y: 0 }, { y: -20, duration: 2.2, ease: 'none', immediateRender: false }, 7.6);

// ---------- Escena 4 · Caja (10–14 s) ----------
const chips = ['Yape', 'Plin', 'Tarjeta', 'Efectivo'];
clip('s4', 10, 4.05, `
  <div class="bg" style="background:${C.cream}"></div>
  ${headline('s4-h', 'Cobra con Yape<br>y cierra tu caja')}
  <div class="chips" style="left:${CHIPS.x}px;top:${CHIPS.y}px">${chips.map((c, i) => `<span id="s4-c${i}" class="chip">${c}</span>`).join('')}</div>
  ${desk('s4-d', '08d-descuento-promo')}`);
T('#s4-h', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 10.0);
T('#s4-d', { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 10.1);
chips.forEach((_, i) => T(`#s4-c${i}`, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, 11.0 + i * 0.5));
// zoom al formulario de cobro (x 272–832, y 80–860 en la captura)
const z = V ? 1.7 : 1.45, cx = 552, cy = 470;
const zx = Math.min(0, Math.max(DESK.w - DESK.w * z, DESK.w / 2 - cx * DESK.s * z));
const zy = Math.min(0, Math.max(DESK.h - DESK.h * z, DESK.h / 2 - cy * DESK.s * z));
T('#s4-d-cam', { scale: 1, x: 0, y: 0 }, { scale: z, x: r2(zx), y: r2(zy), duration: 1.2, ease: 'power2.inOut' }, 11.0);
T('#s4-d-cam', { scale: z }, { scale: r2(z * 1.04), duration: 1.6, ease: 'none', immediateRender: false }, 12.3);

// ---------- Escena 5 · Catálogo web (14–18 s) ----------
clip('s5', 14, 4.05, `
  <div class="bg" style="background:${C.cream}"></div>
  ${headline('s5-h', 'Tu catálogo,<br>en tu propia web')}
  ${phone('s5-p', ['P8-publica-movil', 'P8d-publica-pedido'])}
  <div id="s5-wa" class="wa" style="left:${V ? 80 : 140}px;top:${V ? 405 : 560}px">${CHAT(V ? 40 : 36, C.wa)}<span>Pedido listo por WhatsApp</span></div>`);
T('#s5-h', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 14.0);
T('#s5-p', { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 14.1);
T('#s5-p-img1', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 15.5);
T('#s5-wa', { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.45, ease: 'back.out(1.6)' }, 16.5);
T('#s5-p', { y: 0 }, { y: -20, duration: 2.0, ease: 'none', immediateRender: false }, 15.6);

// ---------- Escena 6 · Tu marca (18–20 s) ----------
const names = ['Spa Rosa', 'Bella Nails', 'Aura Spa', 'tu spa'];
clip('s6', 18, 2.05, `
  <div class="bg" style="background:${C.cream}"></div>
  <div id="s6-h" class="center" style="top:${V ? 620 : 300}px;font-size:${V ? 60 : 56}px;color:${C.muted}">Con tu nombre y tu logo</div>
${names.map((n, i) => `  <div id="s6-n${i}" class="center brandname" data-layout-allow-overlap style="top:${V ? 760 : 420}px;font-size:${V ? 150 : 140}px">${n}</div>`).join('\n')}`);
T('#s6-h', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 18.0);
names.forEach((_, i) => {
  T(`#s6-n${i}`, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power3.out' }, 18.0 + i * 0.5 + 0.02);
  if (i < names.length - 1) T(`#s6-n${i}`, { opacity: 1 }, { opacity: 0, y: -30, duration: 0.12, immediateRender: false }, 18.0 + (i + 1) * 0.5 - 0.13);
});

// ---------- Escena 7 · Llamada a la acción (20–24 s) ----------
clip('s7', 20, 4, `
  <div class="bg" style="background:${C.ink}"></div>
  <div id="s7-q" class="center" style="top:${V ? 470 : 150}px;font-family:${DISPLAY};font-size:${V ? 76 : 70}px;color:${C.white};padding:0 60px">¿Citas, pagos y catálogo?</div>
  <div id="s7-n" class="center" style="top:${V ? 580 : 250}px;font-family:${DISPLAY};font-size:${V ? 76 : 70}px;color:${C.stone};font-style:italic">No busques más.</div>
  <div id="s7-phone" class="center ctaphone" style="top:${V ? 860 : 450}px">${CHAT(V ? 96 : 88, C.wa)}<span style="font-size:${V ? 128 : 120}px">903 155 163</span></div>
  <div id="s7-demo" class="center" style="top:${V ? 1060 : 640}px"><span class="demo" style="font-size:${V ? 48 : 44}px">Pide tu demo gratis</span></div>
  <div id="s7-brand" class="center" style="top:${V ? 1600 : 900}px;font-size:${V ? 34 : 32}px;color:${C.stone};letter-spacing:.24em;text-transform:uppercase">${SPARK(V ? 34 : 30, C.stone)}&nbsp; tuSpa · sistema para spas</div>`);
T('#s7-q', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 20.0);
T('#s7-n', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 20.5);
T('#s7-phone', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }, 21.0);
T('#s7-demo', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 21.5);
T('#s7-brand', { opacity: 0 }, { opacity: 1, duration: 0.4 }, 21.4);
T('#s7-phone', { scale: 1 }, { scale: 1.04, duration: 2.4, ease: 'none', immediateRender: false }, 21.5);

// salidas escalonadas: el contenido sale antes de que entre la escena siguiente
[['s1', 3], ['s3', 10], ['s4', 14], ['s5', 18], ['s6', 20]].forEach(([id, end]) =>
  T(`#${id}-c`, { opacity: 1 }, { opacity: 0, duration: 0.22, ease: 'power1.in', immediateRender: false }, end - 0.24));
// fondo crema entre 2 y 3/4 y 5: el fondo es continuo; S2→S3 dissolve suave del contenido
T('#s2-c', { opacity: 1 }, { opacity: 0, duration: 0.25, immediateRender: false }, 5.75);

const doc = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>tuSpa · promo</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      @font-face{font-family:'Inter';src:url('assets/fonts/inter-latin.woff2') format('woff2');font-weight:100 900;}
      @font-face{font-family:'Playfair Display';src:url('assets/fonts/playfair-latin.woff2') format('woff2');font-weight:400 900;}
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${C.ink}; }
      #main { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; font-family: 'Inter', sans-serif; color: ${C.ink}; }
      .scene { position: absolute; inset: 0; overflow: hidden; }
      .bg { position: absolute; inset: 0; }
      .content { position: absolute; inset: 0; }
      .hook { position: absolute; display: flex; flex-direction: column; gap: ${V ? 40 : 28}px; }
      .hl { position: relative; align-self: flex-start; font-family: ${DISPLAY}; font-weight: 600; font-size: ${V ? 96 : 104}px; line-height: 1.1; color: #fff; }
      .strike { position: absolute; left: -10px; right: -10px; top: 54%; height: ${V ? 10 : 11}px; background: ${C.stone}; border-radius: 6px; transform-origin: left center; }
      .head { position: absolute; font-family: ${DISPLAY}; font-weight: 600; line-height: 1.05; }
      .center { position: absolute; left: 0; right: 0; text-align: center; }
      .logo { position: absolute; width: 180px; height: 180px; border-radius: 50%; background: ${C.ink}; display: flex; align-items: center; justify-content: center; }
      .phone { position: absolute; background: ${C.ink}; border-radius: ${V ? 64 : 48}px; padding: 12px; box-shadow: 0 40px 90px rgba(26,26,26,.25); }
      .phone-screen { position: relative; overflow: hidden; border-radius: ${V ? 54 : 40}px; background: #fff; }
      .phone-screen img { position: absolute; inset: 0; width: 100%; height: 100%; }
      .desk { position: absolute; background: #fff; border: 1px solid ${C.line}; border-radius: 16px; overflow: hidden; box-shadow: 0 40px 90px rgba(26,26,26,.18); }
      .desk-bar { height: ${DESK.bar}px; display: flex; align-items: center; gap: 7px; padding: 0 14px; border-bottom: 1px solid ${C.line}; }
      .desk-bar i { width: 10px; height: 10px; border-radius: 50%; background: ${C.line}; }
      .desk-bar span { margin-left: 12px; font-size: 15px; color: ${C.muted}; background: ${C.cream}; border-radius: 10px; padding: 3px 12px; }
      .desk-screen { position: relative; overflow: hidden; }
      .cam { position: absolute; inset: 0; transform-origin: 0 0; }
      .cam img { width: 100%; height: 100%; display: block; }
      .tap { position: absolute; width: 74px; height: 74px; margin: -37px 0 0 -37px; border-radius: 50%; border: 5px solid ${C.ink}; background: rgba(26,26,26,.15); }
      .chips { position: absolute; display: flex; flex-wrap: wrap; gap: 14px; width: ${V ? 920 : 720}px; }
      .chip { display: inline-block; padding: 12px 26px; border-radius: 999px; background: ${C.ink}; color: #fff; font-size: ${V ? 36 : 32}px; font-weight: 600; }
      .wa { position: absolute; display: flex; align-items: center; gap: 14px; padding: 14px 26px; border-radius: 999px; background: #fff; border: 2px solid ${C.wa}; font-size: ${V ? 36 : 32}px; font-weight: 600; }
      .brandname { font-family: ${DISPLAY}; font-weight: 600; color: ${C.ink}; }
      .ctaphone { display: flex; align-items: center; justify-content: center; gap: 26px; color: #fff; font-weight: 700; letter-spacing: .02em; font-variant-numeric: tabular-nums; }
      .demo { display: inline-block; padding: 16px 40px; border-radius: 999px; background: ${C.cream}; color: ${C.ink}; font-weight: 600; }
    </style>
  </head>
  <body>
    <div id="main" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}">
${html.join('\n')}
      <audio id="music" class="clip" src="assets/music.wav" data-start="0" data-duration="${DUR}" data-track-index="2" data-volume="1"></audio>
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
${tw.map(l => '      ' + l).join('\n')}
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
fs.writeFileSync(OUT, doc);
console.log('ok', FORMAT, W + 'x' + H, 'tweens', tw.length);
