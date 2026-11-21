const STORAGE_KEY = 'my-todo-list';
const THEME_KEY = 'my-todo-theme';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const remainingCount = document.getElementById('remaining-count');
const storageMessage = document.getElementById('storage-message');
const filterButtons = document.querySelectorAll('.btn-filter');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeLabel = document.getElementById('theme-label');
let currentFilter = 'all';

// 讀取並檢查已儲存的資料，避免損壞資料影響清單。
function loadTodos() {
  try {
    const savedTodos = localStorage.getItem(STORAGE_KEY);
    if (!savedTodos) return [];

    const parsedTodos = JSON.parse(savedTodos);
    if (!Array.isArray(parsedTodos)) {
      throw new Error('待辦資料格式不正確。');
    }

    return parsedTodos.filter((todo) =>
      todo &&
      typeof todo.id === 'string' &&
      typeof todo.text === 'string' &&
      typeof todo.completed === 'boolean'
    );
  } catch (error) {
    showStorageMessage('無法讀取已儲存的待辦事項，請確認瀏覽器儲存空間可用。');
    console.error('讀取待辦事項失敗：', error);
    return [];
  }
}

let todos = loadTodos();

// 套用指定主題，並同步更新切換按鈕。
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;

  const isDark = theme === 'dark';
  themeIcon.textContent = isDark ? '☀️' : '🌙';
  themeLabel.textContent = isDark ? '淺色模式' : '深色模式';
  themeToggle.setAttribute('aria-pressed', String(isDark));
}

// 使用者尚未選擇主題時，依照作業系統設定決定初始外觀。
function initTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    applyTheme(savedTheme === 'light' || savedTheme === 'dark'
      ? savedTheme
      : (prefersDark ? 'dark' : 'light'));
  } catch (error) {
    showStorageMessage('無法讀取主題設定，請確認瀏覽器儲存空間可用。');
    console.error('讀取主題設定失敗：', error);
    applyTheme(prefersDark ? 'dark' : 'light');
  }
}

// 顯示儲存錯誤，避免資料未保存卻沒有通知。
function showStorageMessage(message) {
  storageMessage.textContent = message;
  storageMessage.hidden = false;
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    storageMessage.hidden = true;
  } catch (error) {
    showStorageMessage('無法儲存待辦事項，請確認瀏覽器儲存空間可用。');
    console.error('儲存待辦事項失敗：', error);
  }
}

// 依照篩選條件重繪清單，並更新整份清單的未完成數量。
function renderTodos() {
  list.replaceChildren();

  const visibleTodos = todos.filter((todo) => {
    if (currentFilter === 'active') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true;
  });

  visibleTodos.forEach((todo) => {
    const item = document.createElement('li');
    item.className = todo.completed ? 'todo-item is-completed' : 'todo-item';
    item.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.className = 'todo-checkbox';
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `標記「${todo.text}」為完成`);

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn-delete';
    deleteButton.type = 'button';
    deleteButton.textContent = '刪除';
    deleteButton.setAttribute('aria-label', `刪除「${todo.text}」`);

    item.append(checkbox, text, deleteButton);
    list.append(item);
  });

  emptyState.hidden = visibleTodos.length > 0;
  if (todos.length === 0) {
    emptyState.textContent = '還沒有任何待辦事項,新增一個吧!';
  } else if (currentFilter === 'active') {
    emptyState.textContent = '太棒了,沒有未完成的事項!';
  } else if (currentFilter === 'completed') {
    emptyState.textContent = '還沒有已完成的事項。';
  } else {
    emptyState.textContent = '還沒有任何待辦事項,新增一個吧!';
  }

  remainingCount.textContent = `未完成:${todos.filter((todo) => !todo.completed).length} 項`;
}

// 切換目前的篩選條件。
function setFilter(filter) {
  currentFilter = filter;

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  renderTodos();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  todos.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    completed: false
  });

  saveTodos();
  renderTodos();
  input.value = '';
  input.focus();
});

list.addEventListener('change', (event) => {
  if (!event.target.matches('.todo-checkbox')) return;

  const item = event.target.closest('.todo-item');
  const todo = todos.find((entry) => entry.id === item.dataset.id);
  if (!todo) return;

  todo.completed = event.target.checked;
  saveTodos();
  renderTodos();
});

list.addEventListener('click', (event) => {
  if (!event.target.matches('.btn-delete')) return;

  const item = event.target.closest('.todo-item');
  todos = todos.filter((todo) => todo.id !== item.dataset.id);
  saveTodos();
  renderTodos();
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => setFilter(button.dataset.filter));
});

themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);

  try {
    localStorage.setItem(THEME_KEY, nextTheme);
  } catch (error) {
    showStorageMessage('無法儲存主題設定，請確認瀏覽器儲存空間可用。');
    console.error('儲存主題設定失敗：', error);
  }
});

initTheme();
renderTodos();