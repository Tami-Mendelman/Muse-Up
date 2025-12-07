export async function getComments(postId: number) {
  const res = await fetch(`/api/comments?postId=${postId}`);
  if (!res.ok) throw new Error("Failed to load comments");
  return res.json();
}

export async function addComment(postId: string, userId: string, body: string) {
  const res = await fetch(`/api/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      post_id: postId,
      user_id: userId,
      body,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || "Failed to add comment");
  }

  return res.json();
}

