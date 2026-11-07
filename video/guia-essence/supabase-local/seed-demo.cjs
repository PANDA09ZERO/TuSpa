// Crea las 3 cuentas de prueba y las citas/cobros ficticios en la base LOCAL de demo.
// Uso: node seed-demo.cjs  (requiere DEMO_SUPABASE_URL, DEMO_SERVICE_KEY y DEMO_PASSWORD)
// Se niega a correr contra cualquier host que no sea local.
const { createClient } = require("../../../node_modules/@supabase/supabase-js");

const url = process.env.DEMO_SUPABASE_URL;
const key = process.env.DEMO_SERVICE_KEY;
const password = process.env.DEMO_PASSWORD;
if (!url || !key || !password) throw new Error("Faltan DEMO_SUPABASE_URL, DEMO_SERVICE_KEY o DEMO_PASSWORD");
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url)) throw new Error(`Solo se permite una base local, no ${url}`);

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const cuentas = [
  { email: "admin@demo.local", nombre: "Paola", apellido: "Ramírez", rol: "admin", cargo: "Administradora", especialidad: ["Gestión"] },
  { email: "recepcion@demo.local", nombre: "Diana", apellido: "Salazar", rol: "recepcionista", cargo: "Recepcionista", especialidad: ["Atención al cliente"] },
  { email: "especialista@demo.local", nombre: "Ana", apellido: "Torres", rol: "manicurista", cargo: "Especialista en uñas", especialidad: ["Manicure", "Pedicure"] },
];

function limaDate(offsetDays = 0) {
  const now = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(now);
}
function addMinutes(hhmm, minutes) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
async function must(promise, what) {
  const { data, error } = await promise;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

(async () => {
  const empleados = {};
  for (const c of cuentas) {
    const { data: created, error } = await db.auth.admin.createUser({ email: c.email, password, email_confirm: true, user_metadata: { name: `${c.nombre} ${c.apellido}` } });
    let userId = created?.user?.id;
    if (error) {
      if (!/already/i.test(error.message)) throw error;
      const list = await must(db.auth.admin.listUsers(), "listar usuarios");
      userId = list.users.find((u) => u.email === c.email).id;
      await must(db.auth.admin.updateUserById(userId, { password, user_metadata: { name: `${c.nombre} ${c.apellido}` } }), "actualizar contraseña");
    }
    const row = await must(db.from("empleados").upsert({
      email: c.email, nombre: c.nombre, apellido: c.apellido, rol: c.rol, cargo: c.cargo,
      especialidad: c.especialidad, telefono: "900 000 00" + Object.keys(empleados).length, auth_user_id: userId,
    }, { onConflict: "email" }).select("id").single(), `empleado ${c.email}`);
    empleados[c.rol] = row.id;
  }

  const servicios = Object.fromEntries((await must(db.from("servicios").select("id, nombre, precio, duracion"), "servicios")).map((s) => [s.nombre, s]));
  const clientes = Object.fromEntries((await must(db.from("clientes").select("id, nombre"), "clientes")).map((c) => [c.nombre, c.id]));

  const { count, error: countError } = await db.from("citas").select("id", { count: "exact", head: true });
  if (countError) throw new Error(`contar citas: ${countError.message}`);
  if (count) { console.log(`Ya hay ${count} citas; no se duplican.`); return done(); }

  const plan = [
    // [díaRelativo, hora, cliente|null, invitado, servicios, rolEmpleado, estado, notas]
    [-1, "10:00", "Lucía", null, ["Manicure spa"], "manicurista", "completada", null],
    [-1, "15:30", "Carmen", null, ["Masaje relajante"], "admin", "completada", null],
    [0, "09:30", "María", null, ["Manicure en gel", "Pedicure spa"], "manicurista", "confirmada", "Prefiere tonos nude."],
    [0, "11:00", null, ["Gabriela Paz", "999 111 222"], ["Limpieza facial profunda"], "recepcionista", "pendiente", "Primera visita."],
    [0, "12:30", "Valeria", null, ["Masaje descontracturante"], "admin", "en_progreso", null],
    [0, "16:00", "Rosa", null, ["Manicure spa"], "manicurista", "pendiente", null],
    [0, "17:30", "Sofía", null, ["Pedicure spa"], "manicurista", "confirmada", null],
    [1, "10:30", "Lucía", null, ["Masaje relajante"], "admin", "confirmada", null],
    [1, "14:00", "Carmen", null, ["Manicure en gel"], "manicurista", "pendiente", null],
    [2, "11:00", "María", null, ["Limpieza facial profunda"], null, "pendiente", null],
    [3, "09:00", "Valeria", null, ["Manicure spa"], "manicurista", "cancelada", "Reprogramará."],
  ];
  const creadas = [];
  for (const [dia, hora, cliente, invitado, nombresServ, rol, estado, notas] of plan) {
    const servs = nombresServ.map((n) => servicios[n]);
    const total = servs.reduce((s, x) => s + Number(x.precio), 0);
    const duracion = servs.reduce((s, x) => s + Number(x.duracion || 60), 0);
    const cita = await must(db.from("citas").insert({
      id_cliente: cliente ? clientes[cliente] : null, nombre_invitado: invitado?.[0] || null, telefono_invitado: invitado?.[1] || null,
      id_empleado: rol ? empleados[rol] : null, id_servicio: servs[0].id, fecha: limaDate(dia), hora_inicio: hora,
      hora_fin: addMinutes(hora, duracion), estado: estado === "completada" ? "confirmada" : estado, notas, total,
    }).select("id").single(), `cita ${hora}`);
    await must(db.from("cita_detalles").insert(servs.map((s) => ({ id_cita: cita.id, id_servicio: s.id, cantidad: 1, precio_unitario: s.precio, subtotal: s.precio }))), "detalle");
    creadas.push({ id: cita.id, estado });
  }

  // Cobros de ayer mediante la misma función que usa la caja (marca la cita como completada).
  const promo = (await must(db.from("promociones").select("id").eq("nombre", "Promo Noviembre").single(), "promo")).id;
  const cobros = creadas.filter((c) => c.estado === "completada");
  await must(db.rpc("cobrar_cita", { p_id_cita: cobros[0].id, p_metodo_pago: "yape", p_descuento_manual: 0, p_tipo_descuento: "porcentaje", p_id_promocion: promo, p_observaciones: null, p_adicionales: [{ concepto: "Decoración de uñas", monto: 10 }] }), "cobro 1");
  await must(db.rpc("cobrar_cita", { p_id_cita: cobros[1].id, p_metodo_pago: "efectivo", p_descuento_manual: 10, p_tipo_descuento: "monto_fijo", p_id_promocion: null, p_observaciones: "Cliente frecuente", p_adicionales: [] }), "cobro 2");
  await must(db.from("movimientos_caja").insert({ tipo: "egreso", concepto: "Compra de esmaltes", monto: 35, metodo_pago: "efectivo" }), "egreso");
  return done();

  function done() { console.log("Listo:", Object.keys(empleados).join(", ")); }
})().catch((e) => { console.error(e.message); process.exit(1); });
