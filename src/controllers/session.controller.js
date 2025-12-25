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
        return error(res, 'Lỗi khi tạo phiên thi', 500, err.message);
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

        if (!Array.isArray(answers) || answers.length === 0)    return error(res, 'Mảng câu trả lời không được để trống');

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
        return error(res, 'Lỗi khi nộp bài', 500, err.message);
    }
};

// [PUT] /api/session/:sessionId/pause
export const pauseSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        await sessionTestService.pauseTestSession(sessionId, userId);
        return success(res, 'Pause phiên làm bài thành công');
    } catch (err) {
        return error(res, 'Lỗi xảy ra khi tạm dừng phiên làm bài', 500, err.message);
    }
};

// [PUT] /api/session/:sessionId/resume
export const resumeSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        await sessionTestService.resumeTestSession(sessionId, userId);
        return success(res, 'Resume phiên làm bài thành công');
    } catch (err) {
        return error(res, 'Lỗi xảy ra khi tiếp tục phiên làm bài', 500, err.message);
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
            .select('sessionCode progress sessionType status createdAt completedAt timeSpent results.totalScore results.totalQuestions results.accuracy');

        const total = await UserTestSession.countDocuments(filter);

        return success(
            res,
            'Lấy lịch sử phiên thi thành công',
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
        return error(res, 'Lỗi khi lấy lịch sử phiên thi', 500, err.message);
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
            'results.listeningScore': { $exists: true },
            'results.readingScore': { $exists: true }
        }).select('results.listeningScore results.readingScore results.totalScore createdAt');

        if (completedSessions.length === 0) {
            return success(
                res,
                'Chưa có phiên full-test nào hoàn thành',
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
            'Lấy thống kê điểm người dùng thành công',
            {
                totalSessions: completedSessions.length,
                averageListeningScore,
                averageReadingScore,
                averageTotalScore
            }
        );

    } catch (err) {
        return error(res, 'Lỗi khi lấy thống kê điểm người dùng', 500, err.message);
    }
};