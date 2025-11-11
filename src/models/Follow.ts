import { Schema, model, models } from "mongoose";

const followSchema = new Schema(
  {
    following_user_id: { type: Number, required: true }, // מי עוקב
    followed_user_id: { type: Number, required: true },  // אחרי מי הוא עוקב
  },
  {
    collection: "follows", 
    timestamps: false,
  }
);

const Follow = models.Follow || model("Follow", followSchema);
export default Follow;
