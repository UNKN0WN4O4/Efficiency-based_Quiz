export function calculateScore(
  isCorrect: boolean,
  timeTakenMs: number,
  usedHint: boolean,
  confidence: number // 1-100
): { score: number; breakdown: any } {
  let score = isCorrect ? 100 : 0;
  let timeDeduction = 0;
  let hintDeduction = 0;
  let confidenceModifier = 0;

  if (isCorrect) {
    // Deduct up to 50 points based on time taken out of 30 seconds (Efficiency Margin)
    const timePercentage = Math.min(1, timeTakenMs / 30000);
    timeDeduction = Math.floor(timePercentage * 50);
    score -= timeDeduction;

    // Hint penalty: 20%
    if (usedHint) {
      hintDeduction = 20;
      score -= hintDeduction;
    }

    // Confidence modifier for correct answers
    if (confidence >= 80) {
      confidenceModifier = 20; // Bonus
      score += confidenceModifier;
    }

    // Floor at 0 for logical consistency, though it shouldn't be negative unless time is huge
    score = Math.max(0, score);
  } else {
    // Confidence modifier for incorrect answers
    if (confidence >= 80) {
      confidenceModifier = -50; // Severe deduction
      score += confidenceModifier;
    }
  }

  return {
    score,
    breakdown: {
      base: isCorrect ? 100 : 0,
      timeDeduction: -timeDeduction,
      hintDeduction: -hintDeduction,
      confidenceModifier
    }
  };
}
