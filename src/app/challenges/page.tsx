"use client";
import { useEffect, useState } from "react";
import styles from "./challenges.module.css";
import { getChallenges } from "../../services/challengesService";
import {
  getUserJoinedChallenges,
  joinChallenge,
  leaveChallenge,
} from "../../services/challengeSubmissionsService";
export type Challenge = {
  _id: string;
  id: number;
  title: string;
  description?: string;
  picture_url?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
};
type TabKey = "active" | "endingSoon" | "ended";
export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("active");
  const [search, setSearch] = useState("");
  const [joinedIds, setJoinedIds] = useState<number[]>([]);
  const [joinLoadingId, setJoinLoadingId] = useState<number | null>(null);
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getChallenges();
        setChallenges(data);
      } catch (err) {
        console.error("Error loading challenges:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);
  useEffect(() => {
    async function loadJoined() {
      try {
        const uid =
          typeof window !== "undefined"
            ? localStorage.getItem("firebase_uid")
            : null;
        if (!uid) return;
        const submissions = await getUserJoinedChallenges(uid);
        const ids = submissions
          .map((s: any) => s.challenge_id)
          .filter((n: any) => typeof n === "number");
        setJoinedIds(ids);
      } catch (err) {
        console.error("Error loading user joined challenges:", err);
      }
    }
    loadJoined();
  }, []);
  const filtered = filterByTabAndSearch(challenges, tab, search);
  async function handleToggleJoin(challengeId: number) {
    try {
      const uid =
        typeof window !== "undefined"
          ? localStorage.getItem("firebase_uid")
          : null;
      if (!uid) {
        alert("You must be logged in.");
        return;
      }
      setJoinLoadingId(challengeId);
      const isJoined = joinedIds.includes(challengeId);
      if (isJoined) {
        await leaveChallenge(challengeId, uid);
        setJoinedIds((prev) => prev.filter((id) => id !== challengeId));
      } else {
        await joinChallenge(challengeId, uid);
        setJoinedIds((prev) =>
          prev.includes(challengeId) ? prev : [...prev, challengeId]
        );
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update challenge");
    } finally {
      setJoinLoadingId(null);
    }
  }
  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Art Challenges</h1>

        <input
          className={styles.search}
          placeholder="Search challenges by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            tab === "active" ? styles.tabActive : ""
          }`}
          onClick={() => setTab("active")}
        >
          Active
        </button>
        <button
          className={`${styles.tab} ${
            tab === "endingSoon" ? styles.tabActive : ""
          }`}
          onClick={() => setTab("endingSoon")}
        >
          Ending soon
        </button>
        <button
          className={`${styles.tab} ${
            tab === "ended" ? styles.tabActive : ""
          }`}
          onClick={() => setTab("ended")}
        >
          Ended
        </button>
      </div>

      {loading ? (
        <p className={styles.infoText}>Loading challenges…</p>
      ) : filtered.length === 0 ? (
        <p className={styles.infoText}>No challenges found.</p>
      ) : (
        <div className={styles.cardsGrid}>
          {filtered.map((ch) => (
            <ChallengeCard
              key={ch._id}
              challenge={ch}
              isJoined={joinedIds.includes(ch.id)}
              loading={joinLoadingId === ch.id}
              onToggle={() => handleToggleJoin(ch.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
type CardProps = {
  challenge: Challenge;
  isJoined: boolean;
  loading: boolean;
  onToggle: () => void;
};

function ChallengeCard({ challenge, isJoined, loading, onToggle }: CardProps) {
  const start = challenge.start_date
    ? new Date(challenge.start_date)
    : null;
  const end = challenge.end_date ? new Date(challenge.end_date) : null;

  const dateText =
    start && end
      ? `Starts: ${formatDate(start)} • Ends: ${formatDate(end)}`
      : "";

 return (
  <article className={styles.card}>
    {challenge.picture_url && (
      <div className={styles.imageWrapper}>
        <img
          src={challenge.picture_url}
          alt={challenge.title}
          className={styles.image}
        />
      </div>
    )}
    <div className={styles.cardContent}>
      <h2 className={styles.cardTitle}>{challenge.title}</h2>
      {dateText && <p className={styles.cardDates}>{dateText}</p>}
      {challenge.description && (
        <p className={styles.cardDescription}>{challenge.description}</p>
      )}
      {challenge.status !== "ended" && (
        <button
          className={`${styles.joinButton} ${
            isJoined ? styles.joinButtonJoined : ""
          }`}
          onClick={onToggle}
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : isJoined
            ? "Leave Challenge"
            : "Join Now"}
        </button>
      )}
    </div>
  </article>
);
}
function filterByTabAndSearch(
  challenges: Challenge[],
  tab: TabKey,
  search: string
) {
  const now = new Date();
  const term = search.trim().toLowerCase();

  const bySearch = challenges.filter((c) =>
    term ? c.title.toLowerCase().includes(term) : true
  );

  const withDates = bySearch.map((c) => {
    const start = c.start_date ? new Date(c.start_date) : undefined;
    const end = c.end_date ? new Date(c.end_date) : undefined;
    return { ...c, _start: start, _end: end } as any;
  });
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  if (tab === "active") {
    return withDates.filter((c) => {
      if (!c._start || !c._end) return false;
      return c._start <= now && c._end >= now;
    });
  }

  if (tab === "endingSoon") {
    return withDates.filter((c) => {
      if (!c._start || !c._end) return false;
      const diff = (c._end as Date).getTime() - now.getTime();
      const isActive = c._start <= now && c._end >= now;
      return isActive && diff <= WEEK_MS && diff >= 0;
    });
  }
  if (tab === "ended") {
    return withDates.filter((c) => {
      if (!c._end) return false;
      return c._end < now;
    });
  }
  return withDates;
}
function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

