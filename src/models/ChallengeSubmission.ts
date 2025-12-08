import { Schema, model, models } from "mongoose";
const ChallengeSubmissionSchema = new Schema(
  {
    challenge_id: {
      type: Number,
      required: true,
    },
    user_id: {
      type: String,
      required: true,
    },
    image_url: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
const ChallengeSubmission =
  models.ChallengeSubmission ||
  model("ChallengeSubmission", ChallengeSubmissionSchema);

export default ChallengeSubmission;
