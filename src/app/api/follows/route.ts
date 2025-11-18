import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import Follow from "../../../models/Follow";

export async function GET(req: NextRequest) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId"); 
  const type = searchParams.get("type"); 

  if (!userId) {
    return NextResponse.json(
      { message: "userId query param is required" },
      { status: 400 }
    );
  }

  const query =
    type === "followers"
      ? { followed_user_id: userId }
      : { following_user_id: userId };

  try {
    const docs = await Follow.find(query).lean();
    return NextResponse.json(docs);
  } catch (err: any) {
    console.error("GET /api/follows error", err);
    return NextResponse.json(
      {
        message: "Failed to fetch follows",
        details: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();

  const body = await req.json();
  const { following_user_id, followed_user_id } = body ?? {};

  if (!following_user_id || !followed_user_id) {
    return NextResponse.json(
      {
        message: "following_user_id and followed_user_id are required",
      },
      { status: 400 }
    );
  }

  if (following_user_id === followed_user_id) {
    return NextResponse.json(
      { message: "Cannot follow yourself" },
      { status: 400 }
    );
  }

  try {
    const existing = await Follow.findOne({
      following_user_id,
      followed_user_id,
    }).lean();

    if (existing) {
      return NextResponse.json({ alreadyExists: true }, { status: 200 });
    }

    const doc = await Follow.create({
      following_user_id,
      followed_user_id,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/follows error", err);
    return NextResponse.json(
      {
        message: "Failed to create follow",
        details: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  await dbConnect();

  const body = await req.json();
  const { following_user_id, followed_user_id } = body ?? {};

  if (!following_user_id || !followed_user_id) {
    return NextResponse.json(
      {
        message: "following_user_id and followed_user_id are required",
      },
      { status: 400 }
    );
  }

  try {
    await Follow.deleteOne({ following_user_id, followed_user_id });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/follows error", err);
    return NextResponse.json(
      {
        message: "Failed to delete follow",
        details: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}
