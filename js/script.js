let todos = [];
let currentFilter = 'all';

// Load todos from localStorage saat aplikasi pertama kali dijalankan
window.addEventListener('DOMContentLoaded', () => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
        todos = JSON.parse(savedTodos);
    }
    renderTodos();
});

document.getElementById('addBtn').addEventListener('click', addTodo);
document.getElementById('filterBtn').addEventListener('click', toggleFilterDropdown);
document.getElementById('deleteAllBtn').addEventListener('click', deleteAllTodos);

// Set up filter options
document.querySelectorAll('.filter-option').forEach(option => {
    option.addEventListener('click', () => {
        currentFilter = option.getAttribute('data-filter');
        document.getElementById('currentFilter').textContent = option.textContent.trim();
        document.getElementById('filterDropdown').classList.remove('show');
        renderTodos();
    });
});

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function addTodo() {
    const todoInput = document.getElementById('todoInput');
    const dateInput = document.getElementById('dateInput');
    
    if (!todoInput.value) {
        alert('Please enter a task!');
        return;
    }
    
    if (!dateInput.value) {
        alert('Please select a due date!');
        return;
    }

    const todo = {
        id: Date.now(),
        task: todoInput.value,
        date: formatDate(dateInput.value),
        completed: false,
        timestamp: new Date(dateInput.value).getTime()
    };

    todos.push(todo);
    saveTodos();
    renderTodos();
    todoInput.value = '';
    dateInput.value = '';
    todoInput.focus();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function renderTodos() {
    const todoList = document.getElementById('todoList');
    const emptyState = document.getElementById('emptyState');
    
    // Filter todos based on current selection
    let filteredTodos;
    switch(currentFilter) {
        case 'completed':
            filteredTodos = todos.filter(todo => todo.completed);
            break;
        case 'pending':
            filteredTodos = todos.filter(todo => !todo.completed);
            break;
        default:
            filteredTodos = [...todos];
    }
    
    // Sort by due date (ascending)
    filteredTodos.sort((a, b) => a.timestamp - b.timestamp);
    
    // Clear the list
    todoList.innerHTML = '';

    if (filteredTodos.length === 0) {
        emptyState.style.display = 'table-row';
        todoList.appendChild(emptyState);
    } else {
        emptyState.style.display = 'none';

        filteredTodos.forEach(todo => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="${todo.completed ? 'completed' : ''}">${todo.task}</td>
                <td>${todo.date}</td>
                <td>
                    <button class="status-btn ${todo.completed ? 'completed' : 'pending'}" data-id="${todo.id}">
                        <i class="fas ${todo.completed ? 'fa-check' : 'fa-spinner'}"></i>
                        ${todo.completed ? 'Completed' : 'Pending'}
                    </button>
                </td>
                <td class="actions-cell">
                    <button class="action-btn edit-btn" data-id="${todo.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${todo.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            todoList.appendChild(row);
        });
    }

    updateStats();
}

// Event delegation untuk tombol status, edit, dan delete
document.getElementById('todoList').addEventListener('click', function(e) {
    const statusBtn = e.target.closest('.status-btn');
    const editBtn = e.target.closest('.edit-btn');
    const deleteBtn = e.target.closest('.delete-btn');

    if (statusBtn) {
        const id = Number(statusBtn.getAttribute('data-id'));
        toggleStatus(id);
    }
    if (editBtn) {
        const id = Number(editBtn.getAttribute('data-id'));
        editTodo(id);
    }
    if (deleteBtn) {
        const id = Number(deleteBtn.getAttribute('data-id'));
        deleteTodo(id);
    }
});

function updateStats() {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('progressPercent').textContent = `${percent}%`;
    document.getElementById('progressFill').style.width = `${percent}%`;
}

function toggleStatus(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
    }
}

function deleteTodo(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        todos = todos.filter(todo => todo.id !== id);
        saveTodos();
        renderTodos();
    }
}

function deleteAllTodos() {
    if (todos.length === 0) return;
    
    if (confirm('Are you sure you want to delete ALL tasks?')) {
        todos = [];
        saveTodos();
        renderTodos();
    }
}

function toggleFilterDropdown() {
    document.getElementById('filterDropdown').classList.toggle('show');
}

function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        const newTask = prompt('Edit task:', todo.task);
        if (newTask !== null && newTask.trim() !== '') {
            todo.task = newTask.trim();
            saveTodos();
            renderTodos();
        }
    }
}

// Close filter dropdown when clicking outside
document.addEventListener('click', function(event) {
    const filterBtn = document.getElementById('filterBtn');
    const filterDropdown = document.getElementById('filterDropdown');
    
    if (!filterBtn.contains(event.target) && !filterDropdown.contains(event.target)) {
        filterDropdown.classList.remove('show');
    }
});