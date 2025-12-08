"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./landingPage.module.css";
import StoriesRow from "./StoriesRow";
import type { Story, LandingPost } from "./page";
import PostModal from "../components/PostModal/PostModal";
type LandingClientProps = {
  stories: Story[];
  posts: LandingPost[];
};
const LOCAL_STORAGE_KEY = "firebase_uid";
export default function LandingClient({ stories, posts }: LandingClientProps) {
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  useEffect(() => {
    try {
      const uid = localStorage.getItem(LOCAL_STORAGE_KEY);
      setCurrentUid(uid);
    } catch {
      setCurrentUid(null);
    }
  }, []);
  const handlePostClick = (postId: string) => {
    setSelectedPostId(postId);
  };
  const handleCloseModal = () => {
    setSelectedPostId(null);
  };
  const filteredPosts = currentUid
    ? posts.filter((post) => post.userUid !== currentUid)
    : posts;
  return (
    <>
      <div className={styles.page}>
        <div className={styles.pageInner}>
          <header className={styles.header}>
          </header>
          <main className={styles.main}>
            <section className={styles.storiesSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Stories</h2>
                <Link href="/users" className={styles.linkButton}>
                  Watch all
                </Link>
              </div>
              <StoriesRow stories={stories} />
            </section>
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
                      <div className={styles.postStats}>
                        <span className={styles.postLikeIcon}>♡</span>
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
        <PostModal postId={selectedPostId} onClose={handleCloseModal} />
      )}
    </>
  );
}
