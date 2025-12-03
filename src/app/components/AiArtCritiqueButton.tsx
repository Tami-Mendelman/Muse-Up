"use client";
import { useState } from "react";
import styles from "./AiArtCritiqueButton.module.css";
type Props = {
  image_url: string;
};
export default function AiArtCritiqueButton({ image_url }: Props) {
  const [loading, setLoading] = useState(false);
  const [critique, setCritique] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  async function handleClick() {
    if (!image_url || loading) return;
    setLoading(true);
    setError(null);
    setOpen(true);
    try {
      const res = await fetch("/api/ai-art-critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url,
          language: "en", 
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }
      setCritique(data.critique || "");
    } catch (err: any) {
      setError(err?.message || "Failed to generate critique.");
    } finally {
      setLoading(false);
    }
  }
  function splitCritique(text: string) {
    let works = "";
    let improve = "";
    if (text.includes("What works") && text.includes("What could be improved")) {
      const afterWorks = text.split("What works")[1] ?? "";
      const [worksPart, improvePartRaw] = afterWorks.split("What could be improved");
      works = (worksPart ?? "").replace(/^[:\-\s•]*/g, "").trim();
      improve = (improvePartRaw ?? "").replace(/^[:\-\s•]*/g, "").trim();
    } else {
      const parts = text.split(/[-•]/g).filter(Boolean);
      works = (parts[0] ?? "").trim();
      improve = (parts[1] ?? "").trim();
    }
    return { works, improve };
  }
  const { works, improve } = critique
    ? splitCritique(critique)
    : { works: "", improve: "" };

  return (
    <>
      <button
        type="button"
        className={styles.aiButton}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? "Analyzing artwork…" : "Get AI critique"}
      </button>
      {open && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>AI critique for  artwork</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalContent}>
              {loading && (
                <p className={styles.loadingText}>Analyzing artwork…</p>
              )}
              {error && <p className={styles.errorText}>{error}</p>}

              {!loading && !error && critique && (
                <>
                  <h3 className={styles.sectionTitle}>What works</h3>
                  <p className={styles.sectionText}>{works}</p>
                  <h3 className={styles.sectionTitle}>What could be improved</h3>
                  <p className={styles.sectionText}>{improve}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
