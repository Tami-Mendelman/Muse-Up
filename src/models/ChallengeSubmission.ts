import { Schema, model, models } from "mongoose";

const challengeSubmissionSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true }, 
    challenge_id: { type: Number, required: true },     
    post_id: { type: Number, required: true },        
    user_id: { type: Number, required: true },          
    status: { type: String },                          
  },
  {
    collection: "challenge_submissions",
    timestamps: false,
  }
);

const ChallengeSubmission =
  models.ChallengeSubmission ||
  model("ChallengeSubmission", challengeSubmissionSchema);

export default ChallengeSubmission;
