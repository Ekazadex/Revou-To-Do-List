// Global variables
let todos = [];
let currentFilter = 'all';
let currentSort = 'date-asc';
let notificationTimeout;
const notification = document.getElementById('notification');
const notificationTitle = document.getElementById('notificationTitle');
const notificationMessage = document.getElementById('notificationMessage');

// DOM Elements
const addBtn = document.getElementById('addBtn');
const filterBtn = document.getElementById('filterBtn');
const sortBtn = document.getElementById('sortBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const filterDropdown = document.getElementById('filterDropdown');
const sortDropdown = document.getElementById('sortDropdown');
const todoInput = document.getElementById('todoInput');
const dateInput = document.getElementById('dateInput');
const timeInput = document.getElementById('timeInput');
const prioritySelect = document.getElementById('prioritySelect');

// Initialize the app
function initApp() {
    // Load todos from localStorage
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
        todos = JSON.parse(savedTodos);
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Render initial todos
    renderTodos();
    
    // Check for due tasks every minute
    setInterval(renderTodos, 60000);
}

// Set up event listeners
function setupEventListeners() {
    addBtn.addEventListener('click', addTodo);
    filterBtn.addEventListener('click', toggleFilterDropdown);
    sortBtn.addEventListener('click', toggleSortDropdown);
    deleteAllBtn.addEventListener('click', deleteAllTodos);
    
    // Set up filter options
    document.querySelectorAll('.filter-option[data-filter]').forEach(option => {
        option.addEventListener('click', () => {
            currentFilter = option.getAttribute('data-filter');
            document.getElementById('currentFilter').textContent = option.textContent.trim();
            filterDropdown.classList.remove('show');
            renderTodos();
        });
    });
    
    // Set up sort options
    document.querySelectorAll('.filter-option[data-sort]').forEach(option => {
        option.addEventListener('click', () => {
            currentSort = option.getAttribute('data-sort');
            document.getElementById('currentSort').textContent = option.textContent.trim();
            sortDropdown.classList.remove('show');
            renderTodos();
        });
    });
    
    // Add keyboard support for Enter key
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
}

// Add new todo
function addTodo() {
    if (!todoInput.value.trim()) {
        showNotification('Input Error', 'Please enter a task name!');
        todoInput.focus();
        return;
    }
    
    if (!dateInput.value) {
        showNotification('Input Error', 'Please select a due date!');
        dateInput.focus();
        return;
    }
    
    if (!timeInput.value) {
        showNotification('Input Error', 'Please select a due time!');
        timeInput.focus();
        return;
    }

    // Create new todo object
    const dueDate = new Date(`${dateInput.value}T${timeInput.value}`);
    if (isNaN(dueDate.getTime())) {
        showNotification('Input Error', 'Invalid date or time format!');
        return;
    }

    const todo = {
        id: Date.now(), // unique id
        task: todoInput.value.trim(),
        date: formatDate(dateInput.value),
        time: formatTime(timeInput.value),
        dueDateTime: dueDate.getTime(),
        formattedDateTime: `${formatDate(dateInput.value)} at ${formatTime(timeInput.value)}`,
        completed: false,
        priority: prioritySelect.value
    };

    todos.push(todo);
    saveToLocalStorage();
    renderTodos();
    
    // Reset form
    todoInput.value = '';
    dateInput.value = '';
    timeInput.value = '';
    prioritySelect.value = 'medium';
    todoInput.focus();
    
    showNotification('Task Added', `"${todo.task}" has been added to your list!`);
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
        return {
            text: 'Overdue!',
            class: 'time-critical',
            critical: true
        };
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 24) {
        if (hours < 1) {
            return {
                text: `${minutes} min left`,
                class: 'time-critical',
                critical: true
            };
        }
        return {
            text: `${hours} hr ${minutes} min left`,
            class: 'time-warning',
            warning: true
        };
    }
    
    const days = Math.floor(hours / 24);
    return {
        text: `${days} day${days > 1 ? 's' : ''} left`,
        class: 'time-normal'
    };
}

