"use client";
import { useState, useRef, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSocket } from "../../../lib/useSocket";
import styles from "./conversation.module.css";
import { Trash2, Pencil } from "lucide-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
}) as any;
type Message = {
  _id: string;
  conversation_id: string;
  sender_uid: string;
  recipient_uid: string;
  text: string;
  createdAt: string;
};
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
export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const router = useRouter();
  const socket = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef(true);
  const currentUid =
    typeof window !== "undefined"
      ? localStorage.getItem("firebase_uid")
      : null;
  const [editingMessageId, setEditingMessageId] =
    useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] =
    useState<string | null>(null);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    messageId: string | null;
  }>({
    open: false,
    messageId: null,
  });
  const initRef = useRef(false);
  const listenersAttachedRef = useRef(false);
  const lastConversationIdRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(
    (conversationId as string) || null
  );
  conversationIdRef.current = (conversationId as string) || null;
  const scrollToBottom = () => {
    if (!autoScrollRef.current) return;
    setTimeout(() => {
      if (!autoScrollRef.current) return;
      if (!bottomRef.current) return;

      bottomRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 0);
  };

  const handleChatScroll = () => {
    const box = chatBoxRef.current;
    if (!box) return;
    const distanceFromBottom =
      box.scrollHeight - box.scrollTop - box.clientHeight;
    autoScrollRef.current = distanceFromBottom < 80;
  };

  const initConversations = () => {
    if (!socket) return;
    const uid = currentUid;
    if (!uid) {
      console.warn("No firebase_uid in localStorage");
      setLoadingConversations(false);
      return;
    }

    setLoadingConversations(true);

    socket.emit(
      "getConversations",
      { userUid: uid },
      (res: { ok: boolean; conversations?: any[]; error?: string }) => {
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

          setConversations(mapped);
        } else {
          console.error("getConversations error", res?.error);
          setConversations([]);
        }
        setLoadingConversations(false);
      }
    );
  };

  const loadMessagesForConversation = (id: string) => {
    if (!socket) return;
    const uid = currentUid;
    if (!uid) {
      console.warn("No firebase_uid in localStorage");
      return;
    }

    socket.emit("joinConversation", {
      conversationId: id,
      userUid: uid,
    });

    socket.emit(
      "getMessages",
      { conversationId: id },
      (res: { ok: boolean; messages?: Message[]; error?: string }) => {
        if (res?.ok && res.messages) {
          setMessages(res.messages);
          autoScrollRef.current = true;
          scrollToBottom();
        } else {
          console.error("getMessages error", res?.error);
          setMessages([]);
        }
      }
    );

    socket.emit("markConversationRead", {
      conversationId: id,
      userUid: uid,
    });

    setConversations((prev) =>
      prev.map((c) =>
        c._id === id
          ? {
              ...c,
              unread_count: 0,
            }
          : c
      )
    );
  };

  const handleIncoming = (payload: {
    conversationId: string;
    message: Message;
  }) => {
    const activeId = conversationIdRef.current;

    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c._id !== payload.conversationId) return c;
        const base = {
          ...c,
          lastMessageText: payload.message.text,
          lastMessageAt: payload.message.createdAt,
        };
        if (payload.conversationId === activeId) {
          return { ...base, unread_count: 0 };
        }
        return {
          ...base,
          unread_count: (c.unread_count || 0) + 1,
        };
      });

      return updated.sort(
        (a, b) =>
          new Date(b.lastMessageAt || 0).getTime() -
          new Date(a.lastMessageAt || 0).getTime()
      );
    });

    if (payload.conversationId === activeId) {
      setMessages((prev) => {
        const next = [...prev, payload.message];
        autoScrollRef.current = true;
        scrollToBottom();
        return next;
      });
    }
  };

  const handleMessageDeletedSocket = (payload: {
    messageId: string;
    conversationId: string;
  }) => {
    const activeId = conversationIdRef.current;
    if (payload.conversationId !== activeId) return;
    setMessages((prev) => prev.filter((m) => m._id !== payload.messageId));
  };

  const handleMessageEditedSocket = (payload: { message: Message }) => {
    const msg = payload.message;
    const activeId = conversationIdRef.current;
    if (msg.conversation_id !== activeId) return;
    setMessages((prev) =>
      prev.map((m) => (m._id === msg._id ? msg : m))
    );
  };

  const attachSocketListeners = () => {
    if (!socket) return;
    if (listenersAttachedRef.current) return;
    listenersAttachedRef.current = true;

    socket.on("message", handleIncoming);
    socket.on("messageDeleted", handleMessageDeletedSocket);
    socket.on("messageEdited", handleMessageEditedSocket);
  };

  if (socket && currentUid && !initRef.current) {
    initRef.current = true;
    initConversations();
    attachSocketListeners();
  } else {
    attachSocketListeners();
  }

  if (
    socket &&
    currentUid &&
    typeof conversationId === "string" &&
    conversationId &&
    lastConversationIdRef.current !== conversationId
  ) {
    lastConversationIdRef.current = conversationId;
    loadMessagesForConversation(conversationId);
  }

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!socket || !conversationId) return;

    const text = input.trim();
    if (!text) return;

    const uid = currentUid;
    if (!uid) {
      console.warn("No firebase_uid in localStorage");
      return;
    }

    setSending(true);

    if (editingMessageId) {
      socket.emit(
        "editMessage",
        { messageId: editingMessageId, userUid: uid, text },
        (res: { ok: boolean; message?: Message; error?: string }) => {
          setSending(false);
          if (!res?.ok) {
            console.error("editMessage error", res?.error);
            return;
          }
          setInput("");
          setEditingMessageId(null);
        }
      );
    } else {
      socket.emit(
        "sendMessage",
        { conversationId, senderUid: uid, text },
        (res: { ok: boolean; message?: Message; error?: string }) => {
          setSending(false);
          if (!res?.ok) {
            console.error("sendMessage error", res?.error);
            return;
          }
          setInput("");
          autoScrollRef.current = true;
          scrollToBottom();
        }
      );
    }
  };
  const handleEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + (emojiData.emoji || ""));
  };
  const isSendDisabled = sending || !input.trim();
  const activeConversation = conversations.find(
    (c) => c._id === conversationId
  );
  const handleSelectConversation = (id: string) => {
    router.push(`/messages/${id}`);
  };

  const startEditMessage = (message: Message) => {
    setEditingMessageId(message._id);
    setInput(message.text);
    setShowEmojiPicker(false);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setInput("");
  };

  const handleDeleteMessage = (messageId: string) => {
    setConfirmDelete({
      open: true,
      messageId,
    });
  };

  const performDeleteMessage = () => {
    if (!socket || !conversationId || !confirmDelete.messageId) return;

    const uid = currentUid;
    if (!uid) return;

    const messageId = confirmDelete.messageId;

    socket.emit(
      "deleteMessage",
      { messageId, userUid: uid },
      (res: { ok: boolean; error?: string }) => {
        if (!res?.ok) {
          console.error("deleteMessage error:", res?.error);
          setConfirmDelete({ open: false, messageId: null });
          return;
        }
        setMessages((prev) => {
          const updated = prev.filter((m) => m._id !== messageId);
          const last = updated[updated.length - 1];

          setConversations((prevConvs) =>
            prevConvs.map((c) =>
              c._id === conversationId
                ? {
                    ...c,
                    lastMessageText: last ? last.text : "",
                    lastMessageAt: last ? last.createdAt : undefined,
                  }
                : c
            )
          );

          return updated;
        });

        setConfirmDelete({ open: false, messageId: null });
      }
    );
  };

  const openDeleteModal = (id: string) => {
    setConversationToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteConversation = () => {
    if (!socket || !conversationToDelete) return;

    const uid = currentUid;
    if (!uid) return;

    setDeletingConversation(true);

    socket.emit(
      "deleteConversation",
      { conversationId: conversationToDelete, userUid: uid },
      (res: { ok: boolean; error?: string }) => {
        setDeletingConversation(false);
        if (!res?.ok) {
          console.error("deleteConversation error:", res?.error);
          return;
        }

        setConversations((prev) =>
          prev.filter((c) => c._id !== conversationToDelete)
        );

        if (conversationId === conversationToDelete) {
          router.push("/messages");
        }

        setShowDeleteModal(false);
        setConversationToDelete(null);
      }
    );
  };

  function getDateLabel(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();

    const d1 = date.toDateString();
    const d2 = today.toDateString();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d1 === d2) return "היום";
    if (d1 === yesterday.toDateString()) return "אתמול";

    return date.toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <header className={styles.sidebarHeader}>
            <h1 className={styles.sidebarTitle}>Messages</h1>
          </header>
          <div className={styles.conversationsList}>
            {loadingConversations && (
              <p className={styles.emptyState}>Loading conversations…</p>
            )}
            {!loadingConversations && conversations.length === 0 && (
              <p className={styles.emptyState}>No conversations yet.</p>
            )}
            {conversations.map((c) => (
              <div key={c._id} className={styles.conversationRow}>
                <button
                  type="button"
                  className={`${styles.conversationItem} ${
                    c._id === conversationId
                      ? styles.conversationItemActive
                      : ""
                  } ${
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
                <button
                  type="button"
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
          {!conversationId && (
            <div className={styles.chatEmpty}>
              <h2>Select a conversation</h2>
              <p>Choose an artist to start chatting.</p>
            </div>
          )}
          {conversationId && (
            <div className={styles.chatWindow}>
              <header className={styles.chatHeader}>
                <div className={styles.chatHeaderInfo}>
                  <div className={styles.chatHeaderAvatar}>
                    {activeConversation?.otherUser?.profil_url && (
                      <img
                        src={activeConversation.otherUser.profil_url}
                        alt={activeConversation.otherUser.username || ""}
                      />
                    )}
                  </div>
                  <div>
                    <div className={styles.chatHeaderName}>
                      {activeConversation?.otherUser?.name ||
                        activeConversation?.otherUser?.username ||
                        "Chat"}
                    </div>
                    <div className={styles.chatHeaderSub}>
                      Chat on MuseUp
                    </div>
                  </div>
                </div>
              </header>
              <div
                className={styles.chatBox}
                ref={chatBoxRef}
                onScroll={handleChatScroll}
              >
                {messages.map((m, index) => {
                  const isMe = m.sender_uid === currentUid;
                  const isEditing = editingMessageId === m._id;

                  const currentDate = new Date(
                    m.createdAt
                  ).toDateString();
                  const prevDate =
                    index > 0
                      ? new Date(
                          messages[index - 1].createdAt
                        ).toDateString()
                      : null;

                  const shouldShowDate =
                    index === 0 || currentDate !== prevDate;

                  return (
                    <div key={m._id}>
                      {shouldShowDate && (
                        <div className={styles.dateSeparator}>
                          {getDateLabel(m.createdAt)}
                        </div>
                      )}

                      <div
                        className={
                          isMe ? styles.rowMe : styles.rowOther
                        }
                      >
                        <div
                          className={
                            isMe
                              ? styles.bubbleMe
                              : styles.bubbleOther
                          }
                        >
                          <div className={styles.messageText}>
                            {m.text}
                          </div>
                          <div className={styles.messageTimeRow}>
                            <span className={styles.messageTime}>
                              {new Date(
                                m.createdAt
                              ).toLocaleTimeString("he-IL", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isMe && (
                              <div
                                className={styles.messageActions}
                              >
                              <button
  type="button"
  className={styles.messageActionBtn}
  onClick={() => startEditMessage(m)}
>
  <Pencil size={16} />
</button>
<button
  type="button"
  className={`${styles.messageActionBtn} ${styles.messageActionDelete}`}
  onClick={() => handleDeleteMessage(m._id)}
>
  <Trash2 size={16} />
</button>
                              </div>
                            )}
                          </div>
                          {isEditing && (
                            <div className={styles.editBadge}>
                              Editing this message
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form
                className={styles.inputRow}
                onSubmit={handleSend}
              >
                <div className={styles.emojiWrapper}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() =>
                      setShowEmojiPicker((prev) => !prev)
                    }
                    aria-label="Insert emoji"
                  >
                    😊
                  </button>

                  {showEmojiPicker && (
                    <div className={styles.emojiPicker}>
                      <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder={
                    editingMessageId
                      ? "Edit your message..."
                      : "Type your message..."
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className={styles.input}
                />
                <button
                  type="submit"
                  disabled={isSendDisabled}
                  className={
                    isSendDisabled
                      ? `${styles.sendButton} ${styles.sendButtonDisabled}`
                      : styles.sendButton
                  }
                >
                  {editingMessageId ? "Save" : "Send"}
                </button>
                {editingMessageId && (
                  <button
                    type="button"
                    className={styles.cancelEditBtn}
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                )}
              </form>
            </div>
          )}
        </section>
      </div>
      {confirmDelete.open && (
        <div className={styles.deleteModalOverlay}>
          <div className={styles.deleteModal}>
            <div className={styles.deleteModalIcon}>⚠️</div>
            <h3>Delete message?</h3>
            <p>This action cannot be undone.</p>
            <div className={styles.deleteModalActions}>
              <button
                type="button"
                className={`${styles.deleteModalButton} ${styles.deleteModalButtonConfirm}`}
                onClick={performDeleteMessage}
              >
                Delete
              </button>
              <button
                type="button"
                className={`${styles.deleteModalButton} ${styles.deleteModalButtonCancel}`}
                onClick={() =>
                  setConfirmDelete({ open: false, messageId: null })
                }
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className={styles.deleteModalOverlay}>
          <div className={styles.deleteModal}>
            <div className={styles.deleteModalIcon}>⚠️</div>
            <h3>Delete conversation?</h3>
            <p>This action cannot be undone.</p>
            <div className={styles.deleteModalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => {
                  if (deletingConversation) return;
                  setShowDeleteModal(false);
                  setConversationToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmDeleteBtn}
                onClick={confirmDeleteConversation}
                disabled={deletingConversation}
              >
                {deletingConversation ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
