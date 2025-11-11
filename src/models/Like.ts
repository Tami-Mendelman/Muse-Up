import { Schema, model, models } from "mongoose";

const likeSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true },
    user_id: { type: Number, required: true },          // מי עשה את הלייק
    post_id: { type: Number, required: true },          // ה-ID המספרי של הפוסט
  },
  {
    collection: "likes", 
    timestamps: false,
  }
);

const Like = models.Like || model("Like", likeSchema);
export default Like;
