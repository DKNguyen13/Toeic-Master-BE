import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  set: { type: mongoose.Schema.Types.ObjectId, ref: 'FlashcardSet', required: true },
  word: { type: String, required: true, maxlength: 100 },
  meaning: { type: String, required: true, maxlength: 100 },
  example: { type: String, maxlength: 200 },
  note: { type: String, maxlength: 200 },
}, { timestamps: true });

export default mongoose.model('Flashcard', flashcardSchema);