// js/screens/practice.js — ExamForge Practice Mode (5-step wizard + MCQ arena)

import { store } from '../utils/storage.js';
import { navigateTo } from '../utils/router.js';
import { createMidnightTimer } from '../utils/timer.js';
import { QUESTIONS } from '../data/questions.js';
import { CHAPTERS } from '../data/chapters.js';

import { db } from '../firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ── Module state ──
let currentStep = 1;
let selectedLanguage = 'English';
let selectedClass = 11;
let selectedSubject = '';
let selectedChapter = null; // chapter object
let currentQuestionIndex = 0;
let questions = [];
let userAnswers = []; // { selectedOption: number|null, answered: boolean }
let midnightTimer = null;

const DAILY_LIMIT = 20;

// ── Helpers ──
function getStepperEl() { return document.getElementById('practice-stepper'); }
function getStepContent() { return document.getElementById('practice-step-content'); }
function getWizard() { return document.getElementById('practice-wizard'); }
function getArena() { return document.getElementById('mcq-arena'); }

function updateStepper() {
  const stepper = getStepperEl();
  if (!stepper) return;
  const dots = stepper.querySelectorAll('.step-dot');
  dots.forEach((dot, i) => {
    const stepNum = i + 1;
    dot.classList.remove('active', 'done');
    if (stepNum < currentStep) {
      dot.classList.add('done');
      dot.innerHTML = '<i class="ph-bold ph-check"></i>';
    } else if (stepNum === currentStep) {
      dot.classList.add('active');
      dot.innerHTML = String(stepNum);
    } else {
      dot.innerHTML = String(stepNum);
    }
  });
  const lines = stepper.querySelectorAll('.step-line');
  lines.forEach((line, i) => {
    if (i < currentStep - 1) line.classList.add('done');
    else line.classList.remove('done');
  });
}

function showWizard() {
  const w = getWizard();
  const a = getArena();
  if (w) w.style.display = '';
  if (a) a.style.display = 'none';
}

function showArena() {
  const w = getWizard();
  const a = getArena();
  if (w) w.style.display = 'none';
  if (a) a.style.display = '';
}

function renderStep() {
  updateStepper();
  const content = getStepContent();
  if (!content) return;

  switch (currentStep) {
    case 1: renderLanguageStep(content); break;
    case 2: renderClassStep(content); break;
    case 3: renderSubjectStep(content); break;
    case 4: renderChapterStep(content); break;
    default: break;
  }
}

// ── Step 1: Language ──
function renderLanguageStep(container) {
  container.innerHTML = `
    <h3 class="mb-4" style="font-weight:700; font-size:1.15rem; color:var(--ink);">Select Language</h3>
    <div class="grid grid-2 gap-3" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
      <div class="wizard-card" data-lang="English">
        <div class="wizard-card-left">
          <i class="ph-fill ph-globe-hemisphere-west text-primary wizard-card-icon"></i>
          <span>English</span>
        </div>
        <div class="wizard-card-right">1 class(es)</div>
      </div>
      <div class="wizard-card" data-lang="Tamil">
        <div class="wizard-card-left">
          <div style="font-size:0.75rem; font-weight:800; border:1px solid currentColor; border-radius:4px; padding:2px 4px; line-height:1; display:inline-flex;">TN</div>
          <span>Tamil</span>
        </div>
        <div class="wizard-card-right">1 class(es)</div>
      </div>
    </div>
    <button id="wizard-home-btn" class="wizard-btn-back"><i class="ph ph-arrow-left"></i> Home</button>
  `;
  container.querySelectorAll('.wizard-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedLanguage = card.dataset.lang;
      store.setLanguage(selectedLanguage);
      currentStep = 2;
      renderStep();
    });
  });
  document.getElementById('wizard-home-btn').onclick = () => navigateTo('screen-home', 'back');
}

