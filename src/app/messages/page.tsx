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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  useEffect(() => {
    if (!socket) return;
    const uid = localStorage.getItem("firebase_uid");
    if (!uid) {
      setLoading(false);
      return;
    }
    socket.emit(
      "getConversations",
      { userUid: uid },
      (res: { ok: boolean; conversations?: any[]; error?: string }) => {
        if (res?.ok && res.conversations) {
          const mapped: Conversation[] = res.conversations.map((c: any) => ({
            _id: c._id,
            lastMessageText: c.lastMessageText,
            lastMessageAt: c.lastMessageAt,
            unread_count: c.unreadByUser?.[uid] || 0,
            otherUser: c.otherUser,
          }));
          mapped.sort(
            (a, b) =>
              new Date(b.lastMessageAt || 0).getTime() -
              new Date(a.lastMessageAt || 0).getTime()
          );
          setConversations(mapped);
        }
        setLoading(false);
      }
    );
  }, [socket]);
  const handleSelectConversation = (id: string) => {
    router.push(`/messages/${id}`);
  };
  const openDeleteModal = (id: string) => {
    setConversationToDelete(id);
    setShowDeleteModal(true);
  };
  const confirmDeleteConversation = () => {
    if (!socket || !conversationToDelete) return;
    const uid = localStorage.getItem("firebase_uid");
    if (!uid) return;
    socket.emit(
      "deleteConversation",
      { conversationId: conversationToDelete, userUid: uid },
      (res: { ok: boolean; error?: string }) => {
        if (!res.ok) return;
        setConversations((prev) =>
          prev.filter((c) => c._id !== conversationToDelete)
        );
        setShowDeleteModal(false);
        setConversationToDelete(null);
      }
    );
  };
  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <header className={styles.sidebarHeader}>
            <h1 className={styles.sidebarTitle}>Messages</h1>
          </header>
          <div className={styles.conversationsList}>
            {loading && <p className={styles.emptyState}>Loading…</p>}
            {!loading && conversations.length === 0 && (
              <p className={styles.emptyState}>No conversations yet.</p>
            )}
            {conversations.map((c) => (
              <div key={c._id} className={styles.conversationRow}>
                <button
                  className={`${styles.conversationItem} ${
                    c.unread_count ? styles.conversationItemUnread : ""
                  }`}
                  onClick={() => handleSelectConversation(c._id)}
                >
                  <div className={styles.conversationAvatar}>
                    {c.otherUser?.profil_url && (
                      <img src={c.otherUser.profil_url} alt="" />
                    )}
                  </div>
                  <div className={styles.conversationInfo}>
                    <div className={styles.conversationTopRow}>
                      <span className={styles.conversationName}>
                        {c.otherUser?.name || c.otherUser?.username}
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

             <button
  className={styles.deleteBtn}
  onClick={(e) => {
    e.stopPropagation();
    openDeleteModal(c._id);
  }}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={styles.trashIcon}
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
</button>

              </div>
            ))}
          </div>
        </aside>

        <section className={styles.chatPane}>
          <div className={styles.chatEmpty}>
            <h2>Select a conversation</h2>
            <p>Choose an artist to start chatting.</p>
          </div>
        </section>
      </div>
      {showDeleteModal && (
        <div className={styles.deleteModalOverlay}>
          <div className={styles.deleteModal}>
            <h3>Delete conversation?</h3>
            <p>This action cannot be undone.</p>

            <div className={styles.deleteModalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>

              <button
                className={styles.confirmDeleteBtn}
                onClick={confirmDeleteConversation}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
