export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import Challenge from "../../../models/Challenge";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); 

    const filter: any = {};
    if (status) filter.status = status;

    const challenges = await (Challenge as any).find(filter).lean();

    return Response.json(challenges, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/challenges error:", err);
    return Response.json(
      { message: "Failed to fetch challenges", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { title, description, picture_url, status } = await req.json();

    if (!title || !description || !picture_url) {
      return Response.json(
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

    return Response.json(newChallenge, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/challenges error:", err);
    return Response.json(
      { message: "Failed to create challenge", details: err.message },
      { status: 500 }
    );
  }
}
