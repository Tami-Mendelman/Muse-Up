"use client";

import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
} from "react";
import styles from "./PostModal.module.css";

import { useFirebaseUid } from "../../../hooks/useFirebaseUid";
import useModalUI from "../../../hooks/useModalUI";

import { usePost } from "../../../hooks/usePost";
import { useComments } from "../../../hooks/useComments";
import { usePostActions } from "../../../hooks/usePostActions";

import { Share2, Copy, Mail, Send, MessageCircle } from "lucide-react";
import AiArtCritiqueButton from "../../components/AiArtCritiqueButton";

type Props = {
  onClose: () => void;
  postId: string;
  onPostUpdate?: (updatedPost: any) => void;
};

type Comment = {
  id: number;
  post_id: string;
  user_id: string;
  body: string;
};

const EMOJIS = ["😊", "😂", "😍", "🥰", "😎", "🔥", "👍"];
const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dhxxlwa6n/image/upload/v1763292698/ChatGPT_Image_Nov_16_2025_01_25_54_PM_ndrcsr.png";

export default function PostModal({ onClose, postId, onPostUpdate }: Props) {
  const { uid } = useFirebaseUid();

  const { data: post, isLoading: loadingPost } = usePost(postId);
  const { data: comments = [], isLoading: loadingComments } = useComments(postId);

  const { addCommentMutation, toggleLikeMutation, toggleSaveMutation } =
    usePostActions(postId, post?.id);

  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState<boolean | null>(null);
  const [likes, setLikes] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const bodyRef = useRef<HTMLParagraphElement | null>(null);
  const commentsRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const emojiRef = useRef<HTMLDivElement | null>(null);
  const shareRef = useRef<HTMLDivElement | null>(null);

  useModalUI({
    autoFocusRef: inputRef,
    emojiRef,
    shareRef,
    commentsRef,
    scrollDeps: [comments.length],
    onCloseEmoji: () => setShowEmojiPicker(false),
    onCloseShare: () => setShowShare(false),
  });

  /* INIT LIKE STATE */
  if (post && uid && liked === null && likes === null) {
    setLiked(post.liked_by?.includes(uid) ?? false);
    setLikes(post.likes_count ?? 0);
  }

  /* CHECK REAL OVERFLOW */
  useEffect(() => {
    if (!bodyRef.current || expanded) return;
    const el = bodyRef.current;
    setIsOverflowing(el.scrollHeight > el.clientHeight);
  }, [post?.body, expanded]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!uid || !commentText.trim()) return;
    addCommentMutation.mutate(
      { userId: uid, body: commentText },
      { onSuccess: () => setCommentText("") }
    );
  }

  function handleLike() {
    if (!uid || !post || liked === null || likes === null) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes((prev) => (prev ?? 0) + (newLiked ? 1 : -1));
    toggleLikeMutation.mutate({ action: newLiked ? "like" : "unlike" });
  }

  function handleSave() {
    if (!uid || !post?.id) return;
    const newSaved = !saved;
    setSaved(newSaved);
    toggleSaveMutation.mutate({ userId: uid, save: newSaved });
  }

  function copyShareLink() {
    if (!post?.id) return;
    navigator.clipboard.writeText(
      `${window.location.origin}/landing?postId=${post.id}`
    );
    setShowShare(false);
  }

  function shareWhatsApp() {
    if (!post?.id) return;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        `${window.location.origin}/landing?postId=${post.id}`
      )}`
    );
    setShowShare(false);
  }

  function shareEmail() {
    if (!post?.id) return;
    window.location.href = `mailto:?subject=Check this out&body=${encodeURIComponent(
      `${window.location.origin}/landing?postId=${post.id}`
    )}`;
    setShowShare(false);
  }

  return (
    <div className={styles.bg}>
      <div className={styles.box}>
        <button className={`btn-icon ${styles.close}`} onClick={onClose}>✕</button>

        {uid === post?.user_id && post?.image_url && (
          <div className={styles.aiTopRight}>
            <AiArtCritiqueButton image_url={post.image_url} />
          </div>
        )}

        <div className={styles.inner}>
          <div className={styles.left}>

            <h2 className={styles.title}>
              {loadingPost ? "Loading…" : post?.title}
            </h2>

            <div className={styles.meta}>
              <span>{post?.author?.followers_count ?? 0} followers</span>
              <span className={styles.sep}>|</span>
              <span>{likes ?? 0} likes</span>
              <span className={styles.sep}>|</span>
              <div className={styles.authorBox}>
                <img
                  src={post?.author?.avatar_url || DEFAULT_AVATAR}
                  className={styles.authorAvatar}
                />
                <span>{post?.author?.name}</span>
              </div>
            </div>

            <div
              className={`${styles.postBodyWrapper} ${
                expanded ? styles.expanded : ""
              }`}
            >
              <p
                ref={bodyRef}
                className={`${styles.body} ${!expanded ? styles.clamped : ""}`}
              >
                {post?.body}
              </p>
            </div>

            {isOverflowing && (
              <button
                className={styles.readMore}
                onClick={() => setExpanded(v => !v)}
              >
                {expanded ? "Read less" : "Read more"}
              </button>
            )}

            <div ref={commentsRef} className={styles.comments}>
              {loadingComments
                ? <p className={styles.muted}>Loading comments…</p>
                : comments.map((c: Comment) => (
                    <div key={c.id} className={styles.comment}>{c.body}</div>
                  ))
              }
            </div>

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
                className={`btn-icon ${styles.emoji}`}
                onClick={() => setShowEmojiPicker(v => !v)}
              >
                😊
              </button>
            </form>

            {showEmojiPicker && (
              <div ref={emojiRef} className={styles.emojiPicker}>
                {EMOJIS.map((x) => (
                  <button
                    key={x}
                    type="button"
                    className="btn-icon"
                    onClick={() => setCommentText(t => t + x)}
                  >
                    {x}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.right}>
            {post?.image_url && (
              <img src={post.image_url} className={styles.image} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
