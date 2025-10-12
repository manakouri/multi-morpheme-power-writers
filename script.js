document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GLOBAL VARIABLES & STATE ---
    let allGameData = null;
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
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            allGameData = await response.json();
        } catch (error) {
            console.error('Failed to load morpheme data:', error);
            modeSelectionEl.innerHTML = `<h1>Error 😢</h1><p>Could not load the morpheme database. Please ensure the file is named <strong>game-data.json</strong> and is in the correct folder.</p>`;
        }
    }

    // --- 4. GAME INITIALIZATION ---
    async function initializeGame() {
        await loadMorphemeData();
        if (allGameData) {
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
        const questionData = allGameData.questions[Math.floor(Math.random() * allGameData.questions.length)];
        const morphemesForBank = [...new Set(questionData.parts)];
        while (morphemesForBank.length < 8) {
            const randomType = ['prefixes', 'suffixes', 'roots'][Math.floor(Math.random() * 3)];
            const randomMorpheme = allGameData.morphemes[randomType][Math.floor(Math.random() * allGameData.morphemes[randomType].length)];
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
            const found = allGameData.morphemes[type].find(m => m.morpheme === morphemeString);
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
        // This simple check is less prone to errors with complex words.
        const spelledWord = spellingInputEl.value.trim().toLowerCase();

        if (spelledWord === currentQuestion.answer.toLowerCase()) {
            feedbackEl.textContent = "Correct! Well done! ✅";
            feedbackEl.className = 'feedback-correct';
            setTimeout(loadNewQuestion, 2000);
        } else {
            feedbackEl.textContent = `Not quite right. Check your parts or your spelling. Click a tile in the box to remove it.`;
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
    function setupEventListeners() {
        checkSpellBtn.addEventListener('click', checkAnswer);
        resetBtn.addEventListener('click', loadNewQuestion);
        toggleMeaningsBtn.addEventListener('click', handleToggleMeanings);
        spellingInputEl.addEventListener('keyup', (e) => { if (e.key === 'Enter') checkAnswer(); });

        constructionZoneEl.addEventListener('dragover', (e) => { e.preventDefault(); constructionZoneEl.classList.add('drag-over'); });
        constructionZoneEl.addEventListener('dragleave', () => { constructionZoneEl.classList.remove('drag-over'); });
        constructionZoneEl.addEventListener('drop', handleDrop);
        
        // Delegated event listener for removing morphemes
        constructionZoneEl.addEventListener('click', handleRemoveMorpheme);
    }

    // --- 8. DRAG, DROP, and REMOVE LOGIC ---
    function addDragListenersToMorphemes() {
        const morphemes = document.querySelectorAll('#morpheme-bank .morpheme');
        
        morphemes.forEach(morpheme => {
            morpheme.addEventListener('dragstart', handleDragStart);
            morpheme.addEventListener('dragend', handleDragEnd);
            // Touch event listeners for mobile drag simulation
            morpheme.addEventListener('touchstart', handleTouchStart, { passive: false });
            morpheme.addEventListener('touchmove', handleTouchMove, { passive: false });
            morpheme.addEventListener('touchend', handleTouchEnd);
        });
    }

    let draggedItem = null; // Variable to keep track of the dragged item

    function handleDragStart(e) {
        draggedItem = e.target;
        e.dataTransfer.setData('text/plain', draggedItem.dataset.value);
        setTimeout(() => draggedItem.classList.add('dragging'), 0);
    }

    function handleDragEnd(e) {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
        }
        draggedItem = null;
    }

    function handleDrop(e) {
        e.preventDefault();
        constructionZoneEl.classList.remove('drag-over');
        const droppedValue = e.dataTransfer.getData('text/plain');

        const morphemeInBank = morphemeBankEl.querySelector(`[data-value="${droppedValue}"]`);
        if (morphemeInBank) {
            const clone = morphemeInBank.cloneNode(true);
            constructionZoneEl.appendChild(clone);
            droppedParts.push(droppedValue);
        }

        if (droppedParts.length >= 1) { // Show spelling box as soon as one part is in
            spellingZoneEl.classList.remove('hidden');
            spellingInputEl.focus();
        }
    }
    
    // Correction mechanic: remove a morpheme by clicking it
    function handleRemoveMorpheme(e) {
        const clickedTile = e.target.closest('.morpheme');
        if (clickedTile && constructionZoneEl.contains(clickedTile)) {
            const valueToRemove = clickedTile.dataset.value;
            const indexToRemove = droppedParts.indexOf(valueToRemove);
            
            if (indexToRemove > -1) {
                droppedParts.splice(indexToRemove, 1);
                clickedTile.remove(); // Simply remove the clicked tile from the DOM
            }

            if (droppedParts.length < 1) {
                 spellingZoneEl.classList.add('hidden');
            }
        }
    }

    // --- 9. MOBILE TOUCH DRAG LOGIC ---
    let clone = null;
    let initialX, initialY;

    function handleTouchStart(e) {
        e.preventDefault();
        draggedItem = e.target.closest('.morpheme');
        if (!draggedItem) return;

        clone = draggedItem.cloneNode(true);
        document.body.appendChild(clone);
        clone.classList.add('dragging');
        
        let touch = e.touches[0];
        initialX = touch.clientX;
        initialY = touch.clientY;
        clone.style.position = 'absolute';
        clone.style.left = `${initialX - clone.offsetWidth / 2}px`;
        clone.style.top = `${initialY - clone.offsetHeight / 2}px`;
    }

    function handleTouchMove(e) {
        e.preventDefault();
        if (!clone || !draggedItem) return;
        
        let touch = e.touches[0];
        clone.style.left = `${touch.pageX - clone.offsetWidth / 2}px`;
        clone.style.top = `${touch.pageY - clone.offsetHeight / 2}px`;

        const dropZoneRect = constructionZoneEl.getBoundingClientRect();
        if (touch.clientX > dropZoneRect.left && touch.clientX < dropZoneRect.right &&
            touch.clientY > dropZoneRect.top && touch.clientY < dropZoneRect.bottom) {
            constructionZoneEl.classList.add('drag-over');
        } else {
            constructionZoneEl.classList.remove('drag-over');
        }
    }

    function handleTouchEnd(e) {
        if (!clone || !draggedItem) return;

        constructionZoneEl.classList.remove('drag-over');
        const dropZoneRect = constructionZoneEl.getBoundingClientRect();
        const touch = e.changedTouches[0];

        if (touch.clientX > dropZoneRect.left && touch.clientX < dropZoneRect.right &&
            touch.clientY > dropZoneRect.top && touch.clientY < dropZoneRect.bottom) {
            
            const droppedValue = draggedItem.dataset.value;
            const newTile = draggedItem.cloneNode(true);
            constructionZoneEl.appendChild(newTile);
            droppedParts.push(droppedValue);

             if (droppedParts.length >= 1) {
                spellingZoneEl.classList.remove('hidden');
                spellingInputEl.focus();
            }
        }
        
        document.body.removeChild(clone);
        clone = null;
        draggedItem = null;
    }


    // --- 10. START THE APPLICATION ---
    initializeGame();
});

