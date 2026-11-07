// Genera index.html, compositions/*.html y la pista de voz a partir de
// narracion.json (texto), assets/voz/duraciones.json y palabras.json (tiempos reales de la voz)
// y tools/spec.mjs (qué captura se ve y qué se señala).
// Uso: node tools/build.mjs   (desde video/guia-essence/)   ·   --no-audio para no rehacer la pista de voz
// Adaptado del generador del video de la tesis (mismo motor: cámara, cursor, subtítulos por palabra).
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { scenes } from './spec.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const rd = p => JSON.parse(fs.readFileSync(ROOT + p, 'utf8'));
const lines = Object.fromEntries(rd('narracion.json').map(l => [l.id, l]));
const dur = rd('assets/voz/duraciones.json');
const words = fs.existsSync(ROOT + 'assets/voz/palabras.json') ? rd('assets/voz/palabras.json') : {};

// ---- marca (tuSpa: paleta real del sistema) ----
const C = { bg: '#F5F3EE', ink: '#1A1A1A', muted: '#6B6560', stone: '#9D9488', line: '#E5E1D8', card: '#FFFFFF', cream: '#EEE9E0' };
const BRAND = 'tuSpa';

// ---- ritmo ----
const LEAD = 0.9, GAP = 1.1, TAIL = 1.1, INTRO_PRE = 1.2, OUTRO_TAIL = 2.6;
const r2 = n => Math.round(n * 100) / 100;

// ---- formato: horizontal 1920×1080 (por defecto) o vertical 1080×1920 para celular (--vertical) ----
const V = process.argv.includes('--vertical');
const W = V ? 1080 : 1920, H = V ? 1920 : 1080;
// ---- geometría (px del video) ----
const DESK = V ? { cw: 1440, ch: 900, s: 1020 / 1440, vx: 30, vy: 760, bar: 40 } : { cw: 1440, ch: 900, s: 0.8, vx: 112, vy: 124, bar: 40 };
DESK.vw = DESK.cw * DESK.s; DESK.vh = DESK.ch * DESK.s;
const MOB = { cw: 390, ch: 844, s: V ? 1.34 : 0.88 };
MOB.vw = MOB.cw * MOB.s; MOB.vh = MOB.ch * MOB.s; MOB.vx = V ? (W - MOB.vw) / 2 : DESK.vx + (DESK.vw - MOB.vw) / 2; MOB.vy = V ? 540 : 76;
const PANEL_X = V ? 60 : 1320, PANEL_W = V ? 960 : 420, PANEL_Y = V ? 110 : 124, STEP_Y = V ? 230 : 262;
// en vertical la pantalla de escritorio se ve más chica: la cámara acerca más
const ZMAX_DESK = V ? 2.6 : 2.0;

// ---- tiempos ----
const plan = []; let t = 0;
for (const sc of scenes) {
  const S = { ...sc, start: t, lines: [] };
  let cur = sc.kind === 'intro' ? INTRO_PRE : LEAD;
  sc.lines.forEach(ln => {
    const d = dur[ln.id];
    if (d === undefined) throw new Error(`falta la voz de ${ln.id}`);
    const L = { ...ln, text: lines[ln.id].text, start: r2(cur), dur: d };
    S.lines.push(L);
    cur += d + GAP + (ln.roles || ln.matrix ? 1.2 : 0);
  });
  const last = S.lines.at(-1);
  S.dur = r2(last.start + last.dur + (sc.kind === 'outro' ? OUTRO_TAIL : TAIL));
  for (let i = 0; i < S.lines.length; i++) S.lines[i].end = i + 1 < S.lines.length ? S.lines[i + 1].start : S.dur;
  plan.push(S); t = r2(t + S.dur);
}
const TOTAL = t;

// segundos (relativos a la frase) en que empieza / termina la palabra en la posición `i` del texto
function wordAt(L, i) {
  const ws = words[L.id]; const toks = L.text.split(/\s+/).filter(Boolean);
  if (!ws || ws.length !== toks.length) return (i / L.text.length) * L.dur;
  const k = L.text.slice(0, i).split(/\s+/).filter(Boolean).length - (/\S$/.test(L.text.slice(0, i)) ? 1 : 0);
  return ws[Math.max(0, Math.min(ws.length - 1, k))].start;
}
function wordEnd(L, i) {
  const ws = words[L.id]; const toks = L.text.split(/\s+/).filter(Boolean);
  if (!ws || ws.length !== toks.length) return (i / L.text.length) * L.dur;
  const k = L.text.slice(0, i).split(/\s+/).filter(Boolean).length - 1;
  return ws[Math.max(0, Math.min(ws.length - 1, k))].end;
}
function when(L, kw) {
  const i = L.text.toLowerCase().indexOf(kw.toLowerCase());
  if (i < 0) throw new Error(`"${kw}" no aparece en ${L.id}: ${L.text}`);
  return L.start + wordAt(L, i);
}

