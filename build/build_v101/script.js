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
    loadDatabase('quiz_v101.db');  // You can specify 'quiz-v1.db' or any version
});

// Fetch courses from the SQLite database
async function fetchCourses() {
    const results = db.exec("SELECT * FROM courses;");
    if (results.length > 0) {
        const courses = results[0].values.map(row => ({
            id: row[0],  // Assuming first column is course ID
            name: row[1] // Assuming second column is course name
        }));

        // Call createCourseSelection and chain .then() for the fetch
        createCourseSelection(courses).then(() => {
            const apiUrl = "https://api.qualia-sc.com/test-scores";
            return fetch(apiUrl);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json(); // Parse the JSON from the response
        })
        .then(data => {
            const container = document.getElementById('quiz-container');
            // uncomment to add scores tables
            // createScoresTable(data.scores, container);
        })
        .catch(error => {
            console.error("Error fetching data:", error);
        });
    }
}


// Function to create and populate the scores table
function createScoresTable(scores, container) {
    // Create the table element
    const scoresTable = document.createElement('table');
    scoresTable.id = 'scores-table';
    scoresTable.className = 'table table-striped';
  
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
  
    const headers = ['Name', 'Course', 'Chapter', 'Score'];
    headers.forEach(headerText => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.innerText = headerText;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
  
    // Create table body
    const tbody = document.createElement('tbody');
  
    scores.forEach(score => {
      const row = document.createElement('tr');
  
      const nameCell = document.createElement('td');
      nameCell.innerText = score.name;
  
      const courseCell = document.createElement('td');
      courseCell.innerText = score.course;
  
      const chapterCell = document.createElement('td');
      chapterCell.innerText = score.chapter;
  
      const scoreCell = document.createElement('td');
      scoreCell.innerText = score.score;
  
      row.appendChild(nameCell);
      row.appendChild(courseCell);
      row.appendChild(chapterCell);
      row.appendChild(scoreCell);
  
      tbody.appendChild(row);
    });
  
    // Append thead and tbody to the table
    scoresTable.appendChild(thead);
    scoresTable.appendChild(tbody);
  
    // Append the table to the container
    container.appendChild(scoresTable);
  }

// Create course selection dropdown
async function createCourseSelection(courses) {
    return new Promise((resolve) => {
        const container = document.getElementById('quiz-container');
    container.innerHTML = '';  // Clear previous content

    // Create the quiz title
    const quizTitle = document.createElement('h1');
    quizTitle.id = 'quiz-title';
    quizTitle.className = 'text-center mb-4';
    quizTitle.innerText = 'Civil Engineering Technology Quiz App';
    
    // Create the disclaimer
    const disclaimer = document.createElement('p');
    disclaimer.id = 'disclaimer';
    disclaimer.className = 'text-center text-muted';
    disclaimer.innerText = 'This quiz is for personal development only. The content is not approved by Horry Georgetown Technical College.';

    // Versioning
    const version = document.createElement('p');
    version.id = 'version'
    version.className = 'text-left text-muted';
    version.innerText = 'version%version_number%';

    // Append title, disclaimer, version, and scores table to the container
    container.appendChild(quizTitle);
    container.appendChild(disclaimer);
    container.appendChild(version);

    // Create course select label
    const courseSelectLabel = document.createElement('label');
    courseSelectLabel.innerText = "Select a Course:";
    courseSelectLabel.className = 'mb-2';

    // Create the select element
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

    // Append the course select elements to the container
    container.appendChild(courseSelectLabel);
    container.appendChild(courseSelect);

    // Create the "Next" button
    const startButton = document.createElement('button');
    startButton.innerText = 'Next';
    startButton.className = 'btn btn-primary mt-3';
    startButton.disabled = true;

    // Event listener to enable the button once a course is selected
    courseSelect.addEventListener('change', () => {
        startButton.disabled = !courseSelect.value;
        selectedCourse = courseSelect.value;
        console.log(`Course selected: ${selectedCourse}`);
    });

    // Event listener for the button to load the selected course's chapters
    startButton.onclick = () => {
        if (selectedCourse) {
            const selectedCourseName = courseSelect.options[courseSelect.selectedIndex].text;
            console.log(`Loading chapters for course: ${selectedCourse}, ${selectedCourseName}`);
            loadCourseConfig(selectedCourse, selectedCourseName); // Pass both ID and name
        }
    };

    // Append the "Next" button to the container
    container.appendChild(startButton);
    resolve();
    });
}

// Load course configuration (chapters and tests) from the SQLite database
function loadCourseConfig(courseId, courseName) {
    const chapterQuery = `SELECT * FROM chapters WHERE course_id = ?;`;
    const chapterResults = db.exec(chapterQuery, [courseId]);

    const testQuery = `SELECT * FROM tests WHERE course_id = ?;`;
    const testResults = db.exec(testQuery, [courseId]);

    if (chapterResults.length > 0 || testResults.length > 0) {
        const chapters = chapterResults.length > 0 ? chapterResults[0].values.map(row => ({
            id: row[0],  // Assuming first column is the chapter ID
            name: row[2]  // Assuming third column is the chapter name
        })) : [];

        const tests = testResults.length > 0 ? testResults[0].values.map(row => ({
            testName: row[1],   // Test name
            viewName: row[2]    // Corresponding view name in the database
        })) : [];

        console.log('Chapters and tests loaded for course:', chapters, tests);
        
        // Set the course name here instead of the ID
        config = { courseName: `${courseName}`, chapters, tests };
        createChapterAndTestSelection();  // Create both chapter and test selection UI
    } else {
        console.error('No chapters or tests found for the course.');
    }
}

// Create chapter and test selection
// Create chapter and test selection
function createChapterAndTestSelection() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = '';  // Clear previous content

    const courseNameElement = document.createElement('h1');
    courseNameElement.className = 'display-4 mb-4 text-center';
    courseNameElement.innerText = config.courseName;
    container.appendChild(courseNameElement);

    // Create a dropdown for chapters
    const chapterSelect = document.createElement('select');
    chapterSelect.id = 'chapter-select';
    chapterSelect.className = 'custom-select mb-3';
    chapterSelect.innerHTML = '<option value="" disabled selected>Select a chapter</option>';

    config.chapters.forEach(chapter => {
        const option = document.createElement('option');
        option.value = chapter.id;
        option.textContent = chapter.name;
        chapterSelect.appendChild(option);
    });

    // Create a dropdown for tests
    const testSelect = document.createElement('select');
    testSelect.id = 'test-select';
    testSelect.className = 'custom-select mb-3';
    testSelect.innerHTML = '<option value="" disabled selected>Select a test</option>';

    config.tests.forEach(test => {
        const option = document.createElement('option');
        option.value = test.viewName;  // The view name in the database
        option.textContent = test.testName;
        testSelect.appendChild(option);
    });

    container.appendChild(chapterSelect);
    container.appendChild(testSelect);

    // Create a flex container to hold both start buttons in a row
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'd-flex justify-content-center mt-3';

    // Create start button for chapters
    const startChapterButton = document.createElement('button');
    startChapterButton.innerText = 'Start Chapter Quiz';
    startChapterButton.className = 'btn btn-primary';
    startChapterButton.disabled = true;

    chapterSelect.addEventListener('change', () => {
        startChapterButton.disabled = !chapterSelect.value;
    });

    startChapterButton.onclick = () => {
        const selectedChapterId = chapterSelect.value;
        selectedChapterName = chapterSelect.textContent;
        if (selectedChapterId) {
            console.log(`Starting quiz for chapter: ${selectedChapterId}`); 
            startQuiz(selectedChapterId, false);  // Pass false to indicate this is a chapter
        }
    };

    // Create start button for tests
    const startTestButton = document.createElement('button');
    startTestButton.innerText = 'Start Test';
    startTestButton.className = 'btn btn-primary ml-3';  // Add margin to separate buttons
    startTestButton.disabled = true;

    testSelect.addEventListener('change', () => {
        startTestButton.disabled = !testSelect.value;
    });

    startTestButton.onclick = () => {
        selectedChapterName = testSelect.textContent
        const selectedTestView = testSelect.value;
        if (selectedTestView) {
            console.log(`Starting test from view: ${selectedTestView}`);
            startQuiz(selectedTestView, true);  // Pass true to indicate this is a view
        }
    };

    // Append both buttons to the flex container
    buttonContainer.appendChild(startChapterButton);
    buttonContainer.appendChild(startTestButton);

    // Append the button container to the main container
    container.appendChild(buttonContainer);
}

