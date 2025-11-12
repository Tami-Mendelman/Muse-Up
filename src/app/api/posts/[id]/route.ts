

export const runtime = "nodejs";

import { dbConnect } from "../../../../lib/mongoose";
import Post from "../../../../models/Post";
import type { NextRequest } from "next/server";

type ParamsCtx = {
  params: Promise<{ id: string }>;
};


export async function GET(_req: NextRequest, ctx: ParamsCtx) {
  try {
    const { id } = await ctx.params;

    await dbConnect();

    const post = await (Post as any).findById(id).lean();


    if (!post) {
      return Response.json({ message: "Post not found" }, { status: 404 });
    }

    return Response.json(post, { status: 200 });
  } catch (err: any) {
    if (err?.name === "CastError") {
      return Response.json({ message: "Invalid post id" }, { status: 400 });
    }
    return Response.json(
      { message: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, ctx: ParamsCtx) {
  try {
    const { id } = await ctx.params;

    await dbConnect();

    const updates = await req.json();


const updated = await (Post as any).findByIdAndUpdate(
  id,
  { $set: updates },
  { new: true }
).lean();



    if (!updated) {
      return Response.json({ message: "Post not found" }, { status: 404 });
    }

    return Response.json(updated, { status: 200 });
  } catch (err: any) {
    if (err?.name === "CastError") {
      return Response.json({ message: "Invalid post id" }, { status: 400 });
    }
    return Response.json(
      { message: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
export async function DELETE(_req: NextRequest, ctx: ParamsCtx) {
  try {
    const { id } = await ctx.params;

    await dbConnect();

    const deleted = await (Post as any).findByIdAndDelete(id);


    if (!deleted) {
      return Response.json({ message: "Post not found" }, { status: 404 });
    }

    return Response.json({ message: "Post deleted successfully" }, { status: 200 });
  } catch (err: any) {
    if (err?.name === "CastError") {
      return Response.json({ message: "Invalid post id" }, { status: 400 });
    }
    return Response.json(
      { message: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
