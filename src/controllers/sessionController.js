import { success, error } from '../utils/response.js';

import User from "../models/user.model.js";
import Test from "../models/test.model.js";
import Part from "../models/part.model.js";
import Question from "../models/question.model.js";
import UserTestSession from "../models/userTestSession.model.js";
import UserAnswer from "../models/userAnswer.model.js";
import { calculateScore } from "../services/score.service.js";

// [POST] /api/session/start
export const startSession = async (req, res) => {
    try {
        const { testId, sessionType, selectedParts, timeLimit } = req.body;
        const userId = req.user.id; // duoc gan them tu middeware

        // Validate test exists
        const test = await Test.findById(testId);

        if (!test || !test.isActive) {
            return error(res, 'Đề thi không tồn tại hoặc đã bị xóa', 500);
        }

        // Check for active sessions
        const activeSession = await UserTestSession.findOne({
            userId,
            testId,
            status: { $in: ['started', 'in-progress', 'paused'] }
        });

        if (activeSession) {
            return error(res, 'You already have an active session for this test', 500);
        }

        // Detemine parts to include
        let parts = selectedParts;
        if (sessionType === 'full-test') {
            parts = [1, 2, 3, 4, 5, 6, 7];
        }

        // Get total questions count
        const totalQuestions = await Question.countDocuments({
            testId,
            partNumber: { $in: parts }
        });

        if (totalQuestions === 0) {
            return error(res, 'Đề thi hiện tại chưa cập nhật câu hỏi, vui lòng chọn đề thi khác để luyện tập');
        }

        // Create session
        const session = new UserTestSession({
            userId,
            testId,
            sessionType,
            testConfig: {
                selectedParts: parts,
                timeLimit: timeLimit || 0,
                allowReview: true
            },
            progress: {
                totalQuestions,
                answeredCount: 0,
                completionPercentage: 0
            }
        });

        await session.save();

        // Create UserAnswer with empty questions array
        const userAnswer = new UserAnswer({
            sessionId: session._id,
            userId,
            testId,
            questions: []
        });

        // Update test statistics
        await Test.findByIdAndUpdate(testId, {
            $inc: { 'statistics.totalAttempts': 1 }
        });

        return success(res, 'Test session started successfully', {
            id: session._id,
            sessionCode: session.sessionCode,
            sessionType: session.sessionType,
            testConfig: session.testConfig,
            progress: session.progress,
            expiredAt: session.expiredAt,
            totalQuestions
        });
    } catch (err) {
        return error(res, 'Error starting session', 500, err.message);
    }
};

// [GET] /api/session/:sessionId
export const getSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const session = await UserTestSession.findOne({
            _id: sessionId,
            userId
        }).populate('testId', 'title slug testCode audio');

        if (!session) {
            return error(res, 'Session not found');
        }

        return success(res, 'Get session success', { session });
    } catch (err) {
        return error(res, 'Get session fail');
    }
};

// [GET] /api/session/:sessionId/questions
export const getSessionQuestions = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const session = await UserTestSession.findOne({
            _id: sessionId,
            userId,
            status: { $in: ['started', 'in-progress', 'paused'] }
        });

        if (!session) {
            return error(res, 'Active session not found');
        }

        // Get all questions for this session
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
        const questionsWithAnswers = questions.map(question => ({
            ...question.toObject(),
            userAnswer: answerMap[question._id.toString()] || null
        }));

        return success(res, 'Fetching session questions successfully', {
            questions: questionsWithAnswers,
            session: {
                id: session._id,
                sessionCode: session.sessionCode,
                testConfig: session.testConfig,
                progress: session.progress,
                timeRemaining: Math.max(0, session.expiredAt.getTime() - Date.now())
            }
        });

    } catch (err) {
        return error(res, 'Error fetching session questions');
    }
};

