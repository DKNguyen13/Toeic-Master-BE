import mongoose from 'mongoose';
import slug from "mongoose-slug-updater";

// Add plugin
mongoose.plugin(slug);

const { Schema } = mongoose;

const partSchema = new mongoose.Schema({
  testId: { type: Schema.Types.ObjectId, ref: "Test", required: true },
  title: { type: String, trim: true },
  partNumber: { type: Number, min: 1, max: 7, required: true },
  category: {
    type: String,
    enum: ['Listening', 'Reading'],
    required: true
  },
  tags: [{ type: String, trim: true }],
  description: { type: String },
  instructions: { type: String },
  audioFile: { type: String }, // url audio
  totalQuestions: { type: Number, required: true },
  config: {
    hasAudio: { type: Boolean, default: false },
    allowReplay: { type: Boolean, default: true },
    showQuestionNumber: { type: Boolean, default: true },
    allowBack: { type: Boolean, default: true },
  },

}, {
  timestamps: true
});

partSchema.pre('save', function (next) {
  if (!this.title || this.isModified('partNumber')) {
    this.title = `Part ${this.partNumber}`;
  }
  next();
});

// Indexes
partSchema.index({ testId: 1, partNumber: 1 });

export default mongoose.model('Part', partSchema);
