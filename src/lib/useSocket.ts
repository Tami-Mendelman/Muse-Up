"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!socketInstance) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

      if (!socketUrl) {
        throw new Error("NEXT_PUBLIC_SOCKET_URL is missing");
      }

      socketInstance = io(socketUrl, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 500,
        withCredentials: true,
      });

      socketInstance.on("connect", () => {
        console.log("CLIENT: connected to socket", socketInstance?.id);
      });

      socketInstance.on("connect_error", (err) => {
        console.error("CLIENT: connect_error:", err.message);
      });

      socketInstance.on("disconnect", () => {
        console.log("CLIENT: disconnected");
      });
    }

    setSocket(socketInstance);

    return () => { };
  }, []);

  return socket;
}
