export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import Like from "../../../models/Like";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const postIdParam = searchParams.get("postId");
    const userIdParam = searchParams.get("userId");

    const filter: any = {};
    if (postIdParam) filter.post_id = Number(postIdParam);
    if (userIdParam) filter.user_id = Number(userIdParam);

    const likes = await (Like as any).find(filter).lean();

    return Response.json(likes, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/likes error:", err);
    return Response.json(
      { message: "Failed to fetch likes", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { user_id, post_id } = await req.json();

    if (!user_id || !post_id) {
      return Response.json(
        { message: "user_id and post_id are required" },
        { status: 400 }
      );
    }
    let like = await (Like as any).findOne({ user_id, post_id }).lean();

    if (!like) {
      like = await (Like as any)
        .create({ user_id, post_id })
        .then((doc: any) => doc.toObject());
    }

    return Response.json(like, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/likes error:", err);
    return Response.json(
      { message: "Failed to create like", details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const { user_id, post_id } = await req.json();

    if (!user_id || !post_id) {
      return Response.json(
        { message: "user_id and post_id are required" },
        { status: 400 }
      );
    }

    const deleted = await (Like as any).findOneAndDelete({ user_id, post_id });

    if (!deleted) {
      return Response.json({ message: "Like not found" }, { status: 404 });
    }

    return Response.json({ message: "Like removed" }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/likes error:", err);
    return Response.json(
      { message: "Failed to delete like", details: err.message },
      { status: 500 }
    );
  }
}
