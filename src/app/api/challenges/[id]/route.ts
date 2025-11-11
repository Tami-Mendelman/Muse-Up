export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { dbConnect } from "../../../../lib/mongoose";
import Challenge from "../../../../models/Challenge";

type ParamsCtx = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, ctx: ParamsCtx) {
  try {
    const { id } = await ctx.params;
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return Response.json({ message: "Invalid id" }, { status: 400 });
    }

    await dbConnect();

    const challenge = await (Challenge as any)
      .findOne({ id: numericId })
      .lean();

    if (!challenge) {
      return Response.json({ message: "Challenge not found" }, { status: 404 });
    }

    return Response.json(challenge, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/challenges/[id] error:", err);
    return Response.json(
      { message: "Failed to fetch challenge", details: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, ctx: ParamsCtx) {
  try {
    const { id } = await ctx.params;
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return Response.json({ message: "Invalid id" }, { status: 400 });
    }

    await dbConnect();

    const updates = await req.json();

    const updated = await (Challenge as any)
      .findOneAndUpdate({ id: numericId }, { $set: updates }, { new: true })
      .lean();

    if (!updated) {
      return Response.json({ message: "Challenge not found" }, { status: 404 });
    }

    return Response.json(updated, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/challenges/[id] error:", err);
    return Response.json(
      { message: "Failed to update challenge", details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: ParamsCtx) {
  try {
    const { id } = await ctx.params;
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return Response.json({ message: "Invalid id" }, { status: 400 });
    }

    await dbConnect();

    const deleted = await (Challenge as any)
      .findOneAndDelete({ id: numericId });

    if (!deleted) {
      return Response.json({ message: "Challenge not found" }, { status: 404 });
    }

    return Response.json({ message: "Challenge deleted" }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/challenges/[id] error:", err);
    return Response.json(
      { message: "Failed to delete challenge", details: err.message },
      { status: 500 }
    );
  }
}
