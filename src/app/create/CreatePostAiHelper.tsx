"use client";

import { useState } from "react";
import styles from "./create.module.css";

type Props = {
  caption: string;
  title: string;
  onCaptionChange: (value: string) => void;
  onTitleChange: (value: string) => void;
};

type AiResult = {
  improvedDescription: string;
  suggestedTitle: string;
  shortCaption: string;
};

export default function CreatePostAiHelper({
  caption,
  title,
  onCaptionChange,
  onTitleChange,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (loading) return;

    if (!caption.trim()) {
      setError(" Write a few words about the artwork first, and then I'll improve it for you");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/post-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawCaption: caption,
          currentTitle: title,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }

      setResult({
        improvedDescription: data.improvedDescription,
        suggestedTitle: data.suggestedTitle,
        shortCaption: data.shortCaption,
      });
    } catch (err: any) {
      setError(err?.message || "משהו השתבש עם ה-AI.");
    } finally {
      setLoading(false);
    }
  }

  function applyCaption() {
    if (result?.improvedDescription) {
      onCaptionChange(result.improvedDescription);
    }
  }

  function applyTitle() {
    if (result?.suggestedTitle) {
      onTitleChange(result.suggestedTitle);
    }
  }

  function copyShort() {
    if (!result?.shortCaption) return;
    navigator.clipboard.writeText(result.shortCaption).catch(() => {});
  }

  return (
    <div className={styles.aiHelperWrapper}>
     <button
  type="button"
  className={`${styles.aiHelperButton} ${styles.aiHelperButtonMain}`}
  onClick={handleClick}
  disabled={loading}
>
  {loading ? "AI is thinking…" : "Improve the text with AI"}
</button>


      {error && (
        <div className={styles.aiHelperError}>
          {error}
        </div>
      )}

      {result && (
        <div className={styles.aiHelperResult}>
          <div className={styles.aiHelperBlock}>
            <div className={styles.aiHelperBlockHeader}>
             <h4 className={styles.aiHelperBlockTitle}>Suggested Title</h4>
              <button  type="button" className={styles.aiHelperButton} onClick={applyTitle}>
               Use as title
              </button>
            </div>
            <p className={styles.aiHelperText}>{result.suggestedTitle}</p>
          </div>

          <div className={styles.aiHelperBlock}>
            <div className={styles.aiHelperBlockHeader}>
          <h4 className={styles.aiHelperBlockTitle}>Improved Description</h4>
              <button type="button" className={styles.aiHelperButton} onClick={applyCaption}>
               Use as description
              </button>
            </div>
            <p className={styles.aiHelperText}>{result.improvedDescription}</p>
          </div>

          <div className={styles.aiHelperBlock}>
            <div className={styles.aiHelperBlockHeader}>
              <h4 className={styles.aiHelperBlockTitle}>Short Post Sentence</h4>
             <button type="button" className={styles.aiHelperButton} onClick={copyShort}>
  Copy sentence
</button>

            </div>
            <p className={styles.aiHelperText}>{result.shortCaption}</p>
          </div>
        </div>
      )}
    </div>
  );
}
