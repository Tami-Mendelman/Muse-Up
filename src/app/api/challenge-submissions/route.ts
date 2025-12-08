import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import ChallengeSubmission from "../../../models/ChallengeSubmission";
export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    if (!userId) {
      return NextResponse.json(
        { message: "user_id is required" },
        { status: 400 }
      );
    }
const submissions = await (ChallengeSubmission as any)
  .find({ user_id: userId as any })
  .lean();


    return NextResponse.json(submissions, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/challenge-submissions error:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unexpected server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { challenge_id, user_id, image_url } = body;
    if (!challenge_id || !user_id) {
      return NextResponse.json(
        { message: "challenge_id and user_id are required" },
        { status: 400 }
      );
    }
const submission = await (ChallengeSubmission as any).create({
  challenge_id,
  user_id,
  image_url: image_url || null,
});

    return NextResponse.json(
      { message: "Joined challenge", data: submission },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/challenge-submissions error:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unexpected server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
export async function DELETE(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const challengeId = searchParams.get("challenge_id");
    const userId = searchParams.get("user_id");
    if (!challengeId || !userId) {
      return NextResponse.json(
        { message: "challenge_id and user_id are required" },
        { status: 400 }
      );
    }
    await ChallengeSubmission.deleteOne({
      challenge_id: Number(challengeId),
      user_id: userId,
    });
    return NextResponse.json(
      { message: "Left challenge successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("DELETE /api/challenge-submissions error:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unexpected server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
