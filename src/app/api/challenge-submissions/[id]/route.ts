export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { dbConnect } from "../../../../lib/mongoose";
import ChallengeSubmission from "../../../../models/ChallengeSubmission";
import { verifyToken } from "../../../../lib/auth";

type ParamsCtx = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, ctx: ParamsCtx) {
  try {
    // auth by token in cookie
    const token = _req.cookies.get("token")?.value;
    const user = await verifyToken(token || "");
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    await dbConnect();

    const submission = await (ChallengeSubmission as any)
      .findOne({ id: numericId })
      .lean();

    if (!submission) {
      return NextResponse.json({ message: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json(submission, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/challenge-submissions/[id] error:", err);
    return NextResponse.json(
      { message: "Failed to fetch submission", details: err.message },
      { status: 500 }
    );
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

    const { id } = await ctx.params;
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    await dbConnect();

    const updates = await req.json();

    const updated = await (ChallengeSubmission as any)
      .findOneAndUpdate({ id: numericId }, { $set: updates }, { new: true })
      .lean();

    if (!updated) {
      return NextResponse.json({ message: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/challenge-submissions/[id] error:", err);
    return NextResponse.json(
      { message: "Failed to update submission", details: err.message },
      { status: 500 }
    );
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

    const { id } = await ctx.params;
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    await dbConnect();

    const deleted = await (ChallengeSubmission as any)
      .findOneAndDelete({ id: numericId });

    if (!deleted) {
      return NextResponse.json({ message: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Submission deleted" }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/challenge-submissions/[id] error:", err);
    return NextResponse.json(
      { message: "Failed to delete submission", details: err.message },
      { status: 500 }
    );
  }
}
