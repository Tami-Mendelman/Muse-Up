export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import Comment from "../../../models/Comment";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const postIdParam = searchParams.get("postId");

    const filter: any = {};
    if (postIdParam) {
      filter.post_id = Number(postIdParam);
    }

    const comments = await (Comment as any).find(filter).lean();

    return Response.json(comments, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/comments error:", err);
    return Response.json(
      { message: "Failed to fetch comments", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { post_id, user_id, body } = await req.json();

    if (!post_id || !user_id || !body) {
      return Response.json(
        { message: "post_id, user_id and body are required" },
        { status: 400 }
      );
    }

    const lastComment = await (Comment as any)
      .findOne()
      .sort({ id: -1 })
      .lean();

    const nextId = (lastComment?.id ?? 0) + 1;

    const newComment = await (Comment as any)
      .create({ id: nextId, post_id, user_id, body })
      .then((doc: any) => doc.toObject());

    return Response.json(newComment, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/comments error:", err);
    return Response.json(
      { message: "Failed to create comment", details: err.message },
      { status: 500 }
    );
  }
}

