const key = "firebase_uid";

export function setLocalStorageUid(uid: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, uid);
}

export function getLocalStorageUid(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
}

export function removeLocalStorageUid() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
}