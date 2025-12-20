import Test from "../models/test.model.js";
import Part from "../models/part.model.js";
import Question from "../models/question.model.js";
import { success, error } from '../utils/response.js';
import { uploadToCloudinary } from "../services/cloudinary.service.js";
import * as testService from '../services/test.service.js';

// [GET] /api/test
export const getAllTest = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const tests = await Test.find({isActive: true})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Test.countDocuments();
        if (!tests) {
            return fail(res, 'Error fetching tests');
        }
        return success(res, 'Get all test success', {
            tests,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalTests: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });

    } catch (err) {
        return error(res, 'Get all test error', 500, err.message);
    }
};

// [GET] /api/test
export const getAllTestbyAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const tests = await Test.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Test.countDocuments();
        if (!tests) {
            return fail(res, 'Error fetching tests');
        }
        return success(res, 'Get all test success', {
            tests,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalTests: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });

    } catch (err) {
        return error(res, 'Get all test error', 500, err.message);
    }
};

// [GET] /api/test/:slug
export const getTestDetail = async (req, res) => {
    try {

        const { slug } = req.params;

        const test = await Test.findOne({ slug });

        if (!test) {
            return error(res, 'Test not found');
        }

        // Get part and questions
        const parts = await Part.find({ testId: test._id })
            .sort({ partNumber: 1 });

        const questions = await Question.find({ testId: test._id })
            .sort({ partNumber: 1, questionNumber: 1 });

        return success(
            res,
            'Get test detail success',
            {
                test,
                parts,
                questions,
                summary: {
                    totalPart: parts.length,
                    totalQuestions: questions.length,
                    questionByPart: parts.map(part => ({
                        partNumber: part.partNumber,
                        title: part.title,
                        questionCount: questions.filter(q => q.partNumber === part.partNumber)
                    }))
                }
            });
    } catch (error) {
        return error(res, 'Error fetching test');
    }
};

// [GET] /api/test/:slug/edit
export const getTestInfo = async (req, res) => {
    try {
        const { slug } = req.params;
        const test = await Test.findOne({ slug });
        if (!test) {
            return error(res, 'Đề thi không tồn tại');
        }
        // Call service
        const result = await testService.getTestDetailForEdit(test._id);

        return success(res, 'Lấy thông tin đề thi thành công', result);
    } catch (err) {
        return error(res, 'Lấy thông tin đề thi thất bại', 500, err.message);
    }
};

// [POST] /api/test/create
export const createTest = async (req, res) => {
    try {
        const userId = req.user.id;

        const { testData } = req.body;

        // Parse JSON nếu client gửi testData dạng string
        const parsedData = typeof testData === 'string' ? JSON.parse(testData) : testData;

        // check title
        if (!parsedData.title || parsedData.title.trim() === "") {
            return error(res, 'Thiếu tên đề thi', 400);
        }

        if (parsedData.title.length > 100) {
            return error(res, 'Tên đề thi không được vượt quá 100 ký tự', 400);
        }

        // check testCode
        if (!parsedData.testCode || parsedData.testCode.trim() === "") {
            return error(res, 'Thiếu mã đề thi', 400);
        }

        const existingTest = await Test.findOne({ testCode: parsedData.testCode.trim() });
        if (existingTest) {
            return error(res, `Mã đề thi '${parsedData.testCode}' đã tồn tại`, 400);
        }


        let audioUrl = parsedData.audio;

        const audioFile = req.file || (req.files?.audio?.[0]);

        // check if audio is file
        if (audioFile) {
            audioUrl = await uploadToCloudinary(audioFile.buffer, 'toeic/tests/audio');
        }

        if (!audioUrl) {
            return error(res, 'Chưa có audio cho đề thi');
        }
        parsedData.audio = audioUrl;

        const test = new Test({
            ...parsedData,
            createdBy: userId,
        });
        await test.save();

        return success(res, 'Create test success', { test });
    } catch (err) {
        return error(res, 'Error Create Test', 500, err.message);
    }
};

// [PUT] /api/test/:slug
export const updateTest = async (req, res) => {
    try {
        // validate input
        const { slug } = req.params;
        const updateData = req.body;

        const result = await testService.updateTestComplete(slug, updateData);

        return success(res, 'Cập nhật thông tin đề thi thành công', { result });
    } catch (err) {
        return error(res, 'Cập nhật thông tin đề thi thất bại', 500, err.message);
    }
};

// [DELETE] /api/test
export const modifyStatus = async (req, res) => {
    try {
        // Soft delete
        const { slug } = req.params;
        const test = await Test.findOne({ slug });
        if (!test) {
            return error(res, 'Test not found');
        }

        await Test.findOneAndUpdate(
            { slug },
            { isActive: !test.isActive },
            { new: true }
        );

        return success(res, 'Delete test success');
    } catch (error) {
        return error(res, 'Delete test error');
    }
};

