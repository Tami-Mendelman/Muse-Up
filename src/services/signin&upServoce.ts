export async function getUserByEmail(email: string) {
    const res = await fetch(`/api/users?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
    });

    if (res.status === 404) {
        return null;
    }

    if (!res.ok) {
        throw new Error("Failed to fetch user by email");
    }

    return res.json();
}
