"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "../landing/landingPage.module.css";
import PostModal from "./PostModal/PostModal";

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dhxxlwa6n/image/upload/v1763292698/ChatGPT_Image_Nov_16_2025_01_25_54_PM_ndrcsr.png";

type TrendingPost = {
  _id?: string;
  id?: number;
  title?: string;
  image_url?: string;
  likes_count?: number;
  author?: {
    name?: string;
    avatar_url?: string;
  };
};

type Props = {
  trending: TrendingPost[];
};

export default function TrendingSection({ trending }: Props) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  return (
    <>
      <div>
        <h2 className={styles.cardTitle}>Trending this week</h2>

        <div className={styles.trendingGrid}>
          {trending.map((p) => {
            const postKey = `trending-${p._id || p.id || Math.random()}`;
            const postId = p._id || String(p.id || "");

            return (
              <div
                key={postKey}
                className={styles.artCard}
                onClick={() => setSelectedPostId(postId)}
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

                <div className={styles.artTitle}>
                  {(p.title ?? "Untitled").slice(0, 40)}
                  {p.title && p.title.length > 40 && "…"}
                </div>

                <div className={styles.authorBoxTrending}>
                  <img
                    src={p.author?.avatar_url || DEFAULT_AVATAR}
                    className={styles.authorAvatarTrending}
                    alt={p.author?.name || "Unknown"}
                  />
                  <span className={styles.authorNameTrending}>
                    {p.author?.name || "Unknown"}
                  </span>
                </div>

                <div className={styles.artLikes}>❤️ {p.likes_count ?? 0}</div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedPostId && (
        <PostModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} />
      )}
    </>
  );
}
