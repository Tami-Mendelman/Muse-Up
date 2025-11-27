"use client";

import { MouseEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "../../../lib/useSocket";
import styles from "./StartChatButton.module.css";

type Props = {
  otherUserUid: string;
  label?: string;
  onClose?: () => void; 
};

export default function StartChatButton({ otherUserUid, label, onClose }: Props) {
  const socket = useSocket();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!socket) return;

    const currentUid = localStorage.getItem("firebase_uid");
    if (!currentUid) return;

    if (currentUid === otherUserUid) return;

    setLoading(true);

    socket.emit(
      "startConversation",
      { currentUserUid: currentUid, otherUserUid },
      (res: any) => {
        setLoading(false);

        if (!res?.ok || !res.conversation?._id) {
          console.error("startConversation error:", res?.error);
          return;
        }

        const conversationId = res.conversation._id as string;
        if (onClose) onClose()
        router.push(`/messages/${conversationId}`);
      }
    );
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={styles.button}
    >
      {loading ? "Opening..." : label || "Message"}
    </button>
  );
}
