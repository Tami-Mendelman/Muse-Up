export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import User from "../../../models/User";
import FollowModel from "../../../models/Follow";
const Follow: any = FollowModel;






export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");

    if (!userIdParam) {
      return NextResponse.json(
        { message: "userId is required" },
        { status: 400 }
      );
    }

    const userId = Number(userIdParam);

    // מי עוקב אחריי
    const follows = await Follow.find({
      followed_user_id: userId,
    }).lean();

    const followerIds = follows.map((f: any) => f.following_user_id);

    if (followerIds.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const users = await User.find({
      id: { $in: followerIds },
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

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { message: "Server error", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { userId, followerId } = body;

    await Follow.create({
      following_user_id: userId,
      followed_user_id: followerId,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { message: "Failed to follow", details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { userId, followerId } = body;

    await Follow.findOneAndDelete({
      following_user_id: userId,
      followed_user_id: followerId,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { message: "Failed to unfollow", details: err.message },
      { status: 500 }
    );
  }
}
