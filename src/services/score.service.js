import ScoreMapping from "../models/scoreMapping.model.js";
// calculate session results
export const calculateSessionResults = async function (sessionId, userId) {
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

export const calculateScore = async (section, correctAnswers) => {
    try {
        // Find the appropriate score mapping
        const scoreMapping = await ScoreMapping.findOne({
            section,
            correctAnswers,
            isActive: true
        }).sort({ version: -1 }); // Get latest version

        if (scoreMapping) {
            return scoreMapping.scaledScore;
        }
    } catch (error) {
        console.error('Error calculating score:', error);
    }
};