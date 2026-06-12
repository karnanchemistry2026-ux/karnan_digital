// js/app.js — ExamForge Main Entry Point

import { store } from './utils/storage.js';
import { navigateTo, goBack } from './utils/router.js';
import { initHome } from './screens/home.js';
import { initPractice } from './screens/practice.js';
import { initTestSetup, initTestActive, initTestResults } from './screens/test.js';
import { initFlashcards, initFlashcardViewer } from './screens/flashcards.js';
import { initDashboard } from './screens/dashboard.js';
import { initMistakes } from './screens/mistakes.js';
import { initLeaderboard } from './screens/leaderboard.js';
import { initBookmarks } from './screens/bookmarks.js';

// ── Screen initializer map ──
const screenInitMap = {
  'screen-home': initHome,
  'screen-practice': initPractice,
  'screen-test-setup': initTestSetup,
  'screen-test-active': initTestActive,
  'screen-test-results': initTestResults,
  'screen-flashcards': initFlashcards,
  'screen-flashcard-viewer': initFlashcardViewer,
  'screen-dashboard': initDashboard,
  'screen-mistakes': initMistakes,
  'screen-leaderboard': initLeaderboard,
  'screen-bookmarks': initBookmarks
};

import { currentUser } from './auth.js';

// ── Wrap navigateTo to auto-init screens ──
const originalNavigateTo = navigateTo;

export function wrappedNavigateTo(screenId, direction = 'forward') {
  // Auth Guard: if not logged in and trying to access a protected route
  if (!currentUser && screenId !== 'screen-auth') {
    console.warn(`Access denied to ${screenId}. Redirecting to auth.`);
    originalNavigateTo('screen-auth', 'forward');
    return;
  }

  originalNavigateTo(screenId, direction);

  // Auto-initialize the target screen
  const initFn = screenInitMap[screenId];
  if (initFn) {
    try {
      initFn();
    } catch (e) {
      console.error(`Error initializing ${screenId}:`, e);
    }
  }
}

// ── Expose to window for global access ──
window.ExamForge = {
  router: {
    goBack,
    navigateTo: wrappedNavigateTo
  }
};

