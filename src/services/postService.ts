export type PostCard = {
  _id: string;
  id?: number;        
  title: string;
  image_url: string;
  user_id: string;
  likes_count?: number;
  comments_count?: number;
};

export async function getUserPosts(firebaseUid: string): Promise<PostCard[]> {
 const res = await fetch(`/api/posts?firebase_uid=${firebaseUid}`);
  if (!res.ok) throw new Error("Failed to fetch posts");

  const data = await res.json();

  const list: PostCard[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any).posts)
    ? (data as any).posts
    : [];

  return list;
}

export async function getPostById(postId: string) {
  const res = await fetch(`/api/posts/${postId}`);
  if (!res.ok) throw new Error("Failed to load post");
  return res.json();
}

export async function updatePostLikes(postId: string, delta: number) {
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
export async function savePost(uid: string, postId: number) {
  const res = await fetch(`/api/users/${uid}/saved-posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId }),
  });

  if (!res.ok) throw new Error("Failed to save post");
}

export async function unsavePost(uid: string, postId: number) {
  const res = await fetch(`/api/users/${uid}/saved-posts`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId }),
  });

  if (!res.ok) throw new Error("Failed to unsave post");
}
export async function getSavedPostIds(uid: string): Promise<number[]> {
  const res = await fetch(`/api/users/${uid}/saved-posts`);
  if (!res.ok) throw new Error("Failed to fetch saved posts");
  return res.json();
}
export async function getSavedPosts(uid: string): Promise<PostCard[]> {
  const ids = await getSavedPostIds(uid);

  // שליפת כל פוסט בנפרד לפי id
  const posts = await Promise.all(
    ids.map(async (id) => {
      const res = await fetch(`/api/posts/${id}`);
      if (!res.ok) return null;
      return res.json();
    })
  );

  return posts.filter(Boolean) as PostCard[];
}
