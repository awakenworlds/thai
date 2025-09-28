const questionEl = document.getElementById('question');
const answerEl = document.getElementById('answer');
const feedbackEl = document.getElementById('feedback');
const romanizedInput = document.getElementById('romanized-answer-input');
const englishInput = document.getElementById('english-answer-input');
const submitRomanizedBtn = document.getElementById('submit-romanized-btn');
const submitEnglishBtn = document.getElementById('submit-english-btn');
const prevBtn = document.getElementById('prev-card-btn');
const nextBtn = document.getElementById('next-card-btn');
const englishModeBtn = document.getElementById('english-mode-btn');
const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
const englishFieldGroup = document.getElementById('english-field-group');
const showRomanBtn = document.getElementById('show-roman-answer-btn');
const showEnglishBtn = document.getElementById('show-english-answer-btn');

let quizData = [];
let filteredQuizData = [];
let currentCardIndex = 0;
let isEnglishMode = false;
let isRomanCorrect = false;
let isEnglishCorrect = false;
let readyForNext = false;

const letterCheckbox = document.querySelector('.filter-checkbox[value="letter"]');
const popularCheckbox = document.querySelector('.filter-checkbox[value="popular"]');

// Utility: shuffle array
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Normalize answers for comparison — remove accents, replace dashes with spaces
function normalizeAnswer(ans) {
  return ans
    .toLowerCase()
    .trim()
    .replace(/-/g, " ") // Replace dash with space
    .normalize("NFD") // Unicode normalize accents
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z ]/g, ""); // Remove anything except letters and spaces
}

// Check if the answer is correct
function isAnswerCorrect(userAnswer, cardAnswer) {
  userAnswer = normalizeAnswer(userAnswer);

  const possibleAnswers = cardAnswer.split('/').map(part => normalizeAnswer(part.trim()));

  return possibleAnswers.includes(userAnswer);
}

// Display the current card
function displayCard() {
  if (filteredQuizData.length === 0) {
    questionEl.textContent = 'No cards match the current filter';
    answerEl.classList.add('hidden');
    feedbackEl.classList.add('hidden');
    return;
  }

  const card = filteredQuizData[currentCardIndex];
  questionEl.textContent = isEnglishMode ? card.english : card.thai;

  answerEl.classList.add('hidden');
  answerEl.textContent = '';
  feedbackEl.classList.add('hidden');

  romanizedInput.value = '';
  englishInput.value = '';
  isRomanCorrect = false;
  isEnglishCorrect = false;
  readyForNext = false;

  englishFieldGroup.style.display =
    !isEnglishMode && card.roman.toLowerCase().trim() !== card.english.toLowerCase().trim()
      ? 'flex'
      : 'none';

  romanizedInput.focus();
  updateAnswerDisplay();
}

function updateAnswerDisplay() {
  const card = filteredQuizData[currentCardIndex];
  if (!card) return;
  let parts = [];
  if (isRomanCorrect) parts.push(card.roman);
  if (!isEnglishMode && isEnglishCorrect) parts.push(card.english);
  if (parts.length > 0) {
    answerEl.textContent = parts.join(' | ');
    answerEl.classList.remove('hidden');
  } else {
    answerEl.classList.add('hidden');
  }
}

function updateFeedback(force = false) {
  const cardHasEnglishInput = englishFieldGroup.style.display !== 'none';
  const romanFilled = romanizedInput.value.trim() !== '';
  const englishFilled = englishInput.value.trim() !== '';

  if (!cardHasEnglishInput) {
    if (isRomanCorrect) {
      showFeedback("Correct! Press Enter to continue");
      readyForNext = true;
    } else if (romanFilled) {
      showFeedback("Incorrect answer — please try again", false);
      readyForNext = false;
    } else {
      feedbackEl.classList.add('hidden');
      readyForNext = false;
    }
    return;
  }

  if (isRomanCorrect && isEnglishCorrect) {
    showFeedback("Both answers correct! Press Enter to continue");
    readyForNext = true;
  } else if (isRomanCorrect && (!isEnglishCorrect && englishFilled)) {
    updateAnswerDisplay();
    showFeedback("Romanized answer correct! English answer incorrect — try again", false);
    englishInput.focus();
    readyForNext = false;
  } else if (isRomanCorrect && !isEnglishCorrect) {
    updateAnswerDisplay();
    showFeedback("Romanized answer correct! Please enter English answer", true);
    englishInput.focus();
    readyForNext = false;
  } else if ((!isRomanCorrect && romanFilled) && isEnglishCorrect) {
    updateAnswerDisplay();
    showFeedback("English answer correct! Romanized answer incorrect — try again", false);
    romanizedInput.focus();
    readyForNext = false;
  } else if ((!isRomanCorrect && romanFilled) && (!isEnglishCorrect && englishFilled)) {
    updateAnswerDisplay();
    showFeedback("Both answers incorrect — try again", false);
    romanizedInput.focus();
    readyForNext = false;
  } else if (englishFilled && force) {
    showFeedback("English answer entered — please continue", false);
  } else {
    feedbackEl.classList.add('hidden');
    readyForNext = false;
  }
}

