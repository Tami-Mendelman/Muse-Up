import { useQuery } from "@tanstack/react-query";

export function usePost(postId: string | null) {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${postId}`);
      if (!res.ok) throw new Error("Failed to load post");
      return res.json();
    },
    enabled: !!postId,
  });
}
