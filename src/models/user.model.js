import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { 
    type: String, 
    required: function() { return this.authType === 'normal'; } 
  },
  fullName: { type: String, required: true },
  phone: { 
    type: String, 
    match: [/^\d{10,11}$/, 'phone number just 10 num'], 
    required: function() { return this.authType === 'normal'; },
    unique: true 
  },
  dob: { type: Date },
  avatarUrl: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  authType: { type: String, enum: ['normal', 'google'], default: 'normal' },
  isActive: { type: Boolean, default: true },
  vip: {
    isActive: { type: Boolean, default: false },
    endDate: { type: Date, default: null },
    type: { type: String, enum: ['basic','pro','premium'], default: null }
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
