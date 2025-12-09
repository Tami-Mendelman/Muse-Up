"use client";

import {
  useState,
  useRef,
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
  /** פוסט מעודכן אחרי לייק/אנלייק – יעודכן ברשימות בחוץ */
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

  /* -------------------------------------------------------
     INITIALIZE LIKE STATE (פעם ראשונה שהפוסט נטען)
  -------------------------------------------------------- */
  if (post && uid && liked === null && likes === null) {
    const initialLiked = post.liked_by?.includes(uid) ?? false;
    setLiked(initialLiked);
    setLikes(post.likes_count ?? 0);
  }

  /* ADD COMMENT */
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!uid || !commentText.trim()) return;

    addCommentMutation.mutate(
      { userId: uid, body: commentText },
      {
        onSuccess: () => setCommentText(""),
      }
    );
  }

  /* LIKE */
  function handleLike() {
    if (!uid || !post || liked === null || likes === null) return;

    const newLiked = !liked;

    // עדכון מיידי ב־UI
    setLiked(newLiked);
    setLikes((prev) => (prev ?? 0) + (newLiked ? 1 : -1));

    const action = newLiked ? "like" : "unlike";

    toggleLikeMutation.mutate(
      { action },
      {
        onSuccess: (updatedPostFromServer: any) => {
          // אם השרת החזיר likes_count מעודכן – נעדכן ממנו
          if (typeof updatedPostFromServer?.likes_count === "number") {
            setLikes(updatedPostFromServer.likes_count);
          }

          // אם השרת החזיר liked_by – נעדכן לפי זה
          if (Array.isArray(updatedPostFromServer?.liked_by) && uid) {
            setLiked(updatedPostFromServer.liked_by.includes(uid));
          }

          // נעדכן גם את הרשימות החיצוניות (Landing / Posts)
          if (onPostUpdate) {
            onPostUpdate(updatedPostFromServer);
          }
        },
        onError: () => {
          // החזרה למצב הקודם במקרה של שגיאה
          setLiked(!newLiked);
          setLikes((prev) => (prev ?? 0) + (newLiked ? -1 : 1));
        },
      }
    );
  }

  /* SAVE / UNSAVE */
  function handleSave() {
    if (!uid || !post?.id) return;

    const newSaved = !saved;
    setSaved(newSaved);

    toggleSaveMutation.mutate(
      { userId: uid, save: newSaved },
      {
        onError: () => setSaved(!newSaved),
      }
    );
  }

  /* SHARE ACTIONS */
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
        {/* CLOSE BUTTON */}
        <button className={`btn-icon ${styles.close}`} onClick={onClose}>
          ✕
        </button>

        {/* AI BUTTON */}
        <div className={styles.aiTopRight}>
          {post?.image_url && <AiArtCritiqueButton image_url={post.image_url} />}
        </div>

        <div className={styles.inner}>
          {/* LEFT SIDE */}
          <div className={styles.left}>
            <h2 className={styles.title}>
              {loadingPost ? "Loading…" : post?.title}
            </h2>
            <p className={styles.body}>
              {loadingPost ? "Loading…" : post?.body}
            </p>

            {/* ICON ACTIONS */}
            <div className={styles.icons}>
              {/* LIKE BUTTON */}
              <button
                className={`${styles.iconBtn} ${liked ? styles.active : ""}`}
                onClick={handleLike}
              >
                {liked ? "❤️" : "♡"}
              </button>

              {/* SAVE BUTTON */}
              <button
                className={`${styles.iconBtn} ${saved ? styles.saved : ""}`}
                onClick={handleSave}
              >
                {saved ? "✓" : "＋"}
              </button>

              {/* SHARE */}
              <button
                className={`btn-icon ${styles.iconBtn}`}
                onClick={() => setShowShare((v) => !v)}
              >
                <Share2 size={22} />
              </button>
            </div>

            {/* SHARE MENU */}
            {showShare && (
              <div ref={shareRef} className={styles.shareMenu}>
                <button className="btn btn-outline" onClick={copyShareLink}>
                  <Copy size={18} /> Copy link
                </button>

                <button className="btn btn-outline" onClick={shareWhatsApp}>
                  <MessageCircle size={18} /> WhatsApp
                </button>

                <button className="btn btn-outline" onClick={shareEmail}>
                  <Mail size={18} /> Email
                </button>

                {navigator.share && (
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      navigator.share({
                        title: post?.title,
                        text: post?.body,
                        url: `${window.location.origin}/landing?postId=${post?.id}`,
                      });
                      setShowShare(false);
                    }}
                  >
                    <Send size={18} /> Share (device)
                  </button>
                )}
              </div>
            )}

            {/* META */}
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
                <span className={styles.authorName}>{post?.author?.name}</span>
              </div>
            </div>

            {/* COMMENTS */}
            <div ref={commentsRef} className={styles.comments}>
              {loadingComments ? (
                <p className={styles.muted}>Loading comments…</p>
              ) : comments.length === 0 ? (
                <p className={styles.muted}>No comments yet.</p>
              ) : (
                comments.map((c: Comment) => (
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
                className={`btn-icon ${styles.emoji}`}
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
                    className="btn-icon"
                    onClick={() => setCommentText((t) => t + x)}
                  >
                    {x}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDE */}
          <div className={styles.right}>
            {post?.image_url ? (
              <img src={post.image_url} className={styles.image} />
            ) : (
              <div className={styles.noImage}>No image</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