// ---- cámara ----
function camFor(G, b) {
  const pad = G === MOB ? 10 : 16;
  const bw = b.w + pad * 2, bh = b.h + pad * 2, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  const zmax = G === MOB ? 1.8 : ZMAX_DESK;
  let z = Math.min(0.62 * G.cw / bw, 0.62 * G.ch / bh, zmax);
  z = Math.max(1, z);
  let tx = G.cw / 2 - cx * z, ty = G.ch / 2 - cy * z;
  tx = Math.min(0, Math.max(G.cw - G.cw * z, tx));
  ty = Math.min(0, Math.max(G.ch - G.ch * z, ty));
  return { z: r2(z), x: r2(tx), y: r2(ty), sx: r2(G.vx + (cx * z + tx) * G.s), sy: r2(G.vy + (cy * z + ty) * G.s) };
}

const FONT = `@font-face{font-family:'Inter';src:url('assets/fonts/inter-latin.woff2') format('woff2');font-weight:100 900;font-style:normal;}
@font-face{font-family:'Playfair Display';src:url('assets/fonts/playfair-latin.woff2') format('woff2');font-weight:400 900;font-style:normal;}`;
const DISPLAY = `'Playfair Display',serif`;
const BASE_CSS = `
${FONT}
#root{position:absolute;inset:0;font-family:'Inter',sans-serif;color:${C.ink};}
#root .bg{position:absolute;inset:0;background:${C.bg};}
#root .stage{position:absolute;inset:0;}
#root .panel{position:absolute;left:${PANEL_X}px;top:${PANEL_Y}px;width:${PANEL_W}px;}
#root .chap{font-family:${DISPLAY};font-size:34px;font-weight:600;color:${C.ink};line-height:1.2;}
#root .chap-rule{width:56px;height:3px;background:${C.stone};border-radius:2px;margin-top:18px;}
#root .step{position:absolute;left:${PANEL_X}px;top:${STEP_Y}px;width:${PANEL_W}px;}
#root .step .n{font-size:28px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:${C.stone};}
#root .step .t{margin-top:12px;font-family:${DISPLAY};font-size:${V ? 60 : 46}px;font-weight:600;line-height:1.15;color:${C.ink};}
#root .step .badge{display:inline-block;margin-top:24px;padding:10px 20px;border-radius:999px;background:${C.ink};color:#fff;font-size:28px;font-weight:600;}
#root .shot{position:absolute;inset:0;}
#root .frame{position:absolute;left:${DESK.vx - 1}px;top:${DESK.vy - DESK.bar - 1}px;width:${DESK.vw + 2}px;height:${DESK.vh + DESK.bar + 2}px;background:#fff;border:1px solid ${C.line};border-radius:14px;overflow:hidden;box-shadow:0 24px 60px rgba(26,26,26,.10);}
#root .bar{position:absolute;left:0;top:0;right:0;height:${DESK.bar}px;background:#fff;border-bottom:1px solid ${C.line};display:flex;align-items:center;gap:8px;padding:0 16px;}
#root .dot{width:11px;height:11px;border-radius:50%;background:${C.line};}
#root .url{margin-left:14px;height:26px;padding:0 14px;border-radius:13px;background:${C.bg};font-size:28px;line-height:26px;color:${C.muted};transform-origin:left center;}
#root .url span{display:inline-block;font-size:16px;}
#root .screen{position:absolute;left:0;top:${DESK.bar}px;width:${DESK.cw}px;height:${DESK.ch}px;transform:scale(${DESK.s});transform-origin:0 0;overflow:hidden;}
#root .phone{position:absolute;left:${MOB.vx - 10}px;top:${MOB.vy - 10}px;width:${MOB.vw + 20}px;height:${MOB.vh + 20}px;background:${C.ink};border-radius:40px;box-shadow:0 24px 60px rgba(26,26,26,.18);}
#root .phone .screen{left:10px;top:10px;width:${MOB.cw}px;height:${MOB.ch}px;transform:scale(${MOB.s});border-radius:38px;}
#root .cam{position:absolute;left:0;top:0;width:100%;height:100%;transform-origin:0 0;}
#root .cam img.shotimg{position:absolute;left:0;top:0;width:100%;height:100%;}
#root .hl{position:absolute;border-style:solid;border-color:${C.ink};box-shadow:0 0 0 4px rgba(255,255,255,.85);opacity:0;}
#root .cursor{position:absolute;left:0;top:0;width:34px;height:34px;opacity:0;}
#root .touch{position:absolute;left:0;top:0;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;border:4px solid ${C.ink};background:rgba(26,26,26,.12);opacity:0;}
#root .card{position:absolute;left:0;top:0;width:${W}px;height:${H}px;}
`;

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
const CURSOR_SVG = `<svg viewBox="0 0 24 24" width="34" height="34"><path d="M4 2 L4 20 L9 15.5 L12.5 22 L15.5 20.6 L12.2 14.2 L18.5 14.2 Z" fill="${C.ink}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
// icono de la marca (destello, como el de la app)
const SPARK = (size, color = '#fff') => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M9.94 14.06 4.5 12.5l5.44-1.56L11.5 5.5l1.56 5.44L18.5 12.5l-5.44 1.56L11.5 19.5z"/><path d="M19 3v4M21 5h-4M5 17v3M6.5 18.5h-3"/></svg>`;
const LOGO = (id, size, extra = '') => `<div id="${id}" style="position:absolute;${extra};width:${size}px;height:${size}px;border-radius:50%;background:${C.ink};display:flex;align-items:center;justify-content:center">${SPARK(Math.round(size * 0.5))}</div>`;

