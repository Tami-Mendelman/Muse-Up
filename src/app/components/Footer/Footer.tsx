import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div>© {new Date().getFullYear()} MuseUp. All rights reserved.</div>

      <nav className={styles.links} aria-label="Footer links">
        <Link href="/about">About</Link>
        <a href="#">Help</a>
        <a href="#">Guidelines</a>
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
      </nav>
    </footer>
  );
}
