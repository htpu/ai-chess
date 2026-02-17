const GAMES = {
    chess: {
        id: 'chess',
        name: { zh: '国际象棋', en: 'Chess' },
        icon: '♔'
    },
    xiangqi: {
        id: 'xiangqi',
        name: { zh: '中国象棋', en: 'Xiangqi' },
        icon: '象棋'
    }
};

let currentLang = 'zh';
let currentGame = null;

function getSystemLanguage() {
    const lang = navigator.language || navigator.userLanguage || 'zh';
    return lang.startsWith('zh') ? 'zh' : 'en';
}

const translations = {
    zh: {
        difficulty: '难度',
        playerColor: '执子',
        red: '红方',
        black: '黑方',
        moveHistory: '移动历史',
        controlPanel: '控制面板',
        undoMove: '悔棋',
        resign: '认输',
        newGame: '新游戏',
        turn: '回合',
        moves: '步数',
        gameInProgress: '游戏进行中...',
        yourTurn: '轮到你走棋',
        aiThinking: 'AI思考中...',
        check: '将军!',
        difficultyChanged: '难度已切换为',
        level: '级',
        gameOver: '游戏结束',
        checkmate: '将杀!',
        redWins: '红方获胜',
        blackWins: '黑方获胜',
        playAgain: '再来一局',
        illegalMove: '非法走法!',
        sound: '音效',
        on: '开',
        off: '关',
        youResigned: '你认输了',
        backToHome: '返回首页',
        newGameTitle: '新游戏',
        startGame: '开始'
    },
    en: {
        difficulty: 'Difficulty',
        playerColor: 'Play as',
        red: 'Red',
        black: 'Black',
        moveHistory: 'Move History',
        controlPanel: 'Control',
        undoMove: 'Undo',
        resign: 'Resign',
        newGame: 'New Game',
        turn: 'Turn',
        moves: 'Moves',
        gameInProgress: 'Game in progress...',
        yourTurn: 'Your turn',
        aiThinking: 'AI thinking...',
        check: 'Check!',
        difficultyChanged: 'Difficulty set to',
        level: '',
        gameOver: 'Game Over',
        checkmate: 'Checkmate!',
        redWins: 'Red wins',
        blackWins: 'Black wins',
        playAgain: 'Play Again',
        illegalMove: 'Illegal move!',
        sound: 'Sound',
        on: 'On',
        off: 'Off',
        youResigned: 'You resigned',
        backToHome: 'Back to Home',
        newGameTitle: 'New Game',
        startGame: 'Start'
    }
};

function t(key) {
    return translations[currentLang][key] || key;
}

window.t = t;

function loadXiangqi() {
    if (!document.getElementById('board')) {
        return;
    }
    
    currentLang = localStorage.getItem('language') || getSystemLanguage();
    
    updateUITexts();
    
    document.getElementById('backToHome').onclick = () => {
        window.location.href = 'index.html';
    };
    
    document.getElementById('newGame').onclick = () => {
        showNewGameModal();
    };
    
    document.getElementById('startGame').onclick = () => {
        startGameWithSettings();
    };

    const difficultyEl = document.getElementById('difficulty');
    if (difficultyEl) {
        difficultyEl.value = localStorage.getItem('difficulty') || '3';
    }
    
    const playerColorEl = document.getElementById('playerColor');
    if (playerColorEl) {
        const savedColor = localStorage.getItem('playerColor');
        if (savedColor) {
            playerColorEl.value = savedColor;
        }
    }
    
    if (typeof XiangqiGame !== 'undefined') {
        currentGame = new XiangqiGame();
        currentGame.createBoard();
        currentGame.newGame();
        window.xiangqiGame = currentGame;
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
    
    const difficulty = document.getElementById('difficulty').value;
    const playerColor = document.getElementById('playerColor').value;
    
    localStorage.setItem('difficulty', difficulty);
    localStorage.setItem('playerColor', playerColor);
    
    if (currentGame) {
        currentGame.difficulty = parseInt(difficulty);
        currentGame.playerColor = playerColor;
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
    const el = (id) => document.getElementById(id);
    
    if (el('historyTitle')) el('historyTitle').textContent = t('moveHistory');
    if (el('controlTitle')) el('controlTitle').textContent = t('controlPanel');
    if (el('turnLabel')) el('turnLabel').textContent = t('turn') + ':';
    if (el('movesLabel')) el('movesLabel').textContent = t('moves') + ':';
    if (el('undoMove')) el('undoMove').textContent = t('undoMove');
    if (el('resign')) el('resign').textContent = t('resign');
    if (el('newGame')) el('newGame').textContent = t('newGame');
    if (el('gameOverTitle')) el('gameOverTitle').textContent = t('gameOver');
    if (el('playAgain')) el('playAgain').textContent = t('playAgain');
    
    if (el('newGameTitle')) el('newGameTitle').textContent = t('newGameTitle');
    if (el('startGame')) el('startGame').textContent = t('startGame');
    
    const title = document.getElementById('gameTitle');
    if (title) title.textContent = `象棋 ${GAMES.xiangqi.name[currentLang]} 象棋`;
    
    const diffOpts = document.querySelectorAll('#difficulty option');
    diffOpts.forEach(opt => { opt.textContent = opt.dataset[currentLang]; });
    const colorOpts = document.querySelectorAll('#playerColor option');
    colorOpts.forEach(opt => { opt.textContent = opt.dataset[currentLang]; });
    
    updateGameInfo('');
}

document.addEventListener('DOMContentLoaded', loadXiangqi);