const ROLES = [
  { t: 'Administrador', d: ['Todo el sistema', 'Catálogo y equipo', 'Caja, cierre y reportes', 'Eliminar clientas'] },
  { t: 'Recepción', d: ['Agenda y clientas', 'Cobros y egresos', 'Cierre de caja', 'Reportes'] },
  { t: 'Especialista', d: ['Agenda y citas', 'Clientas', 'Reportes', 'Sin acceso a Caja'] },
];
const MATRIX = [
  ['Resumen y agenda de citas', 1, 1, 1], ['Clientes: ver, registrar y editar', 1, 1, 1], ['Eliminar clientas', 1, 0, 0],
  ['Ver catálogo y equipo', 1, 1, 1], ['Modificar catálogo y equipo', 1, 0, 0], ['Caja, cobros y cierre', 1, 1, 0], ['Reportes', 1, 1, 1],
];

function buildScene(S, file) {
  const id = S.id; const html = []; const js = [];
  const tw = [];
  const T = (sel, from, to, at) => tw.push({ sel, from, to, at: r2(at) });
  const emit = () => {
    const first = {};
    for (const x of tw) if (!(x.sel in first) || x.at < first[x.sel].at) first[x.sel] = x;
    for (const x of tw) {
      const to = first[x.sel] === x ? x.to : { ...x.to, immediateRender: false };
      js.push(`tl.fromTo(${JSON.stringify(x.sel)}, ${JSON.stringify(x.from)}, ${JSON.stringify(to)}, ${x.at});`);
    }
  };
  let n = 0; const uid = p => `${id}-${p}${++n}`;

  html.push(`<div class="bg"></div>`);
  html.push(`<div id="${id}-stage" class="stage">`);

  // pantalla de inicio ilustrada: el icono "tuSpa Gestión" anclado y la app a pantalla completa
  function buildHome(L, sStart, sEnd) {
    const hid = `${id}-home`;
    const st = sStart, en = r2(Math.min(S.dur, sEnd + 0.4));
    const tiles = [];
    const pal = ['#E5E1D8', '#D9D4CA', '#ECE8E0', '#CFC9BE', '#E0DBD2', '#D6D1C8', '#E8E4DC', '#DAD5CB'];
    for (let i = 0; i < 16; i++) {
      const c = i % 4, r = Math.floor(i / 4);
      const x = 34 + c * 86, y = 120 + r * 104;
      if (i === 9) {
        tiles.push(`<div id="${hid}-app" style="position:absolute;left:${x}px;top:${y}px;width:64px;text-align:center"><div style="width:64px;height:64px;border-radius:16px;background:${C.ink};border:1px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center">${SPARK(32)}</div><div data-layout-ignore style="margin-top:6px;font-size:11px;font-weight:600;color:#fff;white-space:nowrap;margin-left:-12px;margin-right:-12px">${BRAND} Gestión</div></div>`);
      } else {
        tiles.push(`<div style="position:absolute;left:${x}px;top:${y}px;width:64px;height:64px;border-radius:16px;background:${pal[i % pal.length]};opacity:.55"></div>`);
      }
    }
    html.push(`<div id="${hid}" class="shot clip" data-start="${st}" data-duration="${r2(en - st)}">
  <div id="${hid}-in" style="position:absolute;inset:0">
    <div class="phone"><div class="screen" style="background:linear-gradient(160deg,#3a3733 0%,#1A1A1A 60%,#6B6560 100%)">
      <div data-layout-ignore style="position:absolute;left:0;right:0;top:42px;text-align:center;font-size:46px;font-weight:300;color:#fff">9:41</div>
${tiles.map(x => '      ' + x).join('\n')}
      <div style="position:absolute;left:24px;right:24px;bottom:28px;height:84px;border-radius:28px;background:rgba(255,255,255,.18)"></div>
      <div id="${hid}-open" style="position:absolute;inset:0;opacity:0"><img src="assets/movil/M6b-calendario-movil.png" alt="" style="position:absolute;inset:0;width:100%;height:100%"></div>
    </div></div>
    <div id="${hid}-tap" class="touch"></div>
  </div>
</div>`);
    const appX = r2(MOB.vx + (34 + 32) * MOB.s), appY = r2(MOB.vy + (120 + 2 * 104 + 32) * MOB.s);
    T(`#${hid}-in`, { opacity: 0 }, { opacity: 1, duration: 0.4 }, st);
    T(`#${hid}-app`, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)' }, when(L, 'anclado') - 0.2);
    const tapAt = when(L, 'pantalla completa') - 0.6;
    T(`#${hid}-tap`, { opacity: 0, x: appX, y: appY }, { opacity: 1, duration: 0.2 }, tapAt - 0.3);
    T(`#${hid}-tap`, { scale: 1 }, { scale: 0.8, duration: 0.15, yoyo: true, repeat: 1, ease: 'power1.inOut' }, tapAt);
    T(`#${hid}-tap`, { opacity: 1 }, { opacity: 0, duration: 0.2 }, tapAt + 0.35);
    T(`#${hid}-open`, { opacity: 0, scale: 0.2, transformOrigin: '66px 360px' }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }, tapAt + 0.3);
    T(`#${hid}-in`, { opacity: 1 }, { opacity: 0, duration: 0.4 }, r2(en - 0.4));
  }

  if (S.kind === 'intro') {
    const L = S.lines[0];
    html.push(`<div id="${id}-hero" class="clip" data-start="0" data-duration="${S.dur}" style="position:absolute;inset:0">
  ${LOGO(`${id}-logo`, 180, V ? 'left:450px;top:560px' : 'left:870px;top:250px')}
  <div id="${id}-title" style="position:absolute;left:0;right:0;top:${V ? 790 : 470}px;text-align:center;font-family:${DISPLAY};font-size:110px;font-weight:600;color:${C.ink}">${BRAND}</div>
  <div id="${id}-kicker" style="position:absolute;left:0;right:0;top:${V ? 950 : 620}px;text-align:center;font-size:28px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:${C.stone}">Sistema de gestión para tu spa</div>
  <div id="${id}-rule" style="position:absolute;left:${W / 2 - 28}px;top:${V ? 1010 : 676}px;width:56px;height:3px;border-radius:2px;background:${C.stone}"></div>
  <div id="${id}-tag" style="position:absolute;left:60px;right:60px;top:${V ? 1050 : 712}px;text-align:center;line-height:1.5;font-size:36px;font-weight:400;color:${C.muted}">Ingresar · Cada módulo · En tu celular · Cada usuario</div>
</div>`);
    T(`#${id}-logo`, { opacity: 1, scale: 0.92 }, { opacity: 1, scale: 1, duration: 1.0, ease: 'power3.out' }, 0);
    T(`#${id}-title`, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.7);
    T(`#${id}-kicker`, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 1.2);
    T(`#${id}-rule`, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'power2.out' }, 1.4);
    T(`#${id}-tag`, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, when(L, 'aprenderás') - 0.2);
    T(`#${id}-logo`, { scale: 1 }, { scale: 1.05, duration: S.dur - 1.0, ease: 'none', immediateRender: false }, 1.0);
  } else {
    const firstShot = S.lines.find(l => l.shots || l.home);
    if (firstShot) {
      const ps = r2(firstShot.start - 0.5);
      const lastShot = [...S.lines].reverse().find(l => l.shots || l.home);
      const pe = lastShot.end === S.dur ? S.dur : r2(lastShot.end + 0.4);
      html.push(`<div id="${id}-panel" class="panel clip" data-start="${ps}" data-duration="${r2(pe - ps)}"><div class="chap">${esc(S.label)}</div><div class="chap-rule"></div></div>`);
      T(`#${id}-panel`, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }, ps + 0.05);
    }
    let stepNo = 0;
    S.lines.forEach((L, li) => {
      if (L.roles) {
        const cs = r2(Math.max(0, L.start - 0.6)), ce = L.end;
        html.push(`<div id="${id}-roles" class="card clip" data-start="${cs}" data-duration="${r2(ce - cs)}">
  <div id="${id}-roles-k" style="position:absolute;left:${V ? 60 : 192}px;top:${V ? 120 : 150}px;font-size:28px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:${C.stone}">Roles del sistema</div>
  <div id="${id}-roles-h" style="position:absolute;left:${V ? 60 : 192}px;top:${V ? 170 : 200}px;width:${V ? 960 : 1600}px;line-height:1.1;font-family:${DISPLAY};font-size:84px;font-weight:600">¿Qué puede hacer cada usuario?</div>
${ROLES.map((r, k) => `  <div id="${id}-role${k}" style="position:absolute;left:${V ? 60 : 192 + k * 520}px;top:${V ? 420 + k * 450 : 370}px;width:${V ? 960 : 488}px;height:${V ? 420 : 460}px;background:${k === 0 ? C.ink : C.card};color:${k === 0 ? '#fff' : C.ink};border:1px solid ${C.line};border-radius:24px;padding:44px 40px">
    <div style="font-family:${DISPLAY};font-size:48px;font-weight:600">${r.t}</div>
    <div style="width:48px;height:3px;background:${C.stone};border-radius:2px;margin:22px 0 26px"></div>
${r.d.map(x => `    <div style="font-size:30px;line-height:1.25;margin-bottom:22px">${esc(x)}</div>`).join('\n')}
  </div>`).join('\n')}
</div>`);
        T(`#${id}-roles-k`, { opacity: 0 }, { opacity: 1, duration: 0.5 }, cs + 0.1);
        T(`#${id}-roles-h`, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, cs + 0.2);
        ['Administrador', 'Recepción', 'Especialista'].forEach((kw, k) => T(`#${id}-role${k}`, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, when(L, kw) - 0.3));
        T(`#${id}-role0`, { scale: 1 }, { scale: 1.03, duration: r2(ce - when(L, 'Recepción')), ease: 'none', immediateRender: false }, when(L, 'Recepción'));
        T(`#${id}-roles-h`, { scale: 1 }, { scale: 1.02, duration: r2(ce - cs - 1.5), ease: 'none', immediateRender: false }, cs + 1);
        T(`#${id}-roles`, { opacity: 1 }, { opacity: 0, duration: 0.4 }, r2(ce - 0.4));
        return;
      }
      if (L.matrix) {
        const cs = r2(L.start - 0.6), ce = L.end;
        const rowH = V ? 120 : 76, top = V ? 620 : 310, colX = V ? [60, 600, 775, 950] : [192, 1060, 1320, 1580], rowL = V ? 30 : 150, rowW = V ? 1020 : 1620, labW = V ? 470 : 820;
        html.push(`<div id="${id}-mx" class="card clip" data-start="${cs}" data-duration="${r2(ce - cs)}">
  <div id="${id}-mx-h" style="position:absolute;left:${V ? 60 : 192}px;top:${V ? 380 : 140}px;font-family:${DISPLAY};font-size:72px;font-weight:600">Permisos por rol</div>
${['Administrador', 'Recepción', 'Especialista'].map((h, k) => `  <div style="position:absolute;left:${colX[k + 1] - (V ? 85 : 120)}px;top:${top - (V ? 92 : 62)}px;width:${V ? 170 : 240}px;text-align:center;font-size:28px;line-height:1.2;font-weight:700">${V ? h.replace('Administrador', 'Admin.') : h}</div>`).join('\n')}
${MATRIX.map((row, r) => `  <div id="${id}-mx${r}" style="position:absolute;left:${rowL}px;top:${top + r * rowH}px;width:${rowW}px;height:${rowH - 8}px;background:${r % 2 ? 'transparent' : C.card};border-radius:14px">
    <div style="position:absolute;left:${V ? 30 : 42}px;top:0;width:${labW}px;height:100%;display:flex;align-items:center;line-height:1.2;font-size:30px">${esc(row[0])}</div>
${row.slice(1).map((v, k) => `    <div style="position:absolute;left:${colX[k + 1] - rowL - 22}px;top:${(rowH - 8) / 2 - 22}px;width:44px;height:44px;border-radius:50%;background:${v ? C.ink : C.cream};color:${v ? '#fff' : C.stone};display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700">${v ? '✓' : '–'}</div>`).join('\n')}
  </div>`).join('\n')}
</div>`);
        T(`#${id}-mx-h`, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, cs + 0.1);
        MATRIX.forEach((_, r) => T(`#${id}-mx${r}`, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }, cs + 0.6 + r * 0.45));
        T(`#${id}-mx`, { opacity: 1 }, { opacity: 0, duration: 0.4 }, r2(ce - 0.4));
        return;
      }
      if (L.note) {
        html.push(`<div id="${id}-note" class="clip" data-start="${r2(L.start - 0.5)}" data-duration="${r2(L.end - L.start + 0.5)}" style="position:absolute;inset:0">
  <div id="${id}-note-a" style="position:absolute;left:${V ? 60 : 192}px;top:${V ? 760 : 340}px;font-size:30px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:${C.stone}">¿Olvidaste tu contraseña?</div>
  <div id="${id}-note-b" style="position:absolute;left:${V ? 60 : 192}px;top:${V ? 820 : 400}px;width:${V ? 960 : 1400}px;font-family:${DISPLAY};font-size:88px;font-weight:600;line-height:1.1">Pídesela al Administrador.</div>
  <div id="${id}-note-c" style="position:absolute;left:${V ? 60 : 192}px;top:${V ? 1070 : 540}px;width:${V ? 960 : 1400}px;line-height:1.4;font-size:34px;color:${C.muted}">Te asigna una nueva desde Equipo › Editar perfil.</div>
</div>`);
        T(`#${id}-note-a`, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, L.start - 0.4);
        T(`#${id}-note-b`, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, when(L, 'Pídele') - 0.3);
        T(`#${id}-note-c`, { opacity: 0 }, { opacity: 1, duration: 0.6 }, when(L, 'Equipo') - 0.4);
        T(`#${id}-note`, { opacity: 1 }, { opacity: 0, duration: 0.4 }, r2(L.end - 0.4));
        return;
      }
      if (L.end === S.dur && S.kind === 'outro') {
        html.push(`<div id="${id}-end" class="clip" data-start="${r2(L.start - 0.6)}" data-duration="${r2(S.dur - L.start + 0.6)}" style="position:absolute;inset:0">
  ${LOGO(`${id}-end-logo`, 150, V ? 'left:465px;top:700px' : 'left:885px;top:300px')}
  <div id="${id}-end-t" style="position:absolute;left:0;right:0;top:${V ? 890 : 490}px;text-align:center;font-family:${DISPLAY};font-size:96px;font-weight:600">${BRAND}</div>
  <div id="${id}-end-s" style="position:absolute;left:0;right:0;top:${V ? 1030 : 630}px;text-align:center;font-size:30px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:${C.stone}">Tu negocio, en equilibrio</div>
</div>`);
        T(`#${id}-end-logo`, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }, L.start - 0.5);
        T(`#${id}-end-t`, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, L.start - 0.1);
        T(`#${id}-end-s`, { opacity: 0 }, { opacity: 1, duration: 0.6 }, when(L, 'negocio') - 0.3);
        T(`#${id}-end-t`, { scale: 1 }, { scale: 1.025, duration: r2(S.dur - L.start - 1.2), ease: 'none' }, L.start + 0.7);
        return;
      }

      // ---- paso con capturas (o la pantalla de inicio ilustrada) ----
      stepNo++;
      const sStart = r2(L.start - 0.35), sEnd = L.end;
      const stepId = `${id}-step${stepNo}`;
      html.push(`<div id="${stepId}" class="step clip" data-start="${sStart}" data-duration="${r2(sEnd - sStart)}"><div class="n">Paso ${stepNo}</div><div class="t">${esc(L.step)}</div>${L.badge ? `<div class="badge">${esc(L.badge)}</div>` : ''}</div>`);
      T(`#${stepId} .n`, { opacity: 0 }, { opacity: 1, duration: 0.4 }, sStart + 0.05);
      T(`#${stepId} .t`, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, sStart + 0.1);
      if (L.badge) T(`#${stepId} .badge`, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4 }, sStart + 0.5);
      if (sEnd < S.dur) T(`#${stepId}`, { opacity: 1 }, { opacity: 0, duration: 0.3 }, r2(sEnd - 0.36));

      if (L.home) { buildHome(L, sStart, sEnd); return; }

      const firstShotIdx = S.lines.findIndex(x => x.shots || x.home);
      const shotStarts = L.shots.map((sh, k) => k === 0 ? (li === firstShotIdx ? r2(L.start - 0.5) : sStart) : r2(when(L, sh.at) - 0.3));
      L.shots.forEach((sh, k) => {
        const mobile = sh.img.startsWith('movil/');
        const G = mobile ? MOB : DESK;
        const st = shotStarts[k];
        const en = k + 1 < L.shots.length ? r2(shotStarts[k + 1] + 0.4) : r2(Math.min(S.dur, sEnd + 0.4));
        const sid = uid('shot');
        const parts = [];
        parts.push(`<div id="${sid}" class="shot clip" data-start="${st}" data-duration="${r2(en - st)}">`);
        parts.push(`  <div id="${sid}-in" style="position:absolute;inset:0">`);
        if (mobile) parts.push(`    <div class="phone"><div class="screen">`);
        else parts.push(`    <div class="frame"><div class="bar"><i class="dot"></i><i class="dot"></i><i class="dot"></i><div id="${sid}-url" class="url" data-layout-ignore><span>${esc(sh.url || BRAND)}</span></div></div><div class="screen">`);
        parts.push(`      <div id="${sid}-cam" class="cam"><img class="shotimg" src="assets/${sh.img}.png" alt="">`);
        const foci = sh.focus.map(([kw, b]) => ({ kw, b }));
        const camStates = [];
        foci.forEach((f, fi) => {
          if (f.b === 'urlbar') { camStates.push(null); return; }
          const c = camFor(G, f.b); camStates.push(c);
          const bw = r2(3 / (G.s * c.z)), pad = mobile ? 6 : 8;
          parts.push(`        <div id="${sid}-hl${fi}" class="hl" style="left:${r2(f.b.x - pad)}px;top:${r2(f.b.y - pad)}px;width:${r2(f.b.w + pad * 2)}px;height:${r2(f.b.h + pad * 2)}px;border-width:${bw}px;border-radius:${r2(12 / (G.s * c.z))}px"></div>`);
        });
        parts.push(`      </div>`);
        parts.push(`    </div></div>`);
        parts.push(mobile ? `    <div id="${sid}-cur" class="touch"></div>` : `    <div id="${sid}-cur" class="cursor">${CURSOR_SVG}</div>`);
        parts.push(`  </div>`);
        parts.push(`</div>`);
        html.push(parts.join('\n'));

        T(`#${sid}-in`, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power1.out' }, st);
        let prev = { z: 1, x: 0, y: 0 }; let prevT = st; let curPos = null;
        foci.forEach((f, fi) => {
          let at = Math.max(prevT + (fi ? 1.1 : 0.5), when(L, f.kw) - 0.35);
          if (k + 1 < L.shots.length) at = Math.min(at, shotStarts[k + 1] - 0.9);
          const hlOutPrev = fi > 0 && camStates[fi - 1] ? `#${sid}-hl${fi - 1}` : null;
          if (hlOutPrev) T(hlOutPrev, { opacity: 1 }, { opacity: 0, duration: 0.25 }, at);
          if (f.b === 'urlbar') {
            T(`#${sid}-url`, { backgroundColor: C.bg, boxShadow: `0 0 0 0px ${C.ink}` }, { backgroundColor: '#FFFFFF', boxShadow: `0 0 0 3px ${C.ink}`, duration: 0.35 }, at + 0.2);
            T(`#${sid}-url`, { boxShadow: `0 0 0 3px ${C.ink}` }, { boxShadow: `0 0 0 0px ${C.ink}`, duration: 0.3 }, at + 2.4);
            prevT = at; return;
          }
          const c = camStates[fi];
          T(`#${sid}-cam`, { scale: prev.z, x: prev.x, y: prev.y }, { scale: c.z, x: c.x, y: c.y, duration: 0.8, ease: 'power2.inOut' }, at);
          T(`#${sid}-hl${fi}`, { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }, at + 0.7);
          const tx = mobile ? c.sx : c.sx - 4, ty = mobile ? c.sy : c.sy - 2;
          if (!curPos) {
            const sx0 = mobile ? MOB.vx + MOB.vw * 0.7 : DESK.vx + DESK.vw * 0.78, sy0 = mobile ? MOB.vy + MOB.vh * 0.62 : DESK.vy + DESK.vh * 0.8;
            T(`#${sid}-cur`, { opacity: 0, x: sx0, y: sy0 }, { opacity: 1, duration: 0.25 }, at);
            curPos = { x: sx0, y: sy0 };
          }
          T(`#${sid}-cur`, { x: curPos.x, y: curPos.y }, { x: tx, y: ty, duration: 0.8, ease: 'power2.inOut' }, at);
          if (mobile) T(`#${sid}-cur`, { scale: 1 }, { scale: 0.8, duration: 0.15, yoyo: true, repeat: 1, ease: 'power1.inOut' }, at + 0.82);
          curPos = { x: tx, y: ty };
          prev = c; prevT = at;
        });
        // deriva lenta: la toma nunca queda congelada
        const d0 = r2(prevT + (foci.length ? 0.85 : 0.3)), d1 = r2(en - 0.4);
        if (d1 - d0 > 1.2) {
          const z2 = r2(prev.z * 1.035), dz = z2 - prev.z;
          T(`#${sid}-cam`, { scale: prev.z, x: prev.x, y: prev.y }, { scale: z2, x: r2(prev.x - G.cw / 2 * dz), y: r2(prev.y - G.ch / 2 * dz), duration: r2(d1 - d0), ease: 'none' }, d0);
        }
        T(`#${sid}-in`, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: 'power1.in' }, r2(en - 0.4));
      });
    });
  }
  html.push(`</div>`);
  if (S.kind !== 'intro') T(`#${id}-stage`, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power1.out' }, 0);
  T(`#${id}-stage`, { opacity: 1 }, { opacity: 0, duration: 0.45, ease: 'power1.in' }, r2(S.dur - 0.45));
  emit();

  const doc = `<template>
<style>${BASE_CSS}</style>
<div id="root" data-composition-id="${id}" data-width="${W}" data-height="${H}" data-duration="${S.dur}">
${html.join('\n')}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join('\n')}
window.__timelines = window.__timelines || {};
window.__timelines["${id}"] = tl;
</script>
</template>
`;
  fs.writeFileSync(ROOT + 'compositions/' + file, doc);
}

