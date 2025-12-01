import { success, error } from '../utils/response.js';

import UserTestSession from "../models/userTestSession.model.js";
import * as sessionTestService from "../services/sessionTest/sessionTest.service.js";

// [POST] /api/session/start
export const startSession = async (req, res) => {
    try {
        const { testId, sessionType, selectedParts, timeLimit } = req.body;
        const userId = req.user.id; // duoc gan them tu middeware

        const session = await sessionTestService.startTestSession(userId, { testId, sessionType, selectedParts, timeLimit });
        return success(res, 'Tạo phiên thi thành công', {
            id: session
        });
    } catch (err) {
        return error(res, 'Error starting session', 500, err.message);
    }
};

// [GET] /api/session/:sessionId
export const getTestSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const result = await sessionTestService.getTestSession(sessionId, userId);

        return success(res, 'Lấy thành công thông tin phiên thi', { result });
    } catch (err) {
        return error(res, 'Lấy thông tin phiên thi thất bại');
    }
};

// [POST] /api/session/:sessionId/answers/bulk --Submit multiple answers at once
export const submitBulkAnswers = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { answers } = req.body; // Array of { questionId, selectedAnswer, timeSpent, isFlagged }

        const userId = req.user.id;

        if (!Array.isArray(answers) || answers.length === 0) {
            return error(res, 'Answers array is required and must not be empty');
        }

        await sessionTestService.submitBulkAnswers(sessionId, userId, answers);
        return success(res, 'Nộp câu hỏi trong phiên thi thành công');

    } catch (err) {
        console.log('Lỗi khi nộp bài', err);
        return error(res, `Lỗi nộp bài: ${err.message}`, 500);
    }
};

// [POST] /api/session/:sessionId/submit
export const submitSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        await sessionTestService.submitTestSession(sessionId, userId);
        return success(res, 'Nộp bài thành công');
    } catch (err) {

        return error(res, 'Error submitting session', 500, err.message);
    }
};
// [PUT] /api/session/:sessionId/pause
export const pauseSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const session = await UserTestSession.findOneAndUpdate(
            {
                _id: sessionId,
                userId,
                status: { $in: ['started', 'in-progress'] }
            },
            {
                status: 'paused',
                pausedAt: new Date()
            },
            { new: true }
        );

        if (!session) {
            return error(res, 'Không tìm thấy phiên làm bài');
        }

        res.status(200).json({
            status: 'success',
            message: 'Session paused successfully',
            data: { sessionId, status: 'paused' }
        });
    } catch (err) {
        return error(res, 'Lỗi xảy ra khi tạm dừng phiên làm bài', 500, err.message);
    }
};

// [PUT] /api/session/:sessionId/resume
export const resumeSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const session = await UserTestSession.findOne({
            _id: sessionId,
            userId,
            status: 'paused'
        });

        if (!session) {
            return error(res, 'Paused session not found');
        }

        // Check if session expired
        if (new Date() > session.expiredAt) {
            session.status = 'timeout';
            session.completedAt = new Date();
            await session.save();

            return error(res, 'Session has expired');
        }

        session.status = 'in-progress';
        session.resumedAt = new Date();
        await session.save();


        return success(
            res,
            'Session resumed successfully',
            {
                sessionId,
                status: 'in-progress'
            }
        );
    } catch (err) {
        return error(res, 'Error resuming session');
    }
};

// [GET] /api/session/:sessionId/results
export const getSessionResults = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const data = await sessionTestService.getTestSessionResult(sessionId, userId);

        return success(res, 'Lấy dữ liệu kết quả bài thi thành công', { data });

    } catch (err) {
        console.log(err);
        return error(res, `Lỗi khi lấy dữ liệu kết quả bài thi: ${err.message}`, 500);
    }
};


// [GET] /api/session/user -- Get user session history
export const getUserSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, status, testId } = req.query;

        const filter = { userId };
        if (status) {
            filter.status = status; // status TOEIC test
        }
        if (testId) {
            filter.testId = testId;
        }

        const sessions = await UserTestSession.find(filter)
            .populate('testId', 'title slug testCode')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('sessionCode progress sessionType status createdAt completedAt results.totalScore results.totalQuestions results.accuracy');

        const total = await UserTestSession.countDocuments(filter);

        return success(
            res,
            'Get user history session',
            {
                sessions,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        );

    } catch (err) {
        return error(res, 'Error fetching user sessions', 500, err.message);
    }
};

// [GET] /api/session/user/statistics -- Get user average scores statistics
export const getUserStatistics = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(userId)
        const completedSessions = await UserTestSession.find({
            userId,
            status: 'completed',
            sessionType: 'full-test',
            'results.listeningScore': { $exists: true, $gt: 0 },
            'results.readingScore': { $exists: true, $gt: 0 }
        }).select('results.listeningScore results.readingScore results.totalScore createdAt');

        if (completedSessions.length === 0) {
            return success(
                res,
                'No completed full-test sessions found',
                {
                    totalSessions: 0,
                    averageListeningScore: 0,
                    averageReadingScore: 0,
                    averageTotalScore: 0
                }
            );
        }

        const totalListening = completedSessions.reduce((sum, session) => sum + (session.results.listeningScore || 0), 0);
        const totalReading = completedSessions.reduce((sum, session) => sum + (session.results.readingScore || 0), 0);
        const totalScore = completedSessions.reduce((sum, session) => sum + (session.results.totalScore || 0), 0);

        const averageListeningScore = Math.round(totalListening / completedSessions.length);
        const averageReadingScore = Math.round(totalReading / completedSessions.length);
        const averageTotalScore = Math.round(totalScore / completedSessions.length);

        return success(
            res,
            'Get user statistics successfully',
            {
                totalSessions: completedSessions.length,
                averageListeningScore,
                averageReadingScore,
                averageTotalScore
            }
        );

    } catch (err) {
        return error(res, 'Error fetching user statistics', 500, err.message);
    }
};
