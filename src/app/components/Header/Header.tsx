import styles from "./Header.module.css";

export default function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden="true" />
        <span>MuseUp</span>
      </div>

      <div className={styles.spacer} />

      <input
        className={styles.search}
        type="search"
        placeholder="Search artworks…"
        aria-label="Search artworks"
      />

      <button className={styles.btn} type="button">Explore</button>
      <button className={styles.btn} type="button">Share</button>
    </header>
  );
}
