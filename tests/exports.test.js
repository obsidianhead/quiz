describe('quiz-ui.js exports', () => {
  it('should export all main functions', () => {
    expect(typeof window.fetchCourses).toBe('function');
    expect(typeof window.createCourseSelection).toBe('function');
    expect(typeof window.loadCourseConfig).toBe('function');
    expect(typeof window.createChapterAndTestSelection).toBe('function');
    expect(typeof window.startQuiz).toBe('function');
    expect(typeof window.shuffleArray).toBe('function');
    expect(typeof window.startQuizTimer).toBe('function');
    expect(typeof window.showQuizTimer).toBe('function');
    expect(typeof window.setNextQuestion).toBe('function');
    expect(typeof window.resetState).toBe('function');
    expect(typeof window.showQuestion).toBe('function');
    expect(typeof window.submitAnswer).toBe('function');
    expect(typeof window.nextQuestion).toBe('function');
    expect(typeof window.endQuiz).toBe('function');
  });
});

describe('db-load.js exports', () => {
  it('should export all main functions', () => {
    expect(typeof window.loadDatabase).toBe('function');
    expect(typeof window.fetchDatabaseFromServer).toBe('function');
    expect(typeof window.initializeDatabase).toBe('function');
  });
});

describe('quiz-ui.js exports', () => {
  it('should export all main functions', () => {
    expect(typeof window.fetchCourses).toBe('function');
    expect(typeof window.createCourseSelection).toBe('function');
    expect(typeof window.loadCourseConfig).toBe('function');
    expect(typeof window.createChapterAndTestSelection).toBe('function');
    expect(typeof window.startQuiz).toBe('function');
    expect(typeof window.shuffleArray).toBe('function');
    expect(typeof window.startQuizTimer).toBe('function');
    expect(typeof window.showQuizTimer).toBe('function');
    expect(typeof window.setNextQuestion).toBe('function');
    expect(typeof window.resetState).toBe('function');
    expect(typeof window.showQuestion).toBe('function');
    expect(typeof window.submitAnswer).toBe('function');
    expect(typeof window.nextQuestion).toBe('function');
    expect(typeof window.endQuiz).toBe('function');
  });
});

