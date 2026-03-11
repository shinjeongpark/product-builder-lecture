// --- Calculator Component ---
class SimpleCalculator extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.display = '0';
        this.operator = null;
        this.previousValue = '';
        this.shouldResetDisplay = false;
    }

    connectedCallback() {
        this.render();
    }

    handleInput(val) {
        if (!isNaN(val) || val === '.') {
            if (this.display === '0' || this.shouldResetDisplay) {
                this.display = val;
                this.shouldResetDisplay = false;
            } else {
                this.display += val;
            }
        } else if (val === 'C') {
            this.display = '0';
            this.previousValue = '';
            this.operator = null;
        } else if (val === '=') {
            if (this.operator && this.previousValue) {
                this.calculate();
                this.operator = null;
                this.previousValue = '';
            }
        } else {
            if (this.operator) {
                this.calculate();
            }
            this.operator = val;
            this.previousValue = this.display;
            this.shouldResetDisplay = true;
        }
        this.render();
    }

    calculate() {
        const prev = parseFloat(this.previousValue);
        const current = parseFloat(this.display);
        let result = 0;
        switch (this.operator) {
            case '+': result = prev + current; break;
            case '-': result = prev - current; break;
            case '*': result = prev * current; break;
            case '/': result = prev / current; break;
        }
        this.display = String(Number(result.toFixed(8))); // Limit floating point issues
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .calc-body { background: #333; padding: 20px; border-radius: 10px; color: white; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
                .display { background: #222; padding: 20px; font-size: 2.5rem; text-align: right; border-radius: 5px; margin-bottom: 20px; min-height: 1.2em; word-break: break-all; }
                .buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
                button { padding: 20px; font-size: 1.3rem; border: none; border-radius: 8px; cursor: pointer; transition: all 0.1s; background: #555; color: white; font-weight: bold; }
                button:active { transform: scale(0.95); opacity: 0.8; }
                button.op { background: #f39c12; }
                button.eq { background: #e67e22; grid-column: span 2; }
                button.clear { background: #e74c3c; grid-column: span 2; }
                button.zero { grid-column: span 2; }
            </style>
            <div class="calc-body">
                <div class="display">${this.display}</div>
                <div class="buttons">
                    <button class="clear">C</button> <button class="op">/</button> <button class="op">*</button>
                    <button>7</button> <button>8</button> <button>9</button> <button class="op">-</button>
                    <button>4</button> <button>5</button> <button>6</button> <button class="op">+</button>
                    <button>1</button> <button>2</button> <button>3</button> <button class="eq">=</button>
                    <button class="zero">0</button> <button>.</button>
                </div>
            </div>
        `;
        this.shadowRoot.querySelectorAll('button').forEach(btn => {
            btn.onclick = () => this.handleInput(btn.textContent);
        });
    }
}

customElements.define('simple-calculator', SimpleCalculator);

// --- Theme Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    const savedTheme = localStorage.getItem('calc-theme') || 'light';
    body.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'light' ? 'Dark Mode' : 'Light Mode';

    themeToggle.onclick = () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        body.setAttribute('data-theme', newTheme);
        themeToggle.textContent = newTheme === 'light' ? 'Dark Mode' : 'Light Mode';
        localStorage.setItem('calc-theme', newTheme);
    };
});
