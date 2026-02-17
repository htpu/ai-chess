const GAMES = {
    chess: {
        id: 'chess',
        name: { zh: '国际象棋', en: 'Chess' },
        icon: '♔'
    }
};

let currentGame = null;
let currentLang = 'zh';

function getSystemLanguage() {
    const lang = navigator.language || navigator.userLanguage || 'zh';
    return lang.startsWith('zh') ? 'zh' : 'en';
}

function t(key) {
    const translations = {
        zh: {
            difficulty: '难度',
            playerColor: '执子',
            white: '白方',
            black: '黑方',
            moveHistory: '移动历史',
            controlPanel: '控制面板',
            flipBoard: '翻转棋盘',
            undoMove: '悔棋',
            resign: '认输',
            newGame: '新游戏',
            turn: '回合',
            moves: '步数',
            gameInProgress: '游戏进行中...',
            yourTurn: '轮到你走棋',
            aiThinking: 'AI思考中...',
            yourTurn: '轮到你走棋',
            aiThinking: 'AI思考中...',
            check: '将军!',
            difficultyChanged: '难度已切换为',
            level: '级',
            gameOver: '游戏结束',
            checkmate: '将杀!',
            draw: '和棋',
            stalemate: '逼和 - 无子可动',
            threefoldRep: '三次重复局面',
            insufficientMaterial: '子力不足',
            fiftyMoveRule: '五十步规则',
            youResigned: '你认输了',
            whiteWins: '白方获胜',
            blackWins: '黑方获胜',
            playAgain: '再来一局',
            illegalMove: '非法走法!',
            promotion: '升变选择',
            queen: '皇后',
            rook: '车',
            bishop: '象',
            knight: '马',
            sound: '音效',
            on: '开',
            off: '关',
            promotedTo: '升变为',
            castled: '王车易位',
            backToHome: '返回首页',
            newGameTitle: '新游戏',
            startGame: '开始'
        },
        en: {
            difficulty: 'Difficulty',
            playerColor: 'Play as',
            white: 'White',
            black: 'Black',
            moveHistory: 'Move History',
            controlPanel: 'Control',
            flipBoard: 'Flip',
            undoMove: 'Undo',
            resign: 'Resign',
            newGame: 'New Game',
            turn: 'Turn',
            moves: 'Moves',
            gameInProgress: 'Game in progress...',
            yourTurn: 'Your turn',
            aiThinking: 'AI thinking...',
            yourTurn: 'Your turn',
            aiThinking: 'AI thinking...',
            check: 'Check!',
            difficultyChanged: 'Difficulty set to',
            level: '',
            gameOver: 'Game Over',
            checkmate: 'Checkmate!',
            draw: 'Draw',
            stalemate: 'Stalemate',
            threefoldRep: 'Threefold repetition',
            insufficientMaterial: 'Insufficient material',
            fiftyMoveRule: 'Fifty move rule',
            youResigned: 'You resigned',
            whiteWins: 'White wins',
            blackWins: 'Black wins',
            playAgain: 'Play Again',
            illegalMove: 'Illegal move!',
            promotion: 'Promote to',
            queen: 'Queen',
            rook: 'Rook',
            bishop: 'Bishop',
            knight: 'Knight',
            sound: 'Sound',
            on: 'On',
            off: 'Off',
            promotedTo: 'Promoted to',
            castled: 'Castled',
            backToHome: 'Back to Home',
            newGameTitle: 'New Game',
            startGame: 'Start'
        }
    };
    return translations[currentLang][key] || key;
}

function loadGame() {
    if (!document.getElementById('gameTitle')) {
        return;
    }
    
    const gameId = localStorage.getItem('selectedGame') || 'chess';
    const game = GAMES[gameId];
    
    if (!game) {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('gameTitle').textContent = `${game.icon} ${game.name[currentLang]} ${game.icon}`;
    
    currentLang = localStorage.getItem('language') || getSystemLanguage();
    
    updateUITexts();
    showNewGameModal();
    
    document.getElementById('backToHome').onclick = () => {
        window.location.href = 'index.html';
    };
    
    document.getElementById('newGame').onclick = () => {
        showNewGameModal();
    };
    
    document.getElementById('startGame').onclick = () => {
        startGameWithSettings();
    };
    
    const gameTitle = document.getElementById('gameTitle');
    const difficultyGroup = document.getElementById('difficultyGroup');
    const playerColorGroup = document.getElementById('playerColorGroup');
    
    if (gameId === 'chess') {
        if (gameTitle) gameTitle.textContent = `${GAMES[gameId].icon} ${GAMES[gameId].name[currentLang]} ${GAMES[gameId].icon}`;
        
        if (typeof ChessGame !== 'undefined') {
            currentGame = new ChessGame();
            currentGame.createBoard();
        }
    } else if (gameId === 'sudoku') {
        if (gameTitle) gameTitle.textContent = `${GAMES[gameId].icon} ${GAMES[gameId].name[currentLang]} ${GAMES[gameId].icon}`;
        
        if (typeof SudokuGame !== 'undefined') {
            currentGame = new SudokuGame();
            currentGame.createBoard();
        }
    }
}

function showNewGameModal() {
    const modal = document.getElementById('newGameModal');
    if (modal) {
        modal.classList.remove('hidden');
        updateUITexts();
        
        document.querySelectorAll('#newGameModal #difficulty option').forEach(opt => {
            opt.textContent = opt.dataset[currentLang];
        });
        document.querySelectorAll('#newGameModal #playerColor option').forEach(opt => {
            opt.textContent = opt.dataset[currentLang];
        });
    }
}

function startGameWithSettings() {
    const modal = document.getElementById('newGameModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    if (currentGame && currentGame.newGame) {
        currentGame.newGame();
    }
}

function updateGameInfo(info) {
    const gameInfo = document.getElementById('gameInfo');
    if (gameInfo) {
        gameInfo.textContent = info;
    }
}

function updateUITexts() {
    document.getElementById('historyTitle').textContent = t('moveHistory');
    document.getElementById('controlTitle').textContent = t('controlPanel');
    document.getElementById('turnLabel').textContent = t('turn') + ':';
    document.getElementById('movesLabel').textContent = t('moves') + ':';
    document.getElementById('flipBoard').textContent = t('flipBoard');
    document.getElementById('undoMove').textContent = t('undoMove');
    document.getElementById('resign').textContent = t('resign');
    document.getElementById('newGame').textContent = t('newGame');
    document.getElementById('gameOverTitle').textContent = t('gameOver');
    document.getElementById('playAgain').textContent = t('playAgain');
    document.getElementById('promotionTitle').textContent = t('promotion');
    
    if (document.getElementById('newGameTitle')) {
        document.getElementById('newGameTitle').textContent = t('newGameTitle');
    }
    if (document.getElementById('startGame')) {
        document.getElementById('startGame').textContent = t('startGame');
    }
    
    document.querySelectorAll('#difficulty option').forEach(opt => {
        opt.textContent = opt.dataset[currentLang];
    });
    document.querySelectorAll('#playerColor option').forEach(opt => {
        opt.textContent = opt.dataset[currentLang];
    });
    
    updateGameInfo('');
}

document.addEventListener('DOMContentLoaded', loadGame);
