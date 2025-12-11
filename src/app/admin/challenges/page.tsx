"use client";
import {
  useState,
  FormEvent,
  ChangeEvent,
  useRef,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styles from "./adminChallenges.module.css";
import {
  AdminChallenge as Challenge,
  NewAdminChallengePayload as NewChallengePayload,
  AdminSubmission as Submission,
  AdminWinnerPayload as WinnerPayload,
  getAdminChallenges,
  createAdminChallengeApi,
  getChallengeSubmissions,
  updateAdminWinners,
  uploadChallengeImage,
  deleteAdminChallenge,
} from "../../.././services/adminChallengesService";

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("he-IL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function AdminChallengesPage() {
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<NewChallengePayload>({
    title: "",
    description: "",
    picture_url: "",
    start_date: "",
    end_date: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const [selectedChallenge, setSelectedChallenge] =
    useState<Challenge | null>(null);
  const [isWinnersOpen, setIsWinnersOpen] = useState(false);
  const [winners, setWinners] = useState<WinnerPayload[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Challenge | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    data: challenges,
    isLoading,
    error,
  } = useQuery<Challenge[], Error>({
    queryKey: ["adminChallenges"],
    queryFn: getAdminChallenges,
  });

  const createMutation = useMutation({
    mutationFn: createAdminChallengeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminChallenges"] });
      setForm({
        title: "",
        description: "",
        picture_url: "",
        start_date: "",
        end_date: "",
      });
      setImagePreview(null);
      setImageError(null);
      setFormError(null);
      setIsFormOpen(false);
    },
  });

  const winnersMutation = useMutation({
    mutationFn: updateAdminWinners,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminChallenges"] });
      if (selectedChallenge) {
        queryClient.invalidateQueries({
          queryKey: ["adminChallengeSubmissions", selectedChallenge.id],
        });
      }
      setIsWinnersOpen(false);
      setWinners([]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminChallenges"] });
    },
    onError: (error: any) => {
      alert(error?.message || "Failed to delete challenge");
    },
  });

  const handleDeleteChallenge = (ch: Challenge) => {
    setDeleteTarget(ch);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(String(deleteTarget.id));
    setDeleteTarget(null);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormError(null);
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    try {
      setImageUploading(true);
      const localPreview = URL.createObjectURL(file);
      setImagePreview(localPreview);
      const url = await uploadChallengeImage(file);
      setForm((prev) => ({
        ...prev,
        picture_url: url,
      }));
    } catch (err: any) {
      console.error(err);
      setImageError(err?.message || "Error uploading image");
      setImagePreview(null);
      setForm((prev) => ({ ...prev, picture_url: "" }));
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = form.start_date ? new Date(form.start_date) : null;
    const end = form.end_date ? new Date(form.end_date) : null;

    if (!form.title || !form.start_date || !form.end_date) {
      setFormError("You must fill in the challenge name, start date, and end date.");
      return;
    }

    if (start && start < today) {
      setFormError("The start date cannot be earlier than today.");
      return;
    }

    if (start && end && end < start) {
      setFormError("The end date must be greater than or equal to the start date.");
      return;
    }

    setFormError(null);
    createMutation.mutate(form);
  };

  const openWinnersModal = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setWinners([]);
    setIsWinnersOpen(true);
  };

  const closeWinnersModal = () => {
    if (winnersMutation.isPending) return;
    setIsWinnersOpen(false);
    setSelectedChallenge(null);
    setWinners([]);
  };

  const selectPlace = (submission: Submission, place: 1 | 2 | 3) => {
    setWinners((prev) => {
      const filtered = prev.filter(
        (w) => w.place !== place && w.submission_id !== submission._id
      );
      return [
        ...filtered,
        {
          user_id: submission.user_id,
          submission_id: submission._id,
          place,
        },
      ];
    });
  };

  const isSelected = (submissionId: string, place: 1 | 2 | 3) =>
    winners.some((w) => w.submission_id === submissionId && w.place === place);

  const renderError = () => {
    if (!error) return null;
    const msg = error.message || "";
    const isUnauthorized =
      msg.toLowerCase().includes("unauthorized") || msg.includes("403");
    if (isUnauthorized) {
      return (
        <div className={styles.errorBox}>
          <p>אין לך הרשאה לצפות בעמוד זה.</p>
          <p>תוודאי שב־Mongo המשתמש שלך מוגדר עם role = "admin".</p>
        </div>
      );
    }
    return (
      <div className={styles.errorBox}>
        <p>An error occurred while loading challenges.</p>
        <p>{msg}</p>
      </div>
    );
  };

  const todayIso = new Date().toISOString().split("T")[0];

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Challenges management</h1>
          <p className={styles.subtitle}>
            Here you can create new challenges and track the existing ones.
          </p>
        </div>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => {
            setIsFormOpen((prev) => !prev);
            setFormError(null);
          }}
        >
          {isFormOpen ? "Close create form" : "Create new challenge"}
        </button>
      </div>

      {isFormOpen && (
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <h2 className={styles.formTitle}>New challenge</h2>
          <div className={styles.formRow}>
            <label className={styles.label}>
              Challenge name
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className={styles.input}
                placeholder="e.g., Black & white portrait"
              />
            </label>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className={styles.textarea}
                placeholder="A few words about the goal, rules, etc."
              />
            </label>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>
              Challenge image (optional)
              <div className={styles.imageUploadRow}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                >
                  {imageUploading
                    ? "Uploading image…"
                    : form.picture_url
                    ? "Change image"
                    : "Choose image from your computer"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageFileChange}
                />
                {form.picture_url && !imageUploading && (
                  <span className={styles.uploadHint}>
                    Image uploaded successfully
                  </span>
                )}
              </div>
              {(imagePreview || form.picture_url) && (
                <div className={styles.imagePreviewWrapper}>
                  <img
                    src={imagePreview || form.picture_url}
                    alt="Challenge preview"
                    className={styles.imagePreview}
                  />
                </div>
              )}
              {imageError && (
                <div className={styles.errorText}>{imageError}</div>
              )}
            </label>
          </div>
          <div className={styles.formRowGrid}>
            <label className={styles.label}>
              Start date
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                className={styles.input}
                min={todayIso}
              />
            </label>
            <label className={styles.label}>
              End date
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                className={styles.input}
                min={form.start_date || todayIso}
              />
            </label>
          </div>

          {formError && (
            <div className={styles.errorBoxCustom}>
              {formError}
            </div>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                setIsFormOpen(false);
                setFormError(null);
              }}
              disabled={createMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={createMutation.isPending || imageUploading}
            >
              {createMutation.isPending ? "Saving…" : "Save challenge"}
            </button>
          </div>
          {createMutation.error && (
            <div className={styles.errorText}>
              {(createMutation.error as Error).message}
            </div>
          )}
        </form>
      )}

      {isLoading && !error && (
        <div className={styles.loading}>Loading challenges…</div>
      )}

      {renderError()}

      {!isLoading && !error && challenges && (
        <div className={styles.list}>
          {challenges.length === 0 && (
            <div className={styles.emptyState}>
              You haven't created any challenges yet. Click &quot;Create new
              challenge&quot; to get started.
            </div>
          )}
          {challenges.map((ch) => (
            <div key={ch._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    {ch.title} <span className={styles.cardId}>#{ch.id}</span>
                  </h3>
                  <p className={styles.cardStatus}>
                    Status: <span>{ch.status}</span>
                    {ch.winners_published && (
                      <span className={styles.publishedBadge}>
                        · Winners published
                      </span>
                    )}
                  </p>
                </div>
                {ch.picture_url && (
                  <img
                    src={ch.picture_url}
                    alt={ch.title}
                    className={styles.cardImage}
                  />
                )}
              </div>

              <p className={styles.cardDates}>
                {formatDate(ch.start_date)} — {formatDate(ch.end_date)}
              </p>

              {ch.description && (
                <p className={styles.cardDescription}>{ch.description}</p>
              )}

              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={styles.outlineButtonActive}
                  onClick={() => openWinnersModal(ch)}
                >
                  Manage winners
                </button>

                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={() => handleDeleteChallenge(ch)}
                  disabled={deleteMutation.isPending}
                >
                  Delete challenge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isWinnersOpen && selectedChallenge && (
        <WinnersModal
          challenge={selectedChallenge}
          onClose={closeWinnersModal}
          winners={winners}
          selectPlace={selectPlace}
          isSelected={isSelected}
          winnersMutation={winnersMutation}
        />
      )}

      {deleteTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <h3 className={styles.confirmTitle}>Delete challenge?</h3>
            <p className={styles.confirmText}>This action cannot be undone.</p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmCancel}
                onClick={cancelDelete}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmDelete}
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type WinnersModalProps = {
  challenge: Challenge;
  onClose: () => void;
  winners: WinnerPayload[];
  selectPlace: (submission: Submission, place: 1 | 2 | 3) => void;
  isSelected: (submissionId: string, place: 1 | 2 | 3) => boolean;
  winnersMutation: {
    isPending: boolean;
    error: unknown;
    mutate: (args: {
      challengeId: number;
      winners: WinnerPayload[];
      publish: boolean;
    }) => void;
  };
};

function WinnersModal({
  challenge,
  onClose,
  winners,
  selectPlace,
  isSelected,
  winnersMutation,
}: WinnersModalProps) {
  const { data, isLoading, error } = useQuery<Submission[], Error>({
    queryKey: ["adminChallengeSubmissions", challenge.id],
    queryFn: () => getChallengeSubmissions(challenge.id),
  });

  const handleSave = () => {
    if (!winners || winners.length === 0) {
      alert("Please select at least one winner before saving.");
      return;
    }
    winnersMutation.mutate({
      challengeId: challenge.id,
      winners,
      publish: true,
    });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>
              Manage winners – {challenge.title}
            </h2>
            <p className={styles.modalSubtitle}>
              Select 1st, 2nd and 3rd place from the submissions for this
              challenge.
            </p>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            disabled={winnersMutation.isPending}
          >
            ✕
          </button>
        </div>

        {isLoading && (
          <div className={styles.loading}>Loading submissions…</div>
        )}

        {error && (
          <div className={styles.errorBox}>
            <p>An error occurred while loading submissions.</p>
            <p>{error.message}</p>
          </div>
        )}

        {!isLoading && !error && data && data.length === 0 && (
          <div className={styles.emptyState}>
            There are no submissions for this challenge yet.
          </div>
        )}

        {!isLoading && !error && data && data.length > 0 && (
          <div className={styles.submissionsList}>
            {data.map((sub) => {
              const displayName =
                sub.user?.username ||
                sub.user?.name ||
                sub.user?.firebase_uid;

              return (
                <div key={sub._id} className={styles.submissionCard}>
                  {sub.image_url && (
                    <img
                      src={sub.image_url}
                      alt={displayName || "submission image"}
                      className={styles.submissionImage}
                    />
                  )}

                  <div className={styles.submissionInfo}>
                    <div className={styles.submissionUser}>
                      {sub.user?.profil_url && (
                        <img
                          src={sub.user.profil_url}
                          alt={displayName || "user avatar"}
                          className={styles.submissionAvatar}
                        />
                      )}
                      <span className={styles.submissionUserName}>
                        {displayName}
                      </span>
                    </div>

                    <div className={styles.submissionButtons}>
                      <button
                        type="button"
                        className={
                          isSelected(sub._id, 1)
                            ? `${styles.placeButton} ${styles.placeButtonSelected} ${styles.place1}`
                            : `${styles.placeButton} ${styles.place1}`
                        }
                        onClick={() => selectPlace(sub, 1)}
                      >
                        Place 1
                      </button>
                      <button
                        type="button"
                        className={
                          isSelected(sub._id, 2)
                            ? `${styles.placeButton} ${styles.placeButtonSelected} ${styles.place2}`
                            : `${styles.placeButton} ${styles.place2}`
                        }
                        onClick={() => selectPlace(sub, 2)}
                      >
                        Place 2
                      </button>
                      <button
                        type="button"
                        className={
                          isSelected(sub._id, 3)
                            ? `${styles.placeButton} ${styles.placeButtonSelected} ${styles.place3}`
                            : `${styles.placeButton} ${styles.place3}`
                        }
                        onClick={() => selectPlace(sub, 3)}
                      >
                        Place 3
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
            disabled={winnersMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleSave}
            disabled={winnersMutation.isPending || winners.length === 0}
          >
            {winnersMutation.isPending
              ? "Saving & publishing…"
              : "Save winners & publish"}
          </button>
        </div>

        {winnersMutation.error && (
          <div className={styles.errorText}>
            {(winnersMutation.error as Error).message}
          </div>
        )}
      </div>
    </div>
  );
}
