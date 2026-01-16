document.addEventListener('DOMContentLoaded', () => {
    
    // ======================================================================
    // === 1. ZMIENNE I ELEMENTY HTML ===
    // ======================================================================
    
    // Zmienna dla Drag & Drop
    let dragTaskId = null;
    
    // Pobieranie elementów z HTML
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const clearCompletedBtn = document.getElementById('clear-completed-btn');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const activeTasksCountSpan = document.getElementById('active-tasks-count');
    const emptyMessage = document.getElementById('empty-message');
    
    let tasks = [];
    let currentFilter = 'all';

    loadTasks();


    // ======================================================================
    // === 2. FUNKCJE OBSŁUGI DRAG & DROP ===
    // ======================================================================

    function dragStart(e) {
        dragTaskId = parseInt(e.target.getAttribute('data-id'));
        e.dataTransfer.setData('text/plain', dragTaskId);
        setTimeout(() => e.target.classList.add('dragging'), 0);
    }

    function dragEnter(e) {
        e.preventDefault();
        const targetId = parseInt(e.target.getAttribute('data-id'));
        if (e.target.tagName === 'LI' && targetId !== dragTaskId) {
            e.target.classList.add('drag-over');
        }
    }

    function dragOver(e) {
        e.preventDefault(); 
    }

    function dragLeave(e) {
        if (e.target.tagName === 'LI') {
            e.target.classList.remove('drag-over');
        }
    }

    function drop(e) {
        e.preventDefault();
        
        let dropTarget = e.target;
        while (dropTarget.tagName !== 'LI' && dropTarget !== taskList) {
            dropTarget = dropTarget.parentElement;
        }

        if (dropTarget.tagName !== 'LI') {
            return; 
        }

        dropTarget.classList.remove('drag-over');
        
        const dropTaskId = parseInt(dropTarget.getAttribute('data-id'));
        
        if (dragTaskId && dragTaskId !== dropTaskId) {
            
            const dragIndex = tasks.findIndex(task => task.id === dragTaskId);
            const dropIndex = tasks.findIndex(task => task.id === dropTaskId);
            
            if (dragIndex !== -1 && dropIndex !== -1) {
                
                const [draggedItem] = tasks.splice(dragIndex, 1); 
                tasks.splice(dropIndex, 0, draggedItem); 
                
                saveTasks();
                renderTasks(); 
            }
        }
    }

    function dragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        dragTaskId = null;
    }


    // ======================================================================
    // === 3. GŁÓWNA LOGIKA APLIKACJI (RENDER, ADD, TOGGLE, ETC.) ===
    // ======================================================================
    
    function renderTasks() {
        
        let filteredTasks = tasks;

        // 1.1 Filtracja po statusie
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }
        
        taskList.innerHTML = ''; 

        // Wyświetlanie komunikatu "Brak zadań"
        if (tasks.length === 0) {
            emptyMessage.classList.remove('hidden'); 
        } else {
            emptyMessage.classList.add('hidden'); 
        }

        // Iteracja i budowanie listy HTML
        filteredTasks.forEach(task => {
            
            const li = document.createElement('li');
            li.setAttribute('data-id', task.id); 
            
            // Ustawienia Drag & Drop
            li.draggable = true;
            li.addEventListener('dragstart', dragStart);
            li.addEventListener('dragenter', dragEnter);
            li.addEventListener('dragover', dragOver);
            li.addEventListener('dragleave', dragLeave);
            li.addEventListener('drop', drop);
            li.addEventListener('dragend', dragEnd);
            
            // Logika klas
            if (task.completed) li.classList.add('completed');
            if (task.important && !task.completed) li.classList.add('important');

            // Tekst zadania
            const taskText = document.createElement('span');
            taskText.classList.add('task-text');
            taskText.textContent = task.text;

            // Edycja Zadania (Dwuklik)
            taskText.addEventListener('dblclick', () => {
                taskText.classList.add('hidden');
                
                const editInput = document.createElement('input');
                editInput.type = 'text';
                editInput.value = task.text;
                editInput.classList.add('edit-input');
                
                li.insertBefore(editInput, taskText); 
                editInput.focus(); 

                const saveEdit = () => {
                    const newText = editInput.value;
                    editTask(task.id, newText); 
                };

                editInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') saveEdit();
                });
                editInput.addEventListener('blur', saveEdit);
            });

            li.appendChild(taskText);

            // Kontener na akcje
            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('task-actions');

            // Priorytet
            const priorityBtn = document.createElement('button');
            priorityBtn.classList.add('priority-btn');
            priorityBtn.textContent = task.important ? '★' : '☆'; 
            if (task.important) priorityBtn.classList.add('active');
            
            if (!task.completed) {
                priorityBtn.addEventListener('click', () => togglePriority(task.id));
            } else {
                 priorityBtn.disabled = true;
            }
            actionsDiv.appendChild(priorityBtn);
            
            // Checkbox (Wykonane)
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed; 
            checkbox.addEventListener('change', () => toggleTaskCompleted(task.id));
            actionsDiv.appendChild(checkbox);

            // Przycisk Usuń
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.textContent = 'Usuń';
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
            actionsDiv.appendChild(deleteBtn);

            li.appendChild(actionsDiv);
            taskList.appendChild(li);
        });

        updateStatus();
    }


    function addTask() {
        const text = taskInput ? taskInput.value.trim() : '';
        if (text === '') {
            alert('Wprowadź nazwę zadania!');
            return;
        }

        const newTask = {
            id: Date.now(), 
            text: text,
            completed: false,
            important: false, // Wstępnie ustawione
        };

        tasks.push(newTask);
        if (taskInput) taskInput.value = ''; 
        
        saveTasks();
        renderTasks(); 
    }


    function toggleTaskCompleted(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        }
    }

    function togglePriority(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.important = !task.important;
            saveTasks();
            renderTasks();
        }
    }
    
    function deleteTask(id) {
        const confirmed = confirm('Czy na pewno chcesz usunąć to zadanie?');
        if (confirmed) {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
        }
    }

    function editTask(id, newText) {
        const task = tasks.find(t => t.id === id);
        if (task && newText.trim() !== '') {
            task.text = newText.trim();
            saveTasks();
            renderTasks(); 
        }
    }
    
    function clearCompletedTasks() {
        const confirmed = confirm('Czy na pewno chcesz usunąć wszystkie wykonane zadania?');
        if (confirmed) {
            tasks = tasks.filter(task => !task.completed);
            saveTasks();
            renderTasks();
        }
    }


    function setFilter(filter) {
        currentFilter = filter;
        filterButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.filter-btn[data-filter="${filter}"]`).classList.add('active');
        renderTasks();
    }

    function updateStatus() {
        const activeCount = tasks.filter(task => !task.completed).length;
        const completedCount = tasks.filter(task => task.completed).length;

        activeTasksCountSpan.textContent = activeCount;

        if (completedCount > 0) {
            clearCompletedBtn.classList.remove('hidden');
        } else {
            clearCompletedBtn.classList.add('hidden');
        }
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            // Wczytywanie z zapewnieniem zgodności ze starymi zadaniami (dla 'important')
            tasks = JSON.parse(savedTasks).map(task => ({
                ...task,
                important: task.important === undefined ? false : task.important,
            }));
        }
    }


    // ======================================================================
    // === 4. PRZYPISANIE ZDARZEŃ POCZĄTKOWYCH ===
    // ======================================================================
    
    if (addTaskBtn) addTaskBtn.addEventListener('click', addTask);
    if (taskInput) taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.getAttribute('data-filter')));
    });

    if (clearCompletedBtn) clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    
    renderTasks();
});