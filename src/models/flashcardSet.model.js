import mongoose from "mongoose";

const flashcardSetSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    count: { type: Number, default: 0 },
    description: { type: String },
}, { timestamps: true });

export default mongoose.model('FlashcardSet', flashcardSetSchema);