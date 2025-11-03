import mongoose from 'mongoose';

const scoreMappingSchema = new mongoose.Schema(
    {
        section: {
            type: String,
            enum: ['listening', 'reading'],
            required: true,
        },
        correctAnswers: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        scaledScore: {
            type: Number,
            required: true,
            min: 5,
            max: 495,
        },
        version: {
            type: String,
            required: true,
        },
        source: {
            type: String,
            enum: ['ETS', 'Custom', 'Statistical'],
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        effectiveFrom: {
            type: Date,
            required: true,
        },
        effectiveTo: {
            type: Date,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
scoreMappingSchema.index({ section: 1, correctAnswers: 1, isActive: 1 });
scoreMappingSchema.index({ version: 1, isActive: 1 });

export default mongoose.model('ScoreMapping', scoreMappingSchema);