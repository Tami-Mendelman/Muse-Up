"use client";

import "./globals.css";
import Sidebar from "./components/Sidebar/Sidebar";
import Footer from "./components/Footer/Footer";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // בעמוד הראשי אין sidebar/footer
  const hideChrome = pathname === "/";

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          background: "#f6f8fb",
          color: "#121826",
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        }}
      >
        {/* *************** SIDEBAR קבוע בצד *************** */}
        {!hideChrome && (
          <Sidebar />
        )}

        {/* *************** מבנה עמוד *************** */}
        {!hideChrome ? (
          <div
            style={{
              display: "grid",
              gridTemplateRows: "1fr auto", // תוכן ואז פוטר
              minHeight: "100vh",
              paddingRight: 88, // מקום ל־sidebar
            }}
          >
            {/* תוכן */}
            <main style={{ padding: 16 }}>{children}</main>

            {/* פוטר בתחתית */}
            <Footer />
          </div>
        ) : (
          <main
            style={{
              margin: 0,
              padding: 0,
              minHeight: "100vh",
              width: "100%",
            }}
          >
            {children}
          </main>
        )}
      </body>
    </html>
  );
}
