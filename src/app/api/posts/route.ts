export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import Post from "../../../models/Post";
import mongoose from "mongoose";

/** GET /api/posts – מחזיר את כל הפוסטים */
export async function GET() {
  try {
    await dbConnect();

    const posts = await (Post as any)
      .find()
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json(posts, { status: 200 });
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

    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const {
      title,
      image_url,
      user_id,
      body: text,
      category,
      tags,
      visibility,
    } = body;

    // ולידציה בסיסית
    if (!title || !image_url || !user_id) {
      return NextResponse.json(
        { error: "title, image_url and user_id are required" },
        { status: 400 }
      );
    }

    // בודקים שה־user_id בפורמט ObjectId תקין
    if (!mongoose.isValidObjectId(user_id)) {
      return NextResponse.json(
        { error: "Invalid user_id (must be a Mongo ObjectId)" },
        { status: 400 }
      );
    }

    const newPost = await (Post as any).create({
      title,
      image_url,
      user_id,
      body: text,
      category,
      ...(Array.isArray(tags) ? { tags } : {}),
      ...(visibility ? { visibility } : {}),
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
