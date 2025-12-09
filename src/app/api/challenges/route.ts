export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import Challenge from "../../../models/Challenge";
import User from "../../../models/User";

export async function GET() {
  try {
    await dbConnect();
    const challenges = await (Challenge as any).find({})
      .sort({ start_date: 1 })
      .lean();
    const winnerIds = new Set<string>();
    for (const ch of challenges as any[]) {
      if (Array.isArray(ch.winners)) {
        ch.winners.forEach((w: any) => {
          if (w?.user_id) winnerIds.add(w.user_id);
        });
      }
    }

    let usersMap = new Map<string, any>();

    if (winnerIds.size > 0) {
      const users = await User.find({
        firebase_uid: { $in: Array.from(winnerIds) },
      })
        .select("firebase_uid username name profil_url")
        .lean();

      usersMap = new Map(
        users.map((u: any) => [u.firebase_uid as string, u])
      );
    }
    const enriched = (challenges as any[]).map((ch) => {
      if (!Array.isArray(ch.winners)) return ch;

      return {
        ...ch,
        winners: ch.winners.map((w: any) => ({
          ...w,
          user: usersMap.get(w.user_id) || null,
        })),
      };
    });

    return NextResponse.json(enriched, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/challenges error:", err);
    return NextResponse.json(
      { message: "Failed to load challenges", details: err.message },
      { status: 500 }
    );
  }
}

// export async function POST(req: NextRequest) {
//   try {
//     // auth by token in cookie
//     const token = req.cookies.get("token")?.value;
//     const user = await verifyToken(token || "");
//     if (!user) {
//       return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//     }

//     await dbConnect();

//     const { title, description, picture_url, status } = await req.json();

//     if (!title || !description || !picture_url) {
//       return NextResponse.json(
//         { message: "title, description and picture_url are required" },
//         { status: 400 }
//       );
//     }

//     const lastChallenge = await (Challenge as any)
//       .findOne()
//       .sort({ id: -1 })
//       .lean();

//     const nextId = (lastChallenge?.id ?? 0) + 1;

//     const newChallenge = await (Challenge as any)
//       .create({
//         id: nextId,
//         title,
//         description,
//         picture_url,
//         status: status || "active",
//       })
//       .then((doc: any) => doc.toObject());

//     return NextResponse.json(newChallenge, { status: 201 });
//   } catch (err: any) {
//     console.error("POST /api/challenges error:", err);
//     return NextResponse.json(
//       { message: "Failed to create challenge", details: err.message },
//       { status: 500 }
//     );
//   }
// }
