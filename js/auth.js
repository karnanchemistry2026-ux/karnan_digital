import { auth, googleProvider } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { wrappedNavigateTo } from './app.js'; // Assuming we export this to handle routing

let currentUser = null;
let isLoginMode = true;

const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const btnSubmit = document.getElementById('btn-auth-submit');
const btnToggle = document.getElementById('btn-auth-toggle');
const toggleText = document.getElementById('auth-toggle-text');
const btnGoogle = document.getElementById('btn-google-signin');
const errorMsg = document.getElementById('auth-error-msg');

// Toggle between Login and Sign Up
if (btnToggle) {
    btnToggle.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            btnSubmit.textContent = "Sign In";
            toggleText.textContent = "No account?";
            btnToggle.textContent = "Create one free";
        } else {
            btnSubmit.textContent = "Create Account";
            toggleText.textContent = "Already have an account?";
            btnToggle.textContent = "Sign In";
        }
        errorMsg.style.display = 'none';
    });
}

// Handle Email/Password Submit
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authEmail.value;
        const password = authPassword.value;
        
        errorMsg.style.display = 'none';
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Processing...';

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            // Auth state observer will handle the redirect
        } catch (error) {
            console.error("Auth error:", error);
            errorMsg.textContent = error.message.replace("Firebase: ", "");
            errorMsg.style.display = 'block';
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = isLoginMode ? "Sign In" : "Create Account";
        }
    });
}

// Handle Google Sign-In
if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            // Auth state observer will handle the redirect
        } catch (error) {
            console.error("Google Auth Error:", error);
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
        }
    });
}

// Handle Logout from Profile Screen
const logoutBtn = document.getElementById('btn-profile-logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            wrappedNavigateTo('screen-auth');
        });
    });
}

// Global Auth State Observer
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    
    // If we are on the auth screen and just logged in, go to home
    const activeScreen = document.querySelector('.screen.active');
    if (user) {
        console.log("User is logged in:", user.email);
        
        // Sync local storage from Firestore
        const { store } = await import('./utils/storage.js');
        await store.syncFromFirestore(user.uid);
        
        // Update Profile Screen UI with user details if possible
        const profileEmail = document.getElementById('profile-email');
        if(profileEmail) profileEmail.textContent = user.email;

        // Automatically update greeting name
        const greetingName = document.getElementById('home-greeting-name');
        if(greetingName) greetingName.textContent = user.displayName || user.email.split('@')[0];

        if (activeScreen && activeScreen.id === 'screen-auth') {
            wrappedNavigateTo('screen-home');
        }
    } else {
        console.log("User is logged out");
        // Force them to the Auth screen if they aren't already there
        if (activeScreen && activeScreen.id !== 'screen-auth') {
            wrappedNavigateTo('screen-auth');
        }
    }
});

export { currentUser, signOut };
