"use client";
import {
  useEffect,
  useState,
  useRef,
  ChangeEvent,
  useMemo,
} from "react";
import styles from "./challenges.module.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFirebaseUid } from "../../hooks/useFirebaseUid";
import { getChallenges } from "../../services/challengesService";
import {
  getUserJoinedChallenges,
  joinChallenge,
  leaveChallenge,
  submitChallengeImage,
  getChallengeParticipantsUsers,
} from "../../services/challengeSubmissionsService";
import { getUserByUid } from "../../services/userService";

export type Challenge = {
  _id: string;
  id: number;
  title: string;
  description?: string;
  picture_url?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  winners_published?: boolean;
  winners?: {
    user_id: string;
    submission_id: string;
    place: number;
    user?: {
      firebase_uid: string;
      username?: string;
      name?: string;
      profil_url?: string;
    } | null;
  }[];
};

type ChallengeSubmission = {
  _id: string;
  challenge_id: number;
  user_uid: string;
  status?: string;
  image_url?: string | null;
};

type TabKey = "active" | "endingSoon" | "ended";

export default function ChallengesPage() {
  const [tab, setTab] = useState<TabKey>("active");
  const [search, setSearch] = useState("");
  const [joinLoadingId, setJoinLoadingId] = useState<number | null>(null);
  const [selectedChallenge, setSelectedChallenge] =
    useState<Challenge | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);

  const selectedChallengeId = selectedChallenge?.id ?? null;

  const queryClient = useQueryClient();
  const { uid, ready: uidReady } = useFirebaseUid();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser", uid],
    queryFn: () => getUserByUid(uid as string),
    enabled: uidReady && !!uid,
  });

  const isAdmin = currentUser?.role === "admin";

  const {
    data: challenges = [],
    isLoading: loadingChallenges,
    error: challengesError,
  } = useQuery<Challenge[]>({
    queryKey: ["challenges"],
    queryFn: getChallenges,
  });

  const { data: joinedSubmissions = [] } = useQuery<ChallengeSubmission[]>({
    queryKey: ["joinedChallenges", uid],
    queryFn: () => getUserJoinedChallenges(uid as string),
    enabled: uidReady && !!uid,
  });

  const { joinedIds, submittedIds } = useMemo(() => {
    const joined: number[] = [];
    const submitted: number[] = [];

    (joinedSubmissions as ChallengeSubmission[]).forEach((s) => {
      if (typeof s.challenge_id === "number") {
        joined.push(s.challenge_id);
        if (
          (s.image_url && typeof s.image_url === "string") ||
          s.status === "submitted"
        ) {
          submitted.push(s.challenge_id);
        }
      }
    });

    return { joinedIds: joined, submittedIds: submitted };
  }, [joinedSubmissions]);

  const joinMutation = useMutation({
    mutationFn: (challengeId: number) =>
      joinChallenge(challengeId, uid as string),
    onSuccess: () => {
      if (!uid) return;
      queryClient.invalidateQueries({
        queryKey: ["joinedChallenges", uid],
      });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (challengeId: number) =>
      leaveChallenge(challengeId, uid as string),
    onSuccess: () => {
      if (!uid) return;
      queryClient.invalidateQueries({
        queryKey: ["joinedChallenges", uid],
      });
    },
  });

  const {
    data: participantUsers = [],
    isLoading: loadingParticipants,
  } = useQuery({
    queryKey: ["challengeParticipantsUsers", selectedChallengeId],
    enabled: !!selectedChallengeId,
    queryFn: () =>
      selectedChallengeId
        ? getChallengeParticipantsUsers(selectedChallengeId)
        : Promise.resolve([]),
  });

  const filtered = filterByTabAndSearch(challenges, tab, search);

  function handleToggleJoin(challengeId: number) {
    if (!uid) {
      alert("You must be logged in.");
      return;
    }
    const isJoined = joinedIds.includes(challengeId);
    setJoinLoadingId(challengeId);
    const mutation = isJoined ? leaveMutation : joinMutation;
    mutation.mutate(challengeId, {
      onError: (err: any) => {
        console.error(err);
        alert(err?.message || "Failed to update challenge");
      },
      onSettled: () => {
        setJoinLoadingId(null);
      },
    });
  }

  function handleShare(challenge: Challenge | null) {
    if (!challenge) return;
    if (typeof window === "undefined") return;

    const url = `${window.location.origin}/challenges?challengeId=${challenge.id}`;
    const text = `Join the "${challenge.title}" art challenge on MuseUp!`;

    if (typeof navigator !== "undefined") {
      const nav: any = navigator;

      if (nav.share) {
        nav
          .share({
            title: challenge.title,
            text,
            url,
          })
          .catch((err: any) => {
            console.error("Share failed", err);
          });
        return;
      }

      if (nav.clipboard && nav.clipboard.writeText) {
        nav.clipboard
          .writeText(url)
          .then(() => {
            alert("Link copied to clipboard");
          })
          .catch(() => {
            window.prompt("Copy this link:", url);
          });
        return;
      }
    }


    window.prompt("Copy this link:", url);
  }

  const modalStart = selectedChallenge?.start_date
    ? new Date(selectedChallenge.start_date)
    : null;
  const modalEnd = selectedChallenge?.end_date
    ? new Date(selectedChallenge.end_date)
    : null;
  const modalDates =
    modalStart && modalEnd
      ? `${formatDate(modalStart)} – ${formatDate(modalEnd)}`
      : "";

  const modalProgress =
    modalStart && modalEnd
      ? (() => {
          const now = new Date().getTime();
          const start = modalStart.getTime();
          const end = modalEnd.getTime();

          if (now <= start) return 0;
          if (now >= end) return 100;

          const total = end - start;
          const done = now - start;
          return Math.round((done / total) * 100);
        })()
      : null;

  function closeModal() {
    setSelectedChallenge(null);
    setShowParticipants(false);
  }

  return (
    <>
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Art Challenges</h1>

          <div
            style={{ display: "flex", gap: "12px", alignItems: "center" }}
          >
            <input
              className={styles.search}
              placeholder="Search challenges by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {isAdmin && (
              <button
                type="button"
                className={styles.adminButton}
                onClick={() => {
                  window.location.href = "/admin/challenges";
                }}
              >
                Challenge management
              </button>
            )}
          </div>
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

        {loadingChallenges ? (
          <p className={styles.infoText}>Loading challenges…</p>
        ) : challengesError ? (
          <p className={styles.infoText}>Failed to load challenges.</p>
        ) : filtered.length === 0 ? (
          <p className={styles.infoText}>No challenges found.</p>
        ) : (
          <div className={styles.cardsGrid}>
            {filtered.map((ch) => (
              <ChallengeCard
                key={ch._id}
                challenge={ch}
                isJoined={joinedIds.includes(ch.id)}
                isSubmitted={submittedIds.includes(ch.id)}
                loading={joinLoadingId === ch.id}
                onToggle={() => handleToggleJoin(ch.id)}
                userUid={uid ?? null}
                onOpen={() => {
                  setSelectedChallenge(ch);
                  setShowParticipants(false);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {selectedChallenge && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modal}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {selectedChallenge.picture_url && (
              <img
                src={selectedChallenge.picture_url}
                alt={selectedChallenge.title}
                className={styles.modalImage}
              />
            )}

            <h2 className={styles.modalTitle}>
              {selectedChallenge.title}
            </h2>

            {modalDates && (
              <p className={styles.modalDates}>{modalDates}</p>
            )}

            {modalProgress !== null && (
              <div className={styles.modalProgressBlock}>
                <div className={styles.modalProgressHeader}>
                  <span>Challenge progress</span>
                  <span className={styles.modalProgressPercent}>
                    {modalProgress}%
                  </span>
                </div>
                <div className={styles.modalProgressBarOuter}>
                  <div
                    className={styles.modalProgressBarInner}
                    style={{ width: `${modalProgress}%` }}
                  />
                </div>
              </div>
            )}
            <div className={styles.modalParticipantsRow}>
              <span className={styles.modalParticipantsLabel}>
                {loadingParticipants
                  ? "Loading participants…"
                  : participantUsers.length === 0
                  ? "No participants yet"
                  : `${participantUsers.length} participants`}
              </span>

              {!loadingParticipants && participantUsers.length > 0 && (
                <button
                  type="button"
                  className={styles.participantsToggle}
                  onClick={() =>
                    setShowParticipants((prev) => !prev)
                  }
                >
                  {showParticipants ? "Hide list" : "Show list"}
                </button>
              )}
            </div>

            {showParticipants &&
              !loadingParticipants &&
              participantUsers.length > 0 && (
                <ul className={styles.participantsList}>
                  {participantUsers.map((u: any) => {
                    const displayName =
                      u.username || u.name || u.firebase_uid;
                    const isCurrentUser =
                      uid && u.firebase_uid === uid;

                    return (
                      <li
                        key={u.firebase_uid}
                        className={styles.participantItem}
                      >
                        {u.profil_url && (
                          <img
                            src={u.profil_url}
                            alt={displayName}
                            className={styles.participantAvatar}
                          />
                        )}
                        <span className={styles.participantName}>
                          {displayName}
                        </span>

                        {isCurrentUser && (
                          <span className={styles.participantYouTag}>
                            You
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

            {selectedChallenge.description && (
              <p className={styles.modalDescription}>
                {selectedChallenge.description}
              </p>
            )}

            {selectedChallenge.winners_published &&
              selectedChallenge.winners &&
              selectedChallenge.winners.length > 0 && (
                <div className={styles.modalWinners}>
                  <h3 className={styles.modalWinnersTitle}>Winners</h3>
                  <ul className={styles.modalWinnersList}>
                    {selectedChallenge.winners
                      .slice()
                      .sort((a, b) => a.place - b.place)
                      .map((w) => {
                        const displayName =
                          w.user?.username ||
                          w.user?.name ||
                          w.user?.firebase_uid ||
                          w.user_id;

                        return (
                          <li
                            key={w.submission_id}
                            className={styles.modalWinnerItem}
                          >
                            <span className={styles.modalWinnerPlace}>
                              Place {w.place}
                            </span>

                            <div className={styles.modalWinnerUserBox}>
                              {w.user?.profil_url && (
                                <img
                                  src={w.user.profil_url}
                                  alt={displayName}
                                  className={styles.modalWinnerAvatar}
                                />
                              )}
                              <span
                                className={styles.modalWinnerUser}
                              >
                                {displayName}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}

            <div className={styles.modalActions}>
              <button
                className={styles.modalShare}
                type="button"
                onClick={() => handleShare(selectedChallenge)}
              >
                Share challenge
              </button>

              <button
                className={styles.modalClose}
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type CardProps = {
  challenge: Challenge;
  isJoined: boolean;
  isSubmitted: boolean;
  loading: boolean;
  onToggle: () => void;
  userUid: string | null;
  onOpen: () => void;
};

function ChallengeCard({
  challenge,
  isJoined,
  isSubmitted,
  loading,
  onToggle,
  userUid,
  onOpen,
}: CardProps) {
  const start = challenge.start_date ? new Date(challenge.start_date) : null;
  const end = challenge.end_date ? new Date(challenge.end_date) : null;

  const dateText =
    start && end
      ? `Starts: ${formatDate(start)} • Ends: ${formatDate(end)}`
      : "";

  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!end) return;

    function update() {
      const now = Date.now();
      const diff = end.getTime() - now;
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      let text = "";
      if (days > 0) text = `${days}d ${hours}h`;
      else if (hours > 0) text = `${hours}h ${minutes}m`;
      else text = `${minutes}m`;

      setTimeLeft(text);
    }

    update();
    const timerId = setInterval(update, 60000);

    return () => clearInterval(timerId);
  }, [challenge.end_date, end]);

  const isActive =
    challenge.status !== "ended" && (!end || end.getTime() > Date.now());

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!userUid) {
        throw new Error("You must be logged in to upload.");
      }
      await submitChallengeImage(challenge.id, userUid, file);
    },
    onSuccess: () => {
      setUploadMessage("Your art was uploaded successfully.");
      if (userUid) {
        queryClient.invalidateQueries({
          queryKey: ["joinedChallenges", userUid],
        });
      }
    },
    onError: () => {
      setUploadMessage("Upload failed, please try again.");
    },
  });

  const isUploading = uploadMutation.isPending;

  function handleUploadClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (fileInputRef.current && !isUploading) {
      fileInputRef.current.click();
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!userUid) {
      setUploadMessage("You must be logged in to upload.");
      e.target.value = "";
      return;
    }

    setUploadMessage(null);
    uploadMutation.mutate(file);
    e.target.value = "";
  }

  return (
    <article className={styles.card} onClick={onOpen}>
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

        {(dateText || (isActive && timeLeft)) && (
          <div className={styles.cardMeta}>
            {dateText && (
              <p className={styles.cardDates}>{dateText}</p>
            )}

            {isActive && timeLeft && (
              <span className={styles.cardTimer}>⏰ {timeLeft} left</span>
            )}
          </div>
        )}

        {challenge.description && (
          <p className={styles.cardDescription}>{challenge.description}</p>
        )}

        {challenge.winners_published &&
          challenge.winners &&
          challenge.winners.length > 0 && (
            <div className={styles.cardWinnersBadge}>
              Winners announced
            </div>
          )}

        {challenge.status !== "ended" && (
          <div className={styles.actionsRow}>
            <button
              className={`${styles.joinButton} ${
                isJoined ? styles.joinButtonJoined : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : isJoined
                ? "Leave Challenge"
                : "Join Now"}
            </button>

            {isJoined && !isSubmitted && (
              <>
                <button
                  className={styles.uploadButton}
                  onClick={handleUploadClick}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Upload your art"}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </>
            )}

            {isJoined && isSubmitted && (
              <span className={styles.submittedText}>
                You already submitted this challenge.
              </span>
            )}
          </div>
        )}

        {uploadMessage && (
          <p className={styles.uploadMessage}>{uploadMessage}</p>
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

      const started = c._start <= now;
      const notEndedByTime = c._end >= now;
      const notEndedByStatus = c.status !== "ended";
      const noWinners = !c.winners_published;

      return started && notEndedByTime && notEndedByStatus && noWinners;
    });
  }

  if (tab === "endingSoon") {
    return withDates.filter((c) => {
      if (!c._start || !c._end) return false;

      const diff = (c._end as Date).getTime() - now.getTime();
      const isActiveByTime = c._start <= now && c._end >= now;
      const notEndedByStatus = c.status !== "ended";
      const noWinners = !c.winners_published;

      return (
        isActiveByTime &&
        notEndedByStatus &&
        noWinners &&
        diff <= WEEK_MS &&
        diff >= 0
      );
    });
  }

  if (tab === "ended") {
    return withDates.filter((c) => {
      if (!c._end) return false;

      const endedByTime = c._end < now;
      const endedByStatus = c.status === "ended";
      const hasWinners = !!c.winners_published;

      return endedByTime || endedByStatus || hasWinners;
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
