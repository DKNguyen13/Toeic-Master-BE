import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
    title: { type: String, maxlength: 50, required: true, trim: true },
    path: { type: String, default: "" }, // path HTML
    type: { type: String, enum: ["reading", "vocabulary"], required: true },
    views: { type: Number, default: 0 },
    accessLevel: {
        type: String,
        enum: ["free", "basic", "advanced", "premium"],
        default: "free",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
    },{ timestamps: true }
);

export default mongoose.model("Lesson", lessonSchema);