// ── Step 2: Class ──
function renderClassStep(container) {
  const class12Count = CHAPTERS.filter(c => c.class === 12).length;

  container.innerHTML = `
    <h3 class="mb-4" style="font-weight:700; font-size:1.15rem; color:var(--ink);">Select Class</h3>
    <div class="grid grid-2 gap-3" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
      <div class="wizard-card disabled" data-class="11">
        <div class="wizard-card-left">
          <div style="width:20px;height:20px;border-radius:4px;background:#e5e7eb;"></div>
          <span>Class 11</span>
        </div>
        <div class="wizard-card-right">Coming soon</div>
      </div>
      <div class="wizard-card" data-class="12">
        <div class="wizard-card-left">
          <i class="ph-fill ph-book-bookmark text-primary wizard-card-icon"></i>
          <span>Class 12</span>
        </div>
        <div class="wizard-card-right">1 subject(s)</div>
      </div>
    </div>
    <button id="wizard-back-btn" class="wizard-btn-back"><i class="ph ph-arrow-left"></i> Back</button>
  `;
  container.querySelectorAll('.wizard-card:not(.disabled)').forEach(card => {
    card.addEventListener('click', () => {
      selectedClass = parseInt(card.dataset.class, 10);
      currentStep = 3;
      renderStep();
    });
  });
  document.getElementById('wizard-back-btn').onclick = () => { currentStep = 1; renderStep(); };
}

// ── Step 3: Subject ──
function renderSubjectStep(container) {
  container.innerHTML = `
    <h3 class="mb-4" style="font-weight:700; font-size:1.15rem; color:var(--ink);">Select Subject</h3>
    <div class="grid grid-3 gap-3" style="display:flex; gap:12px; flex-wrap:wrap;">
      <div class="wizard-card" data-subject="Physics" style="flex:1; min-width:200px;">
        <div class="wizard-card-left">
          <i class="ph-fill ph-atom" style="color:#8b5cf6; font-size:1.25rem;"></i>
          <span>Physics</span>
        </div>
        <div class="wizard-card-right">6 ch</div>
      </div>
      <div class="wizard-card disabled" style="flex:1; min-width:200px;">
        <div class="wizard-card-left">
          <i class="ph-fill ph-flask" style="color:#e5e7eb; font-size:1.25rem;"></i>
          <span style="color:var(--ink-muted);">Chemistry</span>
        </div>
        <div class="wizard-card-right">Soon</div>
      </div>
      <div class="wizard-card disabled" style="flex:1; min-width:200px;">
        <div class="wizard-card-left">
          <i class="ph-fill ph-dna" style="color:#e5e7eb; font-size:1.25rem;"></i>
          <span style="color:var(--ink-muted);">Biology</span>
        </div>
        <div class="wizard-card-right">Soon</div>
      </div>
    </div>
    <button id="wizard-back-btn" class="wizard-btn-back"><i class="ph ph-arrow-left"></i> Back</button>
  `;
  container.querySelectorAll('.wizard-card:not(.disabled)').forEach(card => {
    card.addEventListener('click', () => {
      selectedSubject = card.dataset.subject;
      currentStep = 4;
      renderStep();
    });
  });
  document.getElementById('wizard-back-btn').onclick = () => { currentStep = 2; renderStep(); };
}

