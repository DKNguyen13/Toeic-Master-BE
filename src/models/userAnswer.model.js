import mongoose from 'mongoose';

const userAnswerSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserTestSession',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },

    questions: [
        {
            questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
            questionNumber: Number,
            selectedAnswer: { type: String, enum: ['A', 'B', 'C', 'D', null], default: null },
            isCorrect: { type: Boolean, default: false },
            timeSpent: { type: Number, default: 0 },
            isSkipped: { type: Boolean, default: false },
            isFlagged: { type: Boolean, default: false },
        }
    ],
}, {
    timestamps: true
});

// Indexes
userAnswerSchema.index({ sessionId: 1, questionNumber: 1 });
userAnswerSchema.index({ userId: 1, questionId: 1 });

export default mongoose.model('UserAnswer', userAnswerSchema);