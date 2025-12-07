import { PostCard } from "./postService";

export async function getSavedPostIds(uid: string): Promise<number[]> {
  const res = await fetch(`/api/users/${uid}/saved-posts`);
  if (!res.ok) {
    console.error("Failed to fetch saved post IDs, status:", res.status);
    return [];
  }
  return res.json();
}

export async function getSavedPosts(uid: string): Promise<PostCard[]> {
  const ids = await getSavedPostIds(uid);

  if (ids.length === 0) return [];

  const posts = await Promise.all(
    ids.map(async (id: number) => {
      const res = await fetch(`/api/posts/${id}`);
      if (!res.ok) return null;
      return res.json();
    })
  );

  return posts.filter(Boolean) as PostCard[];
}

export async function savePost(uid: string, postId: number) {
  const res = await fetch(`/api/users/${uid}/saved-posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId }),
  });

  if (!res.ok) throw new Error("Failed to save post");

  return res.json();
}

export async function unsavePost(uid: string, postId: number) {
  const res = await fetch(`/api/users/${uid}/saved-posts`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId }),
  });

  if (!res.ok) throw new Error("Failed to unsave post");

  return res.json();
}
