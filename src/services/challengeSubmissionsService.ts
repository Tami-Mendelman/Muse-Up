export async function getUserJoinedChallenges(userUid: string) {
  const res = await fetch(
    `/api/challenge-submissions?user_uid=${encodeURIComponent(userUid)}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to load user submissions");
  }

  return res.json();
}
export async function joinChallenge(challengeId: number, userUid: string) {
  const res = await fetch("/api/challenge-submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      challenge_id: challengeId,
      user_uid: userUid,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Failed to join challenge");
  }

  return res.json();
}
export async function leaveChallenge(challengeId: number, userUid: string) {
  const url = `/api/challenge-submissions?challenge_id=${challengeId}&user_uid=${encodeURIComponent(
    userUid
  )}`;

  const res = await fetch(url, {
    method: "DELETE",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Failed to leave challenge");
  }

  return res.json();
}
export async function submitChallengeImage(challengeId: number, userUid: string, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const uploadRes = await fetch("/api/uploads", {
    method: "POST",
    body: fd,
  });
  if (!uploadRes.ok) throw new Error("Upload failed");
  const uploadData = await uploadRes.json();
  const imageUrl = uploadData?.url;
  if (!imageUrl) throw new Error("Upload failed – missing url");
  const res = await fetch("/api/challenge-submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      challenge_id: challengeId,
      user_uid: userUid,
      image_url: imageUrl,
    }),
  });

  if (!res.ok) throw new Error("Failed to save submission");

  return await res.json();
}
