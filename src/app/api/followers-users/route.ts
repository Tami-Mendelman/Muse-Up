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
    const userId = searchParams.get("userId"); 

    if (!userId) {
      return NextResponse.json(
        { message: "userId is required" },
        { status: 400 }
      );
    }


    const follows = await Follow.find({
      followed_user_id: userId, 
    }).lean();

    if (!follows.length) {
      return NextResponse.json([], { status: 200 });
    }

    const followerUids = follows.map((f: any) => f.following_user_id);

const users = await User.find({
  firebase_uid: { $in: followerUids },
})
  .select("firebase_uid name username profil_url bio")
  .lean();

const result = users.map((u: any) => ({
  _id: u.firebase_uid as string,
  name: u.name,
  username: u.username,
  profil_url: u.profil_url, 
  bio: u.bio,
}));


    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching followers-users", err);
    return NextResponse.json(
      { message: "Failed to fetch followers", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json().catch(() => null);
    const userId = body?.userId as string | undefined;
    const followerId = body?.followerId as string | undefined;

    if (!userId || !followerId) {
      return NextResponse.json(
        { message: "userId and followerId are required" },
        { status: 400 }
      );
    }

    if (userId === followerId) {
      return NextResponse.json(
        { message: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    const existing = await Follow.findOne({
      following_user_id: userId,
      followed_user_id: followerId,
    }).lean();

    if (!existing) {
      await Follow.create({
        following_user_id: userId,
        followed_user_id: followerId,
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Error following user", err);
    return NextResponse.json(
      { message: "Failed to follow", details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json().catch(() => null);
    const userId = body?.userId as string | undefined;
    const followerId = body?.followerId as string | undefined;

    if (!userId || !followerId) {
      return NextResponse.json(
        { message: "userId and followerId are required" },
        { status: 400 }
      );
    }

    await Follow.findOneAndDelete({
      following_user_id: userId,
      followed_user_id: followerId,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Error unfollowing user", err);
    return NextResponse.json(
      { message: "Failed to unfollow", details: err.message },
      { status: 500 }
    );
  }
}
