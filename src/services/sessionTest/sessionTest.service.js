import UserTestSession from "../../models/userTestSession.model.js";
import User from "../../models/user.model.js";
import Test from "../../models/test.model.js";
import Question from "../../models/question.model.js";
import UserAnswer from "../../models/userAnswer.model.js";
import { calculateSessionResults } from "../score.service.js";

import {
    SESSION_TYPE,
    ACTIVE_SESSION_STATUSES,
    TOEIC_PARTS
} from '../../constants/sessionTest.constants.js';

export const startTestSession = async (userId, { testId, sessionType, selectedParts, timeLimit }) => {
    // Validate test exists
    const test = await Test.findById(testId);
    if (!test || !test.isActive) {
        throw new Error('Đề thi không tồn tại hoặc đã bị xóa');
    }

    await checkActiveSessionTest(userId, testId);

    // Get selected part 
    const selectedPart = getSelectedPart(sessionType, selectedParts)

    // validate test has questions
    const totalQuestions = await getQuestionCount(testId, selectedPart);

    if (totalQuestions === 0) {
        return Error('Đề thi hiện tại chưa cập nhật câu hỏi, vui lòng chọn đề thi khác để luyện tập');
    }

    // Create session
    const session = new UserTestSession({
        userId,
        testId,
        sessionType,
        testConfig: {
            selectedParts: selectedPart,
            timeLimit: timeLimit || 0,
            allowReview: true
        },
        progress: {
            totalQuestions,
            answeredCount: 0,
            completionPercentage: 0
        }
    });
    if (timeLimit > 0) {
        session.timeRemaining = new Date(session.startedAt.getTime() + timeLimit * 60 * 1000);
    }
    await session.save();

    await UserAnswer.create({
        sessionId: session._id,
        userId,
        testId,
        questions: []
    });

    // Update test statistics
    await Test.findByIdAndUpdate(testId, {
        $inc: { 'statistics.totalAttempts': 1 }
    });

    return session._id;
};

export const getTestSession = async (sessionId, userId) => {
    const session = await getSessionInfo(sessionId, userId);

    let questions = await Question.find({
        testId: session.testId,
        partNumber: { $in: session.testConfig.selectedParts }
    })
        .sort({ globalQuestionNumber: 1 })
        .select('question group choices questionNumber globalQuestionNumber partNumber');

    // Get exists answers from UserAnswer
    const userAnswer = await UserAnswer.findOne({
        sessionId,
        userId
    }).select('questionId selectedAnswer timeSpent isSkipped isFlagged');

    // Map answers to questions
    const answerMap = {};
    if (userAnswer && userAnswer.questions) {
        userAnswer.questions.forEach(answer => {
            answerMap[answer.questionId.toString()] = {
                selectedAnswer: answer.selectedAnswer,
                timeSpent: answer.timeSpent,
                isSkipped: answer.isSkipped,
                isFlagged: answer.isFlagged
            };
        });
    }

    // Merge questions with user answers
    const questionsWithAnswers = questions.map(q => ({
        id: q._id,
        question: q.question,
        choices: q.choices,
        group: q.group,
        questionNumber: q.questionNumber,
        globalQuestionNumber: q.globalQuestionNumber,
        partNumber: q.partNumber,
        userAnswer: answerMap[q._id.toString()] || null
    }));

    // Chọn những field cần thiết cho FE
    const sessionResponse = {
        id: session._id,
        sessionCode: session.sessionCode,
        sessionType: session.sessionType,
        testConfig: {
            selectedParts: session.testConfig.selectedParts,
            timeLimit: session.testConfig.timeLimit
        },
        progress: session.progress,
        timeRemaining: calculateTimeRemaining(session)
    };

    return {
        session: sessionResponse,
        questions: questionsWithAnswers
    };
};