// Generalized startQuiz function to load questions from either a chapter or a view
function startQuiz(dataSource, isView = false) {
    let query;
    if (isView) {
        query = `
            SELECT question_id, question_text, image, solution_text, importance
            FROM ${dataSource};
        `;
    } else {
        query = `
            SELECT q.id AS question_id, q.question_text, q.image, s.solution_text, q.importance
            FROM questions q
            LEFT JOIN solutions s ON q.id = s.question_id
            WHERE q.chapter_id = ?;
        `;
    }

    const results = isView ? db.exec(query) : db.exec(query, [dataSource]);
    if (results.length > 0) {
        const questions = results[0].values.map(row => ({
            questionId: row[0],
            question: row[1],
            image: row[2],
            solution: row[3],
            importance: row[4],
            answers: []
        }));

        // Randomize questions using Fisher-Yates Shuffle
        if (isView) {
            shuffleArray(questions); // Shuffle all questions
            questions.splice(30);    // Limit to 30 questions
        } else {
            shuffleArray(questions); // Shuffle chapter questions too
        }

        // Fetch answers for each question
        questions.forEach((question) => {
            const answerQuery = `SELECT * FROM answers WHERE question_id = ?;`;
            const answerResults = db.exec(answerQuery, [question.questionId]);
            if (answerResults.length > 0) {
                question.answers = answerResults[0].values.map(answerRow => ({
                    text: answerRow[2],
                    correct: answerRow[3]
                }));
            }
        });

        // Process the questions
        filteredQuestions = questions;
        currentQuestionIndex = 0;
        correctAnswers = 0;
        incorrectAnswers = [];
        timeLeft = filteredQuestions.length * 60 * 10; // 1 minute per question
        document.getElementById('quiz-container').innerHTML = '';
        showQuizTimer();
        startQuizTimer();
        setNextQuestion();
    } else {
        console.error(`No questions found for ${isView ? 'view' : 'chapter'} ${dataSource}.`);
    }
}

