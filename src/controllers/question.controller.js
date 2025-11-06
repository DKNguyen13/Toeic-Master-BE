import mongoose from "mongoose";


import Test from "../models/test.model.js";
import Part from "../models/part.model.js";
import Question from "../models/question.model.js";
import { success, error } from '../utils/response.js';
import { uploadToCloudinary } from "../services/cloudinary.service.js";
import { v4 as uuidv4 } from "uuid";


// [GET] /api/test/:slug/questions
export const getAllQuestionByTest = async (req, res) => {
    try {
        const { slug } = req.params;

        // check test exists
        const test = await Test.findOne({ slug });
        if (!test) {
            return error(res, 'Test not found');
        }

        // Get list part of test
        const parts = await Part.find({ testId: test._id }).sort({ partNumber: 1 });

        const questions = await Question.find({ testId: test._id })
            .sort({ partNumber: 1, questionNumber: 1 })
            .populate('partId', 'partNumber title');

        const totalQuestion = await Question.countDocuments({ testId: test._id });

        return success(
            res,
            'Get all question by test success',
            {
                test: { title: test.title, slug: test.slug },
                parts: parts.map(part => ({
                    id: part._id,
                    partNumber: part.partNumber,
                    title: part.title
                })),
                questions: {
                    items: questions,
                    total: totalQuestion,
                },
            }
        )

    } catch (error) {
        return error(res, 'Get all question by test error');
    }
};

// [GET] /api/test/:slug/parts/:partId/questions
export const getAllQuestionByPart = async (req, res) => {
    try {
        const { slug } = req.params;
        const { partIds } = req.query;

        // Check test exists
        const test = await Test.findOne({ slug });
        if (!test) {
            return error(res, 'Test not found');
        }

        const partIdArray = partIds ? partIds.split(",") : [];

        const parts = await Part.find({
            _id: { $in: partIdArray },
            testId: test._id
        }).populate('testId', 'title testCode');

        // Check parts exists
        if (!parts || parts.length === 0) {
            return error(res, 'Parts not found');
        }

        // Build filter for parts
        const filter = { testId: test._id };
        if (partIdArray.length > 0) {
            filter.partId = { $in: partIdArray }
        }

        const questions = await Question.find(filter)
            .sort({ partNumber: 1, questionNumber: 1 });

        const totalQuestion = await Question.countDocuments(filter);

        return success(
            res,
            'Get all question by part success',
            {
                data: {
                    parts,
                    questions: {
                        items: questions,
                        total: totalQuestion,
                    }
                }
            });

    } catch (error) {
        return error(res, 'Get all question by parts error');
    }
};

export const createQuestions = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let { slug, partId, questions } = req.body;

    if (typeof questions === "string") {
      questions = JSON.parse(questions);
    }

    if (!Array.isArray(questions)) {
      questions = [questions];
    }

    if (!slug || !partId) {
      return error(res, "Missing Test or Part selected");
    }

    if (!questions.length) {
      return error(res, "No questions provided");
    }

    // --- Check Test và Part ---
    const test = await Test.findOne({ slug });
    if (!test) return error(res, 'Test not found');

    const part = await Part.findOne({ _id: partId, testId: test._id });
    if (!part) return error(res, 'Part not found in this test');

    // --- Lấy số thứ tự câu hỏi hiện tại ---
    const lastQuestion = await Question.findOne({ partId }).sort({ questionNumber: -1 });
    let questionNumber = lastQuestion ? lastQuestion.questionNumber : 0;
    let globalQuestionNumber = await Question.countDocuments({ testId: test._id });

    const processedQuestions = [];
    const isGroupedPart = [3, 4, 6, 7].includes(part.partNumber);

    // ✅ Map để tracking groupId đã tạo cho mỗi group
    const groupIdMap = new Map();

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      questionNumber++;
      globalQuestionNumber++;

      // Kiểm tra số lượng đáp án hợp lệ
      const expectedChoices = part.partNumber === 2 ? 3 : 4;
      if (!q.choices || q.choices.length !== expectedChoices) {
        return error(res, `Part ${part.partNumber} requires ${expectedChoices} choices. (Question ${i + 1})`);
      }

      let group = q.group ? { ...q.group } : null;

      // ✅ Xử lý groupId cho part có group
      if (isGroupedPart && group) {
        // Nếu group đã có groupId từ FE (từ groups array) → dùng lại
        if (group.groupId) {
          // Kiểm tra xem groupId này đã được tạo chưa
          if (!groupIdMap.has(group.groupId)) {
            // Lần đầu gặp groupId này → upload files
            const imageFile = Array.isArray(req.files)
              ? req.files.find(f => f.fieldname === group.image)
              : req.files?.[group.image]?.[0];

            const audioFile = Array.isArray(req.files)
              ? req.files.find(f => f.fieldname === group.audio)
              : req.files?.[group.audio]?.[0];

            if (imageFile) {
              const imgUrl = await uploadToCloudinary(imageFile.buffer, "toeic/questions/images");
              group.image = imgUrl;
            } else {
              delete group.image;
            }

            if (audioFile) {
              const audioUrl = await uploadToCloudinary(audioFile.buffer, "toeic/questions/audio");
              group.audio = audioUrl;
            } else {
              delete group.audio;
            }

            // Lưu vào map để tái sử dụng
            groupIdMap.set(group.groupId, {
              image: group.image,
              audio: group.audio,
              text: group.text
            });
          } else {
            // Đã có groupId này → dùng lại file đã upload
            const existingGroup = groupIdMap.get(group.groupId);
            group = { ...existingGroup, groupId: group.groupId };
          }
        }
      } 
      // ✅ Xử lý file cho part KHÔNG có group (1, 2, 5)
      else if (!isGroupedPart && group) {
        const imageFile = Array.isArray(req.files)
          ? req.files.find(f => f.fieldname === group.image)
          : req.files?.[group.image]?.[0];

        const audioFile = Array.isArray(req.files)
          ? req.files.find(f => f.fieldname === group.audio)
          : req.files?.[group.audio]?.[0];

        if (imageFile) {
          const imgUrl = await uploadToCloudinary(imageFile.buffer, "toeic/questions/images");
          group.image = imgUrl;
        } else {
          delete group.image;
        }

        if (audioFile) {
          const audioUrl = await uploadToCloudinary(audioFile.buffer, "toeic/questions/audio");
          group.audio = audioUrl;
        } else {
          delete group.audio;
        }

        // ✅ Part không có group → KHÔNG có groupId
        delete group.groupId;
      }

      processedQuestions.push({
        ...q,
        testId: test._id,
        partId,
        partNumber: part.partNumber,
        questionNumber,
        globalQuestionNumber,
        ...(group ? { group } : {}),
      });
    }

    const inserted = await Question.insertMany(processedQuestions);
    await Part.findByIdAndUpdate(partId, { $inc: { totalQuestion: inserted.length } });

    await session.commitTransaction();
    return success(
      res,
      inserted.length === 1
        ? "1 question created successfully"
        : `${inserted.length} questions created successfully`,
      inserted
    );

  } catch (err) {
    await session.abortTransaction();
    return error(res, err.message);
  } finally {
    session.endSession();
  }
};

