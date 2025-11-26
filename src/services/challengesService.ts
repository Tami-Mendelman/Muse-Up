export async function getChallenges() {
  const res = await fetch("/api/challenges", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to load challenges");
  }
  return res.json();
}
