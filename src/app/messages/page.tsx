"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "../../lib/useSocket";
import styles from "./messages.module.css";

type Conversation = {
  _id: string;
  lastMessageText?: string;
  lastMessageAt?: string;
  unread_count?: number;
  unreadByUser?: Record<string, number>;
  otherUser?: {
    firebase_uid: string;
    username?: string;
    name?: string;
    profil_url?: string;
  };
};

export default function MessagesPage() {
  const router = useRouter();
  const socket = useSocket();
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
      (res: {
        ok: boolean;
        conversations?: any[];
        error?: string;
      }) => {
        console.log("getConversations raw:", res);
        if (res?.ok && res.conversations) {
          const mapped: Conversation[] = res.conversations.map((c: any) => {
            let unread = Number(c.unread_count ?? 0);

            if (c.unreadByUser && typeof c.unreadByUser === "object") {
              const asRecord = c.unreadByUser as Record<string, number>;
              if (uid in asRecord) {
                unread = asRecord[uid] ?? unread;
              }
            }

            return {
              _id: c._id,
              lastMessageText: c.lastMessageText,
              lastMessageAt: c.lastMessageAt,
              unread_count: unread,
              otherUser: c.otherUser,
            };
          });
          mapped.sort(
            (a, b) =>
              new Date(b.lastMessageAt || 0).getTime() -
              new Date(a.lastMessageAt || 0).getTime()
          );

          console.log("mapped conversations:", mapped);
          setConversations(mapped);
        } else {
          console.error("getConversations error", res?.error);
        }
        setLoading(false);
      }
    );
  }, [socket]);

  const handleSelectConversation = (id: string) => {
    router.push(`/messages/${id}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <header className={styles.sidebarHeader}>
            <h1 className={styles.sidebarTitle}>Messages</h1>
          </header>

          <div className={styles.conversationsList}>
            {loading && (
              <p className={styles.emptyState}>Loading conversations…</p>
            )}

            {!loading && conversations.length === 0 && (
              <p className={styles.emptyState}>No conversations yet.</p>
            )}

            {conversations.map((c) => (
              <button
                key={c._id}
                type="button"
                className={`${styles.conversationItem} ${
                  c.unread_count && c.unread_count > 0
                    ? styles.conversationItemUnread
                    : ""
                }`}
                onClick={() => handleSelectConversation(c._id)}
              >
                <div className={styles.conversationAvatar}>
                  {c.otherUser?.profil_url && (
                    <img
                      src={c.otherUser.profil_url}
                      alt={c.otherUser.username || ""}
                    />
                  )}
                </div>

                <div className={styles.conversationInfo}>
                  <div className={styles.conversationTopRow}>
                    <span className={styles.conversationName}>
                      {c.otherUser?.name ||
                        c.otherUser?.username ||
                        "Unknown user"}
                    </span>
                    {c.lastMessageAt && (
                      <span className={styles.conversationTime}>
                        {new Date(c.lastMessageAt).toLocaleTimeString(
                          "he-IL",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                    )}
                  </div>
                  <div className={styles.conversationPreview}>
                    {c.lastMessageText || "No messages yet"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>
        <section className={styles.chatPane}>
          <div className={styles.chatEmpty}>
            <h2>Select a conversation</h2>
            <p>Choose an artist from the list to start chatting.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
