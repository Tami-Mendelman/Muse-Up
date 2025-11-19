"use client";

import { useRef, useState, useMemo } from "react";
import styles from "./create.module.css";

type Visibility = "public" | "private";

function PreviewCard({
  caption,
  image,
  tags,
}: {
  caption: string;
  image: string | null;
  tags: string[];
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardLeft}>
        <div className={styles.cardText}>
          {caption || "Start typing your caption here…"}
        </div>

        {tags.length > 0 && (
          <ul className={styles.chips}>
            {tags.map((t, i) => (
              <li key={`${t}-${i}`} className={styles.chip}>
                #{t}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.cardRight}>
        {image ? (
          <img src={image} alt="preview" className={styles.cardImage} />
        ) : (
          <span className={styles.cardEmpty}>Choose an image to preview</span>
        )}
      </div>
    </div>
  );
}

export default function CreatePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [title, setTitle] = useState("");       // ⭐ חדש – כותרת
  const [caption, setCaption] = useState("");   // תיאור

  const [tagsInput, setTagsInput] = useState("");
  const [category, setCategory] = useState("Digital");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const tags = useMemo(() => {
    const base = tagsInput
      .split(/[,\s]+/)
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean);

    const unique = Array.from(new Set(base));
    return unique.slice(0, 5);
  }, [tagsInput]);

  function resetMessages() {
    setMsg(null);
  }

  function validate(f: File): string | null {
    const ok = ["image/jpeg", "image/png", "image/webp"];
    if (!ok.includes(f.type)) return "Supported formats: JPG, PNG, WEBP only.";
    if (f.size > 10 * 1024 * 1024) return "Max size is 10MB.";
    return null;
  }

  function handlePick() {
    fileInputRef.current?.click();
  }

  function handleFile(f: File | null) {
    if (!f) return;
    const err = validate(f);
    if (err) {
      setMsg({ type: "error", text: err });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMsg(null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function uploadToServer(f: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const data = await res.json();
    if (!data?.url) throw new Error("Upload response missing url");
    return data.url as string;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    try {
      if (!file) {
        setMsg({ type: "error", text: "Please choose an artwork image." });
        return;
      }
      if (!title.trim()) {
        setMsg({ type: "error", text: "Title is required." });
        return;
      }

      setLoading(true);

      const imageUrl = await uploadToServer(file);
      const user_id = "64b7e56b7b2f0a1234567890";

      const payload = {
        title: title.trim(),          // ⭐ עכשיו כותרת אמיתית
        image_url: imageUrl,
        user_id,
        body: caption.trim(),         // תיאור
        category,
        tags,
        visibility,
      };

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Create post failed (${res.status})`);
      }

      setMsg({ type: "success", text: "Artwork published successfully!" });

      // איפוס טופס
      setFile(null);
      setPreview(null);
      setTitle("");
      setCaption("");
      setTagsInput("");
      setCategory("Digital");
      setVisibility("public");
    } catch (err: any) {
      setMsg({ type: "error", text: err?.message || "Something went wrong." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.panel}>
      <h1 className={styles.title}>Create new post</h1>

      <form className={styles.layout} onSubmit={onSubmit}>
        <section className={styles.left}>
          <h2 className={styles.h2}>Artwork preview</h2>
          <PreviewCard caption={caption} image={preview} tags={tags} />
          <p className={styles.help}>Supported formats: JPG, PNG, up to 10 MB</p>
        </section>

        {/* טופס */}
        <section className={styles.right}>
          <div
            className={`${styles.uploadBox} ${dragOver ? styles.hover : ""}`}
            role="group"
            aria-label="Upload artwork"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <button type="button" className={styles.uploadLink} onClick={handlePick}>
              Upload artwork
            </button>
            <p className={styles.uploadHint}>
              Drag & drop your file here or click to upload
            </p>
            <input
              type="file"
              accept="image/*"
              hidden
              ref={fileInputRef}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* ⭐ כותרת חדשה */}
          <label className={styles.label}>
            Title
            <input
              className={styles.input}
              placeholder="Enter artwork title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={resetMessages}
            />
          </label>

          <label className={styles.label}>
            Caption
            <textarea
              className={styles.input}
              placeholder="Write something about your artwork..."
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onFocus={resetMessages}
            />
          </label>

          <label className={styles.label}>
            Tags
            <input
              className={styles.input}
              placeholder="Add up to 5 tags (e.g. #digital, #portrait)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
            {tags.length > 0 && (
              <div className={styles.tagsHint}>
                Will publish: {tags.map((t) => `#${t}`).join(" ")}
              </div>
            )}
          </label>

          <label className={styles.label}>
            Category
            <select
              className={styles.input}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Digital</option>
              <option>Photography</option>
              <option>Illustration</option>
              <option>Oil</option>
              <option>Watercolor</option>
            </select>
          </label>

          <fieldset className={styles.radioGroup}>
            <label className={styles.radio}>
              <input
                type="radio"
                name="visibility"
                checked={visibility === "public"}
                onChange={() => setVisibility("public")}
              />
              <span>Public – visible to everyone</span>
            </label>
            <label className={styles.radio}>
              <input
                type="radio"
                name="visibility"
                checked={visibility === "private"}
                onChange={() => setVisibility("private")}
              />
              <span>Private – visible only to you</span>
            </label>
          </fieldset>

          {msg && (
            <div className={msg.type === "error" ? styles.error : styles.success}>
              {msg.text}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => {
                setFile(null);
                setPreview(null);
                setTitle("");
                setCaption("");
                setTagsInput("");
                setCategory("Digital");
                setVisibility("public");
                setMsg(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? "Publishing..." : "Publish artwork"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
