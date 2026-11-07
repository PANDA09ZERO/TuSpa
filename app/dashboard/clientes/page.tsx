"use client";

import { FormEvent, useEffect, useState } from "react";
import { Search, Edit2, Trash2, User, X } from "lucide-react";
import StatsCard from "@/components/bento/StatCard";
import CreateResourceModal from "@/components/forms/CreateResourceModal";
import { useSupabase } from "@/components/layout/SupabaseProvider";
import { apiFetch } from "@/lib/api-fetch";

interface Cliente { id: string; nombre: string; apellido: string; telefono: string | null; email: string | null; }

const emptyForm = { nombre: "", apellido: "", telefono: "", email: "" };

export default function ClientesPage() {
  const { user } = useSupabase();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const loadClientes = () => {
    apiFetch("/api/clientes").then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error); setClientes(result.data || []); }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los clientes"));
  };

  useEffect(() => { loadClientes(); }, []);

  const term = search.trim().toLowerCase();
  const filtered = clientes.filter(c =>
    `${c.nombre} ${c.apellido}`.toLowerCase().includes(term) || (c.telefono || "").includes(term) || (c.email || "").toLowerCase().includes(term)
  );

  const abrirEdicion = (cliente: Cliente) => {
    setEditando(cliente);
    setForm({ nombre: cliente.nombre, apellido: cliente.apellido, telefono: cliente.telefono || "", email: cliente.email || "" });
    setFormError("");
  };

  const guardarCliente = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editando) return;
    setGuardando(true); setFormError("");
    try {
      const response = await apiFetch(`/api/clientes/${editando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: form.nombre.trim(), apellido: form.apellido.trim(), telefono: form.telefono.trim() || null, email: form.email.trim() || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo actualizar el cliente");
      setEditando(null);
      loadClientes();
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "No se pudo actualizar el cliente");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarCliente = async (cliente: Cliente) => {
    if (!window.confirm(`¿Eliminar a ${cliente.nombre} ${cliente.apellido}? Esta acción no se puede deshacer.`)) return;
    setEliminando(cliente.id); setError("");
    try {
      const response = await apiFetch(`/api/clientes/${cliente.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo eliminar el cliente");
      loadClientes();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el cliente");
    } finally {
      setEliminando(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-green">Clientes</h1>
          <p className="text-brand-text-light mt-1">Gestiona tu base de datos de clientes</p>
        </div>
        <CreateResourceModal title="Cliente" endpoint="/api/clientes" fields={[{ name: "nombre", label: "Nombre", required: true }, { name: "apellido", label: "Apellido", required: true }, { name: "telefono", label: "Teléfono", required: true }, { name: "email", label: "Email", type: "email" }]} onCreated={() => loadClientes()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <StatsCard icon={User} label="Total Clientes" value={clientes.length} />
      </div>

      <div className="bento-card">
        <div className="flex items-center gap-3 mb-4">
          <Search className="text-brand-text-light" size={20} />
          <input
            type="text"
            placeholder="Buscar cliente..."
            aria-label="Buscar cliente por nombre, teléfono o email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field border-none shadow-none focus:shadow-none p-0"
          />
        </div>

        {error && <p role="alert" className="text-sm text-red-500 mb-3">{error}</p>}
        <div className="grid gap-3">
          {filtered.map((cliente) => (
            <div key={cliente.id} className="flex items-center gap-4 p-4 rounded-xl bg-brand-cream hover:bg-brand-cream-dark transition-colors">
              <div className="w-12 h-12 rounded-full bg-brand-green flex items-center justify-center text-white font-bold">
                {cliente.nombre.charAt(0)}{cliente.apellido.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{cliente.nombre} {cliente.apellido}</p>
                <p className="text-sm text-brand-text-light">{cliente.telefono || cliente.email || "Sin contacto"}</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="font-medium text-brand-green">Cliente registrado</p>
                <p className="text-xs text-brand-text-light">{cliente.email || "Sin email"}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => abrirEdicion(cliente)} aria-label={`Editar ${cliente.nombre} ${cliente.apellido}`} title="Editar cliente" className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-brand-green/10 text-brand-green">
                  <Edit2 size={16} />
                </button>
                {isAdmin && (
                  <button type="button" onClick={() => void eliminarCliente(cliente)} disabled={eliminando === cliente.id} aria-label={`Eliminar ${cliente.nombre} ${cliente.apellido}`} title="Eliminar cliente" className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-red-50 text-red-500 disabled:opacity-50">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {!filtered.length && !error && <p className="text-sm text-brand-text-light">{clientes.length ? "No hay clientes que coincidan con tu búsqueda." : "Aún no hay clientes registrados."}</p>}
        </div>
      </div>

      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { if (!guardando) setEditando(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="edit-cliente-title" className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-bento" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-brand-cream-dark p-6">
              <h2 id="edit-cliente-title" className="font-display text-xl font-bold">Editar cliente</h2>
              <button type="button" onClick={() => setEditando(null)} className="rounded-xl p-2 hover:bg-brand-cream" aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={guardarCliente} className="space-y-4 p-6">
              <div>
                <label htmlFor="cliente-nombre" className="label-field">Nombre *</label>
                <input id="cliente-nombre" required value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} className="input-field" />
              </div>
              <div>
                <label htmlFor="cliente-apellido" className="label-field">Apellido *</label>
                <input id="cliente-apellido" required value={form.apellido} onChange={(event) => setForm({ ...form, apellido: event.target.value })} className="input-field" />
              </div>
              <div>
                <label htmlFor="cliente-telefono" className="label-field">Teléfono</label>
                <input id="cliente-telefono" type="tel" value={form.telefono} onChange={(event) => setForm({ ...form, telefono: event.target.value })} className="input-field" />
              </div>
              <div>
                <label htmlFor="cliente-email" className="label-field">Email</label>
                <input id="cliente-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="input-field" />
              </div>
              {formError && <p role="alert" className="text-sm text-red-500">{formError}</p>}
              <button type="submit" disabled={guardando} className="btn-primary w-full disabled:opacity-50">
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
