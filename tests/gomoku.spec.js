const { test, expect } = require('@playwright/test');

test.describe('Gomoku Game Tests', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080/gomoku.html');
        await page.waitForTimeout(1000);
    });

    test('1. Page loads correctly', async ({ page }) => {
        const title = await page.title();
        expect(title).toBe('AI Gomoku');
        
        const cells = await page.locator('.cell').count();
        expect(cells).toBe(225);
    });

    test('2. New game starts with empty board', async ({ page }) => {
        const stones = await page.locator('.stone').count();
        expect(stones).toBe(0);
        
        const currentPlayer = await page.locator('#currentPlayer').textContent();
        expect(currentPlayer).toBe('●');
    });

    test('3. Click places stone (PvP mode)', async ({ page }) => {
        await page.locator('.cell').nth(50).click();
        
        const stones = await page.locator('.stone').count();
        expect(stones).toBe(1);
        
        const currentPlayer = await page.locator('#currentPlayer').textContent();
        expect(currentPlayer).toBe('○');
    });

    test('4. Turn alternates in PvP', async ({ page }) => {
        await page.locator('.cell').nth(50).click();
        
        let currentPlayer = await page.locator('#currentPlayer').textContent();
        expect(currentPlayer).toBe('○');
        
        await page.locator('.cell').nth(60).click();
        
        currentPlayer = await page.locator('#currentPlayer').textContent();
        expect(currentPlayer).toBe('●');
        
        const stones = await page.locator('.stone').count();
        expect(stones).toBe(2);
    });

    test('5. Cannot place on occupied cell', async ({ page }) => {
        await page.locator('.cell').nth(50).click();
        
        const stonesBefore = await page.locator('.stone').count();
        
        await page.locator('.cell').nth(50).click();
        
        const stonesAfter = await page.locator('.stone').count();
        expect(stonesAfter).toBe(stonesBefore);
    });

    test('6. PvC mode - player is black', async ({ page }) => {
        await page.selectOption('#gameMode', 'pvc');
        
        const playerInfo = await page.locator('.player-info').getAttribute('class');
        expect(playerInfo).toContain('black');
    });

    test('7. PvC mode - AI responds', async ({ page }) => {
        await page.selectOption('#gameMode', 'pvc');
        
        await page.locator('.cell').nth(50).click();
        await page.waitForTimeout(1000);
        
        const stones = await page.locator('.stone').count();
        expect(stones).toBe(2);
    });

    test('8. Undo in PvP mode', async ({ page }) => {
        await page.locator('.cell').nth(50).click();
        await page.waitForTimeout(200);
        await page.locator('.cell').nth(60).click();
        
        let stones = await page.locator('.stone').count();
        expect(stones).toBe(2);
        
        await page.click('#undo');
        
        stones = await page.locator('.stone').count();
        expect(stones).toBe(0);
    });

    test('9. Undo in PvC mode', async ({ page }) => {
        await page.selectOption('#gameMode', 'pvc');
        
        await page.locator('.cell').nth(50).click();
        await page.waitForTimeout(1000);
        
        let stones = await page.locator('.stone').count();
        expect(stones).toBe(2);
        
        await page.click('#undo');
        
        stones = await page.locator('.stone').count();
        expect(stones).toBe(0);
    });

    test('10. Win detection - horizontal', async ({ page }) => {
        await page.evaluate(() => {
            const game = window.currentGame;
            game.mode = 'pvp';
            game.board = new Array(225).fill(null);
            
            const positions = [0, 1, 2, 3, 4];
            positions.forEach(i => {
                game.board[i] = 'black';
                const cell = document.querySelector('.cell[data-index="' + i + '"]');
                cell.classList.add('occupied');
                const stone = document.createElement('div');
                stone.className = 'stone black';
                cell.appendChild(stone);
            });
            game.checkWin(2);
            game.highlightWin();
        });
        
        await page.waitForTimeout(500);
        
        const winCells = await page.locator('.cell.win').count();
        expect(winCells).toBe(5);
        
        const message = await page.locator('#message').textContent();
        expect(message).toContain('获胜');
    });

    test('11. Resign works', async ({ page }) => {
        await page.locator('.cell').nth(50).click();
        
        await page.click('#resign');
        
        const message = await page.locator('#message').textContent();
        expect(message).toContain('获胜');
    });

    test('12. New game resets board', async ({ page }) => {
        await page.locator('.cell').nth(50).click();
        
        await page.click('#newGame');
        
        const stones = await page.locator('.stone').count();
        expect(stones).toBe(0);
    });

    test('13. Difficulty selection', async ({ page }) => {
        await page.selectOption('#gameMode', 'pvc');
        
        await page.selectOption('#difficulty', '3');
        
        const difficulty = await page.evaluate(() => window.currentGame.difficulty);
        expect(difficulty).toBe(3);
    });

    test('14. Back to home button', async ({ page }) => {
        await page.click('#backToHome');
        await page.waitForTimeout(1000);
        
        const url = page.url();
        expect(url).toContain('index.html');
    });

    test('15. Language switch', async ({ page }) => {
        await page.selectOption('#language', 'en');
        
        const newGameText = await page.locator('#newGame').textContent();
        expect(newGameText).toBe('New Game');
        
        const modeLabel = await page.locator('#modeLabel').textContent();
        expect(modeLabel).toBe('Mode:');
    });
});
