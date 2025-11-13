import styles from "./postModal.module.css";

export default function PostModal() {
  return (
    <div className={styles.modalBackground}>
      <div className={styles.modalBox}>
        <button className={styles.closeBtn}>✕</button>

        <div className={styles.content}>
          <div className={styles.left}>
            {/* כאן בהמשך נוסיף טקסט, אייקונים, לייקים, תגובות */}
            <p>Post content here...</p>
          </div>

          <div className={styles.right}>
            <img src="/post-example.jpg" alt="post" />
          </div>
        </div>
      </div>
    </div>
  );
}
