"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import styles from "./Sidebar.module.css";



import {
  FiHome,
  FiMessageSquare,
  FiUser,
  FiPlusSquare,
  FiSearch,
  FiHeart,
  FiAward,
} from "react-icons/fi";

import ArtistSearchDrawer from "../../../app/components/ArtistSearchDrawer/ArtistSearchDrawer";
import { useSidebarController } from "../../../hooks/useSidebarController";
import { useFirebaseUid } from "../../../hooks/useFirebaseUid";
import { getUserByUid, type User } from "../../../services/userService";

export default function Sidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { open, setOpen, ref } = useSidebarController();
  const pathname = usePathname();
  const router = useRouter();
 const baseActiveKey: string =
  pathname?.startsWith("/messages")
    ? "messages"
    : pathname?.startsWith("/following") || pathname?.startsWith("/profile")
    ? "profile"
    : pathname?.startsWith("/create")
    ? "create"
    : pathname?.startsWith("/search")
    ? "search"
    : pathname?.startsWith("/challenges")
    ? "challenges"
    : pathname === "/landing" || pathname === "/"
    ? "home"
    : "home";

  const activeKey = drawerOpen ? "search" : baseActiveKey;

  const { uid, ready: uidReady } = useFirebaseUid();

  const { data: user } = useQuery<User>({
    queryKey: ["user", uid],
    queryFn: () => getUserByUid(uid as string),
    enabled: uidReady && !!uid,
  });

  const avatarUrl =
    user?.profil_url && user.profil_url.trim() !== ""
      ? user.profil_url
      : null;
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

        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile"
            className={styles.avatar}
            onClick={() => router.push("/profile")}
          />
        ) : (
          <div
            className={styles.avatar}
            aria-hidden="true"
            onClick={() => router.push("/profile")}
          />
        )}

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
            onClick={() => router.push("/messages")}
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
            onClick={() => router.push("/create")}
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
                    
<button
  onClick={() => router.push("/challenges")}
  className={`${styles.btn} ${
    activeKey === "challenges" ? styles.active : ""
  }`}
  aria-label="challenges"
>
  <FiAward
    className={`${styles.icon} ${
      activeKey === "challenges" ? styles.iconActive : ""
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
