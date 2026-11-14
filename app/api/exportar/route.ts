import { NextRequest, NextResponse } from "next/server";
import { requireEmployeeRequest } from "@/lib/employee-api-auth";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { LIMA_TIME_ZONE, limaTodayKey } from "@/lib/lima-time";
import { buildXlsx, type XlsxSheet } from "@/lib/xlsx";

/**
 * Exporta todos los datos del negocio a un Excel (una hoja por tema).
 * Solo el Administrador: incluye datos personales de clientas y equipo.
 * Nunca exporta contraseñas ni identificadores de acceso.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMIN_ONLY = { roles: ["admin"], message: "Solo un administrador puede exportar los datos del negocio" };
const PAGE_SIZE = 1000;

type Row = Record<string, unknown>;
type Db = ReturnType<typeof createSupabaseAdminClient>;

async function fetchAll(db: Db, table: string, columns: string, order = "created_at", optional = false): Promise<Row[]> {
  const rows: Row[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await db.from(table).select(columns).order(order, { ascending: true }).range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      // Tablas de migraciones opcionales (p. ej. cierres_caja) pueden no existir.
      if (optional) return [];
      throw new Error(`No se pudo leer «${table}»: ${error.message}`);
    }
    const page = (data || []) as unknown as Row[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

const dateTimeFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: LIMA_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
});

/** Fecha y hora en Lima: «2026-11-14 18:05». */
function limaDateTime(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = Object.fromEntries(dateTimeFormat.formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour === "24" ? "00" : parts.hour}:${parts.minute}`;
}

const text = (value: unknown) => (value === null || value === undefined ? "" : Array.isArray(value) ? value.join(", ") : String(value));
const money = (value: unknown) => {
  const n = Number(value);
  return value === null || value === undefined || value === "" || !Number.isFinite(n) ? null : n;
};
const fullName = (row: Row | undefined) => (row ? `${text(row.nombre)} ${text(row.apellido)}`.trim() : "");

const ROLE_LABELS: Record<string, string> = { admin: "Administrador", recepcionista: "Recepción", manicurista: "Especialista" };

export async function GET(request: NextRequest) {
  const session = await requireEmployeeRequest(request, ADMIN_ONLY);
  if ("error" in session) return session.error;

  try {
    const db = createSupabaseAdminClient();
    const [clientes, empleados, servicios, categorias, promociones, citas, detalles, pagos, adicionales, movimientos, cierres] = await Promise.all([
      fetchAll(db, "clientes", "id, nombre, apellido, email, telefono, direccion, fecha_nacimiento, created_at"),
      fetchAll(db, "empleados", "id, nombre, apellido, email, telefono, cargo, rol, especialidad, created_at"),
      fetchAll(db, "servicios", "id, nombre, categoria, descripcion, precio, duracion, estado, created_at"),
      fetchAll(db, "categorias", "id, nombre, descripcion, created_at"),
      fetchAll(db, "promociones", "id, nombre, descripcion, descuento, fecha_inicio, fecha_fin, activa, created_at"),
      fetchAll(db, "citas", "id, id_cliente, id_empleado, id_servicio, fecha, hora_inicio, hora_fin, estado, notas, total, nombre_invitado, telefono_invitado, created_at", "fecha"),
      fetchAll(db, "cita_detalles", "id_cita, id_servicio, cantidad, precio_unitario, subtotal, created_at", "created_at"),
      fetchAll(db, "pagos", "id, id_cita, id_cliente, id_promocion, subtotal, descuento, tipo_descuento, total, metodo_pago, referencia, observaciones, estado, created_at", "created_at"),
      fetchAll(db, "pago_adicionales", "id_pago, concepto, monto, created_at", "created_at"),
      fetchAll(db, "movimientos_caja", "tipo, concepto, monto, metodo_pago, referencia, observaciones, created_at", "created_at"),
      fetchAll(db, "cierres_caja", "fecha, total_ingresos, total_egresos, balance, efectivo_esperado, efectivo_contado, diferencia, observaciones, cerrado_por_nombre, created_at", "fecha", true),
    ]);

    const byId = (rows: Row[]) => new Map(rows.map((row) => [String(row.id), row]));
    const clientesById = byId(clientes);
    const empleadosById = byId(empleados);
    const serviciosById = byId(servicios);
    const promocionesById = byId(promociones);
    const citasById = byId(citas);

    const serviciosPorCita = new Map<string, string[]>();
    for (const d of detalles) {
      const key = String(d.id_cita);
      const nombre = text(serviciosById.get(String(d.id_servicio))?.nombre) || "Servicio eliminado";
      const cantidad = Number(d.cantidad) > 1 ? ` x${d.cantidad}` : "";
      serviciosPorCita.set(key, [...(serviciosPorCita.get(key) || []), nombre + cantidad]);
    }
    const adicionalesPorPago = new Map<string, string[]>();
    for (const a of adicionales) {
      const key = String(a.id_pago);
      adicionalesPorPago.set(key, [...(adicionalesPorPago.get(key) || []), `${text(a.concepto)} (S/ ${Number(a.monto).toFixed(2)})`]);
    }

    const clienteDeCita = (cita: Row) => {
      const cliente = clientesById.get(String(cita.id_cliente));
      return cliente ? { nombre: fullName(cliente), telefono: text(cliente.telefono), tipo: "Cliente" } : { nombre: text(cita.nombre_invitado), telefono: text(cita.telefono_invitado), tipo: "Invitado" };
    };

    const sheets: XlsxSheet[] = [
      {
        name: "Clientes",
        columns: [{ header: "Nombre", width: 18 }, { header: "Apellido", width: 18 }, { header: "Teléfono", width: 14 }, { header: "Email", width: 28 }, { header: "Dirección", width: 30 }, { header: "Fecha de nacimiento", width: 18 }, { header: "Registrada el", width: 18 }],
        rows: clientes.map((c) => [text(c.nombre), text(c.apellido), text(c.telefono), text(c.email), text(c.direccion), text(c.fecha_nacimiento), limaDateTime(c.created_at)]),
      },
      {
        name: "Citas",
        columns: [{ header: "Fecha", width: 12 }, { header: "Hora inicio", width: 11 }, { header: "Hora fin", width: 10 }, { header: "Cliente", width: 24 }, { header: "Tipo", width: 10 }, { header: "Teléfono", width: 14 }, { header: "Especialista", width: 22 }, { header: "Servicios", width: 36 }, { header: "Estado", width: 12 }, { header: "Total (S/)", width: 11 }, { header: "Notas", width: 30 }, { header: "Creada el", width: 18 }],
        rows: citas.map((cita) => {
          const cliente = clienteDeCita(cita);
          const servs = serviciosPorCita.get(String(cita.id)) || [text(serviciosById.get(String(cita.id_servicio))?.nombre)].filter(Boolean);
          return [text(cita.fecha), text(cita.hora_inicio), text(cita.hora_fin), cliente.nombre, cliente.tipo, cliente.telefono, fullName(empleadosById.get(String(cita.id_empleado))), servs.join(", "), text(cita.estado), money(cita.total), text(cita.notas), limaDateTime(cita.created_at)];
        }),
      },
      {
        name: "Pagos",
        columns: [{ header: "Fecha y hora", width: 18 }, { header: "Cliente", width: 24 }, { header: "Fecha de la cita", width: 15 }, { header: "Subtotal (S/)", width: 12 }, { header: "Adicionales", width: 30 }, { header: "Descuento (S/)", width: 13 }, { header: "Tipo de descuento", width: 16 }, { header: "Promoción", width: 20 }, { header: "Total (S/)", width: 11 }, { header: "Método de pago", width: 15 }, { header: "Referencia", width: 16 }, { header: "Estado", width: 10 }, { header: "Observaciones", width: 30 }],
        rows: pagos.map((p) => {
          const cita = citasById.get(String(p.id_cita));
          const cliente = clientesById.get(String(p.id_cliente));
          return [limaDateTime(p.created_at), cliente ? fullName(cliente) : cita ? clienteDeCita(cita).nombre : "", text(cita?.fecha), money(p.subtotal), (adicionalesPorPago.get(String(p.id)) || []).join("; "), money(p.descuento), text(p.tipo_descuento), text(promocionesById.get(String(p.id_promocion))?.nombre), money(p.total), text(p.metodo_pago), text(p.referencia), text(p.estado), text(p.observaciones)];
        }),
      },
      {
        name: "Movimientos de caja",
        columns: [{ header: "Fecha y hora", width: 18 }, { header: "Tipo", width: 10 }, { header: "Concepto", width: 32 }, { header: "Monto (S/)", width: 11 }, { header: "Método de pago", width: 15 }, { header: "Referencia", width: 16 }, { header: "Observaciones", width: 30 }],
        rows: movimientos.map((m) => [limaDateTime(m.created_at), text(m.tipo), text(m.concepto), money(m.monto), text(m.metodo_pago), text(m.referencia), text(m.observaciones)]),
      },
      {
        name: "Cierres de caja",
        columns: [{ header: "Día", width: 12 }, { header: "Ingresos (S/)", width: 13 }, { header: "Egresos (S/)", width: 12 }, { header: "Balance (S/)", width: 12 }, { header: "Efectivo esperado (S/)", width: 20 }, { header: "Efectivo contado (S/)", width: 19 }, { header: "Diferencia (S/)", width: 14 }, { header: "Cerrado por", width: 22 }, { header: "Observaciones", width: 30 }],
        rows: cierres.map((c) => [text(c.fecha), money(c.total_ingresos), money(c.total_egresos), money(c.balance), money(c.efectivo_esperado), money(c.efectivo_contado), money(c.diferencia), text(c.cerrado_por_nombre), text(c.observaciones)]),
      },
      {
        name: "Servicios",
        columns: [{ header: "Nombre", width: 28 }, { header: "Categoría", width: 16 }, { header: "Precio (S/)", width: 11 }, { header: "Duración (min)", width: 14 }, { header: "Estado", width: 10 }, { header: "Descripción", width: 40 }],
        rows: servicios.map((s) => [text(s.nombre), text(s.categoria), money(s.precio), money(s.duracion), text(s.estado), text(s.descripcion)]),
      },
      {
        name: "Categorías",
        columns: [{ header: "Nombre", width: 22 }, { header: "Descripción", width: 40 }],
        rows: categorias.map((c) => [text(c.nombre), text(c.descripcion)]),
      },
      {
        name: "Promociones",
        columns: [{ header: "Nombre", width: 24 }, { header: "Descuento (%)", width: 13 }, { header: "Desde", width: 12 }, { header: "Hasta", width: 12 }, { header: "Activa", width: 8 }, { header: "Descripción", width: 40 }],
        rows: promociones.map((p) => [text(p.nombre), money(p.descuento), text(p.fecha_inicio), text(p.fecha_fin), Boolean(p.activa), text(p.descripcion)]),
      },
      {
        name: "Equipo",
        columns: [{ header: "Nombre", width: 18 }, { header: "Apellido", width: 18 }, { header: "Rol", width: 14 }, { header: "Cargo", width: 18 }, { header: "Email", width: 28 }, { header: "Teléfono", width: 14 }, { header: "Especialidad", width: 24 }],
        rows: empleados.map((e) => [text(e.nombre), text(e.apellido), ROLE_LABELS[text(e.rol)] || text(e.rol), text(e.cargo), text(e.email), text(e.telefono), text(e.especialidad)]),
      },
    ];

    const file = buildXlsx(sheets);
    const filename = `datos-${limaTodayKey()}.xlsx`;
    return new NextResponse(file as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo generar el archivo" }, { status: 500 });
  }
}
