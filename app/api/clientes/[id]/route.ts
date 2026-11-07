import { NextRequest, NextResponse } from "next/server";
import { requireEmployeeRequest } from "@/lib/employee-api-auth";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { isUuid, optionalText, readJsonObject, requiredText } from "@/lib/api-input";

type RouteContext = { params: Promise<{ id: string }> };

const CLIENTE_COLUMNS = "id, nombre, apellido, telefono, email";

function duplicateEmail(error: { code?: string } | null) {
  return error?.code === "23505";
}

/** Cualquier empleado puede corregir los datos de un cliente (igual que registrarlo). */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await requireEmployeeRequest(request);
  if ("error" in session) return session.error;

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Cliente no válido" }, { status: 400 });

  const body = await readJsonObject(request);
  if (!body) return NextResponse.json({ error: "El cuerpo de la solicitud no es válido" }, { status: 400 });

  const nombre = requiredText(body.nombre, 120);
  if (!nombre) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  const apellido = requiredText(body.apellido, 120);
  if (!apellido) return NextResponse.json({ error: "El apellido es obligatorio" }, { status: 400 });
  const email = optionalText(body.email, 160)?.toLowerCase() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "El email no es válido" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("clientes")
    .update({ nombre, apellido, email, telefono: optionalText(body.telefono, 40), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(CLIENTE_COLUMNS)
    .maybeSingle();
  if (duplicateEmail(error)) return NextResponse.json({ error: "Ya existe otro cliente con ese email" }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "No se encontró el cliente" }, { status: 404 });
  return NextResponse.json({ data });
}

/**
 * Solo el Administrador elimina clientes, y solo si no tienen citas ni pagos:
 * borrar un cliente borraría en cascada su historial de citas.
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await requireEmployeeRequest(request, { roles: ["admin"], message: "Solo un administrador puede eliminar clientes" });
  if ("error" in session) return session.error;

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Cliente no válido" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data: cliente, error: lookupError } = await supabase.from("clientes").select("id, nombre, apellido").eq("id", id).maybeSingle();
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 400 });
  if (!cliente) return NextResponse.json({ error: "No se encontró el cliente" }, { status: 404 });

  const [citas, pagos] = await Promise.all([
    supabase.from("citas").select("id", { count: "exact", head: true }).eq("id_cliente", id),
    supabase.from("pagos").select("id", { count: "exact", head: true }).eq("id_cliente", id),
  ]);
  if (citas.error || pagos.error) return NextResponse.json({ error: (citas.error || pagos.error)!.message }, { status: 400 });
  if (citas.count || pagos.count) {
    return NextResponse.json({
      error: `No se puede eliminar a ${cliente.nombre} ${cliente.apellido} porque tiene citas o pagos registrados. Así se conserva su historial.`,
    }, { status: 409 });
  }

  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
