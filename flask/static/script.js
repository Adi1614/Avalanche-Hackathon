let currentDate = new Date();
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        
        function renderCalendar() {
            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());

            document.querySelector('.calendar-header h2').textContent = 
                `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;

            const calendarBody = document.getElementById('calendar-body');
            calendarBody.innerHTML = '';

            let currentRow;
            const today = new Date();

            for (let date = new Date(startDate); date <= lastDay || date.getDay() !== 0; date.setDate(date.getDate() + 1)) {
                if (date.getDay() === 0) {
                    currentRow = document.createElement('tr');
                    calendarBody.appendChild(currentRow);
                }

                const cell = document.createElement('td');
                cell.textContent = date.getDate();

                if (date.getMonth() === currentDate.getMonth()) {
                    if (date.toDateString() === today.toDateString()) {
                        cell.classList.add('current-day');
                    }

                    // Add tasks for this date
                    const dayTasks = tasks.filter(task => {
                        const taskDate = new Date(task.date);
                        return taskDate.toDateString() === date.toDateString();
                    });

                    dayTasks.forEach(task => {
                        const taskElement = document.createElement('div');
                        taskElement.className = `task ${task.completed ? 'completed-task' : ''}`;
                        taskElement.textContent = task.title;
                        taskElement.onclick = () => toggleTaskCompletion(task);
                        cell.appendChild(taskElement);
                    });
                }

                currentRow.appendChild(cell);
            }

            updateAnalytics();
            updateReminders();
        }

        function addTask(event) {
            event.preventDefault();
            const title = document.getElementById('taskTitle').value;
            const date = document.getElementById('taskDate').value;
            const priority = document.getElementById('taskPriority').value;

            tasks.push({
                id: Date.now(),
                title,
                date,
                priority,
                completed: false
            });

            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderCalendar();
            event.target.reset();
        }

        function toggleTaskCompletion(task) {
            const taskIndex = tasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
                tasks[taskIndex].completed = !tasks[taskIndex].completed;
                localStorage.setItem('tasks', JSON.stringify(tasks));
                renderCalendar();
            }
        }

        function updateAnalytics() {
            // Update monthly progress
            const totalTasks = tasks.filter(task => {
                const taskDate = new Date(task.date);
                return taskDate.getMonth() === currentDate.getMonth() &&
                       taskDate.getFullYear() === currentDate.getFullYear();
            }).length;

            const completedTasks = tasks.filter(task => {
                const taskDate = new Date(task.date);
                return taskDate.getMonth() === currentDate.getMonth() &&
                       taskDate.getFullYear() === currentDate.getFullYear() &&
                       task.completed;
            }).length;

            const progressPercentage = totalTasks ? (completedTasks / totalTasks) * 100 : 0;
            document.getElementById('monthlyProgress').style.width = `${progressPercentage}%`;
            document.getElementById('completionRate').textContent = `${Math.round(progressPercentage)}%`;

            // Update weekly chart
            const weeklyChart = document.getElementById('weeklyChart');
            weeklyChart.innerHTML = '';
            
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const today = new Date();
            const weekData = new Array(7).fill(0);

            tasks.forEach(task => {
                const taskDate = new Date(task.date);
                if (taskDate <= today && taskDate >= new Date(today - 7 * 24 * 60 * 60 * 1000)) {
                    weekData[taskDate.getDay()]++;
                }
            });

            const maxTasks = Math.max(...weekData, 1);
            weekData.forEach((count, index) => {
                const bar = document.createElement('div');
                bar.className = 'bar';
                bar.style.height = `${(count / maxTasks) * 100}%`;
                
                const label = document.createElement('div');
                label.className = 'bar-label';
                label.textContent = days[index];
                
                bar.appendChild(label);
                weeklyChart.appendChild(bar);
            });
        }

        function updateReminders() {
            const reminderList = document.getElementById('reminderList');
            reminderList.innerHTML = '';

            const upcoming = tasks
                .filter(task => !task.completed && new Date(task.date) >= new Date())
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 5);

            upcoming.forEach(task => {
                const li = document.createElement('li');
                li.textContent = `${task.title} - ${new Date(task.date).toLocaleDateString()}`;
                reminderList.appendChild(li);
            });
        }

        function previousMonth() {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        }

        function nextMonth() {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        }

        // Initial render
        renderCalendar();

        // Check for reminders every minute
        setInterval(() => {
            const now = new Date();
            tasks.forEach(task => {
                const taskDate = new Date(task.date);
                if (!task.completed && 
                    taskDate.toDateString() === now.toDateString() && 
                    !task.reminded) {
                    task.reminded = true;
                    if (Notification.permission === "granted") {
                        new Notification(`Task Due Today: ${task.title}`);
                    }
                }
            });
        }, 60000);

        // Request notification permission
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }