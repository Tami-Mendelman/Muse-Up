"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import styles from "./landingPage.module.css";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFirebaseUid } from "../../hooks/useFirebaseUid";

import {
  getRawFollowingForUser,
  toggleFollowUser,
  type FollowDoc,
} from "../../services/followService";

export type SimpleArtist = {
  firebase_uid?: string;
  username?: string;
  name?: string;
  artType?: string;
  profil_url?: string;
  avatar_url?: string;
};

type Props = {
  artists: SimpleArtist[];
};

export default function ArtistsToFollowClient({ artists }: Props) {
  const queryClient = useQueryClient();
  const { uid: currentUid, ready: uidReady } = useFirebaseUid();
  const [togglingUid, setTogglingUid] = useState<string | null>(null);
  const {
    data: followingDocs = [],
    isLoading: loadingFollowingDocs,
    error: followingError,
  } = useQuery<FollowDoc[]>({
    queryKey: ["raw-following", currentUid],
    queryFn: () => getRawFollowingForUser(currentUid as string),
    enabled: uidReady && !!currentUid,
  });
  const followingIds = useMemo(
    () =>
      new Set(
        followingDocs
          .map((d) => d.followed_user_id)
          .filter((id): id is string => Boolean(id))
      ),
    [followingDocs]
  );
  const artistsToShow = useMemo(() => {
    if (!currentUid) return artists;
    return artists.filter(
      (a) => a.firebase_uid && a.firebase_uid !== currentUid
    );
  }, [artists, currentUid]);

  async function handleToggleFollow(targetUid: string) {
    if (!currentUid || currentUid === targetUid) return;

    const isAlreadyFollowing = followingIds.has(targetUid);
    setTogglingUid(targetUid);

    try {
      await toggleFollowUser(currentUid, targetUid, isAlreadyFollowing);
      queryClient.setQueryData<FollowDoc[]>(
        ["raw-following", currentUid],
        (old = []) => {
          if (isAlreadyFollowing) {
            return old.filter(
              (f) => f.followed_user_id !== targetUid
            );
          }
          return [
            ...old,
            {
              following_user_id: currentUid,
              followed_user_id: targetUid,
            },
          ];
        }
      );
    } catch (err) {
      console.error("Follow toggle failed:", err);
      alert("Something went wrong, please try again.");
    } finally {
      setTogglingUid(null);
    }
  }

  if (!artistsToShow.length) return null;

  return (
    <ul className={styles.artistList}>
      {loadingFollowingDocs && (
        <li>Loading your follow state…</li>
      )}

      {followingError && (
        <li>Failed to load your follow info.</li>
      )}

      {artistsToShow.map((artist) => {
        const targetUid = artist.firebase_uid!;
        const avatarSrc = artist.profil_url || artist.avatar_url || "";
        const isFollowing = followingIds.has(targetUid);
        const isSaving = togglingUid === targetUid;

        return (
          <li key={targetUid} className={styles.artistRow}>
            <div className={styles.avatarWrap}>
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={artist.username ?? artist.name ?? "artist"}
                  width={44}
                  height={44}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarFallback}>
                  {(artist.username ?? artist.name ?? "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className={styles.artistName}>
                {artist.name ?? artist.username}
              </div>
              {artist.username && (
                <div className={styles.artistType}>
                  @{artist.username}
                </div>
              )}
              {artist.artType && (
                <div className={styles.artistType}>
                  {artist.artType}
                </div>
              )}
            </div>
            {currentUid && (
              <button
                className={styles.followBtn}
                disabled={isSaving}
                onClick={() => handleToggleFollow(targetUid)}
              >
                {isSaving
                  ? "Saving..."
                  : isFollowing
                  ? "Unfollow"
                  : "Follow"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
