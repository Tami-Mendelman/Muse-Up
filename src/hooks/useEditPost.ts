"use client";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { getPostById, updatePost } from "../services/postService";
import { uploadAvatar as uploadImage } from "../services/uploadService";
type EditPostForm = {
  title: string;
  body: string;
  category: string;
  tags: string[];
  visibility: "public" | "private"; 
  image_url: string;
};
export function useEditPost(postId: string) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditPostForm>({
    title: "",
    body: "",
    category: "",
    tags: [],
    visibility: "public",
    image_url: "",
  });
  const [newTag, setNewTag] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPostById(postId);
        setForm({
          title: data.title ?? "",
          body: data.body ?? "",
          category: data.category ?? "",
          tags: (data.tags as string[]) ?? [],
          visibility:
            data.visibility === "private" ? "private" : "public",
          image_url: data.image_url ?? "",
        });
      } catch (err) {
        console.error("Failed to load post:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [postId]);
  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    if (name === "visibility") {
      setForm((prev) => ({
        ...prev,
        visibility: value === "private" ? "private" : "public",
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
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
  async function handleImageChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    const url = await uploadImage(file);
    setForm((prev) => ({ ...prev, image_url: url }));
  }
async function handleSave(e: FormEvent) {
  e.preventDefault();
  setSaving(true);
  setSuccess(false); // איפוס קודם

  try {
    await updatePost(postId, form);
    setSuccess(true);  // ← כאן מציגים הצלחה
  } catch (err) {
    console.error("Save error:", err);
  } finally {
    setSaving(false);
  }
}


  return {
    loading,
    saving,
    form,
    newTag,
    selectedImage,
  success,
    setNewTag,
    handleChange,
    handleAddTag,
    handleImageChange,
    handleSave,
  };
}