// [POST] /api/session/:sessionId/answers
export const submitAnswer = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { questionId, selectedAnswer, timeSpent, isFlagged } = req.body;
        const userId = req.user.id;

        // Validate session
        const session = await UserTestSession.findOne({
            _id: sessionId,
            userId,
            status: { $in: ['started', 'in-progress', 'paused'] }
        });

        if (!session) {
            return error(res, 'Session not found');
        }

        // Check session expired
        if (new Date > session.expiredAt) {
            await UserTestSession.findByIdAndUpdate(sessionId, {
                status: 'timeout',
                completedAt: new Date()
            });

            return error(res, 'Session has expired');
        }

        // Get question details
        const question = await Question.findById(questionId);
        if (!question) {
            return error(res, 'Question not found');
        }

        const isCorrect = selectedAnswer === question.correctAnswer;
        const isSkipped = !selectedAnswer;

        // Get or create UserAnswer
        let userAnswer = await UserAnswer.findOne({
            sessionId,
            userId
        });

        if (!userAnswer) {
            // Create new UserAnswer
            userAnswer = new UserAnswer({
                sessionId,
                userId,
                testId: session.testId,
                questions: []
            });
        }

        // Check if answer already exists in array
        const existingAnswerIndex = userAnswer.questions.findIndex(
            q => q.questionId.toString() === questionId
        );

        const answerData = {
            questionId,
            questionNumber: question.questionNumber,
            selectedAnswer: selectedAnswer || null,
            isCorrect,
            timeSpent: timeSpent || 0,
            isSkipped,
            isFlagged: isFlagged || false
        };

        if (existingAnswerIndex !== -1) {
            //Update existing answer in array
            const existingAnswer = userAnswer.questions[existingAnswerIndex];

            // Update question satistics
            if (existingAnswer.isCorrect !== isCorrect) {
                if (isCorrect) {
                    await Question.findByIdAndUpdate(questionId, {
                        $inc: { 'statistics.correctCount': 1 }
                    });
                }
                else if (existingAnswer.isCorrect) {
                    await Question.findByIdAndUpdate(questionId, {
                        $inc: { 'statistics.correctCount': -1 }
                    })
                }
            }
            //Update answer in array
            userAnswer.questions[existingAnswerIndex] = {
                ...existingAnswer,
                selectedAnswer: answerData.selectedAnswer,
                isCorrect: answerData.isCorrect,
                timeSpent: existingAnswer.timeSpent + (timeSpent || 0),
                isSkipped: answerData.isSkipped,
                isFlagged: answerData.isFlagged
            };
        }
        else {
            // Add new answer to array
            userAnswer.questions.push(answerData);

            // Update question statistics
            await Question.findByIdAndUpdate(questionId, {
                $inc: {
                    'statistics.totalAnswered': 1,
                    'statistics.correctCount': isCorrect ? 1 : 0
                }
            });
        }

        await userAnswer.save();

        //Update session progress
        const answeredCount = userAnswer.questions.filter(q => !q.isSkipped).length;
        await UserTestSession.findByIdAndUpdate(sessionId, {
            'progress.answeredCount': answeredCount,
            'progress.completionPercentage': Math.round((answeredCount / session.progress.totalQuestions) * 100),
            status: 'in-progress'
        })

        return success(
            res,
            'Answer submitted successfully',
            {
                questionId,
                isCorrect,
                isSkipped,
                progress: {
                    answeredCount,
                    totalQuestions: session.progress.totalQuestions,
                    completionPercentage: Math.round((answeredCount / session.progress.totalQuestions) * 100)
                }
            }
        );
    } catch (err) {
        return error(res, 'Error submitting answer');
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

        // Validate session
        const session = await UserTestSession.findOne({
            _id: sessionId,
            userId,
            status: { $in: ['started', 'in-progress', 'paused'] }
        });

        if (!session) {
            return error(res, 'Active session not found');
        }

        // Get all questions for validation
        const questionIds = answers.map(a => a.questionId);
        const questions = await Question.find({
            _id: { $in: questionIds }
        });

        const questionMap = {};
        questions.forEach(q => {
            questionMap[q._id.toString()] = q;
        });

        // Get or create UserAnswer document
        let userAnswer = await UserAnswer.findOne({
            sessionId,
            userId
        });

        if (!userAnswer) {
            userAnswer = new UserAnswer({
                sessionId,
                userId,
                testId: session.testId,
                questions: []
            });
        }

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
                questionNumber: question.globalQuestionNumber,            // per-part index
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

        return success(
            res,
            `${answers.length} answers submitted successfully`,
            {
                processedAnswers,
                progress: {
                    answeredCount,
                    totalQuestions: session.progress.totalQuestions,
                    completionPercentage: Math.round((answeredCount / session.progress.totalQuestions) * 100)
                }
            }
        );

    } catch (err) {
        return error(res, 'Error submitting bulk answers', err.message);
    }
};

