import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    noOfLikes: {
        type: Number,
        default: 0
    },
    likes: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
    noOfChildren: {
        type: Number,
        default: 0
    },
    children: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Comment',
        default: []
    },
    isParent: {
        type: Boolean,
        default: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    }
}, {
    timestamps: true
});

commentSchema.pre("deleteOne", async function() {
    const commentId = this.getQuery()._id;
    // Xóa tất cả comment con
    if (this.getQuery().isParent){
        await mongoose.model('Comment').deleteMany({ parent: commentId });
    }
    else{
        await mongoose.model('Comment').findByIdAndUpdate(this.getQuery().parent, {$inc: { noOfChildren: -1}, $pull : { children: commentId }});
    }
});

commentSchema.post("save", async function(doc) {
    if (!doc.isParent){
        await mongoose.model('Comment').findByIdAndUpdate(doc.parent, {
            $inc: { noOfChildren: 1 },
            $push: { children: doc._id }
        });
    }
    const testId = doc.exam;
    const totalComments = await mongoose.model('Comment').countDocuments({ exam: testId });
    await mongoose.model('Test').findByIdAndUpdate(testId, {
        'statistics.totalComments': totalComments
    });
})
export default mongoose.model('Comment', commentSchema);
