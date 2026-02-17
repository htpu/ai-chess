const DIFFICULTY_SETTINGS = {
    1: { depth: 1, time: 50, errorRate: 0.3 },
    2: { depth: 2, time: 100, errorRate: 0.2 },
    3: { depth: 2, time: 200, errorRate: 0.1 },
    4: { depth: 3, time: 300, errorRate: 0.05 },
    5: { depth: 3, time: 500, errorRate: 0 }
};

let soundEnabled = true;

class ChessGame {
    constructor() {
        this.game = new Chess();
        this.board = null;
        this.stockfish = null;
        this.stockfishReady = false;
        this.playerColor = 'white';
        this.gameOver = false;
        this.moveHistory = [];
        this.isThinking = false;
        this.pendingAIMove = false;
        this.selectedSquare = null;
        this.validMoves = [];
        this.lastMove = null;
        this.pendingPromotion = null;

        this.sounds = {};
        this.loadSounds();

        this.init();
    }

    loadSounds() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        this.playSound = (type) => {
            const se = document.getElementById('soundToggle');
            if (!se || !se.checked) return;
            
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            const freq = type === 'move' ? 440 : type === 'capture' ? 330 : 520;
            const duration = type === 'move' ? 0.1 : 0.15;
            
            osc.frequency.value = freq;
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0.3, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + duration);
        };
    }

    t(key) {
        return window.t ? window.t(key) : key;
    }

    updateUITexts() {
        // Handled by game-loader.js
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 1500);
    }

    init() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            currentLang = localStorage.getItem('language') || 'zh';
        } catch (e) {
            currentLang = 'zh';
        }
        
        const soundToggle = document.getElementById('soundToggle');
        soundEnabled = soundToggle ? soundToggle.checked : true;
        
        let hasSavedGame = false;
        try {
            const savedGameState = localStorage.getItem('chessGameState');
            if (savedGameState) {
                const state = JSON.parse(savedGameState);
                hasSavedGame = state.fen && state.fen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            }
        } catch (e) {
            hasSavedGame = false;
        }
        
        this.initStockfish();
        this.initBoard(hasSavedGame);
        this.bindEvents();
        
        if (hasSavedGame) {
            this.loadGameState();
        } else {
            this.updateUI();
        }
    }

    initStockfish() {
        const stockfishUrl = 'https://cdn.jsdelivr.net/npm/stockfish.js@10.0.0/stockfish.js';
        
        fetch(stockfishUrl)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(code => {
                const blob = new Blob([code], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                this.stockfish = new Worker(url);
                this.stockfishReady = true;
                
                this.stockfish.onmessage = (event) => {
                    const data = event.data;
                    if (data.startsWith('bestmove')) {
                        const bestMove = data.split(' ')[1];
                        this.handleAIMove(bestMove);
                    }
                };
                
                if (this.pendingAIMove) {
                    this.pendingAIMove = false;
                    this.makeAIMove();
                }
            })
            .catch(err => {
                console.error('Failed to load Stockfish:', err);
                this.showToast(this.t('aiLoadFailed') || 'AI加载失败');
            });
    }

    initBoard(hasSavedGame = false) {
        const config = {
            draggable: false,
            position: 'start',
            showNotation: true,
            onDragStart: this.onDragStart.bind(this),
            onDrop: this.onDrop.bind(this),
            onSnapEnd: this.onSnapEnd.bind(this),
            pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
        };

        this.board = Chessboard('board', config);
        
        const savedColor = localStorage.getItem('playerColor');
        if (savedColor) {
            this.playerColor = savedColor;
        }
        
        const currentOrientation = this.board.orientation();
        if (currentOrientation !== this.playerColor) {
            this.board.flip();
        }
    }

    bindEvents() {
        const difficultyEl = document.getElementById('difficulty');
        if (difficultyEl) {
            difficultyEl.addEventListener('change', () => {
                this.showStatus(`${this.t('difficultyChanged')} ${document.getElementById('difficulty').value} ${this.t('level')}`);
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

        const soundToggleEl = document.getElementById('soundToggle');
        if (soundToggleEl) {
            soundToggleEl.addEventListener('change', (e) => {
                soundEnabled = e.target.checked;
                localStorage.setItem('soundEnabled', soundEnabled);
                if (soundEnabled) {
                    this.playSound('move');
                }
            });
        }

        const flipBoardEl = document.getElementById('flipBoard');
        if (flipBoardEl) {
            flipBoardEl.addEventListener('click', () => {
                this.board.flip();
                this.playerColor = this.board.orientation();
                document.getElementById('playerColor').value = this.playerColor;
                localStorage.setItem('playerColor', this.playerColor);
            });
        }

        const undoMoveEl = document.getElementById('undoMove');
        if (undoMoveEl) {
            undoMoveEl.addEventListener('click', () => {
                this.undoMove();
            });
        }

        const resignEl = document.getElementById('resign');
        if (resignEl) {
            resignEl.addEventListener('click', () => {
                this.resign();
            });
        }

        const newGameEl = document.getElementById('newGame');
        if (newGameEl) {
            newGameEl.addEventListener('click', () => {
                this.resetGame();
            });
        }

        const playAgainEl = document.getElementById('playAgain');
        if (playAgainEl) {
            playAgainEl.addEventListener('click', () => {
                document.getElementById('gameOverModal').classList.add('hidden');
                this.resetGame();
            });
        }

        const boardEl = document.getElementById('board');
        if (boardEl) {
            boardEl.addEventListener('mousedown', (e) => {
                this.handleBoardClick(e);
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'z' || e.key === 'Z') {
                this.undoMove();
            } else if (e.key === 'n' || e.key === 'N') {
                this.resetGame();
            } else if (e.key === 'f' || e.key === 'F') {
                this.board.flip();
            }
        });
    }

    handleBoardClick(e) {
        if (this.gameOver || this.isThinking) return;

        const square = e.target.closest('[data-square]');
        
        if (!square) {
            if (this.selectedSquare) {
                this.clearSelection();
            }
            return;
        }

        const squareId = square.dataset.square;
        if (!squareId) return;

        const currentTurn = this.game.turn();
        const isPlayerTurn = (currentTurn === 'w' && this.playerColor === 'white') ||
                            (currentTurn === 'b' && this.playerColor === 'black');
        if (!isPlayerTurn) return;

        const piece = this.game.get(squareId);
        
        if (this.selectedSquare) {
            if (this.validMoves.includes(squareId)) {
                const isPromotion = this.game.moves({ 
                    square: this.selectedSquare, 
                    verbose: true 
                }).some(m => m.to === squareId && m.flags.includes('p'));
                
                if (isPromotion) {
                    this.pendingPromotion = { from: this.selectedSquare, to: squareId };
                    this.showPromotionDialog(squareId);
                    return;
                }
                
                this.executeMove(this.selectedSquare, squareId);
                return;
            } else if (piece && piece.color === (this.playerColor === 'white' ? 'w' : 'b')) {
                this.selectSquare(squareId);
                return;
            } else {
                this.clearSelection();
                return;
            }
        }

        if (piece && piece.color === (this.playerColor === 'white' ? 'w' : 'b')) {
            this.selectSquare(squareId);
        } else {
            this.clearSelection();
        }
    }

    showPromotionDialog(targetSquare) {
        const modal = document.getElementById('promotionModal');
        modal.classList.remove('hidden');
        
        const pieces = ['q', 'r', 'b', 'n'];
        const container = document.getElementById('promotionOptions');
        container.innerHTML = '';
        
        pieces.forEach(piece => {
            const btn = document.createElement('button');
            btn.className = 'promotion-btn';
            const color = this.playerColor === 'white' ? 'w' : 'b';
            btn.innerHTML = `<img src="https://chessboardjs.com/img/chesspieces/wikipedia/${piece === 'q' ? (color === 'w' ? 'wQ' : 'bQ') : piece === 'r' ? (color === 'w' ? 'wR' : 'bR') : piece === 'b' ? (color === 'w' ? 'wB' : 'bB') : (color === 'w' ? 'wN' : 'bN')}.png" alt="${piece}">`;
            btn.onclick = () => {
                this.executeMove(this.pendingPromotion.from, this.pendingPromotion.to, piece);
                modal.classList.add('hidden');
            };
            container.appendChild(btn);
        });
    }

    executeMove(from, to, promotion = 'q') {
        const captured = this.game.get(to) !== null;
        
        const move = this.game.move({
            from: from,
            to: to,
            promotion: promotion
        });

        if (move) {
            const isPromotion = move.flags.includes('p');
            const isCastling = !isPromotion && (move.flags.includes('k') || move.flags.includes('q'));
            
            if (isPromotion) {
                const pieceName = this.t(promotion);
                this.showToast(this.t('promotedTo') + ' ' + pieceName);
            } else if (isCastling) {
                this.showToast(this.t('castled'));
            }
            
            this.lastMove = { from, to, isCastling };
            this.addMoveToHistory(move);
            this.board.position(this.game.fen());
            this.highlightLastMove();
            this.playSound(captured ? 'capture' : 'move');
            this.updateUI();
            this.saveGameState();

            if (this.game.game_over()) {
                this.handleGameOver();
                return;
            }

            this.clearSelection();
            this.makeAIMove();
        } else {
            this.showStatus(this.t('illegalMove'));
            this.playSound('illegal');
            setTimeout(() => {
                const isPlayerTurn = (this.game.turn() === 'w' && this.playerColor === 'white') ||
                                   (this.game.turn() === 'b' && this.playerColor === 'black');
                this.showStatus(isPlayerTurn ? this.t('yourTurn') : this.t('aiThinking'));
            }, 1500);
        }
    }

    selectSquare(squareId) {
        this.clearHighlights();
        this.selectedSquare = squareId;
        
        const squareEl = document.querySelector(`[data-square="${squareId}"]`);
        if (squareEl) {
            squareEl.classList.add('selected');
        }

        const moves = this.game.moves({
            square: squareId,
            verbose: true
        });
        this.validMoves = moves.map(m => m.to);

        this.validMoves.forEach(move => {
            const moveSquare = document.querySelector(`[data-square="${move}"]`);
            if (moveSquare) {
                const moveObj = moves.find(m => m.to === move);
                const isCastling = moveObj && (moveObj.flags.includes('k') || moveObj.flags.includes('q'));
                if (isCastling) {
                    moveSquare.classList.add('valid-move');
                    moveSquare.classList.add('castling');
                } else {
                    moveSquare.classList.add('valid-move');
                }
            }
        });
    }

    clearSelection() {
        this.clearHighlights();
        this.selectedSquare = null;
        this.validMoves = [];
    }

    clearHighlights() {
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.valid-move').forEach(el => el.classList.remove('valid-move'));
        document.querySelectorAll('.last-move').forEach(el => el.classList.remove('last-move'));
    }

    highlightLastMove() {
        if (this.lastMove) {
            const fromEl = document.querySelector(`[data-square="${this.lastMove.from}"]`);
            const toEl = document.querySelector(`[data-square="${this.lastMove.to}"]`);
            if (fromEl) fromEl.classList.add('last-move');
            if (toEl) toEl.classList.add('last-move');

            if (this.lastMove.isCastling) {
                const color = this.lastMove.from[1] === '1' ? 'w' : 'b';
                let rookFrom, rookTo;
                if (this.lastMove.to === 'g1' || this.lastMove.to === 'g8') {
                    rookFrom = color === 'w' ? 'h1' : 'h8';
                    rookTo = color === 'w' ? 'f1' : 'f8';
                } else {
                    rookFrom = color === 'w' ? 'a1' : 'a8';
                    rookTo = color === 'w' ? 'd1' : 'd8';
                }
                const rookFromEl = document.querySelector(`[data-square="${rookFrom}"]`);
                const rookToEl = document.querySelector(`[data-square="${rookTo}"]`);
                if (rookFromEl) rookFromEl.classList.add('last-move');
                if (rookToEl) rookToEl.classList.add('last-move');
            }
        }
    }

    onDragStart(source, piece, position, orientation) {
        if (this.gameOver || this.isThinking) return false;
        
        const currentTurn = this.game.turn();
        const isPlayerTurn = (currentTurn === 'w' && this.playerColor === 'white') ||
                            (currentTurn === 'b' && this.playerColor === 'black');
        
        if (!isPlayerTurn) return false;
        
        const pieceColor = piece.startsWith('w') ? 'white' : 'black';
        return pieceColor === this.playerColor;
    }

    onDrop(source, target) {
        const move = this.game.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        if (move === null) return 'snapback';

        const isCastling = move.flags.includes('k') || move.flags.includes('q');
        const isPromotion = move.flags.includes('p');
        
        if (isCastling) {
            this.showToast(this.t('castled'));
        } else if (isPromotion) {
            const pieceName = this.t('q');
            this.showToast(this.t('promotedTo') + ' ' + pieceName);
        }
        
        this.lastMove = { from: source, to: target, isCastling };
        this.addMoveToHistory(move);
        this.board.position(this.game.fen());
        this.highlightLastMove();

        if (this.game.game_over()) {
            this.handleGameOver();
            return;
        }

        this.makeAIMove();
    }

    onSnapEnd() {
        this.board.position(this.game.fen());
    }

    makeAIMove() {
        if (!this.stockfish || !this.stockfishReady) {
            console.log('Stockfish not ready, using random move');
            const moves = this.game.moves();
            if (moves.length > 0) {
                const randomMove = moves[Math.floor(Math.random() * moves.length)];
                this.game.move(randomMove);
                this.addMoveToHistory(this.game.move(randomMove));
                this.board.position(this.game.fen());
                this.updateUI();
            }
            return;
        }
        
        this.isThinking = true;
        document.getElementById('thinking').classList.remove('hidden');
        
        const difficulty = parseInt(document.getElementById('difficulty').value);
        const settings = DIFFICULTY_SETTINGS[difficulty];

        this.stockfish.postMessage(`position fen ${this.game.fen()}`);
        
        let cmd = `go depth ${settings.depth}`;
        if (settings.time > 0) {
            cmd = `go movetime ${settings.time}`;
        }
        
        this.stockfish.postMessage(cmd);

        if (Math.random() < settings.errorRate) {
            setTimeout(() => {
                this.makeRandomMistake();
            }, settings.time * 0.8);
        }
    }

    makeRandomMistake() {
        if (!this.isThinking) return;
        
        const moves = this.game.moves();
        if (moves.length === 0) return;

        const randomIndex = Math.floor(Math.random() * moves.length);
        const mistakeMove = moves[randomIndex];
        
        this.stockfish.terminate();
        this.initStockfish();
        
        const move = this.game.move(mistakeMove);
        if (move) {
            const isPromotion = move.flags.includes('p');
            const isCastling = !isPromotion && (move.flags.includes('k') || move.flags.includes('q'));
            
            if (isCastling) {
                this.showToast(this.t('castled'));
            } else if (isPromotion) {
                const pieceName = this.t('q');
                this.showToast(this.t('promotedTo') + ' ' + pieceName);
            }
            
            this.lastMove = { from: move.from, to: move.to, isCastling };
            this.addMoveToHistory(move);
            this.board.position(this.game.fen());
            this.highlightLastMove();
        }
        this.updateUI();
        
        this.isThinking = false;
        document.getElementById('thinking').classList.add('hidden');

        if (this.game.game_over()) {
            this.handleGameOver();
            return;
        }
    }

    handleAIMove(bestMove) {
        if (!this.isThinking) return;
        
        const from = bestMove.substring(0, 2);
        const to = bestMove.substring(2, 4);
        const promotion = bestMove.length > 4 ? bestMove[4] : 'q';
        
        const captured = this.game.get(to) !== null;
        
        const move = this.game.move({
            from: from,
            to: to,
            promotion: promotion
        });

        if (move) {
            const isPromotion = move.flags.includes('p');
            const isCastling = !isPromotion && (move.flags.includes('k') || move.flags.includes('q'));
            
            if (isPromotion) {
                const pieceName = this.t(promotion);
                this.showToast(this.t('promotedTo') + ' ' + pieceName);
            } else if (isCastling) {
                this.showToast(this.t('castled'));
            }
            
            this.lastMove = { from, to, isCastling };
            this.addMoveToHistory(move);
            this.board.position(this.game.fen());
            this.highlightLastMove();
            this.playSound(captured ? 'capture' : 'move');
        }

        this.isThinking = false;
        document.getElementById('thinking').classList.add('hidden');
        
        this.updateUI();
        this.saveGameState();

        if (this.game.game_over()) {
            this.handleGameOver();
        }
    }

    addMoveToHistory(move) {
        const moveNumber = Math.ceil((this.moveHistory.length + 1) / 2);
        const isWhite = this.moveHistory.length % 2 === 0;
        
        this.moveHistory.push({
            number: moveNumber,
            color: isWhite ? 'white' : 'black',
            san: move.san
        });
    }

    updateUI() {
        const historyEl = document.getElementById('moveHistory');
        historyEl.innerHTML = '';
        
        let lastWhiteMove = null;
        
        for (let i = 0; i < this.moveHistory.length; i++) {
            const move = this.moveHistory[i];
            
            if (move.color === 'white') {
                lastWhiteMove = move;
            } else {
                const row = document.createElement('div');
                row.className = 'move-item';
                row.innerHTML = `
                    <span class="move-number">${move.number}.</span>
                    <span class="move-white">${lastWhiteMove ? lastWhiteMove.san : ''}</span>
                    <span class="move-black">${move.san}</span>
                `;
                historyEl.appendChild(row);
            }
        }
        
        if (this.moveHistory.length > 0 && this.moveHistory[this.moveHistory.length - 1].color === 'white') {
            const row = document.createElement('div');
            row.className = 'move-item';
            row.innerHTML = `
                <span class="move-number">${this.moveHistory[this.moveHistory.length - 1].number}.</span>
                <span class="move-white">${this.moveHistory[this.moveHistory.length - 1].san}</span>
                <span class="move-black"></span>
            `;
            historyEl.appendChild(row);
        }

        const turnIndicator = document.getElementById('turnIndicator');
        const currentTurn = this.game.turn();
        turnIndicator.textContent = currentTurn === 'w' ? this.t('white') : this.t('black');
        turnIndicator.style.color = currentTurn === 'w' ? '#fff' : '#000';
        turnIndicator.style.background = currentTurn === 'w' ? '#8b4513' : '#f5deb3';
        turnIndicator.style.padding = '2px 8px';
        turnIndicator.style.borderRadius = '3px';

        const fullMoves = Math.ceil(this.game.history().length / 2);
        document.getElementById('moveCount').textContent = fullMoves;

        if (this.game.in_check()) {
            this.showStatus(this.t('check'));
            this.playSound('check');
        } else if (!this.gameOver) {
            const isPlayerTurn = (currentTurn === 'w' && this.playerColor === 'white') ||
                               (currentTurn === 'b' && this.playerColor === 'black');
            this.showStatus(isPlayerTurn ? this.t('yourTurn') : this.t('aiThinking'));
        }
    }

    showStatus(message) {
        document.getElementById('status').textContent = message;
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;
        
        this.isThinking = false;
        this.clearSelection();
        document.getElementById('thinking').classList.add('hidden');
        
        if (this.stockfish) {
            this.stockfish.terminate();
        }
        this.stockfishReady = false;
        this.initStockfish();

        const movesToUndo = Math.min(2, this.moveHistory.length);
        for (let i = 0; i < movesToUndo; i++) {
            this.game.undo();
        }
        
        this.moveHistory = this.moveHistory.slice(0, -movesToUndo);
        
        this.lastMove = null;
        this.clearHighlights();
        
        this.board.position(this.game.fen());
        this.updateUI();
        this.saveGameState();
    }

    resign() {
        if (this.gameOver) return;
        
        this.gameOver = true;
        const winner = this.playerColor === 'white' ? this.t('blackWins') : this.t('whiteWins');
        this.showGameOver(winner, this.t('youResigned'));
    }

    handleGameOver() {
        this.gameOver = true;
        
        let title, message;
        
        if (this.game.isCheckmate()) {
            const winner = this.game.turn() === 'white' ? this.t('blackWins') : this.t('whiteWins');
            title = winner;
            message = this.t('checkmate');
            this.playSound('check');
        } else if (this.game.isDraw()) {
            title = this.t('draw');
            if (this.game.isStalemate()) {
                message = this.t('stalemate');
            } else if (this.game.isThreefoldRepetition()) {
                message = this.t('threefoldRep');
            } else if (this.game.isInsufficientMaterial()) {
                message = this.t('insufficientMaterial');
            } else {
                message = this.t('fiftyMoveRule');
            }
        } else if (this.game.isGameOver()) {
            const winner = this.game.turn() === 'white' ? this.t('blackWins') : this.t('whiteWins');
            title = winner;
            message = this.t('gameOver');
        }
        
        this.showGameOver(title, message);
    }

    showGameOver(title, message) {
        document.getElementById('gameOverTitle').textContent = title;
        document.getElementById('gameOverMessage').textContent = message;
        document.getElementById('gameOverModal').classList.remove('hidden');
    }

    saveGameState() {
        const state = {
            fen: this.game.fen(),
            moveHistory: this.moveHistory,
            playerColor: this.playerColor,
            difficulty: document.getElementById('difficulty').value
        };
        localStorage.setItem('chessGameState', JSON.stringify(state));
    }

    loadGameState() {
        const saved = localStorage.getItem('chessGameState');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state.fen && state.fen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
                    this.game.load(state.fen);
                    this.board.position(this.game.fen());
                    this.moveHistory = state.moveHistory || [];
                    
                    if (this.moveHistory.length > 0) {
                        const lastMoveEntry = this.moveHistory[this.moveHistory.length - 1];
                        const san = lastMoveEntry.san;
                        
                        if (san.includes('O-O-O')) {
                            this.lastMove = lastMoveEntry.color === 'white' ? 
                                { from: 'e1', to: 'c1', isCastling: true } : { from: 'e8', to: 'c8', isCastling: true };
                        } else if (san.includes('O-O')) {
                            this.lastMove = lastMoveEntry.color === 'white' ? 
                                { from: 'e1', to: 'g1', isCastling: true } : { from: 'e8', to: 'g8', isCastling: true };
                        } else if (san.length >= 4) {
                            this.lastMove = {
                                from: san.substring(0, 2),
                                to: san.substring(2, 4),
                                isCastling: false
                            };
                        }
                        this.highlightLastMove();
                    }
                    
                    this.updateUI();
                }
            } catch (e) {
                console.error('Failed to load game state:', e);
            }
        }
    }

    resetGame() {
        this.game.reset();
        this.board.position('start');
        
        this.clearSelection();
        this.lastMove = null;
        
        const currentOrientation = this.board.orientation();
        const targetOrientation = this.playerColor;
        if (currentOrientation !== targetOrientation) {
            this.board.flip();
        }
        
        this.moveHistory = [];
        this.gameOver = false;
        this.isThinking = false;
        document.getElementById('thinking').classList.add('hidden');
        
        if (this.playerColor === 'black') {
            if (this.stockfishReady) {
                this.makeAIMove();
            } else {
                this.pendingAIMove = true;
            }
        }
        
        this.updateUI();
        this.saveGameState();
    }

    newGame() {
        const playerColorSelect = document.getElementById('playerColor');
        if (playerColorSelect) {
            this.playerColor = playerColorSelect.value;
            localStorage.setItem('playerColor', this.playerColor);
        }
        
        this.resetGame();
    }

    createBoard() {
        // Board is already initialized in constructor/init
        // This method is here for API compatibility with loaders
    }
}
