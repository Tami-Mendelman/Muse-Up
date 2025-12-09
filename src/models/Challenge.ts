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

    winners: [
      {
        user_id: {
          type: String, 
          required: true,
        },
        submission_id: {
          type: Schema.Types.ObjectId,
          ref: "ChallengeSubmission",
          required: true,
        },
        place: {
          type: Number,
          enum: [1, 2, 3], 
          required: true,
        },
      },
    ],

    winners_published: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: "challenges",
    timestamps: false,
    versionKey: false,
  }
);

const Challenge = models.Challenge || model("Challenge", challengeSchema);
export default Challenge;
