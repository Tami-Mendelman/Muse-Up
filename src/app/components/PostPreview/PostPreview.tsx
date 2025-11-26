import styles from "./PostPreview.module.css";

type Props = {
  imagePreview?: string | null;
  caption: string;
  author?: string;
};

export default function PostPreview({ imagePreview, caption, author = "You" }: Props) {
  return (
    <div className={styles.wrapper}>

      <div className={styles.textBox}>
        <div className={styles.captionBox}>
          {caption || "Start typing your caption here…\n(what inspired you? materials? story?)"}
        </div>

        <div className={styles.actions}>
          <span title="like">❤️</span>
          <span title="save">➕</span>
          <span title="upvote">👍</span>
        </div>

        <div className={styles.meta}>
          <span>8.5K followers</span>
          <span>|</span>
          <span>10K likes</span>
          <span>|</span>
          <b>{author}</b>
          <span className={styles.dot} />
        </div>

        <button type="button" className={styles.commentBtn}>
          הוספת תגובה 🙂
        </button>
      </div>

      <div className={styles.imageBox}>
        {imagePreview ? (
          <img src={imagePreview} alt="preview" className={styles.previewImg} />
        ) : (
          <span className={styles.placeholder}>Choose an image to preview</span>
        )}
      </div>

    </div>
  );
}