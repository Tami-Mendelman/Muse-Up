export const runtime = "nodejs";

import { verifyToken } from "../../../../lib/auth";
import { dbConnect } from "../../../../lib/mongoose";
import User from "../../../../models/User";
import { NextResponse, type NextRequest } from "next/server";

type ParamsCtx = {
  params: Promise<{ uid: string }>;
};


export async function GET(_req: NextRequest, ctx: ParamsCtx) {
  try {
    // auth by token in cookie
    const token = _req.cookies.get("token")?.value;
    const _user = await verifyToken(token || "");
    if (!_user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { uid } = await ctx.params;

    await dbConnect();
    const user = await User.findOne({ firebase_uid: uid });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (err: any) {
    if (err?.name === "CastError") {
      return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
    }
    return NextResponse.json({ message: err?.message ?? "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: ParamsCtx) {
  try {
    // auth by token in cookie
    const token = req.cookies.get("token")?.value;
    const user = await verifyToken(token || "");
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { uid } = await ctx.params;

    await dbConnect();
    const body = await req.json();

    const updated = await User.findOneAndUpdate(
      { firebase_uid: uid },
      { $set: body },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    if (err?.name === "CastError") {
      return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
    }
    return NextResponse.json({ message: err?.message ?? "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: ParamsCtx) {
  try {
    // auth by token in cookie
    const token = _req.cookies.get("token")?.value;
    const user = await verifyToken(token || "");
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { uid } = await ctx.params;

    await dbConnect();
    const deleted = await User.findOneAndDelete({ firebase_uid: uid },);

    if (!deleted) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (err: any) {
    if (err?.name === "CastError") {
      return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
    }
    return NextResponse.json({ message: err?.message ?? "Server error" }, { status: 500 });
  }
}
