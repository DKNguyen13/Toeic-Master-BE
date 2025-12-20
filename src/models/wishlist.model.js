import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
});
wishlistSchema.index({ user: 1, lesson: 1 }, { unique: true });

export default mongoose.model('Wishlist', wishlistSchema);