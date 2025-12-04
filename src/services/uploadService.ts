export async function uploadAvatar(file: File): Promise<string> {
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
export async function uploadArtworkImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("/api/uploads", {
    method: "POST",
    body: fd,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || "Failed to upload image");
  }

  if (!data?.url) {
    throw new Error("Upload did not return image URL");
  }

  return data.url as string;
}
