let courses = [];
let assignments = [];
let exams = [];


// const app = express();

// const { MongoClient } = require('mongodb');
// const uri =   'mongodb+srv://Aditya:1234$@cluster0.rl4qm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
// const dbName = "ScheduleGenerator"; // Replace with your database name

function addCourse() {
    const courseName = document.getElementById('courseName').value;
    if (!courseName) return;

    courses.push({
        id: Date.now(),
        name: courseName
    });

    updateCourseSelects();
    document.getElementById('courseName').value = '';
    updateScheduleDisplay();
}

function addAssignment() {
    const courseId = document.getElementById('courseSelect').value;
    const assignmentName = document.getElementById('assignmentName').value;
    const deadline = document.getElementById('assignmentDeadline').value;

    if (!courseId || !assignmentName || !deadline) return;

   

    assignments.push({
        id: Date.now(),
        courseId: parseInt(courseId),
        name: assignmentName,
        deadline: new Date(deadline)
    });

    document.getElementById('assignmentName').value = '';
    document.getElementById('assignmentDeadline').value = '';
    updateScheduleDisplay();
}

function addExam() {
    const courseId = document.getElementById('examCourseSelect').value;
    const examDate = document.getElementById('examDate').value;

    if (!courseId || !examDate) return;


    exams.push({
        id: Date.now(),
        courseId: parseInt(courseId),
        date: new Date(examDate)
    });

    document.getElementById('examDate').value = '';
    updateScheduleDisplay();
}

function updateCourseSelects() {
    const courseSelects = [
        document.getElementById('courseSelect'),
        document.getElementById('examCourseSelect')
    ];

    courseSelects.forEach(select => {
        select.innerHTML = '<option value="">Select Course</option>';
        courses.forEach(course => {
            select.innerHTML += `<option value="${course.id}">${course.name}</option>`;
        });
    });
}

function generateSchedule() {
    // Sort assignments and exams by date
    const allTasks = [
        ...assignments.map(a => ({ ...a, type: 'assignment' })),
        ...exams.map(e => ({ ...e, type: 'exam' }))
    ].sort((a, b) => {
        const dateA = a.type === 'assignment' ? a.deadline : a.date;
        const dateB = b.type === 'assignment' ? b.deadline : b.date;
        return dateA - dateB;
    });

    // Generate study blocks
    const studyBlocks = [];
    allTasks.forEach(task => {
        const course = courses.find(c => c.id === task.courseId);
        const taskDate = task.type === 'assignment' ? task.deadline : task.date;
        const daysUntil = Math.ceil((taskDate - new Date()) / (1000 * 60 * 60 * 24));

        if (daysUntil > 0) {
            const studyHoursPerDay = task.type === 'exam' ? 2 : 1;
            for (let i = 0; i < daysUntil; i++) {
                const studyDate = new Date();
                studyDate.setDate(studyDate.getDate() + i);
                studyBlocks.push({
                    course: course.name,
                    date: studyDate,
                    hours: studyHoursPerDay,
                    task: task.type === 'assignment' ? task.name : 'Exam preparation'
                });
            }
        }
    });

    updateScheduleDisplay(studyBlocks);
}

function updateScheduleDisplay(studyBlocks = []) {
    const container = document.getElementById('scheduleContainer');
    let html = '<h2>Courses</h2>';

    // Display courses
    courses.forEach(course => {
        html += `
                    <div class="course-item">
                        <h3>${course.name}</h3>
                    </div>
                `;
    });

    // Display assignments
    html += '<h2>Assignments</h2>';
    assignments.forEach(assignment => {
        const course = courses.find(c => c.id === assignment.courseId);
        html += `
                    <div class="assignment-item">
                        <h3>${assignment.name}</h3>
                        <p>Course: ${course ? course.name : 'Unknown'}</p>
                        <p class="deadline">Deadline: ${assignment.deadline.toLocaleDateString()}</p>
                    </div>
                `;
    });

    // Display exams
    html += '<h2>Exams</h2>';
    exams.forEach(exam => {
        const course = courses.find(c => c.id === exam.courseId);
        html += `
                    <div class="assignment-item">
                        <h3>${course ? course.name : 'Unknown'} Exam</h3>
                        <p class="deadline">Date: ${exam.date.toLocaleDateString()}</p>
                    </div>
                `;
    });

    // Display study blocks
    if (studyBlocks.length > 0) {
        html += '<h2>Study Schedule</h2>';
        studyBlocks.forEach(block => {
            html += `
                        <div class="study-block">
                            <h3>${block.course}</h3>
                            <p>Date: ${block.date.toLocaleDateString()}</p>
                            <p>Task: ${block.task}</p>
                            <p>Study Hours: ${block.hours}</p>
                        </div>
                    `;
        });
    }

    container.innerHTML = html;
}



// // POST endpoint to handle data saving
// app.post('/save_data', async (req, res) => {
//     const { courses, assignments, exams } = req.body;

//     // Check if the required data is provided
//     if (!courses || !assignments || !exams) {
//         return res.status(400).json({ success: false, message: 'Missing required fields' });
//     }

//     try {
//         // Insert data into individual collections
//         if (courses.length > 0) {
//             await db.collection('courses').insertMany(
//                 courses.map(course => ({ course_name: course }))
//             );
//         }

//         if (assignments.length > 0) {
//             await db.collection('assignments').insertMany(
//                 assignments.map(assignment => ({ assignment_name: assignment }))
//             );
//         }

//         if (exams.length > 0) {
//             await db.collection('exams').insertMany(
//                 exams.map(exam => ({ exam_name: exam }))
//             );
//         }

//         res.json({ success: true, message: 'Data saved successfully' });
//     } catch (error) {
//         console.error('Error saving data:', error);
//         res.status(500).json({ success: false, message: 'An error occurred while saving data' });
//     }
// });



function saveDataToBackend() {
    const data = {
        courses,
        assignments,
        exams
    };

    fetch('/save_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Data saved successfully!');
            } else {
                alert('Failed to save data.');
            }
        })
        .catch(error => console.error('Error saving data:', error));
}



document.addEventListener('DOMContentLoaded', () => {
    fetchCourses();
    fetchAssignments();
    fetchExams();
});


