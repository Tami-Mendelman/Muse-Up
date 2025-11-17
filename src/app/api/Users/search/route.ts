export const runtime = "nodejs";

import { dbConnect } from "../../../../lib/mongoose";
import User from "../../../../models/User";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const style = searchParams.get("style") || "";
    const technique = searchParams.get("technique") || "";
    const location = searchParams.get("location") || "";
    const limitParam = searchParams.get("limit");

    const limit = Math.min(Number(limitParam) || 50, 200);

    const and: any[] = [];

    if (q) {
      and.push({
        $or: [
          { username: { $regex: q, $options: "i" } },
          { name: { $regex: q, $options: "i" } },
          { bio: { $regex: q, $options: "i" } },
        ],
      });
    }

    if (style) {
      and.push({ bio: { $regex: style, $options: "i" } });
    }

    if (technique) {
      and.push({ bio: { $regex: technique, $options: "i" } });
    }

    if (location) {
      and.push({ location: { $regex: location, $options: "i" } });
    }

    const query = and.length ? { $and: and } : {};

    const users = await User.find(query)
      .select(
        "username name avatar_url bio location followers_count artworks_count likes_received created_at"
      )
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();

    return Response.json(users, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching users (artists)", err);
    return Response.json(
      { message: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
