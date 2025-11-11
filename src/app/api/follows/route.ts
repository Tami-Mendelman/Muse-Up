export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import Follow from "../../../models/Follow";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");
    const type = searchParams.get("type"); // "followers" or "following"

    if (!userIdParam) {
      return Response.json(
        { message: "userId query param is required" },
        { status: 400 }
      );
    }

    const userId = Number(userIdParam);
    const filter: any = {};

    if (type === "followers") {
      filter.followed_user_id = userId;
    } else {
      filter.following_user_id = userId;
    }

    const follows = await (Follow as any).find(filter).lean();

    return Response.json(follows, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/follows error:", err);
    return Response.json(
      { message: "Failed to fetch follows", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { following_user_id, followed_user_id } = await req.json();

    if (!following_user_id || !followed_user_id) {
      return Response.json(
        { message: "following_user_id and followed_user_id are required" },
        { status: 400 }
      );
    }

    let follow = await (Follow as any)
      .findOne({ following_user_id, followed_user_id })
      .lean();

    if (!follow) {
      follow = await (Follow as any)
        .create({ following_user_id, followed_user_id })
        .then((doc: any) => doc.toObject());
    }

    return Response.json(follow, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/follows error:", err);
    return Response.json(
      { message: "Failed to create follow", details: err.message },
      { status: 500 }
    );
  }
}
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const { following_user_id, followed_user_id } = await req.json();

    if (!following_user_id || !followed_user_id) {
      return Response.json(
        { message: "following_user_id and followed_user_id are required" },
        { status: 400 }
      );
    }

    const deleted = await (Follow as any).findOneAndDelete({
      following_user_id,
      followed_user_id,
    });

    if (!deleted) {
      return Response.json(
        { message: "Follow relation not found" },
        { status: 404 }
      );
    }

    return Response.json({ message: "Unfollow success" }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/follows error:", err);
    return Response.json(
      { message: "Failed to delete follow", details: err.message },
      { status: 500 }
    );
  }
}
