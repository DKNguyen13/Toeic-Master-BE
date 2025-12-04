import UserTestSession from "../../models/userTestSession.model.js";
import User from "../../models/user.model.js";
import Test from "../../models/test.model.js";
import Question from "../../models/question.model.js";
import UserAnswer from "../../models/userAnswer.model.js";
import { calculateSessionResults } from "../score.service.js";

import {
    SESSION_TYPE,
    ACTIVE_SESSION_STATUSES,
    TOEIC_PARTS,
    SESSION_STATUS
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
            completionPercentage: 0,
            timeRemaining: timeLimit > 0 ? timeLimit * 60 : null, // convert to seconds
            totalPauseDuration: 0
        },
        status: SESSION_STATUS.STARTED
    });

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
        .select('question group choices.label choices.text questionNumber globalQuestionNumber partNumber');

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

    const timeRemaining = calculateTimeRemaining({
        timeLimitMinutes: session.testConfig.timeLimit,
        startedAt: session.startedAt,
        resumedAt: session.resumedAt,
        status: session.status,
        previousTimeRemainingMinutes: session.progress.timeRemaining, // nếu PAUSED mới dùng
        timeSpentSeconds: session.timeSpent
    });
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
        timeRemaining: timeRemaining,
        status: session.status
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

    const now = new Date();

    // Calculate final timeSpent correctly
    const lastActiveTime = session.startedAt || session.resumedAt;
    const finalActiveTime = Math.floor((now - lastActiveTime) / 1000);
    session.timeSpent = (session.timeSpent || 0) + finalActiveTime;

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
    await session.completeTestSession(results, now);

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

export const getTestSessionResult = async (sessionId, userId) => {
    const session = await UserTestSession.findOne({
        _id: sessionId,
        userId,
        status: 'completed'
    }).populate('testId', 'title slug testCode');

    if (!session) {
        return error(res, 'Không tìm thấy bài làm');
    }

    const questions = await Question.find({
        testId: session.testId,
        partNumber: { $in: session.testConfig.selectedParts }
    })
        .sort({ globalQuestionNumber: 1 })
        .select('question group choices questionNumber globalQuestionNumber partNumber correctAnswer explanation');
    // Get user answers with populated question details
    const userAnswer = await UserAnswer.findOne({
        sessionId,
        userId
    }).select('questions.questionId questions.selectedAnswer questions.timeSpent questions.isSkipped questions.isFlagged');

    // Map answers theo questionId
    const answerMap = {};
    if (userAnswer?.questions) {
        userAnswer.questions.forEach((ans) => {
            answerMap[ans.questionId.toString()] = {
                selectedAnswer: ans.selectedAnswer,
                timeSpent: ans.timeSpent,
                isSkipped: ans.isSkipped,
                isFlagged: ans.isFlagged,
            };
        });
    }

    // Merge question info + userAnswer
    const questionsWithAnswers = questions.map((q) => ({
        id: q._id,
        question: q.question,
        choices: q.choices,
        group: q.group,
        questionNumber: q.questionNumber,
        globalQuestionNumber: q.globalQuestionNumber,
        partNumber: q.partNumber,
        correctAnswer: q.correctAnswer,     // thêm để hiển thị đáp án
        explanation: q.explanation,         // thêm để hiển thị giải thích
        userAnswer: answerMap[q._id.toString()] || null
    }));

    // Chuẩn bị response
    const sessionResponse = {
        id: session._id,
        sessionCode: session.sessionCode,
        sessionType: session.sessionType,
        test: session.testId,
        completedAt: session.completedAt,
        timeSpent: session.timeSpent,
        results: session.results,
        selectedParts: session.testConfig.selectedParts
    };

    return {
        session: sessionResponse,
        answers: questionsWithAnswers
    };
};


