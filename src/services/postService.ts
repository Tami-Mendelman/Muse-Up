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
export async function getPostById(postId: number) {
  const res = await fetch(`/api/posts/${postId}`);
  if (!res.ok) throw new Error("Failed to load post");
  return res.json();
}

export async function updatePostLikes(postId: number, delta: number) {
  const res = await fetch(`/api/posts/${postId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ delta }),
  });
  if (!res.ok) throw new Error("Failed to update likes");
}
export type UpdatePostPayload = {
  title?: string;
  body?: string;
  image_url?: string;
  tags?: string[];
};

export async function updatePost(postId: string, payload: UpdatePostPayload) {
  const res = await fetch(`/api/posts/${postId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to update post");
  }

  return res.json();
}
