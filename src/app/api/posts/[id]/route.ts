export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { dbConnect } from "../../../../lib/mongoose";
import Post from "../../../../models/Post";

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

    const post = await (Post as any).findOne({ id: numericId }).lean();

    if (!post) {
      return Response.json({ message: "Post not found" }, { status: 404 });
    }

    return Response.json(post, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/posts/[id] error:", err);
    return Response.json(
      { message: "Failed to fetch post", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH – עדכון likes_count
 * body: { delta: number }  // למשל 1 ללייק, -1 לאנלייק
 */
export async function PATCH(req: NextRequest, ctx: ParamsCtx) {
  try {
    const { id } = await ctx.params;
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return Response.json({ message: "Invalid id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const rawDelta = body?.delta;
    const delta =
      typeof rawDelta === "number" && !Number.isNaN(rawDelta) ? rawDelta : 1;

    await dbConnect();

    const updated = await (Post as any)
      .findOneAndUpdate(
        { id: numericId },
        { $inc: { likes_count: delta } },
        { new: true }
      )
      .lean();

    if (!updated) {
      return Response.json({ message: "Post not found" }, { status: 404 });
    }

    // לא נחזור עם כל הפוסט – רק הערך החדש
    return Response.json({ likes_count: updated.likes_count }, { status: 200 });
  } catch (err: any) {
    console.error("PATCH /api/posts/[id] error:", err);
    return Response.json(
      { message: "Failed to update likes", details: err.message },
      { status: 500 }
    );
  }
}