// ════════════════════════════════════════════
// DOM READY
// ════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // ── Update streak on load ──
  store.updateStreak();

  // ── Wire navbar buttons ──
  const navLogo = document.getElementById('nav-logo');
  const navDashboard = document.getElementById('nav-btn-dashboard');
  const navMistakes = document.getElementById('nav-btn-mistakes');
  const navLeaderboard = document.getElementById('nav-btn-leaderboard');
  const navPro = document.getElementById('nav-btn-pro');
  const navProfile = document.getElementById('nav-btn-profile');
  const profileSettingsBtn = document.getElementById('btn-profile-settings');
  const profilePerformanceBtn = document.getElementById('btn-profile-performance');
  const profileBookmarksBtn = document.getElementById('btn-profile-bookmarks');
  const profilePremiumBtn = document.getElementById('btn-profile-premium');

  // Wire up PYQ buttons
  const btnPyqNeet = document.getElementById('btn-pyq-neet');
  const btnPyqAiims = document.getElementById('btn-pyq-aiims');
  
  if (btnPyqNeet) {
    btnPyqNeet.addEventListener('click', () => wrappedNavigateTo('screen-test-setup'));
  }
  if (btnPyqAiims) {
    btnPyqAiims.addEventListener('click', () => wrappedNavigateTo('screen-test-setup'));
  }

  // New Home UI buttons
  const btnHomePremium = document.getElementById('home-go-premium');
  const btnPricingContinue = document.getElementById('btn-pricing-continue');
  const btnPracticeEnglish = document.getElementById('btn-practice-english');
  const btnPracticeTamil = document.getElementById('btn-practice-tamil');
  const btnQuickPractice = document.getElementById('btn-quick-practice');

  if (btnHomePremium) {
    btnHomePremium.addEventListener('click', () => wrappedNavigateTo('screen-pricing'));
  }
  if (btnPricingContinue) {
    btnPricingContinue.addEventListener('click', () => goBack());
  }
  if (btnPracticeEnglish) {
    btnPracticeEnglish.addEventListener('click', () => wrappedNavigateTo('screen-practice'));
  }
  if (btnPracticeTamil) {
    btnPracticeTamil.addEventListener('click', () => wrappedNavigateTo('screen-practice'));
  }
  if (btnQuickPractice) {
    btnQuickPractice.addEventListener('click', () => wrappedNavigateTo('screen-practice'));
  }

  // Bottom Nav Setup
  document.querySelectorAll('.nav-btn-bottom').forEach(btn => {
      btn.addEventListener('click', (e) => {
          const target = e.currentTarget.getAttribute('data-target');
          if (target) {
              // Reset active class
              document.querySelectorAll('.nav-btn-bottom').forEach(b => {
                  b.classList.remove('active');
                  b.style.color = '#9CA3AF'; // inactive color
              });
              e.currentTarget.classList.add('active');
              e.currentTarget.style.color = '#00897B'; // active color
              
              wrappedNavigateTo(target);
          }
      });
  });

  if (navLogo) {
    navLogo.addEventListener('click', () => wrappedNavigateTo('screen-home'));
  }
  if (navDashboard) {
    navDashboard.addEventListener('click', () => wrappedNavigateTo('screen-dashboard'));
  }
  if (navMistakes) {
    navMistakes.addEventListener('click', () => wrappedNavigateTo('screen-mistakes'));
  }
  if (navLeaderboard) {
    navLeaderboard.addEventListener('click', () => wrappedNavigateTo('screen-leaderboard'));
  }
  if (navPro) {
    navPro.addEventListener('click', () => {
      const modal = document.getElementById('modal-pro');
      if (modal) modal.classList.add('active');
    });
  }
  if (navProfile) {
    navProfile.addEventListener('click', () => wrappedNavigateTo('screen-profile'));
  }
  if (profileSettingsBtn) {
    profileSettingsBtn.addEventListener('click', () => wrappedNavigateTo('screen-settings'));
  }
  if (profilePerformanceBtn) {
    profilePerformanceBtn.addEventListener('click', () => wrappedNavigateTo('screen-dashboard'));
  }
  if (profileBookmarksBtn) {
    profileBookmarksBtn.addEventListener('click', () => wrappedNavigateTo('screen-bookmarks'));
  }
  if (profilePremiumBtn) {
    profilePremiumBtn.addEventListener('click', () => {
      const modal = document.getElementById('modal-pro');
      if (modal) modal.classList.add('active');
    });
  }

  // ── Wire Pro modal ──
  const modalPro = document.getElementById('modal-pro');
  const modalProClose = document.getElementById('modal-pro-close');
  const proForm = document.getElementById('pro-form');

  if (modalProClose) {
    modalProClose.addEventListener('click', () => {
      if (modalPro) modalPro.classList.remove('active');
    });
  }

  if (proForm) {
    proForm.addEventListener('submit', (e) => {
      e.preventDefault();
      store.setProUser(true);
      if (modalPro) modalPro.classList.remove('active');
      alert('🎉 Pro activated! You now have access to all questions.');
      // Refresh current screen
      const currentId = document.querySelector('.screen.active');
      if (currentId) {
        const initFn = screenInitMap[currentId.id];
        if (initFn) initFn();
      }
    });
  }

  // ── Wire confirm modal buttons (default behavior) ──
  const confirmCancel = document.getElementById('confirm-cancel');
  const confirmModal = document.getElementById('modal-confirm');

  if (confirmCancel) {
    confirmCancel.addEventListener('click', () => {
      if (confirmModal) confirmModal.classList.remove('active');
    });
  }

  // Click outside modal to close
  if (modalPro) {
    modalPro.addEventListener('click', (e) => {
      if (e.target === modalPro) modalPro.classList.remove('active');
    });
  }
  if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) confirmModal.classList.remove('active');
    });
  }

  // ── Security: disable right-click & text selection on quiz screens ──
  document.addEventListener('contextmenu', (e) => {
    if (!e.target || typeof e.target.closest !== 'function') return;
    const arena = e.target.closest('#mcq-arena, #screen-test-active');
    if (arena) {
      e.preventDefault();
    }
  });

  document.addEventListener('selectstart', (e) => {
    if (!e.target || typeof e.target.closest !== 'function') return;
    const arena = e.target.closest('#mcq-arena, #screen-test-active');
    if (arena) {
      e.preventDefault();
    }
  });

  // ── Handle browser back button ──
  window.addEventListener('popstate', () => {
    goBack();
  });

  // ── Hide all screens except home on load ──
  const allScreens = document.querySelectorAll('.screen');
  allScreens.forEach(s => {
    if (s.id === 'screen-home') {
      s.classList.add('active');
      s.style.display = '';
    } else {
      s.classList.remove('active');
      s.style.display = 'none';
    }
  });

  // ── Initialize home screen ──
  initHome();
});
