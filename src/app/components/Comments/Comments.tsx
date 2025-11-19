"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

type CommentType = {
  id: number;
  post_id: number;
  user_id: number;
  body: string;
};

let socket: Socket;

export default function Comments({ postId, userId }: { postId: number; userId: number }) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    socket = io("http://localhost:3001");
    socket.on("connect", () => console.log("Connected to Socket.IO!"));
    socket.on("disconnect", () => console.log("Disconnected"));

    socket.on("new_comment", (comment: CommentType) => {
      setComments((prev) => [...prev, comment]);
    });

    socket.emit("join_post", postId.toString());

    return () => {
      socket.disconnect();
    };
  }, [postId]);

  const handleSend = () => {
    if (!input.trim()) return;
    socket.emit("new_comment", { post_id: postId, user_id: userId, body: input });
    setInput("");
  };

  return (
    <div>
      <h3>Comments</h3>
      <ul>
        {comments.map((c) => (
          <li key={c.id}>
            <b>User {c.user_id}:</b> {c.body}
          </li>
        ))}
      </ul>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
