"use client";

import { useState } from "react";
import Image from "next/image";
import { dbConnect } from "../../lib/mongoose";
import PostModel from "../../models/Post";
import UserModel from "../../models/User";
import styles from "./posts.module.css";
import PostModal from "../components/PostModal/PostModal";

export default function PostsPage() {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // נטען את הפוסטים מהשרת
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

  useState(() => {
    loadPosts();
  });

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
            onClick={() => setSelectedPostId(p._id)} // ✅ עכשיו הוא string
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

      {selectedPostId && (
        <PostModal
          postId={selectedPostId} // ✅ תואם לשינוי שלך
          onClose={() => setSelectedPostId(null)}
        />
      )}
    </main>
  );
}
