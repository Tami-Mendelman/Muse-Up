export const runtime = "nodejs";

import { dbConnect } from "../../../../lib/mongoose";
import User from "../../../../models/User";
import type { NextRequest } from "next/server";

type ParamsCtx = {
  params: Promise<{ id: string }>;
};


export async function GET(_req: NextRequest, ctx: ParamsCtx) {
  try {
    const { id } = await ctx.params;

    await dbConnect();
    const user = await User.findOne({ firebase_uid: id });

    if (!user) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    return Response.json(user, { status: 200 });
  } catch (err: any) {
    if (err?.name === "CastError") {
      return Response.json({ message: "Invalid user id" }, { status: 400 });
    }
    return Response.json({ message: err?.message ?? "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: ParamsCtx) {
  try {
    const { id } = await ctx.params;

    await dbConnect();
    const body = await req.json();

    const updated = await User.findOneAndUpdate(
      { firebase_uid: id },
      { $set: body },
      { new: true }
    );

    if (!updated) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    return Response.json(updated, { status: 200 });
  } catch (err: any) {
    if (err?.name === "CastError") {
      return Response.json({ message: "Invalid user id" }, { status: 400 });
    }
    return Response.json({ message: err?.message ?? "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: ParamsCtx) {
  try {
    const { id } = await ctx.params;

    await dbConnect();
    const deleted = await User.findOneAndDelete({ firebase_uid: id },);

    if (!deleted) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    return Response.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (err: any) {
    if (err?.name === "CastError") {
      return Response.json({ message: "Invalid user id" }, { status: 400 });
    }
    return Response.json({ message: err?.message ?? "Server error" }, { status: 500 });
  }
}
