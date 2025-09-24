import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    type: { type: String, enum: ["reading", "vocabulary"], required: true },
    accessLevel: {
      type: String,
      enum: ["free", "basic", "pro", "premium"],
      default: "free",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Lesson", lessonSchema);
