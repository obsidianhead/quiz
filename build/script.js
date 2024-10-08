let db;  // Global variable for SQLite database
let allQuestions, filteredQuestions, currentQuestionIndex, correctAnswers, incorrectAnswers, timer;
let timeLeft;  // Dynamically calculated based on the number of questions
let config = { courseName: '', chapters: [] };
let selectedCourse = '';
let selectedChapterName = '';
const dbName = 'quiz';  // Database name
const blobBaseUrl = 'https://quizstore.blob.core.windows.net/database';  // Base URL for the blob storage
const localBaseUrl = './db';  // Base URL for local testing (local folder path)
let isLocalMode = false;  // Set to 'true' for local testing, 'false' for Azure Blob
const forceDBDownload = false;  // Toggle between force download or use of IndexedDB

// Open or create the IndexedDB
function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        
        // Create schema if necessary
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            db.createObjectStore('SQLiteStore');  // Create a store to hold the SQLite database files
        };
        
        request.onsuccess = function(event) {
            resolve(event.target.result);
        };
        
        request.onerror = function(event) {
            reject('Error opening IndexedDB:', event.target.errorCode);
        };
    });
}

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

// Load a specific database (e.g., 'quiz-v1.db')
function loadDatabase(dbName) {
    const baseUrl = isLocalMode ? localBaseUrl : blobBaseUrl;

    if (forceDBDownload) {
        console.log(`Forcing new download of ${dbName} from ${isLocalMode ? 'local' : 'Azure Blob'}...`);
        fetchDatabaseFromServer(dbName, baseUrl);
    } else {
        fetchDatabaseFromIndexedDB(dbName).then(dbData => {
            if (dbData) {
                console.log(`${dbName} loaded from IndexedDB`);
                initializeDatabase(new Uint8Array(dbData));  // Initialize the SQLite DB using sql.js
            } else {
                console.log(`${dbName} not found in IndexedDB, fetching from ${isLocalMode ? 'local' : 'Azure Blob'}...`);
                fetchDatabaseFromServer(dbName, baseUrl);
            }
        }).catch(error => {
            console.error('Error fetching database from IndexedDB:', error);
            // Fallback to fetching from server if IndexedDB fails
            fetchDatabaseFromServer(dbName, baseUrl);
        });
    }
}

// Fetch the database file from the server (or local) and store in IndexedDB
function fetchDatabaseFromServer(dbName, baseUrl) {
    const dbPath = `${baseUrl}/${dbName}`;  // Use local or blob base URL based on mode
    fetch(dbPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${dbName} from ${isLocalMode ? 'local' : 'Azure Blob'}: ${response.statusText}`);
            }
            return response.arrayBuffer();
        })
        .then(data => {
            storeDatabaseInIndexedDB(data, dbName);  // Store new DB in IndexedDB
            initializeDatabase(new Uint8Array(data));  // Initialize the SQLite DB using sql.js
        })
        .catch(error => {
            console.error(`Failed to load ${dbName} from ${isLocalMode ? 'local' : 'Azure Blob'}:`, error);
        });
}

// Initialize the SQLite database with sql.js
function initializeDatabase(data) {
    const SQL = window.initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.1/sql-wasm.wasm`
    });

    SQL.then(SQL => {
        db = new SQL.Database(data);  // Load the SQLite database into sql.js
        console.log('SQLite database initialized');
        fetchCourses();  // Fetch the courses after database is initialized
    });
}

// Load the database on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDatabase('quiz-v3.db');  // You can specify 'quiz-v1.db' or any version
});

// Fetch courses from the SQLite database
function fetchCourses() {
    const results = db.exec("SELECT * FROM courses;");
    if (results.length > 0) {
        const courses = results[0].values.map(row => ({
            id: row[0],  // Assuming first column is course ID
            name: row[1] // Assuming second column is course name
        }));
        createCourseSelection(courses);  // Pass courses to your existing function
    }
}


// Create course selection dropdown
function createCourseSelection(courses) {
    const container = document.getElementById('quiz-container');
    container.innerHTML = '';  // Clear previous content

    const courseSelectLabel = document.createElement('label');
    courseSelectLabel.innerText = "Select a Course:";
    courseSelectLabel.className = 'mb-2';

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

    const startButton = document.createElement('button');
    startButton.innerText = 'Next';
    startButton.className = 'btn btn-primary mt-3';
    startButton.disabled = true;

    courseSelect.addEventListener('change', () => {
        startButton.disabled = !courseSelect.value;
        selectedCourse = courseSelect.value;
        console.log(`Course selected: ${selectedCourse}`);
    });

    startButton.onclick = () => {
        if (selectedCourse) {
            console.log(`Loading chapters for course: ${selectedCourse}`);
            loadCourseConfig(selectedCourse);
        }
    };

    container.appendChild(startButton);
}

