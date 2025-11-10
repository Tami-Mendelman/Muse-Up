import { dbConnect } from "../.././lib/mongoose";
import UserModel from "../.././models/User";
type User = {
  _id: string;
  username: string;
  name?: string;
  email: string;
  role: string;
  location?: string;
  bio?: string;
  followers_count: number;
  following_count: number;
  artworks_count: number;
  likes_received: number;
  created_at?: string;
};

export default async function UsersPage() {

  await dbConnect();

const users = await UserModel.find().lean<User[]>();

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Users from MongoDB</h1>

      {!users.length ? (
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
              <div>
                <strong>{u.username}</strong>{" "}
                {u.name && <span>({u.name})</span>} – {u.role}
              </div>
              <div>Email: {u.email}</div>
              {u.location && <div>Location: {u.location}</div>}
              {u.bio && <div>Bio: {u.bio}</div>}
              <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                Followers: {u.followers_count} | Following: {u.following_count} |{" "}
                Artworks: {u.artworks_count} | Likes: {u.likes_received}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
