// js/screens/test.js — ExamForge Mock Test (Setup → Active → Results)

import { store } from '../utils/storage.js';
import { navigateTo } from '../utils/router.js';
import { createCountdownTimer, formatTime } from '../utils/timer.js';
import { calculateTestScore, calculateNEETScore, getGradeLabel } from '../utils/analytics.js';
import { QUESTIONS } from '../data/questions.js';

// ── Shared module state ──
let testState = {
  name: '',
  questionCount: 60,
  durationSeconds: 3600,
  questions: [],
  answers: [],       // { questionId, selectedOption, marked, timeTaken }
  currentIndex: 0,
  timer: null,
  questionStartTime: 0,
  results: null
};

// Duration map: question count → seconds
const DURATION_MAP = {
  60: 3600,       // 1 hr
  90: 5400,       // 1.5 hr
  120: 7200,      // 2 hr
  150: 9000,      // 2.5 hr
  180: 12000      // 3 hr 20 min
};

const DURATION_LABELS = {
  60: '1 Hour',
  90: '1 Hour 30 Min',
  120: '2 Hours',
  150: '2 Hours 30 Min',
  180: '3 Hours 20 Min'
};

// ════════════════════════════════════════════
// TEST SETUP
// ════════════════════════════════════════════
export function initTestSetup() {
  testState.questionCount = 60;
  testState.durationSeconds = 3600;

  // Wire question count selector buttons
  const selectorContainer = document.getElementById('test-q-count-selector');
  const durationDisplay = document.getElementById('test-duration-display');
  const nameInput = document.getElementById('test-name-input');
  const startBtn = document.getElementById('test-start-btn');

  if (selectorContainer) {
    const buttons = selectorContainer.querySelectorAll('.sel-btn');
    buttons.forEach(btn => {
      // Set first as active by default
      if (parseInt(btn.dataset.value, 10) === testState.questionCount) {
        btn.classList.add('active');
      }
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const count = parseInt(btn.dataset.value, 10);
        testState.questionCount = count;
        testState.durationSeconds = DURATION_MAP[count] || 3600;
        if (durationDisplay) {
          durationDisplay.textContent = DURATION_LABELS[count] || formatTime(DURATION_MAP[count] || 3600);
        }
      });
    });
  }

  // Set initial duration display
  if (durationDisplay) {
    durationDisplay.textContent = DURATION_LABELS[testState.questionCount] || '1 Hour';
  }

  // Start button
  if (startBtn) {
    startBtn.onclick = () => {
      const name = nameInput ? nameInput.value.trim() : '';
      if (!name) {
        nameInput.focus();
        nameInput.classList.add('input-error');
        setTimeout(() => nameInput.classList.remove('input-error'), 2000);
        return;
      }

      testState.name = name;

      // Select N random questions
      const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
      testState.questions = shuffled.slice(0, testState.questionCount);

      // Initialize answers
      testState.answers = testState.questions.map(q => ({
        questionId: q.id,
        selectedOption: -1,
        marked: false,
        timeTaken: 0
      }));

      testState.currentIndex = 0;
      testState.results = null;

      navigateTo('screen-test-active');
    };
  }
}

// ════════════════════════════════════════════
// TEST ACTIVE
// ════════════════════════════════════════════
export function initTestActive() {
  testState.questionStartTime = Date.now();

  // Start countdown timer
  const timerDisplay = document.getElementById('test-timer-display');
  if (testState.timer) testState.timer.stop();

  testState.timer = createCountdownTimer(
    testState.durationSeconds,
    (remaining, formatted) => {
      if (timerDisplay) {
        timerDisplay.textContent = formatted;
        // Add urgent class when <10 minutes
        if (remaining < 600) {
          timerDisplay.classList.add('urgent');
        } else {
          timerDisplay.classList.remove('urgent');
        }
      }
    },
    () => {
      // Auto-submit on time up
      submitTest();
    }
  );
  testState.timer.start();

  renderTestQuestion();
  renderPalette();
  wireTestControls();
}

