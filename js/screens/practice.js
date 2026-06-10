// js/screens/practice.js — ExamForge Practice Mode (5-step wizard + MCQ arena)

import { store } from '../utils/storage.js';
import { navigateTo } from '../utils/router.js';
import { createMidnightTimer } from '../utils/timer.js';
import { QUESTIONS } from '../data/questions.js';
import { CHAPTERS } from '../data/chapters.js';

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
  const filtered = CHAPTERS.filter(c => c.class === selectedClass && c.subject === selectedSubject);

  let chaptersDone = 0;
  let questionsAnswered = 0;

  const cards = filtered.map((ch, index) => {
    const doneToday = store.getDailyCount(selectedSubject, ch.id);
    questionsAnswered += doneToday;
    const isDone = doneToday >= DAILY_LIMIT;
    if (isDone) chaptersDone++;

    const disabledClass = isDone ? 'disabled' : '';
    const left = Math.max(0, DAILY_LIMIT - doneToday);

    return `
      <div class="wizard-card ${disabledClass}" data-chapter-id="${ch.id}" style="margin-bottom:12px; border-radius:8px;">
        <div class="wizard-card-left">
          <span>${index + 1}. ${ch.name}</span>
        </div>
        <div class="wizard-card-right">
          <span style="background-color: #f5f3ff; color: #6366f1; padding: 6px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
            <i class="ph-fill ph-pencil-simple"></i> ${left} left
          </span>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <h3 class="mb-4" style="font-weight:700; font-size:1.15rem; color:var(--ink);">${selectedSubject} — Select Chapter</h3>
    
    <div style="background-color: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: flex; align-items: flex-start; gap: 12px;">
      <i class="ph-fill ph-calendar-check" style="color:#6366f1; font-size: 1.5rem; margin-top:2px;"></i>
      <div>
        <h4 style="font-weight: 700; color: #065f46; margin-bottom: 4px; font-size: 0.95rem; line-height: 1.2;">Daily Practice — ${DAILY_LIMIT} Questions Per Chapter</h4>
        <p style="color: #047857; font-size: 0.85rem; margin:0;">${chaptersDone} of ${filtered.length} chapters done today &middot; ${questionsAnswered} questions answered</p>
      </div>
    </div>

    <div style="display:flex; flex-direction:column;">
      ${cards || '<p class="text-muted">No chapters available.</p>'}
    </div>
    
    <div style="text-align: center; margin-top: 16px; margin-bottom: 24px;">
      <p style="font-size: 0.75rem; color: var(--ink-muted);"><i class="ph-fill ph-alarm"></i> Resets at midnight</p>
    </div>

    <button id="wizard-back-btn" class="wizard-btn-back"><i class="ph ph-arrow-left"></i> Back</button>
  `;

  container.querySelectorAll('.wizard-card:not(.disabled)').forEach(card => {
    card.addEventListener('click', () => {
      const chId = card.dataset.chapterId;
      selectedChapter = filtered.find(c => c.id === chId) || null;
      if (!selectedChapter) return;
      startMCQArena();
    });
  });
  document.getElementById('wizard-back-btn').onclick = () => { currentStep = 3; renderStep(); };
}

// ── Step 5: MCQ Arena ──
function startMCQArena() {
  // Filter questions for this chapter
  questions = QUESTIONS.filter(q =>
    q.subject === selectedSubject &&
    q.chapter === (selectedChapter ? selectedChapter.name : '')
  );

  // Limit to remaining daily quota
  const doneToday = store.getDailyCount(selectedSubject, selectedChapter.id);
  const remaining = Math.max(0, DAILY_LIMIT - doneToday);
  questions = questions.slice(0, remaining);

  if (questions.length === 0) {
    // All done for today
    showDailyComplete();
    return;
  }

  // Initialize user answers
  userAnswers = questions.map(() => ({ selectedOption: null, answered: false }));
  currentQuestionIndex = 0;

  showArena();
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
