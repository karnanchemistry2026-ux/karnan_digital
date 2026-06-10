// js/utils/storage.js — ExamForge localStorage wrapper

const PREFIX = 'ef_';

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const store = {
  // ── Raw localStorage ──
  get(key) {
    try {
      return localStorage.getItem(PREFIX + key);
    } catch {
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, value);
    } catch (e) {
      console.error('storage.set failed:', e);
    }
  },

  getJSON(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setJSON(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error('storage.setJSON failed:', e);
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch (e) {
      console.error('storage.remove failed:', e);
    }
  },

  // ── Daily question count per chapter ──
  getDailyCount(subject, chapterId) {
    const key = `daily_${subject}_${chapterId}_${todayStr()}`;
    const val = this.get(key);
    return val ? parseInt(val, 10) || 0 : 0;
  },

  incrementDailyCount(subject, chapterId) {
    const key = `daily_${subject}_${chapterId}_${todayStr()}`;
    const current = this.getDailyCount(subject, chapterId);
    this.set(key, String(current + 1));
    // Also increment total solved
    const total = this.getTotalSolved();
    this.set('total_solved', String(total + 1));
  },

  // ── Mistakes ──
  addMistake(questionObj) {
    const mistakes = this.getMistakes();
    const exists = mistakes.some(m => m.id === questionObj.id);
    if (!exists) {
      mistakes.push({
        id: questionObj.id,
        subject: questionObj.subject,
        chapter: questionObj.chapter,
        text: questionObj.text,
        options: questionObj.options,
        correct: questionObj.correct,
        explanation: questionObj.explanation,
        selectedOption: questionObj.selectedOption !== undefined ? questionObj.selectedOption : -1,
        addedAt: new Date().toISOString()
      });
      this.setJSON('mistakes', mistakes);
    }
  },

  getMistakes() {
    return this.getJSON('mistakes') || [];
  },

  clearMistakes() {
    this.remove('mistakes');
  },

  removeMistake(questionId) {
    const mistakes = this.getMistakes();
    const filtered = mistakes.filter(m => m.id !== questionId);
    this.setJSON('mistakes', filtered);
  },

  // ── Test history ──
  addTestResult(resultObj) {
    const history = this.getTestHistory();
    history.push({
      ...resultObj,
      date: new Date().toISOString()
    });
    this.setJSON('test_history', history);
  },

  getTestHistory() {
    return this.getJSON('test_history') || [];
  },

  // ── Streak ──
  getStreak() {
    const data = this.getJSON('streak');
    if (!data) return { count: 0, lastDate: null };
    return { count: data.count || 0, lastDate: data.lastDate || null };
  },

  updateStreak() {
    const streak = this.getStreak();
    const today = todayStr();
    const yesterday = yesterdayStr();

    if (streak.lastDate === today) {
      // Already updated today — no-op
      return streak;
    }

    if (streak.lastDate === yesterday) {
      // Consecutive day — increment
      const newStreak = { count: streak.count + 1, lastDate: today };
      this.setJSON('streak', newStreak);
      return newStreak;
    }

    // Reset to 1 (first day or gap)
    const newStreak = { count: 1, lastDate: today };
    this.setJSON('streak', newStreak);
    return newStreak;
  },

  // ── Total solved ──
  getTotalSolved() {
    const val = this.get('total_solved');
    return val ? parseInt(val, 10) || 0 : 0;
  },

  // ── Pro user ──
  isProUser() {
    return this.get('pro_user') === 'true';
  },

  setProUser(val) {
    this.set('pro_user', val ? 'true' : 'false');
  },

  // ── Language ──
  getLanguage() {
    return this.get('language') || 'English';
  },

  setLanguage(lang) {
    this.set('language', lang);
  },

  // ── Flashcard mastery ──
  getMasteredCards() {
    return this.getJSON('fc_mastered') || [];
  },

  addMasteredCard(id) {
    const mastered = this.getMasteredCards();
    if (!mastered.includes(id)) {
      mastered.push(id);
      this.setJSON('fc_mastered', mastered);
    }
  },

  // ── Studied dates (for dashboard calendar) ──
  getStudiedDates() {
    return this.getJSON('studied_dates') || [];
  },

  markStudiedToday() {
    const dates = this.getStudiedDates();
    const today = todayStr();
    if (!dates.includes(today)) {
      dates.push(today);
      this.setJSON('studied_dates', dates);
    }
  },

  // ── Goal Engine ──
  getGoal() {
    return this.getJSON('target_goal') || { score: 650, college: 'AIIMS Delhi' };
  },

  setGoal(score, college) {
    this.setJSON('target_goal', { score: parseInt(score, 10), college: college });
  }
};
