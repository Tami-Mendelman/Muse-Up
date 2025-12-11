"use client";

import { Sidebar, Footer } from "./components";
import { usePathname } from "next/navigation";
import { useFirebaseUid } from "../hooks/useFirebaseUid";
import type { ReactNode } from "react";

export default function LayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { uid, ready } = useFirebaseUid();
  const isLoggedIn = ready && !!uid;

  const authRoutes = [
    "/",
    "/login",
    "/register",
    "/forget-password",
    "/reset-password",
    "/about",
  ];

  const isAuthRoute = authRoutes.includes(pathname);

  return (
    <>
      {!isAuthRoute && isLoggedIn && <Sidebar />}

      {!isAuthRoute ? (
        <div className="layout-container-is-root">
          <main className="layout-main">{children}</main>
          <Footer />
        </div>
      ) : (
        <main className="auth-page">{children}</main>
      )}
    </>
  );
}
