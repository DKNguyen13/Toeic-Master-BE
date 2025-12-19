import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, minlength: 10, maxlength: 40, required: true, unique: true },
  password: {
    type: String,
    minlength: 6, maxlength: 300,
    required: function () { return this.authType === 'normal'; }
  },
  fullname: { type: String, maxlength: 30, required: true },
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
};

userSchema.methods.checkVipStatus = async function () {
  try {
    if (this.vip.isActive && this.vip.endDate && new Date(this.vip.endDate) < new Date()) {
      this.vip.isActive = false;
      this.vip.type = null;
      this.vip.endDate = null;
      await this.save();
      console.log("[User] VIP gói đã hết hạn, cập nhật trạng thái.");
    }
  } catch (err) {
    console.error("[User] Lỗi khi kiểm tra gói VIP:", err);
  }
};

export default mongoose.model('User', userSchema);