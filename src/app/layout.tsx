import "./globals.css";
import AppHeader from "./components/Header/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import Footer from "./components/Footer/Footer";
import type { ReactNode } from "react";

export const metadata = { title: "MuseUp" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          background: "#f6f8fb",
          color: "#121826",
          margin: 0,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        }}
      >
        <Sidebar active="home" />

        <div
          style={{
            display: "grid",
            gridTemplateRows: "64px 1fr auto",
            gridTemplateAreas: `"header" "main" "footer"`,
            minHeight: "100vh",
            paddingRight: "88px",
          }}
        >
          <AppHeader />
          <main style={{ gridArea: "main", padding: 16 }}>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
