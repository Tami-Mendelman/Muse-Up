"use client";

import { useState, ChangeEvent, FormEvent } from "react";


import { useEffect, useState } from "react";

import styles from "./profile.module.css";
import PostModal from "../components/PostModal/PostModal";
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

import AvatarCropper from "../components/CropImage/CropImage"; 

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
  _id?: string;
  id: number;
  title: string;
  image_url: string;
  likes_count?: number;
};


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
/* -------------------------------------------------------
   PAGE
------------------------------------------------------- */

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("posts");

  const [followers, setFollowers] = useState<SimpleUser[]>([]);
  const [following, setFollowing] = useState<SimpleUser[]>([]);

  const [posts, setPosts] = useState<PostCard[]>([]);
  const [savedPosts, setSavedPosts] = useState<PostCard[]>([]);

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [loadingSaved, setLoadingSaved] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);


  const [editForm, setEditForm] = useState<EditFormState>({
    name: "",
    username: "",
    bio: "",
    location: "",
    profil_url: "",
  });

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

  /* -------------------------------------------------------
     1. LOAD USER
  ------------------------------------------------------- */

  useEffect(() => {
    const uid =
      localStorage.getItem("firebase_uid") ||
      localStorage.getItem("firebaseUid") ||
      localStorage.getItem("userId");

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
    async function loadUser() {
      try {
        const res = await fetch(`/api/Users/${uid}`);
        if (!res.ok) throw new Error("User not found");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("User error:", err);
      } finally {
        setLoadingUser(false);
      }
    }

    loadUser();
  }, []);

  /* -------------------------------------------------------
     2. LOAD USER POSTS
  ------------------------------------------------------- */

  useEffect(() => {
    if (activeTab !== "posts") return;
    if (!user?._id) return;

    async function loadPosts() {
      setLoadingPosts(true);
      try {
        const res = await fetch(`/api/posts?userId=${user._id}`);
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Posts error:", err);
      } finally {
        setLoadingPosts(false);
      }
    }

    loadPosts();
  }, [activeTab, user?._id]);

  /* -------------------------------------------------------
     3. LOAD SAVED POSTS (localStorage)
  ------------------------------------------------------- */

  useEffect(() => {
    if (activeTab !== "saved") return;


    const savedIds = JSON.parse(localStorage.getItem("savedPosts") || "[]");

    if (savedIds.length === 0) {
      setSavedPosts([]);
      return;
    }
    loadFollowers();
  }, [activeTab, user]);
  useEffect(() => {
    if (activeTab !== "following") return;
    if (!user?.firebase_uid) return;


    async function loadSaved() {
      setLoadingSaved(true);
      try {
        const results: PostCard[] = [];

        await Promise.all(
          savedIds.map(async (id: number) => {
            const res = await fetch(`/api/posts/${id}`);
            if (res.ok) {
              const data = await res.json();
              results.push(data);
            }
          })
        );

        setSavedPosts(results);
      } catch (err) {
        console.error("Saved posts error:", err);
      } finally {
        setLoadingSaved(false);
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

    loadSaved();
  }, [activeTab]);

  /* -------------------------------------------------------
     4. FOLLOWERS / FOLLOWING
  ------------------------------------------------------- */

  async function openFollowers() {
    setActiveTab("followers");

    if (!user?.firebase_uid) return;

    setAvatarFileToCrop(file);
    setSaveError(null);
    setSaveSuccess(false);
  }

  const handleCroppedAvatarUpload = async (croppedFile: File) => {
    try {

      const res = await fetch(
        `/api/followers-users?userId=${user.firebase_uid}`

      setUploadingAvatar(true);
      const url = await uploadAvatar(croppedFile);

      setEditForm((prev: EditFormState) => ({
        ...prev,
        profil_url: url,
      }));
      queryClient.setQueryData<User>(["user", uid], (old) =>
        old ? { ...old, profil_url: url } : old
      );
      const data = await res.json();
      setFollowers(Array.isArray(data) ? data : []);
    } catch (err) {

      console.error("Followers error:", err);

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
      setAvatarFileToCrop(null); 

    }
  };

  async function openFollowing() {
    setActiveTab("following");

    if (!user?.firebase_uid) return;

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
      const res = await fetch(
        `/api/following-users?userId=${user.firebase_uid}`
      );
      const data = await res.json();
      setFollowing(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Following error:", err);
    }
  }

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  if (loadingUser) {
    return <div className={styles.page}>Loading profile…</div>;
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <p>User not found.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* POST MODAL */}
      {selectedPostId !== null && (
        <PostModal
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
        />
      )}

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
              className={styles.metaItemButton}
              onClick={() => setActiveTab("followers")}
              onClick={openFollowers}
            >
              {(user.followers_count ?? 0).toLocaleString()} followers
            </button>

            <span className={styles.divider}>|</span>

            <button
              className={styles.metaItemButton}
              onClick={() => setActiveTab("following")}
              onClick={openFollowing}
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

      {/* TABS */}
      <nav className={styles.tabs}>
        <button
          onClick={() => setActiveTab("posts")}
          className={`${styles.tab} ${
            activeTab === "posts" ? styles.tabActive : ""
          }`}
        >
          My Posts
        </button>

        <button
          onClick={() => setActiveTab("saved")}
          className={`${styles.tab} ${
            activeTab === "saved" ? styles.tabActive : ""
          }`}
        >
          Saved
        </button>

        <button
          onClick={() => setActiveTab("collections")}
          className={`${styles.tab} ${
            activeTab === "collections" ? styles.tabActive : ""
          }`}
        >
          Collections
        </button>

        <button
          onClick={() => setActiveTab("challenge")}
          className={`${styles.tab} ${
            activeTab === "challenge" ? styles.tabActive : ""
          }`}
        >
          Challenge
        </button>

        <button
          onClick={() => setActiveTab("edit")}
          className={`${styles.tab} ${
            activeTab === "edit" ? styles.tabActive : ""
          }`}
        >
          Edit
        </button>
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

            {!loadingPosts && !postsError && posts.length === 0 && (
              <p className={styles.placeholder}>No posts yet.</p>
            )}

            {loadingPosts && <p>Loading…</p>}

                  <button
  className={styles.shareArtBtn}
  onClick={() => router.push("/create")}
>   
  share your art
   <span className={styles.sharePlus}>+</span>
</button>
            {loadingPosts && <p>Loading posts…</p>}
            {!loadingPosts && posts.length === 0 && <p>No posts yet.</p>}

            {!loadingPosts && !postsError && posts.length > 0 && (
              <div className={styles.postsGrid}>
                {posts.map((p) => (
                  <div
                    key={p.id}
                    className={styles.postCard}
                    onClick={() => setSelectedPostId(p.id)}
                  >
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
            {loadingSaved && <p>Loading…</p>}

            {!loadingSaved && savedPosts.length === 0 && (
              <p>No saved posts yet.</p>
            )}

            {!loadingSaved && savedPosts.length > 0 && (
              <div className={styles.postsGrid}>
                {savedPosts.map((p) => (
                  <div
                    key={p.id}
                    className={styles.postCard}
                    onClick={() => setSelectedPostId(p.id)}
                  >
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


        {/* COLLECTIONS */}

        {activeTab === "collections" && (
          <p className={styles.placeholder}>Collections coming soon…</p>
        )}

        {/* CHALLENGE */}
        {activeTab === "challenge" && (
          <p className={styles.placeholder}>Challenge info coming soon…</p>
        )}

        {/* EDIT */}
        {activeTab === "edit" && (
          <p className={styles.placeholder}>Profile editing coming soon…</p>
        )}

        {/* FOLLOWERS */}
        {activeTab === "followers" && (
          <div className={styles.followersSection}>
            <h2 className={styles.sectionTitle}>Followers</h2>

            {loadingFollowers && <p>Loading followers…</p>}
            {followersError && <p>Failed to load followers.</p>}

            {!loadingFollowers &&
              !followersError &&
              followers.length === 0 && <p>No followers yet.</p>}
            {followers.length === 0 && <p>No followers yet.</p>}

            <div className={styles.followersGrid}>
              {followers.map((f) => (
                <div key={f._id} className={styles.followerCard}>
                  <img
                    src={f.profil_url || ""}
                    className={styles.followerAvatar}
                    alt={f.name ?? f.username}
                  />
                  <div>
                    <div className={styles.followerName}>
                      {f.name ?? f.username}
                    </div>
                    <div className={styles.followerUsername}>
                      @{f.username}
                    </div>
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

            {!loadingFollowing &&
              !followingError &&
              following.length === 0 && (
                <p>Not following anyone yet.</p>
              )}
            {following.length === 0 && <p>No following yet.</p>}

            <div className={styles.followersGrid}>
              {following.map((f) => (
                <div key={f._id} className={styles.followerCard}>
                  <img
                    src={f.profil_url || ""}
                    className={styles.followerAvatar}
                    alt={f.name ?? f.username}
                  />
                  <div>
                    <div className={styles.followerName}>
                      {f.name ?? f.username}
                    </div>
                    <div className={styles.followerUsername}>
                      @{f.username}
                    </div>
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
