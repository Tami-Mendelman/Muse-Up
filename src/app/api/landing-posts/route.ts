import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongoose";
import Post from "../../../models/Post";
import User from "../../../models/User";

export async function GET() {
  try {
    await dbConnect();

    // פוסטים אחרונים
    const posts = await Post.find()
      .sort({ created_at: -1 })
      .limit(30)
      .lean();

    // פורמט אחיד לפוסטים
    const formatted = await Promise.all(
      posts.map(async (p: any) => {
        // ⚠ במקום findById — משתמשים ב־firebase_uid
        const user = await User.findOne({ firebase_uid: p.user_id }).lean();

        return {
          id: String(p._id),
          title: p.title,
          body: p.body,
          image: p.image_url,
          likes: p.likes_count ?? 0,

          // 🧩 חשוב — userUid קיים אצלך כ־firebase_uid
          userUid: p.user_id,

          author: user?.username || user?.name || "Unknown",
          avatar: user?.profil_url ?? null,
        };
      })
    );

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("❌ Error loading landing posts:", err);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}
