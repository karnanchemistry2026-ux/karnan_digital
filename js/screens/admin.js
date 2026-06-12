import { CHAPTERS as localChapters } from '../data/chapters.js';
import { QUESTIONS as localQuestions } from '../data/questions.js';
import { db } from '../firebase-config.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let adminChapters = [];
let adminQuestions = [];

export async function initAdmin() {
    const chapterListEl = document.getElementById('admin-chapter-list');
    const questionListEl = document.getElementById('admin-question-list');
    
    if (chapterListEl) chapterListEl.innerHTML = '<div style="padding:20px; text-align:center;">Loading...</div>';
    if (questionListEl) questionListEl.innerHTML = '<div style="padding:20px; text-align:center;">Loading...</div>';

    // Wire up ADD buttons
    const addChBtn = document.getElementById('admin-add-chapter-btn');
    const addQBtn = document.getElementById('admin-add-question-btn');
    if (addChBtn) addChBtn.onclick = () => handleAddChapter();
    if (addQBtn) addQBtn.onclick = () => handleAddQuestion();

    await fetchAdminData();
    renderChapters(chapterListEl);
    renderQuestions(questionListEl);
}

async function fetchAdminData() {
    adminChapters = [];
    adminQuestions = [];
    try {
        const chaptersSnap = await getDocs(collection(db, "chapters"));
        chaptersSnap.forEach(d => adminChapters.push({ docId: d.id, ...d.data() }));

        const qSnap = await getDocs(collection(db, "questions"));
        qSnap.forEach(d => adminQuestions.push({ docId: d.id, ...d.data() }));

        // Fallback to local if empty
        if (adminChapters.length === 0) {
            console.log("No chapters in Firestore, using local.");
            adminChapters = [...localChapters];
            // Optionally, seed Firebase here, but we will let admin do it
        }
        if (adminQuestions.length === 0) {
            console.log("No questions in Firestore, using local.");
            adminQuestions = [...localQuestions];
        }

        const chapterCountEl = document.getElementById('admin-chapter-count');
        const questionCountEl = document.getElementById('admin-question-count');
        if (chapterCountEl) chapterCountEl.textContent = adminChapters.length;
        if (questionCountEl) questionCountEl.textContent = adminQuestions.length;

    } catch (e) {
        console.error("Error fetching admin data:", e);
        adminChapters = [...localChapters];
        adminQuestions = [...localQuestions];
    }
}

function renderChapters(container) {
    if(!container) return;
    container.innerHTML = '';
    adminChapters.forEach((ch, index) => {
        const item = document.createElement('div');
        item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:12px; border:1px solid #E5E7EB; border-radius:8px;';
        item.innerHTML = `
            <div>
                <div style="font-weight:600; color:#1E1B4B; font-size:0.95rem;">${ch.name}</div>
                <div style="font-size:0.8rem; color:#6B7280;">${ch.subject} | Class ${ch.class} | ID: ${ch.id || 'N/A'}</div>
            </div>
            <div style="display:flex; gap:8px;">
                <button class="btn btn-sm" style="background:#F3F4F6; border:none; padding:6px; border-radius:6px; cursor:pointer;" onclick="window.adminEditChapter(${index})"><i class="ph-bold ph-pencil" style="color:#4B5563;"></i></button>
                <button class="btn btn-sm" style="background:#FEE2E2; border:none; padding:6px; border-radius:6px; cursor:pointer;" onclick="window.adminDeleteChapter(${index})"><i class="ph-bold ph-trash" style="color:#EF4444;"></i></button>
            </div>
        `;
        container.appendChild(item);
    });
}

