export async function RemoveTokenFromCookies() {

    const res = await fetch("/api/logout");
    if (!res.ok) throw new Error("Failed to remove token from cookies.");
    return res.json();
}
