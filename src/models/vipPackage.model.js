import mongoose from 'mongoose';

const vipPackageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    durationMonths: { type: Number, required: true },  // 1, 6, 12
    originalPrice: { type: Number, required: true },
    discountedPrice: { type: Number, required: true },
    description: { type: String },
    type: { type: String, enum: ['basic','advanced','premium'], required: true }
}, { timestamps: true });

export default mongoose.model('VipPackage', vipPackageSchema);
