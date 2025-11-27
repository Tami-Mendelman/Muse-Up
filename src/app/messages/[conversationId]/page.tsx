"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { useParams } from "next/navigation";
import { useSocket } from "../../../lib/useSocket";
import styles from "./conversation.module.css";

type Message = {
  _id: string;
  conversation_id: string;
  sender_uid: string;
  recipient_uid: string;
  text: string;
  createdAt: string;
};

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const socket = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
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

  const isSendDisabled = sending || !input.trim();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Chat</h1>

      <div className={styles.chatBox}>
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
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className={styles.inputRow} onSubmit={handleSend}>
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
  );
}
