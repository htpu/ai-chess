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
        newGameStart: '新游戏开始'
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
        newGameStart: 'New game started'
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
    
    if (typeof SudokuGame !== 'undefined') {
        currentGame = new SudokuGame();
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
    
    const diffLabel = document.getElementById('difficultyLabel');
    if (diffLabel) diffLabel.textContent = t('difficulty') + ':';
    
    const diffSelect = document.getElementById('difficulty');
    if (diffSelect) {
        diffSelect.options[0].text = t('easy');
        diffSelect.options[1].text = t('medium');
        diffSelect.options[2].text = t('hard');
        diffSelect.options[3].text = t('expert');
    }
}

document.addEventListener('DOMContentLoaded', loadSudoku);
