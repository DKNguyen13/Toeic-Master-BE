import Test from "../models/test.model.js";
import Part from "../models/part.model.js";
import Question from "../models/question.model.js";
import mongoose from "mongoose";

/* ======================================================
   GET TEST DETAIL FOR EDIT
====================================================== */
export const getTestDetailForEdit = async (testId) => {
  const test = await Test.findById(testId).lean();
  if (!test) throw new Error("Test not found");

  const parts = await Part.find({ testId })
    .sort({ partNumber: 1 })
    .lean();

  const questions = await Question.find({ testId })
    .sort({ partNumber: 1, questionNumber: 1 })
    .lean();

  const questionsByPart = {};
  questions.forEach((q) => {
    if (!questionsByPart[q.partNumber]) {
      questionsByPart[q.partNumber] = [];
    }
    questionsByPart[q.partNumber].push(q);
  });

  const partsWithQuestions = parts.map((part) => ({
    ...part,
    questions: questionsByPart[part.partNumber] || [],
  }));

  return {
    test,
    parts: partsWithQuestions,
    totalParts: parts.length,
    totalQuestions: questions.length,
    summary: {
      listeningParts: parts.filter((p) => p.category === "Listening").length,
      readingParts: parts.filter((p) => p.category === "Reading").length,
      hasAudio: parts.some((p) => p.audioFile),
    },
  };
};

/* ======================================================
   UPDATE COMPLETE TEST
====================================================== */
export const updateTestComplete = async (slug, updateData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { testInfo, parts, questions } = updateData;

    const existingTest = await Test.findOne({slug}).session(session);
    if (!existingTest) throw new Error("Test not found");

    if (testInfo) {
      validateTestInfo(testInfo);
      await updateTestInfo(existingTest._id, testInfo, session);
    }

    if (parts?.length) {
      validateParts(parts);
      await updateParts(existingTest._id, parts, session);
    }

    if (questions?.length) {
      validateQuestions(questions);
      await updateQuestions(existingTest._id, questions, session);
    }

    await session.commitTransaction();

    return {
      test: await Test.findById(existingTest._id),
      parts: await Part.find({ testId: existingTest._id }).sort({ partNumber: 1 }),
      questions: await Question.find({ testId: existingTest._id }).sort({
        partNumber: 1,
        questionNumber: 1,
      }),
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/* ======================================================
   VALIDATION
====================================================== */
const validateTestInfo = (testInfo) => {
  if (testInfo.testCode !== undefined) {
    throw new Error("testCode cannot be updated");
  }

  if (testInfo.defaultConfig?.timeLimit !== undefined) {
    if (testInfo.defaultConfig.timeLimit <= 0) {
      throw new Error("timeLimit must be positive");
    }
  }
};

const validateParts = (parts) => {
  parts.forEach((p, i) => {
    if (!p.partId?.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error(`Invalid partId at index ${i}`);
    }
  });
};

const validateQuestions = (questions) => {
  questions.forEach((q, i) => {
    if (!q.questionId?.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error(`Invalid questionId at index ${i}`);
    }
  });
};

/* ======================================================
   UPDATE HELPERS
====================================================== */
const updateTestInfo = async (testId, testInfo, session) => {
  return Test.findByIdAndUpdate(
    testId,
    { $set: testInfo },
    { new: true, session, runValidators: true }
  );
};

const updateParts = async (testId, parts, session) => {
  const ops = parts.map((p) => ({
    updateOne: {
      filter: { _id: p.partId, testId },
      update: { $set: p },
    },
  }));

  await Part.bulkWrite(ops, { session });
};

const updateQuestions = async (testId, questions, session) => {
  const ops = questions.map((q) => ({
    updateOne: {
      filter: { _id: q.questionId, testId },
      update: { $set: q },
    },
  }));

  await Question.bulkWrite(ops, { session });
};
