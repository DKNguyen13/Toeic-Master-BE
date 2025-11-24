import xlsx from 'xlsx';
import mongoose from 'mongoose';
import Test from '../models/test.model.js';
import Part from '../models/part.model.js';
import Question from '../models/question.model.js';

/**
 * Validate Excel row data
 */
const validateRowData = (row, rowIndex) => {
  const errors = [];

  // Required fields validation
  if (!row.partNumber || row.partNumber < 1 || row.partNumber > 7) {
    errors.push(`Row ${rowIndex}: partNumber must be between 1 and 7`);
  }
  if (!row.questionNumber) errors.push(`Row ${rowIndex}: questionNumber is required`);
  if (!row.globalQuestionNumber) errors.push(`Row ${rowIndex}: globalQuestionNumber is required`);

  // Validate answer choices
  if (!row.choiceA?.trim()) errors.push(`Row ${rowIndex}: choiceA is required`);
  if (!row.choiceB?.trim()) errors.push(`Row ${rowIndex}: choiceB is required`);
  if (!row.choiceC?.trim()) errors.push(`Row ${rowIndex}: choiceC is required`);

  // if part 2 skip choice D
  if (row.partNumber !== 2) {
    if (!row.choiceD?.trim()) errors.push(`Row ${rowIndex}: choiceD is required`);
  }

  // Validate correctAnswer
  if (!['A', 'B', 'C', 'D'].includes(row.correctAnswer?.toUpperCase())) {
    errors.push(`Row ${rowIndex}: correctAnswer must be A, B, C, or D`);
  }

  return errors;
};

/**
 * Parse Excel file and extract data
 */
const parseExcelFile = (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    return data;
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
};

/**
 * Group questions by part number
 */
const groupQuestionsByPart = (rows) => {
  const partMap = new Map();

  rows.forEach(row => {
    const partNum = row.partNumber;
    if (!partMap.has(partNum)) {
      partMap.set(partNum, []);
    }
    partMap.get(partNum).push(row);
  });

  return partMap;
};

/**
 * Get part category based on part number
 */
const getPartCategory = (partNumber) => {
  return partNumber >= 1 && partNumber <= 4 ? 'Listening' : 'Reading';
};

/**
 * Build choices array from row data
 */
const buildChoices = (row) => {
  const correctAnswer = row.correctAnswer.toUpperCase();
  const choices = [
    { label: 'A', text: row.choiceA.trim(), isCorrect: correctAnswer === 'A' },
    { label: 'B', text: row.choiceB.trim(), isCorrect: correctAnswer === 'B' },
    { label: 'C', text: row.choiceC.trim(), isCorrect: correctAnswer === 'C' },
  ];

  // Only add choice D if it exists (not for part 2)
  if (row.choiceD) {
    choices.push({
      label: 'D',
      text: row.choiceD.trim(),
      isCorrect: correctAnswer === 'D'
    });
  }

  return choices;
};

const splitImage = (imageString) => {
  if (!imageString || typeof imageString !== 'string') {
    return [];
  }
  return imageString
    .split(',')
    .map(url => url.trim())
    .filter(url => url.length > 0);
}

/**
 * Main import function with transaction support
 */
export const importTestFromExcel = async (filePath, testData, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate test data from form
    if (!testData.title?.trim()) {
      throw new Error('Test title is required');
    }

    if (!testData.audio?.trim()) {
      throw new Error('Test audio URL is required');
    }

    // Parse Excel file
    const rows = parseExcelFile(filePath);

    if (!rows || rows.length === 0) {
      throw new Error('Excel file is empty or invalid format');
    }

    // Check if test with same test title already exists
    const existingTest = await Test.findOne({ title: testData.title.trim() }).session(session);
    if (existingTest) {
      throw new Error(`Test with title "${testData.title}" already exists`);
    }

    // Validate all rows
    const validationErrors = [];
    rows.forEach((row, index) => {
      const errors = validateRowData(row, index + 2); // +2 because Excel rows start at 1 and header is row 1
      validationErrors.push(...errors);
    });

    if (validationErrors.length > 0) {
      throw new Error(`Validation failed:\n${validationErrors.join('\n')}`);
    }

    // Create Test document
    const test = new Test({
      title: testData.title.trim(),
      audio: testData.audio.trim(),
      description: testData.description?.trim() || '',
      isActive: testData.isActive !== undefined ? testData.isActive : true,
      isPremium: testData.isPremium !== undefined ? testData.isPremium : false,
      isFeatured: testData.isFeatured !== undefined ? testData.isFeatured : false,
      isOfficial: testData.isOfficial !== undefined ? testData.isOfficial : false,
      createdBy: userId,
      publishedAt: null,
      metadata: {
        source: 'Imported'
      }
    });

    await test.save({ session });

    // Group questions by part
    const partMap = groupQuestionsByPart(rows);

    // Create Parts and Questions
    const partsToCreate = [];
    const questionsToCreate = [];

    for (const [partNumber, partRows] of partMap) {
      // Create Part document
      const part = new Part({
        testId: test._id,
        partNumber: partNumber,
        category: getPartCategory(partNumber),
        totalQuestions: partRows.length,
        config: {
          hasAudio: partNumber >= 1 && partNumber <= 4,
          allowReplay: true,
          showQuestionNumber: true,
          allowBack: true
        }
      });

      await part.save({ session });
      partsToCreate.push(part);

      // Create Question documents for this part
      for (const row of partRows) {
        const questionData = {
          testId: test._id,
          partId: part._id,
          partNumber: partNumber,
          questionNumber: row.questionNumber,
          globalQuestionNumber: row.globalQuestionNumber,
          question: row.question?.trim() || '',
          choices: buildChoices(row),
          correctAnswer: row.correctAnswer.toUpperCase(),
          explanation: row.explanation?.trim() || ''
        };

        // Handle group data if groupId exists
        if (row.groupId) {
          questionData.group = {
            groupId: String(row.groupId).trim(),
            text: row.groupText?.trim() || '',
            audio: row.groupAudio?.trim() || '',
            image: splitImage(row.groupImage)
          };
        }

        const question = new Question(questionData);
        await question.save({ session });
        questionsToCreate.push(question);
      }
    }

    // Commit transaction
    await session.commitTransaction();

    return {
      success: true,
      test: {
        id: test._id,
        title: test.title,
        testCode: test.testCode
      },
      stats: {
        totalParts: partsToCreate.length,
        totalQuestions: questionsToCreate.length,
        parts: partsToCreate.map(p => ({
          partNumber: p.partNumber,
          questionCount: p.totalQuestions
        }))
      }
    };

  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Validate Excel file structure (check headers)
 */
export const validateExcelStructure = (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length === 0) {
      return { valid: false, error: 'Excel file is empty' };
    }

    const headers = data[0];
    const requiredHeaders = [
      'partNumber',
      'questionNumber',
      'globalQuestionNumber',
      'question',
      'choiceA',
      'choiceB',
      'choiceC',
      'choiceD',
      'correctAnswer'
    ];

    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      return {
        valid: false,
        error: `Missing required headers: ${missingHeaders.join(', ')}`
      };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};
