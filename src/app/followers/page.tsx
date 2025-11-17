"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "../following/following.module.css";

export default function FollowersPage() {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setCurrentUserId(Number(stored));
  }, []);

  // רשימת Followers (מי עוקב אחריי)
  useEffect(() => {
    if (currentUserId == null) return;

    const fetchFollowers = async () => {
      const res = await fetch(`/api/followers-users?userId=${currentUserId}`);
      const data = await res.json();
      setFollowers(data);
    };

    fetchFollowers();
  }, [currentUserId]);

  // רשימת Following (מי אני עוקבת עליו)
  useEffect(() => {
    if (currentUserId == null) return;

    const fetchFollowing = async () => {
      const res = await fetch(`/api/following-users?userId=${currentUserId}`);
      const data = await res.json();

    const ids = new Set<number>(data.map((u: any) => u.id));
      setFollowingIds(ids);
      setLoading(false);
    };

    fetchFollowing();
  }, [currentUserId]);

  const toggleFollow = async (targetId: number) => {
    const isFollowing = followingIds.has(targetId);

    if (isFollowing) {
      await fetch("/api/followers-users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          followerId: targetId,
        }),
      });
    } else {
      await fetch("/api/followers-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          followerId: targetId,
        }),
      });
    }

    // עדכון מחדש
    const followRes = await fetch(`/api/following-users?userId=${currentUserId}`);
    const followData = await followRes.json();
    setFollowingIds(new Set(followData.map((u: any) => u.id)));
  };

  if (loading) return <div>Loading...</div>;
  if (followers.length === 0) return <div className={styles.stateText}>אין עוקבים</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Followers</h1>

      <div className={styles.grid}>
        {followers.map((user) => {
          const isFollowing = followingIds.has(user.id);

          let buttonClass = styles.followBtn;
          let buttonText = "Follow";

          if (isFollowing) {
            buttonClass = styles.unfollowBtn;
            buttonText = "Unfollow";
          } else {
            buttonClass = styles.followBackBtn;
            buttonText = "Follow Back";
          }

          return (
            <div className={styles.card} key={user._id}>
              <div className={styles.thumb}>
                <Image src={user.profil_url} alt={user.name} fill sizes="300px" />
              </div>

              <div className={styles.content}>
                <h3 className={styles.title}>{user.name}</h3>
                <p className={styles.desc}>{user.bio}</p>
                <p className={styles.location}>{user.location}</p>
              </div>

              <button
                className={buttonClass}
                onClick={() => toggleFollow(user.id)}
              >
                {buttonText}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
