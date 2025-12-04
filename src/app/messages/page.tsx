"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "../../lib/useSocket";
import { useQuery } from "@tanstack/react-query";
import styles from "./messages.module.css";
import {
  fetchConversationsFromSocket,
  deleteConversationViaSocket,
} from "../../services/conversationsService";

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

  const [uid] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("firebase_uid");
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] =
    useState<string | null>(null);

  const {
    data: conversations = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<Conversation[]>({
    queryKey: ["conversations", uid ?? "no-uid"],
    queryFn: async () => {
      if (!socket || !uid) return [];
      const result = await fetchConversationsFromSocket(socket, uid);
      return result as Conversation[];
    },
    enabled: !!socket && !!uid,
  });

  const isLoadingState = isLoading || isFetching;

  const handleSelectConversation = (id: string) => {
    router.push(`/messages/${id}`);
  };

  const openDeleteModal = (id: string) => {
    setConversationToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteConversation = async () => {
    if (!socket || !conversationToDelete || !uid) return;

    const ok = await deleteConversationViaSocket(
      socket,
      conversationToDelete,
      uid
    );

    if (!ok) return;

    await refetch();
    setShowDeleteModal(false);
    setConversationToDelete(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <header className={styles.sidebarHeader}>
            <h1 className={styles.sidebarTitle}>Messages</h1>
          </header>

          <div className={styles.conversationsList}>
            {isLoadingState && (
              <p className={styles.emptyState}>Loading…</p>
            )}

            {!isLoadingState && conversations.length === 0 && (
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
