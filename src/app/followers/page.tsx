"use client";

import Image from "next/image";
import styles from "../following/following.module.css";

import { useQuery } from "@tanstack/react-query";
import { useFirebaseUid } from "../../hooks/useFirebaseUid";
import {
  getFollowersForUser,
  getFollowingForUser,
  toggleFollowUser,
  type SimpleUser,
} from "../../services/followService";

export default function FollowersPage() {
  const { uid, ready: uidReady } = useFirebaseUid();
  const {
    data: followers = [],
    isLoading: loadingFollowers,
    error: followersError,
    refetch: refetchFollowers,
  } = useQuery<SimpleUser[]>({
    queryKey: ["followers", uid],
    queryFn: () => getFollowersForUser(uid as string),
    enabled: uidReady && !!uid,
  });

  const {
    data: following = [],
    isLoading: loadingFollowing,
    error: followingError,
    refetch: refetchFollowing,
  } = useQuery<SimpleUser[]>({
    queryKey: ["following", uid],
    queryFn: () => getFollowingForUser(uid as string),
    enabled: uidReady && !!uid,
  });
  const followingIds = new Set<string>(
    (following ?? []).map((u) => u._id)
  );

  const handleToggleFollow = async (targetId: string) => {
    if (!uid) return;

    const currentlyFollowing = followingIds.has(targetId);

    try {
   await toggleFollowUser(
  uid,
  targetId,
  currentlyFollowing
);

      await Promise.all([refetchFollowers(), refetchFollowing()]);
    } catch (err) {
      console.error("Error toggling follow", err);
    }
  };

  if (!uidReady) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Followers</h1>
        <p>טוען...</p>
      </div>
    );
  }

  if (!uid) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Followers</h1>
        <p>לא נמצא משתמש מחובר.</p>
      </div>
    );
  }

  if (loadingFollowers || loadingFollowing) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Followers</h1>
        <p>טוען...</p>
      </div>
    );
  }

  if (followersError || followingError) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Followers</h1>
        <p>שגיאה בטעינת הנתונים.</p>
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
                    onClick={() => handleToggleFollow(user._id)}
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
