import mongoose from 'mongoose';
import slug from "mongoose-slug-updater";

// Add plugin
mongoose.plugin(slug);

const { Schema } = mongoose;

const questionSchema = new mongoose.Schema({
    testId: {
        type: Schema.Types.ObjectId,
        ref: "Test",
        required: true
    },
    partId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Part',
        required: true
    },
    title: { type: String, trim: true, },
    partNumber: { type: Number, min: 1, max: 7, required: true },
    questionNumber: {
        type: Number,
        required: true
    },
    globalQuestionNumber: {
        type: Number,
        required: true
    },
    group: {
        groupId: { type: String, index: true },
        text: { type: String, trim: true, default: "" },
        audio: { type: String, trim: true, default: "" },
        image: { type: String, trim: true, default: "" },
    },

    question: { type: String,  trim: true, default: "" },
    choices: [{
        label: {
            type: String,
            required: true,
            enum: ['A', 'B', 'C', 'D']
        },
        text: {
            type: String,
            required: true,
            trim: true
        },
        isCorrect: {
            type: Boolean,
            required: true
        }
    }],
    correctAnswer: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C', 'D']
    },
    explanation: { type: String, trim: true, default: "" },

}, {
    timestamps: true
})

// Indexes
questionSchema.index({ testId: 1, partNumber: 1, questionNumber: 1 }, { unique: false });
questionSchema.index({ partId: 1, questionNumber: 1 });

export default mongoose.model('Question', questionSchema);