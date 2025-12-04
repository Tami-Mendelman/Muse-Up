"use client";

import {
  useState,
  useRef,
  useEffect,
  FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "../../../lib/useSocket";
import {
  getConversations,
  getMessages,
  joinConversation,
  markConversationRead,
  sendMessage as sendMessageApi,
  editMessage as editMessageApi,
  deleteMessage as deleteMessageApi,
  deleteConversation as deleteConversationApi,
} from "../../../services/conversationSocketService";

export type Message = {
  _id: string;
  conversation_id: string;
  sender_uid: string;
  recipient_uid: string;
  text: string;
  createdAt: string;
};

export type Conversation = {
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

type ConfirmDeleteState = {
  open: boolean;
  messageId: string | null;
};

export function useConversationPage(conversationId: string | null) {
  const router = useRouter();
  const socket = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessageId, setEditingMessageId] =
    useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] =
    useState<string | null>(null);
  const [deletingConversation, setDeletingConversation] =
    useState(false);

  const [confirmDelete, setConfirmDelete] =
    useState<ConfirmDeleteState>({
      open: false,
      messageId: null,
    });

  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef(true);
  const conversationIdRef = useRef<string | null>(conversationId);

  const [uid, setUid] = useState<string | null>(null);

  // שמירת ה־uid מה־localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("firebase_uid");
    setUid(stored);
  }, []);

  // תמיד שנדע מה ה־conversationId הפעיל בתוך ה־handlers
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

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

  // טעינת רשימת שיחות
  useEffect(() => {
    if (!socket || !uid) return;

    let cancelled = false;
    setLoadingConversations(true);

    getConversations(socket, uid).then((raw) => {
      if (cancelled) return;

      const mapped: Conversation[] = raw.map((c: any) => {
        let unread = Number(c.unread_count ?? 0);
        if (c.unreadByUser && typeof c.unreadByUser === "object") {
          const asRecord = c.unreadByUser as Record<string, number>;
          if (uid in asRecord) unread = asRecord[uid] ?? unread;
        }
        return {
          _id: c._id,
          lastMessageText: c.lastMessageText,
          lastMessageAt: c.lastMessageAt,
          unread_count: unread,
          otherUser: c.otherUser,
          unreadByUser: c.unreadByUser,
        };
      });

      mapped.sort(
        (a, b) =>
          new Date(b.lastMessageAt || 0).getTime() -
          new Date(a.lastMessageAt || 0).getTime()
      );

      setConversations(mapped);
      setLoadingConversations(false);
    });

    return () => {
      cancelled = true;
    };
  }, [socket, uid]);

  // טעינת הודעות לשיחה הנוכחית
  useEffect(() => {
    if (!socket || !uid || !conversationId) return;

    joinConversation(socket, conversationId, uid);
    markConversationRead(socket, conversationId, uid);

    getMessages(socket, conversationId).then((msgs) => {
      const typed = msgs as Message[];
      setMessages(typed);
      autoScrollRef.current = true;
      scrollToBottom();
    });

    // לנקות את ה־unread בשיחה הפעילה
    setConversations((prev) =>
      prev.map((c) =>
        c._id === conversationId ? { ...c, unread_count: 0 } : c
      )
    );
  }, [socket, uid, conversationId]);

  // האזנה לאירועים מהשרת
  useEffect(() => {
    if (!socket || !uid) return;

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

        updated.sort(
          (a, b) =>
            new Date(b.lastMessageAt || 0).getTime() -
            new Date(a.lastMessageAt || 0).getTime()
        );

        return updated;
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

      setMessages((prev) =>
        prev.filter((m) => m._id !== payload.messageId)
      );
    };

    const handleMessageEditedSocket = (payload: { message: Message }) => {
      const msg = payload.message;
      const activeId = conversationIdRef.current;
      if (msg.conversation_id !== activeId) return;

      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? msg : m))
      );
    };

    socket.on("message", handleIncoming);
    socket.on("messageDeleted", handleMessageDeletedSocket);
    socket.on("messageEdited", handleMessageEditedSocket);

    return () => {
      socket.off("message", handleIncoming);
      socket.off("messageDeleted", handleMessageDeletedSocket);
      socket.off("messageEdited", handleMessageEditedSocket);
    };
  }, [socket, uid]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!socket || !conversationId) return;

    const text = input.trim();
    if (!text) return;

    if (!uid) {
      console.warn("No firebase_uid in localStorage");
      return;
    }

    setSending(true);

    if (editingMessageId) {
      const res = await editMessageApi(socket, {
        messageId: editingMessageId,
        userUid: uid,
        text,
      });

      setSending(false);

      if (!res?.ok) return;

      setInput("");
      setEditingMessageId(null);
    } else {
      const res = await sendMessageApi(socket, {
        conversationId,
        senderUid: uid,
        text,
      });

      setSending(false);

      if (!res?.ok) return;

      setInput("");
      autoScrollRef.current = true;
      scrollToBottom();
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + (emojiData.emoji || ""));
  };

  const isSendDisabled = sending || !input.trim();

  const activeConversation =
    conversations.find((c) => c._id === conversationId) || null;

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

  const closeDeleteMessageModal = () => {
    setConfirmDelete({
      open: false,
      messageId: null,
    });
  };

  const performDeleteMessage = async () => {
    if (!socket || !conversationId || !confirmDelete.messageId) return;
    if (!uid) return;

    const messageId = confirmDelete.messageId;

    const res = await deleteMessageApi(socket, {
      messageId,
      userUid: uid,
    });

    if (!res?.ok) {
      closeDeleteMessageModal();
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

    closeDeleteMessageModal();
  };

  const openDeleteModal = (id: string) => {
    setConversationToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteConversation = async () => {
    if (!socket || !conversationToDelete || !uid) return;

    setDeletingConversation(true);

    const res = await deleteConversationApi(socket, {
      conversationId: conversationToDelete,
      userUid: uid,
    });

    setDeletingConversation(false);

    if (!res?.ok) return;

    setConversations((prev) =>
      prev.filter((c) => c._id !== conversationToDelete)
    );

    if (conversationId === conversationToDelete) {
      router.push("/messages");
    }

    setShowDeleteModal(false);
    setConversationToDelete(null);
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

  return {
    messages,
    conversations,
    loadingConversations,

    chatBoxRef,
    bottomRef,
    handleChatScroll,
    scrollToBottom,

    input,
    setInput,
    sending,
    showEmojiPicker,
    setShowEmojiPicker,
    isSendDisabled,
    editingMessageId,

    confirmDelete,
    showDeleteModal,
    deletingConversation,
    activeConversation,

    handleSend,
    handleEmojiClick,
    handleSelectConversation,
    startEditMessage,
    cancelEdit,
    handleDeleteMessage,
    performDeleteMessage,
    openDeleteModal,
    confirmDeleteConversation,
    closeDeleteMessageModal,
    getDateLabel,
  };
}
