export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { dbConnect } from "../../../../lib/mongoose";
import Post from "../../../../models/Post";
import User from "../../../../models/User";
import mongoose from "mongoose";
import { verifyToken } from "../../../../lib/auth";

type ParamsCtx = {
  params: Promise<{ id: string }>;
};

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dhxxlwa6n/image/upload/v1763292698/ChatGPT_Image_Nov_16_2025_01_25_54_PM_ndrcsr.png";

/* ---------------------------------------------------
   GET /api/posts/[id]
--------------------------------------------------- */
export async function GET(_req: NextRequest, ctx: ParamsCtx) {
  try {
    // auth by token in cookie
    const token = _req.cookies.get("token")?.value;
    const user = await verifyToken(token || "");
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;

    await dbConnect();

    // אפשר גם ObjectId וגם id מספרי
    const query = mongoose.isValidObjectId(id)
      ? { _id: id }
      : { id: Number(id) };

    const post = await (Post as any).findOne(query).lean();

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    let author: any = null;

    // 🔹 1) user_id הוא ObjectId → למצוא לפי _id
    if (post.user_id && mongoose.isValidObjectId(post.user_id)) {
      const user = await User.findById(post.user_id).lean().catch(() => null);

      if (user) {
        author = {
          name: user.name || "Unknown",
          username: user.username || "",
          followers_count: user.followers_count ?? 0,
          avatar_url: user.avatar_url || user.profil_url || DEFAULT_AVATAR,
        };
      }
    }

    // 🔹 2) אם עדיין אין author — user_id הוא בעצם firebase_uid
    if (!author && post.user_id) {
      const user = await User.findOne({ firebase_uid: post.user_id })
        .lean()
        .catch(() => null);

      if (user) {
        author = {
          name: user.name || "Unknown",
          username: user.username || "",
          followers_count: user.followers_count ?? 0,
          avatar_url: user.avatar_url || user.profil_url || DEFAULT_AVATAR,
        };
      }
    }

    const finalPost = {
      ...post,
      author:
        author || {
          name: "Unknown",
          followers_count: 0,
          avatar_url: DEFAULT_AVATAR,
        },
      image_url:
        post.image_url ||
        "https://res.cloudinary.com/dhxxlwa6n/image/upload/v1730000000/placeholder.jpg",
    };

    return NextResponse.json(finalPost, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/posts/[id] error:", err);
    return NextResponse.json(
      { message: "Failed to fetch post", details: err.message },
      { status: 500 }
    );
  }
}

/* ---------------------------------------------------
   PATCH /api/posts/[id]
--------------------------------------------------- */
export async function PATCH(req: NextRequest, ctx: ParamsCtx) {
  try {
    // auth by token in cookie
    const token = req.cookies.get("token")?.value;
    const user = await verifyToken(token || "");
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;

    await dbConnect();

    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { _id: id } : { id: Number(id) };

    const body = await req.json().catch(() => ({}));

    if (body.delta !== undefined) {
      const delta =
        typeof body.delta === "number" && !Number.isNaN(body.delta)
          ? body.delta
          : 1;

      const updatedLikes = await (Post as any)
        .findOneAndUpdate(query, { $inc: { likes_count: delta } }, { new: true })
        .lean();

      if (!updatedLikes) {
        return NextResponse.json({ message: "Post not found" }, { status: 404 });
      }

      return NextResponse.json(
        { likes_count: updatedLikes.likes_count },
        { status: 200 }
      );
    }

    const allowed = [
      "title",
      "body",
      "image_url",
      "category",
      "tags",
      "visibility",
      "status",
    ];

    const updateData: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    const updatedPost = await (Post as any)
      .findOneAndUpdate(query, updateData, { new: true })
      .lean();

    if (!updatedPost) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(updatedPost, { status: 200 });
  } catch (err: any) {
    console.error("PATCH /api/posts/[id] error:", err);
    return NextResponse.json(
      { message: "Failed to update post", details: err.message },
      { status: 500 }
    );
  }
}


/* ---------------------------------------------------
   DELETE /api/posts/[id]
--------------------------------------------------- */
export async function DELETE(_req: NextRequest, ctx: ParamsCtx) {
  try {
    // auth by token in cookie
    const token = _req.cookies.get("token")?.value;
    const user = await verifyToken(token || "");
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;

    await dbConnect();

    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { _id: id } : { id: Number(id) };

    const deleted = await (Post as any).findOneAndDelete(query).lean();

    if (!deleted) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Post deleted successfully", deletedId: id },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("DELETE /api/posts/[id] error:", err);
    return NextResponse.json(
      { message: "Failed to delete post", details: err.message },
      { status: 500 }
    );
  }
}
