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

export default function StartChatButton({
  otherUserUid,
  label,
  onClose,
}: Props) {
  const socket = useSocket();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    console.log("[StartChatButton] click", { otherUserUid });

    if (!socket) {
      console.error("[StartChatButton] socket is not ready");
      return;
    }

    const currentUid = localStorage.getItem("firebase_uid");
    if (!currentUid) {
      console.error("[StartChatButton] no firebase_uid in localStorage");
      return;
    }
    if (currentUid === otherUserUid) {
      console.warn("[StartChatButton] current user == otherUser, skipping");
      return;
    }

    setLoading(true);

    socket.emit(
      "startConversation",
      { currentUserUid: currentUid, otherUserUid },
      (res: any) => {
        console.log("[StartChatButton] startConversation ack:", res);
        setLoading(false);

        if (!res || res.ok === false) {
          console.error(
            "[StartChatButton] startConversation error:",
            res?.error || res
          );
          return;
        }
        let conversationId: string | undefined;

        if (res.conversation?._id) {
          conversationId = res.conversation._id as string;
        } else if (res.conversationId) {
          conversationId = res.conversationId as string;
        } else if (res._id) {
          conversationId = res._id as string;
        }

        if (!conversationId) {
          console.error(
            "[StartChatButton] no conversationId in response",
            res
          );
          return;
        }
        if (onClose) {
          try {
            onClose();
          } catch (err) {
            console.error("[StartChatButton] onClose error:", err);
          }
        }
        console.log(
          "[StartChatButton] navigating to",
          `/messages/${conversationId}`
        );
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
