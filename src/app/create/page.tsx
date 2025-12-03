"use client";
import { useRef, useState, useMemo } from "react";
import styles from "./create.module.css";
import { useFirebaseUid } from "../../hooks/useFirebaseUid";
import CreatePostAiHelper from "./CreatePostAiHelper";
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
    <div className={styles.previewCard}>
      <div className={styles.previewImageBox}>
        {image ? (
          <img src={image} className={styles.previewImage} />
        ) : (
          <div className={styles.previewImageEmpty}>
            Choose an image to preview
          </div>
        )}
      </div>
      <div className={styles.previewTextArea}>
        <div className={styles.previewCaption}>
          {caption || "Start typing your caption here…"}
        </div>
        {tags.length > 0 && (
          <ul className={styles.chipList}>
            {tags.map((t) => (
              <li key={t} className={styles.chipItem}>
                #{t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
export default function CreatePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { uid } = useFirebaseUid();
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
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
    return Array.from(new Set(base)).slice(0, 5);
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
    if (err) return setMsg({ type: "error", text: err });
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMsg(null);
  }
  async function uploadToServer(f: File) {
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const data = await res.json();
    return data.url;
  }
async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  resetMessages();
  if (!uid) {
    setMsg({
      type: "error",
      text: "You must be logged in to publish artwork.",
    });
    return;
  }
  try {
    if (!file)
      return setMsg({
        type: "error",
        text: "Please choose an artwork image.",
      });
    if (!title.trim())
      return setMsg({
        type: "error",
        text: "Title is required.",
      });
    setLoading(true);
    const imageUrl = await uploadToServer(file);
    const payload = {
      title,
      image_url: imageUrl,
      user_uid: uid,  
      body: caption,
      category,
      tags,
      visibility,
    };
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create post");
    setMsg({ type: "success", text: "Artwork published successfully!" });
    setFile(null);
    setPreview(null);
    setTitle("");
    setCaption("");
    setTagsInput("");
    setCategory("Digital");
    setVisibility("public");
  } catch (err: any) {
    setMsg({ type: "error", text: err.message || "Something went wrong." });
  } finally {
    setLoading(false);
  }
}
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.pageTitle}>Create new post</h1>
      <form className={styles.formLayout} onSubmit={onSubmit}>
        <section className={styles.leftSide}>
          <h2 className={styles.subTitle}>Artwork preview</h2>
          <PreviewCard caption={caption} image={preview} tags={tags} />
          <p className={styles.supportText}>Supported: JPG, PNG, WEBP up to 10MB</p>
        </section>
        <section className={styles.rightSide}>
          <div
            className={`${styles.uploadBox} ${dragOver ? styles.uploadHover : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files?.[0] || null);
            }}
          >
            <button type="button" className={styles.uploadButton} onClick={handlePick}>
              Upload artwork
            </button>
            <p className={styles.uploadHint}>Drag & drop or click to upload</p>

            <input type="file" hidden ref={fileInputRef} onChange={(e) => handleFile(e.target.files?.[0] || null)} />
          </div>

          <label className={styles.label}>Title
            <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <label className={styles.label}>Caption
            <textarea className={styles.input} value={caption} onChange={(e) => setCaption(e.target.value)} />
          </label>
<CreatePostAiHelper
  caption={caption}
  title={title}
  onCaptionChange={setCaption}
  onTitleChange={setTitle}
/>
          <label className={styles.label}>Tags
            <input className={styles.input} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
          </label>
          <label className={styles.label}>Category
            <select className={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Digital</option>
              <option>Photography</option>
              <option>Illustration</option>
              <option>Oil</option>
              <option>Watercolor</option>
            </select>
          </label>
          <div className={styles.radioBox}>
            <label className={styles.radio}>
              <input type="radio" checked={visibility === "public"} onChange={() => setVisibility("public")} />
              Public
            </label>
            <label className={styles.radio}>
              <input type="radio" checked={visibility === "private"} onChange={() => setVisibility("private")} />
              Private
            </label>
          </div>
          {msg && (
            <div className={msg.type === "error" ? styles.error : styles.success}>{msg.text}</div>
          )}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Publishing…" : "Publish artwork"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
