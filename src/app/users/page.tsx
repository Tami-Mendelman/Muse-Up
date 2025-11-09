// src/app/users/page.tsx

type User = {
  _id: string;
  username: string;
  name?: string;
  email: string;
  role: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  followers_count: number;
  following_count: number;
  artworks_count: number;
  likes_received: number;
  created_at?: string;
  updated_at?: string;
};

async function getUsers(): Promise<User[]> {
  const res = await fetch("http://localhost:3000/api/Users", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default async function UsersPage() {
  let users: User[] = [];

  try {
    users = await getUsers();
  } catch (err) {
    console.error("Error loading users:", err);
  }

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Users from MongoDB</h1>

      {!users?.length ? (
        <p>No users found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {users.map((u) => (
            <li
              key={u._id}
              style={{
                marginBottom: "1.5rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid #ddd",
              }}
            >
              {/* כותרת – שם משתמש ותפקיד */}
              <div>
                <strong>{u.username}</strong>{" "}
                {u.name && <span>({u.name})</span>} –{" "}
                <span>{u.role}</span>
              </div>

              {/* אימייל */}
              <div>Email: {u.email}</div>

              {/* מיקום */}
              {u.location && <div>Location: {u.location}</div>}

              {/* ביו */}
              {u.bio && <div>Bio: {u.bio}</div>}

              {/* סטטיסטיקות */}
              <div style={{ marginTop: "0.25rem" }}>
                Followers: {u.followers_count} | Following: {u.following_count} |{" "}
                Artworks: {u.artworks_count} | Likes received: {u.likes_received}
              </div>

              {/* תאריכים (אופציונלי) */}
              {u.created_at && (
                <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.25rem" }}>
                  Joined: {new Date(u.created_at).toLocaleDateString()}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
