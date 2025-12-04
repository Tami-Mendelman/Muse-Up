export function getConversations(socket: any, uid: string): Promise<any[]> {
  return new Promise((resolve) => {
    socket.emit(
      "getConversations",
      { userUid: uid },
      (res: { ok: boolean; conversations?: any[]; error?: string }) => {
        if (!res?.ok || !res.conversations) {
          console.error("getConversations error", res?.error);
          return resolve([]);
        }

        resolve(res.conversations);
      }
    );
  });
}

export function getMessages(socket: any, conversationId: string): Promise<any[]> {
  return new Promise((resolve) => {
    socket.emit(
      "getMessages",
      { conversationId },
      (res: { ok: boolean; messages?: any[]; error?: string }) => {
        if (!res?.ok || !res.messages) {
          console.error("getMessages error", res?.error);
          return resolve([]);
        }
        resolve(res.messages);
      }
    );
  });
}

export function joinConversation(
  socket: any,
  conversationId: string,
  uid: string
) {
  socket.emit("joinConversation", { conversationId, userUid: uid });
}

export function markConversationRead(
  socket: any,
  conversationId: string,
  uid: string
) {
  socket.emit("markConversationRead", { conversationId, userUid: uid });
}

export function sendMessage(
  socket: any,
  payload: { conversationId: string; senderUid: string; text: string }
): Promise<{ ok: boolean; message?: any; error?: string }> {
  return new Promise((resolve) => {
    socket.emit("sendMessage", payload, (res: any) => {
      if (!res?.ok) {
        console.error("sendMessage error", res?.error);
      }
      resolve(res);
    });
  });
}

export function editMessage(
  socket: any,
  payload: { messageId: string; userUid: string; text: string }
): Promise<{ ok: boolean; message?: any; error?: string }> {
  return new Promise((resolve) => {
    socket.emit("editMessage", payload, (res: any) => {
      if (!res?.ok) {
        console.error("editMessage error", res?.error);
      }
      resolve(res);
    });
  });
}

export function deleteMessage(
  socket: any,
  payload: { messageId: string; userUid: string }
): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    socket.emit("deleteMessage", payload, (res: any) => {
      if (!res?.ok) {
        console.error("deleteMessage error", res?.error);
      }
      resolve(res);
    });
  });
}

export function deleteConversation(
  socket: any,
  payload: { conversationId: string; userUid: string }
): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    socket.emit("deleteConversation", payload, (res: any) => {
      if (!res?.ok) {
        console.error("deleteConversation error", res?.error);
      }
      resolve(res);
    });
  });
}
