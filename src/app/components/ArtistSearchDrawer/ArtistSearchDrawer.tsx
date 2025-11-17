"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./ArtistSearchDrawer.module.css";

type ArtistUser = {
  _id: string;
  username: string;
  name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  role: string;
  followers_count: number;
  artworks_count: number;
  likes_received: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelectArtist?: (artist: ArtistUser) => void;
};

export default function ArtistSearchDrawer({
  isOpen,
  onClose,
  onSelectArtist,
}: Props) {
  const [artists, setArtists] = useState<ArtistUser[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [searchMode, setSearchMode] = useState<
    "name" | "country" | "specialty"
  >("name");

  useEffect(() => {
    if (!isOpen) return;
    loadAllUsers();
  }, [isOpen]);

  async function loadAllUsers() {
    try {
      setLoading(true);
      const res = await fetch("/api/Users");
      if (!res.ok) {
        console.error("Failed to fetch users", await res.text());
        return;
      }
      const data: ArtistUser[] = await res.json();
      setArtists(data);
    } catch (err) {
      console.error("Error loading users", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredArtists = useMemo(() => {
    const qLower = q.toLowerCase();

    return artists.filter((artist) => {
      const nameText = (
        (artist.name || "") +
        " " +
        (artist.username || "")
      ).toLowerCase();

      const countryText = (artist.location || "").toLowerCase();
      const specialtyText = (artist.bio || "").toLowerCase();

      let matchSearch = true;

      if (qLower) {
        switch (searchMode) {
          case "name":
            matchSearch = nameText.includes(qLower);
            break;
          case "country":
            matchSearch = countryText.includes(qLower);
            break;
          case "specialty":
            matchSearch = specialtyText.includes(qLower);
            break;
        }
      }

      return matchSearch;
    });
  }, [artists, q, searchMode]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}
      data-sidebar-ignore-click="true">
      <aside className={styles.drawer}>
        <header className={styles.header}>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
          <div className={styles.headerText}>
            <h2 className={styles.title}>Discover artists</h2>
            <p className={styles.subtitle}>
              Search and filter creators from the MuseUp community.
            </p>
          </div>
        </header>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search artist or artwork"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className={styles.filters}>
          <button
            type="button"
            className={`${styles.filterBtn} ${
              searchMode === "name" ? styles.filterBtnActive : ""
            }`}
            onClick={() => setSearchMode("name")}
          >
            Name
          </button>

          <button
            type="button"
            className={`${styles.filterBtn} ${
              searchMode === "country" ? styles.filterBtnActive : ""
            }`}
            onClick={() => setSearchMode("country")}
          >
            Country
          </button>

          <button
            type="button"
            className={`${styles.filterBtn} ${
              searchMode === "specialty" ? styles.filterBtnActive : ""
            }`}
            onClick={() => setSearchMode("specialty")}
          >
            Specialty
          </button>
        </div>

        <div className={styles.resultsHeader}>
          <span className={styles.resultsLabel}>Artists</span>
          <span className={styles.resultsCount}>
            {filteredArtists.length} found
          </span>
        </div>

        <div className={styles.list}>
          {loading && <div className={styles.loading}>Loading artists…</div>}

          {!loading &&
            filteredArtists.map((artist) => (
              <button
                key={artist._id}
                type="button"
                className={styles.item}
                onClick={() => onSelectArtist && onSelectArtist(artist)}
              >
                <div className={styles.avatar}>
                  <img
                    src={artist.avatar_url || "/default-avatar.png"}
                    alt={artist.username}
                  />
                </div>

                <div className={styles.info}>
                  <div className={styles.name}>
                    {artist.name || artist.username}
                  </div>
                  <div className={styles.meta}>
                    {artist.bio
                      ? artist.bio.slice(0, 50) +
                        (artist.bio.length > 50 ? "…" : "")
                      : "Artist"}
                  </div>
                  {artist.location && (
                    <div className={styles.location}>{artist.location}</div>
                  )}
                </div>
              </button>
            ))}

          {!loading && filteredArtists.length === 0 && (
            <div className={styles.empty}>No artists found.</div>
          )}
        </div>
      </aside>
    </div>
  );
}
