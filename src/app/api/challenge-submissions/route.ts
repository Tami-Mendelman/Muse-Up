export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import ChallengeSubmissionModel from "../../../models/ChallengeSubmission";
import UserModel from "../../../models/User";
import { verifyToken } from "../../../lib/auth";
const ChallengeSubmission: any = ChallengeSubmissionModel;
const User: any = UserModel;

export async function GET(req: NextRequest) {
  try {
    // auth by token in cookie
    const token = req.cookies.get("token")?.value;
    const _user = await verifyToken(token || "");
    if (!_user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);

    const user_uid =
      searchParams.get("user_uid") ||
      searchParams.get("userId") ||
      searchParams.get("uid");

    if (!user_uid) {
      return NextResponse.json(
        { message: "user_uid is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ firebase_uid: user_uid }).lean();
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const submissions = await ChallengeSubmission.find({
      user_id: user.id,
    }).lean();

    return NextResponse.json(submissions, { status: 200 });
  } catch (err) {
    console.error("GET /api/challenge-submissions error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
export async function POST(req: NextRequest) {
  try {
    // auth by token in cookie
    const token = req.cookies.get("token")?.value;
    const _user = await verifyToken(token || "");
    if (!_user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { challenge_id, user_uid, image_url } = body;

    if (!challenge_id || !user_uid) {
      return NextResponse.json(
        { message: "challenge_id and user_uid are required" },
        { status: 400 }
      );
    }
    const user = await User.findOne({ firebase_uid: user_uid }).lean();
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    let existing = await ChallengeSubmission.findOne({
      challenge_id,
      user_id: user.id,
    });
    if (existing) {
      if (image_url) {
        existing.image_url = image_url;
        existing.status = "submitted";
        await existing.save();
      }
      return NextResponse.json(
        { message: "Submission saved", submission: existing },
        { status: 200 }
      );
    }
    const last = await ChallengeSubmission.findOne()
      .sort({ id: -1 })
      .lean();
    const nextId = last ? last.id + 1 : 1;

    const doc = new ChallengeSubmission({
      id: nextId,
      challenge_id,
      user_id: user.id,
      post_id: null,
      status: image_url ? "submitted" : "joined",
      image_url: image_url ?? null,
    });
    await doc.save();
    return NextResponse.json(doc.toObject(), { status: 201 });
  } catch (err) {
    console.error("POST /api/challenge-submissions error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const challenge_id = searchParams.get("challenge_id");
    const user_uid =
      searchParams.get("user_uid") ||
      searchParams.get("userId") ||
      searchParams.get("user_id");

    if (!challenge_id || !user_uid) {
      return NextResponse.json(
        { message: "challenge_id and user_uid are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ firebase_uid: user_uid }).lean();
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    await ChallengeSubmission.deleteOne({
      challenge_id: parseInt(challenge_id, 10),
      user_id: user.id,
    });

    return NextResponse.json(
      { message: "Left challenge" },
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE /api/challenge-submissions error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
