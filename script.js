class StudyBat {
    constructor() {
        this.assignments = JSON.parse(localStorage.getItem('studybat-assignments')) || [];
        this.studySessions = JSON.parse(localStorage.getItem('studybat-sessions')) || [];
        this.currentTheme = localStorage.getItem('studybat-theme') || 'dark';
        this.currentView = 'calendar';
        this.currentDate = new Date();
        this.studyTimer = null;
        this.studyStartTime = null;
        this.studyPausedTime = 0;
        this.assignmentTimer = null;
        this.assignmentStartTime = null;
        this.assignmentPausedTime = 0;
        this.currentAssignmentId = null;
        
        this.init();
    }

    init() {
        this.setTheme(this.currentTheme);
        this.setupEventListeners();
        this.setupResponsiveFeatures();
        this.renderCalendar();
        this.renderAssignments();
        this.updateProgress();
        this.renderStudySessions();
        this.checkNotifications();
        
        setInterval(() => this.checkNotifications(), 60000);
    }

    setupEventListeners() {
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchView(e.currentTarget.dataset.view);
            });
        });

        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // Assignment modal
        document.getElementById('addAssignmentBtn').addEventListener('click', () => {
            this.openAssignmentModal();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeAssignmentModal();
        });

        document.getElementById('cancelAssignment').addEventListener('click', () => {
            this.closeAssignmentModal();
        });

        document.getElementById('assignmentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAssignment();
        });

        document.getElementById('startStudyBtn').addEventListener('click', () => {
            this.startStudySession();
        });

        document.getElementById('pauseTimer').addEventListener('click', () => {
            this.pauseStudySession();
        });

        document.getElementById('stopTimer').addEventListener('click', () => {
            this.stopStudySession();
        });

        document.getElementById('subjectFilter').addEventListener('change', () => {
            this.renderAssignments();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.renderAssignments();
        });

        document.getElementById('batMascot').addEventListener('click', () => {
            this.showBatMessage();
        });

        document.getElementById('startAssignmentTimer').addEventListener('click', () => {
            this.startAssignmentTimer();
        });

        document.getElementById('pauseAssignmentTimer').addEventListener('click', () => {
            this.pauseAssignmentTimer();
        });

        document.getElementById('stopAssignmentTimer').addEventListener('click', () => {
            this.stopAssignmentTimer();
        });

        document.getElementById('closeProgressTimer').addEventListener('click', () => {
            this.closeProgressTimer();
        });
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('studybat-theme', theme);
        
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    switchView(view) {
        this.currentView = view;
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        document.querySelectorAll('.view-container').forEach(container => {
            container.classList.remove('active');
        });
        document.getElementById(`${view}View`).classList.add('active');

        this.updateSubjectFilter();
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const currentMonth = document.getElementById('currentMonth');
        
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        currentMonth.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

        calendarGrid.innerHTML = '';

        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        // Get first day of month and number of days
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day';
            calendarGrid.appendChild(emptyDay);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            const dayDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const today = new Date();
            const isToday = dayDate.toDateString() === today.toDateString();
            
            if (isToday) {
                dayElement.classList.add('today');
            }

            const dayAssignments = this.getAssignmentsForDate(dayDate);
            if (dayAssignments.length > 0) {
                dayElement.classList.add('has-events');
            }

            dayElement.innerHTML = `
                <div class="day-number">${day}</div>
                <div class="day-events">
                    ${dayAssignments.slice(0, 2).map(assignment => 
                        `<div style="font-size: 0.7rem; margin-bottom: 2px;">${assignment.title}</div>`
                    ).join('')}
                    ${dayAssignments.length > 2 ? `<div style="font-size: 0.7rem;">+${dayAssignments.length - 2} more</div>` : ''}
                </div>
            `;

            dayElement.addEventListener('click', () => {
                this.switchView('assignments');
                this.filterAssignmentsByDate(dayDate);
            });

            calendarGrid.appendChild(dayElement);
        }
    }

    getAssignmentsForDate(date) {
        return this.assignments.filter(assignment => {
            const assignmentDate = new Date(assignment.dueDate);
            return assignmentDate.toDateString() === date.toDateString();
        });
    }

    openAssignmentModal() {
        document.getElementById('assignmentModal').classList.add('active');
        document.getElementById('assignmentForm').reset();
    }

    closeAssignmentModal() {
        document.getElementById('assignmentModal').classList.remove('active');
    }

    saveAssignment() {
        const formData = new FormData(document.getElementById('assignmentForm'));
        const files = document.getElementById('assignmentFile').files;
        
        const assignment = {
            id: Date.now().toString(),
            title: document.getElementById('assignmentTitle').value,
            subject: document.getElementById('assignmentSubject').value,
            dueDate: document.getElementById('assignmentDueDate').value,
            priority: document.getElementById('assignmentPriority').value,
            description: document.getElementById('assignmentDescription').value,
            expectedTime: parseInt(document.getElementById('assignmentExpectedTime').value) || null,
            status: 'pending',
            grade: null,
            timeSpent: 0,
            files: Array.from(files).map(file => ({
                name: file.name,
                size: file.size,
                type: file.type,
                data: URL.createObjectURL(file)
            })),
            createdAt: new Date().toISOString()
        };

        this.assignments.push(assignment);
        this.saveAssignments();
        this.renderAssignments();
        this.renderCalendar();
        this.updateProgress();
        this.closeAssignmentModal();
        this.showNotification('Assignment added successfully!');
    }

    renderAssignments() {
        const assignmentsList = document.getElementById('assignmentsList');
        const subjectFilter = document.getElementById('subjectFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        let filteredAssignments = this.assignments;

        if (subjectFilter) {
            filteredAssignments = filteredAssignments.filter(a => a.subject === subjectFilter);
        }

        if (statusFilter) {
            filteredAssignments = filteredAssignments.filter(a => a.status === statusFilter);
        }

        filteredAssignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        assignmentsList.innerHTML = filteredAssignments.map(assignment => `
            <div class="assignment-card">
                <div class="assignment-header">
                    <div class="assignment-title">${assignment.title}</div>
                    <div class="assignment-priority priority-${assignment.priority}">${assignment.priority}</div>
                </div>
                <div class="assignment-details">
                    <div class="assignment-detail">
                        <label>Subject</label>
                        <span>${assignment.subject}</span>
                    </div>
                    <div class="assignment-detail">
                        <label>Due Date</label>
                        <span>${new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div class="assignment-detail">
                        <label>Status</label>
                        <span>${assignment.status}</span>
                    </div>
                    ${assignment.expectedTime ? `
                    <div class="assignment-detail">
                        <label>Expected Time</label>
                        <span>${this.formatTime(assignment.expectedTime * 60)}</span>
                    </div>
                    ` : ''}
                    ${assignment.timeSpent > 0 ? `
                    <div class="assignment-detail">
                        <label>Time Spent</label>
                        <span>${this.formatTime(assignment.timeSpent)}</span>
                    </div>
                    ` : ''}
                    ${assignment.grade ? `
                    <div class="assignment-detail">
                        <label>Grade</label>
                        <span>${assignment.grade}</span>
                    </div>
                    ` : ''}
                </div>
                ${assignment.description ? `
                <div class="assignment-description">
                    <label>Description</label>
                    <p>${assignment.description}</p>
                </div>
                ` : ''}
                ${assignment.files.length > 0 ? `
                <div class="assignment-files">
                    <label>Attachments</label>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                        ${assignment.files.map(file => `
                            <a href="${file.data}" download="${file.name}" class="btn btn-secondary" style="font-size: 0.75rem;">
                                <i class="fas fa-paperclip"></i> ${file.name}
                            </a>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                <div class="assignment-actions">
                    ${assignment.status === 'pending' ? `
                        <button class="btn btn-success" onclick="studyBat.updateAssignmentStatus('${assignment.id}', 'in-progress')">
                            <i class="fas fa-play"></i> Start
                        </button>
                    ` : ''}
                    ${assignment.status === 'in-progress' ? `
                        <button class="btn btn-primary" onclick="studyBat.updateAssignmentStatus('${assignment.id}', 'completed')">
                            <i class="fas fa-check"></i> Complete
                        </button>
                    ` : ''}
                    ${assignment.expectedTime ? `
                        <button class="btn btn-info" onclick="studyBat.startAssignmentProgressTimer('${assignment.id}')">
                            <i class="fas fa-clock"></i> Timer
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="studyBat.editAssignment('${assignment.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="studyBat.deleteAssignment('${assignment.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateAssignmentStatus(id, status) {
        const assignment = this.assignments.find(a => a.id === id);
        if (assignment) {
            assignment.status = status;
            if (status === 'completed' && !assignment.grade) {
                const grade = prompt('Enter grade (optional):');
                if (grade) assignment.grade = grade;
            }
            this.saveAssignments();
            this.renderAssignments();
            this.updateProgress();
            this.showNotification(`Assignment marked as ${status}!`);
        }
    }

    deleteAssignment(id) {
        if (confirm('Are you sure you want to delete this assignment?')) {
            this.assignments = this.assignments.filter(a => a.id !== id);
            this.saveAssignments();
            this.renderAssignments();
            this.renderCalendar();
            this.updateProgress();
            this.showNotification('Assignment deleted!');
        }
    }

    updateSubjectFilter() {
        const subjectFilter = document.getElementById('subjectFilter');
        const subjects = [...new Set(this.assignments.map(a => a.subject))];
        
        subjectFilter.innerHTML = '<option value="">All Subjects</option>' +
            subjects.map(subject => `<option value="${subject}">${subject}</option>`).join('');
    }

    updateProgress() {
        const totalAssignments = this.assignments.length;
        const completedAssignments = this.assignments.filter(a => a.status === 'completed').length;
        const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;
        
        const gradedAssignments = this.assignments.filter(a => a.grade && !isNaN(parseFloat(a.grade)));
        const averageGrade = gradedAssignments.length > 0 
            ? (gradedAssignments.reduce((sum, a) => sum + parseFloat(a.grade), 0) / gradedAssignments.length).toFixed(1)
            : 'N/A';

        const upcomingDeadlines = this.assignments.filter(a => {
            const dueDate = new Date(a.dueDate);
            const today = new Date();
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 7 && a.status !== 'completed';
        }).length;

        document.getElementById('completionRate').textContent = `${completionRate}%`;
        document.getElementById('averageGrade').textContent = averageGrade;
        document.getElementById('upcomingDeadlines').textContent = upcomingDeadlines;

        this.renderGradeBreakdown();
    }

    renderGradeBreakdown() {
        const gradeBreakdown = document.getElementById('gradeBreakdown');
        const subjects = [...new Set(this.assignments.map(a => a.subject))];
        
        gradeBreakdown.innerHTML = subjects.map(subject => {
            const subjectAssignments = this.assignments.filter(a => a.subject === subject && a.grade);
            const subjectGrades = subjectAssignments.map(a => parseFloat(a.grade)).filter(g => !isNaN(g));
            const avgGrade = subjectGrades.length > 0 
                ? (subjectGrades.reduce((sum, grade) => sum + grade, 0) / subjectGrades.length).toFixed(1)
                : 'N/A';
            
            return `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid var(--border-color);">
                    <span>${subject}</span>
                    <span style="font-weight: 600; color: var(--accent-color);">${avgGrade}</span>
                </div>
            `;
        }).join('');
    }

    startStudySession() {
        if (!this.studyTimer) {
            this.studyStartTime = new Date();
            this.studyPausedTime = 0;
            this.studyTimer = setInterval(() => this.updateStudyTimer(), 1000);
            document.getElementById('startStudyBtn').style.display = 'none';
            document.getElementById('studyTimer').style.display = 'block';
            this.showNotification('Study session started!');
        }
    }

    pauseStudySession() {
        if (this.studyTimer) {
            clearInterval(this.studyTimer);
            this.studyTimer = null;
            this.studyPausedTime += new Date() - this.studyStartTime;
            document.getElementById('pauseTimer').textContent = 'Resume';
            this.showNotification('Study session paused!');
        } else {
            this.studyStartTime = new Date();
            this.studyTimer = setInterval(() => this.updateStudyTimer(), 1000);
            document.getElementById('pauseTimer').textContent = 'Pause';
            this.showNotification('Study session resumed!');
        }
    }

    stopStudySession() {
        if (this.studyTimer) {
            clearInterval(this.studyTimer);
            this.studyTimer = null;
        }
        
        const totalTime = this.studyPausedTime + (this.studyStartTime ? new Date() - this.studyStartTime : 0);
        
        if (totalTime > 0) {
            const session = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                duration: Math.round(totalTime / 1000),
                subject: prompt('What subject were you studying?') || 'General'
            };
            
            this.studySessions.push(session);
            this.saveStudySessions();
            this.renderStudySessions();
            this.showNotification(`Study session completed! Duration: ${this.formatTime(session.duration)}`);
        }
        
        this.resetStudyTimer();
    }

    resetStudyTimer() {
        this.studyTimer = null;
        this.studyStartTime = null;
        this.studyPausedTime = 0;
        document.getElementById('studyTimer').style.display = 'none';
        document.getElementById('startStudyBtn').style.display = 'block';
        document.getElementById('pauseTimer').textContent = 'Pause';
        document.querySelector('.timer-display').textContent = '00:00:00';
    }

    updateStudyTimer() {
        const now = new Date();
        const elapsed = this.studyPausedTime + (now - this.studyStartTime);
        document.querySelector('.timer-display').textContent = this.formatTime(Math.floor(elapsed / 1000));
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    renderStudySessions() {
        const studySessions = document.getElementById('studySessions');
        const recentSessions = this.studySessions.slice(-10).reverse();
        
        studySessions.innerHTML = recentSessions.map(session => `
            <div class="session-card">
                <div class="session-info">
                    <div class="session-date">${new Date(session.date).toLocaleDateString()}</div>
                    <div class="session-duration">${session.subject} - ${this.formatTime(session.duration)}</div>
                </div>
            </div>
        `).join('');
    }

    startAssignmentProgressTimer(assignmentId) {
        const assignment = this.assignments.find(a => a.id === assignmentId);
        if (!assignment || !assignment.expectedTime) {
            this.showNotification('This assignment needs an expected time to use the progress timer!');
            return;
        }

        this.currentAssignmentId = assignmentId;
        this.assignmentStartTime = new Date();
        this.assignmentPausedTime = 0;
        
        document.getElementById('timerAssignmentTitle').textContent = assignment.title;
        document.getElementById('timerExpectedTime').textContent = `Expected: ${this.formatTime(assignment.expectedTime * 60)}`;
        document.getElementById('progressTimerSection').style.display = 'block';
        
        this.assignmentTimer = setInterval(() => this.updateAssignmentTimer(), 1000);
        this.showNotification('Assignment progress timer started!');
    }

    startAssignmentTimer() {
        if (this.assignmentTimer) return;
        
        this.assignmentStartTime = new Date();
        this.assignmentTimer = setInterval(() => this.updateAssignmentTimer(), 1000);
        document.getElementById('startAssignmentTimer').style.display = 'none';
        document.getElementById('pauseAssignmentTimer').style.display = 'inline-flex';
    }

    pauseAssignmentTimer() {
        if (this.assignmentTimer) {
            clearInterval(this.assignmentTimer);
            this.assignmentTimer = null;
            this.assignmentPausedTime += new Date() - this.assignmentStartTime;
            document.getElementById('pauseAssignmentTimer').textContent = 'Resume';
            this.showNotification('Assignment timer paused!');
        } else {
            this.assignmentStartTime = new Date();
            this.assignmentTimer = setInterval(() => this.updateAssignmentTimer(), 1000);
            document.getElementById('pauseAssignmentTimer').textContent = 'Pause';
            this.showNotification('Assignment timer resumed!');
        }
    }

    stopAssignmentTimer() {
        if (this.assignmentTimer) {
            clearInterval(this.assignmentTimer);
            this.assignmentTimer = null;
        }
        
        const totalTime = this.assignmentPausedTime + (this.assignmentStartTime ? new Date() - this.assignmentStartTime : 0);
        
        if (totalTime > 0 && this.currentAssignmentId) {
            const assignment = this.assignments.find(a => a.id === this.currentAssignmentId);
            if (assignment) {
                assignment.timeSpent += Math.round(totalTime / 1000);
                this.saveAssignments();
                this.renderAssignments();
                this.showNotification(`Time logged: ${this.formatTime(Math.round(totalTime / 1000))}`);
            }
        }
        
        this.resetAssignmentTimer();
    }

    resetAssignmentTimer() {
        this.assignmentTimer = null;
        this.assignmentStartTime = null;
        this.assignmentPausedTime = 0;
        document.getElementById('startAssignmentTimer').style.display = 'inline-flex';
        document.getElementById('pauseAssignmentTimer').style.display = 'none';
        document.getElementById('pauseAssignmentTimer').textContent = 'Pause';
        document.getElementById('timerDisplayLarge').textContent = '00:00:00';
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('progressText').textContent = '0% Complete';
    }

    updateAssignmentTimer() {
        const now = new Date();
        const elapsed = this.assignmentPausedTime + (now - this.assignmentStartTime);
        const elapsedSeconds = Math.floor(elapsed / 1000);
        
        document.getElementById('timerDisplayLarge').textContent = this.formatTime(elapsedSeconds);
        
        if (this.currentAssignmentId) {
            const assignment = this.assignments.find(a => a.id === this.currentAssignmentId);
            if (assignment && assignment.expectedTime) {
                const expectedSeconds = assignment.expectedTime * 60;
                const progress = Math.min((elapsedSeconds / expectedSeconds) * 100, 100);
                
                document.getElementById('progressFill').style.width = `${progress}%`;
                document.getElementById('progressText').textContent = `${Math.round(progress)}% Complete`;
                
                if (progress >= 100) {
                    this.showNotification('Great job! You\'ve reached your expected time goal!');
                } else if (progress >= 75) {
                    this.showNotification('You\'re almost there! Keep going!');
                }
            }
        }
    }

    closeProgressTimer() {
        if (this.assignmentTimer) {
            this.stopAssignmentTimer();
        }
        document.getElementById('progressTimerSection').style.display = 'none';
        this.currentAssignmentId = null;
    }

    checkNotifications() {
        const now = new Date();
        const upcomingAssignments = this.assignments.filter(assignment => {
            const dueDate = new Date(assignment.dueDate);
            const diffTime = dueDate - now;
            const diffHours = diffTime / (1000 * 60 * 60);
            return diffHours > 0 && diffHours <= 24 && assignment.status !== 'completed';
        });

        if (upcomingAssignments.length > 0) {
            this.showNotification(`You have ${upcomingAssignments.length} assignment(s) due within 24 hours!`);
        }
    }

    showNotification(message) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        
        notificationText.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    showBatMessage() {
        const messages = [
            "Click on FAQ to learn how to use Echolocate!",
            "Need help? Check out the FAQ section!",
            "I'm here to guide you through your academic journey!",
            "Click FAQ to discover all the features!",
            "Let me help you get organized with your studies!"
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.showNotification(randomMessage);
        
        setTimeout(() => {
            this.switchView('faq');
        }, 2000);
    }

    saveAssignments() {
        localStorage.setItem('studybat-assignments', JSON.stringify(this.assignments));
    }

    saveStudySessions() {
        localStorage.setItem('studybat-sessions', JSON.stringify(this.studySessions));
    }

    filterAssignmentsByDate(date) {
        console.log('Filtering assignments for date:', date);
    }

    exportToCalendar() {
        const assignments = this.assignments.filter(a => a.status !== 'completed');
        const events = assignments.map(assignment => {
            const startDate = new Date(assignment.dueDate);
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
            
            return {
                title: assignment.title,
                start: startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
                end: endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
                description: `${assignment.subject} - ${assignment.description || 'No description'}`,
                location: assignment.subject
            };
        });

        let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//StudyBat//Academic Tracker//EN\n';
        
        events.forEach(event => {
            icsContent += `BEGIN:VEVENT\n`;
            icsContent += `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@studybat.com\n`;
            icsContent += `DTSTART:${event.start}\n`;
            icsContent += `DTEND:${event.end}\n`;
            icsContent += `SUMMARY:${event.title}\n`;
            icsContent += `DESCRIPTION:${event.description}\n`;
            icsContent += `LOCATION:${event.location}\n`;
            icsContent += `END:VEVENT\n`;
        });
        
        icsContent += 'END:VCALENDAR';

        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'studybat-assignments.ics';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showNotification('Calendar exported successfully!');
    }

    setupResponsiveFeatures() {
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResize();
            }, 100);
        });

        if ('ontouchstart' in window) {
            document.body.classList.add('touch-device');
        }

        this.updateLayoutForScreenSize();
    }

    handleResize() {
        this.updateLayoutForScreenSize();
        this.renderCalendar();
    }

    updateLayoutForScreenSize() {
        const width = window.innerWidth;
        const body = document.body;
        
        body.classList.remove('mobile', 'tablet', 'desktop', 'large-desktop');
        
        if (width < 480) {
            body.classList.add('mobile');
        } else if (width < 768) {
            body.classList.add('tablet');
        } else if (width < 1200) {
            body.classList.add('desktop');
        } else {
            body.classList.add('large-desktop');
        }

        if (width < 400) {
            const calendarGrid = document.getElementById('calendarGrid');
            if (calendarGrid) {
                calendarGrid.style.fontSize = '0.6rem';
            }
        }
    }

    setupMobileNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    document.getElementById('assignmentModal').classList.remove('active');
                });
            });
        }
    }
}

const studyBat = new StudyBat();
