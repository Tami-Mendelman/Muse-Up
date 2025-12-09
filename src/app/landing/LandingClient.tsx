"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./landingPage.module.css";
import StoriesRow from "./StoriesRow";
import type { Story, LandingPost } from "./page";
import PostModal from "../components/PostModal/PostModal";
import { toggleLike } from "../../services/postService";

type LandingClientProps = {
  stories: Story[];
  posts: LandingPost[];
};

const LOCAL_STORAGE_KEY = "firebase_uid";

export default function LandingClient({ stories, posts }: LandingClientProps) {
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // רשימת פוסטים חיה בפיד
  const [localPosts, setLocalPosts] = useState<LandingPost[]>(posts);

  useEffect(() => {
    try {
      const uid = localStorage.getItem(LOCAL_STORAGE_KEY);
      setCurrentUid(uid);
    } catch {
      setCurrentUid(null);
    }
  }, []);

  function handlePostClick(postId: string) {
    setSelectedPostId(postId);
  }

  function handleCloseModal() {
    setSelectedPostId(null);
  }

  // לייק מהפיד עצמו
  async function handleLikeFromFeed(postId: string) {
    // עדכון מיידי ב־UI
    setLocalPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likes: p.likes + 1 } : p
      )
    );

    try {
      await toggleLike(postId, "like");
    } catch {
      // במקרה של שגיאה – להחזיר אחורה
      setLocalPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p
        )
      );
    }
  }

  // עדכון מהמודל (כשעושים לייק מתוך PostModal)
  function handlePostUpdateFromModal(updatedPost: any) {
    if (!updatedPost?._id) return;

    const updatedId = updatedPost._id.toString();
    const newLikes = updatedPost.likes_count;

    setLocalPosts((prev) =>
      prev.map((p) =>
        p.id === updatedId
          ? { ...p, likes: typeof newLikes === "number" ? newLikes : p.likes }
          : p
      )
    );
  }

  const filteredPosts = currentUid
    ? localPosts.filter((post) => post.userUid !== currentUid)
    : localPosts;

  return (
    <>
      <div className={styles.page}>
        <div className={styles.pageInner}>
          <main className={styles.main}>
            {/* STORIES */}
            <section className={styles.storiesSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Stories</h2>
                <Link href="/users" className={styles.linkButton}>
                  Watch all
                </Link>
              </div>
              <StoriesRow stories={stories} />
            </section>

            {/* FEED */}
            <section className={styles.feedSection}>
              <div className={styles.feedHeader}>
                <h2 className={styles.sectionTitle}>Feed</h2>
                <Link href="/posts" className={styles.linkButton}>
                  Watch all
                </Link>
              </div>

              <div className={styles.feedGrid}>
                {filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    className={styles.postCard}
                    onClick={() => handlePostClick(post.id)}
                  >
                    <div className={styles.postImageWrapper}>
                      <Image
                        src={post.image}
                        alt={post.author}
                        fill
                        className={styles.postImage}
                      />
                    </div>

                    <div className={styles.postFooter}>
                      <Link
                        href={`/users/${post.userUid}`}
                        className={styles.postUser}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className={styles.postAvatarWrapper}>
                          <Image
                            src={post.avatar || "/images/default-avatar.png"}
                            alt={post.author}
                            fill
                            className={styles.postAvatar}
                          />
                        </div>
                        <span className={styles.postAuthor}>
                          {post.author}
                        </span>
                      </Link>

                      {/* לייק בפיד עצמו */}
                      <div
                        className={styles.postStats}
                        onClick={(e) => {
                          e.stopPropagation(); // שלא יפתח מודל
                          handleLikeFromFeed(post.id);
                        }}
                      >
                        <span className={styles.postLikeIcon}>❤️</span>
                        <span className={styles.postLikes}>{post.likes}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>

      {selectedPostId && (
        <PostModal
          postId={selectedPostId}
          onClose={handleCloseModal}
          onPostUpdate={handlePostUpdateFromModal}
        />
      )}
    </>
  );
}
