"use client";
import { useState } from "react";
import styles from "./profile.module.css";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { useFirebaseUid } from "../../hooks/useFirebaseUid";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getUserByUid, type User } from "../../services/userService";
import { getUserPosts, type PostCard } from "../../services/postService";
import { getSavedPosts } from "../../services/savedPostService";
import { getFollowersForUser, getFollowingForUser, type SimpleUser } from "../../services/followService";

import PostModal from "../components/PostModal/PostModal";

type TabKey = "posts" | "saved" | "collections" | "challenge" | "edit" | "followers" | "following";

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>("posts");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // ⭐ מודאל מחיקה
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  const { uid, ready: uidReady } = useFirebaseUid();

  const { data: user } = useQuery<User>({
    queryKey: ["user", uid],
    queryFn: () => getUserByUid(uid as string),
    enabled: uidReady && !!uid,
  });

  const { data: posts = [] } = useQuery<PostCard[]>({
    queryKey: ["posts", user?._id],
    queryFn: () => getUserPosts(user!._id),
    enabled: !!user && activeTab === "posts",
  });

  const { data: savedPosts = [] } = useQuery<PostCard[]>({
    queryKey: ["savedPosts"],
    queryFn: getSavedPosts,
    enabled: activeTab === "saved",
  });

  const { data: followers = [] } = useQuery<SimpleUser[]>({
    queryKey: ["followers", user?.firebase_uid],
    queryFn: () => getFollowersForUser(user!.firebase_uid),
    enabled: activeTab === "followers",
  });

  const { data: following = [] } = useQuery<SimpleUser[]>({
    queryKey: ["following", user?.firebase_uid],
    queryFn: () => getFollowingForUser(user!.firebase_uid),
    enabled: activeTab === "following",
  });

  if (!uidReady) return <div className={styles.page}>Loading…</div>;
  if (!uid) return <div className={styles.page}>Not signed in.</div>;
  if (!user) return <div className={styles.page}>Failed to load.</div>;

  // ⭐ הצגת מודאל מחיקה
  function openDeleteModal(postId: string) {
    setPostToDelete(postId);
    setShowDeleteModal(true);
  }

  // ⭐ מחיקה אמיתית
  async function confirmDelete() {
    if (!postToDelete) return;

    const res = await fetch(`/api/posts/${postToDelete}`, { method: "DELETE" });

    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["posts", user?._id] });
    }

    setShowDeleteModal(false);
    setPostToDelete(null);
  }

  return (
    <div className={styles.page}>
      {/** ------- MODAL מחיקה אמיתי ------- */}
      {showDeleteModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>Delete Post?</h3>
            <p>Are you sure you want to delete this post?</p>

            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>

              <button className={styles.modalConfirm} onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.avatarWrapper}>
          {user.profil_url ? (
            <img src={user.profil_url} className={styles.avatar} />
          ) : (
            <div className={styles.avatarFallback}>
              {user.username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className={styles.headerText}>
          <h1 className={styles.name}>{user.name ?? user.username}</h1>
          <div className={styles.metaRow}>
            <button onClick={() => setActiveTab("followers")} className={styles.metaItemButton}>
              {user.followers_count ?? 0} followers
            </button>
            <span className={styles.divider}>|</span>
            <button onClick={() => setActiveTab("following")} className={styles.metaItemButton}>
              {user.following_count ?? 0} following
            </button>
          </div>

          {user.bio && <p className={styles.bio}>{user.bio}</p>}
          {user.location && <p className={styles.location}>{user.location}</p>}
        </div>
      </header>

      {/* TABS */}
      <nav className={styles.tabs}>
        {[
          ["posts", "My Posts"],
          ["saved", "Saved"],
          ["collections", "Collections"],
          ["challenge", "Challenge"],
          ["edit", "Edit"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`${styles.tab} ${activeTab === key ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(key as TabKey)}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* CONTENT */}
      <section className={styles.content}>
        {activeTab === "posts" && (
          <div className={styles.postsSection}>
            <button
              className={styles.shareArtBtnSmall /* ⭐ כפתור מוקטן */}
              onClick={() => router.push("/create")}
            >
              share your art <span className={styles.sharePlus}>+</span>
            </button>

            <div className={styles.postsGrid}>
              {posts.map((p) => (
                <div key={p._id} className={styles.postCard} onClick={() => setSelectedPostId(p._id)}>
                  <img src={p.image_url} className={styles.postImage} />

                  <div className={styles.postActions}>
                    <button className={styles.postActionBtn} onClick={(e) => { e.stopPropagation(); router.push(`/edit-post/${p._id}`); }}>
                      <Pencil size={18} className={styles.icon} />
                    </button>

                    <button className={styles.postActionBtn} onClick={(e) => { e.stopPropagation(); openDeleteModal(p._id); }}>
                      <Trash2 size={18} className={styles.iconDelete} />
                    </button>
                  </div>

                  <div className={styles.postInfo}>
                    <h3 className={styles.postTitle}>{p.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {selectedPostId && <PostModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} />}
    </div>
  );
}
