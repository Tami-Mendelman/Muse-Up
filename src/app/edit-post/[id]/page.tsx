"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import styles from "./editPost.module.css";
import { useRouter, useParams } from "next/navigation";
import { uploadAvatar as uploadImage } from "../../../services/uploadService";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    body: "",
    category: "",
    tags: [] as string[],
    visibility: "public",
    image_url: "",
  });

  const [newTag, setNewTag] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // -------------------------------------------------------
  // Load Post
  // -------------------------------------------------------
  useEffect(() => {
    async function loadPost() {
      try {
        const res = await fetch(`/api/posts/${postId}`);
        const data = await res.json();
        setForm({
          title: data.title ?? "",
          body: data.body ?? "",
          category: data.category ?? "",
          tags: data.tags ?? [],
          visibility: data.visibility ?? "public",
          image_url: data.image_url ?? "",
        });
      } catch (err) {
        console.error("Failed to load post:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [postId]);

  // -------------------------------------------------------
  // Handlers
  // -------------------------------------------------------
  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleAddTag(e: FormEvent) {
    e.preventDefault();
    if (!newTag.trim()) return;
    setForm((prev) => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()],
    }));
    setNewTag("");
  }

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);

    const url = await uploadImage(file);
    setForm((prev) => ({ ...prev, image_url: url }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/posts/${postId}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        console.error("Failed to update post");
        setSaving(false);
        return;
      }

      router.push(`/profile`);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className={styles.container}>Loading…</div>;

  return (
    <div className={styles.container}>

      {/* ---------------------------------------
          PAGE TITLE
      ---------------------------------------- */}
      <h1 className={styles.title}>Edit Post</h1>

      {/* ---------------------------------------
          IMAGE PANEL
      ---------------------------------------- */}
      <div className={styles.imageBox}>
        <img
          src={form.image_url}
          alt="Post Image"
          className={styles.imagePreview}
        />

        <button className={styles.changeImageBtn}>
          Change Image
          <input
            type="file"
            accept="image/*"
            style={{ opacity: 0, position: "absolute", inset: 0, cursor: "pointer" }}
            onChange={handleImageChange}
          />
        </button>
      </div>

      {/* ---------------------------------------
          FORM PANEL
      ---------------------------------------- */}
      <form className={styles.form} onSubmit={handleSave}>

        {/* Title */}
        <div>
          <label className={styles.label}>Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        {/* Body */}
        <div>
          <label className={styles.label}>Body</label>
          <textarea
            name="body"
            value={form.body}
            onChange={handleChange}
            className={styles.textarea}
          />
        </div>

        {/* Category */}
        <div>
          <label className={styles.label}>Category</label>
          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        {/* Tags */}
        <div>
          <label className={styles.label}>Tags</label>

          <div className={styles.tagsInput}>
            {form.tags.map((t, i) => (
              <span key={i} className={styles.tagChip}>{t}</span>
            ))}

            {/* אין form פנימי! */}
            <input
              className={styles.tagInputField}
              value={newTag}
              placeholder="Type tag and press Enter"
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag(e);
                }
              }}
            />
          </div>
        </div>


        {/* Visibility */}
        <div>
          <label className={styles.label}>Visibility</label>
          <select
            name="visibility"
            value={form.visibility}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        {/* Save button */}
        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
