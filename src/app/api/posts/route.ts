export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import PostModel from "../../../models/Post";
import User from "../../../models/User";
import mongoose from "mongoose";

/** GET /api/posts – כל הפוסטים כולל מידע על היוצר */
export async function GET() {
  try {
    await dbConnect();

    const posts = await (PostModel as any)
      .find()
      .sort({ created_at: -1 })
      .lean();

    const populatedPosts = await Promise.all(
      posts.map(async (post: any) => {
        let author = null;

        if (post.user_id && mongoose.isValidObjectId(post.user_id)) {
          const user = await User.findById(post.user_id).lean().catch(() => null);
          if (user) {
            author = {
              name: user.name,
              avatar_url: user.avatar_url ?? user.profil_url ?? null,
              followers_count: user.followers_count,
              username: user.username,
            };
          }
        }

        return { ...post, author };
      })
    );

    return NextResponse.json(populatedPosts, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts", details: error.message },
      { status: 500 }
    );
  }
}

/** POST /api/posts – יצירת פוסט חדש */
export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();

    const {
      title,
      image_url,
      user_id,
      body: text,
      category,
      tags = [],
      visibility = "public",
    } = body;

    if (!title || !image_url || !user_id) {
      return NextResponse.json(
        { error: "title, image_url and user_id are required" },
        { status: 400 }
      );
    }

    // יצירת ID מספרי
    const lastPost = await (PostModel as any)
      .findOne()
      .sort({ id: -1 })
      .lean();

    const newId = lastPost?.id ? lastPost.id + 1 : 1;

    const newPost = await (PostModel as any).create({
      id: newId,
      title,
      image_url,
      user_id,
      body: text,
      category,
      tags,
      visibility,
      status: "active",
      likes_count: 0,
      comments_count: 0,
      created_at: new Date(),
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post", details: error.message },
      { status: 500 }
    );
  }
}
