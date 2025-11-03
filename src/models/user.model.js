import mongoose from 'mongoose';
import { meiliClient } from '../config/meilisearch.config.js';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: function () { return this.authType === 'normal'; }
  },
  fullname: { type: String, required: true },
  phone: {
    type: String,
    match: [/^\d{10,11}$/, 'phone number just 10 num'],
    required: function () { return this.authType === 'normal'; },
    unique: true,
    sparse: true
  },
  dob: { type: Date },
  avatarUrl: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  authType: { type: String, enum: ['normal', 'google'], default: 'normal' },
  isActive: { type: Boolean, default: true },
  vip: {
    isActive: { type: Boolean, default: false },
    endDate: { type: Date, default: null },
    type: { type: String, enum: ['basic', 'advanced', 'premium'], default: null }
  },

  statistics: {
    totalTests: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
  }
}, { timestamps: true });

userSchema.post("save", async function (doc) {
  try {
    if (!doc || doc.role === "admin") return;
    const index = meiliClient.index("users");
    await index.addDocuments([{
      id: doc._id.toString(),
      fullname: doc.fullname,
      email: doc.email,
      phone: doc.phone,
      role: doc.role,
      isActive: doc.isActive,
      authType: doc.authType
    }]);
    console.log("[Meili] Added:", doc.fullname);
  } catch (err) {
    console.error("[Meili] Add error:", err.message);
  }
});

userSchema.post("findOneAndUpdate", async function (doc) {
  if (!doc || doc.role === "admin") return;
  try {
    const index = meiliClient.index("users");
    await index.updateDocuments([{
      id: doc._id.toString(),
      fullname: doc.fullname,
      email: doc.email,
      phone: doc.phone,
      role: doc.role,
      isActive: doc.isActive,
      authType: doc.authType
    }]);
    console.log("[Meili] Updated:", doc.fullname);
  } catch (err) {
    console.error("[Meili] Update error:", err.message);
  }
});

userSchema.post("findOneAndDelete", async function (doc) {
  if (!doc || doc.role === "admin") return;
  try {
    const index = meiliClient.index("users");
    await index.deleteDocument(doc._id.toString());
    console.log("[Meili] Deleted:", doc.fullname);
  } catch (err) {
    console.error("[Meili] Delete error:", err.message);
  }
});

userSchema.methods.updateStatistics = async function (results) {
  try {
    const score = results.totalScore || 0;
    this.totalTests = (this.totalTests || 0) + 1;
    this.avgScore = Math.round(((this.avgScore || 0) * (this.totalTests - 1) + score) / this.totalTests);

    if (score > (this.bestScore || 0)) {
      this.bestScore = score;
    }

    await this.save();
    console.log('? [User] Updated statistics for user:', this.email);
  } catch (err) {
    console.error('? [User] Error updating statistics:', err);
  }
}; export default mongoose.model('User', userSchema);