export const submitBulkAnswers = async (sessionId, userId, answers) => {
    const session = await UserTestSession.findOne({
        _id: sessionId,
        userId,
        status: { $in: ACTIVE_SESSION_STATUSES }
    });

    if (!session) {
        throw new Error('Không tìm thấy phiên làm bài');
    }

    const questionIds = answers.map(a => a.questionId);
    const questions = await Question.find({
        _id: { $in: questionIds }
    });

    const questionMap = {};
    questions.forEach(q => {
        questionMap[q._id.toString()] = q;
    });

    // Get UserAnswer document
    const userAnswer = await UserAnswer.findOne({
        sessionId,
        userId
    });

    // Process all answers
    const processedAnswers = [];

    for (const answer of answers) {
        const question = questionMap[answer.questionId];
        if (!question) continue;

        const isCorrect = answer.selectedAnswer === question.correctAnswer;
        const isSkipped = answer.selectedAnswer === null || answer.selectedAnswer === undefined;

        const existingAnswerIndex = userAnswer.questions.findIndex(
            q => q.questionId.toString() === answer.questionId
        );

        const answerData = {
            questionId: answer.questionId,
            questionNumber: question.questionNumber,            // per-part index
            globalQuestionNumber: question.globalQuestionNumber, // global index (important)
            partNumber: question.partNumber,
            selectedAnswer: answer.selectedAnswer || null,
            isCorrect,
            timeSpent: answer.timeSpent || 0,
            isSkipped,
            isFlagged: answer.isFlagged || false
        };

        if (existingAnswerIndex !== -1) {
            // Update existing answer
            userAnswer.questions[existingAnswerIndex] = {
                ...userAnswer.questions[existingAnswerIndex],
                ...answerData,
                timeSpent: (userAnswer.questions[existingAnswerIndex].timeSpent || 0) + (answer.timeSpent || 0)
            };
        } else {
            // Add new answer
            userAnswer.questions.push(answerData);
        }

        processedAnswers.push({
            questionId: answer.questionId,
            isCorrect,
            isSkipped
        });
    }

    await userAnswer.save();

    // Update session progress
    const answeredCount = userAnswer.questions.filter(q => !q.isSkipped).length;
    await UserTestSession.findByIdAndUpdate(sessionId, {
        'progress.answeredCount': answeredCount,
        'progress.completionPercentage': Math.round((answeredCount / session.progress.totalQuestions) * 100),
        status: 'in-progress'
    });

};

export const submitTestSession = async (sessionId, userId) => {
    const session = await UserTestSession.findOne({
        _id: sessionId,
        userId,
        status: { $in: ACTIVE_SESSION_STATUSES }
    });

    if (!session) {
        throw new Error('Không tìm thấy phiên làm bài');
    }

    // Get all questions of test session
    const questions = await Question.find({
        testId: session.testId,
        partNumber: { $in: session.testConfig.selectedParts }
    })
        .sort({ partNumber: 1, questionNumber: 1 })
        .select('content choices questionNumber globalQuestionNumber partNumber');

    // Get user answer
    const userAnswer = await UserAnswer.findOne({ sessionId, userId });
    const answeredIds = new Set(userAnswer.questions.map(q => q.questionId.toString()));

    // Add question not ans
    for (const question of questions) {
        if (!answeredIds.has(question._id.toString())) {
            userAnswer.questions.push({
                questionId: question._id,
                questionNumber: question.globalQuestionNumber,
                globalQuestionNumber: question.globalQuestionNumber,
                partNumber: question.partNumber,
                selectedAnswer: null,
                isSkipped: true,
                isCorrect: false,
                timeSpent: 0,
                isFlagged: false
            });
        }
    }
    await userAnswer.save();

    const results = await calculateSessionResults(sessionId, userId);

    // Update session
    await session.completeTestSession(results);

    // Update test statistics
    await Test.findByIdAndUpdate(session.testId, {
        $inc: { 'statistics.completedAttempts': 1 }
    });

    // Update user statistics
    const user = await User.findById(userId);
    if (results.totalScore) {
        await user.updateStatistics(results);
    }
};

const checkActiveSessionTest = async (userId, testId) => {
    const activeSession = await UserTestSession.findOne({
        userId,
        testId,
        status: { $in: ACTIVE_SESSION_STATUSES }
    });

    if (activeSession) {
        throw new Error('Bạn đang làm bài của đề thi này, Vui lòng truy cập trang lịch sử làm bài và tiếp tục.');
    }
};

const getSelectedPart = (sessionType, selectedParts) => {
    return sessionType === SESSION_TYPE.FULL_TEST ? TOEIC_PARTS.ALL : selectedParts;
};

const getQuestionCount = async (testId, parts) => {
    return await Question.countDocuments({
        testId,
        partNumber: { $in: parts }
    });
};

const getSessionInfo = async (sessionId, userId) => {
    const session = await UserTestSession.findOne({
        _id: sessionId,
        userId,
        status: { $in: ACTIVE_SESSION_STATUSES }
    }).populate('testId', 'title slug testCode audio');

    if (!session) {
        throw new Error('Active session not found');
    }

    return session;
};

const calculateTimeRemaining = (session) => {
    const timeLimit = session.testConfig.timeLimit; // phút
    if (!timeLimit || timeLimit <= 0) {
        return null; // không giới hạn
    }

    const timeLimitMs = timeLimit * 60 * 1000;
    const timeSpent = Date.now() - session.startedAt.getTime(); // ms đã dùng
    return Math.max(0, timeLimitMs - timeSpent);
};