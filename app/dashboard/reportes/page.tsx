"use client";

import { useEffect, useState } from "react";
import StatsCard from "@/components/bento/StatCard";
import Card from "@/components/bento/Card";
import { BarChart3, Calendar, Download, PieChart, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api-fetch";
import { useSupabase } from "@/components/layout/SupabaseProvider";
import { formatServiceName } from "@/lib/utils";

interface ReportData {
  stats: {
    ingresosMes: number;
    citasMes: number;
    promedioDiario: number;
    servicioTop: string;
  };
  ingresosMensuales: { mes: string; etiqueta: string; total: number }[];
  serviciosPopulares: { nombre: string; cantidad: number; porcentaje: number }[];
}

function formatPrice(value: number) {
  return `S/ ${Number(value).toFixed(2)}`;
}

export default function ReportesPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState("");
  const { user } = useSupabase();
  const isAdmin = user?.role === "admin";
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [exportError, setExportError] = useState("");

  async function exportData() {
    setExporting(true); setExportMessage(""); setExportError("");
    try {
      const response = await apiFetch("/api/exportar", { cache: "no-store" });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "No se pudo generar el archivo");
      }
      const blob = await response.blob();
      const filename = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || "datos.xlsx";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = filename;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setExportMessage(`Descargado: ${filename}`);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "No se pudo generar el archivo");
    } finally { setExporting(false); }
  }

  async function loadReport() {
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Tu sesión venció. Inicia sesión nuevamente.");
      const response = await apiFetch("/api/reportes", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudieron cargar los reportes");
      setReport(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los reportes");
    }
  }

  useEffect(() => {
    void loadReport();
  }, []);

  const ingresosMaximos = Math.max(...(report?.ingresosMensuales.map((item) => item.total) || [0]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-brand-green">Reportes</h1>
        <p className="text-brand-text-light mt-1">Información y estadísticas de tu negocio</p>
      </div>

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <span>{error}</span>
        <button type="button" onClick={() => void loadReport()} className="font-semibold underline underline-offset-2">Reintentar</button>
      </div>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard icon={TrendingUp} label="Ingresos del mes" value={report ? formatPrice(report.stats.ingresosMes) : "..."} color="text-green-600" />
        <StatsCard icon={Calendar} label="Citas del mes" value={report?.stats.citasMes ?? "..."} />
        <StatsCard icon={BarChart3} label="Promedio diario" value={report ? formatPrice(report.stats.promedioDiario) : "..."} />
        <StatsCard icon={PieChart} label="Servicio más solicitado" value={report?.stats.servicioTop || (report ? "Sin datos" : "...")} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Ingresos mensuales">
          <div className="flex h-64 items-end gap-3 border-b border-l border-brand-green/15 px-3 pb-2 pt-5 sm:gap-5 sm:px-5">
            {report?.ingresosMensuales.map((item) => (
              <div key={item.mes} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <span className="max-w-full truncate text-[10px] text-brand-text-light sm:text-xs">{item.total > 0 ? formatPrice(item.total) : ""}</span>
                <div className="flex h-full w-full items-end">
                  <div
                    title={`${item.etiqueta}: ${formatPrice(item.total)}`}
                    className="w-full rounded-t-md bg-brand-green transition-[height] duration-500"
                    style={{ height: ingresosMaximos > 0 ? `${Math.max((item.total / ingresosMaximos) * 100, item.total > 0 ? 4 : 0)}%` : "0%" }}
                  />
                </div>
                <span className="text-xs capitalize text-brand-text-light">{item.etiqueta}</span>
              </div>
            ))}
            {!report && !error && <p className="m-auto text-sm text-brand-text-light">Cargando ingresos...</p>}
          </div>
          {report && ingresosMaximos === 0 && <p className="mt-4 text-center text-sm text-brand-text-light">Aún no hay ingresos registrados en este periodo.</p>}
        </Card>

        <Card title="Servicios más solicitados">
          <div className="space-y-5">
            {report?.serviciosPopulares.map((servicio) => (
              <div key={servicio.nombre} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-medium">{formatServiceName(servicio.nombre)}</p>
                    <span className="shrink-0 text-sm text-brand-text-light">{servicio.cantidad} {servicio.cantidad === 1 ? "servicio" : "servicios"}</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-brand-cream">
                    <div className="h-2 rounded-full bg-brand-green" style={{ width: `${servicio.porcentaje}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {!report && !error && <p className="text-sm text-brand-text-light">Cargando servicios...</p>}
            {report && report.serviciosPopulares.length === 0 && <p className="text-sm text-brand-text-light">Aún no hay servicios pagados en este periodo.</p>}
          </div>
        </Card>
      </div>

      {isAdmin && <Card title="Exportar datos">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-sm text-brand-text-light">Descarga un Excel con todos los datos de tu negocio: clientes, citas, pagos, movimientos y cierres de caja, servicios, categorías, promociones y equipo. Sirve como respaldo y para revisarlos en tu computadora.</p>
          <button type="button" onClick={() => void exportData()} disabled={exporting} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60">
            <Download size={17} />{exporting ? "Generando…" : "Descargar Excel"}
          </button>
        </div>
        {exportMessage && <p role="status" className="mt-3 text-sm text-green-700">{exportMessage}</p>}
        {exportError && <p role="alert" className="mt-3 text-sm text-red-700">{exportError}</p>}
        <p className="mt-3 text-xs text-brand-text-light">Contiene datos personales de tus clientas y tu equipo: guárdalo en un lugar seguro y no lo compartas.</p>
      </Card>}
    </div>
  );
}