import { Schema, model, models, type Model, type Document } from "mongoose";

export interface IPost extends Document {
  id?: number;
  title: string;
  body?: string;
  image_url: string;
  user_id: string;
  category?: string;
  tags: string[];
  visibility: string;
  status: string;
  likes_count: number;
  comments_count: number;
  created_at?: Date;
  updated_at?: Date;
}

const PostSchema = new Schema<IPost>(
  {
    id: { type: Number },
    title: { type: String, required: true },
    body: { type: String },
    image_url: { type: String, required: true },
    user_id: { type: String, required: true },
    category: { type: String },
    tags: { type: [String], default: [] },
    visibility: { type: String, default: "public" },
    status: { type: String, default: "active" },
    likes_count: { type: Number, default: 0 },
    comments_count: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const PostModel: Model<IPost> = models.Post || model<IPost>("Post", PostSchema);

export default PostModel;
