// Modularized: see js/state.js, js/db.js, js/db-load.js, js/quiz-ui.js
// This file is now a stub for loading the main modules.
// Please ensure the following scripts are included in your HTML in this order:
// <script src="js/state.js"></script>
// <script src="js/db.js"></script>
// <script src="js/db-load.js"></script>
// <script src="js/quiz-ui.js"></script>
const QuizApp = {
    db: null,
    filteredQuestions: [],
    currentQuestionIndex: 0,
    correctAnswers: 0,
    incorrectAnswers: [],
    timer: null,
    timeLeft: 0,
    config: { courseName: '', chapters: [] },
    selectedCourse: '',
    selectedChapterName: '',
    dbName: 'quiz',
    dbBaseUrl: 'DB_BASE_URL', // replaced by build.bat
    dbFileName: 'DB_FILE_NAME', // replaced by build.bat
    forceDBDownload: true
};

// IndexedDB helpers
const DB = {
    open: () => new Promise((resolve, reject) => {
        const request = indexedDB.open(QuizApp.dbName, 1);
        request.onupgradeneeded = event => {
            event.target.result.createObjectStore('SQLiteStore');
        };
        request.onsuccess = event => resolve(event.target.result);
        request.onerror = event => reject('Error opening IndexedDB:', event.target.errorCode);
    }),
    store: (arrayBuffer, dbName) => DB.open().then(db => new Promise((resolve, reject) => {
        const transaction = db.transaction(['SQLiteStore'], 'readwrite');
        const store = transaction.objectStore('SQLiteStore');
        store.put(arrayBuffer, dbName);
        transaction.oncomplete = () => resolve();
        transaction.onerror = event => reject('Error storing the database:', event.target.errorCode);
    })),
    fetch: dbName => DB.open().then(db => new Promise((resolve, reject) => {
        const transaction = db.transaction(['SQLiteStore'], 'readonly');
        const store = transaction.objectStore('SQLiteStore');
        const request = store.get(dbName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = event => reject('Error fetching the database:', event.target.errorCode);
    }))
};

// Store a SQLite DB file in IndexedDB
function storeDatabaseInIndexedDB(arrayBuffer, dbName) {
    return openIndexedDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['SQLiteStore'], 'readwrite');
            const store = transaction.objectStore('SQLiteStore');
            store.put(arrayBuffer, dbName);  // Store the DB file with its name as the key
            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject('Error storing the database:', event.target.errorCode);
        });
    });
}

// Fetch the database file from IndexedDB by name
function fetchDatabaseFromIndexedDB(dbName) {
    return openIndexedDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['SQLiteStore'], 'readonly');
            const store = transaction.objectStore('SQLiteStore');
            const request = store.get(dbName);

            request.onsuccess = () => resolve(request.result);  // Return the file if found
            request.onerror = (event) => reject('Error fetching the database:', event.target.errorCode);
        });
    });
}

function loadDatabase(dbName) {
    if (QuizApp.forceDBDownload) {
        console.log(`Forcing new download of ${dbName} from ${QuizApp.dbBaseUrl}...`);
        fetchDatabaseFromServer(dbName, QuizApp.dbBaseUrl);
    } else {
        DB.fetch(dbName).then(dbData => {
            if (dbData) {
                console.log(`${dbName} loaded from IndexedDB`);
                initializeDatabase(new Uint8Array(dbData));
            } else {
                console.log(`${dbName} not found in IndexedDB, fetching from ${QuizApp.dbBaseUrl}...`);
                fetchDatabaseFromServer(dbName, QuizApp.dbBaseUrl);
            }
        }).catch(error => {
            console.error('Error fetching database from IndexedDB:', error);
            fetchDatabaseFromServer(dbName, QuizApp.dbBaseUrl);
        });
    }
}

