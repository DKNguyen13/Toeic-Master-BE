import ScoreMapping from "../models/scoreMapping.model.js";

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

        // Fallback calculation if no mapping found
        return estimateScore(section, correctAnswers);
    } catch (error) {
        console.error('Error calculating score:', error);
        return estimateScore(section, correctAnswers);
    }
};

// Estimate score using linear approximation
export const estimateScore = (section, correctAnswers) => {
    // TOEIC score range: 5-495 for each section
    // Approximate linear mapping
    const minScore = 5;
    const maxScore = 495;
    const maxQuestions = 100;

    if (correctAnswers <= 0) return minScore;
    if (correctAnswers >= maxQuestions) return maxScore;

    // Linear interpolation with slight curve
    const percentage = correctAnswers / maxQuestions;
    const adjustedPercentage = Math.pow(percentage, 0.85); // Slight curve

    let finalScore =  Math.round(minScore + (maxScore - minScore) * adjustedPercentage);

    // lam tron diem chia het cho 5
    finalScore = Math.round(finalScore / 5) * 5;

    if(finalScore < minScore) {
        return minScore;
    }

    if(finalScore > maxScore) {
        return maxScore;
    }

    return finalScore;
};