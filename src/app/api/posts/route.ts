import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import Post from "../../../models/Post";

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

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();

    // לפי הטייפים שראינו ב-Post:
    // { title, image_url, user_id, body?, category? }
    const { title, image_url, user_id, body: text, category } = body;

    if (!title || !image_url || !user_id) {
      return NextResponse.json(
        { error: "title, image_url and user_id are required" },
        { status: 400 }
      );
    }

    const newPost = await (Post as any).create({
      title,
      image_url,
      user_id,
      body: text,
      category,
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
