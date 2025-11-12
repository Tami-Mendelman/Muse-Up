export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import ChallengeSubmission from "../../../models/ChallengeSubmission";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const challengeIdParam = searchParams.get("challengeId");
    const userIdParam = searchParams.get("userId");
    const postIdParam = searchParams.get("postId");

    const filter: any = {};

    if (challengeIdParam) filter.challenge_id = Number(challengeIdParam);
    if (userIdParam) filter.user_id = Number(userIdParam);
    if (postIdParam) filter.post_id = Number(postIdParam);

    const submissions = await (ChallengeSubmission as any)
      .find(filter)
      .lean();

    return Response.json(submissions, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/challenge-submissions error:", err);
    return Response.json(
      { message: "Failed to fetch submissions", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { challenge_id, post_id, user_id, status } = await req.json();

    if (!challenge_id || !post_id || !user_id) {
      return Response.json(
        { message: "challenge_id, post_id and user_id are required" },
        { status: 400 }
      );
    }

    const lastSubmission = await (ChallengeSubmission as any)
      .findOne()
      .sort({ id: -1 })
      .lean();

    const nextId = (lastSubmission?.id ?? 0) + 1;

    const newSubmission = await (ChallengeSubmission as any)
      .create({
        id: nextId,
        challenge_id,
        post_id,
        user_id,
        status: status || "submitted",
      })
      .then((doc: any) => doc.toObject());

    return Response.json(newSubmission, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/challenge-submissions error:", err);
    return Response.json(
      { message: "Failed to create submission", details: err.message },
      { status: 500 }
    );
  }
}
