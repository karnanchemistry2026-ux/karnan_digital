// js/screens/practice.js — ExamForge Practice Mode (Redesigned)

import { store } from '../utils/storage.js';
import { navigateTo } from '../utils/router.js';
import { createMidnightTimer } from '../utils/timer.js';
import { QUESTIONS } from '../data/questions.js';
import { CHAPTERS } from '../data/chapters.js';

import { db } from '../firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ── Module state ──
let selectedSubject = 'Physics';
let selectedChapter = null; // chapter object
let currentQuestionIndex = 0;
let questions = [];
let userAnswers = []; // { selectedOption: number|null, answered: boolean }
let midnightTimer = null;

const DAILY_LIMIT = 5;

// ── Helpers ──
function getViewSubject() { return document.getElementById('practice-view-subject'); }
function getViewChapter() { return document.getElementById('practice-view-chapter'); }
function getArena() { return document.getElementById('mcq-arena'); }

function showViewSubject() {
  const vS = getViewSubject();
  const vC = getViewChapter();
  const a = getArena();
  if (vS) vS.style.display = 'block';
  if (vC) vC.style.display = 'none';
  if (a) a.style.display = 'none';
}

function showViewChapter() {
  const vS = getViewSubject();
  const vC = getViewChapter();
  const a = getArena();
  if (vS) vS.style.display = 'none';
  if (vC) vC.style.display = 'block';
  if (a) a.style.display = 'none';
  renderChapterList();
}

function showArena() {
  const vS = getViewSubject();
  const vC = getViewChapter();
  const a = getArena();
  if (vS) vS.style.display = 'none';
  if (vC) vC.style.display = 'none';
  if (a) a.style.display = 'block';
}

function renderChapterList() {
  const container = document.getElementById('chapter-list-container');
  if(!container) return;
  
  // Filter by subject
  const filteredChapters = CHAPTERS.filter(c => c.subject === selectedSubject);
  
  const colors = [
    { bg: '#E0F2FE', border: '#BAE6FD', text: '#0369A1' }, // Blue
    { bg: '#DCFCE7', border: '#BBF7D0', text: '#15803D' }, // Green
    { bg: '#F3E8FF', border: '#E9D5FF', text: '#7E22CE' }, // Purple
    { bg: '#FEF9C3', border: '#FEF08A', text: '#A16207' }, // Yellow
    { bg: '#FEE2E2', border: '#FECACA', text: '#B91C1C' }, // Red
    { bg: '#CCFBF1', border: '#99F6E4', text: '#0F766E' }, // Teal
  ];

  let totalDoneToday = 0;

  container.innerHTML = filteredChapters.map((ch, idx) => {
    const doneToday = store.getDailyCount(selectedSubject, ch.id);
    totalDoneToday += doneToday;
    const leftToday = Math.max(0, DAILY_LIMIT - doneToday);
    const color = colors[idx % colors.length];
    
    return `
      <div class="chapter-card cursor-pointer" data-id="${ch.id}" style="background:white; border:1px solid #E5E7EB; border-radius:16px; padding:16px; display:flex; align-items:center; transition:all 0.2s ease;">
        <div style="background:${color.bg}; border:1px solid ${color.border}; width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin-right:16px;">
          <i class="ph-fill ph-book-open" style="color:${color.text}; font-size:1.5rem;"></i>
        </div>
        <div style="flex:1;">
          <div style="font-weight:700; font-size:1.05rem; color:#1E1B4B; margin-bottom:4px;">${ch.name}</div>
          <div style="font-size:0.8rem; font-weight:600; color:#6B7280;">${leftToday} left today</div>
        </div>
        <i class="ph-bold ph-caret-right" style="color:#D1D5DB; font-size:1.2rem;"></i>
      </div>
    `;
  }).join('');

  // Update total done UI
  const totalDoneEl = document.getElementById('practice-daily-done');
  if(totalDoneEl) totalDoneEl.textContent = totalDoneToday;

  container.querySelectorAll('.chapter-card').forEach(card => {
    card.addEventListener('click', () => {
      const chId = card.dataset.id;
      selectedChapter = CHAPTERS.find(c => c.id === chId);
      startMCQArena();
    });
  });

  // Start reset timer
  const resetEl = document.getElementById('practice-reset-time');
  if (midnightTimer) midnightTimer.stop();
  midnightTimer = createMidnightTimer(
    (formatted) => {
      if (resetEl) {
        // Just take the HH:MM
        const parts = formatted.split(':');
        resetEl.textContent = `${parts[0]}h ${parts[1]}m`;
      }
    },
    () => { }
  );
  midnightTimer.start();
}

