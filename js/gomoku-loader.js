const GAMES = {
    chess: {
        id: 'chess',
        name: { zh: '国际象棋', en: 'Chess' },
        icon: '♔'
    },
    gomoku: {
        id: 'gomoku',
        name: { zh: '五子棋', en: 'Gomoku' },
        icon: '●'
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
        newGame: '新游戏',
        undo: '撤销',
        resign: '认输',
        mode: '模式',
        difficulty: '难度',
        pvp: '双人对战',
        pvc: '人机对战',
        easy: '简单',
        medium: '中等',
        hard: '困难',
        current: '当前',
        black: '黑方',
        white: '白方',
        blackWins: '黑方获胜',
        whiteWins: '白方获胜',
        noUndo: '没有可撤销的操作',
        newGameTitle: '新游戏',
        startGame: '开始'
    },
    en: {
        newGame: 'New Game',
        undo: 'Undo',
        resign: 'Resign',
        mode: 'Mode',
        difficulty: 'Difficulty',
        pvp: 'PvP',
        pvc: 'PvC',
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        current: 'Current',
        black: 'Black',
        white: 'White',
        blackWins: 'Black wins',
        whiteWins: 'White wins',
        noUndo: 'No actions to undo',
        newGameTitle: 'New Game',
        startGame: 'Start'
    }
};

function t(key) {
    return translations[currentLang][key] || key;
}

function loadGomoku() {
    if (!document.getElementById('board')) {
        return;
    }
    
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
    
    if (typeof GomokuGame !== 'undefined') {
        currentGame = new GomokuGame();
    }
}

function showNewGameModal() {
    const modal = document.getElementById('newGameModal');
    if (modal) {
        modal.classList.remove('hidden');
        updateUITexts();
        
        document.querySelectorAll('#newGameModal #gameMode option').forEach(opt => {
            opt.textContent = opt.dataset[currentLang];
        });
        document.querySelectorAll('#newGameModal #difficulty option').forEach(opt => {
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
    const title = document.getElementById('gameTitle');
    if (title) title.textContent = `● ${GAMES.gomoku.name[currentLang]} ●`;
    
    const newGameBtn = document.getElementById('newGame');
    if (newGameBtn) newGameBtn.textContent = t('newGame');
    
    const undoBtn = document.getElementById('undo');
    if (undoBtn) undoBtn.textContent = t('undo');
    
    const resignBtn = document.getElementById('resign');
    if (resignBtn) resignBtn.textContent = t('resign');
    
    const newGameTitle = document.getElementById('newGameTitle');
    if (newGameTitle) newGameTitle.textContent = t('newGameTitle');
    
    const startGameBtn = document.getElementById('startGame');
    if (startGameBtn) startGameBtn.textContent = t('startGame');
    
    updateGameInfo('');
}

document.addEventListener('DOMContentLoaded', loadGomoku);
