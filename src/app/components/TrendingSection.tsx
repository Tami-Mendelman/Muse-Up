"use client";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PostModal from "./PostModal/PostModal";
import { getPostById } from "../../services/postService";
import styles from "../landing/landingPage.module.css";

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

export default function TrendingSection({ trending }: { trending: TrendingPost[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const postIdFromUrl = searchParams.get("postId");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const postIdToOpen = selectedPostId ?? postIdFromUrl;

  const { data: openedPost, isLoading } = useQuery({
    queryKey: ["post", postIdToOpen],
    queryFn: () => getPostById(postIdToOpen!),
    enabled: !!postIdToOpen,
  });

  function openModal(id: string) {
    setSelectedPostId(id);
    router.push(`/landing?postId=${id}`, { scroll: false });
  }

  function closeModal() {
    setSelectedPostId(null);
    router.push(`/landing`, { scroll: false });
  }

  return (
    <>
      <div>
        <h2 className={styles.cardTitle}>Trending this week</h2>

        <div className={styles.trendingGrid}>
          {trending.map((p) => {
            const postId = p._id || String(p.id);

            return (
              <div
                key={postId}
                className={styles.artCard}
                onClick={() => openModal(postId)}
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

      {(openedPost || isLoading) && postIdToOpen && (
        <PostModal postId={postIdToOpen} onClose={closeModal} />
      )}
    </>
  );
}
