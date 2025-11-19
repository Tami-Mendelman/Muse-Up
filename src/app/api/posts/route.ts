export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import PostModel from "../../../models/Post";   // מודל הפוסטים

/** GET /api/posts – מחזיר את כל הפוסטים */
export async function GET() {
  try {
    await dbConnect();

    const posts = await (PostModel as any)
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

    // יצירת ID מספרי עוקבי
    const lastPost = await (PostModel as any)
      .findOne()
      .sort({ id: -1 })
      .lean();

    const newId = lastPost?.id ? lastPost.id + 1 : 1;

    // יצירת פוסט חדש ושמירתו
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
