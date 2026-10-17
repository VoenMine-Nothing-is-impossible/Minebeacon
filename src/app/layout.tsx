import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
export const metadata: Metadata = { title: "MineBeacon", description: "Minecraft servers catalog" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="dark">
      <body>
        <Providers>
          <Header />
          <main className="container">{children}</main>
          <footer className="container" style={{ color: "var(--muted)", fontSize: 13 }}>
            MineBeacon · Minecraft catalog · reverse-proxy ready (trust X-Forwarded-*)
          </footer>
        </Providers>
      </body>
    </html>
  );
}
