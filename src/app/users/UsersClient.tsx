"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "./page";
import styles from "./users.module.css";

import { useFirebaseUid } from "../../hooks/useFirebaseUid";
import {
  getRawFollowingForUser,
  toggleFollowUser,
  type FollowDoc,
} from "../../services/followService";

type Props = {
  initialUsers: User[];
};

export default function UsersClient({ initialUsers }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [togglingUid, setTogglingUid] = useState<string | null>(null);

  const { uid: currentUid, ready: uidReady } = useFirebaseUid();

  const {
    data: followingDocs = [],
    isLoading: loadingFollowingList,
    error: followingListError,
  } = useQuery<FollowDoc[]>({
    queryKey: ["following-raw", currentUid],
    queryFn: () => getRawFollowingForUser(currentUid as string),
    enabled: uidReady && !!currentUid,
  });

  const [followingIdsOverride, setFollowingIdsOverride] =
    useState<Set<string> | null>(null);

  const effectiveFollowingIds = useMemo(() => {
    if (followingIdsOverride) return followingIdsOverride;

    const ids = new Set<string>(
      followingDocs
        .map((f) => f.followed_user_id)
        .filter((id): id is string => !!id)
    );
    return ids;
  }, [followingIdsOverride, followingDocs]);

  const usersToShow = useMemo(() => {
    if (!currentUid) return users;
    return users.filter(
      (u) => u.firebase_uid && u.firebase_uid !== currentUid
    );
  }, [users, currentUid]);

  const handleToggleFollow = async (targetUid: string) => {
    if (!currentUid || currentUid === targetUid) return;

    const isAlreadyFollowing = effectiveFollowingIds.has(targetUid);

    try {
      setTogglingUid(targetUid);

      await toggleFollowUser(currentUid, targetUid, isAlreadyFollowing);

      setFollowingIdsOverride((prev) => {
        const base =
          prev ??
          new Set<string>(
            followingDocs
              .map((f) => f.followed_user_id)
              .filter((id): id is string => !!id)
          );

        const next = new Set(base);
        if (isAlreadyFollowing) {
          next.delete(targetUid);
        } else {
          next.add(targetUid);
        }
        return next;
      });
      setUsers((prev) =>
        prev.map((u) => {
          if (u.firebase_uid === targetUid) {
            const delta = isAlreadyFollowing ? -1 : 1;
            return {
              ...u,
              followers_count: Math.max(
                0,
                (u.followers_count ?? 0) + delta
              ),
            };
          }
          if (u.firebase_uid === currentUid) {
            const delta = isAlreadyFollowing ? -1 : 1;
            return {
              ...u,
              following_count: Math.max(
                0,
                (u.following_count ?? 0) + delta
              ),
            };
          }

          return u;
        })
      );
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
    <>
      {followingListError && (
        <p className={styles.followError}>
          Failed to load following list.
        </p>
      )}

      <ul className={styles.grid} aria-label="Artists list">
        {usersToShow.map((u) => {
          const avatarSrc =
            (u as any).profil_url || (u as any).avatar_url || "";
          const targetUid = u.firebase_uid;
          const isFollowing = targetUid
            ? effectiveFollowingIds.has(targetUid)
            : false;

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
                      {u.name} ·{" "}
                      <span className={styles.role}>{u.role}</span>
                    </p>
                  ) : (
                    <p className={styles.roleOnly}>{u.role}</p>
                  )}
                </div>

                {u.bio && <p className={styles.bio}>{u.bio}</p>}

                <div className={styles.statsRow}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Followers</span>
                    <span className={styles.statValue}>
                      {u.followers_count ?? 0}
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Following</span>
                    <span className={styles.statValue}>
                      {u.following_count ?? 0}
                    </span>
                  </div>
                </div>

                {currentUid && targetUid && (
                  <button
                    type="button"
                    className={`${styles.followButton} ${
                      isFollowing ? styles.following : ""
                    }`}
                    disabled={
                      togglingUid === targetUid || loadingFollowingList
                    }
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
    </>
  );
}
