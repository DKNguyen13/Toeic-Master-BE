import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  set: { type: mongoose.Schema.Types.ObjectId, ref: 'FlashcardSet', required: true },
  word: { type: String, required: true },
  meaning: { type: String, required: true },
  example: { type: String },
  note: { type: String },
}, { timestamps: true });

export default mongoose.model('Flashcard', flashcardSchema);