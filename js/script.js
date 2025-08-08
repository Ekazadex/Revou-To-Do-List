// Global variables
let todos = [];
let currentFilter = 'all';
let currentSort = 'date-asc';
let notificationTimeout;

// DOM Elements
const notification = document.getElementById('notification');
const notificationTitle = document.getElementById('notificationTitle');
const notificationMessage = document.getElementById('notificationMessage');
const todoInput = document.getElementById('todoInput');
const dateInput = document.getElementById('dateInput');
const timeInput = document.getElementById('timeInput');
const prioritySelect = document.getElementById('prioritySelect');
const addBtn = document.getElementById('addBtn');
const filterBtn = document.getElementById('filterBtn');
const sortBtn = document.getElementById('sortBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const filterDropdown = document.getElementById('filterDropdown');
const sortDropdown = document.getElementById('sortDropdown');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');

// Initialize the app
function initApp() {
    // Load todos from localStorage
    loadTodos();
    
    // Setup event listeners
    setupEventListeners();
    
    // Render initial todos
    renderTodos();
    
    // Start periodic checks
    startPeriodicChecks();
}

// Load todos from localStorage
function loadTodos() {
    const savedTodos = localStorage.getItem('todos');
    todos = savedTodos ? JSON.parse(savedTodos) : [];
}

// Save todos to localStorage
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Set up event listeners
function setupEventListeners() {
    addBtn.addEventListener('click', addTodo);
    filterBtn.addEventListener('click', toggleFilterDropdown);
    sortBtn.addEventListener('click', toggleSortDropdown);
    deleteAllBtn.addEventListener('click', deleteAllTodos);
    
    // Setup filter options
    document.querySelectorAll('.filter-option[data-filter]').forEach(option => {
        option.addEventListener('click', () => {
            currentFilter = option.getAttribute('data-filter');
            document.getElementById('currentFilter').textContent = option.textContent.trim();
            filterDropdown.classList.remove('show');
            renderTodos();
        });
    });
    
    // Setup sort options
    document.querySelectorAll('.filter-option[data-sort]').forEach(option => {
        option.addEventListener('click', () => {
            currentSort = option.getAttribute('data-sort');
            document.getElementById('currentSort').textContent = option.textContent.trim();
            sortDropdown.classList.remove('show');
            renderTodos();
        });
    });
    
    // Add task on Enter key
    todoInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') addTodo();
    });
}

// Add new todo
function addTodo() {
    const task = todoInput.value.trim();
    const date = dateInput.value;
    const time = timeInput.value;
    const priority = prioritySelect.value;
    
    // Validate input
    if (!task) {
        showNotification('Input Error', 'Please enter a task name!');
        todoInput.focus();
        return;
    }
    
    if (!date) {
        showNotification('Input Error', 'Please select a due date!');
        dateInput.focus();
        return;
    }
    
    if (!time) {
        showNotification('Input Error', 'Please select a due time!');
        timeInput.focus();
        return;
    }

    // Create due date object
    const dueDate = new Date(`${date}T${time}`);
    if (isNaN(dueDate.getTime())) {
        showNotification('Input Error', 'Invalid date or time!');
        return;
    }

    // Create todo object
    const todo = {
        id: Date.now(),
        task,
        date: formatDate(date),
        time: formatTime(time),
        dueDateTime: dueDate.getTime(),
        formattedDateTime: `${formatDate(date)} at ${formatTime(time)}`,
        completed: false,
        priority
    };

    // Add to todos array
    todos.push(todo);
    saveTodos();
    renderTodos();
    
    // Reset form
    todoInput.value = '';
    dateInput.value = '';
    timeInput.value = '';
    prioritySelect.value = 'medium';
    todoInput.focus();
    
    showNotification('Task Added', `"${todo.task}" has been added!`);
}

// Format date to display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Format time for display
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${suffix}`;
}

// Calculate time left
function calculateTimeLeft(dueDateTime) {
    const now = new Date().getTime();
    const diff = dueDateTime - now;
    
    if (diff < 0) {
        return { text: 'Overdue!', class: 'time-critical' };
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 24) {
        if (hours < 1) {
            return { text: `${minutes} min left`, class: 'time-critical' };
        }
        return { text: `${hours} hr ${minutes} min left`, class: 'time-warning' };
    }
    
    const days = Math.floor(hours / 24);
    return { text: `${days} day${days > 1 ? 's' : ''} left`, class: 'time-normal' };
}

// Render todos to the table
function renderTodos() {
    // Clear current list
    todoList.innerHTML = '';
    
    // Get filtered and sorted todos
    const filteredTodos = filterTodos();
    const sortedTodos = sortTodos(filteredTodos);
    
    if (sortedTodos.length === 0) {
        emptyState.style.display = 'table-row';
        todoList.appendChild(emptyState);
        updateStats();
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Create table rows
    sortedTodos.forEach(todo => {
        const timeLeft = calculateTimeLeft(todo.dueDateTime);
        const row = createTodoRow(todo, timeLeft);
        todoList.appendChild(row);
    });
    
    updateStats();
    checkDueSoonTasks();
}

// Filter todos based on current filter
function filterTodos() {
    switch(currentFilter) {
        case 'completed': 
            return todos.filter(todo => todo.completed);
        case 'pending': 
            return todos.filter(todo => !todo.completed);
        case 'today': 
            const today = new Date();
            return todos.filter(todo => {
                const todoDate = new Date(todo.dueDateTime);
                return todoDate.getDate() === today.getDate() && 
                       todoDate.getMonth() === today.getMonth() && 
                       todoDate.getFullYear() === today.getFullYear();
            });
        case 'high': 
            return todos.filter(todo => todo.priority === 'high');
        default: 
            return [...todos];
    }
}

// Sort todos based on current sort
function sortTodos(todosArray) {
    switch(currentSort) {
        case 'date-asc': 
            return [...todosArray].sort((a, b) => a.dueDateTime - b.dueDateTime);
        case 'date-desc': 
            return [...todosArray].sort((a, b) => b.dueDateTime - a.dueDateTime);
        case 'priority': 
            const priorityOrder = { high: 1, medium: 2, low: 3 };
            return [...todosArray].sort((a, b) => 
                priorityOrder[a.priority] - priorityOrder[b.priority] || 
                a.dueDateTime - b.dueDateTime
            );
        case 'name': 
            return [...todosArray].sort((a, b) => a.task.localeCompare(b.task));
        default: 
            return todosArray;
    }
}

// Create todo table row
function createTodoRow(todo, timeLeft) {
    const row = document.createElement('tr');
    row.className = `priority-${todo.priority}`;
    
    row.innerHTML = `
        <td class="${todo.completed ? 'completed' : ''}">
            <i class="fas ${getPriorityIcon(todo.priority)}"></i>
            ${todo.task}
        </td>
        <td>${todo.formattedDateTime}</td>
        <td>
            <span class="time-left ${timeLeft.class}">${timeLeft.text}</span>
        </td>
        <td>
            <span class="priority-${todo.priority}">${capitalizeFirst(todo.priority)}</span>
        </td>
        <td>
            <button onclick="toggleStatus(${todo.id})" class="status-btn ${todo.completed ? 'completed' : 'pending'}">
                <i class="fas ${todo.completed ? 'fa-check' : 'fa-spinner'}"></i>
                ${todo.completed ? 'Completed' : 'Pending'}
            </button>
        </td>
        <td class="actions-cell">
            <button onclick="editTodo(${todo.id})" class="action-btn">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteTodo(${todo.id})" class="action-btn delete-btn">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

