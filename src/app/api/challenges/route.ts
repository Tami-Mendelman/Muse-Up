export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import Challenge from "../../../models/Challenge";
import { verifyToken } from "../../../lib/auth";

export async function GET(req: NextRequest) {
  try {
    // auth by token in cookie
    const token = req.cookies.get("token")?.value;
    const user = await verifyToken(token || "");
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const filter: any = {};
    if (status) filter.status = status;

    const challenges = await (Challenge as any).find(filter).lean();

    return NextResponse.json(challenges, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/challenges error:", err);
    return NextResponse.json(
      { message: "Failed to fetch challenges", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // auth by token in cookie
    const token = req.cookies.get("token")?.value;
    const user = await verifyToken(token || "");
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { title, description, picture_url, status } = await req.json();

    if (!title || !description || !picture_url) {
      return NextResponse.json(
        { message: "title, description and picture_url are required" },
        { status: 400 }
      );
    }

    const lastChallenge = await (Challenge as any)
      .findOne()
      .sort({ id: -1 })
      .lean();

    const nextId = (lastChallenge?.id ?? 0) + 1;

    const newChallenge = await (Challenge as any)
      .create({
        id: nextId,
        title,
        description,
        picture_url,
        status: status || "active",
      })
      .then((doc: any) => doc.toObject());

    return NextResponse.json(newChallenge, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/challenges error:", err);
    return NextResponse.json(
      { message: "Failed to create challenge", details: err.message },
      { status: 500 }
    );
  }
}
