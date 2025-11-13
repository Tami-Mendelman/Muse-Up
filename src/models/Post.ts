import { Schema, model, models } from "mongoose";

const PostSchema = new Schema(
  {
    id: { type: Number }, 

    title: { type: String, required: true },
    body: { type: String },

    image_url: { type: String, required: true },

    user_id: { type: String, required: true },

    category: { type: String },
    status: { type: String, default: "published" },

    likes_count: { type: Number, default: 0 },
    comments_count: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default models.Post || model("Post", PostSchema);
