"use client";
import styles from "./editPost.module.css";
import { useRouter, useParams } from "next/navigation";
import { useEditPost } from "../../../hooks/useEditPost";
export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;
  const {
    success,
    loading,
    saving,
    form,
    newTag,
    setNewTag,
    handleChange,
    handleAddTag,
    handleImageChange,
    handleSave,
  } = useEditPost(postId);
  if (loading) return <div className={styles.container}>Loading…</div>;
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Edit Post</h1>
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
            style={{
              opacity: 0,
              position: "absolute",
              inset: 0,
              cursor: "pointer",
            }}
            onChange={handleImageChange}
          />
        </button>
      </div>
      <form className={styles.form} onSubmit={handleSave}>
        <div>
          <label className={styles.label}>Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div>
          <label className={styles.label}>Body</label>
          <textarea
            name="body"
            value={form.body}
            onChange={handleChange}
            className={styles.textarea}
          />
        </div>
        <div>
          <label className={styles.label}>Category</label>
          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div>
          <label className={styles.label}>Tags</label>
          <div className={styles.tagsInput}>
            {form.tags.map((t, i) => (
              <span key={i} className={styles.tagChip}>
                {t}
              </span>
            ))}
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
        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
        {success && (
  <p className={styles.successMessage}>Post updated successfully!</p>
)}

      </form>
    </div>
  );
}
