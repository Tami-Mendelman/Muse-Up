"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "./page";
import styles from "./users.module.css";

type Props = {
  initialUsers: User[];
};

type FollowDoc = {
  following_user_id: string;
  followed_user_id: string;
};

type Stats = {
  followers: number;
  following: number;
};

type StatsMap = Record<string, Stats>;

export default function UsersClient({ initialUsers }: Props) {
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [togglingUid, setTogglingUid] = useState<string | null>(null);


  const [stats, setStats] = useState<StatsMap>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const fromStorage =
      window.localStorage.getItem("firebase_uid") ??
      window.localStorage.getItem("firebaseUid") 

    if (fromStorage) {
      setCurrentUid(fromStorage);
    } else {
      setCurrentUid(null);
    }
  }, []);

  useEffect(() => {
    if (!currentUid) return;

    let cancelled = false;

    async function loadFollowing() {
      try {
        const res = await fetch(
          `/api/follows?userId=${encodeURIComponent(
            currentUid
          )}&type=following`
        );

        if (!res.ok) {
          const errText = await res.text();
          console.error("Failed to load following list", errText);
          return;
        }

        const data: FollowDoc[] = await res.json();

        if (!cancelled) {
          const ids = new Set<string>(
            data.map((f) => f.followed_user_id).filter(Boolean)
          );
          setFollowingIds(ids);
        }
      } catch (err) {
        console.error("Failed to load following list", err);
      }
    }

    loadFollowing();

    return () => {
      cancelled = true;
    };
  }, [currentUid]);

  const usersToShow = useMemo(() => {
    if (!currentUid) return initialUsers;
    return initialUsers.filter(
      (u) => u.firebase_uid && u.firebase_uid !== currentUid
    );
  }, [initialUsers, currentUid]);


  useEffect(() => {
    if (!usersToShow.length) return;

    let cancelled = false;

    async function loadStats() {
      const entries: [string, Stats][] = [];

      for (const u of usersToShow) {
        const uid = u.firebase_uid;
        if (!uid) continue;

        try {
          const [followersRes, followingRes] = await Promise.all([
            fetch(
              `/api/follows?userId=${encodeURIComponent(
                uid
              )}&type=followers`
            ),
            fetch(
              `/api/follows?userId=${encodeURIComponent(
                uid
              )}&type=following`
            ),
          ]);

          if (!followersRes.ok || !followingRes.ok) {
            continue;
          }

          const followers: FollowDoc[] = await followersRes.json();
          const following: FollowDoc[] = await followingRes.json();

          entries.push([
            uid,
            {
              followers: followers.length,
              following: following.length,
            },
          ]);
        } catch (err) {
          console.error("Failed to load stats for user", u.username, err);
        }
      }

      if (!cancelled && entries.length) {
        setStats((prev) => ({
          ...prev,
          ...Object.fromEntries(entries),
        }));
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [usersToShow]);

  const handleToggleFollow = async (targetUid: string) => {
    if (!currentUid || currentUid === targetUid) return;

    const isAlreadyFollowing = followingIds.has(targetUid);

    try {
      setTogglingUid(targetUid);

      const method = isAlreadyFollowing ? "DELETE" : "POST";

      const res = await fetch("/api/follows", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          following_user_id: currentUid,
          followed_user_id: targetUid,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Failed to toggle follow", errText);
        return;
      }

      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (isAlreadyFollowing) {
          next.delete(targetUid);
        } else {
          next.add(targetUid);
        }
        return next;
      });

      setStats((prev) => {
        const next: StatsMap = { ...prev };

       
        const targetStats: Stats = {
          followers: next[targetUid]?.followers ?? 0,
          following: next[targetUid]?.following ?? 0,
        };

       
        const currentStats: Stats = {
          followers: next[currentUid]?.followers ?? 0,
          following: next[currentUid]?.following ?? 0,
        };

        if (isAlreadyFollowing) {
         
          targetStats.followers = Math.max(0, targetStats.followers - 1);
          currentStats.following = Math.max(0, currentStats.following - 1);
        } else {
       
          targetStats.followers += 1;
          currentStats.following += 1;
        }

        next[targetUid] = targetStats;
        next[currentUid] = currentStats;

        return next;
      });
    } catch (err) {
      console.error("Failed to toggle follow", err);
    } finally {
      setTogglingUid(null);
    }
  };

  if (!usersToShow.length) {
    return <p className={styles.emptyState}>No users found.</p>;
  }

  return (
    <ul className={styles.grid} aria-label="Artists list">
      {usersToShow.map((u) => {
        const avatarSrc = (u as any).profil_url || (u as any).avatar_url || "";
        const targetUid = u.firebase_uid;
        const isFollowing = targetUid ? followingIds.has(targetUid) : false;

        const userStats = targetUid ? stats[targetUid] : undefined;
        const followersCount = userStats?.followers ?? u.followers_count ?? 0;
        const followingCount = userStats?.following ?? u.following_count ?? 0;

        return (
          <li key={u._id} className={styles.card}>
            <div className={styles.avatarWrapper}>
              {avatarSrc ? (
              
                <img
                  src={avatarSrc}
                  alt={u.username}
                  className={styles.avatarImage}
                />
              ) : (
                <div className={styles.avatarInitial}>
                  {u.username?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </div>

            <div className={styles.cardBody}>
              <div className={styles.header}>
                <h2 className={styles.username}>{u.username}</h2>
                {u.name ? (
                  <p className={styles.fullName}>
                    {u.name} · <span className={styles.role}>{u.role}</span>
                  </p>
                ) : (
                  <p className={styles.roleOnly}>{u.role}</p>
                )}
              </div>

              {u.bio && <p className={styles.bio}>{u.bio}</p>}

              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Followers</span>
                  <span className={styles.statValue}>{followersCount}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Following</span>
                  <span className={styles.statValue}>{followingCount}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Likes</span>
                  <span className={styles.statValue}>
                    {u.likes_received ?? 0}
                  </span>
                </div>
              </div>

              {currentUid && targetUid && (
                <button
                  type="button"
                  className={`${styles.followButton} ${
                    isFollowing ? styles.following : ""
                  }`}
                  disabled={togglingUid === targetUid}
                  onClick={() => handleToggleFollow(targetUid)}
                >
                  {togglingUid === targetUid
                    ? "Saving..."
                    : isFollowing
                    ? "Unfollow"
                    : "Follow"}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
