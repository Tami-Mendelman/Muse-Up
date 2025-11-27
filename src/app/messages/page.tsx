"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "../../lib/useSocket";
import styles from "./messages.module.css";

type Conversation = {
  _id: string;
  lastMessageText?: string;
  lastMessageAt?: string;
  otherUser?: {
    firebase_uid: string;
    username?: string;
    name?: string;
    profil_url?: string;
  };
};

export default function MessagesPage() {
  const socket = useSocket();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket) return;

    const uid = localStorage.getItem("firebase_uid");
    if (!uid) {
      console.warn("No firebase_uid in localStorage");
      setLoading(false);
      return;
    }

    socket.emit(
      "getConversations",
      { userUid: uid },
      (res: { ok: boolean; conversations?: Conversation[]; error?: string }) => {
        if (res?.ok && res.conversations) {
          setConversations(res.conversations);
        } else {
          console.error("getConversations error", res?.error);
        }
        setLoading(false);
      }
    );
  }, [socket]);

  const handleOpenConversation = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Messages</h1>

      {loading && <p className={styles.subtitle}>Loading conversations...</p>}

      {!loading && conversations.length === 0 && (
        <p className={styles.subtitle}>No conversations yet.</p>
      )}

      <ul className={styles.list}>
        {conversations.map((c) => (
          <li
            key={c._id}
            className={styles.item}
            onClick={() => handleOpenConversation(c._id)}
          >
            <div className={styles.avatar}>
              {c.otherUser?.profil_url ? (
                <img
                  src={c.otherUser.profil_url}
                  alt={c.otherUser.username || ""}
                  className={styles.avatarImg}
                />
              ) : null}
            </div>

            <div className={styles.itemText}>
              <div className={styles.itemName}>
                {c.otherUser?.name || c.otherUser?.username || "Unknown user"}
              </div>
              <div className={styles.itemLastMessage}>
                {c.lastMessageText || "No messages yet"}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
