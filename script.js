let allQuestions, filteredQuestions, currentQuestionIndex, correctAnswers, incorrectAnswers, timer;
let timeLeft; // This will now be dynamically calculated based on the number of questions
let config = { courseName: '', chapters: [] }; // To store course name and chapters
let selectedCourse = ''; // To store selected course
let selectedChapterName = ''; // To store the selected chapter name

document.addEventListener('DOMContentLoaded', () => {
    // Create course selection dropdown
    createCourseSelection();
});

// Create Course Selection Dropdown
function createCourseSelection() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = ''; // Clear previous content

    const courseSelectLabel = document.createElement('label');
    courseSelectLabel.innerText = "Select a Course:";
    courseSelectLabel.className = 'mb-2';

    const courseSelect = document.createElement('select');
    courseSelect.id = 'course-select';
    courseSelect.className = 'custom-select';
    courseSelect.style.maxWidth = '300px';
    courseSelect.style.margin = '0 auto';

    // Populate courses (you can fetch these dynamically if needed)
    const courses = [
        { id: 'CET127', name: 'CET127: Construction Engineering' },
        { id: 'CET128', name: 'CET128: Advanced Engineering' }
    ];

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

    // Enable start button once course is selected
    courseSelect.addEventListener('change', () => {
        startButton.disabled = !courseSelect.value;
        selectedCourse = courseSelect.value;
    });

    startButton.onclick = () => {
        if (selectedCourse) {
            loadCourseConfig(selectedCourse);
        }
    };

    container.appendChild(startButton);
}

// Load course config and create chapter selection
function loadCourseConfig(courseId) {
    const configPath = `./data/${courseId}/quiz_config.json`;

    fetch(configPath)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load course config.');
            }
            return response.json();
        })
        .then(data => {
            config = data;
            createChapterSelection(); // Move to chapter selection after course config is loaded
        })
        .catch(error => {
            console.error('Error loading course config:', error);
            alert('Failed to load course configuration. Please check the file.');
        });
}

function createChapterSelection() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = ''; // Clear previous content

    // Display course name at the top
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

    // Populate chapter selection using the new object structure (number and name)
    if (Array.isArray(config.chapters) && config.chapters.length > 0) {
        select.innerHTML = '<option value="" disabled selected>Select a chapter</option>';
        config.chapters.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter.number;  // Store the chapter number
            option.textContent = chapter.name;  // Display the chapter name
            select.appendChild(option);
        });
    } else {
        console.error('Chapters are not defined correctly in the config JSON.');
        alert('No chapters found in quiz_config.json. Please check the file.');
        return; // Stop further execution if no chapters are found
    }

    selectGroup.appendChild(select);
    container.appendChild(selectGroup);

    const startButton = document.createElement('button');
    startButton.innerText = 'Start Quiz';
    startButton.className = 'btn btn-primary mt-3';
    startButton.disabled = true;

    select.addEventListener('change', () => {
        startButton.disabled = !select.value;
    });

    startButton.onclick = () => {
        const selectedChapter = select.value;
        const selectedChapterObject = config.chapters.find(chapter => chapter.number == selectedChapter);
        selectedChapterName = selectedChapterObject.name; // Store the chapter name
        startQuiz(selectedChapter);
    };

    container.appendChild(startButton);
}

function startQuiz(chapterNumber) {
    // Construct the path to the specific chapter's questions file based on the chapter number
    const chapterQuestionsFile = `./data/${selectedCourse}/chapters/${chapterNumber}/questions.json`;

    // Fetch the questions for the selected chapter
    fetch(chapterQuestionsFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load questions from ${chapterQuestionsFile}`);
            }
            return response.json();
        })
        .then(data => {
            // Shuffle the questions and store them
            filteredQuestions = data.sort(() => Math.random() - 0.5);
            currentQuestionIndex = 0;
            correctAnswers = 0;
            incorrectAnswers = []; // Initialize the incorrect answers array

            // Calculate the total time based on the number of questions
            timeLeft = filteredQuestions.length * 60; // 1 minute per question (60 seconds)

            document.getElementById('quiz-container').innerHTML = ''; // Clear chapter selection UI
            showQuizTimer();  // Ensure timer is displayed
            startQuizTimer(); // Start the quiz timer
            setNextQuestion(); // Display the first question
        })
        .catch(error => {
            console.error('Error loading questions:', error);
            alert(`Failed to load questions for chapter ${chapterNumber}. Please check if the file exists.`);
        });
}

// The remaining quiz functions (showQuizTimer, setNextQuestion, etc.) stay the same

function startQuizTimer() {
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('quiz-timer').innerText = `Time Left: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')} minutes`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            endQuiz(); // End quiz when time runs out
        }
    }, 1000); // Timer updates every second
}

