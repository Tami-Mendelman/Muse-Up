"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import styles from "./PostModal.module.css";

type Comment = {
  id: number;
  post_id: number;
  user_id: string;
  body: string;
};

type Props = {
  onClose: () => void;
  postId: number;
};

const EMOJIS = ["😊", "😂", "😍", "🥰", "😎", "🤯", "😢", "🙏", "❤️", "🔥", "👍", "👏"];

export default function PostModal({ onClose, postId }: Props) {
  const [post, setPost] = useState<any>(null);
  const [loadingPost, setLoadingPost] = useState(true);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);

  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const commentsRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const emojiRef = useRef<HTMLDivElement | null>(null);

  // נועל גלילה ברקע
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // autofocus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // טעינת פוסט
  useEffect(() => {
    let cancel = false;

    async function loadPost() {
      setLoadingPost(true);
      try {
        const res = await fetch(`/api/posts/${postId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancel) {
          setPost(data);
          setLikes(data.likes_count ?? 0);
        }
      } finally {
        if (!cancel) setLoadingPost(false);
      }
    }

    loadPost();
    return () => {
      cancel = true;
    };
  }, [postId]);

  // טעינת תגובות
  useEffect(() => {
    let cancel = false;

    async function loadComments() {
      setLoadingComments(true);
      try {
        const res = await fetch(`/api/comments?postId=${postId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancel) setComments(Array.isArray(data) ? data : []);
      } finally {
        if (!cancel) setLoadingComments(false);
      }
    }

    loadComments();
    return () => {
      cancel = true;
    };
  }, [postId]);

  // זוכר לייקים בלוקאל סטורג'
  useEffect(() => {
    try {
      const arr = JSON.parse(localStorage.getItem("likedPosts") || "[]");
      if (arr.includes(postId)) setLiked(true);
    } catch {
      // ignore
    }
  }, [postId]);

  // גלילה לסוף התגובות
  useEffect(() => {
    commentsRef.current?.scrollTo({
      top: commentsRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [comments.length]);

  // סגירת אימוג'י פיקר בלחיצה בחוץ
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        showEmojiPicker &&
        emojiRef.current &&
        !emojiRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  // שליחת תגובה
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || sending) return;

    try {
      setSending(true);
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          user_id: "1",
          body: commentText,
        }),
      });

      if (!res.ok) return;

      const created = await res.json();
      setComments((prev) => [...prev, created]);
      setCommentText("");
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  }

  // לייק
  async function handleLike() {
    if (liking) return;

    const newLiked = !liked;
    const delta = newLiked ? 1 : -1;

    setLiked(newLiked);
    setLikes((prev) => prev + delta);

    try {
      setLiking(true);
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });

      if (!res.ok) throw new Error();

      const arr = JSON.parse(localStorage.getItem("likedPosts") || "[]");
      const updated = newLiked
        ? [...arr, postId]
        : arr.filter((x: number) => x !== postId);

      localStorage.setItem("likedPosts", JSON.stringify(updated));
    } catch {
      setLiked(!newLiked);
      setLikes((prev) => prev - delta);
    } finally {
      setLiking(false);
    }
  }

  return (
    <div className={styles.bg}>
      <div className={styles.box}>
        <button className={styles.close} onClick={onClose}>
          ✕
        </button>

        <div className={styles.inner}>
          {/* LEFT */}
          <div className={styles.left}>
            <h2 className={styles.title}>
              {loadingPost ? "Loading..." : post?.title}
            </h2>

            <p className={styles.body}>
              {loadingPost ? "Loading..." : post?.body}
            </p>

            <div className={styles.icons}>
              <button
                className={`${styles.iconBtn} ${liked ? styles.active : ""}`}
                onClick={handleLike}
              >
                {liked ? "❤️" : "♡"}
              </button>
              <span className={styles.iconBtn}>＋</span>
              <span className={styles.iconBtn}>👍</span>
            </div>

            <div className={styles.meta}>
              <span>{post?.author?.followers_count ?? 0} followers</span>
              <span className={styles.sep}>|</span>
              <span>{likes} likes</span>
              <span className={styles.sep}>|</span>
              <span className={styles.author}>{post?.author?.name}</span>
              <span className={styles.dot}></span>
            </div>

            <div ref={commentsRef} className={styles.comments}>
              {loadingComments ? (
                <p className={styles.muted}>Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className={styles.muted}>No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className={styles.comment}>
                    {c.body}
                  </div>
                ))
              )}
            </div>

            <form className={styles.inputRow} onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                className={styles.input}
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button
                type="button"
                className={styles.emoji}
                onClick={() => setShowEmojiPicker((v) => !v)}
              >
                😊
              </button>
            </form>

            {showEmojiPicker && (
              <div ref={emojiRef} className={styles.emojiPicker}>
                {EMOJIS.map((x) => (
                  <button
                    type="button"
                    key={x}
                    className={styles.emojiItem}
                    onClick={() => setCommentText((t) => t + x)}
                  >
                    {x}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className={styles.right}>
            {post?.image_url ? (
              <img src={post.image_url} alt={post?.title} className={styles.image} />
            ) : (
              <div className={styles.noImage}>No image</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
