import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const commentSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true },
    post_id: { type: String, required: true },    
    user_id: { type: String, required: true },  
    body: { type: String, required: true },
  },
  {
    collection: "comments",
    timestamps: true,
  }
);

const Comment = models.Comment || model("Comment", commentSchema);
export default Comment;
