// js/screens/home.js — ExamForge Home Screen

import { store } from '../utils/storage.js';
import { navigateTo } from '../utils/router.js';

function animateCounter(el, target, duration = 1000) {
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased);
    el.textContent = current;
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

export function initHome() {
  // ── Update stats ──
  const streak = store.getStreak();
  const totalSolved = store.getTotalSolved();
  const testHistory = store.getTestHistory();

  // Calculate overall accuracy from test history
  let totalCorrect = 0;
  let totalAttempted = 0;
  testHistory.forEach(r => {
    totalCorrect += r.correct || 0;
    totalAttempted += r.total || 0;
  });
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  // Calculate daily progress (questions solved today across all chapters)
  let dailyProgress = 0;
  const todayKey = new Date().toISOString().slice(0, 10);
  // Scan localStorage for today's daily counts
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ef_daily_') && key.endsWith(todayKey)) {
        const val = parseInt(localStorage.getItem(key), 10);
        if (!isNaN(val)) dailyProgress += val;
      }
    }
  } catch { /* ignore */ }

  // Animate stat counters
  const streakEl = document.getElementById('home-streak-count');
  const dailyEl = document.getElementById('home-daily-progress');
  const solvedEl = document.getElementById('home-total-solved');
  const accEl = document.getElementById('home-accuracy');

  if (streakEl) animateCounter(streakEl, streak.count, 800);
  if (dailyEl) animateCounter(dailyEl, dailyProgress, 800);
  if (solvedEl) animateCounter(solvedEl, totalSolved, 1200);
  if (accEl) {
    animateCounter(accEl, accuracy, 1000);
    // Append % after animation
    setTimeout(() => {
      if (accEl.textContent && !accEl.textContent.includes('%')) {
        accEl.textContent = accuracy + '%';
      }
    }, 1100);
  }

  // ── Daily Goal Widget ──
  const goalTarget = 5;
  const goalPct = Math.min(Math.round((dailyProgress / goalTarget) * 100), 100);
  
  const dgText = document.getElementById('daily-goal-text');
  const dgFill = document.getElementById('daily-goal-progress-fill');
  const dgStatus = document.getElementById('daily-goal-status');
  const dgPercent = document.getElementById('daily-goal-percent');

  if (dgText) dgText.textContent = `${dailyProgress}/${goalTarget} Questions Today`;
  if (dgStatus) dgStatus.textContent = `${goalPct}% of daily limit`;
  if (dgPercent) dgPercent.textContent = `${goalPct}%`;
  
  // Animate the bars after a short delay
  setTimeout(() => {
    if (dgFill) dgFill.style.width = `${goalPct}%`;
  }, 100);

  // ── Feature card navigation ──
  const cardPractice = document.getElementById('home-card-practice');
  const cardTest = document.getElementById('home-card-test');
  const cardFlashcards = document.getElementById('home-card-flashcards');
  const cardDashboard = document.getElementById('home-card-dashboard');
  const btnQuickPractice = document.getElementById('btn-quick-practice');

  if (cardPractice) {
    cardPractice.onclick = () => navigateTo('screen-practice');
  }
  if (btnQuickPractice) {
    btnQuickPractice.onclick = () => navigateTo('screen-practice');
  }
  if (cardTest) {
    cardTest.onclick = () => navigateTo('screen-test-setup');
  }
  if (cardFlashcards) {
    cardFlashcards.onclick = () => navigateTo('screen-flashcards');
  }
  if (cardDashboard) {
    cardDashboard.onclick = () => navigateTo('screen-dashboard');
  }

  // ── Pro banner ──
  const proBanner = document.getElementById('home-pro-banner');
  if (proBanner) {
    if (store.isProUser()) {
      proBanner.style.display = 'none';
    } else {
      proBanner.style.display = '';
      proBanner.onclick = () => {
        const modal = document.getElementById('modal-pro');
        if (modal) modal.classList.add('active');
      };
    }
  }
}
