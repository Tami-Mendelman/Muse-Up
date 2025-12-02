export async function addTokenToCookie(token: string) {
    const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
    });

    if (!res.ok) throw new Error("Failed to add token in cookies.");
    return res.json();
}
