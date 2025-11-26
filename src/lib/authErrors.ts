export default function getAuthErrorMessage(
  err: any,
  mode: "login" | "register"
): string {
  const code = err?.code as string | undefined;

  if (!code) {
    return "Something went wrong. Please try again.";
  }

  switch (code) {
    case "auth/invalid-credential":
      return mode === "login"
        ? "No account found with this email. Please sign up first."
        : "Invalid credentials.";

    case "auth/wrong-password":
      return "Incorrect password. Please try again.";

    case "auth/user-not-found":
      return mode === "login"
        ? "No account found with this email. Please sign up first."
        : "This email is not registered.";

    case "auth/email-already-in-use":
      return mode === "login"
        ? "This email is already registered. Please log in instead."
        : "This email is already registered. Please log in instead."
        // : "You have to complete your sign up.";

    case "auth/weak-password":
      return "Password is too weak. Please choose a stronger one.";

    case "auth/network-request-failed":
      return "Network error. Check your internet connection and try again.";

    case "auth/popup-closed-by-user":
      return "The sign-in popup was closed before completing. Please try again.";

    case "auth/popup-blocked":
      return "The sign-in popup was blocked by your browser. Please allow popups.";

    case "auth/too-many-requests":
      return "Too many attempts. Please wait a bit and try again.";

    default:
      console.warn("Unhandled Firebase auth error code:", code);
      return "Authentication failed. Please try again.";
  }
}
