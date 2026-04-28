let crossword = null;
let selectedWord = null;
let maxWords = 15;
let cellInputs = [];

const gridContainer = document.getElementById('crossword-grid');
const activeHintLabel = document.getElementById('active-hint');
const horizontalCluesContainer = document.getElementById('horizontal-clues');
const verticalCluesContainer = document.getElementById('vertical-clues');

const btnSettings = document.getElementById('btn-settings');
const dropdownContent = document.querySelector('.dropdown-content');
const btnRefresh = document.getElementById('btn-refresh');
const btnCheck = document.getElementById('btn-check');
const btnRevealWord = document.getElementById('btn-reveal-word');
const btnRevealAll = document.getElementById('btn-reveal-all');

function init() {
    const pwd = prompt("Sito Protetto. Inserisci la password:");
    if (pwd !== "cruciverba2026") {
        document.body.innerHTML = "<h1 style='color: white; text-align: center; margin-top: 50px; font-family: sans-serif;'>Accesso Negato</h1>";
        return;
    }
    setupEventListeners();
    loadCrossword();
}

function setupEventListeners() {
    btnRefresh.addEventListener('click', loadCrossword);
    
    dropdownContent.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            maxWords = parseInt(e.target.dataset.words);
            loadCrossword();
        }
    });

    btnCheck.addEventListener('click', checkAnswers);
    
    btnRevealWord.addEventListener('click', () => {
        if (!selectedWord) {
            showToast("Seleziona prima una parola da svelare.");
            return;
        }
        revealWord(selectedWord);
    });

    btnRevealAll.addEventListener('click', () => {
        document.getElementById('modal-reveal-all').classList.add('show');
    });

    document.getElementById('confirm-reveal-all').addEventListener('click', () => {
        closeModal('modal-reveal-all');
        revealAll();
    });
}