function renderQuestions(container) {
    if(!container) return;
    container.innerHTML = '';
    // Show only first 10 for performance in this demo
    adminQuestions.slice(0, 10).forEach((q, index) => {
        const item = document.createElement('div');
        item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:12px; border:1px solid #E5E7EB; border-radius:8px;';
        item.innerHTML = `
            <div style="flex:1; margin-right:12px; overflow:hidden;">
                <div style="font-weight:600; color:#1E1B4B; font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:250px;">${q.text}</div>
                <div style="font-size:0.8rem; color:#6B7280;">Ch: ${q.chapter} | Pro: ${q.isPro ? 'Yes' : 'No'}</div>
            </div>
            <div style="display:flex; gap:8px;">
                <button class="btn btn-sm" style="background:#F3F4F6; border:none; padding:6px; border-radius:6px; cursor:pointer;" onclick="window.adminEditQuestion(${index})"><i class="ph-bold ph-pencil" style="color:#4B5563;"></i></button>
                <button class="btn btn-sm" style="background:#FEE2E2; border:none; padding:6px; border-radius:6px; cursor:pointer;" onclick="window.adminDeleteQuestion(${index})"><i class="ph-bold ph-trash" style="color:#EF4444;"></i></button>
            </div>
        `;
        container.appendChild(item);
    });
    
    if(adminQuestions.length > 10) {
        const more = document.createElement('div');
        more.style.cssText = 'text-align:center; padding:8px; font-size:0.85rem; color:#6B7280; font-weight:600;';
        more.textContent = `...and ${adminQuestions.length - 10} more questions`;
        container.appendChild(more);
    }
}

// Global functions for the inline onclick handlers
window.adminEditChapter = async (index) => {
    const ch = adminChapters[index];
    const newName = prompt("Edit Chapter Name:", ch.name);
    if (!newName) return;
    
    if (ch.docId) {
        await updateDoc(doc(db, "chapters", ch.docId), { name: newName });
    } else {
        alert("This is a local static chapter. Please 'Add' a new one instead.");
        return;
    }
    await initAdmin();
};

window.adminDeleteChapter = async (index) => {
    const ch = adminChapters[index];
    if (confirm(`Delete chapter "${ch.name}"?`)) {
        if (ch.docId) {
            await deleteDoc(doc(db, "chapters", ch.docId));
        }
        await initAdmin();
    }
};

window.handleAddChapter = async () => {
    const name = prompt("New Chapter Name:");
    if (!name) return;
    const subject = prompt("Subject (Physics/Chemistry/Biology):", "Physics");
    const classNum = prompt("Class (11/12):", "11");
    
    await addDoc(collection(db, "chapters"), {
        id: `custom_${Date.now()}`,
        name: name,
        subject: subject,
        class: parseInt(classNum, 10)
    });
    await initAdmin();
};

window.adminEditQuestion = async (index) => {
    const q = adminQuestions[index];
    const newText = prompt("Edit Question Text:", q.text);
    if (!newText) return;
    
    if (q.docId) {
        await updateDoc(doc(db, "questions", q.docId), { text: newText });
    } else {
        alert("This is a local static question. Please 'Add' a new one instead.");
        return;
    }
    await initAdmin();
};

window.adminDeleteQuestion = async (index) => {
    const q = adminQuestions[index];
    if (confirm(`Delete this question?`)) {
        if (q.docId) {
            await deleteDoc(doc(db, "questions", q.docId));
        }
        await initAdmin();
    }
};

window.handleAddQuestion = async () => {
    const text = prompt("Question Text:");
    if (!text) return;
    const subject = prompt("Subject (Physics/Chemistry/Biology):", "Physics");
    const chapter = prompt("Chapter Name:", "Kinematics");
    const isPro = confirm("Is this a PRO only question?");
    
    await addDoc(collection(db, "questions"), {
        id: `q_custom_${Date.now()}`,
        subject: subject,
        class: 11,
        chapter: chapter,
        text: text,
        options: ["Opt 1", "Opt 2", "Opt 3", "Opt 4"],
        correctAnswer: 0,
        explanation: "Custom explanation",
        isPro: isPro
    });
    await initAdmin();
};
