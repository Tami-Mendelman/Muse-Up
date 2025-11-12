export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { dbConnect } from "../../../../lib/mongoose";
import Comment from "../../../../models/Comment";

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

    const comment = await (Comment as any)
      .findOne({ id: numericId })
      .lean();

    if (!comment) {
      return Response.json({ message: "Comment not found" }, { status: 404 });
    }

    return Response.json(comment, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/comments/[id] error:", err);
    return Response.json(
      { message: "Failed to fetch comment", details: err.message },
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

    const deleted = await (Comment as any)
      .findOneAndDelete({ id: numericId });

    if (!deleted) {
      return Response.json({ message: "Comment not found" }, { status: 404 });
    }

    return Response.json({ message: "Comment deleted" }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/comments/[id] error:", err);
    return Response.json(
      { message: "Failed to delete comment", details: err.message },
      { status: 500 }
    );
  }
}
