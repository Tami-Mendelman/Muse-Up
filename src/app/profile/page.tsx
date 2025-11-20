"use client";

import {
  useEffect,
  useState,
  ChangeEvent,
  FormEvent,
} from "react";
import styles from "./profile.module.css";
import { useRouter } from "next/navigation";

type User = {
  _id: string;
  firebase_uid: string;
  username: string;
  name?: string;
  profil_url?: string;
  bio?: string;
  location?: string;
  followers_count?: number;
  following_count?: number;
};

type SimpleUser = {
  _id: string;
  username: string;
  name?: string;
  profil_url?: string;
};

type PostCard = {
  _id: string;
  id?: number;
  title: string;
  image_url: string;
  user_id: string;
  likes_count?: number;
  comments_count?: number;
};

type TabKey =
  | "posts"
  | "collections"
  | "challenge"
  | "edit"
  | "followers"
  | "following";

type EditFormState = {
  name: string;
  username: string;
  bio: string;
  location: string;
  profil_url: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("posts");
  const [followers, setFollowers] = useState<SimpleUser[]>([]);
  const [following, setFollowing] = useState<SimpleUser[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    name: "",
    username: "",
    bio: "",
    location: "",
    profil_url: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const uid =
      localStorage.getItem("firebase_uid") ||
      localStorage.getItem("firebaseUid") ||
      localStorage.getItem("userId");

    if (!uid) {
      setLoadingUser(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/Users/${uid}`);
        if (!res.ok) throw new Error("User not found");
        const data = await res.json();

        setUser(data);

        setEditForm({
          name: data.name ?? "",
          username: data.username ?? "",
          bio: data.bio ?? "",
          location: data.location ?? "",
          profil_url: data.profil_url ?? "",
        });
      } catch (err) {
        console.error("Failed to load user", err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (activeTab !== "posts") return;
    if (!user?._id) return;

    const loadPosts = async () => {
      setLoadingPosts(true);
      try {
        const res = await fetch(`/api/posts?userId=${user._id}`);
        if (!res.ok) throw new Error("Posts error");

        const data = await res.json();
        const list: PostCard[] = Array.isArray(data)
          ? data
          : Array.isArray(data.posts)
          ? data.posts
          : [];

        setPosts(list);
      } catch (err) {
        console.error("Failed to load posts", err);
      } finally {
        setLoadingPosts(false);
      }
    };

    loadPosts();
  }, [activeTab, user?._id]);

  useEffect(() => {
    if (activeTab !== "followers") return;
    if (!user?.firebase_uid) return;

    const loadFollowers = async () => {
      setLoadingFollowers(true);
      try {
        const res = await fetch(
          `/api/followers-users?userId=${encodeURIComponent(
            user.firebase_uid
          )}`
        );

        if (!res.ok) throw new Error("Followers error");
        const data = await res.json();

        const list: SimpleUser[] = Array.isArray(data)
          ? data
          : Array.isArray(data.users)
          ? data.users
          : [];

        setFollowers(list);
      } catch (err) {
        console.error("Failed to load followers", err);
      } finally {
        setLoadingFollowers(false);
      }
    };

    loadFollowers();
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab !== "following") return;
    if (!user?.firebase_uid) return;

    const loadFollowing = async () => {
      setLoadingFollowing(true);
      try {
        const res = await fetch(
          `/api/following-users?userId=${encodeURIComponent(
            user.firebase_uid
          )}`
        );

        if (!res.ok) throw new Error("Following error");
        const data = await res.json();

        const list: SimpleUser[] = Array.isArray(data)
          ? data
          : Array.isArray(data.users)
          ? data.users
          : [];

        setFollowing(list);
      } catch (err) {
        console.error("Failed to load following", err);
      } finally {
        setLoadingFollowing(false);
      }
    };

    loadFollowing();
  }, [activeTab, user]);

  async function uploadAvatar(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/uploads", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      throw new Error(`Upload failed (${res.status})`);
    }

    const data = await res.json();
    if (!data?.url) {
      throw new Error("Upload response missing url");
    }

    return data.url as string;
  }

  function handleEditChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAvatarInputChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      setSaveError(null);
      setSaveSuccess(false);

      const url = await uploadAvatar(file);
      setEditForm((prev) => ({ ...prev, profil_url: url }));

      setUser((prev) =>
        prev ? { ...prev, profil_url: url } : prev
      );
    } catch (err) {
      console.error("Failed to upload avatar", err);
      setSaveError("Upload failed. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!user?.firebase_uid) return;

    setSavingProfile(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/Users/${user.firebase_uid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          username: editForm.username.trim(),
          bio: editForm.bio.trim(),
          location: editForm.location.trim(),
          profil_url: editForm.profil_url,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to update profile:", text);
        throw new Error("Failed to update profile");
      }

      const updated = await res.json();

      setUser((prev) =>
        prev
          ? {
              ...prev,
              name: updated.name,
              username: updated.username,
              bio: updated.bio,
              location: updated.location,
              profil_url: updated.profil_url,
            }
          : prev
      );

      setSaveSuccess(true);
    } catch (err) {
      console.error(err);
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  if (loadingUser) {
    return <div className={styles.page}>Loading profile…</div>;
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <p>Profile not found.</p>
      </div>
    );
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
              onClick={() => router.push("/followers")}
            >
              {(user.followers_count ?? 0).toLocaleString()} followers
            </button>

            <span className={styles.divider}>|</span>

            <button
              type="button"
              className={styles.metaItemButton}
              onClick={() => router.push("/following")}
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
            {loadingPosts && <p>Loading posts…</p>}

            {!loadingPosts && posts.length === 0 && (
              <p className={styles.placeholder}>No posts yet.</p>
            )}

            {!loadingPosts && posts.length > 0 && (
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

            {!loadingFollowers && followers.length === 0 && (
              <p>No followers yet.</p>
            )}

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

            {!loadingFollowing && following.length === 0 && (
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
    </div>
  );
}
