import Image from "next/image";
import Link from "next/link";
import { dbConnect } from "../.././lib/mongoose";
import UserModel from "../.././models/User";
import PostModel from "../.././models/Post";
import TrendingSection from "../components/TrendingSection";
import styles from "./landingPage.module.css";

export default async function LandingPage() {
  await dbConnect();

  // 🎨 Artists
  const artists = await UserModel.find(
    {},
    { _id: 0, username: 1, name: 1, artType: 1, avatarUrl: 1 }
  )
    .sort({ followers_count: -1 })
    .limit(5)
    .lean();

  // 🔥 Trending posts – שמים לב שהוספנו body
  const trendingRaw = await (PostModel as any)
    .find(
      {},
      {
        _id: 0,
        id: 1,
        title: 1,
        image_url: 1,
        likes_count: 1,
        body: 1,          // 👈 חדש – התוכן של הפוסט מהיצירה
      }
    )
    .sort({ likes_count: -1 })
    .limit(6)
    .lean();

  // מעבירים את האובייקטים כמו שהם (כולל body)
  const trending = trendingRaw.map((p: any) => ({
    id: p.id,
    title: p.title,
    image_url: p.image_url,
    likes_count: p.likes_count,
    body: p.body,        // 👈 חדש – כדי שיגיע עד המודאל
  }));

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.mainGrid}>
          <div className={styles.leftCol}>
            <section className={styles.hero}>
              <h1 className={styles.title}>
                Welcome back to your creative world.
              </h1>
              <p className={styles.subtitle}>
                Share your art, discover fresh ideas, and connect with creators
                like you.
              </p>
              <div className={styles.actions}>
                <Link href="/create" className={styles.primaryBtn}>
                  Share your art
                </Link>
                <Link href="/explore" className={styles.linkBtn}>
                  Explore artworks →
                </Link>
              </div>
            </section>

            <section className={styles.bottomLeft}>
              <TrendingSection trending={trending} />

              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Artists to follow</h2>
                <ul className={styles.artistList}>
                  {artists.map((a: any) => (
                    <li key={a.username} className={styles.artistRow}>
                      <div className={styles.avatarWrap}>
                        <Image
                          src={
                            a?.avatarUrl ||
                            "https://res.cloudinary.com/dhxxlwa6n/image/upload/v1763292698/ChatGPT_Image_Nov_16_2025_01_25_54_PM_ndrcsr.png"
                          }
                          alt={a?.username}
                          width={40}
                          height={40}
                          className={styles.avatar}
                        />
                      </div>
                      <div className={styles.artistInfo}>
                        <div className={styles.artistName}>
                          {a?.name ?? a?.username}
                        </div>
                        <div className={styles.artistType}>
                          {a?.artType ?? "Artist"}
                        </div>
                      </div>
                      <button className={styles.followBtn}>Follow</button>
                    </li>
                  ))}
                </ul>
                <Link href="/artists" className={styles.moreLink}>
                  See more artists →
                </Link>
              </div>
            </section>
          </div>

          <div className={styles.rightCol}>
            <div className={styles.heroImageCard}>
              <Image
                src="https://res.cloudinary.com/dhxxlwa6n/image/upload/v1762947874/image_2_xs7epz.png"
                alt="MuseUp colorful artwork"
                width={520}
                height={420}
                className={styles.heroImg}
                priority
              />
            </div>

            <aside className={styles.challengeCard}>
              <div className={styles.challengeContent}>
                <h3 className={styles.challengeTitle}>
                  Weekly Challenge: “Light & Shadow”
                </h3>
                <p className={styles.challengeText}>
                  Post one artwork exploring contrast.
                </p>
              </div>
              <div className={styles.challengeVisual} />
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
