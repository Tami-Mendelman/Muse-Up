import styles from "./Sidebar.module.css";
import {
  FiHome,
  FiMessageSquare,
  FiUser,
  FiPlusSquare,
  FiSearch,
  FiHeart,
} from "react-icons/fi";

/** קבלי prop קטן כדי לסמן איזה אייקון פעיל */
type Props = {
  active?: "home" | "messages" | "profile" | "create" | "search";
};

export default function Sidebar({ active = "home" }: Props) {
  return (
    <aside className={styles.root} aria-label="Primary">
      {/* תמונת פרופיל קטנה למעלה (placeholder) */}
      <div className={styles.avatar} aria-hidden="true" />

      {/* אייקונים באמצע – סדר דומה למוקאפ */}
      <nav className={styles.nav}>
        <button
          className={`${styles.btn} ${active === "home" ? styles.active : ""}`}
          aria-label="Home"
        >
          <FiHome
            className={`${styles.icon} ${
              active === "home" ? styles.iconActive : ""
            }`}
          />
        </button>

        <button
          className={`${styles.btn} ${
            active === "messages" ? styles.active : ""
          }`}
          aria-label="Messages"
        >
          <FiMessageSquare
            className={`${styles.icon} ${
              active === "messages" ? styles.iconActive : ""
            }`}
          />
        </button>

        <button
          className={`${styles.btn} ${
            active === "profile" ? styles.active : ""
          }`}
          aria-label="Profile"
        >
          <FiUser
            className={`${styles.icon} ${
              active === "profile" ? styles.iconActive : ""
            }`}
          />
        </button>

        <button
          className={`${styles.btn} ${
            active === "create" ? styles.active : ""
          }`}
          aria-label="Create"
        >
          <FiPlusSquare
            className={`${styles.icon} ${
              active === "create" ? styles.iconActive : ""
            }`}
          />
        </button>

        <button
          className={`${styles.btn} ${
            active === "search" ? styles.active : ""
          }`}
          aria-label="Search"
        >
          <FiSearch
            className={`${styles.icon} ${
              active === "search" ? styles.iconActive : ""
            }`}
          />
        </button>
      </nav>

      <div className={styles.spacer} />

      {/* לב בתחתית כמו במוקאפ */}
      <button className={styles.btn} aria-label="Favorites">
        <FiHeart className={styles.icon} />
      </button>
    </aside>
  );
}
