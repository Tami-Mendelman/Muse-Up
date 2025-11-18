import { dbConnect } from "../../../../lib/mongoose";
import User from "../../../../models/User";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

// Route GET /api/users/check?email=...
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    console.log("GET /api/users/check called with email:", email);

    if (!email) {
      console.warn("No email provided in request");
      return Response.json({ exists: false }, { status: 400 });
    }

    await dbConnect();
    console.log("Connected to DB");

    const user = await User.findOne({ email });
    console.log("DB query result:", user);

    return Response.json({ exists: !!user }, { status: 200 });
  } catch (err: any) {
    console.error("Error in GET /api/users/check:", err);
    return Response.json({ exists: false, message: err.message }, { status: 500 });
  }
}