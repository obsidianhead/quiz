// QuizApp state and configuration
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
