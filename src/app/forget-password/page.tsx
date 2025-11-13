"use client";

import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import { auth } from "../../lib/firebase";
import styles from "./forget-password.module.css";
import { Mail } from "lucide-react";

export default function ForgetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      alert("We sent you an email to reset your password.");
    } catch (err: any) {
      setError("Failed to send reset email.");
      console.error(err);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <img src="/logo.png" alt="Logo" className={styles.authLogo} />

        <h2>Forgot password?</h2>
        <p>Enter your email and we'll send you a link to reset your password.</p>

        <form onSubmit={handleSubmit}>
          <label className={styles.label}>
            Email address
            <div className={styles.inputWrapper}>
              <span className={styles.inputIconLeft}>
                <Mail size={16} color="#9CA3AF" />
              </span>

              <input
                type="email"
                placeholder="email@address.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </label>

          <button onClick={handleSubmit}>Reset Password</button>
        </form>

        {message && <p className={`${styles.message} ${styles.success}`}>{message}</p>}
        {error && <p className={`${styles.message} ${styles.error}`}>{error}</p>}

        <a href="/login" className={styles.backLink}>
          Go back to Sign In
        </a>
      </div>
    </div>
  );
}
