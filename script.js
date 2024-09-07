let allQuestions, filteredQuestions, currentQuestionIndex, correctAnswers, incorrectAnswers, timer;
let timeLeft; // Dynamically calculated based on the number of questions
let config = { courseName: '', chapters: [] };
let selectedCourse = '';
let selectedChapterName = '';

// Fetch courses dynamically from courses.json and create course selection dropdown
document.addEventListener('DOMContentLoaded', () => {
    fetchCourses();
});

function fetchCourses() {
    fetch('courses.json')
        .then(response => response.json())
        .then(data => {
            createCourseSelection(data.courses);
        })
        .catch(error => {
            console.error('Error loading courses:', error);
            alert('Failed to load courses. Please check courses.json.');
        });
}

function createCourseSelection(courses) {
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
    });

    startButton.onclick = () => {
        if (selectedCourse) {
            loadCourseConfig(selectedCourse);
        }
    };

    container.appendChild(startButton);
}

function loadCourseConfig(courseId) {
    const configPath = `./data/${courseId}/quiz_config.json`;

    fetch(configPath)
        .then(response => response.json())
        .then(data => {
            config = data;
            createChapterSelection();
        })
        .catch(error => {
            console.error('Error loading course config:', error);
            alert('Failed to load course configuration. Please check the file.');
        });
}

function createChapterSelection() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = ''; // Clear previous content

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

    select.innerHTML = '<option value="" disabled selected>Select a chapter</option>';
    config.chapters.forEach(chapter => {
        const option = document.createElement('option');
        option.value = chapter.number;
        option.textContent = chapter.name;
        select.appendChild(option);
    });

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
        selectedChapterName = selectedChapterObject.name;
        startQuiz(selectedChapter);
    };

    container.appendChild(startButton);
}

function startQuiz(chapterNumber) {
    const chapterQuestionsFile = `./data/${selectedCourse}/chapters/${chapterNumber}/questions.json`;

    fetch(chapterQuestionsFile)
        .then(response => response.json())
        .then(data => {
            filteredQuestions = data.sort(() => Math.random() - 0.5);
            currentQuestionIndex = 0;
            correctAnswers = 0;
            incorrectAnswers = [];

            timeLeft = filteredQuestions.length * 60;

            document.getElementById('quiz-container').innerHTML = '';
            showQuizTimer();
            startQuizTimer();
            setNextQuestion();
        })
        .catch(error => {
            console.error('Error loading questions:', error);
            alert(`Failed to load questions for chapter ${chapterNumber}. Please check if the file exists.`);
        });
}

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
    chapterNameElement.innerText = selectedChapterName;
    container.appendChild(chapterNameElement);

    const questionElement = document.createElement('div');
    questionElement.className = 'card mb-4 shadow-sm w-100';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const questionText = document.createElement('h5');
    questionText.className = 'card-title';
    questionText.innerText = question.question;
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
        radioLabel.appendChild(document.createTextNode(answer.text));
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

    // Show the solution
    const solutionElement = document.getElementById('solution');
    if (currentQuestion.solution) {
        const solutionText = currentQuestion.solution || 'No solution provided.';
        solutionElement.style.display = 'block';
        solutionElement.innerHTML = `<h5>Solution:</h5><p>${solutionText}</p>`;

        // Re-render MathJax to process any LaTeX
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
