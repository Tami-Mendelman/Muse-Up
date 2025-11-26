"use client";

import "./globals.css";
import { Sidebar, Footer } from "./components";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import ReactQueryProvider from "./ReactQueryProvider";

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isRoot = pathname === "/";

  return (
    <html lang="en">
      <body className="layout-body">
        <ReactQueryProvider>
          {!isRoot && <Sidebar />}

          {!isRoot ? (
            <div className="layout-container-is-root">
              <main style={{ padding: 16 }}>{children}</main>
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
        </ReactQueryProvider>
      </body>
    </html>
  );
}
