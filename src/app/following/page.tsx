"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./following.module.css";

type FollowingUser = {
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

export default function FollowingPage() {
  const [users, setUsers] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // פעם אחת – נשלוף מי מחובר עכשיו מתוך localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("userId");
    if (!stored) {
      setCurrentUserId(null);
      setLoading(false); // אין משתמש מחובר
      return;
    }

    const num = Number(stored);
    if (Number.isNaN(num)) {
      setCurrentUserId(null);
      setLoading(false);
      return;
    }

    setCurrentUserId(num);
  }, []);

  //  כשיש currentUserId – נביא את מי שהוא עוקב אחריהם
  useEffect(() => {
    if (currentUserId == null) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/following-users?userId=${currentUserId}`
        );
        if (!res.ok) {
          throw new Error("Failed to load following users");
        }
        const data: FollowingUser[] = await res.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUserId]);

  const handleUnfollow = async (followedUserId: number) => {
    // עדכון מיידי במסך
    setUsers((prev) => prev.filter((u) => u.id !== followedUserId));

    try {
      const res = await fetch("/api/following-users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          followedUserId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to unfollow");
      }
    } catch (err) {
      alert("קרתה בעיה בביטול העוקב. נסי שוב.");
    }
  };

  if (loading) {
    return <div className={styles.stateText}>Loading...</div>;
  }

  if (currentUserId == null) {
    return (
      <div className={styles.stateText}>
        לא נמצא משתמש מחובר (userId לא קיים ב-localStorage).
      </div>
    );
  }

  if (error) {
    return <div className={styles.stateText}>Error: {error}</div>;
  }

  if (users.length === 0) {
    return (
      <div className={styles.stateText}>
        את עדיין לא עוקבת אחרי אף משתמש.
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Artists you follow</h1>

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
              onClick={() => handleUnfollow(user.id)}
            >
              Unfollow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
