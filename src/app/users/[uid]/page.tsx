"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import styles from "../../profile/profile.module.css";
import PostModal from "../../components/PostModal/PostModal";
import {
  getUserByUid,
  type User,
} from "../../../services/userService";
import {
  getUserPosts,
  type PostCard,
} from "../../../services/postService";
import {
  getFollowersForUser,
  getFollowingForUser,
  type SimpleUser,
} from "../../../services/followService";
type TabKey = "posts" | "followers" | "following";
export default function PublicProfilePage() {
  const params = useParams();
  const uid = params?.uid as string | undefined;
  const [activeTab, setActiveTab] = useState<TabKey>("posts");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const {
    data: user,
    isLoading: loadingUser,
    error: userError,
  } = useQuery<User>({
    queryKey: ["publicUser", uid],
    queryFn: () => getUserByUid(uid as string),
    enabled: !!uid,
  });
  const {
    data: posts = [],
    isLoading: loadingPosts,
  } = useQuery<PostCard[]>({
    queryKey: ["publicPosts", user?._id],
    queryFn: () => getUserPosts(user!._id),
    enabled: !!user && activeTab === "posts",
  });
  const {
    data: followers = [],
    isLoading: loadingFollowers,
  } = useQuery<SimpleUser[]>({
    queryKey: ["publicFollowers", user?.firebase_uid],
    queryFn: () => getFollowersForUser(user!.firebase_uid),
    enabled: !!user && activeTab === "followers",
  });
  const {
    data: following = [],
    isLoading: loadingFollowing,
  } = useQuery<SimpleUser[]>({
    queryKey: ["publicFollowing", user?.firebase_uid],
    queryFn: () => getFollowingForUser(user!.firebase_uid),
    enabled: !!user && activeTab === "following",
  });
  if (!uid) {
    return (
      <div className={styles.page}>
        <p>User id is missing.</p>
      </div>
    );
  }
  if (loadingUser) {
    return (
      <div className={styles.page}>
        <p>Loading profile…</p>
      </div>
    );
  }
  if (!user || userError) {
    return (
      <div className={styles.page}>
        <p>User not found.</p>
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
        {([
          ["posts", "Posts"],
          ["followers", "Followers"],
          ["following", "Following"],
        ] as [TabKey, string][]).map(([key, label]) => (
          <button
            key={key}
            className={`${styles.tab} ${
              activeTab === key ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
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
                {posts.map((p) => (
                  <div
                    key={p._id}
                    className={styles.postCard}
                    onClick={() => {
                      if (p.id != null) {
                        setSelectedPostId(String(p.id));
                      }
                    }}
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
        {activeTab === "followers" && (
          <div className={styles.followersSection}>
            <h2 className={styles.sectionTitle}>Followers</h2>
            {loadingFollowers && <p>Loading…</p>}
            {!loadingFollowers && followers.length === 0 && (
              <p>No followers yet.</p>
            )}

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
                    <div className={styles.followerUsername}>
                      @{f.username}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "following" && (
          <div className={styles.followersSection}>
            <h2 className={styles.sectionTitle}>Following</h2>

            {loadingFollowing && <p>Loading…</p>}

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
      {selectedPostId && (
        <PostModal
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
        />
      )}
    </div>
  );
}
