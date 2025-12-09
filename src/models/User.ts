import { Schema, model, models, Document, Model } from "mongoose";

export interface IUser extends Document {
  firebase_uid: string;
  name: string;
  email: string;
  username: string;
  profil_url?: string;
  bio?: string;
  location?: string;
  role: string;
  followers_count: number;
  following_count: number;
  created_at: Date;
  saved_posts?: number[];
  provider: "password" | "google";
}

const UserSchema = new Schema<IUser>(
  {
    firebase_uid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    profil_url: {
      type: String,
    },
    bio: {
      type: String,
    },
    location: {
      type: String,
    },
    role: {
      type: String,
       enum: ["artist", "admin"], 
      default: "artist",
    },
    followers_count: {
      type: Number,
      default: 0,
    },
    following_count: {
      type: Number,
      default: 0,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    saved_posts: {
      type: [Number],
      default: [],
    },
    provider: {
      type: String,
      enum: ["password", "google"],
      required: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const User: Model<IUser> = models.User || model<IUser>("User", UserSchema);

export default User;
