"use client";

import { MouseEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "../../../lib/useSocket";

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
      return;
    }

    setLoading(true);

    socket.emit(
      "startConversation",
      { currentUserUid: currentUid, otherUserUid },
      (res: any) => {
        setLoading(false);

        if (!res || res.ok === false) {
          console.error("[StartChatButton] startConversation error:", res?.error);
          return;
        }

        let conversationId =
          res.conversation?._id ||
          res.conversationId ||
          res._id;

        if (!conversationId) {
          console.error("[StartChatButton] no conversationId in response");
          return;
        }

        if (onClose) {
          try {
            onClose();
          } catch (err) {
            console.error("[StartChatButton] onClose error:", err);
          }
        }

        router.push(`/messages/${conversationId}`);
      }
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="btn btn-primary"
    >
      {loading ? "Opening..." : label || "Message"}
    </button>
  );
}
