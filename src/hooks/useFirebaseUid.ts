"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
export function useFirebaseUid() {
  const [uid, setUid] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    const storedUid = localStorage.getItem("firebase_uid");
    setUid(storedUid);
    setReady(true);
  }, [pathname]); 
  return { uid, ready };
}
