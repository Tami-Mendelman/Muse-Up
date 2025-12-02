"use client";

import { useState, useEffect, useRef, type FormEvent, useCallback } from "react";
import styles from "./PostModal.module.css";

import { savePost, unsavePost } from "../../../services/postService";
import { useFirebaseUid } from "../../../hooks/useFirebaseUid";
import { Share2, Copy, Mail, Send, Link2, MessageCircle } from "lucide-react";

type Comment = {
  id: number;
  post_id: string;
  user_id: string;
  body: string;
};

type Props = {
  onClose: () => void;
  postId: string;
};

const EMOJIS = ["😊", "😂", "😍", "🥰", "😎", "🤯", "😢", "🙏", "❤️", "🔥", "👍", "👏"];
const REACTIONS = ["😍", "🔥", "😂", "🥰", "👍"];

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dhxxlwa6n/image/upload/v1763292698/ChatGPT_Image_Nov_16_2025_01_25_54_PM_ndrcsr.png";

export default function PostModal({ onClose, postId }: Props) {
  const { uid } = useFirebaseUid();

  const [post, setPost] = useState<any>(null);
  const [loadingPost, setLoadingPost] = useState(true);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);

  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  const [saved, setSaved] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showShare, setShowShare] = useState(false);


  const commentsRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const emojiRef = useRef<HTMLDivElement | null>(null);

  // Disable scroll under modal
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load post
  const loadPost = useCallback(async () => {
    setLoadingPost(true);
    try {
      const res = await fetch(`/api/posts/${postId}`);
      if (!res.ok) return;
      const data = await res.json();
      setPost(data);
      setLikes(data.likes_count ?? 0);
      console.log("📌 MODAL POST:", data);

    } finally {
      setLoadingPost(false);
    }
  }, [postId]);

  useEffect(() => { loadPost(); }, [loadPost]);

  // Load comments
  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      if (!res.ok) return;
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } finally {
      setLoadingComments(false);
    }
  }, [postId]);

  useEffect(() => { loadComments(); }, [loadComments]);

  // Restore Like & Save local-only state
  useEffect(() => {
    const likedArr: string[] = JSON.parse(localStorage.getItem("likedPosts") || "[]");
    setLiked(likedArr.includes(postId));

    // saved is now synced from server, but keep initial UI stable
    const savedArr: string[] = JSON.parse(localStorage.getItem("savedPosts") || "[]");
    setSaved(savedArr.includes(postId));
  }, [postId]);

  useEffect(() => {
    commentsRef.current?.scrollTo({
      top: commentsRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [comments.length]);

  // Close emoji picker outside click
  useEffect(() => {
    function closePicker(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) document.addEventListener("mousedown", closePicker);
    return () => document.removeEventListener("mousedown", closePicker);
  }, [showEmojiPicker]);
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
    } finally {
      setSending(false);
    }
  }

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

      const arr: string[] = JSON.parse(localStorage.getItem("likedPosts") || "[]");
      const updated = newLiked ? [...arr, postId] : arr.filter((x) => x !== postId);
      localStorage.setItem("likedPosts", JSON.stringify(updated));
    } catch {
      setLiked(!newLiked);
      setLikes((prev) => prev - delta);
    } finally {
      setLiking(false);
    }
  }

  // ⭐ UPDATED — SAVE USING MONGODB
  async function handleSave() {
    if (!uid || !post?.id) return;

    const newSaved = !saved;
    setSaved(newSaved);

    try {
      if (newSaved) {
        await savePost(uid, post.id);
      } else {
        await unsavePost(uid, post.id);
      }
    } catch (e) {
      setSaved(!newSaved);
    }
  }
  // ⭐ SHARE FUNCTION
  function handleShare(p) {
    const shareUrl = `${window.location.origin}/landing?postId=${p.id}`;

    if (navigator.share) {
      navigator.share({
        title: p.title,
        text: p.body,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied!");
    }
  }

  return (
    <div className={styles.bg}>
      <div className={styles.box}>
        <button className={styles.close} onClick={onClose}>✕</button>

        <div className={styles.inner}>
          {/* LEFT */}
          <div className={styles.left}>
            <h2 className={styles.title}>
              {loadingPost ? "Loading…" : post?.title}
            </h2>

            <p className={styles.body}>
              {loadingPost ? "Loading…" : post?.body}
            </p>

            {/* ICONS */}
            <div className={styles.icons}>
              <button
                className={`${styles.iconBtn} ${liked ? styles.active : ""}`}
                onClick={handleLike}
              >
                {liked ? "❤️" : "♡"}
              </button>

              <button
                className={`${styles.iconBtn} ${saved ? styles.saved : ""}`}
                onClick={handleSave}
              >
                {saved ? "✓" : "＋"}
              </button>
              <button className={styles.iconBtn} onClick={() => setShowShare((v) => !v)}>
                <Share2 size={22} strokeWidth={1.8} />
              </button>
            </div>
            {showShare && (
              <div className={styles.shareMenu}>

                {/* ⭐ COPY LINK */}
                <button
                  className={styles.shareItem}
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/landing?postId=${post?.id}`;
                    navigator.clipboard.writeText(shareUrl);
                    setShowShare(false);
                  }}
                >
                  <Copy size={18} /> Copy link
                </button>

                {/* ⭐ WHATSAPP */}
                <button
                  className={styles.shareItem}
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/landing?postId=${post?.id}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`);
                    setShowShare(false);
                  }}
                >
                  <MessageCircle size={18} /> WhatsApp
                </button>

                {/* ⭐ EMAIL */}
                <button
                  className={styles.shareItem}
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/landing?postId=${post?.id}`;
                    window.location.href = `mailto:?subject=Check this out&body=${encodeURIComponent(shareUrl)}`;
                    setShowShare(false);
                  }}
                >
                  <Mail size={18} /> Email
                </button>

                {/* ⭐ NATIVE SHARE (MOBILE) */}
                {navigator.share && (
                  <button
                    className={styles.shareItem}
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/landing?postId=${post?.id}`;
                      navigator.share({
                        title: post?.title,
                        text: post?.body,
                        url: shareUrl,
                      });
                      setShowShare(false);
                    }}
                  >
                    <Send size={18} /> Share (device)
                  </button>
                )}

              </div>
            )}

            {/* REACTIONS MENU */}
            {showReactions && (
              <div className={styles.reactionsMenu}>
                {REACTIONS.map((r) => (
                  <button
                    key={r}
                    className={styles.reactionItem}
                    onClick={() => setShowReactions(false)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            {/* META */}
            <div className={styles.meta}>
              <span>{post?.author?.followers_count ?? 0} followers</span>
              <span className={styles.sep}>|</span>
              <span>{likes} likes</span>
              <span className={styles.sep}>|</span>

              <div className={styles.authorBox}>
                <img
                  src={post?.author?.avatar_url || DEFAULT_AVATAR}
                  className={styles.authorAvatar}
                  alt={post?.author?.name || "Unknown"}
                />
                <span className={styles.authorName}>
                  {post?.author?.name || "Unknown"}
                </span>
              </div>
            </div>

            {/* COMMENTS */}
            <div ref={commentsRef} className={styles.comments}>
              {loadingComments ? (
                <p className={styles.muted}>Loading comments…</p>
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

            {/* ADD COMMENT */}
            <form className={styles.inputRow} onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                className={styles.input}
                placeholder="Add a comment…"
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
              <img
                src={post.image_url}
                className={styles.image}
                alt={post?.title || "Artwork"}
              />
            ) : (
              <div className={styles.noImage}>No image</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
