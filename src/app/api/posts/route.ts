export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import PostModel from "../../../models/Post";
import User from "../../../models/User";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const firebase_uid = searchParams.get("firebase_uid");

    const filter: any = {};

    if (firebase_uid) {
      // מוצאים את המשתמש לפי firebase_uid
      const user = await User.findOne({ firebase_uid }).lean();

      if (!user) {
        return NextResponse.json([], { status: 200 });
      }

      // מסננים לפי user_id
      filter.user_id = user._id;
    }

    const posts = await PostModel.find(filter)
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

// ---------------- CREATE POST ----------------
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      title,
      body: content,
      image_url,
      user_uid,
      category,
      tags,
      visibility,
    } = body;

    if (!title || !image_url || !user_uid) {
      return NextResponse.json(
        { error: "title, image_url and user_uid are required" },
        { status: 400 }
      );
    }

    // מוצאים את המשתמש לפי firebase_uid
    const user = await User.findOne({ firebase_uid: user_uid }).lean();
    if (!user) {
      return NextResponse.json(
        { error: "No user found for this firebase UID" },
        { status: 404 }
      );
    }

    // יצירת ID מספרי אוטומטי (כמו הפוסטים הישנים)
    const lastPost = await PostModel.findOne().sort({ id: -1 }).lean();
    const nextId = lastPost?.id ? lastPost.id + 1 : 1;

    // יצירת הפוסט
    const newPost = await PostModel.create({
      id: nextId, // חשוב מאוד
      title,
      body: content ?? "",
      image_url,
      category: category ?? "",
      tags: tags ?? [],
      visibility: visibility ?? "public",
      status: "active",
      likes_count: 0,
      comments_count: 0,
      user_uid,
      user_id: user._id,
      created_at: new Date(),
      updated_at: new Date(),
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
