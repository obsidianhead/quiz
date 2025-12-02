// import { shuffleArray } from '../js/quiz-ui.js';

describe('shuffleArray', () => {
	it('should shuffle the array and not lose elements', () => {
		const arr = [1, 2, 3, 4, 5];
		const copy = [...arr];
		window.shuffleArray(arr);
		expect(arr.sort()).toEqual(copy.sort());
		expect(arr.length).toBe(copy.length);
	});
});
