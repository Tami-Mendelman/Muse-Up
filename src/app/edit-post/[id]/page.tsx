"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import styles from "./editPost.module.css";
import { useRouter, useParams } from "next/navigation";
import { uploadAvatar as uploadImage } from "../../../services/uploadService";

export default function EditPostPage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    body: "",
    image_url: "",
    category: "",
    tags: "",
    visibility: "public",
  });

  // Fetch post data
  useEffect(() => {
    async function loadPost() {
      try {
        const res = await fetch(`/api/posts/${id}`);
        const data = await res.json();

        setForm({
          title: data.title || "",
          body: data.body || "",
          image_url: data.image_url || "",
          category: data.category || "",
          tags: data.tags?.join(", ") || "",
          visibility: data.visibility || "public",
        });
      } catch (err) {
        console.error("Failed to load post:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [id]);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const newUrl = await uploadImage(file);
    setForm((prev) => ({ ...prev, image_url: newUrl }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(",").map((t) => t.trim()),
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      alert("Post updated!");
      router.push("/profile");
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return <div className={styles.container}>Loading post…</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Edit Post</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label}>Title</label>
        <input
          className={styles.input}
          name="title"
          value={form.title}
          onChange={handleChange}
          required
        />

        <label className={styles.label}>Body</label>
        <textarea
          className={styles.textarea}
          name="body"
          rows={4}
          value={form.body}
          onChange={handleChange}
        />

        <label className={styles.label}>Category</label>
        <input
          className={styles.input}
          name="category"
          value={form.category}
          onChange={handleChange}
        />

        <label className={styles.label}>Tags</label>
        <input
          className={styles.input}
          name="tags"
          placeholder="tag1, tag2"
          value={form.tags}
          onChange={handleChange}
        />

        <label className={styles.label}>Visibility</label>
        <select
          className={styles.select}
          name="visibility"
          value={form.visibility}
          onChange={handleChange}
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>

        <label className={styles.label}>Image</label>
        <img
          src={form.image_url}
          alt="Preview"
          className={styles.imagePreview}
        />

        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className={styles.fileInput}
        />

        <button className={styles.saveBtn} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
