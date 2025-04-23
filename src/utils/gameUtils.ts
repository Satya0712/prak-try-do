
/**
 * Generates a 6-character alphanumeric room code
 */
export const generateRoomCode = (): string => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omitting confusing characters like I, O, 0, 1
  let result = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  
  return result;
};

/**
 * Checks if a guess partially matches a word
 * Returns a percentage of matching characters
 */
export const calculateWordMatchPercentage = (guess: string, word: string): number => {
  const guessLower = guess.toLowerCase();
  const wordLower = word.toLowerCase();
  
  let matchCount = 0;
  for (let i = 0; i < guessLower.length; i++) {
    if (wordLower.includes(guessLower[i])) {
      matchCount++;
    }
  }
  
  return Math.floor((matchCount / wordLower.length) * 100);
};

/**
 * Returns a hint for the word based on a partial match
 */
export const generateHint = (word: string): string => {
  let hint = '';
  
  for (let i = 0; i < word.length; i++) {
    // Show a random 30% of the characters
    if (word[i] === ' ') {
      hint += ' ';
    } else if (Math.random() < 0.3) {
      hint += word[i];
    } else {
      hint += '_';
    }
  }
  
  return hint;
};

/**
 * Generate word options for the drawing player
 */
export const generateWordOptions = (wordList: string[], count: number = 3): string[] => {
  const shuffled = [...wordList].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

/**
 * Words for the game
 */
export const gameWords = [
  // Animals
  'cat', 'dog', 'elephant', 'giraffe', 'monkey', 'tiger', 'zebra', 'lion', 'penguin', 'kangaroo',
  'koala', 'dolphin', 'shark', 'whale', 'octopus', 'butterfly', 'spider', 'snake', 'turtle',
  
  // Objects
  'chair', 'table', 'lamp', 'computer', 'phone', 'television', 'clock', 'book', 'guitar', 'piano',
  'camera', 'umbrella', 'glasses', 'hat', 'shoe', 'key', 'door', 'window', 'balloon', 'backpack',
  
  // Food
  'pizza', 'hamburger', 'ice cream', 'cake', 'cookie', 'banana', 'apple', 'orange', 'watermelon',
  'popcorn', 'sandwich', 'pasta', 'sushi', 'taco', 'donut', 'coffee', 'tea', 'milk', 'chocolate',
  
  // Places
  'beach', 'mountain', 'park', 'school', 'hospital', 'castle', 'island', 'forest', 'city', 'farm',
  
  // Actions
  'running', 'swimming', 'dancing', 'singing', 'jumping', 'drawing', 'sleeping', 'eating', 'reading',
  
  // Sports
  'football', 'basketball', 'tennis', 'baseball', 'golf', 'hockey', 'volleyball', 'skateboarding'
];
