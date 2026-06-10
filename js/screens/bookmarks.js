/**
 * Bookmarks Screen Logic
 */

export function initBookmarks() {
    // This function will be called to initialize the bookmarks screen
    renderBookmarks();
}

export function renderBookmarks() {
    const list = document.getElementById('bookmarks-list');
    const emptyState = document.getElementById('bookmarks-empty-state');
    
    if (!list || !emptyState) return;
    
    // In a real app, we would fetch from Firebase.
    // For now, check local storage or show empty.
    const bookmarks = JSON.parse(localStorage.getItem('examforge_bookmarks') || '[]');
    
    if (bookmarks.length === 0) {
        emptyState.style.display = 'block';
        list.innerHTML = '';
        return;
    }
    
    emptyState.style.display = 'none';
    list.innerHTML = bookmarks.map(b => `
        <div class="card p-3 border">
            <div class="text-small text-primary font-weight-bold mb-1">${b.subject} • ${b.chapter}</div>
            <p class="mb-2">${b.text}</p>
            <div class="text-small text-success">Answer: Option ${b.correctAnswer + 1}</div>
        </div>
    `).join('');
}
