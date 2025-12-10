"use client";

import "./globals.css";
import { Sidebar, Footer } from "./components";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import ReactQueryProvider from "./ReactQueryProvider";
import { useFirebaseUid } from "../hooks/useFirebaseUid";

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const { uid, ready } = useFirebaseUid();
  const isLoggedIn = ready && !!uid;

  const authRoutes = ["/", "/login", "/register", "/forget-password", "/reset-password", "/about"];
  const isAuthRoute = authRoutes.includes(pathname);

  return (
    <html lang="en">
      <body className="layout-body">
        <ReactQueryProvider>
          {!isAuthRoute && isLoggedIn && <Sidebar />}

          {!isAuthRoute ? (
            <div className="layout-container-is-root">
              <main className="layout-main">{children}</main>
              <Footer />
            </div>
          ) : (
            <main className="auth-page">{children}</main>
          )}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
