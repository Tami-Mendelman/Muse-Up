"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "../landing/landingPage.module.css";
import PostModal from "./PostModal/PostModal";

type TrendingPost = {
  id: number;
  title?: string;
  image_url?: string;
  likes_count?: number;
};

type Props = {
  trending: TrendingPost[];
};

export default function TrendingSection({ trending }: Props) {
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  return (
    <>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Trending this week</h2>

        <div className={styles.trendingGrid}>
          {trending.map((p) => (
            <div
             key={`trending-${p.id}`}
              className={styles.trendingItem}
              onClick={() => setSelectedPostId(p.id)}
            >
              <div className={styles.trendingThumb}>
                <Image
                  src={p.image_url ?? "/placeholder.jpg"}
                  alt={p.title ?? "artwork"}
                  fill
                  sizes="300px"
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div className={styles.trendingInfo}>
                <div className={styles.trendingTitle}>
                  {(p.title ?? "Untitled").slice(0, 40)}
                  {p.title && p.title.length > 40 && "…"}
                </div>

                <div className={styles.trendingLikes}>
                  ❤️ {p.likes_count ?? 0}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedPostId !== null && (
        <PostModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} />
      )}
    </>
  );
}