function showQuizTimer() {
    const container = document.getElementById('quiz-container');

    // Clear existing timer if any
    const existingTimer = document.getElementById('quiz-timer');
    if (existingTimer) existingTimer.remove();

    const timerElement = document.createElement('p');
    timerElement.id = 'quiz-timer';
    timerElement.className = 'lead text-center mb-4'; // Added margin-bottom for spacing
    timerElement.innerText = `Time Left: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')} minutes`;
    container.insertBefore(timerElement, container.firstChild); // Insert timer at the top of the container
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

    // Call showQuizTimer() to display the timer at the top
    showQuizTimer();
}

function showQuestion(question) {
    const container = document.getElementById('quiz-container');

    // Ensure the parent container fills the available space
    container.className = 'w-100 d-flex flex-column justify-content-center'; // Updated to ensure the container takes full width

    // Display the chapter name at the top of the quiz
    const chapterNameElement = document.createElement('h2');
    chapterNameElement.className = 'text-center mb-3';
    chapterNameElement.innerText = selectedChapterName;
    container.appendChild(chapterNameElement);

    // Adjust the card to fill the width of the parent container
    const questionElement = document.createElement('div');
    questionElement.className = 'card mb-4 shadow-sm w-100'; // w-100 ensures it takes the full width

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const questionText = document.createElement('h5');
    questionText.className = 'card-title';
    questionText.innerText = question.question;
    cardBody.appendChild(questionText);

    // Display image if URL is provided
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

    // Shuffle the answers before displaying them
    question.answers.sort(() => Math.random() - 0.5).forEach((answer, index) => {
        const radioLabel = document.createElement('label');
        radioLabel.className = 'btn btn-outline-secondary text-left mb-2 w-100'; // Ensure full width for buttons

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'answer';
        radio.value = index;
        radio.className = 'mr-2';

        radioLabel.appendChild(radio);
        radioLabel.appendChild(document.createTextNode(answer.text));
        answerButtonsElement.appendChild(radioLabel);
    });

    cardBody.appendChild(answerButtonsElement);

    const nextButton = document.createElement('button');
    nextButton.id = 'next-button';
    nextButton.innerText = 'Next';
    nextButton.className = 'btn btn-primary mt-4';
    nextButton.onclick = nextQuestion;
    cardBody.appendChild(nextButton);

    questionElement.appendChild(cardBody);
    container.appendChild(questionElement);
}

function selectAnswer() {
    const selectedAnswer = document.querySelector('input[name="answer"]:checked');
    const currentQuestion = filteredQuestions[currentQuestionIndex];

    if (selectedAnswer) {
        const selectedIndex = parseInt(selectedAnswer.value);
        const correctIndex = currentQuestion.answers.findIndex(answer => answer.correct);

        if (selectedIndex === correctIndex) {
            correctAnswers++;
        } else {
            incorrectAnswers.push({
                question: currentQuestion.question,
                selectedAnswer: currentQuestion.answers[selectedIndex].text,
                correctAnswer: currentQuestion.answers[correctIndex].text
            });
        }
    } else {
        incorrectAnswers.push({
            question: currentQuestion.question,
            selectedAnswer: "No answer selected",
            correctAnswer: currentQuestion.answers.find(answer => answer.correct).text
        });
    }
}

function nextQuestion() {
    selectAnswer(); // Check the selected answer when Next is pressed

    if (filteredQuestions.length > currentQuestionIndex + 1) {
        currentQuestionIndex++;
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

    if (incorrectAnswers.length > 0) {
        const incorrectSummary = document.createElement('div');
        incorrectSummary.className = 'mt-4 text-left';
        incorrectSummary.innerHTML = '<h3>Questions You Got Wrong:</h3>';
        incorrectAnswers.forEach(item => {
            const questionElement = document.createElement('p');
            questionElement.innerHTML = `<strong>Question:</strong> ${item.question}<br><strong>Your Answer:</strong> ${item.selectedAnswer}<br><strong>Correct Answer:</strong> ${item.correctAnswer}`;
            incorrectSummary.appendChild(questionElement);
        });
        document.getElementById('quiz-container').appendChild(incorrectSummary);
    }

    const restartButton = document.createElement('button');
    restartButton.innerText = 'Restart';
    restartButton.className = 'btn btn-secondary mt-4';
    restartButton.onclick = () => location.reload();
    document.getElementById('quiz-container').appendChild(restartButton);
}
