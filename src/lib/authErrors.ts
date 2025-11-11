export default function getAuthErrorMessage(err: any, mode: "login" | "register"): string {
  const code = err?.code as string | undefined;

  if (!code) {
    return "Something went wrong. Please try again.";
  }

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Email or password is incorrect.";

    case "auth/user-not-found":
      return "No account found with this email. Please check the address or sign up.";

    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in instead.";

    case "auth/too-many-requests":
      return "Too many attempts. Please wait a bit and try again.";

    case "auth/network-request-failed":
      return "Network error. Check your internet connection and try again.";

    case "auth/weak-password":
      return "Password is too weak. Please choose a stronger one.";

    case "auth/popup-closed-by-user":
      return "The sign-in popup was closed before completing. Please try again.";

    case "auth/popup-blocked":
      return "The sign-in popup was blocked by your browser.";

    default:
      console.warn("Unhandled Firebase auth error code:", code);
      return "Authentication failed. Please try again.";
  }
}

