import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SupabaseProvider } from "@/components/layout/SupabaseProvider";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${brand.name} - Sistema de Gestión`,
  description: `Sistema de gestión para ${brand.name}`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-body">
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
