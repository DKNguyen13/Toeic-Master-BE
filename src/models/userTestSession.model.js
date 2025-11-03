import mongoose from 'mongoose';

const userTestSessionSchema = new mongoose.Schema({
    sessionCode: {
        type: String,
        unique: true,
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
    sessionType: {
        type: String,
        enum: ['practice', 'full-test'],
        required: true
    },
    testConfig: {
        selectedParts: [{
            type: Number,
            min: 1,
            max: 7
        }],
        timeLimit: {
            type: Number,
            required: true
        },
        shuffleQuestions: {
            type: Boolean,
            default: false
        },
        allowReview: {
            type: Boolean,
            default: true
        }
    },
    status: {
        type: String,
        enum: ['started', 'in-progress', 'paused', 'completed', 'abandoned', 'timeout'],
        default: 'started'
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    pausedAt: Date,
    completedAt: Date,
    submittedAt: Date,
    expiredAt: Date,
    timeSpent: {
        type: Number,
        default: 0
    },
    progress: {
        currentPartNumber: Number,
        currentQuestionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        },
        totalQuestions: {
            type: Number,
            required: true
        },
        answeredCount: {
            type: Number,
            default: 0
        },
        completionPercentage: {
            type: Number,
            default: 0
        }
    },
    results: {
        totalQuestions: Number,
        answeredCount: Number,
        correctCount: Number,
        incorrectCount: Number,
        skippedCount: Number,
        accuracy: Number,
        listeningScore: Number,
        readingScore: Number,
        totalScore: Number,
        partResults: [{
            partNumber: Number,
            totalQuestions: Number,
            correctCount: Number,
            accuracy: Number,
            timeSpent: Number
        }]
    }
}, {
    timestamps: true
});

// Indexes
userTestSessionSchema.index({ userId: 1, createdAt: -1 });
userTestSessionSchema.index({ sessionCode: 1 }, { unique: true });
userTestSessionSchema.index({ status: 1, createdAt: -1 });

// Generate session code
userTestSessionSchema.pre('validate', function (next) {
    if (this.isNew) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.sessionCode = `S-${date}-${random}`;

        // Set expiration time
        this.expiredAt = new Date(this.startedAt.getTime() + (this.testConfig.timeLimit * 60 * 1000));
    }
    next();
});

export default mongoose.model('UserTestSession', userTestSessionSchema);