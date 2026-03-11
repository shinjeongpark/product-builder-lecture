class LottoGenerator extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.numbers = [];
    }

    connectedCallback() {
        this.render();
    }

    generateNumbers() {
        const set = new Set();
        while (set.size < 6) {
            set.add(Math.floor(Math.random() * 45) + 1);
        }
        this.numbers = Array.from(set).sort((a, b) => a - b);
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    text-align: center;
                    padding: 1rem;
                }
                .balls-container {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                }
                .ball {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 1.2rem;
                    color: white;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    animation: popIn 0.3s ease-out;
                }
                @keyframes popIn {
                    0% { transform: scale(0); }
                    100% { transform: scale(1); }
                }
                .ball-1 { background-color: #fbc400; }
                .ball-11 { background-color: #69c8f2; }
                .ball-21 { background-color: #ff7272; }
                .ball-31 { background-color: #aaa; }
                .ball-41 { background-color: #b0d840; }

                button#generateBtn {
                    padding: 12px 24px;
                    font-size: 1rem;
                    background-color: var(--button-bg, #4A90E2);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                button#generateBtn:hover {
                    opacity: 0.9;
                    transform: translateY(-2px);
                }
                .placeholder {
                    color: var(--text-color, #888);
                    font-style: italic;
                    opacity: 0.6;
                }
            </style>
            <div class="balls-container">
                ${this.numbers.length > 0 
                    ? this.numbers.map(n => `<div class="ball ${this.getBallClass(n)}">${n}</div>`).join('')
                    : '<p class="placeholder">Click the button to generate numbers!</p>'
                }
            </div>
            <button id="generateBtn">Generate Numbers</button>
        `;

        this.shadowRoot.getElementById('generateBtn').addEventListener('click', () => this.generateNumbers());
    }

    getBallClass(n) {
        if (n <= 10) return 'ball-1';
        if (n <= 20) return 'ball-11';
        if (n <= 30) return 'ball-21';
        if (n <= 40) return 'ball-31';
        return 'ball-41';
    }
}

customElements.define('lotto-generator', LottoGenerator);

// Theme Toggle Logic
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Check saved theme
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
});