// ── Step 5: MCQ Arena ──
async function startMCQArena() {
  showArena();
  getArena().innerHTML = '<div style="text-align:center; padding:40px;"><i class="ph-bold ph-spinner ph-spin" style="font-size:2rem; color:var(--accent);"></i><p>Loading questions...</p></div>';

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
    <div class="mcq-topbar mb-2 flex justify-between align-start">
        <div>
            <div id="mcq-counter" style="font-size:1.2rem; font-weight:700; color:var(--ink); display:flex; align-items:center; gap:4px;"><i class="ph-bold ph-question"></i> 1/5</div>
            <div id="mcq-subject-chip" style="color:var(--primary); font-size:0.85rem; font-weight:600; margin-top:2px;">Physics</div>
        </div>
        <button id="mcq-exit-btn" style="background:white; border:1px solid var(--border); border-radius:100px; padding:6px 12px; font-size:0.85rem; font-weight:500; cursor:pointer; display:flex; align-items:center; gap:4px; color:var(--ink);"><i class="ph ph-x"></i> Exit</button>
    </div>
    
    <div class="progress-bar mb-4" style="height:4px; background:var(--bg); border-radius:4px; overflow:hidden;">
        <div id="mcq-progress-bar" style="width: 0%; height:100%; background:var(--primary); transition:width 0.3s ease; border-radius:4px;"></div>
    </div>
    
    <div class="question-card" style="background:white; border:1px solid var(--border); border-radius:12px; padding:24px;">
        <div id="mcq-question-text" class="question-text mb-4" style="font-size:1.05rem; line-height:1.6; font-weight:500; color:var(--ink);">Question Text</div>
        <div id="mcq-options-list" class="options-list flex flex-column gap-3 mb-4"></div>
        <div id="mcq-explanation" class="explanation-box mt-4 p-3 bg-success-light border-left-success rounded-right" style="display:none; border-left:4px solid var(--success);"></div>
        
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:16px; margin-top:16px;">
            <div style="display:flex; gap:12px; font-size:0.85rem; font-weight:500; color:var(--ink-secondary);">
                <span style="display:flex; align-items:center; gap:4px;"><i class="ph-fill ph-check-square" style="color:#10b981;"></i> <span id="mcq-correct-count">0</span></span>
                <span style="display:flex; align-items:center; gap:4px;"><i class="ph-fill ph-x-square" style="color:#ef4444;"></i> <span id="mcq-wrong-count">0</span></span>
            </div>
            <button id="mcq-next-btn" style="background:var(--primary); color:white; border:none; border-radius:100px; padding:8px 16px; font-size:0.9rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px;">Next <i class="ph-bold ph-arrow-right"></i></button>
        </div>
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
  const nextBtn = document.getElementById('mcq-next-btn');

  if (counter) counter.innerHTML = `<i class="ph-bold ph-question"></i> ${currentQuestionIndex + 1}/${questions.length}`;
  if (subjectChip) subjectChip.textContent = selectedSubject + " • " + selectedChapter.name;
  if (progressBar) progressBar.style.width = `${((currentQuestionIndex + 1) / questions.length) * 100}%`;

  // Pro gating
  const isLocked = q.isPro && !store.isProUser();

  if (questionText) {
    if (isLocked) {
      questionText.innerHTML = `<div style="filter:blur(4px); user-select:none;">${q.text}</div>`;
    } else {
      questionText.innerHTML = q.text;
    }
  }

  // Render options
  if (optionsList) {
    if (isLocked) {
      optionsList.innerHTML = `
        <div style="text-align:center; padding:24px;">
            <i class="ph-fill ph-lock-key" style="font-size:2rem; color:#F59E0B; margin-bottom:8px;"></i>
            <p style="font-weight:600; margin-bottom:12px;">This question is locked</p>
            <button id="mcq-pro-unlock" class="btn btn-primary" style="background:#6C48E1; border:none;">Unlock with Premium</button>
        </div>`;
      // Wire unlock button
      setTimeout(() => {
        const unlockBtn = document.getElementById('mcq-pro-unlock');
        if (unlockBtn) {
          unlockBtn.onclick = () => {
            if(window.ExamForge && window.ExamForge.showPremiumModal) {
              window.ExamForge.showPremiumModal('Advanced MCQ Practice');
            }
          };
        }
      }, 0);
    } else {
      const keys = ['A', 'B', 'C', 'D'];
      const ua = userAnswers[currentQuestionIndex];

      optionsList.innerHTML = q.options.map((opt, i) => {
        let classes = 'opt';
        if (ua.answered) {
          if (i === q.correctAnswer) classes += ' correct';
          if (ua.selectedOption === i && i !== q.correctAnswer) classes += ' wrong';
          if (ua.selectedOption === i) classes += ' selected';
        }
        return `
          <div class="${classes}" data-index="${i}" style="border:1px solid #E5E7EB; border-radius:12px; padding:12px 16px; cursor:${ua.answered?'default':'pointer'}; transition:all 0.2s; display:flex; gap:12px;">
            <span class="opt-key" style="background:#F3F4F6; width:24px; height:24px; display:flex; align-items:center; justify-content:center; border-radius:6px; font-weight:700; font-size:0.8rem; color:#4B5563;">${keys[i]}</span>
            <span class="opt-text" style="font-weight:500; color:#1E1B4B;">${opt}</span>
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
        <div class="font-weight-bold" style="color:#059669; margin-bottom:4px;">Explanation:</div>
        <div style="font-size:0.9rem; color:#065F46;">${q.explanation}</div>
        ${q.ncertRef ? `<div style="font-size:0.8rem; margin-top:8px; font-style:italic; color:#047857;">📖 ${q.ncertRef}</div>` : ''}
      `;
      explanationBox.style.display = 'block';
    } else {
      explanationBox.style.display = 'none';
      explanationBox.innerHTML = '';
    }
  }

  // Update Footer Stats
  let correctC = 0, wrongC = 0;
  userAnswers.forEach(ua => {
    if (ua.answered) {
      if (ua.selectedOption === questions[userAnswers.indexOf(ua)].correctAnswer) correctC++;
      else wrongC++;
    }
  });
  
  const correctEl = document.getElementById('mcq-correct-count');
  const wrongEl = document.getElementById('mcq-wrong-count');
  
  if (correctEl) correctEl.textContent = correctC;
  if (wrongEl) wrongEl.textContent = wrongC;

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
  if (index !== q.correctAnswer) {
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
        return; // force answer
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
       showViewChapter();
    };
  }
}

function showDailyComplete() {
  const overlay = document.getElementById('daily-complete-overlay');
  const arena = getArena();
  if (overlay) overlay.style.display = 'block';
  if (arena) arena.style.display = 'none';

  // Wire buttons
  const goHomeBtn = document.getElementById('daily-go-home');
  if (goHomeBtn) {
    goHomeBtn.onclick = () => {
      if (overlay) overlay.style.display = 'none';
      showViewSubject();
      navigateTo('screen-home', 'back');
    };
  }
}

export function initPractice() {
  // Wire Subject buttons
  const btnPhysics = document.getElementById('btn-subject-physics');
  if (btnPhysics) {
      btnPhysics.onclick = () => {
          selectedSubject = 'Physics';
          showViewChapter();
      };
  }

  const btnBackSubjects = document.getElementById('btn-back-to-subjects');
  if (btnBackSubjects) {
      btnBackSubjects.onclick = () => showViewSubject();
  }

  // Reset overlay
  const overlay = document.getElementById('daily-complete-overlay');
  if (overlay) overlay.style.display = 'none';

  showViewSubject();
}
