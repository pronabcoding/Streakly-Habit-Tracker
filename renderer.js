// ===== Streakly – Electron Habit Tracker (Renderer) =====

const THEME_KEY = 'streakly_theme';

// DOM
const habitList = document.getElementById('habitList');
const emptyState = document.getElementById('emptyState');
const addHabitBtn = document.getElementById('addHabitBtn');
const emptyAddBtn = document.getElementById('emptyAddBtn');
const themeToggle = document.getElementById('themeToggle');
const modal = document.getElementById('modal');
const confirmModal = document.getElementById('confirmModal');
const habitForm = document.getElementById('habitForm');
const habitNameInput = document.getElementById('habitName');
const modalTitle = document.getElementById('modalTitle');
const saveBtn = document.getElementById('saveBtn');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const colorPicker = document.getElementById('colorPicker');
const todayDateEl = document.getElementById('todayDate');
const statTotal = document.getElementById('statTotal');
const statToday = document.getElementById('statToday');
const statBest = document.getElementById('statBest');

// State
let habits = [];
let editingId = null;
let deletingId = null;
let selectedColor = '#22c55e';

// ===== Helpers =====
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDisplayDate(date = new Date()) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function getDayLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);
}

function calcStreak(completions) {
  if (!completions || completions.length === 0) return 0;

  const sorted = [...completions].sort().reverse();
  const today = todayStr();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  let expected = new Date(sorted[0] + 'T12:00:00');

  for (let i = 1; i < sorted.length; i++) {
    expected.setDate(expected.getDate() - 1);
    const expectedStr = expected.toISOString().slice(0, 10);
    if (sorted[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function calcBestStreak(completions) {
  if (!completions || completions.length === 0) return 0;
  const sorted = [...completions].sort();
  let best = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T12:00:00');
    const curr = new Date(sorted[i] + 'T12:00:00');
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}

// ===== Data (via Electron IPC → Node.js fs) =====
async function loadHabits() {
  try {
    habits = await window.api.loadHabits();
    if (!Array.isArray(habits)) habits = [];
  } catch (err) {
    console.error('Failed to load habits:', err);
    habits = [];
  }
}

async function saveHabits() {
  try {
    await window.api.saveHabits(habits);
  } catch (err) {
    console.error('Failed to save habits:', err);
  }
}

// ===== Theme (still uses localStorage – simple & fine) =====
function loadTheme() {
  if (localStorage.getItem(THEME_KEY) === 'dark') {
    document.body.classList.add('dark');
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem(
    THEME_KEY,
    document.body.classList.contains('dark') ? 'dark' : 'light'
  );
}

// ===== CRUD =====
async function addHabit(name, color) {
  habits.push({
    id: Date.now().toString(),
    name: name.trim(),
    color,
    completions: [],
    createdAt: new Date().toISOString()
  });
  await saveHabits();
  render();
}

async function updateHabit(id, name, color) {
  const h = habits.find((x) => x.id === id);
  if (h) {
    h.name = name.trim();
    h.color = color;
    await saveHabits();
    render();
  }
}

async function deleteHabit(id) {
  habits = habits.filter((x) => x.id !== id);
  await saveHabits();
  render();
}

async function toggleToday(id) {
  const h = habits.find((x) => x.id === id);
  if (!h) return;
  const today = todayStr();
  const idx = h.completions.indexOf(today);
  if (idx === -1) {
    h.completions.push(today);
  } else {
    h.completions.splice(idx, 1);
  }
  await saveHabits();
  render();
}

// ===== Render =====
function render() {
  habitList.innerHTML = '';

  if (habits.length === 0) {
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
    const sorted = [...habits].sort((a, b) => {
      const aDone = a.completions.includes(todayStr());
      const bDone = b.completions.includes(todayStr());
      if (aDone !== bDone) return aDone ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    sorted.forEach((h) => habitList.appendChild(createHabitCard(h)));
  }

  updateStats();
}

function createHabitCard(habit) {
  const today = todayStr();
  const isDone = habit.completions.includes(today);
  const streak = calcStreak(habit.completions);
  const last7 = getLast7Days();

  const card = document.createElement('div');
  card.className = 'habit-card' + (isDone ? ' done-today' : '');
  card.style.setProperty('--habit-color', habit.color);

  const top = document.createElement('div');
  top.className = 'habit-top';

  const check = document.createElement('button');
  check.className = 'habit-check' + (isDone ? ' checked' : '');
  check.innerHTML = isDone ? '✓' : '';
  check.title = isDone ? 'Mark incomplete' : 'Mark complete';
  check.addEventListener('click', () => toggleToday(habit.id));

  const info = document.createElement('div');
  info.className = 'habit-info';

  const name = document.createElement('div');
  name.className = 'habit-name';
  name.textContent = habit.name;

  const meta = document.createElement('div');
  meta.className = 'habit-meta';

  const streakEl = document.createElement('span');
  streakEl.className = 'streak-badge';
  streakEl.innerHTML = `🔥 ${streak} day${streak !== 1 ? 's' : ''}`;

  const best = calcBestStreak(habit.completions);
  const bestEl = document.createElement('span');
  bestEl.textContent = `Best: ${best}`;

  meta.appendChild(streakEl);
  meta.appendChild(bestEl);

  info.appendChild(name);
  info.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'habit-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'action-btn edit';
  editBtn.title = 'Edit';
  editBtn.textContent = '✏️';
  editBtn.addEventListener('click', () => openEditModal(habit));

  const delBtn = document.createElement('button');
  delBtn.className = 'action-btn delete';
  delBtn.title = 'Delete';
  delBtn.textContent = '🗑️';
  delBtn.addEventListener('click', () => openDeleteModal(habit.id));

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  top.appendChild(check);
  top.appendChild(info);
  top.appendChild(actions);

  // Week dots
  const week = document.createElement('div');
  week.className = 'week-dots';

  last7.forEach((date) => {
    const day = document.createElement('div');
    day.className = 'day-dot';

    const label = document.createElement('span');
    label.className = 'day-label';
    label.textContent = getDayLabel(date);

    const dot = document.createElement('div');
    dot.className = 'dot';
    if (habit.completions.includes(date)) dot.classList.add('filled');
    if (date === today) dot.classList.add('today');

    day.appendChild(label);
    day.appendChild(dot);
    week.appendChild(day);
  });

  card.appendChild(top);
  card.appendChild(week);
  return card;
}

function updateStats() {
  const today = todayStr();
  statTotal.textContent = habits.length;
  statToday.textContent = habits.filter((h) => h.completions.includes(today)).length;

  let best = 0;
  habits.forEach((h) => {
    best = Math.max(best, calcBestStreak(h.completions));
  });
  statBest.textContent = best;
}

// ===== Modal =====
function openAddModal() {
  editingId = null;
  modalTitle.textContent = 'Add Habit';
  saveBtn.textContent = 'Save Habit';
  habitNameInput.value = '';
  selectedColor = '#22c55e';
  updateColorSelection();
  modal.classList.remove('hidden');
  habitNameInput.focus();
}

function openEditModal(habit) {
  editingId = habit.id;
  modalTitle.textContent = 'Edit Habit';
  saveBtn.textContent = 'Update Habit';
  habitNameInput.value = habit.name;
  selectedColor = habit.color;
  updateColorSelection();
  modal.classList.remove('hidden');
  habitNameInput.focus();
}

function closeModalFn() {
  modal.classList.add('hidden');
  editingId = null;
}

function openDeleteModal(id) {
  deletingId = id;
  confirmModal.classList.remove('hidden');
}

function closeDeleteModal() {
  confirmModal.classList.add('hidden');
  deletingId = null;
}

function updateColorSelection() {
  colorPicker.querySelectorAll('.color-option').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.color === selectedColor);
  });
}

// ===== Events =====
function setupEvents() {
  addHabitBtn.addEventListener('click', openAddModal);
  emptyAddBtn.addEventListener('click', openAddModal);
  themeToggle.addEventListener('click', toggleTheme);
  closeModal.addEventListener('click', closeModalFn);
  cancelBtn.addEventListener('click', closeModalFn);

  modal.querySelector('.modal-backdrop').addEventListener('click', closeModalFn);
  confirmModal.querySelector('.modal-backdrop').addEventListener('click', closeDeleteModal);

  cancelDelete.addEventListener('click', closeDeleteModal);
  confirmDeleteBtn.addEventListener('click', async () => {
    if (deletingId) {
      await deleteHabit(deletingId);
      closeDeleteModal();
    }
  });

  colorPicker.addEventListener('click', (e) => {
    const btn = e.target.closest('.color-option');
    if (btn) {
      selectedColor = btn.dataset.color;
      updateColorSelection();
    }
  });

  habitForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = habitNameInput.value.trim();
    if (!name) return;

    if (editingId) {
      await updateHabit(editingId, name, selectedColor);
    } else {
      await addHabit(name, selectedColor);
    }
    closeModalFn();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModalFn();
      closeDeleteModal();
    }
  });
}

// ===== Init =====
async function init() {
  loadTheme();
  await loadHabits();
  todayDateEl.textContent = formatDisplayDate();
  setupEvents();
  render();
}

init();
