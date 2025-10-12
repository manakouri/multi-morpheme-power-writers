document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GLOBAL VARIABLES & STATE ---
    let allMorphemes = null;
    let currentQuestion = null;
    let droppedParts = [];
    let showMeanings = false; 

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
            const response = await fetch('game-data.json'); 
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            allMorphemes = await response.json();
        } catch (error) {
            console.error('Failed to load morpheme data:', error);
            modeSelectionEl.innerHTML = `<h1>Error 😢</h1><p>Could not load game data. Please ensure the file <strong>game-data.json</strong> is in the correct folder.</p>`;
        }
    }

    // --- 4. GAME INITIALIZATION ---
    async function initializeGame() {
        await loadMorphemeData();
        if (allMorphemes) {
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
        const questionData = allMorphemes.questions[Math.floor(Math.random() * allMorphemes.questions.length)];
        const morphemesForBank = [...new Set(questionData.parts)];
        while (morphemesForBank.length < 8) {
            const randomType = ['prefixes', 'suffixes', 'roots'][Math.floor(Math.random() * 3)];
            const randomMorpheme = allMorphemes.morphemes[randomType][Math.floor(Math.random() * allMorphemes.morphemes[randomType].length)];
            
            if (!morphemesForBank.includes(randomMorpheme.morpheme)) {
                morphemesForBank.push(randomMorpheme.morpheme);
            }
        }
        return {
            definition: questionData.definition,
            parts: questionData.parts,
            morphemes: morphemesForBank.sort(() => Math.random() - 0.5),
            answer: questionData.answer
        };
    }
    
    function findMorphemeData(morphemeString) {
        for (const type of ['prefixes', 'roots', 'suffixes']) {
            const found = allMorphemes.morphemes[type].find(m => m.morpheme === morphemeString);
            if (found) return found;
        }
        return null;
    }
    
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
    function checkAnswer() {
        const userAnswer = spellingInputEl.value.trim().toLowerCase();
        if (userAnswer === currentQuestion.answer) {
            feedbackEl.textContent = "Correct! Well done! ✅";
            feedbackEl.className = 'feedback-correct';
            setTimeout(loadNewQuestion, 2000);
        } else {
            feedbackEl.textContent = `Not quite. Check your spelling or click on a part to remove it and try again.`;
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
    
    function handleToggleMeanings() {
        showMeanings = !showMeanings;
        toggleMeaningsBtn.textContent = showMeanings ? "Hide Meanings" : "Show Meanings";
        populateMorphemeBank();
    }

    // --- 7. EVENT LISTENERS & HANDLERS ---
    function handleRemoveMorpheme(e) {
        const clickedEl = e.currentTarget;
        const morphemeValue = clickedEl.dataset.value;

        const indexToRemove = droppedParts.indexOf(morphemeValue);
        if (indexToRemove > -1) {
            droppedParts.splice(indexToRemove, 1);
        }

        clickedEl.remove();

        spellingZoneEl.classList.add('hidden');
        feedbackEl.innerHTML = '';
    }
    
    // Function to prevent default scroll behavior on touch devices
    function preventScroll(e) {
        e.preventDefault();
    }

    function setupEventListeners() {
        checkSpellBtn.addEventListener('click', checkAnswer);
        resetBtn.addEventListener('click', loadNewQuestion);
        toggleMeaningsBtn.addEventListener('click', handleToggleMeanings);
        spellingInputEl.addEventListener('keyup', (e) => { if (e.key === 'Enter') checkAnswer(); });
        constructionZoneEl.addEventListener('dragover', (e) => { e.preventDefault(); constructionZoneEl.classList.add('drag-over'); });
        constructionZoneEl.addEventListener('dragleave', () => { constructionZoneEl.classList.remove('drag-over'); });
        constructionZoneEl.addEventListener('drop', handleDrop);
    }
    
    function addDragListenersToMorphemes() {
        document.querySelectorAll('#morpheme-bank .morpheme').forEach(morpheme => {
            morpheme.addEventListener('dragstart', handleDragStart);
            morpheme.addEventListener('dragend', handleDragEnd);
        });
    }

    function handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.value);
        setTimeout(() => e.target.classList.add('dragging'), 0);
        // Add listener to prevent scrolling during drag
        document.body.addEventListener('touchmove', preventScroll, { passive: false });
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        // Remove listener when drag is over
        document.body.removeEventListener('touchmove', preventScroll);
    }

    function handleDrop(e) {
        e.preventDefault();
        constructionZoneEl.classList.remove('drag-over');
        const droppedValue = e.dataTransfer.getData('text/plain');
        
        const originalDraggable = morphemeBankEl.querySelector(`[data-value="${droppedValue}"]`);
        const clone = originalDraggable.cloneNode(true);
        clone.addEventListener('click', handleRemoveMorpheme);
        constructionZoneEl.appendChild(clone);
        
        droppedParts.push(droppedValue);
        if (droppedParts.length === currentQuestion.parts.length) {
            spellingZoneEl.classList.remove('hidden');
            spellingInputEl.focus();
        }
    }

    // --- 8. START THE APPLICATION ---
    initializeGame();
});

