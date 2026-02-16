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

    t(key) {
        const zh = { black: '黑方', white: '白方', current: '当前', blackWins: '黑方获胜', whiteWins: '白方获胜' };
        const en = { black: 'Black', white: 'White', current: 'Current', blackWins: 'Black wins', whiteWins: 'White wins' };
        const lang = localStorage.getItem('language') || 'zh';
        return (lang === 'en' ? en : zh)[key] || key;
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
            const winnerName = winner === 'black' ? t('black') : t('white');
            this.showMessage(`${t(winner === 'black' ? 'blackWins' : 'whiteWins')}`, 'win');
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

    evaluateMove(index, player) {
        this.board[index] = player;
        let score = this.getPatternScore(index, player);
        
        const opponent = player === 'white' ? 'black' : 'white';
        const opponentScore = this.getPatternScore(index, opponent);
        
        score += opponentScore * 1.2;
        
        this.board[index] = null;
        
        return score;
    }

    getPatternScore(index, player) {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        const row = Math.floor(index / this.boardSize);
        const col = index % this.boardSize;
        
        let totalScore = 0;
        
        for (const [dr, dc] of directions) {
            let count = 1;
            let openEnds = 0;
            let blocked = 0;
            
            for (let d = 1; d < 5; d++) {
                const r = row + dr * d;
                const c = col + dc * d;
                if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) {
                    blocked++;
                    break;
                }
                const cell = this.board[r * this.boardSize + c];
                if (cell === player) count++;
                else if (cell === null) {
                    openEnds++;
                    break;
                }
                else {
                    blocked++;
                    break;
                }
            }
            
            for (let d = 1; d < 5; d++) {
                const r = row - dr * d;
                const c = col - dc * d;
                if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) {
                    blocked++;
                    break;
                }
                const cell = this.board[r * this.boardSize + c];
                if (cell === player) count++;
                else if (cell === null) {
                    openEnds++;
                    break;
                }
                else {
                    blocked++;
                    break;
                }
            }
            
            if (count >= 5) return 100000;
            if (count === 4 && openEnds > 0) return 10000;
            if (count === 4 && openEnds === 0) return 1000;
            if (count === 3 && openEnds >= 2) return 1000;
            if (count === 3 && openEnds === 1) return 100;
            if (count === 2 && openEnds >= 2) return 100;
            if (count === 2 && openEnds === 1) return 10;
            
            totalScore += count * count * (openEnds + 1);
        }
        
        return totalScore;
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

    easyAI() {
        const win = this.findWinningMove('white');
        if (win !== null) return win;
        
        const block = this.findWinningMove('black');
        if (block !== null) return block;
        
        const live3Block = this.findLiveThree('black');
        if (live3Block !== null) return live3Block;
        
        const attack = this.findBestMove('white', 3);
        if (attack !== null) return attack;
        
        const defend = this.findBestMove('black', 3);
        if (defend !== null) return defend;
        
        return this.findBestMove('white', 1);
    }

    mediumAI() {
        const win = this.findWinningMove('white');
        if (win !== null) return win;
        
        const block = this.findWinningMove('black');
        if (block !== null) return block;
        
        const doubleThreat = this.findDoubleThreat('black');
        if (doubleThreat !== null) return doubleThreat;
        
        const live3Attack = this.findLiveThree('white');
        if (live3Attack !== null) return live3Attack;
        
        const live3Block = this.findLiveThree('black');
        if (live3Block !== null) return live3Block;
        
        return this.evaluateBestMove('white');
    }

    hardAI() {
        const win = this.findWinningMove('white');
        if (win !== null) return win;
        
        const block = this.findWinningMove('black');
        if (block !== null) return block;
        
        const doubleThreat = this.findDoubleThreat('black');
        if (doubleThreat !== null) return doubleThreat;
        
        const doubleAttack = this.findDoubleThreat('white');
        if (doubleAttack !== null) return doubleAttack;
        
        const live3Attack = this.findLiveThree('white');
        if (live3Attack !== null) return live3Attack;
        
        const live3Block = this.findLiveThree('black');
        if (live3Block !== null) return live3Block;
        
        return this.minimaxMove('white', 3, -Infinity, Infinity);
    }

    findLiveThree(player) {
        const threats = [];
        
        for (let i = 0; i < this.boardSize * this.boardSize; i++) {
            if (this.board[i] !== null) continue;
            
            this.board[i] = player;
            
            const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
            for (const [dr, dc] of directions) {
                const count = this.countInDirection(i, player, dr, dc);
                const openEnds = this.countOpenEnds(i, player, count);
                
                if (count === 3 && openEnds >= 2) {
                    threats.push(i);
                    break;
                }
            }
            
            this.board[i] = null;
        }
        
        if (threats.length > 0) {
            return threats[0];
        }
        return null;
    }

    minimaxMove(player, depth, alpha, beta) {
        if (depth === 0) {
            return this.evaluateBoard('white');
        }
        
        const win = this.findWinningMove(player);
        if (win !== null) {
            return 100000 * (depth + 1);
        }
        
        const candidates = this.getCandidateMoves().slice(0, 15);
        
        if (player === 'white') {
            let maxScore = -Infinity;
            for (const move of candidates) {
                this.board[move] = player;
                const score = this.minimaxMove('black', depth - 1, alpha, beta);
                this.board[move] = null;
                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break;
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (const move of candidates) {
                this.board[move] = player;
                const score = this.minimaxMove('white', depth - 1, alpha, beta);
                this.board[move] = null;
                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break;
            }
            return minScore;
        }
    }

    evaluateBoard(player) {
        let score = 0;
        
        for (let i = 0; i < this.boardSize * this.boardSize; i++) {
            if (this.board[i] === null) {
                this.board[i] = player;
                score += this.getPatternScore(i, player);
                this.board[i] = 'black';
                score -= this.getPatternScore(i, 'black');
                this.board[i] = null;
            }
        }
        
        return score;
    }

    findWinningMove(player) {
        for (let i = 0; i < this.boardSize * this.boardSize; i++) {
            if (this.board[i] !== null) continue;
            
            this.board[i] = player;
            if (this.checkWin(i)) {
                this.board[i] = null;
                return i;
            }
            this.board[i] = null;
        }
        return null;
    }

    findDoubleThreat(player) {
        const threats = [];
        
        for (let i = 0; i < this.boardSize * this.boardSize; i++) {
            if (this.board[i] !== null) continue;
            
            this.board[i] = player;
            let threatCount = 0;
            
            const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
            for (const [dr, dc] of directions) {
                const count = this.countInDirection(i, player, dr, dc);
                const openEnds = this.countOpenEnds(i, player, count);
                
                if (count >= 4 || (count === 3 && openEnds >= 2)) {
                    threatCount++;
                }
            }
            
            if (threatCount >= 2) {
                threats.push(i);
            }
            
            this.board[i] = null;
        }
        
        if (threats.length > 0) {
            return threats[0];
        }
        return null;
    }

    countInDirection(index, player, dr, dc) {
        const row = Math.floor(index / this.boardSize);
        const col = index % this.boardSize;
        
        let count = 0;
        
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
        
        return count;
    }

    evaluateBestMove(player) {
        let bestScore = -Infinity;
        let bestMove = null;
        
        const candidates = this.getCandidateMoves();
        
        for (const index of candidates) {
            const score = this.evaluateMove(index, player);
            if (score > bestScore) {
                bestScore = score;
                bestMove = index;
            }
        }
        
        return bestMove || this.findBestMove(player, 1);
    }

    getCandidateMoves() {
        const candidates = new Set();
        const checked = new Set();
        
        for (let i = 0; i < this.boardSize * this.boardSize; i++) {
            if (this.board[i] !== null) {
                const row = Math.floor(i / this.boardSize);
                const col = i % this.boardSize;
                
                for (let dr = -2; dr <= 2; dr++) {
                    for (let dc = -2; dc <= 2; dc++) {
                        const r = row + dr;
                        const c = col + dc;
                        if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
                            const idx = r * this.boardSize + c;
                            if (this.board[idx] === null && !checked.has(idx)) {
                                candidates.add(idx);
                                checked.add(idx);
                            }
                        }
                    }
                }
            }
        }
        
        const center = Math.floor(this.boardSize / 2) * this.boardSize + Math.floor(this.boardSize / 2);
        if (candidates.size === 0) {
            return [center];
        }
        
        if (!candidates.has(center)) {
            candidates.add(center);
        }
        
        return Array.from(candidates);
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
        const winner = this.currentPlayer === 'black' ? t('white') : t('black');
        this.showMessage(`${t(winner === t('white') ? 'whiteWins' : 'blackWins')}`, 'win');
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
            playerLabel.textContent = t('current') + ': ' + t('black');
        } else {
            currentPlayer.textContent = '○';
            currentPlayer.style.color = '#fff';
            currentPlayer.style.textShadow = '0 0 5px #000';
            playerLabel.textContent = t('current') + ': ' + t('white');
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