// [POST] /api/session/:sessionId/submit
export const submitSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const session = await UserTestSession.findOne({
            _id: sessionId,
            userId,
            status: { $in: ['started', 'in-progress', 'paused'] }
        });

        if (!session) {
            return error(res, 'Sesion not found');
        }

        // --- Step 1: Lấy tất cả câu hỏi của session ---
        const questions = await Question.find({
            testId: session.testId,
            partNumber: { $in: session.testConfig.selectedParts }
        })
            .sort({ partNumber: 1, questionNumber: 1 })
            .select('content choices questionNumber globalQuestionNumber partNumber');

        // --- Step 2: Lấy hoặc tạo UserAnswer ---
        let userAnswer = await UserAnswer.findOne({ sessionId, userId });
        if (!userAnswer) {
            userAnswer = new UserAnswer({
                sessionId,
                userId,
                testId: session.testId,
                questions: []
            });
        }

        const answeredIds = new Set(userAnswer.questions.map(q => q.questionId.toString()));

        // --- Step 3: Thêm các câu chưa trả lời ---
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

        // Calculate results
        const results = await calculateSessionResults(sessionId, userId);

        // Update session
        session.status = 'completed';
        session.completedAt = new Date();
        session.submittedAt = new Date();
        session.timeSpent = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
        session.results = results;

        await session.save();

        // Update test statistics
        await Test.findByIdAndUpdate(session.testId, {
            $inc: { 'statistics.completedAttempts': 1 }
        });

        // Update user statistics
        const user = await User.findById(userId);
        if (results.totalScore) {
            await user.updateStatistics(results);
        }

        return success(
            res,
            'Session submitted successfully',
            {
                sessionId,
                sessionCode: session.sessionCode,
                results
            }
        );

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
            return error(res,'Không tìm thấy phiên làm bài');
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

        const session = await UserTestSession.findOne({
            _id: sessionId,
            userId,
            status: 'completed'
        }).populate('testId', 'title slug testCode');

        if (!session) {
            return error(res, 'Session not found');
        }

        // Get user answers with populated question details
        const userAnswer = await UserAnswer.findOne({
            sessionId,
            userId
        }).populate({
            path: 'questions.questionId',
            select: 'question group choices correctAnswer explanation partNumber questionNumber globalQuestionNumber'
        });

        const answersSorted = userAnswer?.questions.sort((a, b) => {
            const qa = a.questionId?.globalQuestionNumber || 0;
            const qb = b.questionId?.globalQuestionNumber || 0;
            return qa - qb;
        });

        return success(
            res,
            'Get result session successfully',
            {
                session: {
                    id: session._id,
                    sessionCode: session.sessionCode,
                    test: session.testId,
                    sessionType: session.sessionType,
                    completedAt: session.completedAt,
                    timeSpent: session.timeSpent,
                    results: session.results
                },
                answers: answersSorted || []
            }
        );

    } catch (error) {
        return error(res, 'Error fetching session results');
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


// calculate session results
const calculateSessionResults = async function (sessionId, userId) {
    // Get UserAnswer with all questions
    const userAnswer = await UserAnswer.findOne({
        sessionId,
        userId
    }).populate('questions.questionId', 'partNumber');

    const session = await UserTestSession.findById(sessionId)
        .populate('testId', 'questions');

    if (!userAnswer || !userAnswer.questions) {
        return {
            totalQuestions: 0,
            answeredCount: 0,
            correctCount: 0,
            incorrectCount: 0,
            skippedCount: 0,
            accuracy: 0,
            partResults: []
        };
    }

    const answers = userAnswer.questions;

    const totalQuestions = session.progress.totalQuestions;

    let answeredCount = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    for (const a of answers) {
        if (a.isSkipped || a.selectedAnswer == null) {
            skippedCount++;
            continue;
        }

        answeredCount++;

        if (a.isCorrect) {
            correctCount++;
        } else {
            incorrectCount++;
        }
    }


    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

    // Calculate part results
    const partResults = [];
    for (let partNum = 1; partNum <= 7; partNum++) {
        const partAnswers = answers.filter(a =>
            a.questionId && a.questionId.partNumber === partNum
        );

        if (partAnswers.length > 0) {
            const partCorrect = partAnswers.filter(a => a.isCorrect).length;
            partResults.push({
                partNumber: partNum,
                totalQuestions: partAnswers.length,
                correctCount: partCorrect,
                accuracy: Math.round((partCorrect / partAnswers.length) * 100),
                timeSpent: partAnswers.reduce((sum, a) => sum + (a.timeSpent || 0), 0)
            });
        }
    }


    if (session.sessionType === "practice") {
    return {
      totalQuestions,
      answeredCount,
      correctCount,
      incorrectCount,
      skippedCount,
      accuracy,
      listeningScore: 0,
      readingScore: 0,
      totalScore: 0,
      partResults,
    };
  }


    // Calculate TOEIC scores if full test
    let listeningScore = 0;
    let readingScore = 0;
    let totalScore = 0;

    const listeningAnswers = answers.filter(a =>
        a.questionId && a.questionId.partNumber <= 4 && a.selectedAnswer !== null
    );
    const readingAnswers = answers.filter(a =>
        a.questionId && a.questionId.partNumber > 4 && a.selectedAnswer !== null
    );

    // listening and reading
    if (listeningAnswers.length > 0) {
        const listeningCorrect = listeningAnswers.filter(a => a.isCorrect).length;
        listeningScore = await calculateScore('listening', listeningCorrect);
    }

    if (readingAnswers.length > 0) {
        const readingCorrect = readingAnswers.filter(a => a.isCorrect).length;
        readingScore = await calculateScore('reading', readingCorrect);
    }

    if (listeningScore || readingScore) {
        totalScore = listeningScore + readingScore;
    }

    return {
        totalQuestions,
        answeredCount,
        correctCount,
        incorrectCount,
        skippedCount,
        accuracy,
        listeningScore,
        readingScore,
        totalScore,
        partResults
    };
};