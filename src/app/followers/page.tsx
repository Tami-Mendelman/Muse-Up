"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "../following/following.module.css";

type UserCard = {
  _id: string;
  id: number;
  username: string;
  name: string;
  email: string;
  profil_url: string;
  bio: string;
  location: string;
  role: string;
};

export default function FollowersPage() {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [users, setUsers] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);

  // לוקחים את userId מה-localStorage
  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setCurrentUserId(Number(stored));
    setLoading(false);
  }, []);

  // מביאים את מי שעוקב אחרי
  useEffect(() => {
    if (currentUserId == null) return;

    const fetchData = async () => {
      const res = await fetch(
        `/api/followers-users?userId=${currentUserId}`
      );
      const data = await res.json();
      setUsers(data);
    };

    fetchData();
  }, [currentUserId]);

  const toggleFollow = async (targetId: number) => {
    const exists = users.some((u) => u.id === targetId);

    if (exists) {
      // Unfollow
      await fetch("/api/followers-users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          followerId: targetId,
        }),
      });
    } else {
      // Follow
      await fetch("/api/followers-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          followerId: targetId,
        }),
      });
    }

    // רענון
    const res = await fetch(`/api/followers-users?userId=${currentUserId}`);
    const data = await res.json();
    setUsers(data);
  };

  if (loading) return <div>Loading...</div>;
  if (currentUserId == null)
    return <div>לא נמצא משתמש מחובר</div>;
  if (users.length === 0)
    return <div className={styles.stateText}>אין עוקבים</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Followers</h1>

      <div className={styles.grid}>
        {users.map((user) => (
          <div className={styles.card} key={user._id}>
            <div className={styles.thumb}>
              <Image
                src={user.profil_url}
                alt={user.name}
                fill
                sizes="300px"
              />
            </div>

            <div className={styles.content}>
              <h3 className={styles.title}>{user.name}</h3>
              <p className={styles.desc}>{user.bio}</p>
              <p className={styles.location}>{user.location}</p>
            </div>

            <button
              className={styles.unfollowBtn}
              onClick={() => toggleFollow(user.id)}
            >
              {/** אם אני כבר עוקבת עליו → Unfollow, אחרת Follow */}
              Follow / Unfollow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
