import { dbConnect } from "../../lib/mongoose";
import PostModel from "../../models/Post";
import User from "../../models/User";
import LandingClient from "./LandingClient";

export type Story = {
  id: string;
  label: string;
  avatar?: string;
  isYou?: boolean;
  userUid?: string;
};

export type LandingPost = {
  id: string;
  image: string;
  likes: number;
  author: string;
  avatar?: string;
  userUid: string;
};

async function getLandingData(): Promise<{
  stories: Story[];
  posts: LandingPost[];
}> {
  await dbConnect();

  // 1) Load raw posts
  const rawPosts = await PostModel.find({
    status: "active",
    visibility: "public",
  })
    .sort({ created_at: -1 })
    .limit(10)
    .lean();

  // 2) Load all users (map for fast lookup)
  const allUsers = await User.find({}).sort({ created_at: -1 }).lean();
  const userMap = new Map<string, (typeof allUsers)[number]>();
  allUsers.forEach((u) => userMap.set(u.firebase_uid, u));

  // 3) Format posts for Landing
  const posts: LandingPost[] = rawPosts.map((p: any) => {
    const user = userMap.get(p.user_id);
    return {
      id: p._id.toString(),
      image: p.image_url,
      likes: p.likes_count ?? 0,
      author: user?.username || user?.name || "Unknown",
      avatar: user?.profil_url,
      userUid: p.user_id,
    };
  });

  // 4) Stories list
  const stories: Story[] = [
    { id: "you", label: "You", isYou: true },
    ...allUsers.map((u) => ({
      id: u._id.toString(),
      label: u.username || u.name,
      avatar: u.profil_url,
      userUid: u.firebase_uid,
    })),
  ];

  return { stories, posts };
}

export default async function LandingPage() {
  const { stories, posts } = await getLandingData();
  return <LandingClient stories={stories} posts={posts} />;
}