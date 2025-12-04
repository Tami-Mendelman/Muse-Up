export async function getArtCritique(image_url: string, language: string = "en") {
  const res = await fetch("/api/ai-art-critique", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url,
      language,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "Request failed");
  }

  return data.critique || "";
}
