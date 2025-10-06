document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GLOBAL VARIABLES & STATE ---
    let allMorphemes = null;
    let currentQuestion = null;
    let droppedParts = [];
    let showMeanings = false; // NEW: State for toggling meanings

    // --- 2. DOM REFERENCES ---
    const modeSelectionEl = document.getElementById('mode-selection');
    const gameContainerEl = document.getElementById('game-container');
    const practiceModeBtn = document.getElementById('practice-mode-btn');
    const definitionEl = document.getElementById('definition');
    const morphemeBankEl = document.getElementById('morpheme-bank');
    const constructionZoneEl = document.getElementById('construction-zone');
    const spellingZoneEl = document.getElementById('spelling-zone');
    const spellingInputEl = document.getElementById('spelling-input');
    const checkSpellBtn = document.getElementById('check-spell-btn');
    const feedbackEl = document.getElementById('feedback-container');
    const resetBtn = document.getElementById('reset-btn');
    const toggleMeaningsBtn = document.getElementById('toggle-meanings-btn');

    // --- 3. DATA LOADING ---
    async function loadMorphemeData() {
        try {
            // UPDATED: The path now points to the 'json' folder.
            // If your folder has a different name, change it here.
            const response = await fetch('game-data.json'); 
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            allMorphemes = await response.json();
        } catch (error) {
            console.error('Failed to load morpheme data:', error);
            // UPDATED: More helpful error message for the user.
            modeSelectionEl.innerHTML = `<h1>Error 😢</h1><p>Could not load the morpheme database. Please ensure the file is located at <strong>/json/morphemes.json</strong> and that your folder is named 'json'.</p>`;
        }
    }

    // --- 4. GAME INITIALIZATION ---
    async function initializeGame() {
        await loadMorphemeData();
        if (allMorphemes) {
            // Show mode selection screen only after data is loaded
            modeSelectionEl.classList.remove('hidden'); // This might already be visible, but good practice
            practiceModeBtn.addEventListener('click', startPracticeMode);
        }
    }

    function startPracticeMode() {
        modeSelectionEl.classList.add('hidden');
        gameContainerEl.classList.remove('hidden');
        setupEventListeners();
        loadNewQuestion();
    }

    // --- 5. QUESTION & MORPHEME BANK LOGIC ---
    function generateQuestion() {
    // UPDATED: Now correctly picks a random question from your curated list
    const questionData = allMorphemes.questions[Math.floor(Math.random() * allMorphemes.questions.length)];
    
    // Generate morpheme bank options (correct parts + random distractors)
    const morphemesForBank = [...new Set(questionData.parts)]; // Use Set to avoid duplicates
    while (morphemesForBank.length < 8) {
        // UPDATED: Now pulls random distractors from the correct location
        const randomType = ['prefixes', 'suffixes', 'roots'][Math.floor(Math.random() * 3)];
        const randomMorpheme = allMorphemes.morphemes[randomType][Math.floor(Math.random() * allMorphemes.morphemes[randomType].length)];
        
        if (!morphemesForBank.includes(randomMorpheme.morpheme)) {
            morphemesForBank.push(randomMorpheme.morpheme);
        }
    }
    
    // Return a final, well-formed question object
    return {
        definition: questionData.definition,
        parts: questionData.parts,
        morphemes: morphemesForBank.sort(() => Math.random() - 0.5),
        answer: questionData.answer
    };
}
    
    // NEW: Helper function to find morpheme data
    function findMorphemeData(morphemeString) {
    // UPDATED: Now looks inside the 'morphemes' object for the definitions
    for (const type of ['prefixes', 'roots', 'suffixes']) {
        const found = allMorphemes.morphemes[type].find(m => m.morpheme === morphemeString);
        if (found) return found;
    }
    return null; // Return null for parts that aren't base morphemes
}
    
    // UPDATED: Now populates the bank based on the showMeanings state
    function populateMorphemeBank() {
        morphemeBankEl.innerHTML = '';
        currentQuestion.morphemes.forEach(part => {
            const morphemeDiv = document.createElement('div');
            morphemeDiv.className = 'morpheme';
            morphemeDiv.draggable = true;
            morphemeDiv.dataset.value = part;
            
            let morphemeHTML = `<strong>${part}</strong>`;
            if (showMeanings) {
                const data = findMorphemeData(part);
                if (data && data.meaning) {
                    morphemeHTML += `<span class="meaning">(${data.meaning})</span>`;
                }
            }
            morphemeDiv.innerHTML = morphemeHTML;
            morphemeBankEl.appendChild(morphemeDiv);
        });
        addDragListenersToMorphemes();
    }

    function loadNewQuestion() {
        resetState();
        currentQuestion = generateQuestion();
        definitionEl.textContent = currentQuestion.definition;
        populateMorphemeBank();
    }

    // --- 6. GAMEPLAY & STATE MANAGEMENT ---
    function checkAnswer() { /* ... same as before ... */ }
    function resetState() { /* ... same as before ... */ }
    
    // NEW: Logic for the toggle button
    function handleToggleMeanings() {
        showMeanings = !showMeanings; // Flip the state
        toggleMeaningsBtn.textContent = showMeanings ? "Hide Meanings" : "Show Meanings";
        populateMorphemeBank(); // Re-render the bank with the new state
    }

    // --- 7. EVENT LISTENERS & HANDLERS ---
    function setupEventListeners() {
        checkSpellBtn.addEventListener('click', checkAnswer);
        resetBtn.addEventListener('click', loadNewQuestion);
        toggleMeaningsBtn.addEventListener('click', handleToggleMeanings);
        spellingInputEl.addEventListener('keyup', (e) => { if (e.key === 'Enter') checkAnswer(); });
        constructionZoneEl.addEventListener('dragover', (e) => { e.preventDefault(); constructionZoneEl.classList.add('drag-over'); });
        constructionZoneEl.addEventListener('dragleave', () => { constructionZoneEl.classList.remove('drag-over'); });
        constructionZoneEl.addEventListener('drop', handleDrop);
    }
    
    // All other functions (checkAnswer, resetState, drag/drop handlers) remain the same.
    // I've included them here for a complete, copy-paste ready file.
    
    function checkAnswer() {
        const userAnswer = spellingInputEl.value.trim().toLowerCase();
        if (userAnswer === currentQuestion.answer) {
            feedbackEl.textContent = "Correct! Well done! ✅";
            feedbackEl.className = 'feedback-correct';
            setTimeout(loadNewQuestion, 2000);
        } else {
            feedbackEl.textContent = `Not quite. Remember the definition and check your spelling. Try again!`;
            feedbackEl.className = 'feedback-incorrect';
        }
    }
    
    function resetState() {
        droppedParts = [];
        constructionZoneEl.innerHTML = '';
        spellingInputEl.value = '';
        feedbackEl.textContent = '';
        spellingZoneEl.classList.add('hidden');
    }

    function addDragListenersToMorphemes() {
        document.querySelectorAll('.morpheme').forEach(morpheme => {
            morpheme.addEventListener('dragstart', handleDragStart);
            morpheme.addEventListener('dragend', handleDragEnd);
        });
    }

    function handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.value);
        setTimeout(() => e.target.classList.add('dragging'), 0);
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    function handleDrop(e) {
        e.preventDefault();
        constructionZoneEl.classList.remove('drag-over');
        const droppedValue = e.dataTransfer.getData('text/plain');
        
        const originalDraggable = morphemeBankEl.querySelector(`[data-value="${droppedValue}"]`);
        constructionZoneEl.appendChild(originalDraggable.cloneNode(true));
        
        droppedParts.push(droppedValue);
        if (droppedParts.length === currentQuestion.parts.length) {
            spellingZoneEl.classList.remove('hidden');
            spellingInputEl.focus();
        }
    }

    // --- 8. START THE APPLICATION ---
    initializeGame();
});