// Fisher-Yates Shuffle Algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
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

    // Display chapter name
    const chapterNameElement = document.createElement('h4');
    chapterNameElement.className = 'text-center mb-3';
    chapterNameElement.textContent = selectedChapterName;  // Use textContent to handle special characters
    container.appendChild(chapterNameElement);

    // Create the question card
    const questionElement = document.createElement('div');
    questionElement.className = 'card mb-4 shadow-sm w-100';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    cardBody.style.padding = '0';

    if(question.importance == 3) {
        const importanceText = document.createElement('h5');
        importanceText.className = 'card-header';
        importanceText.style.backgroundColor = '#f8d7da'
        importanceText.textContent = "IMPORTANT - This is a question taken from a class assignment or quiz";
        cardBody.appendChild(importanceText);    
    }
    
    const questionText = document.createElement('h5');
    questionText.className = 'card-title';
    questionText.style.marginTop = '1.5em';

    try {
        // Step 1: Parse Markdown to HTML
        const parsedMarkdown = marked.parse(question.question);
    
        // Step 2: Insert parsed Markdown into the DOM
        if (typeof parsedMarkdown === "string" && parsedMarkdown.trim() !== "") {
            questionText.innerHTML = parsedMarkdown;
    
            // Step 3: Process LaTeX with MathJax *after* inserting the content
            // MathJax.typesetPromise([questionText]).catch(err => {
            //     console.error("MathJax rendering failed:", err);
            // });
        } else {
            throw new Error("Parsed Markdown is empty or invalid.");
        }
    } catch (error) {
        console.warn("Markdown parsing failed, falling back to textContent:", error);
        questionText.textContent = question.question; // Fallback to raw text
    }
    
    cardBody.appendChild(questionText);

    // Determine if multiple correct answers exist
    const multipleCorrectAnswers = question.answers.filter(answer => answer.correct).length > 1;

    // Add instruction text (Select one or Select all that apply)
    const instructionText = document.createElement('p');
    instructionText.className = 'text-muted mb-3';
    instructionText.innerText = multipleCorrectAnswers ? 'Select all that apply:' : 'Select one:';
    cardBody.appendChild(instructionText);

    // Add question image if present
    if (question.image) {
        const questionImage = document.createElement('img');
        questionImage.src = question.image;
        questionImage.alt = "Question Image";
        questionImage.className = 'img-fluid mt-3 mb-3';
        cardBody.appendChild(questionImage);
    }

    // Add answer options
    const answerButtonsElement = document.createElement('div');
    answerButtonsElement.id = 'answer-buttons';
    answerButtonsElement.className = 'd-flex flex-column align-items-start mt-3';

    question.answers.sort(() => Math.random() - 0.5).forEach((answer, index) => {
        const inputLabel = document.createElement('label');
        inputLabel.className = 'btn btn-outline-secondary text-left mb-2 w-100 answer-label';

        // If multiple correct answers, use checkbox; otherwise, use radio button
        const input = document.createElement('input');
        input.type = multipleCorrectAnswers ? 'checkbox' : 'radio';
        input.name = 'answer';
        input.value = index;
        input.className = 'mr-2';

        inputLabel.appendChild(input);

        // Add text node for answer
        const answerText = document.createTextNode(answer.text);
        inputLabel.appendChild(answerText);

        answerButtonsElement.appendChild(inputLabel);
    });

    cardBody.appendChild(answerButtonsElement);

    // Create a flex container for buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'd-flex justify-content-between mt-4';

    // Exit button
    const exitButton = document.createElement('button');
    exitButton.id = 'exit-button';
    exitButton.innerText = 'Exit';
    exitButton.className = 'btn btn-danger';

    // Confirmation for exit button
    exitButton.onclick = () => {
        if (confirm('Are you sure you want to exit the quiz? All progress will be lost.')) {
            window.location.reload();  // Refresh the page
        }
    };
    buttonContainer.appendChild(exitButton);

    // Submit button
    const submitButton = document.createElement('button');
    submitButton.id = 'submit-button';
    submitButton.innerText = 'Submit';
    submitButton.className = 'btn btn-primary';
    submitButton.onclick = submitAnswer;
    buttonContainer.appendChild(submitButton);

    // Append buttons to card body
    cardBody.appendChild(buttonContainer);

    questionElement.appendChild(cardBody);
    container.appendChild(questionElement);

    // Solution area (hidden initially)
    const solutionElement = document.createElement('div');
    solutionElement.id = 'solution';
    solutionElement.style.display = 'none';
    container.appendChild(solutionElement);
    // mathjax typeset
    MathJax.typeset()
}

