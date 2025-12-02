// src/app/api/users/[uid]/saved-posts/route.ts
export const runtime = "nodejs";

import { dbConnect } from "../../../../../lib/mongoose";
import User from "../../../../../models/User";
import type { NextRequest } from "next/server";

type ParamsCtx = {
  params: Promise<{ uid: string }>;
};

/* ----------------------------------------------------
   GET - get saved posts
----------------------------------------------------- */
export async function GET(_req: NextRequest, ctx: ParamsCtx) {
  try {
    const { uid } = await ctx.params;

    await dbConnect();

    const user = await User.findOne({ firebase_uid: uid })
      .select("firebase_uid saved_posts")
      .lean();

    console.log("🔎 GET saved-posts:", {
      firebase_uid: uid,
      found: !!user,
      saved_posts: user?.saved_posts,
    });

    return Response.json(user?.saved_posts ?? [], { status: 200 });
  } catch (err: any) {
    console.error("GET /saved-posts error:", err?.message);
    return Response.json([], { status: 200 });
  }
}

/* ----------------------------------------------------
   POST - save a post
----------------------------------------------------- */
export async function POST(req: NextRequest, ctx: ParamsCtx) {
  try {
    const { uid } = await ctx.params;
    const { postId } = await req.json();

    const numId = Number(postId);
    if (!Number.isFinite(numId)) {
      console.error("❌ bad postId:", postId);
      return Response.json({ message: "postId must be a number" }, { status: 400 });
    }

    await dbConnect();

    const updated = await User.findOneAndUpdate(
      { firebase_uid: uid },
      { $addToSet: { saved_posts: numId } },
      { new: true }
    ).lean();

    console.log("💾 POST saved-posts:", {
      firebase_uid: uid,
      postId: numId,
      foundUser: !!updated,
      saved_posts_after: updated?.saved_posts,
    });

    if (!updated) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    return Response.json({ success: true, saved_posts: updated.saved_posts });
  } catch (err: any) {
    console.error("POST /saved-posts error:", err?.message);
    return Response.json({ message: err?.message ?? "Server error" }, { status: 500 });
  }
}

/* ----------------------------------------------------
   DELETE - unsave
----------------------------------------------------- */
export async function DELETE(req: NextRequest, ctx: ParamsCtx) {
  try {
    const { uid } = await ctx.params;
    const { postId } = await req.json();

    const numId = Number(postId);
    if (!Number.isFinite(numId)) {
      console.error("❌ bad postId:", postId);
      return Response.json({ message: "postId must be a number" }, { status: 400 });
    }

    await dbConnect();

    const updated = await User.findOneAndUpdate(
      { firebase_uid: uid },
      { $pull: { saved_posts: numId } },
      { new: true }
    ).lean();

    console.log("🗑 DELETE saved-posts:", {
      firebase_uid: uid,
      postId: numId,
      foundUser: !!updated,
      saved_posts_after: updated?.saved_posts,
    });

    if (!updated) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    return Response.json({ success: true, saved_posts: updated.saved_posts });
  } catch (err: any) {
    console.error("DELETE /saved-posts error:", err?.message);
    return Response.json({ message: err?.message ?? "Server error" }, { status: 500 });
  }
}
