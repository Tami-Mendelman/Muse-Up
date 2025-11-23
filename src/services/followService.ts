export type SimpleUser = {
  _id: string;
  username: string;
  name?: string;
  profil_url?: string;
};

export async function getFollowersForUser(
  firebaseUid: string
): Promise<SimpleUser[]> {
  const res = await fetch(
    `/api/followers-users?userId=${encodeURIComponent(firebaseUid)}`
  );

  if (!res.ok) {
    throw new Error("Followers error");
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
    throw new Error("Following error");
  }

  const data = await res.json();

  const list: SimpleUser[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any).users)
    ? (data as any).users
    : [];

  return list;
}
