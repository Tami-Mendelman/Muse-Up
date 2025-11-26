// src/models/Challenge.ts

import { Schema, model, models } from "mongoose";

const challengeSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    picture_url: { type: String },
    status: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
  },
  {
    collection: "challenges",
    timestamps: false,
    versionKey: false,
  }
);

const Challenge = models.Challenge || model("Challenge", challengeSchema);
export default Challenge;
