const STORAGE_KEY = 'business_english_logs';
const CHECKLIST_KEY = 'business_english_checklist';

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('studyDate').value = today;
  renderLogs();
  updateStats();
  loadChecklist();
  attachChecklistListeners();
});

// ===== Save Log =====
function saveLog() {
  const date = document.getElementById('studyDate').value;
  const minutes = parseInt(document.getElementById('studyMinutes').value);
  const note = document.getElementById('studyNote').value.trim();
  const skills = Array.from(document.querySelectorAll('input[name="skill"]:checked'))
    .map(el => el.value);

  if (!date) { alert('日付を選択してください。'); return; }
  if (!minutes || minutes < 1) { alert('学習時間を入力してください。'); return; }

  const logs = getLogs();
  logs.unshift({ date, minutes, skills, note, id: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));

  // Reset form
  document.getElementById('studyMinutes').value = '';
  document.getElementById('studyNote').value = '';
  document.querySelectorAll('input[name="skill"]').forEach(el => el.checked = false);

  renderLogs();
  updateStats();
}

// ===== Get Logs =====
function getLogs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

// ===== Render Logs =====
function renderLogs() {
  const logs = getLogs();
  const container = document.getElementById('logList');

  if (logs.length === 0) {
    container.innerHTML = '<p class="empty-state">まだ記録がありません。上のフォームから学習を記録しましょう！</p>';
    return;
  }

  const skillLabels = {
    vocab: '単語・表現', email: 'メール', meeting: '会議・電話',
    presentation: 'プレゼン', negotiation: '交渉・依頼', listening: 'リスニング'
  };

  container.innerHTML = logs.slice(0, 30).map(log => {
    const skillTags = log.skills.map(s =>
      `<span style="background:#dbeafe;color:#1d4ed8;padding:.15rem .5rem;border-radius:20px;font-size:.75rem;font-weight:600">${skillLabels[s] || s}</span>`
    ).join(' ');

    return `
      <div class="log-entry">
        <div class="log-date">${log.date}</div>
        <div class="log-meta">
          <span>⏱ ${log.minutes}分</span>
          ${skillTags}
        </div>
        ${log.note ? `<div class="log-note">${escapeHtml(log.note)}</div>` : ''}
      </div>`;
  }).join('');
}

// ===== Update Stats =====
function updateStats() {
  const logs = getLogs();
  if (logs.length === 0) return;

  const totalDays = new Set(logs.map(l => l.date)).size;
  const totalMinutes = logs.reduce((sum, l) => sum + (l.minutes || 0), 0);

  // Streak
  const dates = [...new Set(logs.map(l => l.date))].sort().reverse();
  let streak = 0;
  let current = new Date();
  for (const dateStr of dates) {
    const d = new Date(dateStr);
    const diff = Math.round((current - d) / 86400000);
    if (diff <= 1) { streak++; current = d; }
    else break;
  }

  // Weekly progress (goal: 7 days a week)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekDates = new Set(
    logs.filter(l => new Date(l.date) >= weekAgo).map(l => l.date)
  );
  const weeklyPct = Math.round((weekDates.size / 7) * 100);

  document.getElementById('totalDays').textContent = totalDays;
  document.getElementById('currentStreak').textContent = streak;
  document.getElementById('weeklyProgress').textContent = weeklyPct + '%';
  document.getElementById('totalMinutes').textContent = totalMinutes;
}

// ===== Checklist =====
function loadChecklist() {
  const saved = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || '{}');
  document.querySelectorAll('.check-item input[data-id]').forEach(el => {
    if (saved[el.dataset.id]) {
      el.checked = true;
      el.closest('.check-item').classList.add('done');
    }
  });
}

function attachChecklistListeners() {
  document.querySelectorAll('.check-item input[data-id]').forEach(el => {
    el.addEventListener('change', () => {
      const saved = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || '{}');
      if (el.checked) {
        saved[el.dataset.id] = true;
        el.closest('.check-item').classList.add('done');
      } else {
        delete saved[el.dataset.id];
        el.closest('.check-item').classList.remove('done');
      }
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(saved));
    });
  });
}

function showChecklist(id) {
  document.querySelectorAll('.checklist-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.checklist-tabs .tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  event.target.classList.add('active');
}

// ===== Clear Logs =====
function clearAllLogs() {
  if (confirm('全ての学習履歴を削除しますか？この操作は元に戻せません。')) {
    localStorage.removeItem(STORAGE_KEY);
    renderLogs();
    updateStats();
  }
}

// ===== Utility =====
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
