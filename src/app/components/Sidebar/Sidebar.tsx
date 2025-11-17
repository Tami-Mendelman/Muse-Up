"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation"; 
import styles from "./Sidebar.module.css";
import {
  FiHome,
  FiMessageSquare,
  FiUser,
  FiPlusSquare,
  FiSearch,
  FiHeart,
} from "react-icons/fi";

import ArtistSearchDrawer from "../../../app/components/ArtistSearchDrawer/ArtistSearchDrawer";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false); 
  const ref = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const router = useRouter(); 

  const activeKey: string =
    pathname?.startsWith("/messages")
      ? "messages"
      : pathname?.startsWith("/profile")
      ? "profile"
      : pathname?.startsWith("/create")
      ? "create"
      : pathname?.startsWith("/search")
      ? "search"
      : pathname?.startsWith("/about")
      ? "about"
      : "home";

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

  return (
    <>
      <aside
        ref={ref}
        className={`${styles.root} ${open ? styles.open : styles.closed}`}
        aria-label="Primary"
      >
        <button
          className={styles.handle}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </button>

        <div className={styles.avatar} aria-hidden="true" />

        <nav className={styles.nav}>

          <button
            onClick={() => router.push("/landing")}  
            className={`${styles.btn} ${
              activeKey === "home" ? styles.active : ""
            }`}
            aria-label="Home"
          >
            <FiHome
              className={`${styles.icon} ${
                activeKey === "home" ? styles.iconActive : ""
              }`}
            />
          </button>

          <button
            className={`${styles.btn} ${
              activeKey === "messages" ? styles.active : ""
            }`}
            aria-label="Messages"
          >
            <FiMessageSquare
              className={`${styles.icon} ${
                activeKey === "messages" ? styles.iconActive : ""
              }`}
            />
          </button>

        <button
  onClick={() => router.push("/following")}
  className={`${styles.btn} ${
    activeKey === "profile" ? styles.active : ""
  }`}
  aria-label="Following"
>
  <FiUser
    className={`${styles.icon} ${
      activeKey === "profile" ? styles.iconActive : ""
    }`}
  />
</button>


          <button
            className={`${styles.btn} ${
              activeKey === "create" ? styles.active : ""
            }`}
            aria-label="Create"
          >
            <FiPlusSquare
              className={`${styles.icon} ${
                activeKey === "create" ? styles.iconActive : ""
              }`}
            />
          </button>

          <button
            onClick={() => setDrawerOpen(true)}
            className={`${styles.btn} ${
              activeKey === "search" ? styles.active : ""
            }`}
            aria-label="Search"
          >
            <FiSearch
              className={`${styles.icon} ${
                activeKey === "search" ? styles.iconActive : ""
              }`}
            />
          </button>
        </nav>

        <div className={styles.spacer} />

        <button className={styles.btn} aria-label="Favorites">
          <FiHeart className={styles.icon} />
        </button>
      </aside>
      <ArtistSearchDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelectArtist={(artist) => {
          console.log("בחרת אמן:", artist);
        }}
      />
    </>
  );
}
