// js/utils/analytics.js — ExamForge test analytics & scoring

/**
 * Calculate full test score breakdown.
 * @param {Array} answers - [{questionId, selectedOption, timeTaken}]
 * @param {Array} questions - question objects from data
 */
export function calculateTestScore(answers, questions) {
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let totalTimeTaken = 0;

  const subjectBreakdown = {};
  const chapterBreakdown = {};

  // Build a lookup for questions by id
  const qMap = {};
  questions.forEach(q => { qMap[q.id] = q; });

  answers.forEach(ans => {
    const q = qMap[ans.questionId];
    if (!q) return;

    const subj = q.subject || 'Unknown';
    const chap = q.chapter || 'Unknown';

    // Init subject breakdown
    if (!subjectBreakdown[subj]) {
      subjectBreakdown[subj] = { correct: 0, wrong: 0, skipped: 0, total: 0 };
    }
    // Init chapter breakdown
    if (!chapterBreakdown[chap]) {
      chapterBreakdown[chap] = { correct: 0, wrong: 0, skipped: 0, total: 0 };
    }

    subjectBreakdown[subj].total++;
    chapterBreakdown[chap].total++;

    totalTimeTaken += ans.timeTaken || 0;

    if (ans.selectedOption === -1 || ans.selectedOption === null || ans.selectedOption === undefined) {
      skipped++;
      subjectBreakdown[subj].skipped++;
      chapterBreakdown[chap].skipped++;
    } else if (ans.selectedOption === q.correct) {
      correct++;
      subjectBreakdown[subj].correct++;
      chapterBreakdown[chap].correct++;
    } else {
      wrong++;
      subjectBreakdown[subj].wrong++;
      chapterBreakdown[chap].wrong++;
    }
  });

  const total = answers.length;
  const score = calculateNEETScore(correct, wrong);
  const maxScore = total * 4;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const avgTimePerQ = total > 0 ? Math.round(totalTimeTaken / total) : 0;

  return {
    correct,
    wrong,
    skipped,
    total,
    score,
    maxScore,
    accuracy,
    totalTimeTaken,
    avgTimePerQ,
    subjectBreakdown,
    chapterBreakdown
  };
}

/**
 * NEET scoring formula: +4 per correct, -1 per wrong, 0 for skipped.
 */
export function calculateNEETScore(correct, wrong) {
  return (correct * 4) - (wrong * 1);
}

/**
 * Grade label from percentage.
 */
export function getGradeLabel(pct) {
  if (pct >= 90) return 'Excellent';
  if (pct >= 70) return 'Very Good';
  if (pct >= 50) return 'Good';
  if (pct >= 30) return 'Keep Practicing';
  return 'Needs Improvement';
}

/**
 * Calculate per-subject accuracy from test history.
 * @param {Array} testHistory - array of stored test results
 * @param {string} subject - 'Physics', 'Chemistry', or 'Biology'
 * @returns {number} accuracy percentage (0-100)
 */
export function getSubjectAccuracy(testHistory, subject) {
  let totalCorrect = 0;
  let totalQuestions = 0;

  testHistory.forEach(result => {
    if (result.subjectBreakdown && result.subjectBreakdown[subject]) {
      const sb = result.subjectBreakdown[subject];
      totalCorrect += sb.correct || 0;
      totalQuestions += sb.total || 0;
    }
  });

  if (totalQuestions === 0) return 0;
  return Math.round((totalCorrect / totalQuestions) * 100);
}

/**
 * Get best performing chapters sorted by accuracy.
 * @param {Array} testHistory
 * @param {number} count - how many to return
 * @returns {Array} [{chapter, accuracy, correct, total}]
 */
export function getBestChapters(testHistory, count = 3) {
  const chapterStats = aggregateChapterStats(testHistory);
  return chapterStats
    .filter(c => c.total >= 1)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, count);
}

/**
 * Get weakest chapters sorted by accuracy ascending.
 */
export function getWeakChapters(testHistory, count = 3) {
  const chapterStats = aggregateChapterStats(testHistory);
  return chapterStats
    .filter(c => c.total >= 1)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, count);
}

/**
 * Internal: aggregate chapter stats across all test results.
 */
function aggregateChapterStats(testHistory) {
  const chapters = {};

  testHistory.forEach(result => {
    if (!result.chapterBreakdown) return;
    Object.entries(result.chapterBreakdown).forEach(([chap, data]) => {
      if (!chapters[chap]) {
        chapters[chap] = { chapter: chap, correct: 0, wrong: 0, skipped: 0, total: 0 };
      }
      chapters[chap].correct += data.correct || 0;
      chapters[chap].wrong += data.wrong || 0;
      chapters[chap].skipped += data.skipped || 0;
      chapters[chap].total += data.total || 0;
    });
  });

  return Object.values(chapters).map(c => ({
    ...c,
    accuracy: c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0
  }));
}

/**
 * Calculates current goal trajectory.
 */
export function getGoalEngineStats(testHistory, targetScore) {
  if (!testHistory || testHistory.length === 0) {
    return { currentAvg: 0, delta: targetScore, extraQuestionsNeeded: Math.ceil(targetScore / 4) };
  }

  let totalScore = 0;
  testHistory.forEach(r => totalScore += r.score);
  
  const currentAvg = Math.round(totalScore / testHistory.length);
  const delta = targetScore - currentAvg;
  
  // +4 for every correct answer to bridge the gap
  const extraQuestionsNeeded = delta > 0 ? Math.ceil(delta / 4) : 0;
  
  return {
    currentAvg,
    delta,
    extraQuestionsNeeded
  };
}
