import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullname: { type: String, required: true },
    phone: { type: String, match: [/^\d{10,11}$/, 'phone number just 10 num'], required: true, unique: true },
    dob: { type: Date },
    avatarUrl: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },
    vip: {
        isActive: { type: Boolean, default: false },
        endDate: { type: Date, default: null },
        type: { type: String, enum: ['basic','pro','premium'], default: null }
    }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
