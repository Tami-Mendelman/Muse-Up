import Image from "next/image";
import Link from "next/link";
import { dbConnect } from "../../lib/mongoose";
import UserModel from "../../models/User";
import PostModel from "../../models/Post";
import TrendingSection from "../components/TrendingSection";
import ArtistsToFollowClient, { SimpleArtist } from "./ArtistsToFollowClient";
import styles from "./landingPage.module.css";

export default async function LandingPage() {
  await dbConnect();

  const artistsFromDb = await UserModel.find(
    {},
    {
      _id: 0,
      firebase_uid: 1,
      username: 1,
      name: 1,
      artType: 1,
      profil_url: 1,
      avatar_url: 1,
    }
  )
    .sort({ followers_count: -1 })
    .limit(6)
    .lean<any[]>();

  const artists: SimpleArtist[] = artistsFromDb.map((a) => ({
    firebase_uid: a.firebase_uid,
    username: a.username,
    name: a.name,
    artType: a.artType,
    profil_url: a.profil_url,
    avatar_url: a.avatar_url,
  }));

  const baseSelect = {
    _id: 0,
    id: 1,
    title: 1,
    image_url: 1,
    likes_count: 1,
    body: 1,
    created_at: 1,
    user_id: 1,
  };

  const popular = await (PostModel as any)
    .find({}, baseSelect)
    .sort({ likes_count: -1 })
    .limit(2)
    .lean();

  const latest = await (PostModel as any)
    .find({}, baseSelect)
    .sort({ created_at: -1 })
    .limit(2)
    .lean();

  const trendingRaw = [...popular, ...latest].filter(
    (p, index, arr) => index === arr.findIndex((x) => x.id === p.id)
  );

 const trendingWithAuthors = await Promise.all(
  trendingRaw.map(async (post: any) => {
    let user = null;

    // אם זה ObjectId רגיל
    if (mongoose.isValidObjectId(post.user_id)) {
      user = await UserModel.findById(post.user_id).lean().catch(() => null);
    } 
    // אחרת — זה firebase_uid
    else {
      user = await UserModel.findOne({ firebase_uid: post.user_id })
        .lean()
        .catch(() => null);
    }

    const author = user
      ? {
          name: user.name || "Unknown",
          avatar_url:
            user.avatar_url ||
            user.profil_url ||
            "https://res.cloudinary.com/dhxxlwa6n/image/upload/v1763292698/ChatGPT_Image_Nov_16_2025_01_25_54_PM_ndrcsr.png",
          followers_count: user.followers_count ?? 0,
        }
      : {
          name: "Unknown",
          avatar_url:
            "https://res.cloudinary.com/dhxxlwa6n/image/upload/v1763292698/ChatGPT_Image_Nov_16_2025_01_25_54_PM_ndrcsr.png",
          followers_count: 0,
        };

    return { ...post, author };
  })
);

  const trending = trendingWithAuthors;

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
              </div>
            </section>

       <section className={styles.bottomLeft}>
  <div className={styles.card}>

    <TrendingSection trending={trending} />

    <Link href="/posts" className={styles.moreLink}>
      See more posts →
    </Link>
  </div>

  <div className={styles.card}>
    <h2 className={styles.cardTitle}>Artists to follow</h2>

    <ArtistsToFollowClient artists={artists} />

    <Link href="/users" className={styles.moreLink}>
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
            <Link href="/challenges" className={styles.moreLink}>
  See all challenges →
</Link>

          </div>
        </div>
      </div>
    </main>
  );
}
