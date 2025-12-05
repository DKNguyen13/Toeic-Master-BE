import mongoose from "mongoose";

const BlankSchema = new mongoose.Schema({
  position: Number,
  answer: String
}, { _id: false });

const ListeningQuestionSchema = new mongoose.Schema({
  sentence: String,
  blanks: [BlankSchema]
}, { timestamps: true });

ListeningQuestionSchema.index({ "blanks.answer": 1 });
ListeningQuestionSchema.index({ sentence: "text" });

export default mongoose.model("ListeningQuestion", ListeningQuestionSchema);