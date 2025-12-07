"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./landingPage.module.css";
type Story = {
  id: string;
  label: string;
  avatar?: string;
  isYou?: boolean;
  userUid?: string;
};
const LOCAL_STORAGE_KEY = "firebase_uid";
export default function StoriesRow({ stories }: { stories: Story[] }) {
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  useEffect(() => {
    try {
      const uid = localStorage.getItem(LOCAL_STORAGE_KEY);
      setCurrentUid(uid);
    } catch {
      setCurrentUid(null);
    }
  }, []);
  const filtered = stories.filter((story) =>
    story.isYou ? true : story.userUid !== currentUid
  );
  return (
    <div className={styles.storiesRow}>
      {filtered.map((story) => {
        const inner = (
          <>
            <div
              className={
                story.isYou
                  ? `${styles.storyCircle} ${styles.storyCircleYou}`
                  : styles.storyCircle
              }
            >
              {story.isYou ? (
                <span className={styles.plusSign}>+</span>
              ) : (
                <div className={styles.storyAvatarWrapper}>
                  <Image
                    src={story.avatar || "/images/default-avatar.png"}
                    alt={story.label}
                    fill
                    className={styles.storyAvatar}
                  />
                </div>
              )}
            </div>
            <span className={styles.storyLabel}>{story.label}</span>
          </>
        );
        if (story.isYou) {
          return (
            <Link href="/create" key={story.id} className={styles.storyItem}>
              {inner}
            </Link>
          );
        }
        return (
       <Link
    href={`/users/${story.userUid}`}
    key={story.id}
    className={styles.storyItem}
  >
    {inner}
  </Link>
        );
      })}
    </div>
  );
}
