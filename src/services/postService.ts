export type PostCard = {
  _id: string;
  id?: number;
  title: string;
  image_url: string;
  user_id: string;
  likes_count?: number;
  comments_count?: number;
};

export async function getUserPosts(userMongoId: string): Promise<PostCard[]> {
  const res = await fetch(`/api/posts?userId=${userMongoId}`);
  if (!res.ok) {
    throw new Error("Posts error");
  }

  const data = await res.json();

  const list: PostCard[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any).posts)
    ? (data as any).posts
    : [];

  return list;
}
