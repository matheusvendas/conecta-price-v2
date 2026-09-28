import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800", "900"] });

import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Conecta Price | Pricing Engine",
  description: "Motor de precificação inteligente",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} text-gray-800`}>
        {/* Navigation Bar Inteligente (Client Component) */}
        <Navbar />

        {/* Page Content */}
        <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>

        {/* Minimal Footer */}
        <footer className="border-t border-gray-100 py-8 mt-12">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">
              © 2024 Conecta Price. Todos os direitos reservados.
            </p>
            <p className="text-xs text-gray-400">
              Engenharia de Dados — Pricing Intelligence
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