window.closeModal = function(id) {
    document.getElementById(id).classList.remove('show');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function loadCrossword() {
    gridContainer.innerHTML = '<div style="color:var(--accent); text-align:center; padding: 20px;">Caricamento...</div>';
    selectedWord = null;
    activeHintLabel.textContent = "Seleziona una definizione";
    horizontalCluesContainer.innerHTML = '';
    verticalCluesContainer.innerHTML = '';
    
    // Slight delay to allow UI to update
    setTimeout(() => {
        crossword = generateCrossword(maxWords);
        renderGrid();
        renderClues();
    }, 50);
}

function renderGrid() {
    gridContainer.innerHTML = '';
    cellInputs = Array(crossword.height).fill(null).map(() => Array(crossword.width).fill(null));

    for (let y = 0; y < crossword.height; y++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'grid-row';
        for (let x = 0; x < crossword.width; x++) {
            const letter = crossword.grid[y][x];
            const cellDiv = document.createElement('div');
            cellDiv.className = 'grid-cell';

            if (letter === null) {
                cellDiv.classList.add('black');
            } else {
                cellDiv.classList.add('white');
                
                let number = null;
                for (let w of crossword.words) {
                    if (w.x === x && w.y === y) {
                        number = w.number;
                        break;
                    }
                }

                if (number !== null) {
                    const numDiv = document.createElement('div');
                    numDiv.className = 'cell-number';
                    numDiv.textContent = number;
                    cellDiv.appendChild(numDiv);
                }

                const input = document.createElement('input');
                input.className = 'cell-input';
                input.type = 'text';
                input.maxLength = 2; // Allow 2 to catch overwrite
                input.dataset.x = x;
                input.dataset.y = y;
                
                input.addEventListener('focus', () => onCellFocused(x, y, input));
                input.addEventListener('input', (e) => onCellInput(e, x, y, input));
                input.addEventListener('keydown', (e) => onCellKeyDown(e, x, y));
                input.addEventListener('click', () => onCellTap(x, y));

                cellDiv.appendChild(input);
                cellInputs[y][x] = { input, cellDiv };
            }
            rowDiv.appendChild(cellDiv);
        }
        gridContainer.appendChild(rowDiv);
    }
}

function renderClues() {
    const horizontals = crossword.words.filter(w => w.isHorizontal).sort((a,b) => a.number - b.number);
    const verticals = crossword.words.filter(w => !w.isHorizontal).sort((a,b) => a.number - b.number);

    horizontalCluesContainer.innerHTML = '';
    horizontals.forEach(w => {
        const div = createClueElement(w);
        horizontalCluesContainer.appendChild(div);
    });

    verticalCluesContainer.innerHTML = '';
    verticals.forEach(w => {
        const div = createClueElement(w);
        verticalCluesContainer.appendChild(div);
    });
}

function createClueElement(w) {
    const div = document.createElement('div');
    div.className = 'clue-item';
    div.dataset.wordId = w.number + (w.isHorizontal ? 'h' : 'v');
    
    const numSpan = document.createElement('span');
    numSpan.className = 'clue-number';
    numSpan.textContent = w.number + '.';

    const textSpan = document.createElement('span');
    textSpan.className = 'clue-text';
    textSpan.textContent = w.clue;

    div.appendChild(numSpan);
    div.appendChild(textSpan);

    div.addEventListener('click', () => {
        selectWord(w);
        // focus first cell
        const cell = cellInputs[w.y][w.x];
        if (cell) cell.input.focus();
    });

    return div;
}

function onCellFocused(x, y, input) {
    input.select();
    
    const words = crossword.words.filter(w => {
        if (w.isHorizontal) return w.y === y && x >= w.x && x < w.x + w.word.length;
        else return w.x === x && y >= w.y && y < w.y + w.word.length;
    });

    if (words.length > 0) {
        if (!words.includes(selectedWord)) {
            selectWord(words[0]);
        }
    }
}

function onCellTap(x, y) {
    const words = crossword.words.filter(w => {
        if (w.isHorizontal) return w.y === y && x >= w.x && x < w.x + w.word.length;
        else return w.x === x && y >= w.y && y < w.y + w.word.length;
    });
    
    if (words.length > 1) {
        let newWord = words.find(w => w !== selectedWord) || words[0];
        selectWord(newWord);
    }
}

function selectWord(word) {
    selectedWord = word;
    activeHintLabel.textContent = `${word.number} ${word.isHorizontal ? 'Orizzontale' : 'Verticale'}: ${word.clue}`;
    
    // Update highlights
    document.querySelectorAll('.clue-item').forEach(el => el.classList.remove('selected'));
    const clueEl = document.querySelector(`.clue-item[data-word-id="${word.number}${word.isHorizontal ? 'h' : 'v'}"]`);
    if (clueEl) {
        clueEl.classList.add('selected');
        clueEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    for (let y = 0; y < crossword.height; y++) {
        for (let x = 0; x < crossword.width; x++) {
            if (cellInputs[y][x]) {
                const cellDiv = cellInputs[y][x].cellDiv;
                cellDiv.classList.remove('active-word', 'focused');
                
                let inWord = false;
                if (word.isHorizontal) {
                    inWord = (word.y === y && x >= word.x && x < word.x + word.word.length);
                } else {
                    inWord = (word.x === x && y >= word.y && y < word.y + word.word.length);
                }
                
                if (inWord) {
                    cellDiv.classList.add('active-word');
                }
            }
        }
    }
}

function onCellInput(e, x, y, input) {
    let val = input.value;
    if (val.length > 1) {
        val = val.substring(val.length - 1);
        input.value = val;
    }

    if (val.length === 1 && selectedWord) {
        // Move to next
        let nextX = x;
        let nextY = y;
        if (selectedWord.isHorizontal) nextX++;
        else nextY++;

        let withinWord = false;
        if (selectedWord.isHorizontal && nextX < selectedWord.x + selectedWord.word.length) withinWord = true;
        if (!selectedWord.isHorizontal && nextY < selectedWord.y + selectedWord.word.length) withinWord = true;

        if (withinWord && cellInputs[nextY] && cellInputs[nextY][nextX]) {
            cellInputs[nextY][nextX].input.focus();
        }
    }
    
    checkCompletion();
}

function onCellKeyDown(e, x, y) {
    if (e.key === 'Backspace' && e.target.value === '' && selectedWord) {
        let prevX = x;
        let prevY = y;
        if (selectedWord.isHorizontal) prevX--;
        else prevY--;

        let withinWord = false;
        if (selectedWord.isHorizontal && prevX >= selectedWord.x) withinWord = true;
        if (!selectedWord.isHorizontal && prevY >= selectedWord.y) withinWord = true;

        if (withinWord && cellInputs[prevY] && cellInputs[prevY][prevX]) {
            cellInputs[prevY][prevX].input.focus();
            cellInputs[prevY][prevX].input.value = '';
        }
    }
}

function checkCompletion() {
    let totalLetters = 0;
    let filledCorrect = 0;
    let filledIncorrect = 0;

    for (let y = 0; y < crossword.height; y++) {
        for (let x = 0; x < crossword.width; x++) {
            if (crossword.grid[y][x] !== null) {
                totalLetters++;
                const input = cellInputs[y][x].input;
                if (input.value.length > 0) {
                    if (input.value.toUpperCase() === crossword.grid[y][x]) {
                        filledCorrect++;
                    } else {
                        filledIncorrect++;
                    }
                }
            }
        }
    }

    if (filledCorrect + filledIncorrect === totalLetters && totalLetters > 0) {
        if (filledIncorrect === 0) {
            document.getElementById('modal-success').classList.add('show');
        }
    }
}

function checkAnswers() {
    let errors = 0;
    let filled = 0;

    for (let y = 0; y < crossword.height; y++) {
        for (let x = 0; x < crossword.width; x++) {
            if (crossword.grid[y][x] !== null) {
                const input = cellInputs[y][x].input;
                if (input.value.length > 0) {
                    filled++;
                    if (input.value.toUpperCase() !== crossword.grid[y][x]) {
                        input.value = '';
                        errors++;
                    }
                }
            }
        }
    }

    if (filled === 0) {
        showToast("Inserisci qualche parola prima di controllare.");
    } else if (errors > 0) {
        showToast(`Hai commesso ${errors} errori. Sono stati cancellati.`);
    } else {
        showToast("Tutto corretto finora! Ottimo lavoro.");
    }
}

function revealWord(word) {
    for (let i = 0; i < word.word.length; i++) {
        let x = word.isHorizontal ? word.x + i : word.x;
        let y = word.isHorizontal ? word.y : word.y + i;
        if (crossword.grid[y][x] !== null) {
            cellInputs[y][x].input.value = crossword.grid[y][x];
        }
    }
    checkCompletion();
}

function revealAll() {
    for (let y = 0; y < crossword.height; y++) {
        for (let x = 0; x < crossword.width; x++) {
            if (crossword.grid[y][x] !== null) {
                cellInputs[y][x].input.value = crossword.grid[y][x];
            }
        }
    }
    checkCompletion();
}

// Start
init();
