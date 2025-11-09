export const runtime = "nodejs";
import { dbConnect } from "../../../lib/mongoose";
import User from "../../../models/User";
import type { NextRequest } from "next/server";


export async function GET() {
  await dbConnect();
  const users = await User.find();
  return Response.json(users);
}


export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const data = await req.json();

    if (!data.username || !data.email || !data.password_hash) {
      return Response.json(
        { message: "username, email and password_hash are required" },
        { status: 400 }
      );
    }

    const user = await User.create(data);
    return Response.json(user, { status: 201 });
  } catch (err: any) {
    return Response.json({ message: err.message }, { status: 500 });
  }
}