// ── Step 4: Chapter ──
function renderChapterStep(container) {
  const topics = [
    "ANS, Sleep & Limbic",
    "Blood",
    "CNS & Motor",
    "Cardiovascular",
    "Cell Physiology",
    "Endocrinology",
    "Environmental & Integrated",
    "GI Physiology",
    "High-Yield Integrated",
    "Metabolism & Temperature"
  ];

  const cards = topics.map((topic, index) => {
    return `
      <div class="wizard-card" data-chapter-id="mock_${index}" style="margin-bottom:12px; border-radius:12px; display:flex; align-items:center; padding:16px 20px; background:white; cursor:pointer;">
        <i class="ph-fill ph-book-open" style="color:#00897B; font-size:1.5rem; margin-right:16px;"></i>
        <span style="flex:1; font-size:1.1rem; font-weight:600; color:var(--ink-dark);">${topic}</span>
        <i class="ph-bold ph-caret-right" style="color:#BDBDBD; font-size:1.2rem;"></i>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <h3 class="mb-4" style="font-weight:700; font-size:1.15rem; color:var(--ink);">Select Topic</h3>
    <div style="background-color: #F8F9FA; padding: 12px; border-radius: 16px;">
      ${cards || '<p class="text-muted">No topics available.</p>'}
    </div>
    
    <div style="text-align: center; margin-top: 16px; margin-bottom: 24px;">
      <p style="font-size: 0.75rem; color: var(--ink-muted);"><i class="ph-fill ph-alarm"></i> Resets at midnight</p>
    </div>

    <button id="wizard-back-btn" class="wizard-btn-back"><i class="ph ph-arrow-left"></i> Back</button>
  `;

  container.querySelectorAll('.wizard-card:not(.disabled)').forEach((card, idx) => {
    card.addEventListener('click', () => {
      // Create a mock selected chapter based on topic clicked
      selectedChapter = {
        id: card.dataset.chapterId,
        name: topics[idx],
        subject: selectedSubject,
        class: selectedClass
      };
      startMCQArena();
    });
  });
  document.getElementById('wizard-back-btn').onclick = () => { currentStep = 3; renderStep(); };
}

// ── Step 5: MCQ Arena ──
async function startMCQArena() {
  getArena().innerHTML = '<div style="text-align:center; padding:40px;"><i class="ph-bold ph-spinner ph-spin" style="font-size:2rem; color:var(--accent);"></i><p>Loading questions...</p></div>';
  showArena();

  let liveQuestions = [];
  try {
    const q = query(
      collection(db, "questions"), 
      where("subject", "==", selectedSubject),
      where("chapter", "==", selectedChapter ? selectedChapter.name : '')
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      liveQuestions.push({ id: doc.id, ...doc.data() });
    });
  } catch (err) {
    console.warn("Firebase fetch failed, falling back to local static questions:", err);
  }

  // Fallback to static if Firebase is empty/failed
  if (liveQuestions.length === 0) {
    liveQuestions = QUESTIONS.filter(q =>
      q.subject === selectedSubject &&
      q.chapter === (selectedChapter ? selectedChapter.name : '')
    );
  }

  // Limit to remaining daily quota
  const doneToday = store.getDailyCount(selectedSubject, selectedChapter.id);
  const remaining = Math.max(0, DAILY_LIMIT - doneToday);
  questions = liveQuestions.slice(0, remaining);

  if (questions.length === 0) {
    showDailyComplete();
    return;
  }

  // Initialize user answers
  userAnswers = questions.map(() => ({ selectedOption: null, answered: false }));
  currentQuestionIndex = 0;

  getArena().innerHTML = `
    <!-- Top Nav -->
    <div class="flex justify-between align-center p-3 border-bottom bg-white" style="position:sticky; top:0; z-index:10;">
      <button id="mcq-close-btn" class="btn btn-ghost btn-sm p-1"><i class="ph-bold ph-x" style="font-size:1.5rem;"></i></button>
      <div class="flex align-center gap-2">
        <span id="mcq-counter" class="font-weight-bold">1 / 10</span>
      </div>
      <button class="btn btn-ghost btn-sm p-1"><i class="ph-bold ph-bookmark-simple" style="font-size:1.5rem;"></i></button>
    </div>

    <!-- Main Content -->
    <div class="p-3">
      <!-- Progress -->
      <div class="mb-3">
        <span id="mcq-subject-chip" class="text-small font-weight-bold text-accent bg-subtle p-1 rounded d-inline-block mb-2">Subject</span>
        <div class="progress-container w-100 bg-subtle rounded overflow-hidden" style="height: 6px;">
          <div id="mcq-progress-bar" class="progress-bar bg-accent h-100" style="width: 10%; transition: width 0.3s;"></div>
        </div>
      </div>

      <!-- Question Text -->
      <div id="mcq-question-text" class="font-weight-bold mb-4" style="font-size: 1.15rem; line-height: 1.5; color: var(--ink);">
        Question text here?
      </div>

      <!-- Options -->
      <div id="mcq-options-list" class="flex flex-col gap-2 mb-4">
        <!-- populated by JS -->
      </div>

      <!-- Explanation Box -->
      <div id="mcq-explanation" class="card bg-subtle mb-4" style="display:none; border: 1px solid var(--border);">
        <div class="font-weight-bold flex align-center gap-1 mb-2 text-accent">
          <i class="ph-fill ph-lightbulb"></i> Explanation
        </div>
        <p id="mcq-explanation-text" class="text-small m-0 text-ink-secondary" style="line-height:1.5;"></p>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="flex justify-between align-center p-3 border-top bg-white" style="position:fixed; bottom:0; left:0; right:0;">
      <button id="mcq-prev-btn" class="btn btn-outline flex align-center gap-1 disabled" style="border-radius:24px; padding:8px 16px;"><i class="ph-bold ph-caret-left"></i> Prev</button>
      <button id="mcq-next-btn" class="btn btn-primary flex align-center gap-1" style="border-radius:24px; padding:8px 16px;">Next <i class="ph-bold ph-caret-right"></i></button>
    </div>
  `;

  renderQuestion();
  wireArenaControls();
}

function renderQuestion() {
  const q = questions[currentQuestionIndex];
  if (!q) return;

  const counter = document.getElementById('mcq-counter');
  const subjectChip = document.getElementById('mcq-subject-chip');
  const progressBar = document.getElementById('mcq-progress-bar');
  const questionText = document.getElementById('mcq-question-text');
  const optionsList = document.getElementById('mcq-options-list');
  const explanationBox = document.getElementById('mcq-explanation');
  const prevBtn = document.getElementById('mcq-prev-btn');
  const nextBtn = document.getElementById('mcq-next-btn');

  if (counter) counter.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
  if (subjectChip) subjectChip.textContent = q.subject;
  if (progressBar) progressBar.style.width = `${((currentQuestionIndex + 1) / questions.length) * 100}%`;

  // Pro gating
  const isLocked = q.isPro && !store.isProUser();

  if (questionText) {
    questionText.innerHTML = isLocked
      ? `<div class="pro-locked-overlay">
           <div class="blur-text">${q.text}</div>
           <button class="pro-unlock-btn" id="mcq-pro-unlock">⚡ Unlock with Pro</button>
         </div>`
      : q.text;
  }

  // Render options
  if (optionsList) {
    if (isLocked) {
      optionsList.innerHTML = '<p class="pro-msg">Upgrade to Pro to access this question.</p>';
      // Wire unlock button
      setTimeout(() => {
        const unlockBtn = document.getElementById('mcq-pro-unlock');
        if (unlockBtn) {
          unlockBtn.onclick = () => {
            const modal = document.getElementById('modal-pro');
            if (modal) modal.classList.add('active');
          };
        }
      }, 0);
    } else {
      const keys = ['A', 'B', 'C', 'D'];
      const ua = userAnswers[currentQuestionIndex];

      optionsList.innerHTML = q.options.map((opt, i) => {
        let classes = 'opt';
        if (ua.answered) {
          if (i === q.correct) classes += ' correct';
          if (ua.selectedOption === i && i !== q.correct) classes += ' wrong';
          if (ua.selectedOption === i) classes += ' selected';
        }
        return `
          <div class="${classes}" data-index="${i}">
            <span class="opt-key">${keys[i]}</span>
            <span class="opt-text">${opt}</span>
          </div>
        `;
      }).join('');

      // Wire option clicks (only if not already answered)
      if (!ua.answered) {
        optionsList.querySelectorAll('.opt').forEach(opt => {
          opt.addEventListener('click', () => handleOptionClick(parseInt(opt.dataset.index, 10)));
        });
      }
    }
  }

  // Show/hide explanation
  if (explanationBox) {
    if (userAnswers[currentQuestionIndex].answered) {
      explanationBox.innerHTML = `
        <div class="explanation-box show">
          <strong>Explanation:</strong> ${q.explanation}
          ${q.ncertRef ? `<br><small class="ncert-ref">📖 ${q.ncertRef}</small>` : ''}
        </div>
      `;
    } else {
      explanationBox.innerHTML = '';
    }
  }

  // Update Footer Stats
  let correctC = 0, wrongC = 0;
  userAnswers.forEach(ua => {
    if (ua.answered) {
      if (ua.selectedOption === questions[userAnswers.indexOf(ua)].correct) correctC++;
      else wrongC++;
    }
  });
  const doneToday = store.getDailyCount(selectedSubject, selectedChapter.id);
  const leftToday = Math.max(0, DAILY_LIMIT - doneToday);
  
  const correctEl = document.getElementById('mcq-correct-count');
  const wrongEl = document.getElementById('mcq-wrong-count');
  const leftEl = document.getElementById('mcq-left-today');
  
  if (correctEl) correctEl.textContent = correctC;
  if (wrongEl) wrongEl.textContent = wrongC;
  if (leftEl) leftEl.textContent = `${leftToday} left today`;

  // Next button state
  if (nextBtn) {
    nextBtn.innerHTML = currentQuestionIndex === questions.length - 1 ? 'Finish <i class="ph-bold ph-check"></i>' : 'Next <i class="ph-bold ph-arrow-right"></i>';
  }
}

function handleOptionClick(index) {
  const q = questions[currentQuestionIndex];
  const ua = userAnswers[currentQuestionIndex];
  if (ua.answered) return;

  ua.selectedOption = index;
  ua.answered = true;

  // Track daily count and streak
  store.incrementDailyCount(selectedSubject, selectedChapter.id);
  store.updateStreak();
  store.markStudiedToday();

  // If wrong, add to mistakes
  if (index !== q.correct) {
    store.addMistake({ ...q, selectedOption: index });
  }

  // Re-render to show correct/wrong
  renderQuestion();
}

function wireArenaControls() {
  const nextBtn = document.getElementById('mcq-next-btn');
  const exitBtn = document.getElementById('mcq-exit-btn');

  if (nextBtn) {
    nextBtn.onclick = () => {
      const ua = userAnswers[currentQuestionIndex];
      if (!ua.answered) {
        // Must answer first? Let's say yes
        return;
      }
      if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
      } else {
        // Finished all questions
        showDailyComplete();
      }
    };
  }

  if (exitBtn) {
    exitBtn.onclick = () => {
      showConfirmModal('Exit Practice', 'Are you sure you want to exit? Your progress is saved.', () => {
        resetPractice();
        navigateTo('screen-home', 'back');
      });
    };
  }
}

