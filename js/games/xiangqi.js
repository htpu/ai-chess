const DIFFICULTY_SETTINGS = {
    1: { depth: 1, time: 100, errorRate: 0.3 },
    2: { depth: 2, time: 200, errorRate: 0.2 },
    3: { depth: 2, time: 300, errorRate: 0.1 },
    4: { depth: 3, time: 500, errorRate: 0.05 },
    5: { depth: 3, time: 800, errorRate: 0 }
};

const PIECE_VALUES = {
    'K': 10000,
    'A': 20,
    'E': 20,
    'H': 40,
    'R': 90,
    'C': 45,
    'P': 10
};

const INITIAL_BOARD = [
    ['r', 'h', 'e', 'a', 'k', 'a', 'e', 'h', 'r'],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'c', '', '', '', '', '', 'c', ''],
    ['p', '', 'p', '', 'p', '', 'p', '', 'p'],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['P', '', 'P', '', 'P', '', 'P', '', 'P'],
    ['', 'C', '', '', '', '', '', 'C', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['R', 'H', 'E', 'A', 'K', 'A', 'E', 'H', 'R']
];

const PIECE_NAMES = {
    'K': { zh: '帅', en: 'K' },
    'R': { zh: '車', en: 'R' },
    'H': { zh: '馬', en: 'H' },
    'E': { zh: '相', en: 'E' },
    'A': { zh: '仕', en: 'A' },
    'C': { zh: '炮', en: 'C' },
    'P': { zh: '兵', en: 'P' }
};

class XiangqiGame {
    constructor() {
        this.board = [];
        this.currentTurn = 'red';
        this.playerColor = 'red';
        this.gameStarted = false;
        this.gameOver = false;
        this.moveHistory = [];
        this.isThinking = false;
        this.selectedSquare = null;
        this.validMoves = [];
        this.lastMove = null;
        this.difficulty = 3;
        
        this.audioContext = null;
        this.initAudio();
        
        this.init();
    }

