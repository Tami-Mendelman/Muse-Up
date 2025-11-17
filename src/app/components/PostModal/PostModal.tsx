"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import styles from "./PostModal.module.css";

type Comment = {
  id: number;
  post_id: number;
  user_id: number;
  body: string;
};

type PostModalProps = {
  onClose: () => void;
  post: {
    id: number;
    title?: string;
    image_url?: string;
    likes_count?: number;
    body?: string;
  };
};

const EMOJIS = ["😊", "😂", "😍", "🥰", "😎", "🤯", "😢", "🙏", "❤️", "🔥", "👍", "👏"];

export default function PostModal({ onClose, post }: PostModalProps) {
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [likes, setLikes] = useState<number>(post.likes_count ?? 0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  // 🔹 refs ל־UX נחמד
  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const commentsScrollRef = useRef<HTMLDivElement | null>(null);

  // 🔒 נועל גלילה של הדף מאחורה כשמודאל פתוח
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // 🎯 פוקוס אוטומטי על שדה התגובה כשהמודאל נפתח
  useEffect(() => {
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, []);

  // 🔁 טוען תגובות לפי post.id
  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      try {
        setLoadingComments(true);
        const res = await fetch(`/api/comments?postId=${post.id}`);
        if (!res.ok) {
          console.error(
            "Failed to fetch comments",
            await res.json().catch(() => ({}))
          );
          return;
        }
        const data = (await res.json()) as Comment[];
        if (!cancelled) {
          setComments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error loading comments", err);
      } finally {
        if (!cancelled) {
          setLoadingComments(false);
        }
      }
    }

    loadComments();
    return () => {
      cancelled = true;
    };
  }, [post.id]);

  // ✅ זוכר אם הפוסט כבר נעשה לו לייק בדפדפן הזה (localStorage)
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem("likedPosts");
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.includes(post.id)) {
        setLiked(true);
      } else {
        setLiked(false);
      }
    } catch (err) {
      console.error("Failed to read likedPosts from localStorage", err);
    }
  }, [post.id]);

  // 🔻 כל פעם שמתווספת תגובה – לגלול לתחתית רשימת התגובות
  useEffect(() => {
    const el = commentsScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [comments.length]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || sending) return;

    try {
      setSending(true);
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: post.id,
          user_id: 1,
          body: text,
        }),
      });

      if (!res.ok) {
        console.error(
          "Failed to create comment",
          await res.json().catch(() => ({}))
        );
        return;
      }

      const created = (await res.json()) as Comment;
      setComments((prev) => [...prev, created]);
      setCommentText("");

      // לפוקוס בחזרה אחרי שליחה
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    } catch (err) {
      console.error("Error posting comment", err);
    } finally {
      setSending(false);
    }
  }

  function handleEmojiClick(emoji: string) {
    setCommentText((prev) => prev + emoji);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }

  // ❤️ לייק אמיתי + זיכרון ב-localStorage
  async function handleLikeClick() {
    if (liking) return;

    const nextLiked = !liked;
    const delta = nextLiked ? 1 : -1;

    // עדכון אופטימי ב-UI
    setLiked(nextLiked);
    setLikes((prev) => Math.max(0, prev + delta));

    try {
      setLiking(true);
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });

      if (!res.ok) {
        console.error(
          "Failed to update likes",
          await res.json().catch(() => ({}))
        );
        // מחזירים את המצב אחורה
        setLiked(!nextLiked);
        setLikes((prev) => Math.max(0, prev - delta));
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (typeof data?.likes_count === "number") {
        setLikes(data.likes_count);
      }

      // ⬇️ רק אם העדכון הצליח – מעדכנים localStorage
      try {
        if (typeof window !== "undefined") {
          const key = "likedPosts";
          const raw = localStorage.getItem(key);
          let arr: number[] = [];
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) arr = parsed;
          }

          if (nextLiked) {
            if (!arr.includes(post.id)) arr.push(post.id);
          } else {
            arr = arr.filter((pid) => pid !== post.id);
          }

          localStorage.setItem(key, JSON.stringify(arr));
        }
      } catch (err) {
        console.error("Failed to update likedPosts in localStorage", err);
      }
    } catch (err) {
      console.error("Error updating likes", err);
      setLiked(!nextLiked);
      setLikes((prev) => Math.max(0, prev - delta));
    } finally {
      setLiking(false);
    }
  }

  return (
    <div className={styles.modalBackground}>
      <div className={styles.modalBox}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        <div className={styles.content}>
          {/* צד שמאל */}
          <div className={styles.left}>
            <div className={styles.leftScroll}>
              <h2 className={styles.postTitle}>{post.title ?? "Untitled"}</h2>

              <p className={styles.postText}>
                {post.body ?? "This post has no description."}
              </p>

              {/* שורת איקונים */}
              <div className={styles.iconRow}>
                <button
                  type="button"
                  className={`${styles.iconBtn} ${
                    liked ? styles.iconBtnActive : ""
                  }`}
                  onClick={handleLikeClick}
                  disabled={liking}
                >
                  {liked ? "❤️" : "♡"}
                </button>
                <span className={styles.iconBtn}>＋</span>
                <span className={styles.iconBtn}>👍</span>
              </div>

              {/* שורת מידע – הלייקים אמיתיים עכשיו */}
              <div className={styles.metaRow}>
                <span>8.5K followers</span>
                <span className={styles.metaDivider}>|</span>
                <span>{likes} likes</span>
                <span className={styles.metaDivider}>|</span>
                <span className={styles.metaAuthor}>Vincent van</span>
                <span className={styles.metaDot}></span>
              </div>

              {/* תגובות */}
              <div className={styles.commentsScroll} ref={commentsScrollRef}>
                {loadingComments ? (
                  <p className={styles.postTextMuted}>Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p className={styles.postTextMuted}>No comments yet.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className={styles.commentBubble}>
                      {c.body}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* שורת תגובה */}
            <form className={styles.commentRow} onSubmit={handleSubmit}>
              <input
                ref={commentInputRef}
                className={styles.commentInput}
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={sending}
              />
              <button
                type="button"
                className={styles.emojiBtn}
                onClick={() => setShowEmojiPicker((prev) => !prev)}
              >
                😊
              </button>
            </form>

            {showEmojiPicker && (
              <div className={styles.emojiPicker}>
                {EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className={styles.emojiItem}
                    onClick={() => handleEmojiClick(em)}
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* צד ימין – תמונה */}
          <div className={styles.right}>
            {post.image_url ? (
              <img src={post.image_url} alt={post.title ?? "post"} />
            ) : (
              <div className={styles.noImage}>no image</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
