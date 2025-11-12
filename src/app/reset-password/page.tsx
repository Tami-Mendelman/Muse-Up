"use client";

import { useEffect, useState } from "react";
import styles from "./reset-password.module.css";
import { Eye, EyeOff, Lock } from "lucide-react";
import { auth } from "../../lib/firebase";
import { updatePassword } from "firebase/auth";

export default function ResetPasswordPage() {

    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string[]>([]);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState<string[]>([]);


    const validatePassword = (value: string): string[] => {
        const errors: string[] = [];

        if (!value) return [];

        if (value.length < 6) {
            errors.push("Password must be at least 6 characters.");
        }
        if (!/[A-Za-z]/.test(value)) {
            errors.push("Password must contain at least one letter.");
        }
        if (!/[0-9]/.test(value)) {
            errors.push("Password must contain at least one number.");
        }
        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newPasswordErrors = validatePassword(password);
        setPasswordError(newPasswordErrors);

        if (newPasswordErrors.length > 0 || confirmPassword !== password) {
            if (confirmPassword !== password) {
                setConfirmPasswordError(["Passwords do not match."]);
            }
            return;
        }

        const user = auth.currentUser;

        try {
            if (user) {
                const providerId = user.providerData[0].providerId;
                if (providerId === "password") {
                    await updatePassword(user, password);
                    alert("Password updated successfully!");
                } else {
                    alert(`Cannot change password for ${providerId} account. Please change it in provider settings.`);
                }
            } else {
                alert("User not logged in.");
            }
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Error updating password");
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <img src="/logo.png" alt="Logo" className={styles.authLogo} />

                <h2>New password</h2>
                <p>Your new password must be different from previously used one, and must have at least 6 characters.</p>

                <form onSubmit={handleSubmit}>
                    {/* New Password */}
                    <label className={styles.label}>
                        New password
                        <div className={styles.inputWrapper}>
                            <span className={styles.inputIconLeft}>
                                <Lock size={18} color="#000000ff" />
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
                                {showPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
                            </button>
                        </div>

                        {passwordError.length > 0 && (
                            <div className={styles.error}>
                                {passwordError.map((err, idx) => (
                                    <p key={idx}>{err}</p>
                                ))}
                            </div>
                        )}
                    </label>

                    {/* Confirm Password */}
                    <label className={styles.label}>
                        Confirm password
                        <div className={styles.inputWrapper}>
                            <span className={styles.inputIconLeft}>
                                <Lock size={18} color="#000000ff" />
                            </span>

                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••"
                                value={confirmPassword}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setConfirmPassword(value);
                                    if (value !== password) {
                                        setConfirmPasswordError(["Passwords do not match."]);
                                    } else {
                                        setConfirmPasswordError([]);
                                    }
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
                                {showPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
                            </button>
                        </div>

                        {confirmPasswordError.length > 0 && (
                            <div className={styles.error}>
                                {confirmPasswordError.map((err, idx) => (
                                    <p key={idx}>{err}</p>
                                ))}
                            </div>
                        )}
                    </label>

                    <button
                        onClick={handleSubmit}
                        className={styles.submitButton}
                    >
                        Reset Password
                    </button>
                </form>

                <a href="/login" className={styles.backLink}>
                    Go back to Sign In
                </a>
            </div>
        </div>
    );
}