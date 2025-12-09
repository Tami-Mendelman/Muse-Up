export const runtime = "nodejs";
import { NextResponse, type NextRequest } from "next/server";
import { dbConnect } from "../../../../../../lib/mongoose";
import { verifyToken } from "../../../../../../lib/auth";
import ChallengeSubmission from "../../../../../.././models/ChallengeSubmission";
import User from "../../../../../.././models/User";
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
export async function GET(req: NextRequest, ctx: ParamsCtx) {
  try {
    const adminUser = await getAdminUser(req);
    if (!adminUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = await ctx.params;
    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      return NextResponse.json({ message: "Invalid challenge id" }, { status: 400 });
    }

    await dbConnect();
    const submissions = await (ChallengeSubmission as any).find({
      challenge_id: numericId,
    })
      .sort({ createdAt: 1 })
      .lean();

    const userIds = submissions.map((s: any) => s.user_id);
    const users = await User.find({ firebase_uid: { $in: userIds } })
      .select("firebase_uid username name profil_url")
      .lean();

    const usersMap = new Map<string, any>();
    users.forEach((u: any) => {
      usersMap.set(u.firebase_uid, u);
    });

    const result = submissions.map((s: any) => ({
      ...s,
      user: usersMap.get(s.user_id) || null,
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error(
      "GET /api/admin/challenges/[id]/submissions error:",
      err
    );
    return NextResponse.json(
      { message: "Failed to load submissions", details: err.message },
      { status: 500 }
    );
  }
}
