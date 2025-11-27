"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (socket) return;

    const newSocket = io("http://localhost:4000", {
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return socket;
}
