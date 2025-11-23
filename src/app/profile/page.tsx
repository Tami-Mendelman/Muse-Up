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

type TabKey =
  | "posts"
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
  const [avatarFileToCrop, setAvatarFileToCrop] = useState<File | null>(
    null
  );

  const { uid, ready: uidReady } = useFirebaseUid();

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

  const {
    data: posts = [],
    isLoading: loadingPosts,
    error: postsError,
  } = useQuery<PostCard[]>({
    queryKey: ["posts", user?._id],
    queryFn: () => getUserPosts(user!._id),
    enabled: !!user && activeTab === "posts",
  });

  const {
    data: followers = [],
    isLoading: loadingFollowers,
    error: followersError,
  } = useQuery<SimpleUser[]>({
    queryKey: ["followers", user?.firebase_uid],
    queryFn: () => getFollowersForUser(user!.firebase_uid),
    enabled: !!user && activeTab === "followers",
  });

  const {
    data: following = [],
    isLoading: loadingFollowing,
    error: followingError,
  } = useQuery<SimpleUser[]>({
    queryKey: ["following", user?.firebase_uid],
    queryFn: () => getFollowingForUser(user!.firebase_uid),
    enabled: !!user && activeTab === "following",
  });

  if (!uidReady) {
    return <div className={styles.page}>Loading profile…</div>;
  }

  if (!uid) {
    return (
      <div className={styles.page}>
        <p>No logged-in user. Please sign in.</p>
      </div>
    );
  }

  if (loadingUser) {
    return <div className={styles.page}>Loading profile…</div>;
  }

  if (userError || !user) {
    return (
      <div className={styles.page}>
        <p>Failed to load profile.</p>
      </div>
    );
  }
  function handleEditChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setEditForm((prev: EditFormState) => ({ ...prev, [name]: value }));
  }

  async function handleAvatarInputChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
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

      setEditForm((prev: EditFormState) => ({
        ...prev,
        profil_url: url,
      }));
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
  return (
    <div className={styles.page}>
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

      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "posts" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("posts")}
        >
          My Posts
        </button>

        <button
          className={`${styles.tab} ${
            activeTab === "collections" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("collections")}
        >
          Collections
        </button>

        <button
          className={`${styles.tab} ${
            activeTab === "challenge" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("challenge")}
        >
          Challenge
        </button>

        <button
          className={`${styles.tab} ${
            activeTab === "edit" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("edit")}
        >
          Edit
        </button>
      </nav>

      <section className={styles.content}>
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

            {!loadingPosts && !postsError && posts.length === 0 && (
              <p className={styles.placeholder}>No posts yet.</p>
            )}

            {!loadingPosts && !postsError && posts.length > 0 && (
              <div className={styles.postsGrid}>
                {posts.map((post) => (
                  <div key={post._id} className={styles.postCard}>
                    <div className={styles.postImageWrapper}>
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className={styles.postImage}
                      />
                    </div>
                    <div className={styles.postInfo}>
                      <h3 className={styles.postTitle}>{post.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "edit" && (
          <form
            className={styles.editForm}
            onSubmit={handleSaveProfile}
          >
            <div className={styles.editGrid}>
              <div className={styles.editLeft}>
                <div className={styles.editField}>
                  <label className={styles.editLabel} htmlFor="name">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    className={styles.editInput}
                    value={editForm.name}
                    onChange={handleEditChange}
                    placeholder="Your full name"
                  />
                </div>

                <div className={styles.editField}>
                  <label
                    className={styles.editLabel}
                    htmlFor="username"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    className={styles.editInput}
                    value={editForm.username}
                    onChange={handleEditChange}
                    placeholder="Unique username"
                  />
                </div>

                <div className={styles.editField}>
                  <label className={styles.editLabel} htmlFor="bio">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    className={styles.editTextarea}
                    value={editForm.bio}
                    onChange={handleEditChange}
                    placeholder="Tell people about your art, story, style…"
                    rows={4}
                  />
                </div>

                <div className={styles.editField}>
                  <label
                    className={styles.editLabel}
                    htmlFor="location"
                  >
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    className={styles.editInput}
                    value={editForm.location}
                    onChange={handleEditChange}
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

            {saveError && (
              <p className={styles.editError}>{saveError}</p>
            )}
            {saveSuccess && (
              <p className={styles.editSuccess}>
                Profile updated successfully.
              </p>
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

        {activeTab === "collections" && (
          <div className={styles.placeholder}>
            כאן נציג Collections לפי המוקטאפים שלך
          </div>
        )}

        {activeTab === "challenge" && (
          <div className={styles.placeholder}>
            כאן נציג אתגר / סטטוס Challenge
          </div>
        )}

        {activeTab === "followers" && (
          <div className={styles.followersSection}>
            <h2 className={styles.sectionTitle}>Followers</h2>

            {loadingFollowers && <p>Loading followers…</p>}
            {followersError && <p>Failed to load followers.</p>}

            {!loadingFollowers &&
              !followersError &&
              followers.length === 0 && <p>No followers yet.</p>}

            <div className={styles.followersGrid}>
              {followers.map((f) => (
                <div key={f._id} className={styles.followerCard}>
                  <div className={styles.followerAvatarWrapper}>
                    {f.profil_url ? (
                      <img
                        src={f.profil_url}
                        alt={f.name ?? f.username}
                        className={styles.followerAvatar}
                      />
                    ) : (
                      <div className={styles.followerAvatarFallback}>
                        {f.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className={styles.followerInfo}>
                    <div className={styles.followerName}>
                      {f.name ?? f.username}
                    </div>
                    {f.username && (
                      <div className={styles.followerUsername}>
                        @{f.username}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "following" && (
          <div className={styles.followersSection}>
            <h2 className={styles.sectionTitle}>Following</h2>

            {loadingFollowing && <p>Loading following…</p>}
            {followingError && <p>Failed to load following.</p>}

            {!loadingFollowing &&
              !followingError &&
              following.length === 0 && (
                <p>Not following anyone yet.</p>
              )}

            <div className={styles.followersGrid}>
              {following.map((u) => (
                <div key={u._id} className={styles.followerCard}>
                  <div className={styles.followerAvatarWrapper}>
                    {u.profil_url ? (
                      <img
                        src={u.profil_url}
                        alt={u.name ?? u.username}
                        className={styles.followerAvatar}
                      />
                    ) : (
                      <div className={styles.followerAvatarFallback}>
                        {u.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className={styles.followerInfo}>
                    <div className={styles.followerName}>
                      {u.name ?? u.username}
                    </div>
                    {u.username && (
                      <div className={styles.followerUsername}>
                        @{u.username}
                      </div>
                    )}
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
