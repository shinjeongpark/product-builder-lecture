const BOARD_SIZE = 15;

class OmokGame extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
        this.currentPlayer = 'black';
        this.gameOver = false;
    }

    connectedCallback() {
        this.render();
    }

    reset() {
        this.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.updateStatus();
        this.render();
    }

    updateStatus() {
        const statusEl = document.getElementById('game-status');
        if (statusEl) {
            statusEl.textContent = this.gameOver ? 'Game Over' : `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}'s Turn`;
        }
    }

    handleCellClick(r, c) {
        if (this.gameOver || this.board[r][c]) return;

        this.board[r][c] = this.currentPlayer;
        if (this.checkWin(r, c)) {
            this.gameOver = true;
            this.showWinModal();
        } else {
            this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        }
        this.updateStatus();
        this.render();
    }

    checkWin(r, c) {
        const directions = [
            [0, 1],  // Horizontal
            [1, 0],  // Vertical
            [1, 1],  // Diagonal (top-left to bottom-right)
            [1, -1]  // Diagonal (top-right to bottom-left)
        ];

        const player = this.board[r][c];

        for (const [dr, dc] of directions) {
            let count = 1;

            // Check in forward direction
            for (let i = 1; i < 5; i++) {
                const nr = r + dr * i;
                const nc = c + dc * i;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && this.board[nr][nc] === player) {
                    count++;
                } else break;
            }

            // Check in backward direction
            for (let i = 1; i < 5; i++) {
                const nr = r - dr * i;
                const nc = c - dc * i;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && this.board[nr][nc] === player) {
                    count++;
                } else break;
            }

            if (count >= 5) return true;
        }

        return false;
    }

    showWinModal() {
        const modal = document.getElementById('win-modal');
        const text = document.getElementById('winner-text');
        if (modal && text) {
            text.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)} Wins!`;
            modal.classList.remove('hidden');
        }
    }

    render() {
        const cellSize = 30; // pixels
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    user-select: none;
                }
                .board-container {
                    background-color: var(--board-color, #dcb35c);
                    padding: 20px;
                    border-radius: 5px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    display: inline-block;
                }
                .grid {
                    display: grid;
                    grid-template-columns: repeat(${BOARD_SIZE}, ${cellSize}px);
                    grid-template-rows: repeat(${BOARD_SIZE}, ${cellSize}px);
                    position: relative;
                }
                /* Lines */
                .cell {
                    position: relative;
                    width: ${cellSize}px;
                    height: ${cellSize}px;
                    cursor: pointer;
                }
                .cell::before, .cell::after {
                    content: '';
                    position: absolute;
                    background-color: var(--line-color, #333);
                }
                .cell::before {
                    top: 50%; left: 0; width: 100%; height: 1px;
                    transform: translateY(-50%);
                }
                .cell::after {
                    left: 50%; top: 0; height: 100%; width: 1px;
                    transform: translateX(-50%);
                }
                /* Stone styling */
                .stone {
                    position: absolute;
                    width: 26px;
                    height: 26px;
                    border-radius: 50%;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 2;
                    box-shadow: 1px 2px 3px rgba(0,0,0,0.3);
                    pointer-events: none;
                }
                .black {
                    background: radial-gradient(circle at 30% 30%, #555, #000);
                }
                .white {
                    background: radial-gradient(circle at 30% 30%, #fff, #ccc);
                }
                /* Hover effect */
                .cell:not(.has-stone):hover::after {
                    content: '';
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background-color: rgba(255, 255, 255, 0.3);
                    z-index: 1;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                }
                @media (max-width: 500px) {
                    .grid {
                        grid-template-columns: repeat(${BOARD_SIZE}, 22px);
                        grid-template-rows: repeat(${BOARD_SIZE}, 22px);
                    }
                    .cell { width: 22px; height: 22px; }
                    .stone { width: 18px; height: 18px; }
                }
            </style>
            <div class="board-container">
                <div class="grid">
                    ${this.board.map((row, r) => 
                        row.map((stone, c) => `
                            <div class="cell ${stone ? 'has-stone' : ''}" data-r="${r}" data-c="${c}">
                                ${stone ? `<div class="stone ${stone}"></div>` : ''}
                            </div>
                        `).join('')
                    ).join('')}
                </div>
            </div>
        `;

        this.shadowRoot.querySelectorAll('.cell').forEach(cell => {
            cell.onclick = () => {
                const r = parseInt(cell.dataset.r);
                const c = parseInt(cell.dataset.c);
                this.handleCellClick(r, c);
            };
        });
    }
}

customElements.define('omok-game', OmokGame);

// --- Initialization & Theme Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('omok-board');
    const restartBtn = document.getElementById('restart-btn');
    const modalRestartBtn = document.getElementById('modal-restart-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const modal = document.getElementById('win-modal');
    const body = document.body;

    const resetGame = () => {
        board.reset();
        modal.classList.add('hidden');
    };

    restartBtn.onclick = resetGame;
    modalRestartBtn.onclick = resetGame;

    // Theme logic
    const savedTheme = localStorage.getItem('omok-theme') || 'light';
    body.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'light' ? 'Dark Mode' : 'Light Mode';

    themeToggle.onclick = () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        body.setAttribute('data-theme', newTheme);
        themeToggle.textContent = newTheme === 'light' ? 'Dark Mode' : 'Light Mode';
        localStorage.setItem('omok-theme', newTheme);
    };
});
