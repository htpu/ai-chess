class GomokuGame {
    constructor() {
        this.boardSize = 15;
        this.board = [];
        this.currentPlayer = 'black';
        this.undoStack = [];
        this.gameOver = false;
        this.mode = 'pvc';
        this.difficulty = 2;
        
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
        
        for (let i = 0; i < this.boardSize * this.boardSize; i++) {
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
                this.handleClick(parseInt(cell.dataset.index));
            }
        });

        document.getElementById('newGame').addEventListener('click', () => {
            this.newGame();
        });

        document.getElementById('undo').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('resign').addEventListener('click', () => {
            this.resign();
        });

        document.getElementById('gameMode').addEventListener('change', (e) => {
            this.mode = e.target.value;
            this.newGame();
        });

        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = parseInt(e.target.value);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'z' || e.key === 'Z') {
                this.undo();
            } else if (e.key === 'n' || e.key === 'N') {
                this.newGame();
            }
        });
    }

    handleClick(index) {
        if (this.gameOver) return;
        if (this.board[index] !== null) return;
        
        if (this.mode === 'pvc' && this.currentPlayer === 'white') return;

        this.placeStone(index);
        
        if (!this.gameOver && this.mode === 'pvc') {
            setTimeout(() => this.aiMove(), 300);
        }
    }

    placeStone(index, isAi = false) {
        this.undoStack.push({
            index: index,
            player: this.currentPlayer
        });
        
        this.board[index] = this.currentPlayer;
        
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        cell.classList.add('occupied');
        
        const stone = document.createElement('div');
        stone.className = `stone ${this.currentPlayer}`;
        cell.appendChild(stone);
        
        const prevLastMove = document.querySelector('.stone.last-move');
        if (prevLastMove) {
            prevLastMove.classList.remove('last-move');
        }
        stone.classList.add('last-move');
        
        if (this.checkWin(index)) {
            this.gameOver = true;
            const winner = this.currentPlayer;
            this.highlightWin();
            const winnerName = winner === 'black' ? '黑方' : '白方';
            this.showMessage(`${winnerName}获胜!`, 'win');
            return;
        }
        
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        this.updatePlayerIndicator();
    }

    checkWin(index) {
        const directions = [
            [1, 0],
            [0, 1],
            [1, 1],
            [1, -1]
        ];
        
        const row = Math.floor(index / this.boardSize);
        const col = index % this.boardSize;
        
        for (const [dr, dc] of directions) {
            let count = 1;
            
            for (let d = 1; d < 5; d++) {
                const r = row + dr * d;
                const c = col + dc * d;
                if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) break;
                if (this.board[r * this.boardSize + c] === this.currentPlayer) {
                    count++;
                } else break;
            }
            
            for (let d = 1; d < 5; d++) {
                const r = row - dr * d;
                const c = col - dc * d;
                if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) break;
                if (this.board[r * this.boardSize + c] === this.currentPlayer) {
                    count++;
                } else break;
            }
            
            if (count >= 5) return true;
        }
        
        return false;
    }

    getWinIndices(index) {
        const directions = [
            [1, 0],
            [0, 1],
            [1, 1],
            [1, -1]
        ];
        
        const row = Math.floor(index / this.boardSize);
        const col = index % this.boardSize;
        const winIndices = [index];
        
        for (const [dr, dc] of directions) {
            let line = [index];
            
            for (let d = 1; d < 5; d++) {
                const r = row + dr * d;
                const c = col + dc * d;
                if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) break;
                if (this.board[r * this.boardSize + c] === this.currentPlayer) {
                    line.push(r * this.boardSize + c);
                } else break;
            }
            
            for (let d = 1; d < 5; d++) {
                const r = row - dr * d;
                const c = col - dc * d;
                if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) break;
                if (this.board[r * this.boardSize + c] === this.currentPlayer) {
                    line.push(r * this.boardSize + c);
                } else break;
            }
            
            if (line.length >= 5) {
                return line;
            }
        }
        
        return [];
    }

    highlightWin() {
        if (this.undoStack.length === 0) return;
        
        const lastIndex = this.undoStack[this.undoStack.length - 1].index;
        const winIndices = this.getWinIndices(lastIndex);
        
        winIndices.forEach(i => {
            const cell = document.querySelector(`.cell[data-index="${i}"]`);
            cell.classList.add('win');
            const stone = cell.querySelector('.stone');
            if (stone) stone.classList.add('win');
        });
    }

    aiMove() {
        if (this.gameOver) return;
        
        let index;
        
        switch (this.difficulty) {
            case 1:
                index = this.easyAI();
                break;
            case 2:
                index = this.mediumAI();
                break;
            case 3:
                index = this.hardAI();
                break;
            default:
                index = this.mediumAI();
        }
        
        if (index !== null) {
            this.placeStone(index, true);
        }
    }

    easyAI() {
        const empty = this.board.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
        
        if (empty.length === 0) return null;
        
        if (empty.length < this.boardSize * this.boardSize * 0.5) {
            const attack = this.findBestMove('white', 3);
            if (attack !== null) return attack;
            const defend = this.findBestMove('black', 3);
            if (defend !== null) return defend;
        }
        
        return empty[Math.floor(Math.random() * empty.length)];
    }

    mediumAI() {
        const attack = this.findBestMove('white', 4);
        if (attack !== null) return attack;
        
        const defend = this.findBestMove('black', 4);
        if (defend !== null) return defend;
        
        return this.easyAI();
    }

    hardAI() {
        const attack = this.findBestMove('white', 5);
        if (attack !== null) return attack;
        
        const defend = this.findBestMove('black', 5);
        if (defend !== null) return defend;
        
        return this.mediumAI();
    }

    findBestMove(player, minCount) {
        const scores = new Map();
        
        for (let i = 0; i < this.boardSize * this.boardSize; i++) {
            if (this.board[i] !== null) continue;
            
            this.board[i] = player;
            const count = this.countConsecutive(i, player);
            this.board[i] = null;
            
            if (count >= minCount) {
                let score = Math.pow(2, count);
                
                const openEnds = this.countOpenEnds(i, player, count);
                score *= (openEnds + 1);
                
                scores.set(i, (scores.get(i) || 0) + score);
            }
        }
        
        if (scores.size === 0) {
            const center = Math.floor(this.boardSize / 2) * this.boardSize + Math.floor(this.boardSize / 2);
            if (this.board[center] === null) return center;
            
            const empty = this.board.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
            return empty[Math.floor(Math.random() * empty.length)];
        }
        
        let bestScore = 0;
        let bestMove = null;
        
        scores.forEach((score, index) => {
            if (score > bestScore) {
                bestScore = score;
                bestMove = index;
            }
        });
        
        return bestMove;
    }

    countConsecutive(index, player) {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        const row = Math.floor(index / this.boardSize);
        const col = index % this.boardSize;
        
        let maxCount = 0;
        
        for (const [dr, dc] of directions) {
            let count = 1;
            
            for (let d = 1; d < 5; d++) {
                const r = row + dr * d;
                const c = col + dc * d;
                if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) break;
                if (this.board[r * this.boardSize + c] === player) count++;
                else break;
            }
            
            for (let d = 1; d < 5; d++) {
                const r = row - dr * d;
                const c = col - dc * d;
                if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) break;
                if (this.board[r * this.boardSize + c] === player) count++;
                else break;
            }
            
            maxCount = Math.max(maxCount, count);
        }
        
        return maxCount;
    }

    countOpenEnds(index, player, count) {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        const row = Math.floor(index / this.boardSize);
        const col = index % this.boardSize;
        
        let openEnds = 0;
        
        for (const [dr, dc] of directions) {
            let open = 0;
            
            let r = row + dr * count;
            let c = col + dc * count;
            if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && this.board[r * this.boardSize + c] === null) {
                open++;
            }
            
            r = row - dr;
            c = col - dc;
            if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && this.board[r * this.boardSize + c] === null) {
                open++;
            }
            
            if (open > 0) openEnds += open;
        }
        
        return openEnds;
    }

    undo() {
        if (this.undoStack.length === 0) {
            this.showMessage('没有可撤销的操作', 'error');
            return;
        }
        
        let undoCount = this.mode === 'pvc' ? 2 : 1;
        
        while (undoCount > 0 && this.undoStack.length > 0) {
            const action = this.undoStack.pop();
            this.board[action.index] = null;
            
            const cell = document.querySelector(`.cell[data-index="${action.index}"]`);
            cell.classList.remove('occupied');
            cell.classList.remove('win');
            const stone = cell.querySelector('.stone');
            if (stone) stone.remove();
            
            undoCount--;
        }
        
        this.currentPlayer = this.undoStack.length > 0 
            ? this.undoStack[this.undoStack.length - 1].player 
            : 'black';
        
        this.updatePlayerIndicator();
        
        const lastStone = document.querySelector('.stone:last-child');
        if (lastStone) {
            lastStone.classList.add('last-move');
        }
        
        this.gameOver = false;
    }

    resign() {
        if (this.gameOver) return;
        
        this.gameOver = true;
        const winner = this.currentPlayer === 'black' ? '白方' : '黑方';
        this.showMessage(`${winner}获胜!`, 'win');
    }

    newGame() {
        this.board = new Array(this.boardSize * this.boardSize).fill(null);
        this.currentPlayer = 'black';
        this.undoStack = [];
        this.gameOver = false;
        
        this.render();
        this.updatePlayerIndicator();
    }

    render() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.innerHTML = '';
            cell.className = 'cell';
        });
    }

    updatePlayerIndicator() {
        const playerInfo = document.querySelector('.player-info');
        const currentPlayer = document.getElementById('currentPlayer');
        const playerLabel = document.getElementById('playerLabel');
        
        playerInfo.className = `player-info ${this.currentPlayer} current`;
        
        if (this.currentPlayer === 'black') {
            currentPlayer.textContent = '●';
            currentPlayer.style.color = '#000';
            currentPlayer.style.textShadow = '0 0 5px #fff';
            playerLabel.textContent = '当前: 黑方';
        } else {
            currentPlayer.textContent = '○';
            currentPlayer.style.color = '#fff';
            currentPlayer.style.textShadow = '0 0 5px #000';
            playerLabel.textContent = '当前: 白方';
        }
    }

    showMessage(text, type = 'success') {
        const msg = document.getElementById('message');
        msg.textContent = text;
        msg.className = 'message ' + type;
        
        setTimeout(() => {
            msg.classList.add('hidden');
        }, 1500);
    }
}
