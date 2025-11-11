"use client";

import { useState } from "react";
import { auth, provider } from "../../../lib/firebase";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
} from "firebase/auth";
import Link from "next/link";
import styles from "./AuthForm.module.css";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import getAuthErrorMessage from "../../../lib/authErrors";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string>("");

    const validatePassword = (value: string): string => {
        if (!value) return "";

        if (value.length < 6) {
            return "Password must be at least 6 characters.";
        }
        if (!/[A-Za-z]/.test(value)) {
            return "Password must contain at least one letter.";
        }
        if (!/[0-9]/.test(value)) {
            return "Password must contain at least one number.";
        }
        return "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const error = validatePassword(password);
        setPasswordError(error);
        if (error) return;

        try {
            if (mode === "login") {
                await signInWithEmailAndPassword(auth, email, password);
                alert("login successfully!");
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                alert("register successfully!");
            }
        } catch (err: any) {
            const msg = getAuthErrorMessage(err, mode);
            alert(msg);
        }
    };

    const handleGoogle = async () => {
        try {
            await signInWithPopup(auth, provider);
            alert("login successfully with Google!");
        } catch (err: any) {
            const msg = getAuthErrorMessage(err, mode);
            alert(msg);
        }
    };

    return (
        <div className={styles.container}>
            <div
                className={`${styles.box} ${mode === "register" ? styles.boxRegister : ""
                    }`}
            >
                <img src="/media/logo.png" alt="Logo" className={styles.logo} />

                <h2 className={styles.title}>
                    {mode === "login" ? "Sign in" : "Create Your Account"}
                </h2>

                <p className={styles.subtitle}>
                    {mode === "login"
                        ? "Log in by entering your email address and password."
                        : "Enter your email and password to create your account."}
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Email */}
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

                    {/* Password */}
                    <label className={styles.label}>
                        Password
                        <div className={styles.inputWrapper}>
                            <span className={styles.inputIconLeft}>
                                <Lock size={18} color="#D97706" />
                            </span>

                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••"
                                value={password}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setPassword(value);
                                    setPasswordError(validatePassword(value));
                                }}
                                className={styles.input}
                                required
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                className={styles.iconButton}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <EyeOff size={18} color="#6B7280" />
                                ) : (
                                    <Eye size={18} color="#6B7280" />
                                )}
                            </button>
                        </div>

                        {passwordError && <p className={styles.error}>{passwordError}</p>}
                    </label>

                    {mode === "register" && (
                        <label className={styles.checkboxRow}>
                            <input type="checkbox" className={styles.checkbox} />
                            <span>Receive news, updates and deals</span>
                        </label>
                    )}

                    <button
                        type="submit"
                        className={styles.primaryBtn}
                        disabled={!!passwordError || !email || !password}
                    >
                        {mode === "login" ? "Log in" : "Create Account"}
                    </button>
                </form>

                <div className={styles.divider}>
                    <span>Or</span>
                </div>

                <button onClick={handleGoogle} className={styles.googleBtn}>
                    <img
                        className={styles.googleIcon}
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google logo"
                    />
                    <span>
                        {mode === "login" ? "Sign in with Google" : "Continue with Google"}
                    </span>
                </button>

                {mode === "register" && (
                    <p className={styles.terms}>
                        By creating an account, you agree to the{" "}
                        <a href="#" className={styles.textLink}>
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className={styles.textLink}>
                            Privacy Policy
                        </a>
                        .
                    </p>
                )}

                <p className={styles.switch}>
                    {mode === "login"
                        ? "Don't have an account?"
                        : "Already have an account?"}{" "}
                    <Link
                        href={mode === "login" ? "/register" : "/login"}
                        className={styles.textLink}
                    >
                        {mode === "login" ? "Sign up here" : "Log in here"}
                    </Link>
                </p>
            </div>
        </div>
    );
}
