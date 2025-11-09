// src/models/User.ts
import { Schema, model, models, Model } from "mongoose";

export interface IUser {
  username: string;
  name?: string;
  email: string;
  password_hash: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  role: string;
  followers_count: number;
  following_count: number;
  artworks_count: number;
  likes_received: number;
  created_at?: Date;
  updated_at?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    name: String,
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    avatar_url: String,
    bio: String,
    location: String,
    role: { type: String, default: "user" },
    followers_count: { type: Number, default: 0 },
    following_count: { type: Number, default: 0 },
    artworks_count: { type: Number, default: 0 },
    likes_received: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// מונע OverwriteModelError ונותן טיפוס חזק
const UserModel =
  (models.User as Model<IUser>) || model<IUser>("User", UserSchema);

export default UserModel;