function fetchDatabaseFromServer(dbName, baseUrl) {
    const dbPath = `${baseUrl}/${dbName}`;
    fetch(dbPath)
        .then(response => {
            if (!response.ok) throw new Error(`Failed to load ${dbName} from ${response.statusText}`);
            return response.arrayBuffer();
        })
        .then(data => {
            DB.store(data, dbName);
            initializeDatabase(new Uint8Array(data));
        })
        .catch(error => {
            console.error(`Failed to load ${dbName} from ${baseUrl}:`, error);
        });
}

function initializeDatabase(data) {
    window.initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.1/sql-wasm.wasm`
    }).then(SQL => {
        QuizApp.db = new SQL.Database(data);
        console.log('SQLite database initialized');
        fetchCourses();
    });
}

// Load the database on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDatabase(QuizApp.dbFileName);
});

// Fetch courses from the SQLite database
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


// Function to create and populate the scores table (unused, kept for reference)
function createScoresTable(scores, container) {
    // ...existing code...
}

// Create course selection dropdown
function createCourseSelection(courses) {
    const container = document.getElementById('quiz-container');
    container.innerHTML = '';

    // Quiz title
    const quizTitle = document.createElement('h1');
    quizTitle.id = 'quiz-title';
    quizTitle.className = 'text-center mb-4';
    quizTitle.innerText = 'Civil Engineering Technology Quiz App';

    // Disclaimer
    const disclaimer = document.createElement('p');
    disclaimer.id = 'disclaimer';
    disclaimer.className = 'text-center text-muted';
    disclaimer.innerText = 'This quiz is for personal development only. The content is not approved by Horry Georgetown Technical College.';

    // Version
    const version = document.createElement('p');
    version.id = 'version';
    version.className = 'text-left text-muted';
    version.innerText = 'version%version_number%';

    container.appendChild(quizTitle);
    container.appendChild(disclaimer);
    container.appendChild(version);

    // Course select label
    const courseSelectLabel = document.createElement('label');
    courseSelectLabel.innerText = "Select a Course:";
    courseSelectLabel.className = 'mb-2';

    // Select element
    const courseSelect = document.createElement('select');
    courseSelect.id = 'course-select';
    courseSelect.className = 'custom-select';
    courseSelect.style.maxWidth = '300px';
    courseSelect.style.margin = '0 auto';
    courseSelect.innerHTML = '<option value="" disabled selected>Select a course</option>';
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = course.name;
        courseSelect.appendChild(option);
    });
    container.appendChild(courseSelectLabel);
    container.appendChild(courseSelect);

    // Next button
    const startButton = document.createElement('button');
    startButton.innerText = 'Next';
    startButton.className = 'btn btn-primary mt-3';
    startButton.disabled = true;

    courseSelect.addEventListener('change', () => {
        startButton.disabled = !courseSelect.value;
        QuizApp.selectedCourse = courseSelect.value;
        console.log(`Course selected: ${QuizApp.selectedCourse}`);
    });

    startButton.onclick = () => {
        if (QuizApp.selectedCourse) {
            const selectedCourseName = courseSelect.options[courseSelect.selectedIndex].text;
            console.log(`Loading chapters for course: ${QuizApp.selectedCourse}, ${selectedCourseName}`);
            loadCourseConfig(QuizApp.selectedCourse, selectedCourseName);
        }
    };
    container.appendChild(startButton);
}

// Load course configuration (chapters and tests) from the SQLite database
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
        console.log('Chapters and tests loaded for course:', chapters, tests);
        QuizApp.config = { courseName: `${courseName}`, chapters, tests };
        createChapterAndTestSelection();
    } else {
        console.error('No chapters or tests found for the course.');
    }
}

function createChapterAndTestSelection() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = '';
    const courseNameElement = document.createElement('h1');
    courseNameElement.className = 'display-4 mb-4 text-center';
    courseNameElement.innerText = QuizApp.config.courseName;
    container.appendChild(courseNameElement);
    // Chapter dropdown
    const chapterSelect = document.createElement('select');
    chapterSelect.id = 'chapter-select';
    chapterSelect.className = 'custom-select mb-3';
    chapterSelect.innerHTML = '<option value="" disabled selected>Select a chapter</option>';
    QuizApp.config.chapters.forEach(chapter => {
        const option = document.createElement('option');
        option.value = chapter.id;
        option.setAttribute('data-name', chapter.name);
        option.textContent = chapter.name;
        chapterSelect.appendChild(option);
    });
    // Test dropdown
    const testSelect = document.createElement('select');
    testSelect.id = 'test-select';
    testSelect.className = 'custom-select mb-3';
    testSelect.innerHTML = '<option value="" disabled selected>Select a test</option>';
    QuizApp.config.tests.forEach(test => {
        const option = document.createElement('option');
        option.value = test.viewName;
        option.setAttribute('data-name', test.testName);
        option.textContent = test.testName;
        testSelect.appendChild(option);
    });
    container.appendChild(chapterSelect);
    container.appendChild(testSelect);
    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'd-flex justify-content-center mt-3';
    // Start chapter button
    const startChapterButton = document.createElement('button');
    startChapterButton.innerText = 'Start Chapter Quiz';
    startChapterButton.className = 'btn btn-primary';
    startChapterButton.disabled = true;
    chapterSelect.addEventListener('change', () => {
        startChapterButton.disabled = !chapterSelect.value;
    });
    startChapterButton.onclick = () => {
        const selectedChapterId = chapterSelect.value;
        const selectedOption = chapterSelect.options[chapterSelect.selectedIndex];
        QuizApp.selectedChapterName = selectedOption.getAttribute('data-name');
        if (selectedChapterId) {
            console.log(`Starting quiz for chapter: ${selectedChapterId}`);
            startQuiz(selectedChapterId, false);
        }
    };
    // Start test button
    const startTestButton = document.createElement('button');
    startTestButton.innerText = 'Start Test';
    startTestButton.className = 'btn btn-primary ml-3';
    startTestButton.disabled = true;
    testSelect.addEventListener('change', () => {
        startTestButton.disabled = !testSelect.value;
    });
    startTestButton.onclick = () => {
        const selectedOption = testSelect.options[testSelect.selectedIndex];
        QuizApp.selectedChapterName = selectedOption.getAttribute('data-name');
        const selectedTestView = testSelect.value;
        if (selectedTestView) {
            console.log(`Starting test from view: ${selectedTestView}`);
            startQuiz(selectedTestView, true);
        }
    };
    buttonContainer.appendChild(startChapterButton);
    buttonContainer.appendChild(startTestButton);
    container.appendChild(buttonContainer);
}

function startQuiz(dataSource, isView = false) {
    let query;
    if (isView) {
        query = `SELECT question_id, question_text, image, solution_text, importance FROM ${dataSource};`;
    } else {
        query = `SELECT q.id AS question_id, q.question_text, q.image, s.solution_text, q.importance FROM questions q LEFT JOIN solutions s ON q.id = s.question_id WHERE q.chapter_id = ?;`;
    }
    const results = isView ? QuizApp.db.exec(query) : QuizApp.db.exec(query, [dataSource]);
    if (results.length > 0) {
        const questions = results[0].values.map(row => ({
            questionId: row[0],
            question: row[1],
            image: row[2],
            solution: row[3],
            importance: row[4],
            answers: []
        }));
        // Shuffle and limit
        shuffleArray(questions);
        if (isView) questions.splice(30);
        // Fetch answers for each question
        questions.forEach((question) => {
            const answerQuery = `SELECT * FROM answers WHERE question_id = ?;`;
            const answerResults = QuizApp.db.exec(answerQuery, [question.questionId]);
            if (answerResults.length > 0) {
                question.answers = answerResults[0].values.map(answerRow => ({
                    text: answerRow[2],
                    correct: answerRow[3]
                }));
            }
        });
        QuizApp.filteredQuestions = questions;
        QuizApp.currentQuestionIndex = 0;
        QuizApp.correctAnswers = 0;
        QuizApp.incorrectAnswers = [];
        QuizApp.timeLeft = QuizApp.filteredQuestions.length * 60 * 10;
        document.getElementById('quiz-container').innerHTML = '';
        showQuizTimer();
        startQuizTimer();
        setNextQuestion();
    } else {
        console.error(`No questions found for ${isView ? 'view' : 'chapter'} ${dataSource}.`);
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startQuizTimer() {
    QuizApp.timer = setInterval(() => {
        QuizApp.timeLeft--;
        document.getElementById('quiz-timer').innerText = `Time Left: ${Math.floor(QuizApp.timeLeft / 60)}:${(QuizApp.timeLeft % 60).toString().padStart(2, '0')} minutes`;
        if (QuizApp.timeLeft <= 0) {
            clearInterval(QuizApp.timer);
            endQuiz();
        }
    }, 1000);
}

function showQuizTimer() {
    const container = document.getElementById('quiz-container');
    const timerElement = document.createElement('p');
    timerElement.id = 'quiz-timer';
    timerElement.className = 'lead text-center mb-4';
    timerElement.innerText = `Time Left: ${Math.floor(QuizApp.timeLeft / 60)}:${(QuizApp.timeLeft % 60).toString().padStart(2, '0')} minutes`;
    container.insertBefore(timerElement, container.firstChild);
}

function setNextQuestion() {
    resetState();
    showQuestion(QuizApp.filteredQuestions[QuizApp.currentQuestionIndex]);
}

function resetState() {
    const container = document.getElementById('quiz-container');
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    showQuizTimer();
}

function showQuestion(question) {
    const container = document.getElementById('quiz-container');
    // Chapter name
    const chapterNameElement = document.createElement('h4');
    chapterNameElement.className = 'text-center mb-3';
    chapterNameElement.textContent = QuizApp.selectedChapterName;
    container.appendChild(chapterNameElement);
    // Card
    const questionElement = document.createElement('div');
    questionElement.className = 'card mb-4 shadow-sm w-100';
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    cardBody.style.padding = '0';
    // Question ID
    const questionIdText = document.createElement('h4');
    questionIdText.className = 'card-header';
    questionIdText.style.backgroundColor = '#f8d7da';
    questionIdText.textContent = `Question ID: ${question.questionId}`;
    cardBody.appendChild(questionIdText);
    // Question text
    const questionText = document.createElement('h5');
    questionText.className = 'card-title';
    questionText.style.marginTop = '1.5em';
    try {
        const parsedMarkdown = marked.parse(question.question);
        if (typeof parsedMarkdown === "string" && parsedMarkdown.trim() !== "") {
            questionText.innerHTML = parsedMarkdown;
        } else {
            throw new Error("Parsed Markdown is empty or invalid.");
        }
    } catch (error) {
        questionText.textContent = question.question;
    }
    cardBody.appendChild(questionText);
    // Multiple correct answers?
    const multipleCorrectAnswers = question.answers.filter(answer => answer.correct).length > 1;
    const instructionText = document.createElement('p');
    instructionText.className = 'text-muted mb-3';
    instructionText.innerText = multipleCorrectAnswers ? 'Select all that apply:' : 'Select one:';
    cardBody.appendChild(instructionText);
    // Image
    if (question.image) {
        const questionImage = document.createElement('img');
        questionImage.src = question.image;
        questionImage.alt = "Question Image";
        questionImage.className = 'img-fluid mt-3 mb-3';
        cardBody.appendChild(questionImage);
    }
    // Answers
    const answerButtonsElement = document.createElement('div');
    answerButtonsElement.id = 'answer-buttons';
    answerButtonsElement.className = 'd-flex flex-column align-items-start mt-3';
    question.answers.sort(() => Math.random() - 0.5).forEach((answer, index) => {
        const inputLabel = document.createElement('label');
        inputLabel.className = 'btn btn-outline-secondary text-left mb-2 w-100 answer-label';
        const input = document.createElement('input');
        input.type = multipleCorrectAnswers ? 'checkbox' : 'radio';
        input.name = 'answer';
        input.value = index;
        input.className = 'mr-2';
        inputLabel.appendChild(input);
        inputLabel.appendChild(document.createTextNode(answer.text));
        answerButtonsElement.appendChild(inputLabel);
    });
    cardBody.appendChild(answerButtonsElement);
    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'd-flex justify-content-between mt-4';
    const exitButton = document.createElement('button');
    exitButton.id = 'exit-button';
    exitButton.innerText = 'Exit';
    exitButton.className = 'btn btn-danger';
    exitButton.onclick = () => {
        if (confirm('Are you sure you want to exit the quiz? All progress will be lost.')) window.location.reload();
    };
    buttonContainer.appendChild(exitButton);
    const submitButton = document.createElement('button');
    submitButton.id = 'submit-button';
    submitButton.innerText = 'Submit';
    submitButton.className = 'btn btn-primary';
    submitButton.onclick = submitAnswer;
    buttonContainer.appendChild(submitButton);
    cardBody.appendChild(buttonContainer);
    questionElement.appendChild(cardBody);
    container.appendChild(questionElement);
    // Solution area
    const solutionElement = document.createElement('div');
    solutionElement.id = 'solution';
    solutionElement.style.display = 'none';
    container.appendChild(solutionElement);
    MathJax.typeset();
}

function submitAnswer() {
    const selectedAnswers = document.querySelectorAll('input[name="answer"]:checked');
    const currentQuestion = QuizApp.filteredQuestions[QuizApp.currentQuestionIndex];
    if (selectedAnswers.length === 0) {
        alert("Please select at least one answer.");
        return;
    }
    const correctIndices = currentQuestion.answers.map((answer, index) => answer.correct ? index : null).filter(index => index !== null);
    const selectedIndices = Array.from(selectedAnswers).map(answer => parseInt(answer.value));
    let allCorrect = true;
    const answerLabels = document.querySelectorAll('.answer-label');
    selectedIndices.forEach(index => {
        const isCorrect = correctIndices.includes(index);
        answerLabels[index].classList.add(isCorrect ? 'btn-success-subtle' : 'btn-danger-subtle');
        if (!isCorrect) allCorrect = false;
    });
    correctIndices.forEach(index => {
        if (!selectedIndices.includes(index)) {
            answerLabels[index].classList.add('btn-warning-subtle');
            allCorrect = false;
        }
    });
    document.querySelectorAll('input[name="answer"]').forEach(input => {
        input.disabled = true;
    });
    if (allCorrect) QuizApp.correctAnswers++;
    const solutionElement = document.getElementById('solution');
    if (currentQuestion.solution) {
        const solutionText = currentQuestion.solution || 'No solution provided.';
        const htmlSolution = marked.parse(solutionText);
        solutionElement.style.display = 'block';
        solutionElement.innerHTML = `<h5>Solution:</h5><div>${htmlSolution}</div>`;
    }
    const submitButton = document.getElementById('submit-button');
    submitButton.innerText = 'Next';
    submitButton.onclick = nextQuestion;
}

function nextQuestion() {
    QuizApp.currentQuestionIndex++;
    if (QuizApp.currentQuestionIndex < QuizApp.filteredQuestions.length) {
        setNextQuestion();
    } else {
        endQuiz();
    }
}

function endQuiz() {
    clearInterval(QuizApp.timer);
    resetState();
    const scoreElement = document.createElement('h2');
    scoreElement.className = 'display-5 text-center';
    scoreElement.innerText = `You answered ${QuizApp.correctAnswers} out of ${QuizApp.filteredQuestions.length} questions correctly!`;
    document.getElementById('quiz-container').appendChild(scoreElement);
    const restartButton = document.createElement('button');
    restartButton.innerText = 'Restart';
    restartButton.className = 'btn btn-secondary mt-4';
    restartButton.onclick = () => location.reload();
    document.getElementById('quiz-container').appendChild(restartButton);
}
