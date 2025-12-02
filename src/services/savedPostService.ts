import { PostCard } from "./postService";

export async function getSavedPostIds(uid: string): Promise<number[]> {
  const res = await fetch(`/api/users/${uid}/saved-posts`);
  // עכשיו ה-API תמיד מחזיר 200, אז אפשר לא לזרוק:
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
