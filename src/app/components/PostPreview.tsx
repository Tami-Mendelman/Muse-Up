// src/components/PostPreview.tsx
type Props = {
  imagePreview?: string | null;
  caption: string;
  author?: string;
};

export default function PostPreview({ imagePreview, caption, author = "You" }: Props) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 340px",
      gap: 16,
      border: "1px solid #e6e8ef",
      borderRadius: 12,
      padding: 12,
      background: "#fff"
    }}>
      {/* טקסט */}
      <div style={{ padding: 8 }}>
        <div style={{
          height: 180,
          border: "1px dashed #d1d5db",
          borderRadius: 8,
          padding: 10,
          whiteSpace: "pre-wrap",
          lineHeight: 1.5,
          color: "#111827",
          overflow: "auto",
          background:"#fafafa"
        }}>
          {caption || "Start typing your caption here…\n(what inspired you? materials? story?)"}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
          <span title="like" style={{ fontSize: 20 }}>❤️</span>
          <span title="save" style={{ fontSize: 20 }}>➕</span>
          <span title="upvote" style={{ fontSize: 20 }}>👍</span>
        </div>

        <div style={{ marginTop: 10, color: "#4b5563", display:"flex", gap:10, alignItems:"center" }}>
          <span>8.5K followers</span>
          <span>|</span>
          <span>10K likes</span>
          <span>|</span>
          <b>{author}</b>
          <span style={{
            width: 18, height: 18, background: "#fbbf24",
            borderRadius: "50%", display:"inline-block", marginLeft: 6
          }} />
        </div>

        <button
          type="button"
          style={{
            marginTop: 12, width: "100%", height: 44, borderRadius: 10,
            border: "1px solid #d1d5db", background: "#fff", cursor: "text"
          }}
        >
          הוספת תגובה 🙂
        </button>
      </div>

      {/* תמונה */}
      <div style={{
        borderRadius: 12,
        overflow: "hidden",
        background: "#111",
        display: "grid",
        placeItems: "center",
        height: 300
      }}>
        {imagePreview ? (
          // תצוגת קובץ מקומי לפני העלאה
          <img
            src={imagePreview}
            alt="preview"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ color: "#9ca3af" }}>Choose an image to preview</span>
        )}
      </div>
    </div>
  );
}
