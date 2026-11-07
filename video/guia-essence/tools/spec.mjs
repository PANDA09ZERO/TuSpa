// Guion visual: qué captura se ve y qué se señala en cada frase de la narración.
// img: nombre en assets/ (escritorio 1440×900) o 'movil/…' (celular 390×844).
// focus: [palabra clave del texto, caja {x,y,w,h} en px CSS de la captura]. El foco aparece cuando la voz la nombra.
// at: palabra que marca el cambio a la siguiente captura dentro de la misma frase.

const B = {
  // escritorio (medidas tomadas con Playwright en la demo)
  sidebar: { x: 0, y: 116, w: 239, h: 590 }, admin: { x: 16, y: 505, w: 207, h: 120 }, vitrina: { x: 16, y: 722, w: 207, h: 162 },
  user: { x: 1192, y: 18, w: 210, h: 44 }, logout: { x: 1349, y: 18, w: 44, h: 44 }, metricas: { x: 272, y: 240, w: 1121, h: 186 },
  proximas: { x: 272, y: 454, w: 705, h: 440 }, accesos: { x: 1001, y: 454, w: 392, h: 310 },
  loginForm: { x: 528, y: 418, w: 384, h: 243 }, loginBtn: { x: 528, y: 614, w: 384, h: 48 }, loginErr: { x: 528, y: 386, w: 384, h: 46 },
  agNueva: { x: 1240, y: 125, w: 153, h: 48 }, agStats: { x: 272, y: 205, w: 1121, h: 162 }, agFiltros: { x: 272, y: 390, w: 1121, h: 94 },
  agCal: { x: 272, y: 508, w: 739, h: 392 }, agHoy: { x: 800, y: 704, w: 104, h: 80 }, agPeriodo: { x: 1035, y: 508, w: 358, h: 392 }, agPagar: { x: 1072, y: 721, w: 284, h: 44 },
  dlgDia: { x: 377, y: 155, w: 671, h: 590 }, dlgDetalle: { x: 377, y: 40, w: 671, h: 820 }, dlgCita: { x: 456, y: 60, w: 510, h: 830 },
  dlgInvitado: { x: 384, y: 120, w: 552, h: 650 }, dlgForm: { x: 470, y: 110, w: 500, h: 640 },
  clBuscar: { x: 297, y: 405, w: 1071, h: 44 }, clNuevo: { x: 1218, y: 125, w: 175, h: 48 }, clLapiz: { x: 1256, y: 657, w: 44, h: 44 }, clPapelera: { x: 1308, y: 657, w: 44, h: 44 },
  catNueva: { x: 1213, y: 125, w: 195, h: 48 }, catGrid: { x: 272, y: 205, w: 1136, h: 247 }, svNuevo: { x: 1211, y: 125, w: 182, h: 48 }, svGrid: { x: 272, y: 452, w: 1121, h: 448 },
  prNueva: { x: 1207, y: 125, w: 201, h: 48 }, prLista: { x: 272, y: 205, w: 1136, h: 500 }, eqNuevo: { x: 1211, y: 161, w: 197, h: 48 }, eqEditar: { x: 293, y: 572, w: 159, h: 38 },
  cjDia: { x: 272, y: 205, w: 1121, h: 114 }, cjStats: { x: 272, y: 378, w: 1121, h: 162 }, cjCobrar: { x: 272, y: 564, w: 548, h: 336 }, cjEgreso: { x: 844, y: 564, w: 548, h: 336 },
  cjForm: { x: 272, y: 80, w: 560, h: 780 }, cjDetalle: { x: 464, y: 147, w: 512, h: 630 }, cjCierre: { x: 470, y: 60, w: 500, h: 800 },
  rpStats: { x: 272, y: 205, w: 1136, h: 162 }, rpGraf: { x: 272, y: 390, w: 1136, h: 350 },
  pubNav: { x: 787, y: 16, w: 534, h: 46 }, pubCtas: { x: 104, y: 446, w: 700, h: 46 },
  // celular (px CSS del teléfono 390×844)
  mInstalar: { x: 12, y: 105, w: 366, h: 140 }, mPasos: { x: 12, y: 235, w: 366, h: 290 }, mNav: { x: 0, y: 778, w: 390, h: 66 }, mMenu: { x: 0, y: 100, w: 390, h: 520 },
};

