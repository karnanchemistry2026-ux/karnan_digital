// js/screens/flashcards.js — ExamForge Flashcard Category Grid + Viewer

import { store } from '../utils/storage.js';
import { navigateTo } from '../utils/router.js';
import { FLASHCARDS } from '../data/flashcards-data.js';

// ── Module state ──
let activeCategory = '';
let categoryCards = [];
let currentCardIndex = 0;

// Category emoji map
const CATEGORY_ICONS = {
  'SI Units': '📏',
  'Chemical Formulas': '🧪',
  'Biology Terms': '🧬',
  'Physics Constants': '⚛️',
  'Periodic Table': '🔬',
  'Human Body': '🫀',
  'Organic Chemistry': '🔗',
  'Cell Biology': '🦠',
  'Ecology': '🌿',
  'Genetics': '🧬'
};

function getCategoryIcon(cat) {
  return CATEGORY_ICONS[cat] || '📝';
}

// ════════════════════════════════════════════
// CATEGORY SCREEN
// ════════════════════════════════════════════
export function initFlashcards() {
  const grid = document.getElementById('fc-category-grid');
  if (!grid) return;

  // Get unique categories
  const categories = [...new Set(FLASHCARDS.map(fc => fc.category))];
  const mastered = store.getMasteredCards();

  grid.innerHTML = categories.map(cat => {
    const cardsInCat = FLASHCARDS.filter(fc => fc.category === cat);
    const masteredInCat = cardsInCat.filter(fc => mastered.includes(fc.id)).length;
    const total = cardsInCat.length;
    const pct = total > 0 ? Math.round((masteredInCat / total) * 100) : 0;

    return `
      <div class="fc-category-card" data-category="${cat}">
        <div class="fc-cat-icon">${getCategoryIcon(cat)}</div>
        <h3 class="fc-cat-name">${cat}</h3>
        <div class="fc-cat-stats">
          <span class="fc-cat-count">${total} cards</span>
          <span class="fc-cat-mastered">${masteredInCat} mastered</span>
        </div>
        <div class="fc-cat-progress-bar">
          <div class="fc-cat-progress-fill" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');

  // Wire card clicks
  grid.querySelectorAll('.fc-category-card').forEach(card => {
    card.addEventListener('click', () => {
      activeCategory = card.dataset.category;
      navigateTo('screen-flashcard-viewer');
    });
  });
}

// ════════════════════════════════════════════
// VIEWER SCREEN
// ════════════════════════════════════════════
export function initFlashcardViewer() {
  categoryCards = FLASHCARDS.filter(fc => fc.category === activeCategory);
  currentCardIndex = 0;

  const title = document.getElementById('fc-category-title');
  if (title) title.textContent = activeCategory || 'Flashcards';

  if (categoryCards.length === 0) {
    const container = document.getElementById('fc-card-container');
    if (container) container.innerHTML = '<p class="empty-msg">No cards in this category.</p>';
    return;
  }

  renderCard();
  wireViewerControls();
  setupSwipeGestures();
}

function renderCard() {
  const card = document.getElementById('fc-card');
  const front = document.getElementById('fc-card-front');
  const back = document.getElementById('fc-card-back');
  const progressBar = document.getElementById('fc-progress-bar');
  const progressText = document.getElementById('fc-progress-text');

  if (!card || currentCardIndex >= categoryCards.length) {
    showCompletion();
    return;
  }

  const fc = categoryCards[currentCardIndex];

  // Reset flip state
  card.classList.remove('flipped');

  if (front) front.textContent = fc.front;
  if (back) back.textContent = fc.back;

  // Progress
  const total = categoryCards.length;
  const pct = Math.round(((currentCardIndex + 1) / total) * 100);
  if (progressBar) progressBar.style.width = `${pct}%`;
  if (progressText) progressText.textContent = `${currentCardIndex + 1} / ${total}`;
}

function showCompletion() {
  const container = document.getElementById('fc-card-container');
  if (container) {
    const mastered = store.getMasteredCards();
    const masteredInCat = categoryCards.filter(fc => mastered.includes(fc.id)).length;
    container.innerHTML = `
      <div class="fc-complete">
        <div class="fc-complete-icon">🎉</div>
        <h3>Category Complete!</h3>
        <p>You've gone through all cards in <strong>${activeCategory}</strong>.</p>
        <p>${masteredInCat} / ${categoryCards.length} cards mastered</p>
        <button class="btn-primary fc-restart-btn">Go Through Again</button>
      </div>
    `;
    const restartBtn = container.querySelector('.fc-restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        currentCardIndex = 0;
        renderCard();
      });
    }
  }
}

function wireViewerControls() {
  const card = document.getElementById('fc-card');
  const rightBtn = document.getElementById('fc-swipe-right-btn');
  const leftBtn = document.getElementById('fc-swipe-left-btn');
  const backBtn = document.getElementById('fc-back-btn');

  // Flip card on click
  if (card) {
    card.onclick = () => {
      card.classList.toggle('flipped');
    };
  }

  // Got It (right) — master and advance
  if (rightBtn) {
    rightBtn.onclick = () => {
      if (currentCardIndex < categoryCards.length) {
        const fc = categoryCards[currentCardIndex];
        store.addMasteredCard(fc.id);
      }
      currentCardIndex++;
      renderCard();
    };
  }

  // Don't Know (left) — advance without mastering
  if (leftBtn) {
    leftBtn.onclick = () => {
      currentCardIndex++;
      renderCard();
    };
  }

  // Back button
  if (backBtn) {
    backBtn.onclick = () => {
      navigateTo('screen-flashcards', 'back');
    };
  }
}

function setupSwipeGestures() {
  const container = document.getElementById('fc-card-container');
  if (!container) return;

  let touchStartX = 0;
  let touchEndX = 0;

  container.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    touchEndX = e.changedTouches[0].screenX;
  }, { passive: true });

  container.addEventListener('touchend', () => {
    const diff = touchStartX - touchEndX;
    const threshold = 60;

    if (Math.abs(diff) < threshold) return;

    if (diff > 0) {
      // Swipe left → Don't Know
      currentCardIndex++;
      renderCard();
    } else {
      // Swipe right → Got It (master)
      if (currentCardIndex < categoryCards.length) {
        store.addMasteredCard(categoryCards[currentCardIndex].id);
      }
      currentCardIndex++;
      renderCard();
    }
  }, { passive: true });
}
