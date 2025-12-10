import { getBaseUrl } from "../lib/baseUrl";
import { getUserByUid } from "./userService";
const base = getBaseUrl(); 
type ServiceResponse = any;
async function parseErrorResponse(
  res: Response,
  defaultMessage: string
): Promise<never> {
  let text = "";
  try {
    text = await res.text();
  } catch {
    throw new Error(`${defaultMessage} (status ${res.status})`);
  }
  let message = defaultMessage;
  try {
    const data = text ? JSON.parse(text) : null;
    const serverMsg =
      (data && (data.message || data.error || data.details)) || null;
    if (typeof serverMsg === "string") {
      message = serverMsg;
    } else if (text && text.length < 300) {
      message = text;
    } else {
      message = `${defaultMessage} (status ${res.status})`;
    }
  } catch {
    if (text && text.length < 300) {
      message = text;
    } else {
      message = `${defaultMessage} (status ${res.status})`;
    }
  }
  console.error("[challengeSubmissionsService] Server error", {
    status: res.status,
    body: text,
    defaultMessage,
  });

  throw new Error(message);
}
export async function getUserJoinedChallenges(
  userId: string
): Promise<ServiceResponse> {
  const res = await fetch(
    `/api/challenge-submissions?user_id=${encodeURIComponent(userId)}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
  if (!res.ok) {
    await parseErrorResponse(res, "Failed to load user submissions");
  }

  return res.json();
}
export async function joinChallenge(
  challengeId: number,
  userId: string
): Promise<ServiceResponse> {
  const res = await fetch("/api/challenge-submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      challenge_id: challengeId,
      user_id: userId,
    }),
  });
  if (!res.ok) {
    await parseErrorResponse(res, "Failed to join challenge");
  }
  return res.json();
}
export async function leaveChallenge(
  challengeId: number,
  userId: string
): Promise<ServiceResponse> {
  const url = `/api/challenge-submissions?challenge_id=${challengeId}&user_id=${encodeURIComponent(
    userId
  )}`;
  const res = await fetch(url, {
    method: "DELETE",
  });
  if (!res.ok) {
    await parseErrorResponse(res, "Failed to leave challenge");
  }
  return res.json();
}
export async function submitChallengeImage(
  challengeId: number,
  userId: string,
  file: File
): Promise<ServiceResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const uploadRes = await fetch("/api/uploads", {
    method: "POST",
    body: fd,
  });
  if (!uploadRes.ok) {
    await parseErrorResponse(uploadRes, "Upload failed");
  }
  const uploadData: any = await uploadRes.json();
  const imageUrl = uploadData?.url;
  if (!imageUrl) {
    throw new Error("Upload failed – missing url");
  }
  const res = await fetch("/api/challenge-submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      challenge_id: challengeId,
      user_id: userId,
      image_url: imageUrl,
    }),
  });
  if (!res.ok) {
    await parseErrorResponse(res, "Failed to save submission");
  }
  return await res.json();
}
export async function getChallengeParticipantsUsers(challengeId: number) {
  const res = await fetch(
    `${base}/api/challenges/${challengeId}/participants`
  );

  if (!res.ok) {
    throw new Error("Failed to load participants");
  }

  const data = await res.json();

  const rawParticipants = Array.isArray(data.participants)
    ? data.participants
    : [];

  const uids: string[] = Array.from(
    new Set(
      rawParticipants
        .map((p: any) => p.user_uid)
        .filter((x: any) => typeof x === "string" && x.trim().length > 0)
    )
  );

  const users = await Promise.all(
    uids.map(async (u) => {
      try {
        return await getUserByUid(u);
      } catch {
        return null;
      }
    })
  );

  return users.filter((u): u is any => u !== null);
}