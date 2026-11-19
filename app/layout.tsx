import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = { title: "TaskFlow — organiza tu día", description: "Gestiona tus tareas personales con TaskFlow y consulta el clima en tiempo real." };
export const viewport: Viewport = { themeColor: "#f5f7fb", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" className={cn("font-sans", geist.variable)}><body>{children}</body></html>;
}
