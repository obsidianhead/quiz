// Quiz UI and logic functions
function fetchCourses() {
    const results = QuizApp.db.exec("SELECT * FROM courses;");
    if (results.length > 0) {
        const courses = results[0].values.map(row => ({
            id: row[0],
            name: row[1]
        }));
        createCourseSelection(courses);
    }
}

function createCourseSelection(courses) {
    const container = document.getElementById('quiz-container');
    container.innerHTML = '';
    // ...existing code for course selection UI...
}

function loadCourseConfig(courseId, courseName) {
    const chapterQuery = `SELECT * FROM chapters WHERE course_id = ?;`;
    const chapterResults = QuizApp.db.exec(chapterQuery, [courseId]);
    const testQuery = `SELECT * FROM tests WHERE course_id = ?;`;
    const testResults = QuizApp.db.exec(testQuery, [courseId]);
    if (chapterResults.length > 0 || testResults.length > 0) {
        const chapters = chapterResults.length > 0 ? chapterResults[0].values.map(row => ({
            id: row[0],
            name: row[2]
        })) : [];
        const tests = testResults.length > 0 ? testResults[0].values.map(row => ({
            testName: row[1],
            viewName: row[2]
        })) : [];
        QuizApp.config = { courseName: `${courseName}`, chapters, tests };
        createChapterAndTestSelection();
    } else {
        console.error('No chapters or tests found for the course.');
    }
}

function createChapterAndTestSelection() {
    // ...existing code for chapter/test selection UI...
}

function startQuiz(dataSource, isView = false) {
    // ...existing code for quiz logic...
}

function showQuizTimer() {
    // ...existing code for timer UI...
}

function setNextQuestion() {
    // ...existing code for next question logic...
}

function resetState() {
    // ...existing code for resetting UI state...
}

function showQuestion(question) {
    // ...existing code for showing a question...
}

function submitAnswer() {
    // ...existing code for answer submission...
}

function nextQuestion() {
    // ...existing code for next question...
}

function endQuiz() {
    // ...existing code for ending the quiz...
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