function renderTestQuestion() {
  const q = testState.questions[testState.currentIndex];
  if (!q) return;

  const counter = document.getElementById('test-q-counter');
  const questionText = document.getElementById('test-question-text');
  const optionsList = document.getElementById('test-options-list');
  const markBtn = document.getElementById('test-mark-btn');

  if (counter) counter.textContent = `${testState.currentIndex + 1} / ${testState.questions.length}`;

  if (questionText) questionText.innerHTML = q.text;

  // Render options (exam mode — no correct/wrong revealed)
  if (optionsList) {
    const keys = ['A', 'B', 'C', 'D'];
    const ans = testState.answers[testState.currentIndex];

    optionsList.innerHTML = q.options.map((opt, i) => {
      const selected = ans.selectedOption === i ? ' selected' : '';
      return `
        <div class="opt${selected}" data-index="${i}">
          <span class="opt-key">${keys[i]}</span>
          <span class="opt-text">${opt}</span>
        </div>
      `;
    }).join('');

    optionsList.querySelectorAll('.opt').forEach(optEl => {
      optEl.addEventListener('click', () => {
        const idx = parseInt(optEl.dataset.index, 10);
        const ans = testState.answers[testState.currentIndex];

        // Toggle: click same option to deselect
        if (ans.selectedOption === idx) {
          ans.selectedOption = -1;
        } else {
          ans.selectedOption = idx;
        }

        renderTestQuestion();
        renderPalette();
      });
    });
  }

  // Mark button state
  if (markBtn) {
    const ans = testState.answers[testState.currentIndex];
    if (ans.marked) {
      markBtn.classList.add('marked');
      markBtn.innerHTML = '<i class="ph-fill ph-flag"></i> Marked';
    } else {
      markBtn.classList.remove('marked');
      markBtn.innerHTML = '<i class="ph ph-flag"></i> Mark';
    }
  }
}

function renderPalette() {
  const grid = document.getElementById('test-palette-grid');
  if (!grid) return;

  grid.innerHTML = testState.answers.map((ans, i) => {
    let cls = 'qnav-btn';
    if (ans.selectedOption >= 0) cls += ' answered';
    if (ans.marked) cls += ' marked';
    if (i === testState.currentIndex) cls += ' current';
    return `<button class="${cls}" data-qi="${i}">${i + 1}</button>`;
  }).join('');

  grid.querySelectorAll('.qnav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      trackTimeForCurrentQuestion();
      testState.currentIndex = parseInt(btn.dataset.qi, 10);
      testState.questionStartTime = Date.now();
      renderTestQuestion();
      renderPalette();
    });
  });
}

function trackTimeForCurrentQuestion() {
  const elapsed = Math.round((Date.now() - testState.questionStartTime) / 1000);
  testState.answers[testState.currentIndex].timeTaken += elapsed;
}

function wireTestControls() {
  const prevBtn = document.getElementById('test-prev-btn');
  const nextBtn = document.getElementById('test-next-btn');
  const markBtn = document.getElementById('test-mark-btn');
  const paletteToggle = document.getElementById('test-palette-toggle');
  const paletteDrawer = document.getElementById('test-palette-drawer');
  const submitBtn = document.getElementById('test-submit-btn');

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (testState.currentIndex > 0) {
        trackTimeForCurrentQuestion();
        testState.currentIndex--;
        testState.questionStartTime = Date.now();
        renderTestQuestion();
        renderPalette();
      }
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      if (testState.currentIndex < testState.questions.length - 1) {
        trackTimeForCurrentQuestion();
        testState.currentIndex++;
        testState.questionStartTime = Date.now();
        renderTestQuestion();
        renderPalette();
      }
    };
  }

  if (markBtn) {
    markBtn.onclick = () => {
      const ans = testState.answers[testState.currentIndex];
      ans.marked = !ans.marked;
      renderTestQuestion();
      renderPalette();
    };
  }

  if (paletteToggle) {
    paletteToggle.onclick = () => {
      if (paletteDrawer) {
        paletteDrawer.classList.toggle('open');
      }
    };
  }

  if (submitBtn) {
    submitBtn.onclick = () => {
      showConfirmModal('Submit Test', 'Are you sure you want to submit? You cannot change answers after submission.', () => {
        submitTest();
      });
    };
  }
}

