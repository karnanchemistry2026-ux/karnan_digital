// js/screens/leaderboard.js — ExamForge Leaderboard (Global / Device / History)

import { store } from '../utils/storage.js';
import { MOCK_LEADERBOARD } from '../data/leaderboard-data.js';

let activeTab = 'global';

export function initLeaderboard() {
  activeTab = 'global';

  wireTabButtons();
  renderTab();
}

function wireTabButtons() {
  const globalTab = document.getElementById('lb-tab-global');
  const deviceTab = document.getElementById('lb-tab-device');
  const historyTab = document.getElementById('lb-tab-history');

  [globalTab, deviceTab, historyTab].forEach(tab => {
    if (!tab) return;
    tab.addEventListener('click', () => {
      [globalTab, deviceTab, historyTab].forEach(t => { if (t) t.classList.remove('active'); });
      tab.classList.add('active');
      activeTab = tab.id.replace('lb-tab-', '');
      renderTab();
    });
  });

  // Set initial active state
  if (globalTab) globalTab.classList.add('active');
}

function renderTab() {
  const content = document.getElementById('lb-content');
  if (!content) return;

  switch (activeTab) {
    case 'global': renderGlobalTab(content); break;
    case 'device': renderDeviceTab(content); break;
    case 'history': renderHistoryTab(content); break;
  }
}

// ── Global Tab ──
function renderGlobalTab(container) {
  if (!MOCK_LEADERBOARD || MOCK_LEADERBOARD.length === 0) {
    container.innerHTML = '<p class="empty-msg">No leaderboard data available.</p>';
    return;
  }

  const rankBadge = (rank) => {
    if (rank === 1) return '<span class="rank-badge gold"><i class="ph-fill ph-medal text-warning"></i></span>';
    if (rank === 2) return '<span class="rank-badge silver"><i class="ph-fill ph-medal text-muted"></i></span>';
    if (rank === 3) return '<span class="rank-badge bronze"><i class="ph-fill ph-medal text-error"></i></span>';
    return `<span class="rank-num">${rank}</span>`;
  };

  container.innerHTML = `
    <div class="lb-table-wrap">
      <table class="lb-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Score</th>
            <th>Accuracy</th>
          </tr>
        </thead>
        <tbody>
          ${MOCK_LEADERBOARD.map(entry => `
            <tr class="${entry.rank <= 3 ? 'top-rank' : ''}">
              <td>${rankBadge(entry.rank)}</td>
              <td class="lb-name">${entry.name}</td>
              <td class="lb-score">${entry.score}/${entry.total}</td>
              <td>
                <div class="lb-acc-bar-container">
                  <div class="lb-acc-bar" style="width:${entry.accuracy}%"></div>
                  <span class="lb-acc-text">${entry.accuracy}%</span>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ── Device Tab (local test history sorted by score) ──
function renderDeviceTab(container) {
  const history = store.getTestHistory();

  if (history.length === 0) {
    container.innerHTML = '<p class="empty-msg">No local tests taken yet. Take a mock test to see your scores here!</p>';
    return;
  }

  // Sort by NEET score descending
  const sorted = [...history].sort((a, b) => (b.score || 0) - (a.score || 0));

  const rankBadge = (rank) => {
    if (rank === 1) return '<span class="rank-badge gold"><i class="ph-fill ph-medal text-warning"></i></span>';
    if (rank === 2) return '<span class="rank-badge silver"><i class="ph-fill ph-medal text-muted"></i></span>';
    if (rank === 3) return '<span class="rank-badge bronze"><i class="ph-fill ph-medal text-error"></i></span>';
    return `<span class="rank-num">${rank}</span>`;
  };

  container.innerHTML = `
    <div class="lb-table-wrap">
      <table class="lb-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Score</th>
            <th>Accuracy</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map((entry, i) => `
            <tr class="${i < 3 ? 'top-rank' : ''}">
              <td>${rankBadge(i + 1)}</td>
              <td class="lb-name">${entry.name || 'You'}</td>
              <td class="lb-score">${entry.score || 0}/${entry.maxScore || 0}</td>
              <td>
                <div class="lb-acc-bar-container">
                  <div class="lb-acc-bar" style="width:${entry.accuracy || 0}%"></div>
                  <span class="lb-acc-text">${entry.accuracy || 0}%</span>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ── History Tab (chronological test log) ──
function renderHistoryTab(container) {
  const history = store.getTestHistory();

  if (history.length === 0) {
    container.innerHTML = '<p class="empty-msg">No test history yet.</p>';
    return;
  }

  // Show newest first
  const reversed = [...history].reverse();

  container.innerHTML = `
    <div class="history-list">
      ${reversed.map(entry => {
        const date = entry.date ? new Date(entry.date).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'Unknown';
        const acc = entry.accuracy || 0;

        return `
          <div class="history-card">
            <div class="history-header">
              <span class="history-name">${entry.name || 'Mock Test'}</span>
              <span class="history-date">${date}</span>
            </div>
            <div class="history-stats">
              <span class="history-score">Score: ${entry.score || 0}/${entry.maxScore || 0}</span>
              <span class="history-questions">${entry.total || 0} Questions</span>
            </div>
            <div class="history-acc-bar-container">
              <div class="history-acc-bar" style="width:${acc}%"></div>
              <span class="history-acc-text">${acc}% Accuracy</span>
            </div>
            <div class="history-breakdown">
              <span class="hb-correct"><i class="ph-fill ph-check-circle text-success"></i> ${entry.correct || 0}</span>
              <span class="hb-wrong"><i class="ph-fill ph-x-circle text-error"></i> ${entry.wrong || 0}</span>
              <span class="hb-skipped"><i class="ph-fill ph-fast-forward text-muted"></i> ${entry.skipped || 0}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
