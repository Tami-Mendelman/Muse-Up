// src/services/savedPostService.ts
import { PostCard } from "./postService";

export async function getSavedPosts(): Promise<PostCard[]> {
  const savedIds = JSON.parse(localStorage.getItem("savedPosts") || "[]");

  if (savedIds.length === 0) {
    return [];
  }

  const results: PostCard[] = [];

  await Promise.all(
    savedIds.map(async (id: number) => {
      const res = await fetch(`/api/posts/${id}`);
      if (res.ok) {
        const data = await res.json();
        results.push(data);
      }
    })
  );

  return results;
}
