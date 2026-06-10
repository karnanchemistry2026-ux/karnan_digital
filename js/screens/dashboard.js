// js/screens/dashboard.js — ExamForge Dashboard

import { store } from '../utils/storage.js';
import { navigateTo } from '../utils/router.js';
import { getSubjectAccuracy, getBestChapters, getWeakChapters, getGoalEngineStats } from '../utils/analytics.js';

let accuracyChart = null;

export function initDashboard() {
  renderGoalEngine();
  renderStreakCalendar();
  renderAccuracyChart();
  renderBestChapters();
  renderWeakChapters();
  renderTotalSolved();

  // Setup Edit Goal Button
  const editBtn = document.getElementById('dash-edit-goal-btn');
  const modalGoal = document.getElementById('modal-goal');
  const closeBtn = document.getElementById('modal-goal-close');
  const goalForm = document.getElementById('goal-form');

  if (editBtn) {
    editBtn.onclick = () => {
      const goal = store.getGoal();
      document.getElementById('goal-score-input').value = goal.score;
      document.getElementById('goal-college-input').value = goal.college;
      modalGoal.classList.add('active');
    };
  }

  if (closeBtn) closeBtn.onclick = () => modalGoal.classList.remove('active');

  if (goalForm) {
    goalForm.onsubmit = (e) => {
      e.preventDefault();
      const score = document.getElementById('goal-score-input').value;
      const college = document.getElementById('goal-college-input').value;
      store.setGoal(score, college);
      modalGoal.classList.remove('active');
      renderGoalEngine(); // Re-render
    };
  }
}

// ── Goal Engine ──
function renderGoalEngine() {
  const goal = store.getGoal();
  document.getElementById('dash-target-score').textContent = goal.score;
  document.getElementById('dash-target-college').textContent = goal.college;

  const testHistory = store.getTestHistory();
  const stats = getGoalEngineStats(testHistory, goal.score);

  const avgEl = document.getElementById('dash-current-avg');
  const statusEl = document.getElementById('dash-goal-status');

  if (avgEl) avgEl.textContent = stats.currentAvg;

  if (statusEl) {
    if (stats.delta <= 0) {
      statusEl.innerHTML = `<span class="text-success">Goal Achieved! 🎉</span>`;
    } else {
      statusEl.innerHTML = `<span class="text-accent">+${stats.delta} marks needed (${stats.extraQuestionsNeeded} extra Qs)</span>`;
    }
  }
}

// ── Streak Calendar (last 7 days) ──
function renderStreakCalendar() {
  const container = document.getElementById('dash-streak-calendar');
  if (!container) return;

  const studiedDates = store.getStudiedDates();
  const today = new Date();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const isStudied = studiedDates.includes(dateStr);
    const isToday = i === 0;
    days.push({ dateStr, dayName, dayNum, isStudied, isToday });
  }

  const streak = store.getStreak();

  container.innerHTML = `
    <div class="streak-header flex align-center justify-center gap-2 mb-3 w-100" style="width:100%; text-align:center;">
      <i class="ph-fill ph-fire text-warning" style="font-size:1.5rem;"></i>
      <span class="font-weight-bold" style="font-size:1.2rem;">${streak.count} Day Streak</span>
    </div>
    <div class="streak-dots flex gap-2 justify-center" style="display:flex; gap:8px;">
      ${days.map(d => `
        <div class="streak-day flex flex-column align-center ${d.isStudied ? 'text-primary' : 'text-muted'}" style="text-align:center;">
          <span style="font-size:0.75rem;">${d.dayName}</span>
          <div style="width:24px; height:24px; border-radius:50%; margin:4px 0; background: ${d.isStudied ? 'var(--primary)' : 'var(--border)'};"></div>
          <span style="font-size:0.75rem; font-weight:${d.isToday ? 'bold' : 'normal'}">${d.dayNum}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Accuracy Chart (Chart.js) ──
function renderAccuracyChart() {
  const canvas = document.getElementById('dash-accuracy-chart');
  if (!canvas) return;

  const testHistory = store.getTestHistory();
  const physics = getSubjectAccuracy(testHistory, 'Physics');
  const chem = getSubjectAccuracy(testHistory, 'Chemistry');
  const bio = getSubjectAccuracy(testHistory, 'Biology');

  if (accuracyChart) {
    accuracyChart.destroy();
  }

  accuracyChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Physics', 'Chemistry', 'Biology'],
      datasets: [{
        data: [physics, chem, bio],
        backgroundColor: ['#6366f1', '#f59e0b', '#10b981'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  });
}

// ── Best Chapters ──
function renderBestChapters() {
  const container = document.getElementById('dash-best-chapters');
  if (!container) return;

  const testHistory = store.getTestHistory();
  const best = getBestChapters(testHistory, 3);

  if (best.length === 0) {
    container.innerHTML = '<li class="text-muted">Take some tests to see your best chapters.</li>';
    return;
  }

  container.innerHTML = best.map((ch, i) => `
    <li class="mb-2 flex justify-between align-center">
      <span>
        <i class="ph-fill ph-medal text-success"></i> ${ch.chapter}
      </span>
      <span class="font-weight-bold text-success">${ch.accuracy}%</span>
    </li>
  `).join('');
}

// ── Weak Chapters ──
function renderWeakChapters() {
  const container = document.getElementById('dash-weak-chapters');
  if (!container) return;

  const testHistory = store.getTestHistory();
  const weak = getWeakChapters(testHistory, 3);

  if (weak.length === 0) {
    container.innerHTML = '<li class="text-muted">Take some tests to identify weak chapters.</li>';
    return;
  }

  container.innerHTML = weak.map(ch => `
    <li class="mb-2">
      <div class="flex justify-between align-center mb-1">
        <span><i class="ph-fill ph-warning-circle text-error"></i> ${ch.chapter}</span>
        <span class="font-weight-bold text-error">${ch.accuracy}%</span>
      </div>
      <button class="btn btn-sm btn-outline practice-weak-btn w-100" style="width:100%;" data-chapter="${ch.chapter}">Practice Now</button>
    </li>
  `).join('');

  // Wire practice buttons
  container.querySelectorAll('.practice-weak-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateTo('screen-practice');
    });
  });
}

// ── Total Solved (animated counter) ──
function renderTotalSolved() {
  const el = document.getElementById('dash-total-solved');
  if (!el) return;

  const total = store.getTotalSolved();

  // Animated counter
  const duration = 1200;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(total * eased);
    el.textContent = current;
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = total;
    }
  }

  requestAnimationFrame(update);
}
