"use client";

import {
  useEffect,
  useState,
  useRef,
  FormEvent,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "../../../lib/useSocket";
import styles from "./conversation.module.css";
import dynamic from "next/dynamic";
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

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentUid =
    typeof window !== "undefined"
      ? localStorage.getItem("firebase_uid")
      : null;

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

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
      (res: { ok: boolean; conversations?: Conversation[]; error?: string }) => {
        if (res?.ok && res.conversations) {
          setConversations(res.conversations);
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
        } else {
          console.error("getMessages error", res?.error);
        }
      }
    );

    const handleIncoming = (payload: {
      conversationId: string;
      message: Message;
    }) => {
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
                  c._id === conversationId
                    ? styles.conversationItemActive
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

              <div className={styles.chatBox}>
                {messages.map((m) => {
                  const isMe = m.sender_uid === currentUid;
                  return (
                    <div
                      key={m._id}
                      className={
                        isMe ? styles.rowMe : styles.rowOther
                      }
                    >
                      <div
                        className={
                          isMe ? styles.bubbleMe : styles.bubbleOther
                        }
                      >
                        <div className={styles.messageText}>
                          {m.text}
                        </div>
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
