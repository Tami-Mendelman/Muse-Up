export type User = {
  _id: string;
  firebase_uid: string;
  username: string;
  name?: string;
  profil_url?: string;
  bio?: string;
  location?: string;
  followers_count?: number;
  following_count?: number;
};

export type UpdateUserPayload = {
  name: string;
  username: string;
  bio: string;
  location: string;
  profil_url: string;
};

export async function getUserByUid(uid: string): Promise<User> {
  const res = await fetch(`/api/users/${uid}`);
  if (!res.ok) {
    throw new Error("User not found");
  }
  return res.json();
}


export async function updateUserProfile(
  firebaseUid: string,
  payload: UpdateUserPayload
): Promise<User> {
  const res = await fetch(`/api/users/${firebaseUid}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to update profile:", text);
    throw new Error("Failed to update profile");
  }

  return res.json();
}
export async function getAllUsers() {
  const res = await fetch("/api/users");

  if (!res.ok) {
    throw new Error("Failed to load users");
  }

  return res.json();
}