// Render todos
function renderTodos() {
    const todoList = document.getElementById('todoList');
    const emptyState = document.getElementById('emptyState');
    
    // Filter todos
    let filteredTodos;
    switch(currentFilter) {
        case 'completed':
            filteredTodos = todos.filter(todo => todo.completed);
            break;
        case 'pending':
            filteredTodos = todos.filter(todo => !todo.completed);
            break;
        case 'today':
            const today = new Date();
            filteredTodos = todos.filter(todo => {
                const todoDate = new Date(todo.dueDateTime);
                return todoDate.getDate() === today.getDate() && 
                       todoDate.getMonth() === today.getMonth() && 
                       todoDate.getFullYear() === today.getFullYear();
            });
            break;
        case 'high':
            filteredTodos = todos.filter(todo => todo.priority === 'high');
            break;
        default:
            filteredTodos = [...todos];
    }
    
    // Sort todos
    switch(currentSort) {
        case 'date-asc':
            filteredTodos.sort((a, b) => a.dueDateTime - b.dueDateTime);
            break;
        case 'date-desc':
            filteredTodos.sort((a, b) => b.dueDateTime - a.dueDateTime);
            break;
        case 'priority':
            const priorityOrder = { high: 1, medium: 2, low: 3 };
            filteredTodos.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || a.dueDateTime - b.dueDateTime);
            break;
        case 'name':
            filteredTodos.sort((a, b) => a.task.localeCompare(b.task));
            break;
    }
    
    // Clear the list
    todoList.innerHTML = '';
    
    if (filteredTodos.length === 0) {
        emptyState.style.display = 'table-row';
        todoList.appendChild(emptyState);
    } else {
        emptyState.style.display = 'none';
        
        filteredTodos.forEach(todo => {
            const timeLeft = calculateTimeLeft(todo.dueDateTime);
            const priorityClass = `priority-${todo.priority}`;
            
            const row = document.createElement('tr');
            row.className = priorityClass;
            row.innerHTML = `
                <td class="${todo.completed ? 'completed' : ''}">
                    <i class="fas ${todo.priority === 'high' ? 'fa-exclamation-circle' : todo.priority === 'medium' ? 'fa-arrow-circle-right' : 'fa-arrow-circle-down'}"></i>
                    ${todo.task}
                </td>
                <td>${todo.formattedDateTime}</td>
                <td>
                    <span class="time-left ${timeLeft.class}">${timeLeft.text}</span>
                </td>
                <td>
                    <span class="priority-${todo.priority}">${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}</span>
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
            todoList.appendChild(row);
        });
    }
    
    updateStats();
    checkDueSoonTasks();
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
    const todoIndex = todos.findIndex(t => t.id === id);
    if (todoIndex !== -1) {
        todos[todoIndex].completed = !todos[todoIndex].completed;
        saveToLocalStorage();
        renderTodos();
        
        const status = todos[todoIndex].completed ? 'completed' : 'pending';
        showNotification('Task Updated', `"${todos[todoIndex].task}" marked as ${status}`);
    }
}

// Delete a task
function deleteTodo(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        const todoIndex = todos.findIndex(t => t.id === id);
        if (todoIndex !== -1) {
            const taskName = todos[todoIndex].task;
            todos.splice(todoIndex, 1);
            saveToLocalStorage();
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
        saveToLocalStorage();
        renderTodos();
        showNotification('All Tasks Cleared', 'Your todo list is now empty');
    }
}

// Edit a task
function editTodo(id) {
    const todoIndex = todos.findIndex(t => t.id === id);
    if (todoIndex !== -1) {
        const newTask = prompt('Edit task:', todos[todoIndex].task);
        if (newTask !== null && newTask.trim() !== '') {
            const oldTask = todos[todoIndex].task;
            todos[todoIndex].task = newTask.trim();
            saveToLocalStorage();
            renderTodos();
            showNotification('Task Updated', `"${oldTask}" has been renamed to "${newTask.trim()}"`);
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

// Save todos to localStorage
function saveToLocalStorage() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);