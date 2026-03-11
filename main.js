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
                    padding: 2rem;
                    font-family: system-ui, -apple-system, sans-serif;
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
                /* Lotto Ball Colors */
                .ball-1 { background-color: #fbc400; } /* 1-10 */
                .ball-11 { background-color: #69c8f2; } /* 11-20 */
                .ball-21 { background-color: #ff7272; } /* 21-30 */
                .ball-31 { background-color: #aaa; }    /* 31-40 */
                .ball-41 { background-color: #b0d840; } /* 41-45 */

                button {
                    padding: 12px 24px;
                    font-size: 1rem;
                    background-color: #4A90E2;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                button:hover {
                    background-color: #357ABD;
                }
                .placeholder {
                    color: #888;
                    font-style: italic;
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
