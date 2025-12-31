import mongoose from "mongoose";

const flashcardSetSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, maxlength: 25 },
    count: { type: Number, default: 0 },
    description: { type: String, maxlength: 25 },
}, { timestamps: true });

export default mongoose.model('FlashcardSet', flashcardSetSchema);