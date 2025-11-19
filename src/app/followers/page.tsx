"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "../following/following.module.css";

type UserSummary = {
  _id: string;
  name: string;
  username: string;
  profil_url?: string;
  bio?: string;
};

export default function FollowersPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followers, setFollowers] = useState<UserSummary[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

useEffect(() => {
  if (typeof window === "undefined") return;

  const firebaseUid = window.localStorage.getItem("firebase_uid");
  const legacyId = window.localStorage.getItem("userId");

  const idToUse = firebaseUid ?? legacyId;

  if (idToUse) {
    setCurrentUserId(idToUse);
  } else {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchFollowers = async () => {
      try {
        const res = await fetch(`/api/followers-users?userId=${currentUserId}`);
        if (!res.ok) throw new Error("Failed to fetch followers");
        const data = await res.json();
        setFollowers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching followers", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchFollowing = async () => {
      try {
        const res = await fetch(`/api/followers-users?userId=${currentUserId}`);
        if (!res.ok) throw new Error("Failed to fetch following");
        const data = await res.json();
        const ids = new Set<string>(
          (Array.isArray(data) ? data : []).map((u: any) => u._id)
        );
        setFollowingIds(ids);
      } catch (err) {
        console.error("Error fetching following", err);
      }
    };

    fetchFollowing();
  }, [currentUserId]);

  const toggleFollow = async (targetId: string) => {
    if (!currentUserId) return;

    const isFollowing = followingIds.has(targetId);

    try {
      const method = isFollowing ? "DELETE" : "POST";

      const res = await fetch("/api/followers-users", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUserId,   
          followerId: targetId,   
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        console.error("Failed to toggle follow", res.status, body);
        return;
      }

      const followRes = await fetch(
        `/api/following-users?userId=${currentUserId}`
      );
      if (followRes.ok) {
        const followData = await followRes.json();
        setFollowingIds(
          new Set<string>(
            (Array.isArray(followData) ? followData : []).map(
              (u: any) => u._id
            )
          )
        );
      }
    } catch (err) {
      console.error("Error toggling follow", err);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Followers</h1>
        <p>טוען...</p>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Followers</h1>
        <p>לא נמצא משתמש מחובר.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Followers</h1>

      {followers.length === 0 ? (
        <p>כרגע אין מי שעוקב אחרייך.</p>
      ) : (
        <div className={styles.cards}>
          {followers.map((user) => {
            const isFollowing = followingIds.has(user._id);
            const buttonText = isFollowing ? "Unfollow" : "Follow Back";
            const buttonClass = isFollowing
              ? `${styles.button} ${styles.buttonFollowing}`
              : styles.button;

            return (
              <div className={styles.card} key={user._id}>
                <div className={styles.avatarWrapper}>
                 <Image
  src={
    user.profil_url && user.profil_url.trim() !== ""
      ? user.profil_url
      : "https://res.cloudinary.com/dhxxlwa6n/image/upload/v1763545782/45d4e069425e26a062a08f62116db827_ajjxke.jpg"
  }
  alt={user.username || "user avatar"}
  width={72}
  height={72}
/>
                </div>

                <div className={styles.info}>
                  <div className={styles.nameRow}>
                    <span className={styles.name}>{user.name}</span>
                    <span className={styles.username}>@{user.username}</span>
                  </div>
                  {user.bio && <p className={styles.bio}>{user.bio}</p>}
                </div>

                <div className={styles.actions}>
                  <button
                    className={buttonClass}
                    onClick={() => toggleFollow(user._id)}
                  >
                    {buttonText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
