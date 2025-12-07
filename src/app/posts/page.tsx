"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./posts.module.css";
import PostModal from "../components/PostModal/PostModal";

export default function PostsPage() {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load posts from API
  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error("Failed to fetch posts");

      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Load on first render
  useState(() => {
    loadPosts();
  });

  // Close modal → refresh posts
  function handleCloseModal() {
    setSelectedPostId(null);
    loadPosts(); // ← refresh list so likes update
  }

  if (loading) {
    return <div className={styles.page}>Loading posts...</div>;
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>All Posts</h1>

      <div className={styles.grid}>
        {posts.map((p) => (
          <div
            key={p._id}
            className={styles.card}
            onClick={() => setSelectedPostId(String(p.id))}
          >
            <div className={styles.imageWrap}>
              <Image
                src={p.image_url}
                alt={p.title}
                width={300}
                height={200}
                className={styles.image}
              />
            </div>

            <div className={styles.content}>
              <h3 className={styles.postTitle}>{p.title}</h3>

              <div className={styles.author}>
                <Image
                  src={
                    p.author?.avatar_url ||
                    "https://res.cloudinary.com/dhxxlwa6n/image/upload/v1763292698/ChatGPT_Image_Nov_16_2025_01_25_54_PM_ndrcsr.png"
                  }
                  alt={p.author?.name || "Unknown"}
                  width={28}
                  height={28}
                  className={styles.avatar}
                />
                <span>{p.author?.name || "Unknown"}</span>
              </div>

              <div className={styles.footer}>
                <span>❤️ {p.likes_count ?? 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* POST MODAL */}
      {selectedPostId && (
        <PostModal
          postId={selectedPostId}
          onClose={handleCloseModal} // ← correct handler
        />
      )}
    </main>
  );
}
