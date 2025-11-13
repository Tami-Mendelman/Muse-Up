import Image from "next/image";
import Link from "next/link";
import { dbConnect } from "../.././lib/mongoose";
import UserModel from "../.././models/User";
import PostModel from "../.././models/Post";
import styles from "./landingPage.module.css";

export default async function LandingPage() {
  await dbConnect();

  const artists = await UserModel.find(
    {},
    { username: 1, name: 1, artType: 1, avatarUrl: 1 }
  )
    .sort({ followers_count: -1 })
    .limit(5)
    .lean();

  const trending = await (PostModel as any)
    .find(
      {},
      { title: 1, image_url: 1, likes_count: 1 }
    )
    .sort({ likes_count: -1 })
    .limit(6)
    .lean();

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
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Trending this week</h2>
                <div className={styles.trendingGrid}>
                  {trending.map((p: any) => (
                    <div key={p._id} className={styles.artCard}>
                      <div className={styles.artThumb}>
                        {p.image_url ? (
                          <Image
                            src={p.image_url}
                            alt={p.title ?? "artwork"}
                            fill
                            sizes="260px"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div className={styles.placeholder} />
                        )}
                      </div>
                      <div className={styles.artMeta}>
                        <div className={styles.artTitle}>
                          {p.title ?? "Unknown"}
                        </div>
                        <div className={styles.artLikes}>
                          {p.likes_count ?? 0} likes
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Artists to follow</h2>
                <ul className={styles.artistList}>
                  {artists.map((a: any) => (
                    <li key={a._id} className={styles.artistRow}>
                      <div className={styles.avatarWrap}>
                        <Image
                          src={a?.avatarUrl || "/images/default-avatar.png"}
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
