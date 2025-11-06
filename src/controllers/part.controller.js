import Test from "../models/test.model.js";
import Part from "../models/part.model.js";
import Question from "../models/question.model.js";
import { success, error } from '../utils/response.js';

// [GET] /api/test/:slug/parts
export const getAllParts = async (req, res) => {
    try {
        const { slug } = req.query;
        console.log(slug);
        const test = await Test.findOne({ slug });

        if (!test) {
            return error(res, 'Test not found');
        }

        // Get part 
        const parts = await Part.find({ testId: test._id }).sort({ partNumber: 1 });

        // Get question for each part
        const partWithCounts = await Promise.all(
            parts.map(async (part) => {
                const questionCount = await Question.countDocuments({ partId: part._id });
                return {
                    ...part.toObject(),
                    questionCount,
                }
            })
        )
        return success(
            res,
            'Get all part success',
            {
                test: { slug: test.slug, title: test.title },
                partWithCounts
            });

    } catch (err) {
        return error(res, 'Get all test error', 500, err.message);
    }
};

// [GET] /api/test/:slug/parts/:partId
export const getPartById = async (req, res) => {
    try {

        const { slug, partId } = req.params;

        // Check test exists
        const test = await Test.findOne({ slug });

        if (!test) {
            return error(res, 'Test not found');
        }

        const part = await Part.findOne({
            _id: partId,
            testId: test._id
        }).populate('testId', 'title slug');

        if (!part) {
            return error(res, 'Part not found');
        }

        // Get questions for this part
        const questions = await Question.find({ partId })
            .sort({ questionNumber: 1 });

        return success(
            res,
            'Get part by id success',
            {
                part,
                questions,
                questionCount: questions.length
            }
        );
    } catch (error) {
        return error(res, 'Get part by id error');
    }
};

// [POST] /api/parts
export const createPart = async (req, res) => {
    try {
        // --- 1️⃣ Lấy dữ liệu từ body ---
        const { partData } = req.body;

        if (!partData) {
            return error(res, "Thiếu dữ liệu partData trong body", 400);
        }

        // Nếu client gửi dạng FormData thì parse JSON
        const parsedData = typeof partData === "string" ? JSON.parse(partData) : partData;

        const { slug, partNumber, questions, ...optionalData } = parsedData;

        // --- 2️⃣ Validate cơ bản ---
        if (!slug) {
            return error(res, "Chưa chọn đề thi", 400);
        }

        const number = Number(partNumber);
        if (!number || number < 1 || number > 7) {
            return error(res, "Part number phải nằm trong khoảng 1 - 7", 400);
        }

        // --- 3️⃣ Kiểm tra đề thi tồn tại ---
        const test = await Test.findOne({ slug });
        if (!test) {
            return error(res, "Không tìm thấy đề thi", 404);
        }

        // --- 4️⃣ Kiểm tra part đã tồn tại ---
        const existingPart = await Part.findOne({
            testId: test._id,
            partNumber: number,
        });
        if (existingPart) {
            return error(res, `Part ${number} đã tồn tại trong đề thi này`, 400);
        }

        // --- 5️⃣ Kiểm tra số lượng câu hỏi theo Part ---
        const questionLimits = {
            1: 6,
            2: 25,
            3: 39,
            4: 30,
            5: 30,
            6: 16,
            7: 54,
        };
        const expectedCount = questionLimits[number];

        if (questions && Array.isArray(questions)) {
            if (questions.length !== expectedCount) {
                return error(
                    res,
                    `❌ Part ${number} yêu cầu ${expectedCount} câu hỏi, hiện tại bạn gửi ${questions.length}`,
                    400
                );
            }
        }

        // --- 6️⃣ Xác định category dựa theo partNumber ---
        const category = number <= 4 ? "Listening" : "Reading";

        // --- 7️⃣ Tạo đối tượng Part ---
        const part = new Part({
            testId: test._id,
            title: `Part ${number}`,
            partNumber: number,
            category,
            totalQuestions: expectedCount,
            ...optionalData,
        });

        await part.save();

        return success(res, "✅ Tạo Part thành công", { part });
    } catch (err) {
        return error(res, "Lỗi khi tạo Part", 500, err.message);
    }
};


// [PUT] /api/test/:slug/parts/:partId
export const updatePart = async (req, res) => {
    try {
        // validate input

        const { slug, partId } = req.params;

        // Check test exists
        const test = await Test.findOne({ slug });
        if (!test) {
            return error(res, 'Test not found');
        }

        const updateData = { ...req.body };

        const part = await Part.findOneAndUpdate(
            { _id: partId, testId: test._id },
            updateData,
            { new: true, runValidators: true },
        ).populate('testId', 'title slug');

        if (!part) {
            return error(res, 'Part not found');
        }

        return success(res, 'Update part success', { part })
    } catch (error) {
        return error(res, 'Update part error');
    }
};

// [DELETE] /api/test/:slug/parts/:partId
export const deletePart = async (req, res) => {
    try {
        // hard delete - no casade with question
        // solution -> remove part and all question of this part

        const { slug, partId } = req.params;

        // Check test exists
        const test = await Test.findOne({ slug });
        if (!test) {
            return error(res, 'Test not found');
        }

        // Delete part
        const part = await Part.findOneAndDelete({
            _id: partId,
            testId: test._id
        });

        if (!part) {
            return error(res, 'part not found');
        }

        // Casade: delete all questions of this part
        await Question.deleteMany({ partId: part._id });

        return success(res, 'Delete part success', { part });
    } catch (error) {
        return error(res, 'Delete part error');
    }
};
