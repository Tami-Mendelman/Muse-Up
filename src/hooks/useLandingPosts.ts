import { useQuery } from "@tanstack/react-query";

export async function fetchLandingPosts() {
  const res = await fetch("/api/landing-posts");
  if (!res.ok) throw new Error("Failed to load posts");
  return res.json();
}

export function useLandingPosts(initialPosts: any[]) {
  return useQuery({
    queryKey: ["landing-posts"],
    queryFn: fetchLandingPosts,
    refetchOnWindowFocus: false,
  });
}