    initAudio() {
        let soundEnabled = true;
        try {
            soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        } catch (e) {}
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.playSound = (type) => {
                const se = document.getElementById('soundToggle');
                const isEnabled = se ? se.checked : soundEnabled;
                if (!isEnabled) return;
                if (!this.audioContext) return;
                
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                const freq = type === 'move' ? 800 : type === 'capture' ? 600 : 1000;
                const duration = type === 'move' ? 0.08 : 0.12;
                
                osc.frequency.value = freq;
                osc.type = 'square';
                
                gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + duration);
            };
        } catch (e) {
            this.playSound = () => {};
        }
    }

    t(key) {
        return window.t ? window.t(key) : key;
    }

    init() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            currentLang = localStorage.getItem('language') || 'zh';
        } catch (e) {
            currentLang = 'zh';
        }

        this.resetBoard();
        
        let hasSavedGame = false;
        try {
            const savedGameState = localStorage.getItem('xiangqiGameState');
            if (savedGameState) {
                const state = JSON.parse(savedGameState);
                hasSavedGame = state.board !== null;
            }
        } catch (e) {
            hasSavedGame = false;
        }

        this.createBoard();
        this.bindEvents();

        if (hasSavedGame) {
            this.loadGameState();
        } else {
            this.updateUI();
        }
    }

    resetBoard() {
        this.board = INITIAL_BOARD.map(row => [...row]);
    }

    createBoard() {
        const boardEl = document.getElementById('board');
        if (!boardEl) return;

        boardEl.innerHTML = '';
        boardEl.className = 'xiangqi-board';

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'xq-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                if (row === 4 || row === 5) {
                    cell.classList.add('xq-river');
                }

                if ((row <= 2 || row >= 7) && (col >= 3 && col <= 5)) {
                    cell.classList.add(row < 5 ? 'xq-palace-red' : 'xq-palace-black');
                }

                const piece = this.board[row][col];
                if (piece) {
                    const pieceEl = this.createPieceElement(piece, row, col);
                    cell.appendChild(pieceEl);
                }

                boardEl.appendChild(cell);
            }
        }
    }

    createPieceElement(piece, row, col) {
        const pieceEl = document.createElement('div');
        pieceEl.className = 'xq-piece';
        
        const isRed = piece === piece.toUpperCase();
        pieceEl.classList.add(isRed ? 'red' : 'black');
        
        const pieceName = PIECE_NAMES[piece.toUpperCase()] || { zh: piece, en: piece };
        pieceEl.textContent = pieceName[currentLang] || pieceName.zh;
        
        return pieceEl;
    }

    bindEvents() {
        const boardEl = document.getElementById('board');
        if (boardEl) {
            boardEl.addEventListener('click', (e) => this.handleBoardClick(e));
        }

        const difficultyEl = document.getElementById('difficulty');
        if (difficultyEl) {
            difficultyEl.addEventListener('change', () => {
                this.difficulty = parseInt(difficultyEl.value);
                this.saveGameState();
            });
        }

        const playerColorEl = document.getElementById('playerColor');
        if (playerColorEl) {
            playerColorEl.addEventListener('change', (e) => {
                this.playerColor = e.target.value;
                localStorage.setItem('playerColor', this.playerColor);
                this.resetGame();
            });
        }

        const undoMoveEl = document.getElementById('undoMove');
        if (undoMoveEl) {
            undoMoveEl.addEventListener('click', () => this.undoMove());
        }

        const resignEl = document.getElementById('resign');
        if (resignEl) {
            resignEl.addEventListener('click', () => this.resign());
        }

        const playAgainEl = document.getElementById('playAgain');
        if (playAgainEl) {
            playAgainEl.addEventListener('click', () => {
                document.getElementById('gameOverModal').classList.add('hidden');
                this.resetGame();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'z' || e.key === 'Z') {
                this.undoMove();
            } else if (e.key === 'n' || e.key === 'N') {
                this.newGame();
            }
        });
    }

    handleBoardClick(e) {
        if (this.gameOver || this.isThinking) return;

        const cell = e.target.closest('.xq-cell');
        if (!cell) {
            if (this.selectedSquare) {
                this.clearSelection();
            }
            return;
        }

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (this.selectedSquare) {
            const moveKey = `${this.selectedSquare.row},${this.selectedSquare.col}`;
            const targetKey = `${row},${col}`;
            
            if (this.validMoves.some(m => `${m.row},${m.col}` === targetKey)) {
                this.executeMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
                return;
            } else {
                const piece = this.board[row][col];
                if (piece && this.isOwnPiece(piece)) {
                    this.selectSquare(row, col);
                    return;
                } else {
                    this.clearSelection();
                    return;
                }
            }
        }

        const piece = this.board[row][col];
        if (piece && this.isOwnPiece(piece)) {
            this.selectSquare(row, col);
        }
    }

    isOwnPiece(piece) {
        if (!piece) return false;
        const isRed = piece === piece.toUpperCase();
        return (this.currentTurn === 'red' && isRed) || (this.currentTurn === 'black' && !isRed);
    }

    selectSquare(row, col) {
        this.clearSelection();
        this.selectedSquare = { row, col };
        
        const cell = document.querySelector(`.xq-cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('selected');
        }

        this.validMoves = this.getValidMoves(row, col);
        
        this.validMoves.forEach(move => {
            const moveCell = document.querySelector(`.xq-cell[data-row="${move.row}"][data-col="${move.col}"]`);
            if (moveCell) {
                const targetPiece = this.board[move.row][move.col];
                if (targetPiece) {
                    moveCell.classList.add('valid-capture');
                } else {
                    moveCell.classList.add('valid-move');
                }
            }
        });
    }

    clearSelection() {
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.valid-move').forEach(el => el.classList.remove('valid-move'));
        document.querySelectorAll('.valid-capture').forEach(el => el.classList.remove('valid-capture'));
        
        this.selectedSquare = null;
        this.validMoves = [];
    }

    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];

        const pieceType = piece.toUpperCase();
        const isRed = piece === piece.toUpperCase();
        const moves = [];

        switch (pieceType) {
            case 'K':
                moves.push(...this.getGeneralMoves(row, col, isRed));
                break;
            case 'A':
                moves.push(...this.getAdvisorMoves(row, col, isRed));
                break;
            case 'E':
                moves.push(...this.getElephantMoves(row, col, isRed));
                break;
            case 'H':
                moves.push(...this.getHorseMoves(row, col));
                break;
            case 'R':
                moves.push(...this.getChariotMoves(row, col));
                break;
            case 'C':
                moves.push(...this.getCannonMoves(row, col));
                break;
            case 'P':
                moves.push(...this.getSoldierMoves(row, col, isRed));
                break;
        }

        return moves.filter(move => !this.wouldBeInCheck(row, col, move.row, move.col, isRed ? 'red' : 'black'));
    }

    getGeneralMoves(row, col, isRed) {
        const moves = [];
        const palace = isRed ? [0, 1, 2] : [7, 8, 9];
        
        if (!palace.includes(row)) return moves;
        
        const newRow = row - 1;
        if (newRow >= 0 && this.board[newRow][col] === '') {
            moves.push({ row: newRow, col });
        }
        
        const newRow2 = row + 1;
        if (newRow2 < 10 && this.board[newRow2][col] === '') {
            moves.push({ row: newRow2, col });
        }
        
        const newCol = col - 1;
        if (newCol >= 0 && newCol <= 2 || (newCol >= 3 && newCol <= 5 && palace.includes(row))) {
            if (!this.board[row][newCol] || this.isEnemyPiece(this.board[row][newCol], isRed)) {
                moves.push({ row, col: newCol });
            }
        }
        
        const newCol2 = col + 1;
        if (newCol2 <= 8 && (newCol2 >= 3 && newCol2 <= 5 && palace.includes(row))) {
            if (!this.board[row][newCol2] || this.isEnemyPiece(this.board[row][newCol2], isRed)) {
                moves.push({ row, col: newCol2 });
            }
        }

        const enemyGeneralPos = this.findGeneralPosition(!isRed);
        if (enemyGeneralPos) {
            if (col === enemyGeneralPos.col) {
                let hasPieceBetween = false;
                const minRow = Math.min(row, enemyGeneralPos.row);
                const maxRow = Math.max(row, enemyGeneralPos.row);
                for (let r = minRow + 1; r < maxRow; r++) {
                    if (this.board[r][col]) {
                        hasPieceBetween = true;
                        break;
                    }
                }
                if (!hasPieceBetween) {
                    moves.push({ row: enemyGeneralPos.row, col: enemyGeneralPos.col });
                }
            }
        }

        return moves;
    }

    findGeneralPosition(isRed) {
        const general = isRed ? 'K' : 'k';
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] === general) {
                    return { row: r, col: c };
                }
            }
        }
        return null;
    }

    getAdvisorMoves(row, col, isRed) {
        const moves = [];
        const palace = isRed ? [0, 1, 2] : [7, 8, 9];
        
        if (!palace.includes(row)) return moves;
        
        const directions = [
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 9) {
                if (palace.includes(newRow) && newCol >= 3 && newCol <= 5) {
                    if (!this.board[newRow][newCol] || this.isEnemyPiece(this.board[newRow][newCol], isRed)) {
                        moves.push({ row: newRow, col: newCol });
                    }
                }
            }
        }
        
        return moves;
    }

    getElephantMoves(row, col, isRed) {
        const moves = [];
        const maxRow = isRed ? 4 : 9;
        const minRow = isRed ? 0 : 5;
        
        const directions = [
            [-2, -2, -1, -1], [-2, 2, -1, 1], [2, -2, 1, -1], [2, 2, 1, 1]
        ];
        
        for (const [dr, dc, br, bc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            const blockRow = row + br;
            const blockCol = col + bc;
            
            if (newRow >= minRow && newRow <= maxRow && newCol >= 0 && newCol < 9) {
                if (!this.board[blockRow][blockCol]) {
                    if (!this.board[newRow][newCol] || this.isEnemyPiece(this.board[newRow][newCol], isRed)) {
                        moves.push({ row: newRow, col: newCol });
                    }
                }
            }
        }
        
        return moves;
    }

    getHorseMoves(row, col) {
        const moves = [];
        const directions = [
            [-2, -1, -1, 0], [-2, 1, -1, 0],
            [2, -1, 1, 0], [2, 1, 1, 0],
            [-1, -2, 0, -1], [-1, 2, 0, 1],
            [1, -2, 0, -1], [1, 2, 0, 1]
        ];
        
        for (const [dr, dc, br, bc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            const blockRow = row + br;
            const blockCol = col + bc;
            
            if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 9) {
                if (!this.board[blockRow][blockCol]) {
                    if (!this.board[newRow][newCol] || this.isEnemyPiece(this.board[newRow][newCol], this.board[row][col] === this.board[row][col].toUpperCase())) {
                        moves.push({ row: newRow, col: newCol });
                    }
                }
            }
        }
        
        return moves;
    }

    getChariotMoves(row, col) {
        const moves = [];
        const isRed = this.board[row][col] === this.board[row][col].toUpperCase();
        
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dr, dc] of directions) {
            let newRow = row + dr;
            let newCol = col + dc;
            
            while (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 9) {
                if (!this.board[newRow][newCol]) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (this.isEnemyPiece(this.board[newRow][newCol], isRed)) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                newRow += dr;
                newCol += dc;
            }
        }
        
        return moves;
    }

    getCannonMoves(row, col) {
        const moves = [];
        const isRed = this.board[row][col] === this.board[row][col].toUpperCase();
        
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dr, dc] of directions) {
            let newRow = row + dr;
            let newCol = col + dc;
            let foundScreen = false;
            
            while (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 9) {
                if (!foundScreen) {
                    if (this.board[newRow][newCol]) {
                        foundScreen = true;
                    }
                } else {
                    if (this.board[newRow][newCol]) {
                        if (this.isEnemyPiece(this.board[newRow][newCol], isRed)) {
                            moves.push({ row: newRow, col: newCol });
                        }
                        break;
                    }
                }
                newRow += dr;
                newCol += dc;
            }
        }
        
        return moves;
    }

    getSoldierMoves(row, col, isRed) {
        const moves = [];
        
        if (isRed) {
            const forward = row - 1;
            if (forward >= 0) {
                if (!this.board[forward][col] || this.isEnemyPiece(this.board[forward][col], true)) {
                    moves.push({ row: forward, col });
                }
            }
            
            if (row < 5) {
                const leftCol = col - 1;
                const rightCol = col + 1;
                
                if (leftCol >= 0 && this.isEnemyPiece(this.board[row][leftCol], true)) {
                    moves.push({ row, col: leftCol });
                }
                if (rightCol < 9 && this.isEnemyPiece(this.board[row][rightCol], true)) {
                    moves.push({ row, col: rightCol });
                }
            }
        } else {
            const forward = row + 1;
            if (forward < 10) {
                if (!this.board[forward][col] || this.isEnemyPiece(this.board[forward][col], false)) {
                    moves.push({ row: forward, col });
                }
            }
            
            if (row > 4) {
                const leftCol = col - 1;
                const rightCol = col + 1;
                
                if (leftCol >= 0 && this.isEnemyPiece(this.board[row][leftCol], false)) {
                    moves.push({ row, col: leftCol });
                }
                if (rightCol < 9 && this.isEnemyPiece(this.board[row][rightCol], false)) {
                    moves.push({ row, col: rightCol });
                }
            }
        }
        
        return moves;
    }

    isEnemyPiece(piece, isRedPlayer) {
        if (!piece) return false;
        const isRedPiece = piece === piece.toUpperCase();
        return isRedPiece !== isRedPlayer;
    }

    isInCheck(color) {
        const generalPos = this.findGeneralPosition(color === 'red');
        if (!generalPos) return false;

        const enemyColor = color === 'red' ? 'black' : 'red';
        
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = this.board[r][c];
                if (piece && this.isEnemyPiece(piece, color === 'red')) {
                    const moves = this.getRawMoves(r, c);
                    if (moves.some(m => m.row === generalPos.row && m.col === generalPos.col)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    getRawMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];

        const pieceType = piece.toUpperCase();
        const isRed = piece === piece.toUpperCase();

        switch (pieceType) {
            case 'K': return this.getGeneralMoves(row, col, isRed);
            case 'A': return this.getAdvisorMoves(row, col, isRed);
            case 'E': return this.getElephantMoves(row, col, isRed);
            case 'H': return this.getHorseMoves(row, col);
            case 'R': return this.getChariotMoves(row, col);
            case 'C': return this.getCannonMoves(row, col);
            case 'P': return this.getSoldierMoves(row, col, isRed);
        }
        
        return [];
    }

    wouldBeInCheck(fromRow, fromCol, toRow, toCol, color) {
        const originalPiece = this.board[toRow][toCol];
        const movingPiece = this.board[fromRow][fromCol];
        
        this.board[toRow][toCol] = movingPiece;
        this.board[fromRow][fromCol] = '';
        
        const inCheck = this.isInCheck(color);
        
        this.board[fromRow][fromCol] = movingPiece;
        this.board[toRow][toCol] = originalPiece;
        
        return inCheck;
    }

    executeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const captured = this.board[toRow][toCol];
        const isCapture = !!captured;
        
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = '';

        if (this.isInCheck(this.currentTurn)) {
            this.board[fromRow][fromCol] = piece;
            this.board[toRow][toCol] = captured;
            this.showStatus(this.t('illegalMove'));
            return;
        }

        this.lastMove = { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
        
        this.addMoveToHistory({
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece,
            captured
        });

        this.renderBoard();
        this.highlightLastMove();
        this.playSound(isCapture ? 'capture' : 'move');
        
        this.saveGameState();

        const gameOverResult = this.checkGameOver();
        
        if (gameOverResult) {
            return;
        }

        this.clearSelection();
        this.currentTurn = this.currentTurn === 'red' ? 'black' : 'red';
        
        this.updateUI();
        
        if (this.gameStarted && this.currentTurn !== this.playerColor) {
            this.makeAIMove();
        }
    }

    addMoveToHistory(move) {
        const moveNumber = Math.ceil((this.moveHistory.length + 1) / 2);
        const isRedMove = this.moveHistory.length % 2 === 0;
        
        this.moveHistory.push({
            number: moveNumber,
            color: isRedMove ? 'red' : 'black',
            from: move.from,
            to: move.to,
            piece: move.piece,
            captured: move.captured
        });
    }

    renderBoard() {
        this.createBoard();
    }

    highlightLastMove() {
        if (this.lastMove) {
            const fromCell = document.querySelector(`.xq-cell[data-row="${this.lastMove.from.row}"][data-col="${this.lastMove.from.col}"]`);
            const toCell = document.querySelector(`.xq-cell[data-row="${this.lastMove.to.row}"][data-col="${this.lastMove.to.col}"]`);
            
            if (fromCell) fromCell.classList.add('last-move');
            if (toCell) toCell.classList.add('last-move');
        }
    }

    checkGameOver() {
        const hasLegalMoves = this.hasLegalMoves(this.currentTurn);
        
        if (!hasLegalMoves) {
            const winner = this.currentTurn === 'red' ? this.t('blackWins') : this.t('redWins');
            this.showGameOver(winner, this.t('checkmate'));
            return true;
        }
        
        return false;
    }

    hasLegalMoves(color) {
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = this.board[r][c];
                if (piece) {
                    const isRedPiece = piece === piece.toUpperCase();
                    if ((color === 'red' && isRedPiece) || (color === 'black' && !isRedPiece)) {
                        const moves = this.getValidMoves(r, c);
                        if (moves.length > 0) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    makeAIMove() {
        if (!this.gameStarted) return;

        this.isThinking = true;
        const thinkingEl = document.getElementById('thinking');
        if (thinkingEl) thinkingEl.classList.remove('hidden');

        setTimeout(() => {
            this.executeAIMove();
        }, 100);
    }

    executeAIMove() {
        const settings = DIFFICULTY_SETTINGS[this.difficulty];
        
        let bestMove = null;
        
        if (Math.random() < settings.errorRate) {
            bestMove = this.getRandomMove();
        } else {
            bestMove = this.getBestMove(settings.depth);
        }

        if (bestMove) {
            this.executeMove(bestMove.from.row, bestMove.from.col, bestMove.to.row, bestMove.to.col);
        }

        this.isThinking = false;
        const thinkingEl = document.getElementById('thinking');
        if (thinkingEl) thinkingEl.classList.add('hidden');
    }

    getRandomMove() {
        const allMoves = this.getAllValidMoves(this.currentTurn === 'red' ? 'black' : 'red');
        if (allMoves.length === 0) return null;
        return allMoves[Math.floor(Math.random() * allMoves.length)];
    }

    getAllValidMoves(color) {
        const moves = [];
        
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = this.board[r][c];
                if (piece) {
                    const isRedPiece = piece === piece.toUpperCase();
                    if ((color === 'red' && isRedPiece) || (color === 'black' && !isRedPiece)) {
                        const pieceMoves = this.getValidMoves(r, c);
                        pieceMoves.forEach(to => {
                            moves.push({
                                from: { row: r, col: c },
                                to: { row: to.row, col: to.col },
                                piece: piece,
                                captured: this.board[to.row][to.col]
                            });
                        });
                    }
                }
            }
        }
        
        return moves;
    }

    getBestMove(depth) {
        const moves = this.getAllValidMoves(this.currentTurn === 'red' ? 'black' : 'red');
        
        if (moves.length === 0) return null;

        let bestScore = -Infinity;
        let bestMove = moves[0];

        for (const move of moves) {
            const score = this.evaluateMove(move, this.currentTurn, depth);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    evaluateMove(move, color, depth) {
        const piece = this.board[move.from.row][move.from.col];
        const captured = move.captured;
        
        let score = 0;
        
        if (captured) {
            const capturedValue = PIECE_VALUES[captured.toUpperCase()] || 0;
            score += capturedValue * 10;
        }

        score += this.evaluatePosition(move.to.row, move.to.col, piece);

        if (depth > 1) {
            const originalPiece = this.board[move.to.row][move.to.col];
            const movingPiece = this.board[move.from.row][move.from.col];
            
            this.board[move.to.row][move.to.col] = movingPiece;
            this.board[move.from.row][move.from.col] = '';

            const enemyColor = color === 'red' ? 'black' : 'red';
            const enemyMoves = this.getAllValidMoves(enemyColor);
            
            let minEnemyScore = 0;
            for (const enemyMove of enemyMoves) {
                const enemyCaptured = enemyMove.captured;
                if (enemyCaptured) {
                    const capturedValue = PIECE_VALUES[enemyCaptured.toUpperCase()] || 0;
                    minEnemyScore = Math.min(minEnemyScore, -capturedValue * 10);
                }
            }
            score += minEnemyScore * 0.5;

            this.board[move.from.row][move.from.col] = movingPiece;
            this.board[move.to.row][move.to.col] = originalPiece;
        }

        return score;
    }

    evaluatePosition(row, col, piece) {
        const pieceType = piece.toUpperCase();
        
        const positionBonus = POSITION_BONUS[pieceType] || [];
        const isRed = piece === piece.toUpperCase();
        
        if (positionBonus.length > 0) {
            const bonusRow = isRed ? row : 9 - row;
            if (positionBonus[bonusRow] && positionBonus[bonusRow][col]) {
                return positionBonus[bonusRow][col];
            }
        }
        
        return 0;
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;

        this.isThinking = false;
        const thinkingEl = document.getElementById('thinking');
        if (thinkingEl) thinkingEl.classList.add('hidden');

        const movesToUndo = Math.min(2, this.moveHistory.length);
        
        for (let i = 0; i < movesToUndo; i++) {
            const lastMove = this.moveHistory.pop();
            
            this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
            this.board[lastMove.to.row][lastMove.to.col] = lastMove.captured || '';
        }

        this.lastMove = null;
        this.clearSelection();
        
        this.currentTurn = this.moveHistory.length % 2 === 0 ? 'red' : 'black';
        
        this.renderBoard();
        this.updateUI();
        this.saveGameState();
    }

    resign() {
        if (this.gameOver) return;
        
        this.gameOver = true;
        const winner = this.playerColor === 'red' ? this.t('blackWins') : this.t('redWins');
        this.showGameOver(winner, this.t('youResigned'));
    }

    showGameOver(title, message) {
        this.gameOver = true;
        
        const titleEl = document.getElementById('gameOverTitle');
        const messageEl = document.getElementById('gameOverMessage');
        const modalEl = document.getElementById('gameOverModal');
        
        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;
        if (modalEl) modalEl.classList.remove('hidden');
    }

    updateUI() {
        const historyEl = document.getElementById('moveHistory');
        historyEl.innerHTML = '';
        
        let lastRedMove = null;
        
        for (let i = 0; i < this.moveHistory.length; i++) {
            const move = this.moveHistory[i];
            
            if (move.color === 'red') {
                lastRedMove = move;
            } else {
                const row = document.createElement('div');
                row.className = 'move-item';
                
                const fromName = this.getPositionName(move.from.row, move.from.col);
                const toName = this.getPositionName(move.to.row, move.to.col);
                const pieceName = PIECE_NAMES[move.piece.toUpperCase()]?.[currentLang] || move.piece;
                
                row.innerHTML = `
                    <span class="move-number">${move.number}.</span>
                    <span class="move-white">${pieceName}${fromName}-${toName}</span>
                    <span class="move-black"></span>
                `;
                historyEl.appendChild(row);
            }
        }
        
        if (this.moveHistory.length > 0 && this.moveHistory[this.moveHistory.length - 1].color === 'red') {
            const row = document.createElement('div');
            row.className = 'move-item';
            
            const move = this.moveHistory[this.moveHistory.length - 1];
            const fromName = this.getPositionName(move.from.row, move.from.col);
            const toName = this.getPositionName(move.to.row, move.to.col);
            const pieceName = PIECE_NAMES[move.piece.toUpperCase()]?.[currentLang] || move.piece;
            
            row.innerHTML = `
                <span class="move-number">${move.number}.</span>
                <span class="move-white">${pieceName}${fromName}-${toName}</span>
                <span class="move-black"></span>
            `;
            historyEl.appendChild(row);
        }

        const turnIndicator = document.getElementById('turnIndicator');
        if (turnIndicator) {
            turnIndicator.textContent = this.currentTurn === 'red' ? this.t('red') : this.t('black');
            turnIndicator.style.color = this.currentTurn === 'red' ? '#FF6B6B' : '#333';
            turnIndicator.style.background = this.currentTurn === 'red' ? '#FFE4E4' : '#CCC';
            turnIndicator.style.padding = '2px 8px';
            turnIndicator.style.borderRadius = '3px';
        }

        const fullMoves = Math.ceil(this.moveHistory.length / 2);
        const moveCountEl = document.getElementById('moveCount');
        if (moveCountEl) moveCountEl.textContent = fullMoves;

        if (!this.gameOver) {
            const isPlayerTurn = this.currentTurn === this.playerColor;
            this.showStatus(isPlayerTurn ? this.t('yourTurn') : this.t('aiThinking'));
        }
    }

    getPositionName(row, col) {
        const cols = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
        return cols[col];
    }

    showStatus(message) {
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.textContent = message;
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.classList.remove('hidden');
            
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 1500);
        }
    }

    saveGameState() {
        const state = {
            board: this.board,
            currentTurn: this.currentTurn,
            moveHistory: this.moveHistory,
            playerColor: this.playerColor,
            difficulty: this.difficulty,
            gameStarted: this.gameStarted
        };
        localStorage.setItem('xiangqiGameState', JSON.stringify(state));
    }

    loadGameState() {
        const saved = localStorage.getItem('xiangqiGameState');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state.board) {
                    this.board = state.board;
                    this.currentTurn = state.currentTurn || 'red';
                    this.moveHistory = state.moveHistory || [];
                    this.playerColor = state.playerColor || 'red';
                    this.difficulty = state.difficulty || 3;
                    this.gameStarted = state.gameStarted !== false;
                    
                    this.renderBoard();
                    this.highlightLastMove();
                    this.updateUI();
                }
            } catch (e) {
                console.error('Failed to load game state:', e);
            }
        }
    }

    newGame() {
        const playerColorSelect = document.getElementById('playerColor');
        if (playerColorSelect) {
            this.playerColor = playerColorSelect.value;
            localStorage.setItem('playerColor', this.playerColor);
        }

        this.resetBoard();
        this.currentTurn = 'red';
        this.moveHistory = [];
        this.lastMove = null;
        this.gameOver = false;
        this.isThinking = false;
        this.clearSelection();
        
        this.gameStarted = true;
        
        this.renderBoard();
        this.updateUI();
        this.saveGameState();

        if (this.playerColor === 'black') {
            this.makeAIMove();
        }
    }

    resetGame() {
        this.newGame();
    }
}

const POSITION_BONUS = {
    'K': [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    'R': [
        [20, 0, 0, 0, 0, 0, 0, 0, 20],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [20, 0, 0, 0, 0, 0, 0, 0, 20]
    ],
    'H': [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    'C': [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    'P': [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [2, 4, 6, 8, 10, 8, 6, 4, 2],
        [4, 8, 12, 16, 20, 16, 12, 8, 4],
        [6, 12, 18, 24, 30, 24, 18, 12, 6],
        [8, 16, 24, 32, 40, 32, 24, 16, 8],
        [10, 20, 30, 40, 50, 40, 30, 20, 10],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]
};
