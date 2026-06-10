// js/screens/mistakes.js — ExamForge Mistakes Review

import { store } from '../utils/storage.js';
import { navigateTo } from '../utils/router.js';

// ── Module state for re-practice ──
let repracticeQuestions = [];
let repracticeIndex = 0;
let repracticeAnswers = [];

export function initMistakes() {
  repracticeQuestions = [];
  repracticeIndex = 0;
  repracticeAnswers = [];

  renderMistakesList();
  wireButtons();
}

function renderMistakesList() {
  const list = document.getElementById('mistakes-list');
  const emptyState = document.getElementById('mistakes-empty-state');
  const repracticeBtn = document.getElementById('mistakes-repractice-btn');
  const clearBtn = document.getElementById('mistakes-clear-btn');
  const mistakes = store.getMistakes();

  if (mistakes.length === 0) {
    if (list) list.style.display = 'none';
    if (emptyState) emptyState.style.display = '';
    if (repracticeBtn) repracticeBtn.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (list) list.style.display = '';
  if (repracticeBtn) repracticeBtn.style.display = '';
  if (clearBtn) clearBtn.style.display = '';

  const keys = ['A', 'B', 'C', 'D'];

  if (list) {
    list.innerHTML = mistakes.map((m, idx) => {
      const userAnswer = m.selectedOption >= 0 && m.selectedOption < 4
        ? `<span class="wrong-answer">${keys[m.selectedOption]}. ${m.options[m.selectedOption]}</span>`
        : '<span class="wrong-answer">Not answered</span>';
      const correctAnswer = `<span class="correct-answer">${keys[m.correct]}. ${m.options[m.correct]}</span>`;

      return `
        <div class="mistake-card" data-mistake-id="${m.id}">
          <div class="mistake-header">
            <span class="mistake-subject">${m.subject}</span>
            <span class="mistake-chapter">${m.chapter}</span>
            <button class="mistake-remove-btn" data-id="${m.id}" title="Remove">✕</button>
          </div>
          <div class="mistake-question">${m.text}</div>
          <div class="mistake-answers">
            <div class="mistake-your">
              <span class="answer-label">Your answer:</span>
              ${userAnswer}
            </div>
            <div class="mistake-correct">
              <span class="answer-label">Correct:</span>
              ${correctAnswer}
            </div>
          </div>
          <div class="mistake-explanation">
            <strong>Explanation:</strong> ${m.explanation}
          </div>
        </div>
      `;
    }).join('');

    // Wire individual remove buttons
    list.querySelectorAll('.mistake-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        store.removeMistake(id);
        renderMistakesList();
      });
    });
  }
}

function wireButtons() {
  const repracticeBtn = document.getElementById('mistakes-repractice-btn');
  const clearBtn = document.getElementById('mistakes-clear-btn');

  if (repracticeBtn) {
    repracticeBtn.onclick = () => {
      const mistakes = store.getMistakes();
      if (mistakes.length === 0) return;
      startRepractice(mistakes);
    };
  }

  if (clearBtn) {
    clearBtn.onclick = () => {
      showConfirmModal('Clear All Mistakes', 'Are you sure you want to clear all mistakes? This cannot be undone.', () => {
        store.clearMistakes();
        renderMistakesList();
      });
    };
  }
}

// ── Re-practice mode (reuses MCQ arena pattern inline) ──
function startRepractice(mistakes) {
  repracticeQuestions = mistakes.map(m => ({
    id: m.id,
    subject: m.subject,
    chapter: m.chapter,
    text: m.text,
    options: m.options,
    correct: m.correct,
    explanation: m.explanation
  }));
  repracticeIndex = 0;
  repracticeAnswers = repracticeQuestions.map(() => ({ selectedOption: null, answered: false }));

  const list = document.getElementById('mistakes-list');
  if (list) {
    renderRepracticeQuestion(list);
  }
}

function renderRepracticeQuestion(container) {
  if (repracticeIndex >= repracticeQuestions.length) {
    // Done — show completion
    container.innerHTML = `
      <div class="repractice-complete">
        <div class="complete-icon">🎉</div>
        <h3>Re-practice Complete!</h3>
        <p>You've reviewed all your mistake questions.</p>
        <button class="btn-primary repractice-done-btn">Back to Mistakes</button>
      </div>
    `;
    container.querySelector('.repractice-done-btn').addEventListener('click', () => {
      renderMistakesList();
    });
    return;
  }

  const q = repracticeQuestions[repracticeIndex];
  const ua = repracticeAnswers[repracticeIndex];
  const keys = ['A', 'B', 'C', 'D'];

  const optionsHtml = q.options.map((opt, i) => {
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

  const explanationHtml = ua.answered
    ? `<div class="explanation-box show"><strong>Explanation:</strong> ${q.explanation}</div>`
    : '';

  container.innerHTML = `
    <div class="repractice-arena">
      <div class="repractice-header">
        <span class="repractice-counter">${repracticeIndex + 1} / ${repracticeQuestions.length}</span>
        <span class="repractice-subject">${q.subject}</span>
        <button class="repractice-exit-btn">✕ Exit</button>
      </div>
      <div class="repractice-progress-bar">
        <div class="repractice-progress-fill" style="width:${((repracticeIndex + 1) / repracticeQuestions.length) * 100}%"></div>
      </div>
      <div class="repractice-question">${q.text}</div>
      <div class="repractice-options">${optionsHtml}</div>
      <div class="repractice-explanation">${explanationHtml}</div>
      <div class="repractice-nav">
        <button class="btn-secondary repractice-prev" ${repracticeIndex === 0 ? 'disabled' : ''}>← Prev</button>
        <button class="btn-primary repractice-next">${repracticeIndex === repracticeQuestions.length - 1 ? 'Finish' : 'Next →'}</button>
      </div>
    </div>
  `;

  // Wire options
  if (!ua.answered) {
    container.querySelectorAll('.opt').forEach(optEl => {
      optEl.addEventListener('click', () => {
        const idx = parseInt(optEl.dataset.index, 10);
        ua.selectedOption = idx;
        ua.answered = true;

        // If correct, remove from mistakes
        if (idx === q.correct) {
          store.removeMistake(q.id);
        }

        renderRepracticeQuestion(container);
      });
    });
  }

  // Wire nav
  const prevBtn = container.querySelector('.repractice-prev');
  const nextBtn = container.querySelector('.repractice-next');
  const exitBtn = container.querySelector('.repractice-exit-btn');

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (repracticeIndex > 0) {
        repracticeIndex--;
        renderRepracticeQuestion(container);
      }
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      if (repracticeIndex < repracticeQuestions.length - 1) {
        repracticeIndex++;
        renderRepracticeQuestion(container);
      } else {
        // Finish
        renderRepracticeQuestion(container);
        repracticeIndex = repracticeQuestions.length; // triggers completion
        renderRepracticeQuestion(container);
      }
    };
  }

  if (exitBtn) {
    exitBtn.onclick = () => {
      renderMistakesList();
    };
  }
}

// ── Confirm modal helper ──
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
