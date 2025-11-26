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
};

type PostCard = {
  _id: string;
  user_id: string;
  image_url?: string;
};

async function getHomeData(): Promise<{
  users: UserCard[];
  artworkByUserId: Record<string, string>;
}> {
  await dbConnect();

  const users = (await User.find()
    .sort({ followers_count: -1 })
    .limit(6)
    .lean()) as unknown as UserCard[];

  const userIds = users.map((u) => String(u._id));

  const posts = (await (Post as any)
    .find({ user_id: { $in: userIds } })
    .sort({ created_at: -1 })
    .lean()) as PostCard[];

  console.log("HOME users ids:", userIds);
  console.log("HOME posts count:", posts.length);
  console.log("HOME posts user_ids:", posts.map((p) => p.user_id));

  const artworkByUserId: Record<string, string> = {};

  for (const post of posts) {
    const uid = String(post.user_id);
    if (!uid || !post.image_url) continue;

    if (!artworkByUserId[uid]) {
      artworkByUserId[uid] = post.image_url;
    }
  }

  return { users, artworkByUserId };
}

export default async function HomePage() {
  const { users, artworkByUserId } = await getHomeData();

  return (
    <main className={styles.root}>
      <section className={styles.left}>
        <header className={styles.header}>
          <div className={styles.logoArea}>
            <img
              src="https://res.cloudinary.com/dhxxlwa6n/image/upload/v1763634918/image__1_-removebg-preview_tepfvv.png"
              alt="MuseUp Logo"
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "8px",
                objectFit: "cover",
              }}
            />
          </div>

          <nav className={styles.nav}>
            <Link href="/register" className={styles.navBtn}>
              Sign Up
            </Link>
            <Link href="/login" className={styles.navBtn}>
              Login
            </Link>
            <Link href="/about" className={styles.navBtn}>
              About
            </Link>
          </nav>
        </header>

        <div className={styles.centerTitle}>
          <h2>A social network for artists</h2>
          <p>and art lovers</p>
        </div>

        <section className={styles.grid}>
          {users.map((u) => {
            const followers = Number(u.followers_count ?? 0).toLocaleString();
            const likes = Number(u.likes_received ?? 0).toLocaleString();

            const userKey = String(u._id);
            const artworkSrc = artworkByUserId[userKey] || ""; 
            const avatarSrc = u.profil_url || ""; 

            return (
              <article key={u._id} className={styles.card}>
                <div className={styles.artPreview}>
                  {artworkSrc && (
                    <img
                      src={artworkSrc}
                      alt={`${u.name || u.username} artwork`}
                      className={styles.artImage}
                    />
                  )}
                </div>

                <div className={styles.artistCircle}>
                  {avatarSrc && (
                    <img
                      src={avatarSrc}
                      alt={`${u.username} avatar`}
                      className={styles.avatar}
                    />
                  )}
                </div>

                <div className={styles.artistName}>{u.name || u.username}</div>
                <div className={styles.medium}>digital</div>

                <div className={styles.statsLine}>
                  {followers} followers | {likes} likes
                </div>
              </article>
            );
          })}
        </section>
      </section>

      <aside className={styles.right}>
        <div>
          <h1 className={styles.heroTitle}>
            Join the
            <br />
            MuseUp
            <br />
            community
          </h1>

          <ul className={styles.heroList}>
            <li>Share your creations</li>
            <li>Get inspired</li>
            <li>Connect with other artists</li>
          </ul>

          <Link href="/register" className={styles.ctaBtn}>
            Get Started +
          </Link>
        </div>

        <div className={styles.illustrationBox}>
          <img
            src="https://res.cloudinary.com/dhxxlwa6n/image/upload/v1763634876/eb57c0b0-9262-4fa0-a466-df17288cae0b_vcdv6o.png"
            alt="Artist illustration"
          />
        </div>
      </aside>
    </main>
  );
}
