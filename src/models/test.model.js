import mongoose from 'mongoose';
import slug from "mongoose-slug-updater";

// Add plugin
mongoose.plugin(slug);

const { Schema } = mongoose;

const testSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, slug: 'title', required: false, unique: true, lowercase: true, trim: true },
  audio: { type: String, required: true, trim: true },
  testCode: { type: String, required: true, unique: true, trim: true },
  description: { type: String },

  isActive: { type: Boolean, required: true, default: true },
  isPremium: { type: Boolean, required: true, default: false },
  isFeatured: { type: Boolean, required: true, default: false },
  isOfficial: { type: Boolean, required: true, default: false },

  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

  publishedAt: { type: Date },

  // Cấu hình mặc định
  defaultConfig: {
    timeLimit: { type: Number, required: true, default: 120 },
    parts: { type: [Number], required: true, default: [1, 2, 3, 4, 5, 6, 7] },
    shuffleQuestions: { type: Boolean, required: true, default: false },
    showResult: { type: Boolean, required: true, default: true },
    allowReview: { type: Boolean, required: true, default: true },
    passingScore: { type: Number, default: 600 },
    maxAttempts: { type: Number, default: null }, // null = unlimited
  },

  // Thống kê
  statistics: {
    totalAttempts: { type: Number, default: 0 },
    totalComments: {type: Number, default: 0},
    completedAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 },
    averageCompletionTime: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    popularity: { type: Number, default: 0 },
    difficulty: { type: Number, min: 1, max: 10 },
    rating: { type: Number, min: 1, max: 5 },
    ratingCount: { type: Number, default: 0 },
  },

  // Metadata
  metadata: {
    source: {
      type: String,
      required: true,
      enum: ["ETS", "Custom", "Imported", "Community"],
      default: "Custom"
    },
    version: { type: String },
    difficulty: { type: Number, min: 1, max: 10 },
    estimatedTime: { type: Number },
    passRate: { type: Number },
    lastModified: { type: Date, default: Date.now },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    instructions: { type: String },
    notes: { type: String },
  },
},
  { timestamps: true });

export default mongoose.model('Test', testSchema);