// Check answers
function checkRomanizedAnswer() {
  const card = filteredQuizData[currentCardIndex];
  if (!card) return;

  if (romanizedInput.value.trim() !== '' && isAnswerCorrect(romanizedInput.value, card.roman)) {
    isRomanCorrect = true;
    updateAnswerDisplay();

    if (englishFieldGroup.style.display !== 'none') {
      showFeedback("Romanized answer correct! Please enter English answer", true);
      englishInput.focus();
    }
  } else if (romanizedInput.value.trim() !== '') {
    showFeedback("Incorrect answer — please try again", false);
  }

  updateFeedback();
}

function checkEnglishAnswer(forceFeedback = true) {
  const card = filteredQuizData[currentCardIndex];
  if (!card) return;

  if (englishInput.value.trim() !== '' && isAnswerCorrect(englishInput.value, card.english)) {
    isEnglishCorrect = true;
  } else if (englishInput.value.trim() !== '') {
    isEnglishCorrect = false;
  }

  updateAnswerDisplay();
  updateFeedback(forceFeedback);
}

// Enter key handling
function handleEnterKey(e) {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const active = document.activeElement;
  if (readyForNext) {
    currentCardIndex = (currentCardIndex + 1) % filteredQuizData.length;
    displayCard();
  } else {
    if (active === romanizedInput) checkRomanizedAnswer();
    else if (active === englishInput) checkEnglishAnswer(true);
  }
}

// Up arrow reveals answer
function handleUpArrowKey(e) {
  if (e.key !== 'ArrowUp') return;
  e.preventDefault();
  const card = filteredQuizData[currentCardIndex];
  if (!card) return;

  if (document.activeElement === romanizedInput) {
    answerEl.textContent = card.roman;
    answerEl.classList.remove('hidden');
    feedbackEl.classList.add('hidden');
  } else if (document.activeElement === englishInput) {
    answerEl.textContent = card.english;
    answerEl.classList.remove('hidden');
    feedbackEl.classList.add('hidden');
  }
}

// Submit buttons
submitRomanizedBtn.addEventListener('click', checkRomanizedAnswer);
submitEnglishBtn.addEventListener('click', () => checkEnglishAnswer(true));

romanizedInput.addEventListener('keypress', handleEnterKey);
englishInput.addEventListener('keypress', handleEnterKey);
romanizedInput.addEventListener('keydown', handleUpArrowKey);
englishInput.addEventListener('keydown', handleUpArrowKey);

// Reveal buttons
showRomanBtn.addEventListener('click', () => {
  const card = filteredQuizData[currentCardIndex];
  if (card) { answerEl.textContent = card.roman; answerEl.classList.remove('hidden'); feedbackEl.classList.add('hidden'); }
});
showEnglishBtn.addEventListener('click', () => {
  const card = filteredQuizData[currentCardIndex];
  if (card) { answerEl.textContent = card.english; answerEl.classList.remove('hidden'); feedbackEl.classList.add('hidden'); }
});

// Navigation
prevBtn.addEventListener('click', () => { currentCardIndex = (currentCardIndex - 1 + filteredQuizData.length) % filteredQuizData.length; displayCard(); });
nextBtn.addEventListener('click', () => { currentCardIndex = (currentCardIndex + 1) % filteredQuizData.length; displayCard(); });

// Filters
function applyFilters() {
  const activeFilters = Array.from(filterCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
  filteredQuizData = quizData.filter(card => {
    if (activeFilters.includes('popular') && card.popular) return true;
    return activeFilters.includes(card.sort);
  });
  shuffle(filteredQuizData);
  currentCardIndex = 0;
  displayCard();
}

function setDefaultFilters() {
  if (isEnglishMode) { filterCheckboxes.forEach(cb => cb.checked = (cb.value === 'popular')); }
  else { filterCheckboxes.forEach(cb => cb.checked = (cb.value === 'letter')); }
}

function updateLetterCheckboxVisibility() {
  if (isEnglishMode) { letterCheckbox.parentElement.style.display = 'none'; letterCheckbox.checked = false; }
  else { letterCheckbox.parentElement.style.display = 'flex'; }
}

// Toggle language
englishModeBtn.addEventListener('click', () => {
  isEnglishMode = !isEnglishMode;
  englishModeBtn.textContent = isEnglishMode ? "Thai Mode" : "English Mode";
  updateLetterCheckboxVisibility();
  setDefaultFilters();
  applyFilters();
});

updateLetterCheckboxVisibility();
setDefaultFilters();
filterCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));

// Load quiz data
async function initializeQuiz() {
  try {
    const response = await fetch('data.json');
    quizData = await response.json();
    applyFilters();
  } catch (err) {
    questionEl.textContent = 'Error loading data.json';
    console.error(err);
  }
}

initializeQuiz();

function showFeedback(message, correct = true) {
  feedbackEl.textContent = message;
  feedbackEl.classList.remove('hidden');
  feedbackEl.classList.toggle('incorrect', !correct);
}

// Enforce English-only typing
function enforceEnglishInput(inputElement) {
  inputElement.addEventListener("input", () => {
    inputElement.value = inputElement.value.replace(/[^a-zA-Z -]/g, "");
  });
}

enforceEnglishInput(romanizedInput);
enforceEnglishInput(englishInput);
