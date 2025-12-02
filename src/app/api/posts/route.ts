export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import PostModel from "../../../models/Post";
import User from "../../../models/User";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    // auth by token in cookie
    const token = req.cookies.get("token")?.value;
    const user = await verifyToken(token || "");
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const firebase_uid = searchParams.get("firebase_uid");

    const filter: any = {};

    if (firebase_uid) {
      // ❗ מסננים לפי firebase_uid ישירות
      filter.user_id = firebase_uid;
    }

    const posts = await PostModel.find(filter)
      .sort({ created_at: -1 })
      .lean();

    const populatedPosts = await Promise.all(
      posts.map(async (post: any) => {
        let author = await User.findOne({ firebase_uid: post.user_id })
          .lean()
          .catch(() => null);

        return {
          ...post,
          author:
            author
              ? {
                  name: author.name,
                  avatar_url: author.avatar_url ?? author.profil_url ?? null,
                  followers_count: author.followers_count,
                  username: author.username,
                }
              : null,
        };
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
    // auth by token in cookie
    const token = req.cookies.get("token")?.value;
    const user = await verifyToken(token || "");
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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

    const user = await User.findOne({ firebase_uid: user_uid }).lean();
    if (!user) {
      return NextResponse.json(
        { error: "No user found for this firebase UID" },
        { status: 404 }
      );
    }

    const lastPost = await PostModel.findOne().sort({ id: -1 }).lean();
    const nextId = lastPost?.id ? lastPost.id + 1 : 1;

    const newPost = await PostModel.create({
      id: nextId,
      title,
      body: content ?? "",
      image_url,
      category: category ?? "",
      tags: tags ?? [],
      visibility: visibility ?? "public",
      status: "active",
      likes_count: 0,
      comments_count: 0,

      // ❗ שומרים firebase_uid ולא ObjectId
      user_id: user_uid,
      user_uid,
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