export const scenes = [
  { id: 'apertura', label: 'Apertura', kind: 'intro', lines: [{ id: 'a1' }] },
  {
    id: 'ingreso', label: '1 · Ingresar al sistema',
    lines: [
      { id: 'i1', step: 'Escribe tu email y contraseña', shots: [{ img: '02-login', url: 'tuspa.pe/login', focus: [['dirección', 'urlbar'], ['email', B.loginForm], ['Iniciar sesión', B.loginBtn]] }] },
      { id: 'i2', step: 'Si un dato está mal', shots: [{ img: '02b-login-error', url: 'tuspa.pe/login', focus: [['aviso', B.loginErr]] }] },
      { id: 'i3', step: 'Cerrar sesión', shots: [{ img: '03-resumen-admin', url: 'tuspa.pe/dashboard', focus: [['cerrar sesión', B.logout]] }] },
    ],
  },
  {
    id: 'panel', label: '2 · Conoce el panel',
    lines: [
      { id: 'p1', step: 'El menú lateral', shots: [{ img: '03-resumen-admin', url: 'tuspa.pe/dashboard', focus: [['menú', B.sidebar], ['administración', B.admin], ['Ver página pública', B.vitrina]] }] },
      { id: 'p2', step: 'Así va tu día', shots: [{ img: '03-resumen-admin', url: 'tuspa.pe/dashboard', focus: [['nombre', B.user], ['citas de hoy', B.metricas]] }] },
      { id: 'p3', step: 'Próximas citas y accesos', shots: [{ img: '03-resumen-admin', url: 'tuspa.pe/dashboard', focus: [['próximas citas', B.proximas], ['accesos', B.accesos]] }] },
    ],
  },
  {
    id: 'agenda', label: '3 · Agenda de citas',
    lines: [
      { id: 'g1', step: 'Tu agenda del mes', shots: [{ img: '04-agenda', url: 'tuspa.pe/dashboard/citas', focus: [['contadores', B.agStats], ['calendario', B.agCal], ['remarcado', B.agHoy]] }] },
      { id: 'g2', step: 'Un punto por cita', shots: [{ img: '05b-calendario-puntos', url: 'tuspa.pe/dashboard/citas', focus: [['punto', B.agHoy]] }] },
      { id: 'g3', step: 'Las clientas del día', shots: [{ img: '04b-agenda-citas-del-dia', url: 'tuspa.pe/dashboard/citas', focus: [['clientas', B.dlgDia]] }] },
      { id: 'g4', step: 'Detalle de la cita', shots: [{ img: '05d-detalle-cita', url: 'tuspa.pe/dashboard/citas', focus: [['detalle', B.dlgDetalle]] }] },
      { id: 'g5', step: 'Nueva cita', shots: [
        { img: '05e-nueva-cita-vacia', url: 'tuspa.pe/dashboard/citas', focus: [['Nueva cita', B.dlgCita]] },
        { img: '05e2-buscar-cliente', url: 'tuspa.pe/dashboard/citas', at: 'Busca', focus: [] },
        { img: '05e3-nueva-cita-servicios', url: 'tuspa.pe/dashboard/citas', at: 'Agrega', focus: [] },
      ] },
      { id: 'g6', step: 'Especialista, fecha y hora', shots: [{ img: '05e3-nueva-cita-servicios', url: 'tuspa.pe/dashboard/citas', focus: [['fecha', B.dlgCita]] }] },
      { id: 'g7', step: 'Editar y cambiar estado', shots: [{ img: '05g-editar-cita', url: 'tuspa.pe/dashboard/citas', focus: [['Editar cita', B.dlgCita]] }] },
      { id: 'g8', step: 'Invitada → clienta', shots: [
        { img: '05h-cita-invitado', url: 'tuspa.pe/dashboard/citas', focus: [['invitada', B.dlgDetalle]] },
        { img: '05h2-registrar-invitado', url: 'tuspa.pe/dashboard/citas', at: 'regístrala', focus: [] },
      ] },
      { id: 'g9', step: 'Filtros y Pagar cita', shots: [
        { img: '05i-filtros', url: 'tuspa.pe/dashboard/citas', focus: [['Filtra', B.agFiltros]] },
        { img: '04-agenda', url: 'tuspa.pe/dashboard/citas', at: 'Citas del período', focus: [['Pagar cita', B.agPagar]] },
      ] },
    ],
  },
  {
    id: 'clientes', label: '4 · Clientes',
    lines: [
      { id: 'c1', step: 'Busca a tus clientas', shots: [
        { img: '06a-clientes', url: 'tuspa.pe/dashboard/clientes', focus: [['buscas', B.clBuscar]] },
        { img: '06a2-clientes-buscar', url: 'tuspa.pe/dashboard/clientes', at: 'teléfono', focus: [] },
      ] },
      { id: 'c2', step: 'Nuevo cliente', shots: [{ img: '06b-nuevo-cliente', url: 'tuspa.pe/dashboard/clientes', focus: [['registras', B.dlgForm]] }] },
      { id: 'c3', step: 'Editar con el lápiz', shots: [
        { img: '06a-clientes', url: 'tuspa.pe/dashboard/clientes', focus: [['lápiz', B.clLapiz]] },
        { img: '06c-editar-cliente', url: 'tuspa.pe/dashboard/clientes', at: 'corriges', focus: [] },
      ] },
      { id: 'c4', step: 'Eliminar (Administrador)', shots: [
        { img: '06a-clientes', url: 'tuspa.pe/dashboard/clientes', focus: [['eliminar', B.clPapelera]] },
        { img: '06d-eliminar-protegido', url: 'tuspa.pe/dashboard/clientes', at: 'protege', focus: [] },
      ] },
    ],
  },
  {
    id: 'catalogo', label: '5 · Catálogo y equipo',
    lines: [
      { id: 'k1', step: 'Categorías', shots: [
        { img: '07a-categorias', url: 'tuspa.pe/dashboard/categorias', focus: [['categorías', B.catGrid]] },
        { img: '07a2-nueva-categoria', url: 'tuspa.pe/dashboard/categorias', at: 'agrupan', focus: [] },
      ] },
      { id: 'k2', step: 'Servicios', shots: [
        { img: '07b-servicios', url: 'tuspa.pe/dashboard/servicios', focus: [['servicios', B.svGrid]] },
        { img: '07b2-nuevo-servicio', url: 'tuspa.pe/dashboard/servicios', at: 'precio', focus: [] },
      ] },
      { id: 'k3', step: 'Promociones', shots: [
        { img: '07c-promociones', url: 'tuspa.pe/dashboard/promociones', focus: [['promociones', B.prLista]] },
        { img: '07c2-nueva-promocion', url: 'tuspa.pe/dashboard/promociones', at: 'vigencia', focus: [] },
      ], badge: 'Solo Administrador puede modificar' },
      { id: 'k4', step: 'Equipo', shots: [
        { img: '07d-equipo', url: 'tuspa.pe/dashboard/empleados', focus: [['Equipo', B.eqNuevo]] },
        { img: '07d2-editar-empleado', url: 'tuspa.pe/dashboard/empleados', at: 'asigna', focus: [] },
      ], badge: 'Solo Administrador puede modificar' },
    ],
  },
  {
    id: 'caja', label: '6 · Caja y cobros',
    lines: [
      { id: 'j1', step: 'Tu caja del día', shots: [{ img: '05-caja', url: 'tuspa.pe/dashboard/caja', focus: [['día', B.cjDia], ['ingresos', B.cjStats]] }], badge: 'Administrador y Recepción' },
      { id: 'j2', step: 'Elige la cita', shots: [{ img: '08b-cobrar-seleccion', url: 'tuspa.pe/dashboard/caja', focus: [] }], badge: 'Administrador y Recepción' },
      { id: 'j3', step: 'Adicionales', shots: [{ img: '08c-adicionales', url: 'tuspa.pe/dashboard/caja', focus: [] }], badge: 'Administrador y Recepción' },
      { id: 'j4', step: 'Promoción, descuento y pago', shots: [{ img: '08d-descuento-promo', url: 'tuspa.pe/dashboard/caja', focus: [['promoción', B.cjForm]] }], badge: 'Administrador y Recepción' },
      { id: 'j5', step: 'Pago registrado', shots: [{ img: '08e-pago-registrado', url: 'tuspa.pe/dashboard/caja', focus: [['ingreso', B.cjStats]] }], badge: 'Administrador y Recepción' },
      { id: 'j6', step: 'Registrar egreso', shots: [{ img: '08f-egreso', url: 'tuspa.pe/dashboard/caja', focus: [] }], badge: 'Administrador y Recepción' },
      { id: 'j7', step: 'Movimientos y detalle', shots: [
        { img: '08g-movimientos', url: 'tuspa.pe/dashboard/caja', focus: [] },
        { img: '08g2-detalle-cobro', url: 'tuspa.pe/dashboard/caja', at: 'Toca', focus: [['detalle', B.cjDetalle]] },
      ], badge: 'Administrador y Recepción' },
      { id: 'j8', step: 'Cierre de caja', shots: [{ img: '08h-cierre-caja', url: 'tuspa.pe/dashboard/caja', focus: [['cierre', B.cjCierre]] }], badge: 'Administrador y Recepción' },
      { id: 'j9', step: 'Historial y reabrir', shots: [
        { img: '08i-historial-cierres', url: 'tuspa.pe/dashboard/caja', focus: [] },
        { img: '08i2-reabrir', url: 'tuspa.pe/dashboard/caja', at: 'reabre', focus: [] },
      ], badge: 'Administrador y Recepción' },
    ],
  },
  {
    id: 'reportes', label: '7 · Reportes',
    lines: [{ id: 'r1', step: 'Cómo va tu negocio', shots: [{ img: '09-reportes', url: 'tuspa.pe/dashboard/reportes', focus: [['ingresos', B.rpStats], ['servicios más pedidos', B.rpGraf]] }] }],
  },
  {
    id: 'publica', label: '8 · Tu página pública',
    lines: [
      { id: 'v1', step: 'Tu vitrina digital', shots: [{ img: '01-publica-portada', url: 'tuspa.pe', focus: [['vitrina', B.pubCtas]] }] },
      { id: 'v2', step: 'Buscar y filtrar', shots: [
        { img: 'P2-busqueda', url: 'tuspa.pe/#servicios', focus: [] },
        { img: 'P2b-filtro-categoria', url: 'tuspa.pe/#servicios', at: 'filtran', focus: [] },
      ] },
      { id: 'v3', step: 'Detalle del servicio', shots: [{ img: 'P3-detalle-servicio', url: 'tuspa.pe/#servicios', focus: [] }] },
      { id: 'v4', step: 'Promociones vigentes', shots: [
        { img: 'P4-promociones', url: 'tuspa.pe/#promociones', focus: [] },
        { img: 'P4b-promo-elegida', url: 'tuspa.pe/#promociones', at: 'elegir', focus: [] },
      ] },
      { id: 'v5', step: 'El pedido por WhatsApp', shots: [
        { img: 'P5-servicios-elegidos', url: 'tuspa.pe/#servicios', focus: [] },
        { img: 'P5b-tu-seleccion', url: 'tuspa.pe/#servicios', at: 'total estimado', focus: [] },
      ] },
      { id: 'v6', step: 'Galería y Cómo llegar', shots: [
        { img: 'P6b-galeria-completa', url: 'tuspa.pe', focus: [] },
        { img: 'P6c-pie-como-llegar', url: 'tuspa.pe', at: 'Cómo llegar', focus: [] },
      ] },
      { id: 'v7', step: 'También en el celular', shots: [
        { img: 'movil/P8-publica-movil', focus: [] },
        { img: 'movil/P8d-publica-pedido', at: 'adapta', focus: [] },
      ] },
    ],
  },
  {
    id: 'celular', label: '9 · Tu sistema en el celular',
    lines: [
      { id: 'm1', step: 'Instalar sistema', shots: [
        { img: 'movil/M0-login-movil', focus: [] },
        { img: 'movil/M1-resumen-instalar', at: 'invita', focus: [['Instalar sistema', B.mInstalar]] },
      ] },
      { id: 'm2', step: 'En Android', shots: [{ img: 'movil/M2-instrucciones-android', focus: [['tres pasos', B.mPasos]] }] },
      { id: 'm3', step: 'En iPhone', shots: [{ img: 'movil/M3-instrucciones-iphone', focus: [['Compartir', B.mPasos]] }] },
      { id: 'm4', home: true, step: 'Anclado a tu inicio' },
      { id: 'm5', step: 'Moverte con el pulgar', shots: [
        { img: 'movil/M1-resumen-instalar', focus: [['accesos rápidos', B.mNav]] },
        { img: 'movil/M5-menu-movil', at: 'menú', focus: [] },
        { img: 'movil/M5b-especialista-sin-caja', at: 'especialista', focus: [['caja', B.mNav]] },
      ] },
      { id: 'm6', step: 'Tu agenda en el teléfono', shots: [
        { img: 'movil/M6b-calendario-movil', focus: [] },
        { img: 'movil/M6c-citas-dia-movil', at: 'citas del día', focus: [] },
        { img: 'movil/M6d-detalle-movil', at: 'detalle', focus: [] },
      ] },
      { id: 'm7', step: 'Nueva cita y reloj táctil', shots: [
        { img: 'movil/M6e-nueva-cita-movil', focus: [] },
        { img: 'movil/M6f-reloj-movil', at: 'reloj', focus: [] },
      ] },
      { id: 'm8', step: 'Clientes y cobros', shots: [
        { img: 'movil/M7-clientes-movil', focus: [] },
        { img: 'movil/M7c-cobrar-movil', at: 'cobra', focus: [] },
      ] },
    ],
  },
  {
    id: 'roles', label: '10 · ¿Qué puede hacer cada usuario?',
    lines: [{ id: 'ro1', roles: true }, { id: 'ro2', matrix: true }],
  },
  {
    id: 'cierre', label: 'Cierre', kind: 'outro',
    lines: [{ id: 'o1', note: true }, { id: 'o2', end: true }],
  },
];
