"use client";

import {
  useEffect,
  useState,
  useRef,
  FormEvent,
} from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSocket } from "../../../lib/useSocket";
import styles from "./conversation.module.css";

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

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef(true); 

  const currentUid =
    typeof window !== "undefined"
      ? localStorage.getItem("firebase_uid")
      : null;

  useEffect(() => {
    if (!autoScrollRef.current) return;
    if (!bottomRef.current) return;

    bottomRef.current.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.length, conversationId]);

  const handleChatScroll = () => {
    const box = chatBoxRef.current;
    if (!box) return;

    const distanceFromBottom =
      box.scrollHeight - box.scrollTop - box.clientHeight;

    autoScrollRef.current = distanceFromBottom < 80;
  };

  useEffect(() => {
    if (!socket) return;

    const uid = localStorage.getItem("firebase_uid");
    if (!uid) {
      console.warn("No firebase_uid in localStorage");
      setLoadingConversations(false);
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
        console.log("getConversations (conversation page) raw:", res);
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

          console.log(
            "mapped conversations (conversation page):",
            mapped
          );
          setConversations(mapped);
        } else {
          console.error("getConversations error", res?.error);
        }
        setLoadingConversations(false);
      }
    );
  }, [socket]);
  useEffect(() => {
    if (!socket || !conversationId) return;

    const uid = localStorage.getItem("firebase_uid");
    if (!uid) {
      console.warn("No firebase_uid in localStorage");
      return;
    }

    socket.emit("joinConversation", {
      conversationId,
      userUid: uid,
    });

    socket.emit(
      "getMessages",
      { conversationId },
      (res: { ok: boolean; messages?: Message[]; error?: string }) => {
        if (res?.ok && res.messages) {
          setMessages(res.messages);
          autoScrollRef.current = true;
        } else {
          console.error("getMessages error", res?.error);
        }
      }
    );

    socket.emit("markConversationRead", {
      conversationId,
      userUid: uid,
    });

    setConversations((prev) =>
      prev.map((c) =>
        c._id === conversationId ? { ...c, unread_count: 0 } : c
      )
    );

    const handleIncoming = (payload: {
      conversationId: string;
      message: Message;
    }) => {
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c._id !== payload.conversationId) return c;

          const base = {
            ...c,
            lastMessageText: payload.message.text,
            lastMessageAt: payload.message.createdAt,
          };

          if (payload.conversationId === conversationId) {
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

      if (payload.conversationId === conversationId) {
        setMessages((prev) => [...prev, payload.message]);
      }
    };

    socket.on("message", handleIncoming);

    return () => {
      socket.off("message", handleIncoming);
    };
  }, [socket, conversationId]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!socket || !conversationId) return;

    const text = input.trim();
    if (!text) return;

    const uid = localStorage.getItem("firebase_uid");
    if (!uid) {
      console.warn("No firebase_uid in localStorage");
      return;
    }

    setSending(true);

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
      }
    );
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
              <button
                key={c._id}
                type="button"
                className={`${styles.conversationItem} ${
                  c._id === conversationId ? styles.conversationItemActive : ""
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
            ))}
          </div>
        </aside>

        {/* CHAT PANE */}
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
                        alt={
                          activeConversation.otherUser.username || ""
                        }
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
                {messages.map((m) => {
                  const isMe = m.sender_uid === currentUid;
                  return (
                    <div
                      key={m._id}
                      className={isMe ? styles.rowMe : styles.rowOther}
                    >
                      <div
                        className={
                          isMe ? styles.bubbleMe : styles.bubbleOther
                        }
                      >
                        <div className={styles.messageText}>{m.text}</div>
                        <div className={styles.messageTime}>
                          {new Date(m.createdAt).toLocaleTimeString(
                            "he-IL",
                            { hour: "2-digit", minute: "2-digit" }
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
                  placeholder="Type your message..."
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
                  Send
                </button>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
