"use client";

import { useState, useRef, type FormEvent } from "react";
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

export default function PostModal({ onClose, postId }: Props) {
  const { uid } = useFirebaseUid();

  const { data: post, isLoading: loadingPost } = usePost(postId);
  const { data: comments = [], isLoading: loadingComments } = useComments(postId);

  const { addCommentMutation, toggleLikeMutation, toggleSaveMutation } =
    usePostActions(postId, post?.id);

  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post?.likes_count ?? 0);
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
    if (!post) return;

    const newLiked = !liked;
    const delta = newLiked ? 1 : -1;

    setLiked(newLiked);
    setLikes((prev) => prev + delta);

    toggleLikeMutation.mutate(delta, {
      onError: () => {
        setLiked(!newLiked);
        setLikes((prev) => prev - delta);
      },
    });
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
        
        {/* CLOSE BUTTON → עכשיו btn-icon */}
        <button className={`btn-icon ${styles.close}`} onClick={onClose}>
          ✕
        </button>

        {/* AI BUTTON */}
        <div className={styles.aiTopRight}>
          {post?.image_url && <AiArtCritiqueButton image_url={post.image_url} />}
        </div>

        <div className={styles.inner}>
          
          {/* LEFT */}
          <div className={styles.left}>
            <h2 className={styles.title}>{loadingPost ? "Loading…" : post?.title}</h2>
            <p className={styles.body}>{loadingPost ? "Loading…" : post?.body}</p>

            {/* ICON ACTIONS */}
            <div className={styles.icons}>
              
              {/* LIKE — נשאר icon-only */}
              <button
                className={`${styles.iconBtn} ${liked ? styles.active : ""}`}
                onClick={handleLike}
              >
                {liked ? "❤️" : "♡"}
              </button>

              {/* SAVE — icon-only */}
              <button
                className={`${styles.iconBtn} ${saved ? styles.saved : ""}`}
                onClick={handleSave}
              >
                {saved ? "✓" : "＋"}
              </button>

              {/* SHARE — עכשיו btn-icon */}
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
              <span>{likes} likes</span>
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

              {/* EMOJI BUTTON → btn-icon */}
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
