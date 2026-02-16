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
        noUndo: '没有可撤销的操作'
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
        noUndo: 'No actions to undo'
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
    document.getElementById('language').value = currentLang;
    
    updateUITexts();
    
    document.getElementById('backToHome').onclick = () => {
        window.location.href = 'index.html';
    };
    
    document.getElementById('language').addEventListener('change', (e) => {
        currentLang = e.target.value;
        localStorage.setItem('language', currentLang);
        updateUITexts();
    });
    
    if (typeof GomokuGame !== 'undefined') {
        currentGame = new GomokuGame();
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
    
    const modeLabel = document.getElementById('modeLabel');
    if (modeLabel) modeLabel.textContent = t('mode') + ':';
    
    const diffLabel = document.getElementById('difficultyLabel');
    if (diffLabel) diffLabel.textContent = t('difficulty') + ':';
    
    const modeSelect = document.getElementById('gameMode');
    if (modeSelect) {
        modeSelect.options[0].text = t('pvp');
        modeSelect.options[1].text = t('pvc');
    }
    
    const diffSelect = document.getElementById('difficulty');
    if (diffSelect) {
        diffSelect.options[0].text = t('easy');
        diffSelect.options[1].text = t('medium');
        diffSelect.options[2].text = t('hard');
    }
    
    const playerLabel = document.getElementById('playerLabel');
    if (playerLabel) playerLabel.textContent = t('current') + ': ' + t('black');
}

document.addEventListener('DOMContentLoaded', loadGomoku);
