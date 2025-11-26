export type SimpleUser = {
  _id: string;
  username: string;
  name?: string;
  profil_url?: string;
   bio?: string; 
   firebase_uid?: string;
};

export type FollowDoc = {
  following_user_id: string;
  followed_user_id: string;
};

export async function getFollowersForUser(
  firebaseUid: string
): Promise<SimpleUser[]> {
  const res = await fetch(
    `/api/followers-users?userId=${encodeURIComponent(firebaseUid)}`
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to load followers list", text);
    throw new Error("Failed to load followers list");
  }

  const data = await res.json();

  const list: SimpleUser[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any).users)
    ? (data as any).users
    : [];

  return list;
}
export async function getFollowingForUser(
  firebaseUid: string
): Promise<SimpleUser[]> {
  const res = await fetch(
    `/api/following-users?userId=${encodeURIComponent(firebaseUid)}`
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to load following list", text);
    throw new Error("Failed to load following list");
  }

  const data = await res.json();

  const list: SimpleUser[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any).users)
    ? (data as any).users
    : [];

  return list;
}
export async function getRawFollowingForUser(
  firebaseUid: string
): Promise<FollowDoc[]> {
  const res = await fetch(
    `/api/follows?userId=${encodeURIComponent(
      firebaseUid
    )}&type=following`
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to load following list", text);
    throw new Error("Failed to load following list");
  }

  const data = await res.json();
  const list: FollowDoc[] = Array.isArray(data) ? (data as FollowDoc[]) : [];
  return list;
}
export async function toggleFollowUser(
  currentUserUid: string,
  targetUserUid: string,
  isAlreadyFollowing: boolean
): Promise<void> {
  const method = isAlreadyFollowing ? "DELETE" : "POST";

  const res = await fetch("/api/follows", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      following_user_id: currentUserUid,
      followed_user_id: targetUserUid,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to toggle follow", text);
    throw new Error("Failed to toggle follow");
  }
}
