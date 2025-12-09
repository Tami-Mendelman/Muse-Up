export type AdminChallenge = {
  _id: string;
  id: number;
  title: string;
  description?: string;
  picture_url?: string;
  status: string;
  start_date: string;
  end_date: string;
  winners_published?: boolean;
};
export type NewAdminChallengePayload = {
  title: string;
  description: string;
  picture_url: string;
  start_date: string;
  end_date: string;
};
export type AdminSubmission = {
  _id: string;
  challenge_id: number;
  user_id: string;
  image_url?: string;
  createdAt?: string;
  user?: {
    firebase_uid: string;
    username?: string;
    name?: string;
    profil_url?: string;
  } | null;
};
export type AdminWinnerPayload = {
  user_id: string;
  submission_id: string;
  place: 1 | 2 | 3;
};
export async function getAdminChallenges(): Promise<AdminChallenge[]> {
  const res = await fetch("/api/admin/challenges", {
    method: "GET",
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Failed to load admin challenges");
  }
  return data;
}
export async function createAdminChallengeApi(
  payload: NewAdminChallengePayload
): Promise<AdminChallenge> {
  const res = await fetch("/api/admin/challenges", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Failed to create challenge");
  }

  return data;
}
export async function getChallengeSubmissions(
  challengeId: number
): Promise<AdminSubmission[]> {
  const res = await fetch(
    `/api/admin/challenges/${challengeId}/submissions`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Failed to load submissions");
  }
  return data;
}
export async function updateAdminWinners(params: {
  challengeId: number;
  winners: AdminWinnerPayload[];
  publish: boolean;
}): Promise<AdminChallenge> {
  const res = await fetch(`/api/admin/challenges/${params.challengeId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      winners: params.winners,
      publish: params.publish,
      status: "ended",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Failed to update winners");
  }
  return data;
}
export async function uploadChallengeImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Failed to upload image");
  }
  const imageUrl = data.url || data.secure_url;
  if (!imageUrl) {
    throw new Error("Upload response missing url");
  }
  return imageUrl as string;
}