// Load course configuration (chapters) from the SQLite database
function loadCourseConfig(courseId) {
    const query = `SELECT * FROM chapters WHERE course_id = ?;`;
    const results = db.exec(query, [courseId]);

    if (results.length > 0) {
        const chapters = results[0].values.map(row => ({
            id: row[0],  // Assuming first column is the chapter number
            name: row[2]  // Assuming second column is the chapter name
        }));
        console.log('Chapters loaded for course:', chapters);
        config = { courseName: `Course ${courseId}`, chapters };
        createChapterSelection();  // Create chapter selection UI
    } else {
        console.error('No chapters found for the course.');
    }
}

// Create chapter selection dropdown
function createChapterSelection() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = '';  // Clear previous content

    const courseNameElement = document.createElement('h1');
    courseNameElement.className = 'display-4 mb-4 text-center';
    courseNameElement.innerText = config.courseName;
    container.appendChild(courseNameElement);

    const selectGroup = document.createElement('div');
    selectGroup.className = 'input-group mb-3';

    const select = document.createElement('select');
    select.id = 'chapter-select';
    select.className = 'custom-select';
    select.style.maxWidth = '300px';
    select.style.margin = '0 auto';

    // Populate the dropdown with chapter names but use the chapter ID as the value
    select.innerHTML = '<option value="" disabled selected>Select a chapter</option>';
    config.chapters.forEach(chapter => {
        const option = document.createElement('option');
        option.value = chapter.id;  // Use the chapter ID (or number) as the value
        option.textContent = chapter.name;  // Display the chapter name in the dropdown
        select.appendChild(option);
    });

    selectGroup.appendChild(select);
    container.appendChild(selectGroup);

    const startButton = document.createElement('button');
    startButton.innerText = 'Start Quiz';
    startButton.className = 'btn btn-primary mt-3';
    startButton.disabled = true;

    // Enable the start button only when a valid chapter is selected
    select.addEventListener('change', () => {
        startButton.disabled = !select.value;
        console.log(`Chapter selected: ${select.value}`);
    });

    // When the start button is clicked, match the selected chapter ID to start the quiz
    startButton.onclick = () => {
        const selectedChapterId = select.value;  // Get the selected chapter ID
        const selectedChapterObject = config.chapters.find(chapter => chapter.id == selectedChapterId);  // Find the matching chapter by ID
        selectedChapterName = selectedChapterObject.name;
        console.log(`Starting quiz for chapter: ${selectedChapterName} (ID: ${selectedChapterId})`);
        startQuiz(selectedChapterId);  // Pass the chapter ID to the startQuiz function
    };

    container.appendChild(startButton);
}

// Start the quiz by loading questions for the selected chapter
function startQuiz(chapterId) {
    // Fetch questions and their solutions in one query using a JOIN
    const query = `
        SELECT q.id, q.question_text, q.image, s.solution_text
        FROM questions q
        LEFT JOIN solutions s ON q.id = s.question_id
        WHERE q.chapter_id = ?;
    `;
    
    const results = db.exec(query, [chapterId]);

    if (results.length > 0) {
        const questions = results[0].values.map(row => ({
            questionId: row[0],  // Question ID
            question: row[1],    // Question text
            image: row[2],       // Image URL (if any)
            solution: row[3],    // Solution text (if any)
            answers: []          // Answers will be fetched separately
        }));

        // Fetch answers for the questions
        questions.forEach((question, index) => {
            const answerQuery = `SELECT * FROM answers WHERE question_id = ?;`;
            const answerResults = db.exec(answerQuery, [question.questionId]);  // Use questionId for answers

            if (answerResults.length > 0) {
                question.answers = answerResults[0].values.map(answerRow => ({
                    text: answerRow[2],    // Answer text
                    correct: answerRow[3]  // Is the answer correct
                }));
            }
        });

        filteredQuestions = questions.sort(() => Math.random() - 0.5);
        currentQuestionIndex = 0;
        correctAnswers = 0;
        incorrectAnswers = [];

        timeLeft = filteredQuestions.length * 60;

        document.getElementById('quiz-container').innerHTML = '';
        showQuizTimer();
        startQuizTimer();
        setNextQuestion();
    } else {
        console.error(`No questions found for chapter ${chapterId}.`);
    }
}

// Start the quiz timer
function startQuizTimer() {
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('quiz-timer').innerText = `Time Left: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')} minutes`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            endQuiz();
        }
    }, 1000);
}

