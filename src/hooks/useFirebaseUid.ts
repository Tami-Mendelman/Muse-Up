"use client";

import { useEffect, useState } from "react";

export function useFirebaseUid() {
  const [uid, setUid] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const value =
      localStorage.getItem("firebase_uid") ||
      localStorage.getItem("firebaseUid") ||
      localStorage.getItem("userId");

    setUid(value);
    setReady(true);
  }, []);

  return { uid, ready };
}
