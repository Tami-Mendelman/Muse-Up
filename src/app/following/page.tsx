"use client";

import Image from "next/image";
import styles from "./following.module.css";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFirebaseUid } from "../../hooks/useFirebaseUid";

import {
  getFollowingForUser,
  toggleFollowUser,
  type SimpleUser,
} from "../../services/followService";
type FollowingUser = SimpleUser & {
  firebase_uid?: string;
};

export default function FollowingPage() {
  const queryClient = useQueryClient();
  const { uid: currentUserId, ready: uidReady } = useFirebaseUid();

  const {
    data: followingUsers = [],
    isLoading,
    error,
  } = useQuery<FollowingUser[]>({
    queryKey: ["following-users", currentUserId],
    queryFn: () => getFollowingForUser(currentUserId as string),
    enabled: uidReady && !!currentUserId,
  });

  const unfollowMutation = useMutation({
    mutationFn: async (targetUser: FollowingUser) => {
      if (!currentUserId) throw new Error("No current user");
      await toggleFollowUser(
        currentUserId,
        targetUser.firebase_uid,
        true 
      );
    },

    onSuccess: (_data, targetUser) => {
      queryClient.setQueryData<FollowingUser[]>(
        ["following-users", currentUserId],
        (old = []) => old.filter((u) => u._id !== targetUser._id)
      );
    },
  });

  if (!uidReady || isLoading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Following</h1>
        <p>טוען...</p>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Following</h1>
        <p>לא נמצא משתמש מחובר.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Following</h1>
        <p>שגיאה בטעינת רשימת הנעקבים.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Following</h1>

      {followingUsers.length === 0 ? (
        <p>את לא עוקבת אחרי אף אחד כרגע.</p>
      ) : (
        <div className={styles.cards}>
          {followingUsers.map((user) => (
            <div className={styles.card} key={user._id}>
              <div className={styles.avatarWrapper}>
                <Image
                  src={
                    user.profil_url?.trim()
                      ? user.profil_url
                      : "https://res.cloudinary.com/dhxxlwa6n.../upload/v1763545782/45d4e069425e26a062a08f62116db827_ajjxke.jpg"
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
                  className={`${styles.button} ${styles.buttonFollowing}`}
                  disabled={unfollowMutation.isPending}
                  onClick={() => unfollowMutation.mutate(user)}
                >
                  {unfollowMutation.isPending ? "Saving..." : "Unfollow"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
