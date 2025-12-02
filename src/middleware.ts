import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/about"
  // "/onboarding"
];

export function middleware(req: NextRequest) {
  console.log("🔥 middleware is running:", req.nextUrl.pathname);

  const token = req.cookies.get("token")?.value;

  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PATHS.some((p) => p !== "/" && pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/challenges/:path*",
    "/create/:path*",
    "/edit-post/:path*",
    "/followers/:path*",
    "/following/:path*",
    "/landing",
    "/landing/:path*",
    "/messages/:path*",
    "/onboarding/:path*",
    "/posts/:path*",
    "/profile/:path*",
    // "/api/:path*", - unabled login...
  ],
};