// ---- subtítulos ----
function chunks(text, max = 78) {
  const out = []; let rest = text.trim();
  while (rest.length > max) {
    const win = rest.slice(0, max + 1);
    let cut = Math.max(win.lastIndexOf('. '), win.lastIndexOf(': '), win.lastIndexOf('; '), win.lastIndexOf('? '));
    if (cut < max * 0.35) cut = win.lastIndexOf(', ');
    if (cut < max * 0.35) cut = win.lastIndexOf(' ');
    out.push(rest.slice(0, cut + 1).trim()); rest = rest.slice(cut + 1).trim();
  }
  if (rest) out.push(rest);
  return out;
}
function buildCaptions() {
  const groups = [];
  for (const S of plan) for (const L of S.lines) {
    const cs = chunks(L.text); let acc = 0;
    cs.forEach((c, i) => {
      const s = S.start + L.start + wordAt(L, acc);
      acc += c.length + 1;
      let e = S.start + L.start + wordEnd(L, Math.min(acc - 1, L.text.length)) + 0.25;
      if (i === cs.length - 1) e = Math.min(S.start + L.end - 0.15, S.start + L.start + L.dur + 0.7);
      groups.push({ text: c, s: r2(Math.max(0.2, s - 0.08)), e: r2(e) });
    });
  }
  for (let i = 0; i + 1 < groups.length; i++) groups[i].e = Math.min(groups[i].e, r2(groups[i + 1].s - 0.02));
  const html = groups.map((g, i) => `<div id="sub-g${i}" class="cap clip" data-start="${g.s}" data-duration="${r2(g.e - g.s)}"><span>${esc(g.text)}</span></div>`).join('\n');
  const js = groups.map((g, i) => `tl.fromTo("#sub-g${i} span", {opacity:0}, {opacity:1, duration:0.12}, ${g.s});`).join('\n');
  fs.writeFileSync(ROOT + 'compositions/subtitulos.html', `<template>
<style>
${FONT}
#root{position:absolute;inset:0;font-family:'Inter',sans-serif;}
#root .cap{position:absolute;left:0;top:${V ? 1700 : 872}px;width:${W}px;height:120px;display:flex;align-items:flex-end;justify-content:center;}
#root .cap span{display:inline-block;max-width:${V ? 960 : 1480}px;padding:12px 30px 14px;background:${C.ink};border-radius:14px;font-size:38px;font-weight:500;line-height:1.3;color:#FFFFFF;text-align:center;}
</style>
<div id="root" data-composition-id="subtitulos" data-width="${W}" data-height="${H}" data-duration="${TOTAL}">
${html}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js}
window.__timelines = window.__timelines || {};
window.__timelines["subtitulos"] = tl;
</script>
</template>
`);
  return groups.length;
}

