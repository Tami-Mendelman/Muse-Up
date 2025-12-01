export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import User from "../../../models/User";
import FollowModel from "../../../models/Follow";
import { verifyToken } from "../../../lib/auth";

const Follow: any = FollowModel;

export async function GET(req: NextRequest) {
  try {
    // auth by token in cookie
    const token = req.cookies.get("token")?.value;
    const user = await verifyToken(token || "");
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "userId is required" },
        { status: 400 }
      );
    }


    const follows = await Follow.find({
      following_user_id: userId,
    }).lean();

    const followedIds = follows.map((f: any) => f.followed_user_id);

    if (followedIds.length === 0) {
      return NextResponse.json([]);
    }

    const users = await User.find({
      firebase_uid: { $in: followedIds },
    })
      .select("_id firebase_uid name username profil_url bio")
      .lean();


    return NextResponse.json(users);
  } catch (err) {
    console.error("Error in /api/following-users", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
