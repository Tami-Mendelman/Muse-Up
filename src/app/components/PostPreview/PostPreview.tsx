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

        {/* ACTIONS — הוחלפו לכפתורי btn-icon */}
        <div className={styles.actions}>
          <button className="btn-icon" title="like">❤️</button>
          <button className="btn-icon" title="save">➕</button>
          <button className="btn-icon" title="upvote">👍</button>
        </div>

        {/* META */}
        <div className={styles.meta}>
          <span>8.5K followers</span>
          <span>|</span>
          <span>10K likes</span>
          <span>|</span>
          <b>{author}</b>
          <span className={styles.dot} />
        </div>

        {/* COMMENT BUTTON — כפתור רגיל → btn btn-outline */}
        <button type="button" className="btn btn-outline">
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
