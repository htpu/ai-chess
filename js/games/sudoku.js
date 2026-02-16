class SudokuGame {
    constructor() {
        this.board = [];
        this.original = [];
        this.selected = null;
        this.undoStack = [];
        this.difficulty = 'medium';
        
        this.init();
    }

    init() {
        this.createBoard();
        this.bindEvents();
        this.newGame();
    }

    createBoard() {
        const board = document.getElementById('board');
        board.innerHTML = '';
        
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            board.appendChild(cell);
        }
    }

    bindEvents() {
        document.getElementById('board').addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (cell) {
                this.selectCell(parseInt(cell.dataset.index));
            }
        });

        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const num = parseInt(btn.dataset.num);
                this.inputNumber(num);
            });
        });

        document.getElementById('newGame').addEventListener('click', () => {
            this.newGame();
        });

        document.getElementById('solve').addEventListener('click', () => {
            this.solve();
        });

        document.getElementById('erase').addEventListener('click', () => {
            this.inputNumber(0);
        });

        document.getElementById('undo').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.newGame();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '9') {
                this.inputNumber(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                this.inputNumber(0);
            } else if (e.key === 'z' || e.key === 'Z') {
                this.undo();
            } else if (e.key >= 'a' && e.key <= 'i') {
                const col = e.key.charCodeAt(0) - 97;
                if (col < 9) this.selectCell(col);
            } else if (e.key >= '1' && e.key <= '9') {
                const row = parseInt(e.key) - 1;
                if (row < 9) this.selectCell(row * 9);
            }
        });
    }

    generatePuzzle() {
        const solution = this.generateSolution();
        const puzzle = [...solution];
        const holes = this.getHolesForDifficulty(this.difficulty);
        
        let attempts = holes;
        while (attempts > 0) {
            const idx = Math.floor(Math.random() * 81);
            if (puzzle[idx] !== 0) {
                puzzle[idx] = 0;
                attempts--;
            }
        }
        
        return { puzzle, solution };
    }

    generateSolution() {
        const board = new Array(81).fill(0);
        this.solveDLX(board);
        return board;
    }

    solveDLX(board, randomize = true) {
        const empty = board.indexOf(0);
        if (empty === -1) return true;
        
        let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        if (randomize) {
            nums = nums.sort(() => Math.random() - 0.5);
        }
        
        for (const num of nums) {
            if (this.isValid(board, empty, num)) {
                board[empty] = num;
                if (this.solveDLX(board, randomize)) {
                    return true;
                }
                board[empty] = 0;
            }
        }
        
        return false;
    }

    isValid(board, index, num) {
        const row = Math.floor(index / 9);
        const col = index % 9;
        
        for (let i = 0; i < 9; i++) {
            if (board[row * 9 + i] === num) return false;
        }
        
        for (let i = 0; i < 9; i++) {
            if (board[i * 9 + col] === num) return false;
        }
        
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[(boxRow + i) * 9 + (boxCol + j)] === num) return false;
            }
        }
        
        return true;
    }

    getHolesForDifficulty(difficulty) {
        const holes = {
            easy: 35,
            medium: 45,
            hard: 52,
            expert: 58
        };
        return holes[difficulty] || 45;
    }

    newGame() {
        const { puzzle, solution } = this.generatePuzzle();
        this.board = puzzle;
        this.original = [...puzzle];
        this.solution = solution;
        this.undoStack = [];
        this.selected = null;
        this.render();
        this.showMessage('新游戏开始');
    }

    selectCell(index) {
        this.selected = index;
        this.render();
        this.highlightRelated();
    }

    highlightRelated() {
        if (this.selected === null) return;
        
        const row = Math.floor(this.selected / 9);
        const col = this.selected % 9;
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        const selectedNum = this.board[this.selected];
        
        document.querySelectorAll('.cell').forEach((cell, i) => {
            cell.classList.remove('highlight-row', 'highlight-col', 'highlight-box', 'same-number');
            
            const r = Math.floor(i / 9);
            const c = i % 9;
            
            if (r === row) cell.classList.add('highlight-row');
            if (c === col) cell.classList.add('highlight-col');
            
            const br = Math.floor(r / 3) * 3;
            const bc = Math.floor(c / 3) * 3;
            if (br === boxRow && bc === boxCol) cell.classList.add('highlight-box');
            
            if (selectedNum && this.board[i] === selectedNum && i !== this.selected) {
                cell.classList.add('same-number');
            }
        });
    }

    inputNumber(num) {
        if (this.selected === null) return;
        if (this.original[this.selected] !== 0) return;
        
        const oldValue = this.board[this.selected];
        if (oldValue === num) return;
        
        this.undoStack.push({
            index: this.selected,
            oldValue,
            newValue: num
        });
        
        this.board[this.selected] = num;
        this.render();
        this.highlightRelated();
        
        if (this.isComplete()) {
            if (this.isCorrect()) {
                this.showMessage('恭喜完成!', 'success');
            } else {
                this.showMessage('答案错误', 'error');
            }
        }
    }

    isComplete() {
        return !this.board.includes(0);
    }

    isCorrect() {
        for (let i = 0; i < 81; i++) {
            if (this.board[i] !== this.solution[i]) return false;
        }
        return true;
    }

    solve() {
        this.board = [...this.solution];
        this.render();
        this.showMessage('已解题');
    }

    undo() {
        if (this.undoStack.length === 0) {
            this.showMessage('没有可撤销的操作', 'error');
            return;
        }
        
        const action = this.undoStack.pop();
        this.board[action.index] = action.oldValue;
        this.render();
        this.highlightRelated();
    }

    render() {
        const cells = document.querySelectorAll('.cell');
        
        cells.forEach((cell, i) => {
            const value = this.board[i];
            cell.textContent = value || '';
            cell.className = 'cell';
            
            if (this.original[i] !== 0) {
                cell.classList.add('fixed');
            }
            
            if (i === this.selected) {
                cell.classList.add('selected');
            }
            
            if (value !== 0 && this.solution && value !== this.solution[i] && this.isComplete()) {
                cell.classList.add('error');
            }
        });
    }

    showMessage(text, type = 'success') {
        const msg = document.getElementById('message');
        msg.textContent = text;
        msg.className = 'message ' + type;
        
        setTimeout(() => {
            msg.classList.add('hidden');
        }, 1500);
    }

    updateUITexts() {
        // Handled by sudoku-loader.js
    }
}
