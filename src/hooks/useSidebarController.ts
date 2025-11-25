"use client";

import { useEffect, useRef, useState } from "react";

export function useSidebarController() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-space",
      open ? "88px" : "24px"
    );
  }, [open]);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-sidebar-ignore-click='true']")) {
        return;
      }

      if (!ref.current.contains(target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return { open, setOpen, ref };
}
