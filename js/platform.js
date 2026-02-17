const GAMES = {
    chess: {
        id: 'chess',
        name: { zh: '国际象棋', en: 'Chess' },
        icon: '♔',
        description: { zh: '人机对战 AI', en: 'Play vs AI' },
        color: '#8b4513'
    },
    gomoku: {
        id: 'gomoku',
        name: { zh: '五子棋', en: 'Gomoku' },
        icon: '●',
        description: { zh: '经典五子棋', en: 'Classic Gomoku' },
        color: '#FF6B35'
    },
    sudoku: {
        id: 'sudoku',
        name: { zh: '数独', en: 'Sudoku' },
        icon: '⊞',
        description: { zh: '逻辑推理挑战', en: 'Logic Challenge' },
        color: '#00F2FF'
    },
    xiangqi: {
        id: 'xiangqi',
        name: { zh: '中国象棋', en: 'Xiangqi' },
        icon: '象棋',
        description: { zh: '传统中国象棋', en: 'Traditional Chinese Chess' },
        color: '#CD853F'
    }
};

let currentLang = localStorage.getItem('language') || 'zh';

function getSystemLanguage() {
    const lang = navigator.language || navigator.userLanguage || 'zh';
    return lang.startsWith('zh') ? 'zh' : 'en';
}

currentLang = localStorage.getItem('language') || getSystemLanguage();

function t(key) {
    const translations = {
        zh: {
            selectGame: '选择游戏',
            playNow: '开始游戏',
            backToHome: '返回首页',
            difficulty: '难度',
            playerColor: '执子',
            white: '白方',
            black: '黑方',
            sound: '音效',
            on: '开',
            off: '关',
            platformTitle: 'AI Games',
            platformSubtitle: '人机对战平台'
        },
        en: {
            selectGame: 'Select Game',
            playNow: 'Play Now',
            backToHome: 'Back to Home',
            difficulty: 'Difficulty',
            playerColor: 'Play as',
            white: 'White',
            black: 'Black',
            sound: 'Sound',
            on: 'On',
            off: 'Off',
            platformTitle: 'AI Games',
            platformSubtitle: 'Play vs AI'
        }
    };
    return translations[currentLang][key] || key;
}

function renderGameSelector() {
    const container = document.getElementById('gameList');
    container.innerHTML = '';
    
    const pageTitle = document.getElementById('pageTitle');
    const subtitle = document.getElementById('subtitle');
    const selectGameText = document.getElementById('selectGameText');
    if (pageTitle) pageTitle.textContent = t('platformTitle');
    if (subtitle) subtitle.textContent = t('platformSubtitle');
    if (selectGameText) selectGameText.textContent = t('selectGame');
    
    Object.values(GAMES).forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.style.setProperty('--game-color', game.color);
        card.onclick = () => startGame(game.id);
        
        card.innerHTML = `
            <div class="game-icon">${game.icon}</div>
            <div class="game-name">${game.name[currentLang]}</div>
            <div class="game-desc">${game.description[currentLang]}</div>
        `;
        container.appendChild(card);
    });
}

function startGame(gameId) {
    localStorage.setItem('selectedGame', gameId);
    
    const gamePages = {
        chess: 'chess.html',
        sudoku: 'sudoku.html',
        gomoku: 'gomoku.html',
        xiangqi: 'xiangqi.html'
    };
    
    window.location.href = gamePages[gameId] || 'chess.html';
}

function loadGameSettings() {
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
        currentLang = savedLang;
    }
    
    const langSelect = document.getElementById('language');
    const soundToggle = document.getElementById('soundToggle');
    
    if (langSelect) langSelect.value = currentLang;
    if (soundToggle) soundToggle.checked = localStorage.getItem('soundEnabled') !== 'false';
}

function initPlatform() {
    loadGameSettings();
    renderGameSelector();
    
    const langSelect = document.getElementById('language');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            currentLang = e.target.value;
            localStorage.setItem('language', currentLang);
            renderGameSelector();
        });
    }
}

document.addEventListener('DOMContentLoaded', initPlatform);
