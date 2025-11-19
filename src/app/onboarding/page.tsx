"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import styles from "./onboarding.module.css";
import AvatarCropper from "../components/CropImage/CropImage";

type OnboardingProps = {
  name: string;
  email: string;
  username: string;
  bio: string;
  location: string;
  avatar_url: string;
};

async function uploadToServer(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("/api/uploads", {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }

  const data = await res.json();
  if (!data?.url) {
    throw new Error("Upload response missing url");
  }

  return data.url as string;
}

export default function OnboardingPage() {
  const router = useRouter();

  const [form, setForm] = useState<OnboardingProps>({
    name: "",
    email: "",
    username: "",
    bio: "",
    location: "",
    avatar_url: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempFile, setTempFile] = useState<File | null>(null);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      router.push("/login");
      return;
    }

    setForm((prev) => ({
      ...prev,
      name: user.displayName || "",
      email: user.email || "",
      avatar_url: user.photoURL || "",
    }));

    setLoading(false);
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTempFile(file);
  };

  const handleCropConfirm = async (croppedFile: File) => {
    setTempFile(null);
    try {
      setAvatarUploading(true);
      const url = await uploadToServer(croppedFile);
      setForm((prev) => ({ ...prev, avatar_url: url }));
    } catch (err) {
      console.error(err);
      alert("Failed to upload image");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const user = auth.currentUser;
    if (!user) {
      setError("No authenticated user");
      return;
    }
    const trimmedName = form.name.trim();
    const trimmedUsername = form.username.trim();
    const trimmedLocation = form.location.trim();
    const trimmedBio = form.bio.trim();

    const email = form.email || user.email || "";
    const googleAvatar = user.photoURL;
    const hasGoogleAvatar = !!googleAvatar;
    const hasUploadedAvatar = !!form.avatar_url;

    if (!trimmedName || !trimmedUsername || !trimmedLocation || !trimmedBio || !email) {
      setError("All fields are required");
      return;
    }

    if (!hasGoogleAvatar && !hasUploadedAvatar) {
      setError("Profile picture is required");
      return;
    }

    setSubmitting(true);

    let avatarToSave = googleAvatar;
    if (form.avatar_url && form.avatar_url !== googleAvatar) {
      avatarToSave = form.avatar_url;
    }

    try {
      console.log("Current avatar_url in form state:", form.avatar_url);
      console.log("Submitting user data:");
      console.log({
        firebase_uid: user.uid,
        name: trimmedName,
        email: email,
        username: trimmedUsername,
        profil_url: avatarToSave,
        bio: trimmedBio,
        location: trimmedLocation,
      });

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebase_uid: user.uid,
          name: trimmedName,
          email: email,
          username: trimmedUsername,
          profil_url: avatarToSave,
          bio: trimmedBio,
          location: trimmedLocation,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save profile");
      }

      router.push("/landing");
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome to MuseUp</h1>
        <p className={styles.subtitle}>
          לפני שנתחיל, בואי נכיר אותך קצת יותר לעומק.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Avatar */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Profile picture</label>

            <div className={styles.avatarRow}>
              <div className={styles.avatarWrapper}>
                {form.avatar_url ? (
                  <img
                    src={form.avatar_url}
                    alt="Avatar preview"
                    className={styles.avatarImage}
                  />
                ) : (
                  <span className={styles.avatarPlaceholder}>No image</span>
                )}
              </div>

              <div className={styles.avatarActions}>
                {tempFile ? (
                  <AvatarCropper
                    imageFile={tempFile}
                    onUpload={handleCropConfirm}
                    onCancel={() => setTempFile(null)}
                  />
                ) : (
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className={styles.fileInput}
                    disabled={avatarUploading}
                  />
                )}
                <p className={styles.helperText}>
                  אם התחברת דרך Google – זו התמונה משם. אפשר לעדכן לתמונה
                  אחרת.
                </p>
                {avatarUploading && (
                  <p className={styles.helperText}>Uploading image...</p>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Full name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          {/* Username */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Username <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="your_username"
              required
              className={styles.input}
            />
            <p className={styles.helperText}>
              זה השם שיופיע בפרופיל שלך ובקישורים שלך בפלטפורמה.
            </p>
          </div>

          {/* Location */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Location</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Tel Aviv, Israel"
              className={styles.input}
              required
            />
          </div>

          {/* Bio */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={4}
              placeholder="ספרי לנו על הסגנון שלך, ההשראה ומה את יוצרת..."
              className={styles.textarea}
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className={styles.primaryBtn}
          >
            {submitting ? "Saving..." : "Save and continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
