export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { dbConnect } from "../../../../lib/mongoose";
import Comment from "../../../../models/Comment";
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

    const comment = await (Comment as any)
      .findOne({ id: numericId })
      .lean();

    if (!comment) {
      return NextResponse.json({ message: "Comment not found" }, { status: 404 });
    }

    return NextResponse.json(comment, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/comments/[id] error:", err);
    return NextResponse.json(
      { message: "Failed to fetch comment", details: err.message },
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

    const deleted = await (Comment as any)
      .findOneAndDelete({ id: numericId });

    if (!deleted) {
      return NextResponse.json({ message: "Comment not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Comment deleted" }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/comments/[id] error:", err);
    return NextResponse.json(
      { message: "Failed to delete comment", details: err.message },
      { status: 500 }
    );
  }
}
