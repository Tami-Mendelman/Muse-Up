export async function fetchConversationsFromSocket(
  socket: any,
  uid: string
): Promise<any[]> {
  if (!socket || !uid) return [];
  return new Promise((resolve) => {
    socket.emit(
      "getConversations",
      { userUid: uid },
      (res: { ok: boolean; conversations?: any[] }) => {
        if (!res?.ok || !res.conversations) {
          return resolve([]);
        }
        const mapped = res.conversations.map((c: any) => ({
          _id: c._id,
          lastMessageText: c.lastMessageText,
          lastMessageAt: c.lastMessageAt,
          unread_count: c.unreadByUser?.[uid] || 0,
          otherUser: c.otherUser,
        }));
        mapped.sort(
          (a: any, b: any) =>
            new Date(b.lastMessageAt || 0).getTime() -
            new Date(a.lastMessageAt || 0).getTime()
        );
        resolve(mapped);
      }
    );
  });
}
export async function deleteConversationViaSocket(
  socket: any,
  conversationId: string,
  uid: string
): Promise<boolean> {
  if (!socket || !conversationId || !uid) return false;

  return new Promise((resolve) => {
    socket.emit(
      "deleteConversation",
      { conversationId, userUid: uid },
      (res: { ok: boolean }) => {
        resolve(!!res?.ok);
      }
    );
  });
}
