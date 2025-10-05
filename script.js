document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GLOBAL VARIABLES & DOM REFERENCES ---

    let allMorphemes = null; // Will hold all data from morphemes.json
    let currentQuestion = null; // Will hold the current question object
    let droppedParts = [];

    const definitionEl = document.getElementById('definition');
    const morphemeBankEl = document.getElementById('morpheme-bank');
    const constructionZoneEl = document.getElementById('construction-zone');
    const spellingZoneEl = document.getElementById('spelling-zone');
    const spellingInputEl = document.getElementById('spelling-input');
    const checkSpellBtn = document.getElementById('check-spell-btn');
    const feedbackEl = document.getElementById('feedback-container');
    const resetBtn = document.getElementById('reset-btn');

    // --- 2. DATA LOADING & INITIALIZATION ---

    // Fetches the local JSON database
    async function loadMorphemeData() {
        try {
            const response = await fetch('morphemes.json');
            if (!response.ok) throw new Error('Network response was not ok');
            allMorphemes = await response.json();
            console.log("Morpheme data loaded successfully!", allMorphemes);
        } catch (error) {
            console.error('Failed to load morpheme data:', error);
            definitionEl.textContent = "Error: Could not load the morpheme database. Please check the file 'morphemes.json' is in the correct folder.";
        }
    }

    // Main function to start the game
    async function initializeGame() {
        await loadMorphemeData();
        if (allMorphemes) {
            setupEventListeners();
            loadNewQuestion();
        }
    }
    
    // --- 3. QUESTION GENERATION & LOADING ---

    // Dynamically creates a new question from the loaded data
    function generateQuestion() {
        // Find a random root word that has at least one example
        let root;
        do {
            root = allMorphemes.roots[Math.floor(Math.random() * allMorphemes.roots.length)];
        } while (!root.examples || root.examples.length === 0);

        const answer = root.examples[Math.floor(Math.random() * root.examples.length)];
        
        // Deconstruct the answer to find its parts
        let tempAnswer = answer;
        const parts = [];
        let definition = `(Meaning: ${root.meaning})`; // Start definition with root meaning

        // Find prefix
        const prefix = allMorphemes.prefixes.find(p => tempAnswer.startsWith(p.morpheme));
        if (prefix) {
            parts.push(prefix.morpheme);
            tempAnswer = tempAnswer.substring(prefix.morpheme.length);
            definition = `${prefix.meaning}, ${definition}`;
        }
        
        // Find suffix
        const suffix = allMorphemes.suffixes.find(s => tempAnswer.endsWith(s.morpheme));
        if (suffix) {
            // Find where the root part ends
            const rootPart = tempAnswer.substring(0, tempAnswer.length - suffix.morpheme.length);
            parts.push(rootPart); // Assume the middle part is the root variation
            parts.push(suffix.morpheme);
            definition = `${definition}, ${suffix.meaning}`;
        } else {
            parts.push(tempAnswer); // No suffix found, the rest is the root
        }
        
        // Generate morpheme bank options (correct parts + random distractors)
        const morphemes = [...new Set(parts)]; // Use Set to avoid duplicates
        while(morphemes.length < 8) {
            const randomType = ['prefixes', 'suffixes', 'roots'][Math.floor(Math.random() * 3)];
            const randomMorpheme = allMorphemes[randomType][Math.floor(Math.random() * allMorphemes[randomType].length)];
            if (!morphemes.includes(randomMorpheme.morpheme)) {
                morphemes.push(randomMorpheme.morpheme);
            }
        }
        
        return { definition, parts, morphemes: morphemes.sort(() => Math.random() - 0.5), answer };
    }

    function loadNewQuestion() {
        resetState();
        currentQuestion = generateQuestion();
        
        definitionEl.textContent = currentQuestion.definition;
        
        currentQuestion.morphemes.forEach(part => {
            const morphemeDiv = document.createElement('div');
            morphemeDiv.textContent = part;
            morphemeDiv.className = 'morpheme';
            morphemeDiv.draggable = true;
            morphemeDiv.dataset.value = part;
            morphemeBankEl.appendChild(morphemeDiv);
        });
        
        addDragListenersToMorphemes();
    }

    // --- 4. GAME LOGIC & STATE MANAGEMENT ---

    function checkAnswer() {
        const userAnswer = spellingInputEl.value.trim().toLowerCase();
        
        if (userAnswer === currentQuestion.answer) {
            feedbackEl.textContent = "Correct! Well done! ✅";
            feedbackEl.className = 'feedback-correct';
            setTimeout(loadNewQuestion, 2000); // Load next question after 2 seconds
        } else {
            feedbackEl.textContent = `Not quite. Remember the definition and check your spelling. Try again!`;
            feedbackEl.className = 'feedback-incorrect';
        }
    }
    
    function resetState() {
        droppedParts = [];
        morphemeBankEl.innerHTML = '';
        constructionZoneEl.innerHTML = '';
        spellingInputEl.value = '';
        feedbackEl.textContent = '';
        spellingZoneEl.classList.add('hidden');
    }

    // --- 5. DRAG AND DROP FUNCTIONALITY ---

    function addDragListenersToMorphemes() {
        const morphemes = document.querySelectorAll('.morpheme');
        morphemes.forEach(morpheme => {
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
        
        const droppedEl = document.createElement('div');
        droppedEl.className = 'morpheme';
        droppedEl.textContent = droppedValue;
        constructionZoneEl.appendChild(droppedEl);
        
        droppedParts.push(droppedValue);

        if (droppedParts.length === currentQuestion.parts.length) {
            spellingZoneEl.classList.remove('hidden');
            spellingInputEl.focus();
        }
    }

    // --- 6. EVENT LISTENERS ---

    function setupEventListeners() {
        checkSpellBtn.addEventListener('click', checkAnswer);
        resetBtn.addEventListener('click', loadNewQuestion);

        spellingInputEl.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') checkAnswer();
        });

        constructionZoneEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            constructionZoneEl.classList.add('drag-over');
        });

        constructionZoneEl.addEventListener('dragleave', () => {
            constructionZoneEl.classList.remove('drag-over');
        });

        constructionZoneEl.addEventListener('drop', handleDrop);
    }

    // --- 7. START THE GAME ---
    initializeGame();
});
