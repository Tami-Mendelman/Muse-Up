import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ message: "Token missing" }, { status: 400 });
  }

  (await cookies()).set("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });

  return NextResponse.json({ success: true });
}
