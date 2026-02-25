import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Igreja App - Gestão Eclesiástica",
  description: "Sistema completo de gestão para igrejas. Gerencie membros, presenças, finanças e muito mais.",
};

import { TooltipProvider } from "@/components/ui/tooltip";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased">
        <AuthProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