function showDailyComplete() {
  const overlay = document.getElementById('daily-complete-overlay');
  if (overlay) overlay.style.display = 'flex';

  // Midnight countdown
  if (midnightTimer) midnightTimer.stop();
  const countdownEl = document.getElementById('daily-countdown-timer');
  midnightTimer = createMidnightTimer(
    (formatted) => {
      if (countdownEl) countdownEl.textContent = formatted;
    },
    () => {
      if (countdownEl) countdownEl.textContent = '00:00:00';
      // New day — auto refresh
    }
  );
  midnightTimer.start();

  // Wire buttons
  const anotherBtn = document.getElementById('daily-another-chapter');
  const goHomeBtn = document.getElementById('daily-go-home');

  if (anotherBtn) {
    anotherBtn.onclick = () => {
      if (overlay) overlay.style.display = 'none';
      showWizard();
      currentStep = 4;
      renderStep();
    };
  }
  if (goHomeBtn) {
    goHomeBtn.onclick = () => {
      resetPractice();
      navigateTo('screen-home', 'back');
    };
  }
}

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

function resetPractice() {
  currentStep = 1;
  selectedLanguage = store.getLanguage();
  selectedClass = 11;
  selectedSubject = '';
  selectedChapter = null;
  currentQuestionIndex = 0;
  questions = [];
  userAnswers = [];
  if (midnightTimer) { midnightTimer.stop(); midnightTimer = null; }
  const overlay = document.getElementById('daily-complete-overlay');
  if (overlay) overlay.style.display = 'none';
  showWizard();
}

export function initPractice() {
  resetPractice();
  renderStep();

  // Wire back button
  const backBtn = document.getElementById('practice-back-btn');
  if (backBtn) {
    backBtn.onclick = () => {
      if (currentStep > 1) {
        currentStep--;
        renderStep();
      } else {
        navigateTo('screen-home', 'back');
      }
    };
  }
}
