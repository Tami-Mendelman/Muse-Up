"use client";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import styles from "./conversation.module.css";
import { Trash2, Pencil } from "lucide-react";
import { useConversationPage } from "./useConversationPage";
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
}) as any;
export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const {
    messages,
    conversations,
    loadingConversations,
    chatBoxRef,
    bottomRef,
    handleChatScroll,
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
  } = useConversationPage(
    typeof conversationId === "string" ? conversationId : null
  );
  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <header className={styles.sidebarHeader}>
            <h1 className={styles.sidebarTitle}>Messages</h1>
          </header>
          <div className={styles.conversationsList}>
            {loadingConversations && (
              <p className={styles.emptyState}>
                Loading conversations…
              </p>
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
                  <Trash2 size={18} className={styles.trashIcon} />
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
                {messages.map((m, index) => {
                  const isMe = m.sender_uid ===
                    (typeof window !== "undefined"
                      ? localStorage.getItem("firebase_uid")
                      : "");
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
                                  onClick={() =>
                                    handleDeleteMessage(m._id)
                                  }
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
                      setShowEmojiPicker((prev: boolean) => !prev)
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
                onClick={closeDeleteMessageModal}
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
