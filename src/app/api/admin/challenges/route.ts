export const runtime = "nodejs";
import { NextResponse, type NextRequest } from "next/server";
import { dbConnect } from "../../../../lib/mongoose";
import { verifyToken } from "../../../../lib/auth";
import Challenge from "../../../../models/Challenge";
import User from "../../../../models/User";

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
export async function GET(req: NextRequest) {
  try {
    const adminUser = await getAdminUser(req);
    if (!adminUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

const challenges = await (Challenge as any)
  .find({})
  .sort({ start_date: -1 })
  .lean();

    return NextResponse.json(challenges, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/admin/challenges error:", err);
    return NextResponse.json(
      { message: "Failed to load challenges", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await getAdminUser(req);
    if (!adminUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    const body = await req.json();
    const {
      title,
      description,
      picture_url,
      start_date,
      end_date,
      status,
    } = body;

    if (!title || !start_date || !end_date) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const finalStatus = status || "active";
  const last = await (Challenge as any)
  .findOne()
  .sort({ id: -1 })
  .lean();
    const nextId = last ? last.id + 1 : 1;
const challenge = await (Challenge as any).create({
      id: nextId,
      title,
      description,
      picture_url,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      status: finalStatus,
      winners: [],
      winners_published: false,
    });

    return NextResponse.json(challenge, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/challenges error:", err);
    return NextResponse.json(
      { message: "Failed to create challenge", details: err.message },
      { status: 500 }
    );
  }
}
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const idParam = req.nextUrl.searchParams.get("id");
    if (!idParam) {
      return NextResponse.json(
        { message: "Missing id query parameter" },
        { status: 400 }
      );
    }
    const numericId = Number(idParam);
    const isNumeric = !Number.isNaN(numericId);
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(idParam);
    let filter: any = null;
    if (isMongoId) {
      filter = { _id: idParam };
    } else if (isNumeric) {
      filter = { id: numericId };
    } else {
      return NextResponse.json(
        { message: "Invalid id parameter" },
        { status: 400 }
      );
    }

    const result = await Challenge.deleteOne(filter);

    if (!result || result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Challenge not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/admin/challenges error:", err);
    return NextResponse.json(
      { message: "Failed to delete challenge", details: err.message },
      { status: 500 }
    );
  }
}