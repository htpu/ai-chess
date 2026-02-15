const DIFFICULTY_SETTINGS = {
    1: { depth: 1, time: 50, errorRate: 0.3 },
    2: { depth: 2, time: 100, errorRate: 0.2 },
    3: { depth: 2, time: 200, errorRate: 0.1 },
    4: { depth: 3, time: 300, errorRate: 0.05 },
    5: { depth: 3, time: 500, errorRate: 0 }
};

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
        this.pendingAIMove = false; // 待执行的AI走棋

        this.init();
    }

    init() {
        this.initStockfish();
        this.initBoard();
        this.bindEvents();
    }

    initStockfish() {
        const stockfishUrl = 'https://cdn.jsdelivr.net/npm/stockfish.js@10.0.0/stockfish.js';
        
        fetch(stockfishUrl)
            .then(response => response.text())
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
                
                // Stockfish加载完成后，检查是否有待执行的走棋
                if (this.pendingAIMove) {
                    this.pendingAIMove = false;
                    this.makeAIMove();
                }
            })
            .catch(err => {
                console.error('Failed to load Stockfish:', err);
            });
    }

    initBoard() {
        const config = {
            draggable: true,
            position: 'start',
            onDragStart: this.onDragStart.bind(this),
            onDrop: this.onDrop.bind(this),
            onSnapEnd: this.onSnapEnd.bind(this),
            pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
        };

        this.board = Chessboard('board', config);
        
        // 读取保存的玩家颜色
        const savedColor = localStorage.getItem('playerColor');
        if (savedColor) {
            document.getElementById('playerColor').value = savedColor;
            this.playerColor = savedColor;
        }
        
        // 自动调整棋盘方向，使玩家棋子在下方
        const currentOrientation = this.board.orientation();
        if (currentOrientation !== this.playerColor) {
            this.board.flip();
        }
        
        // 如果玩家执黑，AI先手
        if (this.playerColor === 'black') {
            if (this.stockfishReady) {
                this.makeAIMove();
            } else {
                this.pendingAIMove = true;
            }
        }
    }

    bindEvents() {
        document.getElementById('difficulty').addEventListener('change', () => {
            this.showStatus(`难度已切换为 ${document.getElementById('difficulty').value} 级`);
        });

        document.getElementById('playerColor').addEventListener('change', (e) => {
            this.playerColor = e.target.value;
            localStorage.setItem('playerColor', this.playerColor);
            this.resetGame();
        });

        document.getElementById('flipBoard').addEventListener('click', () => {
            this.board.flip();
            // 同步更新玩家颜色
            this.playerColor = this.board.orientation();
            document.getElementById('playerColor').value = this.playerColor;
            localStorage.setItem('playerColor', this.playerColor);
        });

        document.getElementById('undoMove').addEventListener('click', () => {
            this.undoMove();
        });

        document.getElementById('resign').addEventListener('click', () => {
            this.resign();
        });

        document.getElementById('newGame').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('playAgain').addEventListener('click', () => {
            document.getElementById('gameOverModal').classList.add('hidden');
            this.resetGame();
        });
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

        this.addMoveToHistory(move);
        this.updateUI();

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
        
        this.game.move(mistakeMove);
        this.addMoveToHistory(this.game.move(mistakeMove));
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
        
        const move = this.game.move({
            from: bestMove.substring(0, 2),
            to: bestMove.substring(2, 4),
            promotion: bestMove.length > 4 ? bestMove[4] : 'q'
        });

        if (move) {
            this.addMoveToHistory(move);
        }

        this.board.position(this.game.fen());
        
        this.isThinking = false;
        document.getElementById('thinking').classList.add('hidden');
        
        this.updateUI();

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
        turnIndicator.textContent = currentTurn === 'w' ? '白方' : '黑方';
        turnIndicator.style.color = currentTurn === 'w' ? '#fff' : '#000';
        turnIndicator.style.background = currentTurn === 'w' ? '#8b4513' : '#f5deb3';
        turnIndicator.style.padding = '2px 8px';
        turnIndicator.style.borderRadius = '3px';

        // chess.js 0.10.3 doesn't have turn_number(), calculate from history
        const fullMoves = Math.floor(this.game.history().length / 2) + 1;
        document.getElementById('moveCount').textContent = fullMoves;

        if (this.game.in_check()) {
            this.showStatus('将军!');
        } else if (!this.gameOver) {
            const isPlayerTurn = (currentTurn === 'w' && this.playerColor === 'white') ||
                               (currentTurn === 'b' && this.playerColor === 'black');
            this.showStatus(isPlayerTurn ? '轮到你走棋' : 'AI思考中...');
        }
    }

    showStatus(message) {
        document.getElementById('status').textContent = message;
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;
        
        this.isThinking = false;
        document.getElementById('thinking').classList.add('hidden');
        
        if (this.stockfish) {
            this.stockfish.terminate();
        }
        this.stockfishReady = false;
        this.initStockfish();

        this.game.undo();
        this.game.undo();
        
        this.moveHistory = this.moveHistory.slice(0, -Math.ceil(this.moveHistory.length / 2) * 2);
        
        this.board.position(this.game.fen());
        this.updateUI();
    }

    resign() {
        if (this.gameOver) return;
        
        this.gameOver = true;
        const winner = this.playerColor === 'white' ? '黑方' : '白方';
        this.showGameOver(`${winner}获胜`, `你认输了`);
    }

    handleGameOver() {
        this.gameOver = true;
        
        let title, message;
        
        if (this.game.isCheckmate()) {
            const winner = this.game.turn() === 'white' ? '黑方' : '白方';
            title = `${winner}获胜`;
            message = `将杀!`;
        } else if (this.game.isDraw()) {
            title = '和棋';
            if (this.game.isStalemate()) {
                message = '逼和 - 无子可动';
            } else if (this.game.isThreefoldRepetition()) {
                message = '三次重复局面';
            } else if (this.game.isInsufficientMaterial()) {
                message = '子力不足';
            } else {
                message = '五十步规则';
            }
        } else if (this.game.isGameOver()) {
            const winner = this.game.turn() === 'white' ? '黑方' : '白方';
            title = `${winner}获胜`;
            message = '游戏结束';
        }
        
        this.showGameOver(title, message);
    }

    showGameOver(title, message) {
        document.getElementById('gameOverTitle').textContent = title;
        document.getElementById('gameOverMessage').textContent = message;
        document.getElementById('gameOverModal').classList.remove('hidden');
    }

    resetGame() {
        this.game.reset();
        this.board.position('start');
        
        // 自动调整棋盘方向，使玩家棋子在下方
        const currentOrientation = this.board.orientation();
        const targetOrientation = this.playerColor; // 'white' or 'black'
        if (currentOrientation !== targetOrientation) {
            this.board.flip();
        }
        
        this.moveHistory = [];
        this.gameOver = false;
        this.isThinking = false;
        document.getElementById('thinking').classList.add('hidden');
        
        // 如果玩家执黑，AI先手
        if (this.playerColor === 'black') {
            if (this.stockfishReady) {
                this.makeAIMove();
            } else {
                this.pendingAIMove = true;
            }
        }
        
        this.updateUI();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chessGame = new ChessGame();
});
