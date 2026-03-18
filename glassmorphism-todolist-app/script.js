// Selectors
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const itemsLeft = document.getElementById('items-left');
const clearCompletedBtn = document.getElementById('clear-completed');
const dateDisplay = document.getElementById('date-display');
const themeToggleBtn = document.querySelector('.theme-toggle-btn');

// State
let todos = [];
let currentFilter = 'all';
let timerInterval = null;
let activeTodoId = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    displayDate();
    loadTodos();
    loadTheme();
});
addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo(e);
});
filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => setFilter(e.target.dataset.filter));
});
clearCompletedBtn.addEventListener('click', clearCompleted);
themeToggleBtn.addEventListener('click', toggleTheme);

// Functions

function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
}

function displayDate() {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const today = new Date();
    dateDisplay.textContent = today.toLocaleDateString('id-ID', options);
}

function loadTodos() {
    if (localStorage.getItem('todos')) {
        todos = JSON.parse(localStorage.getItem('todos'));
        // Ensure all timers are off on load
        todos = todos.map(todo => ({ ...todo, timerRunning: false }));
    }
    renderTodos();
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function addTodo(e) {
    if (e) e.preventDefault();
    const text = todoInput.value.trim();
    if (text === '') return;

    const newTodo = {
        id: Date.now(),
        text: text,
        completed: false,
        elapsedTime: 0,
        timerRunning: false
    };

    todos.push(newTodo);
    todoInput.value = '';
    saveTodos();
    renderTodos();
}

function deleteTodo(id) {
    if (activeTodoId === id) stopTimer();
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
}

function toggleComplete(id) {
    todos = todos.map(todo => {
        if (todo.id === id) {
            const isCompleted = !todo.completed;
            if (isCompleted && todo.timerRunning) {
                stopTimer();
                return { ...todo, completed: isCompleted, timerRunning: false };
            }
            return { ...todo, completed: isCompleted };
        }
        return todo;
    });
    saveTodos();
    renderTodos();
}

function toggleTimer(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo || todo.completed) return;

    if (todo.timerRunning) {
        stopTimer();
    } else {
        // Stop current active timer if any
        if (activeTodoId) stopTimer();

        // Start new timer
        activeTodoId = id;
        const todoIndex = todos.findIndex(t => t.id === id);
        todos[todoIndex].timerRunning = true;

        timerInterval = setInterval(() => {
            const currentTodo = todos.find(t => t.id === activeTodoId);
            if (currentTodo) {
                currentTodo.elapsedTime++;
                updateTimerDisplay(activeTodoId, currentTodo.elapsedTime);
                saveTodos();
            }
        }, 1000);
    }
    renderTodos();
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (activeTodoId) {
        const todoIndex = todos.findIndex(t => t.id === activeTodoId);
        if (todoIndex !== -1) {
            todos[todoIndex].timerRunning = false;
        }
        activeTodoId = null;
    }
    saveTodos();
}

function updateTimerDisplay(id, seconds) {
    const timerElem = document.querySelector(`.todo-item[data-id="${id}"] .timer-display`);
    if (timerElem) {
        timerElem.textContent = formatTime(seconds);
    }
}

function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function clearCompleted() {
    todos = todos.filter(todo => !todo.completed);
    saveTodos();
    renderTodos();
}

function setFilter(filter) {
    currentFilter = filter;

    filterBtns.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    renderTodos();
}

function renderTodos() {
    todoList.innerHTML = '';

    let filteredTodos = todos;
    if (currentFilter === 'active') {
        filteredTodos = todos.filter(todo => !todo.completed);
    } else if (currentFilter === 'completed') {
        filteredTodos = todos.filter(todo => todo.completed);
    }

    filteredTodos.forEach(todo => {
        const todoDiv = document.createElement('li');
        todoDiv.classList.add('todo-item');
        todoDiv.setAttribute('data-id', todo.id);
        if (todo.completed) todoDiv.classList.add('completed');
        if (todo.timerRunning) todoDiv.classList.add('timer-active');

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.classList.add('checkbox');
        checkbox.addEventListener('change', () => toggleComplete(todo.id));

        // Text
        const textSpan = document.createElement('span');
        textSpan.innerText = todo.text;
        textSpan.classList.add('todo-text');

        // Timer Container
        const timerContainer = document.createElement('div');
        timerContainer.classList.add('timer-container');

        const timerDisplay = document.createElement('span');
        timerDisplay.classList.add('timer-display');
        timerDisplay.textContent = formatTime(todo.elapsedTime);

        const timerBtn = document.createElement('button');
        timerBtn.classList.add('timer-btn');
        timerBtn.innerHTML = todo.timerRunning ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        timerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTimer(todo.id);
        });

        timerContainer.appendChild(timerDisplay);
        if (!todo.completed) {
            timerContainer.appendChild(timerBtn);
        }

        // Delete Button
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.classList.add('delete-btn');
        deleteButton.addEventListener('click', () => {
            todoDiv.classList.add('fall');
            todoDiv.addEventListener('transitionend', () => {
                deleteTodo(todo.id);
            });
        });

        todoDiv.appendChild(checkbox);
        todoDiv.appendChild(textSpan);
        todoDiv.appendChild(timerContainer);
        todoDiv.appendChild(deleteButton);

        todoList.appendChild(todoDiv);
    });

    updateItemsLeft();
}

function updateItemsLeft() {
    const activeCount = todos.filter(todo => !todo.completed).length;
    itemsLeft.innerText = `${activeCount} tugas tersisa`;
}