function submitTest() {
  trackTimeForCurrentQuestion();

  if (testState.timer) {
    testState.timer.stop();
    testState.timer = null;
  }

  // Calculate results
  const results = calculateTestScore(testState.answers, testState.questions);
  results.name = testState.name;
  results.questionCount = testState.questions.length;
  results.date = new Date().toISOString();

  testState.results = results;

  // Save to store
  store.addTestResult(results);
  store.updateStreak();
  store.markStudiedToday();

  // Add wrong answers to mistakes
  testState.answers.forEach(ans => {
    const q = testState.questions.find(q => q.id === ans.questionId);
    if (q && ans.selectedOption >= 0 && ans.selectedOption !== q.correct) {
      store.addMistake({ ...q, selectedOption: ans.selectedOption });
    }
  });

  navigateTo('screen-test-results');
}

// ════════════════════════════════════════════
// TEST RESULTS
// ════════════════════════════════════════════
export function initTestResults() {
  const results = testState.results;
  if (!results) return;

  const scorePct = document.getElementById('result-score-pct');
  const gradeLabel = document.getElementById('result-grade-label');
  const statsGrid = document.getElementById('result-stats-grid');
  const subjectAnalysis = document.getElementById('result-subject-analysis');
  const chapterAnalysis = document.getElementById('result-chapter-analysis');
  const aiFeedback = document.getElementById('result-ai-feedback');

  // Score percentage
  const pct = results.maxScore > 0 ? Math.round((results.score / results.maxScore) * 100) : 0;
  if (scorePct) scorePct.textContent = `${pct}%`;

  // Grade
  if (gradeLabel) gradeLabel.textContent = getGradeLabel(results.accuracy);

  // Stats grid — 6 cards
  if (statsGrid) {
    statsGrid.innerHTML = `
      <div class="stat-card"><span class="stat-icon"><i class="ph-fill ph-check-circle text-success"></i></span><span class="stat-value">${results.correct}</span><span class="stat-label">Correct</span></div>
      <div class="stat-card"><span class="stat-icon"><i class="ph-fill ph-x-circle text-error"></i></span><span class="stat-value">${results.wrong}</span><span class="stat-label">Wrong</span></div>
      <div class="stat-card"><span class="stat-icon"><i class="ph-fill ph-fast-forward text-muted"></i></span><span class="stat-value">${results.skipped}</span><span class="stat-label">Skipped</span></div>
      <div class="stat-card"><span class="stat-icon"><i class="ph-fill ph-target text-accent"></i></span><span class="stat-value">${results.accuracy}%</span><span class="stat-label">Accuracy</span></div>
      <div class="stat-card"><span class="stat-icon"><i class="ph-fill ph-clock"></i></span><span class="stat-value">${formatTime(results.totalTimeTaken)}</span><span class="stat-label">Time</span></div>
      <div class="stat-card"><span class="stat-icon"><i class="ph-fill ph-lightning text-warning"></i></span><span class="stat-value">${results.avgTimePerQ}s</span><span class="stat-label">Avg/Q</span></div>
    `;
  }

  // Subject analysis — Radar Chart
  if (subjectAnalysis) {
    const canvas = document.getElementById('result-subject-chart');
    if (canvas) {
      const subjects = Object.keys(results.subjectBreakdown);
      const accData = subjects.map(subj => {
        const data = results.subjectBreakdown[subj];
        const total = data.total || 1;
        return Math.round((data.correct / total) * 100);
      });

      if (window.testRadarChart) {
        window.testRadarChart.destroy();
      }

      window.testRadarChart = new Chart(canvas, {
        type: 'radar',
        data: {
          labels: subjects,
          datasets: [{
            label: 'Accuracy %',
            data: accData,
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            borderColor: '#6366f1',
            pointBackgroundColor: '#6366f1',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#6366f1'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              angleLines: { display: true },
              suggestedMin: 0,
              suggestedMax: 100
            }
          }
        }
      });
    }
  }

  // Chapter analysis — accuracy bars
  if (chapterAnalysis) {
    const chapters = Object.entries(results.chapterBreakdown);
    chapterAnalysis.innerHTML = chapters.map(([chap, data]) => {
      const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      return `
        <div class="chapter-row mb-2">
          <div class="flex justify-between text-small mb-1 font-weight-bold">
             <span>${chap}</span>
             <span>${acc}%</span>
          </div>
          <div class="progress-bar" style="height:6px; background:var(--border); border-radius:4px; overflow:hidden;">
            <div style="width:${acc}%; height:100%; background:var(--primary);"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // AI Feedback — 4 insight cards based on results
  if (aiFeedback) {
    const strengths = [];
    const improvements = [];

    Object.entries(results.subjectBreakdown).forEach(([subj, data]) => {
      const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      if (acc >= 70) strengths.push(subj);
      else improvements.push(subj);
    });

    const strengthText = strengths.length > 0
      ? `You performed well in ${strengths.join(', ')}. Keep up the great work in these subjects!`
      : 'Focus on building strong foundations across all subjects.';

    const improvementText = improvements.length > 0
      ? `You need more practice in ${improvements.join(', ')}. Focus on these areas.`
      : 'Excellent performance across all subjects!';

    const actionPlan = results.accuracy >= 70
      ? 'Continue with full-length mock tests and focus on time management. Target 90%+ for NEET.'
      : results.accuracy >= 50
      ? 'Review NCERT thoroughly for weak chapters. Take chapter-wise practice tests daily.'
      : 'Start with NCERT basics. Do 20 questions daily per subject. Build concepts before speed.';

    const tips = results.avgTimePerQ > 120
      ? 'You are spending too long per question. Practice speed-solving techniques.'
      : results.avgTimePerQ > 60
      ? 'Your pace is okay but can improve. Try timed practice sets of 30 questions in 30 minutes.'
      : 'Your speed is good! Focus on accuracy now — re-read questions carefully before answering.';

    aiFeedback.innerHTML = `
      <div class="card p-3 border">
        <div class="mb-2 text-success" style="font-size:1.5rem;"><i class="ph-fill ph-barbell"></i></div>
        <h4 class="mb-1 text-small text-ink-secondary text-uppercase font-weight-bold">Strengths</h4>
        <p class="text-small m-0">${strengthText}</p>
      </div>
      <div class="card p-3 border">
        <div class="mb-2 text-error" style="font-size:1.5rem;"><i class="ph-fill ph-trend-down"></i></div>
        <h4 class="mb-1 text-small text-ink-secondary text-uppercase font-weight-bold">Areas for Improvement</h4>
        <p class="text-small m-0">${improvementText}</p>
      </div>
      <div class="card p-3 border">
        <div class="mb-2 text-primary" style="font-size:1.5rem;"><i class="ph-fill ph-clipboard-text"></i></div>
        <h4 class="mb-1 text-small text-ink-secondary text-uppercase font-weight-bold">Action Plan</h4>
        <p class="text-small m-0">${actionPlan}</p>
      </div>
      <div class="card p-3 border">
        <div class="mb-2 text-accent" style="font-size:1.5rem;"><i class="ph-fill ph-lightbulb"></i></div>
        <h4 class="mb-1 text-small text-ink-secondary text-uppercase font-weight-bold">Pro Tips</h4>
        <p class="text-small m-0">${tips}</p>
      </div>
    `;
  }

  // Wire result buttons
  const lbBtn = document.getElementById('result-btn-leaderboard');
  const homeBtn = document.getElementById('result-btn-home');

  if (lbBtn) lbBtn.onclick = () => navigateTo('screen-leaderboard');
  if (homeBtn) homeBtn.onclick = () => navigateTo('screen-home');
}

// ── Shared confirm modal helper ──
function showConfirmModal(title, message, onOk) {
  const modal = document.getElementById('modal-confirm');
  const titleEl = document.getElementById('confirm-title');
  const msgEl = document.getElementById('confirm-message');
  const cancelBtn = document.getElementById('confirm-cancel');
  const okBtn = document.getElementById('confirm-ok');

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  if (modal) modal.classList.add('active');

  if (okBtn) {
    okBtn.onclick = () => {
      if (modal) modal.classList.remove('active');
      if (onOk) onOk();
    };
  }
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      if (modal) modal.classList.remove('active');
    };
  }
}
