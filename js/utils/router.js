// js/utils/router.js — ExamForge SPA router

const navStack = ['screen-home'];
let currentScreen = 'screen-home';

// Screens that should hide the navbar
const noNavbarScreens = ['screen-test-active', 'screen-flashcard-viewer'];

export function navigateTo(screenId, direction = 'forward') {
  const allScreens = document.querySelectorAll('.screen');
  const target = document.getElementById(screenId);

  if (!target) {
    console.warn(`Router: screen "${screenId}" not found`);
    return;
  }

  // Remove animation classes from all screens
  allScreens.forEach(s => {
    s.classList.remove('active', 'animate-slide-right', 'animate-slide-left');
  });

  // Apply animation
  const animClass = direction === 'back' ? 'animate-slide-left' : 'animate-slide-right';
  target.classList.add(animClass);

  // Show target, hide others
  allScreens.forEach(s => {
    if (s.id === screenId) {
      s.classList.add('active');
      s.style.display = '';
    } else {
      s.classList.remove('active');
      s.style.display = 'none';
    }
  });

  // Push to stack (avoid duplicate top)
  if (navStack[navStack.length - 1] !== screenId) {
    navStack.push(screenId);
  }

  currentScreen = screenId;

  // Manage navbar visibility
  if (noNavbarScreens.includes(screenId)) {
    hideNavbar();
  } else {
    showNavbar();
  }

  // Remove animation class after animation completes
  setTimeout(() => {
    target.classList.remove(animClass);
  }, 400);

  // Scroll to top
  window.scrollTo(0, 0);
}

export function goBack() {
  if (navStack.length > 1) {
    navStack.pop(); // Remove current
    const prev = navStack[navStack.length - 1];
    // Don't push again inside navigateTo since it's already on the stack
    const allScreens = document.querySelectorAll('.screen');
    const target = document.getElementById(prev);

    if (!target) {
      navigateTo('screen-home', 'back');
      return;
    }

    allScreens.forEach(s => {
      s.classList.remove('active', 'animate-slide-right', 'animate-slide-left');
    });

    target.classList.add('animate-slide-left');

    allScreens.forEach(s => {
      if (s.id === prev) {
        s.classList.add('active');
        s.style.display = '';
      } else {
        s.classList.remove('active');
        s.style.display = 'none';
      }
    });

    currentScreen = prev;

    if (noNavbarScreens.includes(prev)) {
      hideNavbar();
    } else {
      showNavbar();
    }

    setTimeout(() => {
      target.classList.remove('animate-slide-left');
    }, 400);

    window.scrollTo(0, 0);
  } else {
    navigateTo('screen-home', 'back');
  }
}

export function getCurrentScreen() {
  return currentScreen;
}

export function hideNavbar() {
  const nav = document.getElementById('navbar');
  if (nav) nav.style.display = 'none';
}

export function showNavbar() {
  const nav = document.getElementById('navbar');
  if (nav) nav.style.display = '';
}
