export type ArtistUser = {
  _id: string;
  username: string;
  name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  role: string;
  followers_count: number;
  artworks_count: number;
  likes_received: number;
};

export async function getAllArtists(): Promise<ArtistUser[]> {
  const res = await fetch("/api/users", { method: "GET" });

  if (!res.ok) {
    console.error("Failed to load users", await res.text());
    throw new Error("Failed to fetch artists");
  }

  return res.json();
}
