"use client";

import Image from "next/image";
import styles from "../landing/landingPage.module.css";

type TrendingPost = {
  _id: string;
  title?: string;
  image_url?: string;
  likes_count?: number;
};

type Props = {
  trending: TrendingPost[];
};

export default function TrendingSection({ trending }: Props) {
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Trending this week</h2>
      <div className={styles.trendingGrid}>
        {trending.map((p) => (
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
              <div className={styles.artTitle}>{p.title ?? "Unknown"}</div>
              <div className={styles.artLikes}>
                {p.likes_count ?? 0} likes
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
