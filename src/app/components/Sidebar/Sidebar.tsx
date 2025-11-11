"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";
import { FiHome, FiMessageSquare, FiUser, FiPlusSquare, FiSearch, FiHeart } from "react-icons/fi";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  // קובע איזה אייקון Active לפי הראוט
  const activeKey: string =
    pathname?.startsWith("/messages") ? "messages" :
    pathname?.startsWith("/profile")  ? "profile"  :
    pathname?.startsWith("/create")   ? "create"   :
    pathname?.startsWith("/search")   ? "search"   :
    pathname?.startsWith("/about")    ? "about"    :
    "home";

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-space", open ? "88px" : "24px");
  }, [open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <aside
      ref={ref}
      className={`${styles.root} ${open ? styles.open : styles.closed}`}
      aria-label="Primary"
    >
      <button
        className={styles.handle}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
      >
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </button>

      <div className={styles.avatar} aria-hidden="true" />

      <nav className={styles.nav}>
        <button className={`${styles.btn} ${activeKey==="home" ? styles.active : ""}`} data-i="1" data-title="Home" aria-label="Home">
          <FiHome className={`${styles.icon} ${activeKey==="home" ? styles.iconActive : ""}`} />
        </button>

        <button className={`${styles.btn} ${activeKey==="messages" ? styles.active : ""}`} data-i="2" data-title="Messages" aria-label="Messages">
          <FiMessageSquare className={`${styles.icon} ${activeKey==="messages" ? styles.iconActive : ""}`} />
        </button>

        <button className={`${styles.btn} ${activeKey==="profile" ? styles.active : ""}`} data-i="3" data-title="Profile" aria-label="Profile">
          <FiUser className={`${styles.icon} ${activeKey==="profile" ? styles.iconActive : ""}`} />
        </button>

        <button className={`${styles.btn} ${activeKey==="create" ? styles.active : ""}`} data-i="4" data-title="Create" aria-label="Create">
          <FiPlusSquare className={`${styles.icon} ${activeKey==="create" ? styles.iconActive : ""}`} />
        </button>

        <button className={`${styles.btn} ${activeKey==="search" ? styles.active : ""}`} data-i="5" data-title="Search" aria-label="Search">
          <FiSearch className={`${styles.icon} ${activeKey==="search" ? styles.iconActive : ""}`} />
        </button>
      </nav>

      <div className={styles.spacer} />

      <button className={styles.btn} data-i="6" data-title="Favorites" aria-label="Favorites">
        <FiHeart className={styles.icon} />
      </button>
    </aside>
  );
}
