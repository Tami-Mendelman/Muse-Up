import { dbConnect } from "../lib/mongoose";
import User from "../models/User";
import Post from "../models/Post";
import styles from "./HomePage.module.css";
import Link from "next/link";

type UserCard = {
  _id: string;
  username: string;
  name?: string;
  profil_url?: string;
  followers_count?: number;
  likes_received?: number;
  firebase_uid?: string;
};

async function getHomeData(): Promise<{
  users: UserCard[];
  artworkByUserId: Record<string, string>;
}> {
  await dbConnect();

  const rawUsers = await User.find()
    .sort({ followers_count: -1 })
    .limit(50)
    .lean();

  const users: UserCard[] = rawUsers.map((u: any) => ({
    _id: String(u._id),
    username: u.username,
    name: u.name,
    profil_url: u.profil_url,
    followers_count: u.followers_count ?? 0,
    firebase_uid: u.firebase_uid,
  }));

  const mongoIds = users.map((u) => String(u._id));
  const firebaseIds = users.map((u) => String(u.firebase_uid)).filter(Boolean);

  const posts = await Post.find({
    user_id: { $in: [...mongoIds, ...firebaseIds] },
  })
    .sort({ created_at: -1 })
    .lean();

  const artworkByUserId: Record<string, string> = {};

  for (const post of posts) {
    const pid = String(post.user_id);
    if (!pid || !post.image_url) continue;

    const matchingUser = users.find(
      (u) => String(u._id) === pid || String(u.firebase_uid) === pid
    );

    if (matchingUser) {
      const key = String(matchingUser._id);
      if (!artworkByUserId[key]) {
        artworkByUserId[key] = post.image_url;
      }
    }
  }

  const filteredUsers = users
    .filter((u) => artworkByUserId[String(u._id)])
    .slice(0, 8);

  return { users: filteredUsers, artworkByUserId };
}

export default async function HomePage() {
  const { users, artworkByUserId } = await getHomeData();

  return (
    <main className={styles.root}>
      <section className={styles.left}>
        <header className={styles.header}>
          <div className={styles.logoArea}>
            <img src="/media/logo1.png" alt="MuseUp Logo" className={styles.logoImg} />
          </div>

          <div className={styles.centerTitle}>
            <h2>A social network for artists</h2>
            <p>and art lovers</p>
          </div>

          <div className={styles.rightMenu}>
            <nav className={styles.linkList}>
              <Link href="/register" className={styles.linkItem}>Sign Up</Link>
              <Link href="/login" className={styles.linkItem}>Login</Link>
              <Link href="/about" className={styles.linkItem}>About</Link>
            </nav>
          </div>
        </header>

        <section className={styles.grid}>
          {users.map((u) => {
            const followers = Number(u.followers_count ?? 0).toLocaleString();
            const likes = Number(u.likes_received ?? 0).toLocaleString();
            const artworkSrc = artworkByUserId[String(u._id)];
            const avatarSrc = u.profil_url;

            return (
              <article key={u._id} className={styles.card}>
                <div className={styles.artPreview}>
                  <img
                    src={artworkSrc}
                    alt={`${u.name || u.username} artwork`}
                    className={styles.artImage}
                  />
                </div>

                <div className={styles.artistCircle}>
                  <div className={styles.artistCircleInner}>
                    <img
                      src={avatarSrc}
                      alt={`${u.username} avatar`}
                      className={styles.avatar}
                    />
                  </div>
                </div>

                <div className={styles.artistName}>
                  {u.name || u.username}
                </div>

                <div className={styles.medium}>digital</div>

                <div className={styles.statsLine}>
                  {followers} followers | {likes} likes
                </div>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
