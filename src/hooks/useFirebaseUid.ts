"use client";

import { useEffect, useState } from "react";
import { getLocalStorageUid } from "../lib/localStorage";

export function useFirebaseUid() {
  const [uid, setUid] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const value = getLocalStorageUid();
    setUid(value);
    setReady(true);
  }, []);

  return { uid, ready };
}
