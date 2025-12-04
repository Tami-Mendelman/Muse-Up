export async function getImprovedPostText(rawCaption: string, currentTitle: string) {
  const res = await fetch("/api/ai/post-helper", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rawCaption,
      currentTitle,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "Request failed");
  }

  return {
    improvedDescription: data.improvedDescription,
    suggestedTitle: data.suggestedTitle,
    shortCaption: data.shortCaption,
  };
}
