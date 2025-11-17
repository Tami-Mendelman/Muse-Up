export const runtime = "nodejs";

import { dbConnect } from "../../../lib/mongoose";
import type { NextRequest } from "next/server";
import Follow from "../../../models/Follow";
import User from "../../../models/User";


export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");

    if (!userIdParam) {
      return Response.json(
        { message: "userId is required" },
        { status: 400 }
      );
    }

    const userId = Number(userIdParam);
    if (Number.isNaN(userId)) {
      return Response.json(
        { message: "userId must be a number" },
        { status: 400 }
      );
    }


    const follows = await (Follow as any)
  .find({
    following_user_id: userId,
  })
  .lean();


    const followedIds = follows.map((f: any) => f.followed_user_id);

    if (followedIds.length === 0) {
      return Response.json([], { status: 200 });
    }

   
    const users = await User.find({
      id: { $in: followedIds },
    }).lean();

    const result = users.map((u: any) => ({
      _id: String(u._id),
      id: u.id,                      
      username: u.username,
      name: u.name,
      email: u.email,
      profil_url: u.profil_url,      
      bio: u.bio,
      location: u.location,
      role: u.role,
    }));

    return Response.json(result, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/following-users error:", err);
    return Response.json(
      { message: "Failed to load following users", details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { userId, followedUserId } = body;

    if (userId === undefined || followedUserId === undefined) {
      return Response.json(
        { message: "userId and followedUserId are required" },
        { status: 400 }
      );
    }

    const follower = Number(userId);
    const followed = Number(followedUserId);

    if (Number.isNaN(follower) || Number.isNaN(followed)) {
      return Response.json(
        { message: "Ids must be numbers" },
        { status: 400 }
      );
    }


const deleted = await (Follow as any).findOneAndDelete({
  following_user_id: follower,
  followed_user_id: followed,
});


    if (!deleted) {
      return Response.json(
        { message: "Follow relation not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/following-users error:", err);
    return Response.json(
      { message: "Failed to unfollow", details: err.message },
      { status: 500 }
    );
  }
}