// Pause session
export const pauseTestSession = async (sessionId, userId) => {
    const session = await UserTestSession.findOne({
        _id: sessionId,
        userId,
        status: { $in: [SESSION_STATUS.STARTED, SESSION_STATUS.IN_PROGRESS] }
    });

    if (!session) {
        throw new Error('Không tìm thấy phiên làm bài hợp lệ');
    }

    const now = new Date();

    // check session expired (7 days)
    if (now > session.expiredAt) {
        session.status = SESSION_STATUS.TIMEOUT;
        session.completedAt = now;
        await session.save();
        throw new Error('Phiên thi đã hết hạn');
    }

    // calculate active time in this session
    const lastActiveTime = session.resumedAt || session.startedAt;
    const activeTimeThisSession = Math.floor((now - lastActiveTime) / 1000);

    // update total timeSpent
    session.timeSpent = (session.timeSpent || 0) + activeTimeThisSession;

    // calc timeRemaining if has time limit
    const timeLimit = session.testConfig.timeLimit
    let timeRemaining = null;
    if (timeLimit > 0) {
        const timeLimitSeconds = timeLimit * 60;
        timeRemaining = Math.max(0, timeLimitSeconds - session.timeSpent);

        if (timeRemaining <= 0) {
            session.status = SESSION_STATUS.TIMEOUT;
            session.completedAt = now;
            session.progress.timeRemaining = 0;
            await session.save();
            throw new Error('Hết thời gian làm bài');
        }

        session.progress.timeRemaining = timeRemaining;
    }
    else {
        session.progress.timeRemaining = timeRemaining;
    }

    // update session
    session.status = SESSION_STATUS.PAUSED;
    session.pausedAt = now;

    await session.save();
};

export const resumeTestSession = async (sessionId, userId) => {
    const session = await UserTestSession.findOne({
        _id: sessionId,
        userId,
        status: SESSION_STATUS.PAUSED
    });

    if (!session) {
        throw new Error('Không tìm thấy phiên làm bài hợp lệ');
    }

    const now = new Date();

    // check session expired (7 days)
    if (now > session.expiredAt) {
        session.status = SESSION_STATUS.TIMEOUT;
        session.completedAt = now;
        await session.save();
        throw new Error('Phiên thi đã hết hạn');
    }

    const timeLimit = session.testConfig.timeLimit;
    const timeRemaining = session.progress.timeRemaining;

    // if has time limit
    if (timeLimit && timeLimit > 0) {
        if (timeRemaining === null || timeRemaining === undefined) {
            throw new Error('Không tìm thấy thông tin thời gian còn lại');
        }

        // check timeRemaining
        if (timeRemaining <= 0) {
            session.status = SESSION_STATUS.TIMEOUT;
            session.completedAt = now;
            await session.save();
            throw new Error('Hết thời gian làm bài');
        }
    }

    // calc total pause duration
    if(session.pausedAt) {
        const pauseDuration = Math.floor((now - session.pausedAt) / 1000);
        session.progress.totalPauseDuration = (session.progress.totalPauseDuration || 0) + pauseDuration;
    }

    // resume session
    session.status = SESSION_STATUS.IN_PROGRESS;
    session.resumedAt = now;

    await session.save();

};

// Helper function
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

const calculateTimeRemaining = ({
    timeLimitMinutes,
    startedAt,
    resumedAt = null,
    status,
    previousTimeRemainingMinutes = 0,
    timeSpentSeconds = 0
}) => {
    // Không giới hạn thời gian
    if (!timeLimitMinutes || timeLimitMinutes <= 0) {
        return null;
    }

    // Nếu đang PAUSED → lấy giá trị đã lưu (phút → giây)
    if (status === SESSION_STATUS.PAUSED) {
        return Math.max(0, previousTimeRemainingMinutes * 60);
    }

    // Tính cho session đang active
    const timeLimitSeconds = timeLimitMinutes * 60;
    const lastActiveTime = resumedAt || startedAt;
    const currentActiveSeconds = Math.floor((Date.now() - lastActiveTime.getTime()) / 1000);
    const totalTimeSpent = timeSpentSeconds + currentActiveSeconds;

    return Math.max(0, timeLimitSeconds - totalTimeSpent);
};