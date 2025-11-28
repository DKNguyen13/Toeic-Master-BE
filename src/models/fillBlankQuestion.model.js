import mongoose from "mongoose";
const { Schema } = mongoose;

const BlankSchema = new Schema({
  position: { type: Number, required: true },
  answer: { type: String, required: true }
});

const ListeningQuestionSchema = new Schema({
  sentence: { type: String, required: true },
  blanks: { type: [BlankSchema], required: true },
  createdAt: { type: Date, default: Date.now }
});

const ListeningQuestion = mongoose.model(
  "ListeningQuestion",
  ListeningQuestionSchema
);

export default ListeningQuestion;
