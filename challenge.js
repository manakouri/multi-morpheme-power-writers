document.addEventListener('DOMContentLoaded', () => {
    // --- 1. STATE AND CONSTANTS ---
    const GAME_DURATION = 180; // 3 minutes in seconds
    let allGameData = null;
    let currentQuestion = null;
    let score = 0;
    let timer = GAME_DURATION;
    let timerInterval = null;
    let hintUsed = false;

    // --- 2. DOM REFERENCES ---
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const highScoreEl = document.getElementById('high-score');
    const timerEl = document.getElementById('timer');
    const scoreEl = document.getElementById('score');
    const definitionEl = document.getElementById('challenge-definition');
    const answerInput = document.getElementById('answer-input');
    const checkAnswerBtn = document.getElementById('check-answer-btn');
    const hintBtn = document.getElementById('hint-btn');
    const nextWordBtn = document.getElementById('next-word-btn');
    const feedbackEl = document.getElementById('challenge-feedback');
    const finalScoreEl = document.getElementById('final-score');
    const newHighScoreMsg = document.getElementById('new-high-score-msg');

    // --- 3. DATA LOADING & INITIALIZATION ---
    async function loadData() {
        try {
            const response = await fetch('game-data.json');
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            allGameData = await response.json();
            initialize();
        } catch (error) {
            document.body.innerHTML = `<div id="challenge-container"><h1>Error</h1><p>Could not load game data. Please ensure <strong>game-data.json</strong> is in the correct folder.</p></div>`;
            console.error("Failed to load game data:", error);
        }
    }

    function initialize() {
        highScoreEl.textContent = localStorage.getItem('wordArchitectHighScore') || 0;
        startBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', startGame);
        checkAnswerBtn.addEventListener('click', checkAnswer);
        answerInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') checkAnswer();
        });
        hintBtn.addEventListener('click', showHint);
        nextWordBtn.addEventListener('click', showAnswerAndMoveNext);
    }

    // --- 4. GAME FLOW ---
    function startGame() {
        score = 0;
        timer = GAME_DURATION;
        scoreEl.textContent = score;
        updateTimerDisplay();

        startScreen.classList.add('hidden');
        endScreen.classList.add('hidden');
        newHighScoreMsg.classList.add('hidden');
        gameScreen.classList.remove('hidden');

        loadNewQuestion();
        timerInterval = setInterval(updateTimer, 1000);
        answerInput.focus();
    }

    function endGame() {
        clearInterval(timerInterval);
        gameScreen.classList.add('hidden');
        endScreen.classList.remove('hidden');
        finalScoreEl.textContent = score;

        const currentHighScore = parseInt(localStorage.getItem('wordArchitectHighScore') || 0);
        if (score > currentHighScore) {
            localStorage.setItem('wordArchitectHighScore', score);
            newHighScoreMsg.classList.remove('hidden');
        }
    }

    // --- 5. TIMER LOGIC ---
    function updateTimer() {
        timer--;
        updateTimerDisplay();
        if (timer <= 0) {
            endGame();
        }
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // --- 6. QUESTION & ANSWER LOGIC ---
    function loadNewQuestion() {
        hintUsed = false;
        feedbackEl.innerHTML = '';
        answerInput.value = '';
        answerInput.disabled = false;
        hintBtn.classList.remove('hidden');
        nextWordBtn.classList.add('hidden');
        checkAnswerBtn.disabled = false;

        currentQuestion = allGameData.questions[Math.floor(Math.random() * allGameData.questions.length)];
        definitionEl.textContent = `"${currentQuestion.definition}"`;
        answerInput.focus();
    }

    function checkAnswer() {
        const userAnswer = answerInput.value.trim().toLowerCase();
        if (!userAnswer) return;

        if (userAnswer === currentQuestion.answer.toLowerCase()) {
            feedbackEl.innerHTML = `<p style="color: green;">Correct! +10 points</p>`;
            score += 10;
            scoreEl.textContent = score;
        } else {
            feedbackEl.innerHTML = `<p style="color: red;">Not quite. Try again or use a hint.</p>`;
        }
        answerInput.value = '';
        // Only move to next question if correct
        if (userAnswer === currentQuestion.answer.toLowerCase()) {
             setTimeout(loadNewQuestion, 800);
        }
    }

    // --- 7. HINT & NEXT WORD LOGIC ---
    function findMorphemeData(morphemeString) {
        for (const type of ['prefixes', 'roots', 'suffixes']) {
            const found = allGameData.morphemes[type].find(m => m.morpheme === morphemeString);
            if (found) return found;
        }
        return { morpheme: morphemeString, meaning: 'base word' }; // Fallback for base words not in lists
    }
    
    function showHint() {
        if (hintUsed) return;
        hintUsed = true;

        const rootParts = currentQuestion.parts.filter(part => {
             return allGameData.morphemes.roots.some(root => root.morpheme === part) || !part.includes('-');
        });

        const hintText = rootParts.map(part => {
            const data = findMorphemeData(part);
            return `<strong>${data.morpheme}</strong> (${data.meaning})`;
        }).join(', ');
        
        feedbackEl.innerHTML = `<p><strong>Hint:</strong> The root word(s) are: ${hintText}</p>`;
        nextWordBtn.classList.remove('hidden');
    }

    function showAnswerAndMoveNext() {
        answerInput.disabled = true;
        checkAnswerBtn.disabled = true;
        hintBtn.classList.add('hidden');

        const breakdown = currentQuestion.parts.map(part => {
            const data = findMorphemeData(part);
            return `<strong>${data.morpheme}</strong> <em>(${data.meaning})</em>`;
        }).join(' + ');

        feedbackEl.innerHTML = `
            <p>The correct answer was: <strong>${currentQuestion.answer}</strong></p>
            <p class="morpheme-breakdown">${breakdown}</p>
        `;
        setTimeout(loadNewQuestion, 3000); // Give user time to see the answer
    }

    // --- 8. START THE APPLICATION ---
    loadData();
});
