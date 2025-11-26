import { Schema, model, models } from "mongoose";
const challengeSubmissionSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true },
    challenge_id: { type: Number, required: true },
    user_id: { type: Number, required: true }, 
    post_id: { type: Number, default: null },
    status: { type: String, default: "joined" },
    image_url: { type: String, default: null },
  },
  {
    collection: "challenge_submissions",
    timestamps: false,
    versionKey: false,
  }
);

const ChallengeSubmission =
  models.ChallengeSubmission ||
  model("ChallengeSubmission", challengeSubmissionSchema);

export default ChallengeSubmission;