function showQuizTimer() {
    const container = document.getElementById('quiz-container');
    const timerElement = document.createElement('p');
    timerElement.id = 'quiz-timer';
    timerElement.className = 'lead text-center mb-4';
    timerElement.innerText = `Time Left: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')} minutes`;
    container.insertBefore(timerElement, container.firstChild);
}

function setNextQuestion() {
    resetState();
    showQuestion(filteredQuestions[currentQuestionIndex]);
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
    const chapterNameElement = document.createElement('h4');
    chapterNameElement.className = 'text-center mb-3';
    chapterNameElement.textContent = selectedChapterName;  // Use textContent to handle special characters
    container.appendChild(chapterNameElement);

    const questionElement = document.createElement('div');
    questionElement.className = 'card mb-4 shadow-sm w-100';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const questionText = document.createElement('h5');
    questionText.className = 'card-title';
    questionText.textContent = question.question;  // Use textContent to handle apostrophes and special characters
    cardBody.appendChild(questionText);

    if (question.image) {
        const questionImage = document.createElement('img');
        questionImage.src = question.image;
        questionImage.alt = "Question Image";
        questionImage.className = 'img-fluid mt-3 mb-3';
        cardBody.appendChild(questionImage);
    }

    const answerButtonsElement = document.createElement('div');
    answerButtonsElement.id = 'answer-buttons';
    answerButtonsElement.className = 'd-flex flex-column align-items-start mt-3';

    question.answers.sort(() => Math.random() - 0.5).forEach((answer, index) => {
        const radioLabel = document.createElement('label');
        radioLabel.className = 'btn btn-outline-secondary text-left mb-2 w-100 answer-label';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'answer';
        radio.value = index;
        radio.className = 'mr-2';

        radioLabel.appendChild(radio);

        // Create text node for the answer text to handle special characters like apostrophes
        const answerText = document.createTextNode(answer.text);  
        radioLabel.appendChild(answerText);

        answerButtonsElement.appendChild(radioLabel);
    });

    cardBody.appendChild(answerButtonsElement);

    const submitButton = document.createElement('button');
    submitButton.id = 'submit-button';
    submitButton.innerText = 'Submit';
    submitButton.className = 'btn btn-primary mt-4';
    submitButton.onclick = submitAnswer;
    cardBody.appendChild(submitButton);

    questionElement.appendChild(cardBody);
    container.appendChild(questionElement);

    const solutionElement = document.createElement('div');
    solutionElement.id = 'solution';
    solutionElement.style.display = 'none';
    container.appendChild(solutionElement);
}

function submitAnswer() {
    const selectedAnswer = document.querySelector('input[name="answer"]:checked');
    const currentQuestion = filteredQuestions[currentQuestionIndex];

    if (!selectedAnswer) {
        alert("Please select an answer.");
        return;
    }

    const selectedIndex = parseInt(selectedAnswer.value);
    const correctIndex = currentQuestion.answers.findIndex(answer => answer.correct);

    // Mark answers
    const answerLabels = document.querySelectorAll('label');
    answerLabels[selectedIndex].classList.add(selectedIndex === correctIndex ? 'btn-success' : 'btn-danger');
    answerLabels[correctIndex].classList.add('btn-success');

    // Check if the selected answer is correct and increment the correctAnswers counter
    if (selectedIndex === correctIndex) {
        correctAnswers++;
    }

    // Show the solution (solution is associated with the question)
    const solutionElement = document.getElementById('solution');
    if (currentQuestion.solution) {
        const solutionText = currentQuestion.solution || 'No solution provided.';
        solutionElement.style.display = 'block';
        solutionElement.innerHTML = `<h5>Solution:</h5><p>${solutionText}</p>`;  // Render the solution

        // Re-render MathJax to process any LaTeX (optional)
        if (window.MathJax) {
            MathJax.typeset();
        }
    }

    // Disable the submit button and change to "Next"
    const submitButton = document.getElementById('submit-button');
    submitButton.innerText = 'Next';
    submitButton.onclick = nextQuestion;
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < filteredQuestions.length) {
        setNextQuestion();
    } else {
        endQuiz();
    }
}

function endQuiz() {
    clearInterval(timer);
    resetState();
    const scoreElement = document.createElement('h2');
    scoreElement.className = 'display-5 text-center';
    scoreElement.innerText = `You answered ${correctAnswers} out of ${filteredQuestions.length} questions correctly!`;
    document.getElementById('quiz-container').appendChild(scoreElement);

    const restartButton = document.createElement('button');
    restartButton.innerText = 'Restart';
    restartButton.className = 'btn btn-secondary mt-4';
    restartButton.onclick = () => location.reload();
    document.getElementById('quiz-container').appendChild(restartButton);
}