function submitAnswer() {
    const selectedAnswers = document.querySelectorAll('input[name="answer"]:checked');
    const currentQuestion = filteredQuestions[currentQuestionIndex];

    if (selectedAnswers.length === 0) {
        alert("Please select at least one answer.");
        return;
    }

    const correctIndices = currentQuestion.answers
        .map((answer, index) => answer.correct ? index : null)
        .filter(index => index !== null);  // Get indices of correct answers

    const selectedIndices = Array.from(selectedAnswers).map(answer => parseInt(answer.value));

    let allCorrect = true;
    const answerLabels = document.querySelectorAll('.answer-label');

    // Handle the case where a selected answer is correct or incorrect
    selectedIndices.forEach(index => {
        const isCorrect = correctIndices.includes(index);
        answerLabels[index].classList.add(isCorrect ? 'btn-success-subtle' : 'btn-danger-subtle'); // Use custom class
        if (!isCorrect) {
            allCorrect = false;
        }
    });

    // Handle the case where a correct answer was not selected (show in orange)
    correctIndices.forEach(index => {
        if (!selectedIndices.includes(index)) {
            answerLabels[index].classList.add('btn-warning-subtle');  // Highlight missed correct answers
            allCorrect = false;
        }
    });

    // Disable all checkboxes/radio buttons after submission
    const answerInputs = document.querySelectorAll('input[name="answer"]');
    answerInputs.forEach(input => {
        input.disabled = true; // Disable each input after submitting
    });

    if (allCorrect) {
        correctAnswers++;
    }

    const solutionElement = document.getElementById('solution');
    
    if (currentQuestion.solution) {
        const solutionText = currentQuestion.solution || 'No solution provided.';
    
        // Convert the markdown to HTML using marked.js
        const htmlSolution = marked.parse(solutionText);

        solutionElement.style.display = 'block';
        solutionElement.innerHTML = `<h5>Solution:</h5><div>${htmlSolution}</div>`;
    }

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
