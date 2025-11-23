"use client";

import { useEffect, useState } from "react";

export function useFirebaseUid() {
  const [uid, setUid] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const value =
      localStorage.getItem("firebase_uid") || sessionStorage.getItem("firebase_uid");

    setUid(value);
    setReady(true);
  }, []);

  return { uid, ready };
}
