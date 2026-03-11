const ANIMALS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻'];
const GRID_SIZE = 7;

class AnipangGame extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.grid = [];
        this.selectedCell = null;
        this.score = 0;
        this.isProcessing = false;
    }

    connectedCallback() {
        this.initGame();
    }

    initGame() {
        this.score = 0;
        this.grid = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            this.grid[r] = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                let animal;
                do {
                    animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
                } while (this.isInitialMatch(r, c, animal));
                this.grid[r][c] = animal;
            }
        }
        this.render();
    }

    isInitialMatch(r, c, animal) {
        if (r >= 2 && this.grid[r-1][c] === animal && this.grid[r-2][c] === animal) return true;
        if (c >= 2 && this.grid[r][c-1] === animal && this.grid[r][c-2] === animal) return true;
        return false;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    user-select: none;
                }
                .grid {
                    display: grid;
                    grid-template-columns: repeat(${GRID_SIZE}, 1fr);
                    gap: 4px;
                    background: var(--grid-bg, #ddd);
                    padding: 4px;
                    border-radius: 8px;
                    aspect-ratio: 1/1;
                }
                .cell {
                    background: var(--cell-bg, #eee);
                    aspect-ratio: 1/1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: transform 0.2s, background-color 0.2s;
                }
                .cell:hover { transform: scale(1.05); }
                .cell.selected { background-color: #b3d9ff; border: 2px solid #4A90E2; }
                .cell.matched { animation: popOut 0.3s forwards; }
                @keyframes popOut {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(0); opacity: 0; }
                }
                @media (max-width: 400px) {
                    .cell { font-size: 1.5rem; }
                }
            </style>
            <div class="grid">
                ${this.grid.map((row, r) => 
                    row.map((animal, c) => `
                        <div class="cell" data-r="${r}" data-c="${c}">${animal}</div>
                    `).join('')
                ).join('')}
            </div>
        `;

        this.shadowRoot.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });
    }

    async handleCellClick(e) {
        if (this.isProcessing) return;

        const r = parseInt(e.target.dataset.r);
        const c = parseInt(e.target.dataset.c);

        if (!this.selectedCell) {
            this.selectedCell = { r, c };
            e.target.classList.add('selected');
        } else {
            const prev = this.selectedCell;
            const dist = Math.abs(r - prev.r) + Math.abs(c - prev.c);

            if (dist === 1) {
                this.isProcessing = true;
                await this.swapCells(prev.r, prev.c, r, c);
                const matches = this.findMatches();
                if (matches.length > 0) {
                    await this.processMatches();
                } else {
                    await this.swapCells(prev.r, prev.c, r, c); // Revert
                }
                this.isProcessing = false;
            }
            
            this.shadowRoot.querySelectorAll('.cell').forEach(el => el.classList.remove('selected'));
            this.selectedCell = null;
        }
    }

    async swapCells(r1, c1, r2, c2) {
        const temp = this.grid[r1][c1];
        this.grid[r1][c1] = this.grid[r2][c2];
        this.grid[r2][c2] = temp;
        this.render();
        return new Promise(res => setTimeout(res, 200));
    }

    findMatches() {
        const matches = [];
        // Horizontal
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE - 2; c++) {
                const animal = this.grid[r][c];
                if (animal && this.grid[r][c+1] === animal && this.grid[r][c+2] === animal) {
                    matches.push({r, c}, {r, c+1}, {r, c+2});
                }
            }
        }
        // Vertical
        for (let r = 0; r < GRID_SIZE - 2; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const animal = this.grid[r][c];
                if (animal && this.grid[r+1][c] === animal && this.grid[r+2][c] === animal) {
                    matches.push({r, c}, {r+1, c}, {r+2, c});
                }
            }
        }
        return matches;
    }

    async processMatches() {
        let matches = this.findMatches();
        if (matches.length === 0) return;

        // Unique matches
        const uniqueMatches = Array.from(new Set(matches.map(m => `${m.r},${m.c}`))).map(s => {
            const [r, c] = s.split(',').map(Number);
            return {r, c};
        });

        // Highlight and remove
        uniqueMatches.forEach(m => {
            const cell = this.shadowRoot.querySelector(`[data-r="${m.r}"][data-c="${m.c}"]`);
            cell.classList.add('matched');
            this.grid[m.r][m.c] = null;
        });

        this.score += uniqueMatches.length * 10;
        document.getElementById('score').textContent = this.score;

        await new Promise(res => setTimeout(res, 300));

        // Fall down
        for (let c = 0; c < GRID_SIZE; c++) {
            let emptySpaces = 0;
            for (let r = GRID_SIZE - 1; r >= 0; r--) {
                if (this.grid[r][c] === null) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    this.grid[r + emptySpaces][c] = this.grid[r][c];
                    this.grid[r][c] = null;
                }
            }
            // Fill new
            for (let r = 0; r < emptySpaces; r++) {
                this.grid[r][c] = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
            }
        }

        this.render();
        await new Promise(res => setTimeout(res, 200));
        await this.processMatches(); // Recursive for combos
    }
}

customElements.define('anipang-game', AnipangGame);

// Timer & UI Logic
let timeLeft = 60;
let timerId = null;

function startGame() {
    timeLeft = 60;
    document.getElementById('score').textContent = '0';
    document.getElementById('timer').textContent = timeLeft;
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('anipang').initGame();

    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerId);
            endGame();
        }
    }, 1000);
}

function endGame() {
    const score = document.getElementById('score').textContent;
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.remove('hidden');
}

document.getElementById('restart-btn').addEventListener('click', startGame);

// Theme Toggle Logic
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    const savedTheme = localStorage.getItem('lotto-theme') || 'light';
    body.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'light' ? 'Dark Mode' : 'Light Mode';

    themeToggle.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        body.setAttribute('data-theme', newTheme);
        themeToggle.textContent = newTheme === 'light' ? 'Dark Mode' : 'Light Mode';
        localStorage.setItem('lotto-theme', newTheme);
    });

    startGame();
});
