import mongoose, { Schema, model, models } from "mongoose";

export type FollowDocument = {
  following_user_id: string;
  followed_user_id: string;
};

const FollowSchema = new Schema<FollowDocument>(
  {
    following_user_id: {
      type: String,
      required: true,
      index: true,
    },
    followed_user_id: {
      type: String,
      required: true,
      index: true,
    },
  
  },
  {
    collection: "follows",
  }
);

FollowSchema.index(
  { following_user_id: 1, followed_user_id: 1 },
  { unique: true }
);

const Follow =
  (models.Follow as mongoose.Model<FollowDocument>) ||
  model<FollowDocument>("Follow", FollowSchema);

export default Follow;
