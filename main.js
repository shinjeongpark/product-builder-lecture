// --- Anipang Game Component ---
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

    connectedCallback() { this.initGame(); }

    initGame() {
        this.score = 0;
        this.grid = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            this.grid[r] = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                let animal;
                do { animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]; } 
                while (this.isInitialMatch(r, c, animal));
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
                :host { display: block; user-select: none; }
                .grid { display: grid; grid-template-columns: repeat(${GRID_SIZE}, 1fr); gap: 4px; background: var(--grid-bg, #ddd); padding: 4px; border-radius: 8px; aspect-ratio: 1/1; }
                .cell { background: var(--cell-bg, #eee); aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; font-size: 2rem; cursor: pointer; border-radius: 4px; transition: transform 0.1s; }
                .cell:hover { transform: scale(1.05); }
                .cell.selected { background-color: #b3d9ff; border: 2px solid #4A90E2; }
                .cell.matched { animation: popOut 0.3s forwards; }
                @keyframes popOut { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(0); opacity: 0; } }
                @media (max-width: 400px) { .cell { font-size: 1.5rem; } }
            </style>
            <div class="grid">${this.grid.map((row, r) => row.map((animal, c) => `<div class="cell" data-r="${r}" data-c="${c}">${animal}</div>`).join('')).join('')}</div>
        `;
        this.shadowRoot.querySelectorAll('.cell').forEach(cell => cell.addEventListener('click', (e) => this.handleCellClick(e)));
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
            if (Math.abs(r - prev.r) + Math.abs(c - prev.c) === 1) {
                this.isProcessing = true;
                await this.swapCells(prev.r, prev.c, r, c);
                if ((this.findMatches()).length > 0) { await this.processMatches(); } 
                else { await this.swapCells(prev.r, prev.c, r, c); }
                this.isProcessing = false;
            }
            this.shadowRoot.querySelectorAll('.cell').forEach(el => el.classList.remove('selected'));
            this.selectedCell = null;
        }
    }

    async swapCells(r1, c1, r2, c2) {
        [this.grid[r1][c1], this.grid[r2][c2]] = [this.grid[r2][c2], this.grid[r1][c1]];
        this.render();
        return new Promise(res => setTimeout(res, 200));
    }

    findMatches() {
        const matches = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE - 2; c++) {
                if (this.grid[r][c] && this.grid[r][c] === this.grid[r][c+1] && this.grid[r][c] === this.grid[r][c+2]) matches.push({r, c}, {r, c+1}, {r, c+2});
            }
        }
        for (let r = 0; r < GRID_SIZE - 2; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (this.grid[r][c] && this.grid[r][c] === this.grid[r+1][c] && this.grid[r][c] === this.grid[r+2][c]) matches.push({r, c}, {r+1, c}, {r+2, c});
            }
        }
        return matches;
    }

    async processMatches() {
        let matches = this.findMatches();
        if (matches.length === 0) return;
        const unique = Array.from(new Set(matches.map(m => `${m.r},${m.c}`))).map(s => { const [r, c] = s.split(',').map(Number); return {r, c}; });
        unique.forEach(m => { this.shadowRoot.querySelector(`[data-r="${m.r}"][data-c="${m.c}"]`).classList.add('matched'); this.grid[m.r][m.c] = null; });
        this.score += unique.length * 10;
        document.getElementById('score').textContent = this.score;
        await new Promise(res => setTimeout(res, 300));
        for (let c = 0; c < GRID_SIZE; c++) {
            let empty = 0;
            for (let r = GRID_SIZE - 1; r >= 0; r--) {
                if (this.grid[r][c] === null) empty++;
                else if (empty > 0) { this.grid[r + empty][c] = this.grid[r][c]; this.grid[r][c] = null; }
            }
            for (let r = 0; r < empty; r++) this.grid[r][c] = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
        }
        this.render();
        await new Promise(res => setTimeout(res, 200));
        await this.processMatches();
    }
}
customElements.define('anipang-game', AnipangGame);

// --- Calculator Component ---
class SimpleCalculator extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.display = '0';
        this.currentValue = '';
        this.operator = null;
        this.previousValue = '';
    }

    connectedCallback() { this.render(); }

    handleInput(val) {
        if (!isNaN(val) || val === '.') {
            if (this.display === '0' && val !== '.') this.display = val;
            else this.display += val;
        } else if (val === 'C') {
            this.display = '0';
            this.previousValue = '';
            this.operator = null;
        } else if (val === '=') {
            if (this.operator && this.previousValue) {
                this.display = eval(`${this.previousValue}${this.operator}${this.display}`);
                this.operator = null;
                this.previousValue = '';
            }
        } else {
            this.operator = val;
            this.previousValue = this.display;
            this.display = '0';
        }
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .calc-body { background: #333; padding: 20px; border-radius: 10px; max-width: 300px; margin: 0 auto; color: white; }
                .display { background: #222; padding: 15px; font-size: 2rem; text-align: right; border-radius: 5px; margin-bottom: 15px; overflow: hidden; }
                .buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
                button { padding: 15px; font-size: 1.2rem; border: none; border-radius: 5px; cursor: pointer; transition: 0.2s; background: #555; color: white; }
                button:active { transform: scale(0.95); }
                button.op { background: #f39c12; }
                button.eq { background: #e67e22; grid-column: span 2; }
                button.clear { background: #e74c3c; grid-column: span 2; }
            </style>
            <div class="calc-body">
                <div class="display">${this.display}</div>
                <div class="buttons">
                    <button class="clear">C</button> <button class="op">/</button> <button class="op">*</button>
                    <button>7</button> <button>8</button> <button>9</button> <button class="op">-</button>
                    <button>4</button> <button>5</button> <button>6</button> <button class="op">+</button>
                    <button>1</button> <button>2</button> <button>3</button> <button class="eq">=</button>
                    <button style="grid-column: span 2">0</button> <button>.</button>
                </div>
            </div>
        `;
        this.shadowRoot.querySelectorAll('button').forEach(btn => btn.onclick = () => this.handleInput(btn.textContent));
    }
}
customElements.define('simple-calculator', SimpleCalculator);

// --- App Navigation & Common Logic ---
let timeLeft = 60;
let timerId = null;

function startGame() {
    timeLeft = 60;
    document.getElementById('score').textContent = '0';
    document.getElementById('timer').textContent = timeLeft;
    document.getElementById('game-over').classList.add('hidden');
    const game = document.getElementById('anipang');
    if (game) game.initGame();

    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
        timeLeft--;
        const timerEl = document.getElementById('timer');
        if (timerEl) timerEl.textContent = timeLeft;
        if (timeLeft <= 0) { clearInterval(timerId); endGame(); }
    }, 1000);
}

function endGame() {
    const score = document.getElementById('score').textContent;
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.remove('hidden');
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const savedTheme = localStorage.getItem('lotto-theme') || 'light';
    body.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'light' ? 'Dark Mode' : 'Light Mode';

    themeToggle.onclick = () => {
        const current = body.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        body.setAttribute('data-theme', next);
        themeToggle.textContent = next === 'light' ? 'Dark Mode' : 'Light Mode';
        localStorage.setItem('lotto-theme', next);
    };

    // App Switching
    const navBtns = document.querySelectorAll('.nav-btn');
    const views = { anipang: document.getElementById('anipang-view'), calculator: document.getElementById('calculator-view') };
    const title = document.getElementById('app-title');

    navBtns.forEach(btn => {
        btn.onclick = () => {
            const app = btn.dataset.app;
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            Object.keys(views).forEach(key => views[key].classList.add('hidden'));
            views[app].classList.remove('hidden');
            title.textContent = app === 'anipang' ? 'Anipang Puzzle' : 'Simple Calculator';

            if (app === 'anipang') startGame();
            else if (timerId) clearInterval(timerId);
        };
    });

    document.getElementById('restart-btn').onclick = startGame;
    startGame();
});
