export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import PostModel from "../../../models/Post";
import User from "../../../models/User";
import mongoose from "mongoose";
import { verifyToken } from "../../../lib/auth";

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
    const userId = searchParams.get("userId");

    const filter: any = {};
    if (userId) {
      filter.user_id = userId;
    }

    const posts = await (PostModel as any)
      .find(filter)
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
      user_id,
      category,
      tags,
      visibility,
    } = body;

    if (!title || !image_url || !user_id) {
      return NextResponse.json(
        { error: "title, image_url and user_id are required" },
        { status: 400 }
      );
    }

    const newPost = await (PostModel as any).create({
      title,
      body: content ?? "",
      image_url,
      user_id,
      category: category ?? "",
      tags: tags ?? [],
      visibility: visibility ?? "public",
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
