export const runtime = "nodejs";
import { NextResponse, type NextRequest } from "next/server";
import { dbConnect } from "../../../../../lib/mongoose";
import { verifyToken } from "../../../../../lib/auth";
import Challenge from "../../../../../models/Challenge";
import User from "../../../../../models/User";
type ParamsCtx = {
  params: Promise<{ id: string }>;
};
async function getAdminUser(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  const decoded = await verifyToken(token).catch(() => null);
  if (!decoded) return null;
  await dbConnect();
  const dbUser = await User.findOne({ firebase_uid: decoded.uid }).lean();
  if (!dbUser) return null;
  if (dbUser.role !== "admin") return null;
  return dbUser;
}
export async function PATCH(req: NextRequest, ctx: ParamsCtx) {
  try {
    const adminUser = await getAdminUser(req);
    if (!adminUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = await ctx.params;

    const body = await req.json();
    const { winners, publish, status } = body as {
      winners?: {
        user_id: string;
        submission_id: string;
        place: number;
      }[];
      publish?: boolean;
      status?: string;
    };

    if (!winners || !Array.isArray(winners) || winners.length === 0) {
      return NextResponse.json(
        { message: "Winners array is required" },
        { status: 400 }
      );
    }

    await dbConnect();
const challenge = await (Challenge as any).findOne({ id: Number(id) });
    if (!challenge) {
      return NextResponse.json(
        { message: "Challenge not found" },
        { status: 404 }
      );
    }
    challenge.winners = winners.map((w) => ({
      user_id: w.user_id,
      submission_id: w.submission_id,
      place: w.place,
    }));

    if (typeof publish === "boolean") {
      challenge.winners_published = publish;
    }

    if (status) {
      challenge.status = status;
    }

    await challenge.save();

    return NextResponse.json(challenge, { status: 200 });
  } catch (err: any) {
    console.error("PATCH /api/admin/challenges/[id] error:", err);
    return NextResponse.json(
      { message: "Failed to update winners", details: err.message },
      { status: 500 }
    );
  }
}
