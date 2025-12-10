export const runtime = "nodejs";
import { NextResponse, type NextRequest } from "next/server";
import { dbConnect } from "../../../../../lib/mongoose";
import ChallengeSubmission from "../../../../../models/ChallengeSubmission";
import Challenge from "../../../../../models/Challenge";
type ParamsCtx = {
  params: Promise<{ id: string }>;
};
export async function GET(_req: NextRequest, ctx: ParamsCtx) {
  try {
    const { id } = await ctx.params;
    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }
    await dbConnect();
    const submissions = await (ChallengeSubmission as any)
      .find({ challenge_id: numericId })
      .select("user_id")
      .lean();
    const challengeDoc = await (Challenge as any)
      .findOne({ id: numericId })
      .select("winners winners_published")
      .lean();
    const submissionUids: string[] = submissions
      .map((s: any) => s.user_id)
      .filter((u: any) => typeof u === "string" && u.trim().length > 0);
    const winnerUids: string[] =
      challengeDoc?.winners && Array.isArray(challengeDoc.winners)
        ? challengeDoc.winners
            .map((w: any) => w.user?.firebase_uid)
            .filter((u: any) => typeof u === "string" && u.trim().length > 0)
        : [];
    const allUids = Array.from(new Set([...submissionUids, ...winnerUids]));
    const participants = allUids.map((u) => ({ user_uid: u }));
    return NextResponse.json(
      {
        challenge_id: numericId,
        count: participants.length,
        participants,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(
      "GET /api/challenges/[id]/participants error:",
      err
    );
    return NextResponse.json(
      { message: "Failed to fetch participants", details: err.message },
      { status: 500 }
    );
  }
}
