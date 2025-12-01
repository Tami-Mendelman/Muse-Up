export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { dbConnect } from "../../../../lib/mongoose";
import Post from "../../../../models/Post";
import User from "../../../../models/User";
import mongoose from "mongoose";

type ParamsCtx = {
  params: Promise<{ id: string }>;
};

/* ---------------------------------------------------
   GET /api/posts/[id]
   שליפת פוסט + פרטי היוצר לפי firebase_uid
--------------------------------------------------- */
export async function GET(_req: NextRequest, ctx: ParamsCtx) {
  try {
    const { id } = await ctx.params;

    await dbConnect();

    // תמיכה גם ב-id מספרי וגם ב-_id של מונגו
    const query = mongoose.isValidObjectId(id)
      ? { _id: id }
      : { id: Number(id) };

    const post = await (Post as any).findOne(query).lean();

    if (!post) {
      return Response.json({ message: "Post not found" }, { status: 404 });
    }

    /* --------------------------
       שליפת היוצר לפי firebase_uid
    -------------------------- */
    let author = null;

    if (post.user_id) {
      const user = await User.findOne({ firebase_uid: post.user_id })
        .lean()
        .catch(() => null);

      if (user) {
        author = {
          name: user.name || "Unknown",
          username: user.username || "",
          followers_count: user.followers_count ?? 0,
          avatar_url:
            user.avatar_url ||
            user.profil_url ||
            "https://res.cloudinary.com/dhxxlwa6n/image/upload/v1763292698/ChatGPT_Image_Nov_16_2025_01_25_54_PM_ndrcsr.png",
        };
      }
    }

    const finalPost = {
      ...post,
      author:
        author || {
          name: "Unknown",
          followers_count: 0,
          avatar_url:
            "https://res.cloudinary.com/dhxxlwa6n/image/upload/v1763292698/ChatGPT_Image_Nov_16_2025_01_25_54_PM_ndrcsr.png",
        },
      image_url:
        post.image_url ||
        "https://res.cloudinary.com/dhxxlwa6n/image/upload/v1730000000/placeholder.jpg",
    };

    return Response.json(finalPost, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/posts/[id] error:", err);
    return Response.json(
      { message: "Failed to fetch post", details: err.message },
      { status: 500 }
    );
  }
}

/* ---------------------------------------------------
   PATCH /api/posts/[id]
   עדכון לייקים + עדכוני פוסט רגילים
--------------------------------------------------- */
export async function PATCH(req: NextRequest, ctx: ParamsCtx) {
  try {
    const { id } = await ctx.params;

    await dbConnect();

    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { _id: id } : { id: Number(id) };

    const body = await req.json().catch(() => ({}));

    // מסלול לייקים בלבד
    if (body.delta !== undefined) {
      const delta =
        typeof body.delta === "number" && !Number.isNaN(body.delta)
          ? body.delta
          : 1;

      const updatedLikes = await (Post as any)
        .findOneAndUpdate(query, { $inc: { likes_count: delta } }, { new: true })
        .lean();

      if (!updatedLikes) {
        return Response.json({ message: "Post not found" }, { status: 404 });
      }

      return Response.json(
        { likes_count: updatedLikes.likes_count },
        { status: 200 }
      );
    }

    // מסלול עדכון מלא
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
      return Response.json({ message: "Post not found" }, { status: 404 });
    }

    return Response.json(updatedPost, { status: 200 });
  } catch (err: any) {
    console.error("PATCH /api/posts/[id] error:", err);
    return Response.json(
      { message: "Failed to update post", details: err.message },
      { status: 500 }
    );
  }
}

/* ---------------------------------------------------
   DELETE /api/posts/[id]
   מחיקת פוסט
--------------------------------------------------- */
export async function DELETE(_req: NextRequest, ctx: ParamsCtx) {
  try {
    const { id } = await ctx.params;

    await dbConnect();

    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { _id: id } : { id: Number(id) };

    const deleted = await (Post as any).findOneAndDelete(query).lean();

    if (!deleted) {
      return Response.json({ message: "Post not found" }, { status: 404 });
    }

    return Response.json(
      { message: "Post deleted successfully", deletedId: id },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("DELETE /api/posts/[id] error:", err);
    return Response.json(
      { message: "Failed to delete post", details: err.message },
      { status: 500 }
    );
  }
}
