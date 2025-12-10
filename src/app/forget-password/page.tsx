"use client";

import { fetchSignInMethodsForEmail, sendPasswordResetEmail } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import styles from "./forget-password.module.css";
import { Mail } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { getUserByEmail } from "../../services/signin&upServoce";

export default function ForgetPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (value: string): string | null => {
    if (!value) return "Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address.";
    return null;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }

    try {
      const emailTrimmed = email.trim().toLowerCase();
      const user = await getUserByEmail(emailTrimmed);

      if (!user) {
        setError("No account found for this email.");
        return;
      }

      if (user.provider === "google") {
        setError("This account is connected via google. Please log in using that provider.");
        return;
      }

      await sendPasswordResetEmail(auth, emailTrimmed);
      setMessage("We sent you an email to reset your password.");
      setEmail("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send reset email.");
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <img src="../../../../media/logo1.png" alt="Logo" className={styles.authLogo} />

        <h2 className={styles.title}>Forgot password?</h2>
        <p className={styles.subtitle}>Enter your email and we'll send you a link to reset your password.</p>

        <form onSubmit={handleSubmit}>
          <label className={styles.label}>
            Email address
            <div className={styles.inputWrapper}>
              <span className={styles.inputIconLeft}>
                <Mail size={16} color="#000000ff" />
              </span>
              <input
                type="email"
                placeholder="email@address.com"
                value={email}
                onChange={handleEmailChange}
                className={styles.input}
                required
              />
            </div>
            {emailError && <div className={styles.error}>{emailError}</div>}
          </label>

          <button type="submit" className={styles.submitButton}>
            Reset Password
          </button>
        </form>

        {message && <p className={`${styles.message} ${styles.success}`}>{message}</p>}
        {error && <p className={`${styles.message} ${styles.error}`}>{error}</p>}

        <a href="/login" className={styles.backLink}>
          Go back to Log In
        </a>
      </div>
    </div>
  );
}