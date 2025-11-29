import mongoose from 'mongoose';

const paymentOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'VipPackage', required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  pricePaid: { type: Number },
  status: { type: String, enum: ['pending','success','fail'], default: 'pending' },
  isActive: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('PaymentOrder', paymentOrderSchema);