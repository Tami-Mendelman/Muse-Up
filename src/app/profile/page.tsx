"use client";
import { useState, ChangeEvent, FormEvent } from "react";
import styles from "./profile.module.css";
import { useRouter } from "next/navigation";
import AvatarCropper from "../components/CropImage/CropImage";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useFirebaseUid } from "../../hooks/useFirebaseUid";
import {
  useProfileEditForm,
  type EditFormState,
} from "../../hooks/useProfileEditForm";

import {
  getUserByUid,
  updateUserProfile,
  type User,
  type UpdateUserPayload,
} from "../../services/userService";
import { getUserPosts, type PostCard } from "../../services/postService";
import {
  getFollowersForUser,
  getFollowingForUser,
  type SimpleUser,
} from "../../services/followService";
import { uploadAvatar } from "../../services/uploadService";
import { getSavedPosts } from "../../services/savedPostService"; // ✅ חדש

type TabKey =
  | "posts"
  | "saved"
  | "collections"
  | "challenge"
  | "edit"
  | "followers"
  | "following";

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>("posts");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarFileToCrop, setAvatarFileToCrop] = useState<File | null>(null);

  const { uid, ready: uidReady } = useFirebaseUid();

  // ----- USER -----
  const {
    data: user,
    isLoading: loadingUser,
    error: userError,
  } = useQuery<User>({
    queryKey: ["user", uid],
    queryFn: () => getUserByUid(uid as string),
    enabled: uidReady && !!uid,
  });

  const { form: editForm, setForm: setEditForm } =
    useProfileEditForm(user ?? null);

  // ----- POSTS -----
  const {
    data: posts = [],
    isLoading: loadingPosts,
    error: postsError,
  } = useQuery<PostCard[]>({
    queryKey: ["posts", user?._id],
    queryFn: () => getUserPosts(user!._id),
    enabled: !!user && activeTab === "posts",
  });

  // ----- SAVED -----
  const {
    data: savedPosts = [],
    isLoading: loadingSaved,
    error: savedError,
  } = useQuery<PostCard[]>({
    queryKey: ["savedPosts"],
    queryFn: getSavedPosts,
    enabled: activeTab === "saved",
  });

  // ----- FOLLOWERS -----
  const {
    data: followers = [],
    isLoading: loadingFollowers,
    error: followersError,
  } = useQuery<SimpleUser[]>({
    queryKey: ["followers", user?.firebase_uid],
    queryFn: () => getFollowersForUser(user!.firebase_uid),
    enabled: !!user && activeTab === "followers",
  });

  // ----- FOLLOWING -----
  const {
    data: following = [],
    isLoading: loadingFollowing,
    error: followingError,
  } = useQuery<SimpleUser[]>({
    queryKey: ["following", user?.firebase_uid],
    queryFn: () => getFollowingForUser(user!.firebase_uid),
    enabled: !!user && activeTab === "following",
  });

  if (!uidReady) return <div className={styles.page}>Loading profile…</div>;
  if (!uid)
    return (
      <div className={styles.page}>
        <p>No logged-in user. Please sign in.</p>
      </div>
    );
  if (loadingUser) return <div className={styles.page}>Loading profile…</div>;
  if (userError || !user)
    return (
      <div className={styles.page}>
        <p>Failed to load profile.</p>
      </div>
    );

  // ----- HANDLERS -----
  function handleEditChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setEditForm((prev: EditFormState) => ({ ...prev, [name]: value }));
  }

  async function handleAvatarInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFileToCrop(file);
    setSaveError(null);
    setSaveSuccess(false);
  }

  const handleCroppedAvatarUpload = async (croppedFile: File) => {
    try {
      setUploadingAvatar(true);
      const url = await uploadAvatar(croppedFile);
      setEditForm((prev: EditFormState) => ({ ...prev, profil_url: url }));
      queryClient.setQueryData<User>(["user", uid], (old) =>
        old ? { ...old, profil_url: url } : old
      );
    } catch (err) {
      console.error("Failed to upload avatar", err);
      setSaveError("Upload failed. Please try again.");
    } finally {
      setUploadingAvatar(false);
      setAvatarFileToCrop(null);
    }
  };

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload: UpdateUserPayload = {
        name: editForm.name.trim(),
        username: editForm.username.trim(),
        bio: editForm.bio.trim(),
        location: editForm.location.trim(),
        profil_url: editForm.profil_url,
      };

      const updated = await updateUserProfile(user.firebase_uid, payload);
      queryClient.setQueryData<User>(["user", uid], updated);
      setSaveSuccess(true);
    } catch (err) {
      console.error(err);
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  // ----- RENDER -----
  return (
    <div className={styles.page}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.avatarWrapper}>
          {user.profil_url ? (
            <img
              src={user.profil_url}
              alt={user.name ?? user.username}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarFallback}>
              {user.username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className={styles.headerText}>
          <h1 className={styles.name}>{user.name ?? user.username}</h1>
          <div className={styles.metaRow}>
            <button
              type="button"
              className={styles.metaItemButton}
              onClick={() => setActiveTab("followers")}
            >
              {(user.followers_count ?? 0).toLocaleString()} followers
            </button>
            <span className={styles.divider}>|</span>
            <button
              type="button"
              className={styles.metaItemButton}
              onClick={() => setActiveTab("following")}
            >
              {(user.following_count ?? 0).toLocaleString()} following
            </button>
          </div>
          {user.bio && <p className={styles.bio}>{user.bio}</p>}
          {user.location && (
            <p className={styles.location}>{user.location}</p>
          )}
        </div>
      </header>

      {/* NAVIGATION */}
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
            className={`${styles.tab} ${
              activeTab === key ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab(key as TabKey)}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* CONTENT */}
      <section className={styles.content}>
        {/* POSTS */}
        {activeTab === "posts" && (
          <div className={styles.postsSection}>
            <button
              className={styles.shareArtBtn}
              onClick={() => router.push("/create")}
            >
              share your art
              <span className={styles.sharePlus}>+</span>
            </button>

            {loadingPosts && <p>Loading posts…</p>}
            {postsError && <p>Failed to load posts.</p>}
            {!loadingPosts && posts.length === 0 && (
              <p className={styles.placeholder}>No posts yet.</p>
            )}
            {!loadingPosts && posts.length > 0 && (
              <div className={styles.postsGrid}>
                {posts.map((p) => (
                  <div key={p._id} className={styles.postCard}>
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className={styles.postImage}
                    />
                    <div className={styles.postInfo}>
                      <h3 className={styles.postTitle}>{p.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SAVED */}
        {activeTab === "saved" && (
          <div className={styles.postsSection}>
            {loadingSaved && <p>Loading saved posts…</p>}
            {savedError && <p>Failed to load saved posts.</p>}
            {!loadingSaved && savedPosts.length === 0 && (
              <p className={styles.placeholder}>No saved posts yet.</p>
            )}
            {!loadingSaved && savedPosts.length > 0 && (
              <div className={styles.postsGrid}>
                {savedPosts.map((p) => (
                  <div key={p._id} className={styles.postCard}>
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className={styles.postImage}
                    />
                    <div className={styles.postInfo}>
                      <h3 className={styles.postTitle}>{p.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EDIT */}
        {activeTab === "edit" && (
          <form className={styles.editForm} onSubmit={handleSaveProfile}>
            <div className={styles.editGrid}>
              <div className={styles.editLeft}>
                <div className={styles.editField}>
                  <label className={styles.editLabel}>Name</label>
                  <input
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    className={styles.editInput}
                    placeholder="Your full name"
                  />
                </div>

                <div className={styles.editField}>
                  <label className={styles.editLabel}>Username</label>
                  <input
                    name="username"
                    value={editForm.username}
                    onChange={handleEditChange}
                    className={styles.editInput}
                    placeholder="Unique username"
                  />
                </div>

                <div className={styles.editField}>
                  <label className={styles.editLabel}>Bio</label>
                  <textarea
                    name="bio"
                    value={editForm.bio}
                    onChange={handleEditChange}
                    className={styles.editTextarea}
                    placeholder="Tell people about your art..."
                    rows={4}
                  />
                </div>

                <div className={styles.editField}>
                  <label className={styles.editLabel}>Location</label>
                  <input
                    name="location"
                    value={editForm.location}
                    onChange={handleEditChange}
                    className={styles.editInput}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className={styles.editRight}>
                <p className={styles.editLabel}>Profile picture</p>
                <div className={styles.editAvatarWrapper}>
                  {editForm.profil_url ? (
                    <img
                      src={editForm.profil_url}
                      alt="Profile avatar"
                      className={styles.editAvatarImg}
                    />
                  ) : (
                    <div className={styles.editAvatarFallback}>
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <label className={styles.editUploadBtn}>
                  {uploadingAvatar
                    ? "Uploading…"
                    : "Change profile picture"}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleAvatarInputChange}
                    disabled={uploadingAvatar}
                  />
                </label>

                <p className={styles.editHint}>
                  JPG, PNG, max 5MB. Use a clear image of your art or
                  yourself.
                </p>
              </div>
            </div>

            {saveError && <p className={styles.editError}>{saveError}</p>}
            {saveSuccess && (
              <p className={styles.editSuccess}>Profile updated successfully.</p>
            )}

            <div className={styles.editActions}>
              <button
                type="button"
                className={styles.editSecondaryBtn}
                onClick={() => {
                  if (!user) return;
                  setEditForm({
                    name: user.name ?? "",
                    username: user.username ?? "",
                    bio: user.bio ?? "",
                    location: user.location ?? "",
                    profil_url: user.profil_url ?? "",
                  });
                  setSaveError(null);
                  setSaveSuccess(false);
                }}
              >
                Reset
              </button>
              <button
                type="submit"
                className={styles.editPrimaryBtn}
                disabled={savingProfile}
              >
                {savingProfile ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        )}

        {/* FOLLOWERS */}
        {activeTab === "followers" && (
          <div className={styles.followersSection}>
            <h2 className={styles.sectionTitle}>Followers</h2>
            {loadingFollowers && <p>Loading followers…</p>}
            {followersError && <p>Failed to load followers.</p>}
            {!loadingFollowers && followers.length === 0 && <p>No followers yet.</p>}
            <div className={styles.followersGrid}>
              {followers.map((f) => (
                <div key={f._id} className={styles.followerCard}>
                  <img
                    src={f.profil_url || ""}
                    alt={f.name ?? f.username}
                    className={styles.followerAvatar}
                  />
                  <div>
                    <div className={styles.followerName}>
                      {f.name ?? f.username}
                    </div>
                    <div className={styles.followerUsername}>@{f.username}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOLLOWING */}
        {activeTab === "following" && (
          <div className={styles.followersSection}>
            <h2 className={styles.sectionTitle}>Following</h2>
            {loadingFollowing && <p>Loading following…</p>}
            {followingError && <p>Failed to load following.</p>}
            {!loadingFollowing && following.length === 0 && (
              <p>Not following anyone yet.</p>
            )}
            <div className={styles.followersGrid}>
              {following.map((f) => (
                <div key={f._id} className={styles.followerCard}>
                  <img
                    src={f.profil_url || ""}
                    alt={f.name ?? f.username}
                    className={styles.followerAvatar}
                  />
                  <div>
                    <div className={styles.followerName}>
                      {f.name ?? f.username}
                    </div>
                    <div className={styles.followerUsername}>@{f.username}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {avatarFileToCrop && (
        <AvatarCropper
          imageFile={avatarFileToCrop}
          onUpload={handleCroppedAvatarUpload}
          onCancel={() => setAvatarFileToCrop(null)}
        />
      )}
    </div>
  );
}
