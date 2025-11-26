"use client";

import "./globals.css";
import { Sidebar, Footer } from "./components";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import ReactQueryProvider from "./ReactQueryProvider";
import { useFirebaseUid } from "../hooks/useFirebaseUid";

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isRoot = pathname === "/";

  const { uid, ready } = useFirebaseUid();
  const isLoggedIn = ready && !!uid;

  return (
    <html lang="en">
      <body className="layout-body">
        <ReactQueryProvider>
          {!isRoot && isLoggedIn && <Sidebar />}

          {!isRoot ? (
            <div className="layout-container-is-root">
              <main className="layout-main">{children}</main>
              <Footer />
            </div>
          ) : (
            <main className="layout-main-root">{children}</main>
          )}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
