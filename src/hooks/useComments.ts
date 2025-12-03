import { useQuery } from "@tanstack/react-query";

export function useComments(postId: string | null) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const res = await fetch(`/api/comments?postId=${postId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!postId,
  });
}