// Get priority icon
function getPriorityIcon(priority) {
    switch(priority) {
        case 'high': return 'fa-exclamation-circle';
        case 'medium': return 'fa-arrow-circle-right';
        default: return 'fa-arrow-circle-down';
    }
}

// Capitalize first letter
function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Update statistics
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const pending = total - completed;
    
    const dueSoon = todos.filter(todo => {
        if (todo.completed) return false;
        const now = new Date().getTime();
        const diff = todo.dueDateTime - now;
        return diff > 0 && diff < 24 * 60 * 60 * 1000; // Less than 24 hours
    }).length;
    
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('dueSoon').textContent = dueSoon;
    document.getElementById('progressPercent').textContent = `${percent}%`;
    document.getElementById('progressFill').style.width = `${percent}%`;
}

// Check for tasks due soon
function checkDueSoonTasks() {
    clearTimeout(notificationTimeout);
    
    const now = new Date().getTime();
    const dueSoonTasks = todos.filter(todo => {
        if (todo.completed) return false;
        const diff = todo.dueDateTime - now;
        return diff > 0 && diff < 60 * 60 * 1000; // Less than 1 hour
    });
    
    if (dueSoonTasks.length > 0) {
        const task = dueSoonTasks[0];
        const timeLeft = calculateTimeLeft(task.dueDateTime);
        
        notificationTitle.textContent = 'Task Deadline Approaching!';
        notificationMessage.textContent = `"${task.task}" is due in ${timeLeft.text}`;
        notification.classList.add('show');
        
        notificationTimeout = setTimeout(() => {
            notification.classList.remove('show');
        }, 10000);
    }
}

// Toggle task status
function toggleStatus(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
        
        const status = todo.completed ? 'completed' : 'pending';
        showNotification('Task Updated', `"${todo.task}" marked as ${status}`);
    }
}

// Delete a task
function deleteTodo(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        const index = todos.findIndex(t => t.id === id);
        if (index !== -1) {
            const taskName = todos[index].task;
            todos.splice(index, 1);
            saveTodos();
            renderTodos();
            showNotification('Task Deleted', `"${taskName}" has been removed`);
        }
    }
}

// Delete all tasks
function deleteAllTodos() {
    if (todos.length === 0) return;
    
    if (confirm('Are you sure you want to delete ALL tasks?')) {
        todos = [];
        saveTodos();
        renderTodos();
        showNotification('All Tasks Cleared', 'Your todo list is now empty');
    }
}

// Edit a task
function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        const newTask = prompt('Edit task:', todo.task);
        if (newTask !== null && newTask.trim() !== '') {
            const oldTask = todo.task;
            todo.task = newTask.trim();
            saveTodos();
            renderTodos();
            showNotification('Task Updated', `"${oldTask}" renamed to "${newTask.trim()}"`);
        }
    }
}

// Toggle filter dropdown
function toggleFilterDropdown() {
    filterDropdown.classList.toggle('show');
    sortDropdown.classList.remove('show');
}

// Toggle sort dropdown
function toggleSortDropdown() {
    sortDropdown.classList.toggle('show');
    filterDropdown.classList.remove('show');
}

// Show notification
function showNotification(title, message) {
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    notification.classList.add('show');
    
    clearTimeout(notificationTimeout);
    notificationTimeout = setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// Close notification
function closeNotification() {
    notification.classList.remove('show');
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    if (!filterBtn.contains(event.target) && !filterDropdown.contains(event.target)) {
        filterDropdown.classList.remove('show');
    }
    
    if (!sortBtn.contains(event.target) && !sortDropdown.contains(event.target)) {
        sortDropdown.classList.remove('show');
    }
});

// Start periodic checks
function startPeriodicChecks() {
    // Check every minute
    setInterval(() => {
        renderTodos();
    }, 60000);
}

// Start the app
document.addEventListener('DOMContentLoaded', initApp);