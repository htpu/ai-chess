const GAMES = {
    chess: {
        id: 'chess',
        name: { zh: '国际象棋', en: 'Chess' },
        icon: '♔'
    },
    sudoku: {
        id: 'sudoku',
        name: { zh: '数独', en: 'Sudoku' },
        icon: '⊞'
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
        solve: '解题',
        erase: '擦除',
        undo: '撤销',
        difficulty: '难度',
        easy: '简单',
        medium: '中等',
        hard: '困难',
        expert: '专家',
        congratulations: '恭喜完成!',
        wrong: '答案错误',
        noUndo: '没有可撤销的操作',
        solved: '已解题',
        newGameStart: '新游戏开始',
        newGameTitle: '新游戏',
        startGame: '开始'
    },
    en: {
        newGame: 'New Game',
        solve: 'Solve',
        erase: 'Erase',
        undo: 'Undo',
        difficulty: 'Difficulty',
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        expert: 'Expert',
        congratulations: 'Congratulations!',
        wrong: 'Wrong answer',
        noUndo: 'No actions to undo',
        solved: 'Solved',
        newGameStart: 'New game started',
        newGameTitle: 'New Game',
        startGame: 'Start'
    }
};

function t(key) {
    return translations[currentLang][key] || key;
}

function loadSudoku() {
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
    
    if (typeof SudokuGame !== 'undefined') {
        currentGame = new SudokuGame();
        currentGame.createBoard();
        currentGame.render();
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
    if (title) title.textContent = `⊞ ${GAMES.sudoku.name[currentLang]} ⊞`;
    
    const newGameBtn = document.getElementById('newGame');
    if (newGameBtn) newGameBtn.textContent = t('newGame');
    
    const solveBtn = document.getElementById('solve');
    if (solveBtn) solveBtn.textContent = t('solve');
    
    const eraseBtn = document.getElementById('erase');
    if (eraseBtn) eraseBtn.textContent = t('erase');
    
    const undoBtn = document.getElementById('undo');
    if (undoBtn) undoBtn.textContent = t('undo');
    
    const newGameTitle = document.getElementById('newGameTitle');
    if (newGameTitle) newGameTitle.textContent = t('newGameTitle');
    
    const startGameBtn = document.getElementById('startGame');
    if (startGameBtn) startGameBtn.textContent = t('startGame');
    
    updateGameInfo('');
}

document.addEventListener('DOMContentLoaded', loadSudoku);
