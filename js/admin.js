import { db, auth } from './firebase-config.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const QUESTIONS_COLLECTION = "questions";

// DOM Elements
const questionsList = document.getElementById('questions-list');
const loadingState = document.getElementById('loading-state');
const modal = document.getElementById('question-modal');
const form = document.getElementById('question-form');
const btnAdd = document.getElementById('btn-add-question');
const btnClose = document.getElementById('btn-close-modal');
const btnCancel = document.getElementById('btn-cancel-modal');
const modalTitle = document.getElementById('modal-title');
const warningBanner = document.getElementById('firebase-warning');

// State
let questions = [];
let editingId = null;

// Initialize
async function init() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is logged in, fetch questions
            try {
                await fetchQuestions();
            } catch (e) {
                console.error("Firebase Initialization Error:", e);
                loadingState.style.display = 'none';
                warningBanner.style.display = 'block';
                if(e.message.includes("API key")) {
                    warningBanner.innerHTML = `<h3 style="margin-top:0;">Firebase API Key Missing!</h3><p style="margin-bottom:0;">Please update <code>js/firebase-config.js</code> with your actual Firebase configuration.</p>`;
                } else if(e.message.includes("Missing or insufficient permissions")) {
                    warningBanner.innerHTML = `<h3 style="margin-top:0;">Access Denied!</h3><p style="margin-bottom:0;">You are logged in, but you do not have Admin permissions to view or edit the database.</p>`;
                }
            }
        } else {
            // Not logged in
            loadingState.style.display = 'none';
            warningBanner.style.display = 'block';
            warningBanner.innerHTML = `<h3 style="margin-top:0;">Authentication Required</h3><p style="margin-bottom:0;">You must <a href="/index.html#screen-auth" style="color:var(--primary); font-weight:bold;">Log In</a> to access the Admin Dashboard.</p>`;
            questionsList.innerHTML = '';
        }
    });
}

// Fetch all questions from Firestore
async function fetchQuestions() {
    loadingState.style.display = 'block';
    questionsList.innerHTML = '';
    
    const querySnapshot = await getDocs(collection(db, QUESTIONS_COLLECTION));
    questions = [];
    querySnapshot.forEach((doc) => {
        questions.push({ id: doc.id, ...doc.data() });
    });
    
    renderQuestions();
    loadingState.style.display = 'none';
}

// Render the UI
function renderQuestions() {
    if (questions.length === 0) {
        questionsList.innerHTML = `<div style="text-align: center; padding: 40px; background: white; border-radius: 12px; color: #757575;">No questions found. Add one to get started!</div>`;
        return;
    }

    questionsList.innerHTML = questions.map(q => `
        <div class="question-card">
            <div class="question-header">
                <div>
                    <div class="badges" style="margin-bottom: 8px;">
                        <span class="badge">${q.subject}</span>
                        <span class="badge">Class ${q.class}</span>
                        ${q.isPro ? '<span class="badge badge-pro"><i class="ph-fill ph-lightning"></i> PRO</span>' : ''}
                    </div>
                    <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 4px;">${q.chapter}</div>
                    <div style="color: #424242;">${q.text}</div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-outline" onclick="editQuestion('${q.id}')" style="padding: 8px;"><i class="ph-bold ph-pencil-simple"></i> Edit</button>
                    <button class="btn btn-danger" onclick="deleteQuestion('${q.id}')" style="padding: 8px;"><i class="ph-bold ph-trash"></i></button>
                </div>
            </div>
            <div class="options-grid">
                ${q.options.map((opt, idx) => `
                    <div class="option-item ${idx === q.correctAnswer ? 'correct' : ''}">
                        ${idx === q.correctAnswer ? '<i class="ph-bold ph-check-circle"></i> ' : ''}${opt}
                    </div>
                `).join('')}
            </div>
            <div style="background: #FFFDE7; padding: 12px; border-radius: 8px; font-size: 0.9rem; border-left: 4px solid #FBC02D; margin-top: 8px;">
                <strong>Explanation:</strong> ${q.explanation}
                ${q.ncertRef ? `<br><small style="color:#757575; display:block; margin-top:4px;"><i class="ph-bold ph-book"></i> Ref: ${q.ncertRef}</small>` : ''}
            </div>
        </div>
    `).join('');
}

// Save (Add or Update)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnSave = document.getElementById('btn-save-question');
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Saving...';
    btnSave.disabled = true;

    try {
        const questionData = {
            subject: document.getElementById('q-subject').value,
            class: parseInt(document.getElementById('q-class').value),
            chapter: document.getElementById('q-chapter').value,
            text: document.getElementById('q-text').value,
            options: [
                document.getElementById('q-opt0').value,
                document.getElementById('q-opt1').value,
                document.getElementById('q-opt2').value,
                document.getElementById('q-opt3').value
            ],
            correctAnswer: parseInt(document.querySelector('input[name="q-correct"]:checked').value),
            explanation: document.getElementById('q-explanation').value,
            ncertRef: document.getElementById('q-ncert').value,
            isPro: document.getElementById('q-ispro').checked,
            updatedAt: new Date().toISOString()
        };

        if (editingId) {
            // Update existing
            const docRef = doc(db, QUESTIONS_COLLECTION, editingId);
            await updateDoc(docRef, questionData);
        } else {
            // Add new
            questionData.createdAt = new Date().toISOString();
            await addDoc(collection(db, QUESTIONS_COLLECTION), questionData);
        }

        closeModal();
        await fetchQuestions();
    } catch (err) {
        console.error("Error saving document: ", err);
        alert("Failed to save. Did you setup Firebase and Firestore permissions correctly?");
    } finally {
        btnSave.innerHTML = originalText;
        btnSave.disabled = false;
    }
});

// Delete
window.deleteQuestion = async (id) => {
    if (confirm("Are you sure you want to delete this question?")) {
        try {
            await deleteDoc(doc(db, QUESTIONS_COLLECTION, id));
            await fetchQuestions();
        } catch (err) {
            console.error("Error deleting document: ", err);
            alert("Failed to delete.");
        }
    }
};

// Edit (Populate Form)
window.editQuestion = (id) => {
    const q = questions.find(q => q.id === id);
    if (!q) return;

    editingId = id;
    modalTitle.textContent = "Edit Question";
    
    document.getElementById('q-subject').value = q.subject;
    document.getElementById('q-class').value = q.class;
    document.getElementById('q-chapter').value = q.chapter;
    document.getElementById('q-text').value = q.text;
    
    document.getElementById('q-opt0').value = q.options[0];
    document.getElementById('q-opt1').value = q.options[1];
    document.getElementById('q-opt2').value = q.options[2];
    document.getElementById('q-opt3').value = q.options[3];
    
    document.querySelector(`input[name="q-correct"][value="${q.correctAnswer}"]`).checked = true;
    
    document.getElementById('q-explanation').value = q.explanation;
    document.getElementById('q-ncert').value = q.ncertRef || '';
    document.getElementById('q-ispro').checked = q.isPro || false;

    modal.classList.add('active');
};

// Modal Handling
btnAdd.addEventListener('click', () => {
    editingId = null;
    modalTitle.textContent = "Add New Question";
    form.reset();
    document.querySelector('input[name="q-correct"][value="0"]').checked = true;
    modal.classList.add('active');
});

function closeModal() {
    modal.classList.remove('active');
    form.reset();
}

btnClose.addEventListener('click', closeModal);
btnCancel.addEventListener('click', closeModal);

// Start
init();
