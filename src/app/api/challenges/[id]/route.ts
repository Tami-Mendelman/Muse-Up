export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { dbConnect } from "../../../../lib/mongoose";
import Challenge from "../../../../models/Challenge";
import { verifyToken } from "../../../../lib/auth";

type ParamsCtx = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, ctx: ParamsCtx) {
  try {
    // auth by token in cookie
    const token = _req.cookies.get("token")?.value;
    const user = await verifyToken(token || "");
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    await dbConnect();

    const challenge = await (Challenge as any)
      .findOne({ id: numericId })
      .lean();

    if (!challenge) {
      return NextResponse.json({ message: "Challenge not found" }, { status: 404 });
    }

    return NextResponse.json(challenge, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/challenges/[id] error:", err);
    return NextResponse.json(
      { message: "Failed to fetch challenge", details: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, ctx: ParamsCtx) {
  try {
    // auth by token in cookie
    const token = req.cookies.get("token")?.value;
    const user = await verifyToken(token || "");
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    await dbConnect();

    const updates = await req.json();

    const updated = await (Challenge as any)
      .findOneAndUpdate({ id: numericId }, { $set: updates }, { new: true })
      .lean();

    if (!updated) {
      return NextResponse.json({ message: "Challenge not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/challenges/[id] error:", err);
    return NextResponse.json(
      { message: "Failed to update challenge", details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: ParamsCtx) {
  try {
    // auth by token in cookie
    const token = _req.cookies.get("token")?.value;
    const user = await verifyToken(token || "");
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    await dbConnect();

    const deleted = await (Challenge as any)
      .findOneAndDelete({ id: numericId });

    if (!deleted) {
      return NextResponse.json({ message: "Challenge not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Challenge deleted" }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/challenges/[id] error:", err);
    return NextResponse.json(
      { message: "Failed to delete challenge", details: err.message },
      { status: 500 }
    );
  }
}