// ---- voz: una sola pista con cada frase en su momento ----
function buildVoice() {
  const items = []; for (const S of plan) for (const L of S.lines) items.push({ id: L.id, at: S.start + L.start });
  const args = ['-v', 'error', '-y'];
  items.forEach(it => args.push('-i', ROOT + `assets/voz/${it.id}.wav`));
  const f = items.map((it, i) => `[${i}]adelay=${Math.round(it.at * 1000)}:all=1[a${i}]`).join(';') +
    ';' + items.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${items.length}:normalize=0:dropout_transition=0,apad=whole_dur=${TOTAL}[out]`;
  args.push('-filter_complex', f, '-map', '[out]', '-ar', '48000', '-ac', '2', '-t', String(TOTAL), ROOT + 'assets/voz/narracion.wav');
  execFileSync('ffmpeg', args, { stdio: 'inherit' });
}

// ---- índice ----
const FILES = Object.fromEntries(plan.map((S, i) => [S.id, `${String(i + 1).padStart(2, '0')}-${S.id}.html`]));
fs.mkdirSync(ROOT + 'compositions', { recursive: true });
for (const f of fs.readdirSync(ROOT + 'compositions')) if (f.endsWith('.html')) fs.unlinkSync(ROOT + 'compositions/' + f);
for (const S of plan) buildScene(S, FILES[S.id]);
const nCaps = buildCaptions();
if (!process.argv.includes('--no-audio')) buildVoice();

// --sin-subtitulos: el video sale solo con voz (sin la franja de texto abajo)
const SUBS = !process.argv.includes('--sin-subtitulos');
const hosts = plan.map(S => `      <div id="${S.id}" data-composition-id="${S.id}" data-composition-src="compositions/${FILES[S.id]}" data-start="${S.start}" data-duration="${S.dur}" data-track-index="1" data-track-kind="graphics" data-width="${W}" data-height="${H}"></div>`).join('\n');
fs.writeFileSync(ROOT + 'index.html', `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>${BRAND} · Guía de uso</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${C.bg}; }
      #main { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; }
      #main-bg { position: absolute; inset: 0; background: ${C.bg}; }
    </style>
  </head>
  <body>
    <div id="main" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="${W}" data-height="${H}">
      <div id="main-bg"></div>
${hosts}
${SUBS ? `      <div id="subtitulos" data-composition-id="subtitulos" data-composition-src="compositions/subtitulos.html" data-start="0" data-duration="${TOTAL}" data-track-index="2" data-track-kind="captions" data-width="${W}" data-height="${H}"></div>
` : ''}      <audio id="voz" class="clip" src="assets/voz/narracion.wav" data-start="0" data-duration="${TOTAL}" data-track-index="3" data-volume="1"></audio>
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`);
fs.writeFileSync(ROOT + 'tools/plan.json', JSON.stringify(plan.map(S => ({ id: S.id, start: S.start, dur: S.dur, lines: S.lines.map(l => ({ id: l.id, start: r2(S.start + l.start), dur: l.dur })) })), null, 1));
console.log('total', TOTAL, 's =', Math.floor(TOTAL / 60) + ':' + String(Math.round(TOTAL % 60)).padStart(2, '0'), '| subtítulos', nCaps);
for (const S of plan) console.log(S.id.padEnd(10), S.start, '+', S.dur);
