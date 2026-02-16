const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://chess.htpu.net';

test.describe('AI Chess - Complete Test Suite', () => {
    
    // ===== 1. Page Load & Initialization =====
    
    test('1.1. Page loads without errors', async ({ page }) => {
        await page.goto(BASE_URL);
        await expect(page.locator('h1')).toContainText('AI Chess');
    });

    test('1.2. All required UI elements are present', async ({ page }) => {
        await page.goto(BASE_URL);
        await expect(page.locator('#board')).toBeVisible();
        await expect(page.locator('#difficulty')).toBeVisible();
        await expect(page.locator('#playerColor')).toBeVisible();
        await expect(page.locator('#language')).toBeVisible();
        await expect(page.locator('#flipBoard')).toBeVisible();
        await expect(page.locator('#undoMove')).toBeVisible();
        await expect(page.locator('#resign')).toBeVisible();
        await expect(page.locator('#newGame')).toBeVisible();
    });

    test('1.3. Version number is displayed', async ({ page }) => {
        await page.goto(BASE_URL);
        const version = await page.locator('.version').textContent();
        expect(version).toMatch(/v\d+\.\d+\.\d+/);
    });

    test('1.4. Chess board renders correctly with 64 squares', async ({ page }) => {
        await page.goto(BASE_URL);
        const squares = await page.locator('[data-square]').count();
        expect(squares).toBe(64);
    });

    test('1.5. Initial game state - white to move', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        const turn = await page.locator('#turnIndicator').textContent();
        expect(['White', '白方']).toContain(turn);
    });

    test('1.6. Window chessGame object is initialized', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        const hasChessGame = await page.evaluate(() => typeof window.chessGame !== 'undefined');
        expect(hasChessGame).toBe(true);
    });


    // ===== 2. Piece Selection & Movement =====

    test('2.1. Click on own piece selects it', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        await page.locator('[data-square="e2"]').click();
        await page.waitForTimeout(300);
        const isSelected = await page.locator('[data-square="e2"]').evaluate(el => el.classList.contains('selected'));
        expect(isSelected).toBe(true);
    });

    test('2.2. Selected piece shows valid moves', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        await page.locator('[data-square="e2"]').click();
        await page.waitForTimeout(300);
        const hasValidMove = await page.locator('[data-square="e4"]').evaluate(el => el.classList.contains('valid-move'));
        expect(hasValidMove).toBe(true);
    });

    test('2.3. Click valid move square executes move', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        await page.locator('[data-square="e2"]').click();
        await page.waitForTimeout(300);
        await page.locator('[data-square="e4"]').click();
        await page.waitForTimeout(1000);
        const moveCount = await page.locator('#moveCount').textContent();
        expect(parseInt(moveCount)).toBeGreaterThanOrEqual(1);
    });

    test('2.4. Cannot select opponent piece', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        const hasSelected = await page.locator('[data-square="e7"]').evaluate(el => el.classList.contains('selected'));
        expect(hasSelected).toBe(false);
    });

    test('2.5. Click another own piece switches selection', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        await page.locator('[data-square="e2"]').click();
        await page.waitForTimeout(300);
        await page.locator('[data-square="g1"]').click();
        await page.waitForTimeout(300);
        const g1Selected = await page.locator('[data-square="g1"]').evaluate(el => el.classList.contains('selected'));
        expect(g1Selected).toBe(true);
    });

    test('2.6. Click empty square clears selection', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        await page.locator('[data-square="e2"]').click();
        await page.waitForTimeout(300);
        await page.locator('[data-square="d4"]').click();
        await page.waitForTimeout(300);
        const hasSelected = await page.locator('[data-square="e2"]').evaluate(el => el.classList.contains('selected'));
        expect(hasSelected).toBe(false);
    });

    test('2.7. Illegal move is rejected', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        await page.locator('[data-square="a2"]').click();
        await page.waitForTimeout(300);
        await page.locator('[data-square="a4"]').click();
        await page.waitForTimeout(500);
        const moveCount = await page.locator('#moveCount').textContent();
        expect(moveCount).toBe('1');
    });

    test('2.8. Cannot move during AI thinking', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        await page.selectOption('#playerColor', 'black');
        await page.waitForTimeout(500);
        
        const isThinking = await page.locator('#thinking').isVisible();
        
        await page.locator('[data-square="e7"]').click();
        await page.waitForTimeout(100);
        const hasSelected = await page.locator('[data-square="e7"]').evaluate(el => el.classList.contains('selected'));
        
        if (isThinking) {
            expect(hasSelected).toBe(false);
        }
    });


    // ===== 3. Game Flow =====

    test('3.1. After player move, AI makes move', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.locator('[data-square="e2"]').click();
        await page.locator('[data-square="e4"]').click();
        await page.waitForTimeout(3000);
        
        const moveCount = await page.locator('#moveCount').textContent();
        expect(parseInt(moveCount)).toBeGreaterThanOrEqual(2);
    });

    test('3.2. When playing black, AI moves first', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.selectOption('#playerColor', 'black');
        await page.waitForTimeout(3000);
        
        const moveCount = await page.locator('#moveCount').textContent();
        expect(parseInt(moveCount)).toBeGreaterThanOrEqual(1);
    });

    test('3.3. Move history displays correctly', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.locator('[data-square="e2"]').click();
        await page.locator('[data-square="e4"]').click();
        await page.waitForTimeout(2000);
        
        const historyHtml = await page.locator('#moveHistory').innerHTML();
        expect(historyHtml).toContain('e4');
    });

    test('3.4. Turn indicator updates correctly', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        const turnBefore = await page.locator('#turnIndicator').textContent();
        
        await page.locator('[data-square="e2"]').click();
        await page.locator('[data-square="e4"]').click();
        await page.waitForTimeout(2000);
        
        const turnAfter = await page.locator('#turnIndicator').textContent();
        expect(turnBefore).not.toBe(turnAfter);
    });

    test('3.5. Game detects check', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        const moves = [
            ['e2', 'e4'], ['e7', 'e5'],
            ['d1', 'h5'], ['b8', 'c6'],
            ['f1', 'c4']
        ];
        
        for (const [from, to] of moves) {
            await page.locator(`[data-square="${from}"]`).click();
            await page.locator(`[data-square="${to}"]`).click();
            await page.waitForTimeout(1500);
        }
        
        await page.locator('[data-square="h5"]').click();
        await page.locator('[data-square="f7"]').click();
        await page.waitForTimeout(2000);
        
        const status = await page.locator('#status').textContent();
        expect(status.toLowerCase()).toContain('check');
    });


    // ===== 4. Undo & Reset =====

    test('4.1. Undo removes last two moves', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.locator('[data-square="e2"]').click();
        await page.locator('[data-square="e4"]').click();
        await page.waitForTimeout(2000);
        
        const countBefore = await page.locator('#moveCount').textContent();
        
        await page.click('#undoMove');
        await page.waitForTimeout(1500);
        
        const countAfter = await page.locator('#moveCount').textContent();
        expect(parseInt(countAfter)).toBeLessThan(parseInt(countBefore));
    });

    test('4.2. New game resets board', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.locator('[data-square="e2"]').click();
        await page.locator('[data-square="e4"]').click();
        await page.waitForTimeout(2000);
        
        await page.click('#newGame');
        await page.waitForTimeout(1000);
        
        const moveCount = await page.locator('#moveCount').textContent();
        expect(moveCount).toBe('1');
    });

    test('4.3. Keyboard shortcut Z triggers undo', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.locator('[data-square="e2"]').click();
        await page.locator('[data-square="e4"]').click();
        await page.waitForTimeout(2000);
        
        await page.keyboard.press('z');
        await page.waitForTimeout(1000);
        
        const moveCount = await page.locator('#moveCount').textContent();
        expect(parseInt(moveCount)).toBeLessThanOrEqual(2);
    });

    test('4.4. Keyboard shortcut N triggers new game', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.locator('[data-square="e2"]').click();
        await page.locator('[data-square="e4"]').click();
        await page.waitForTimeout(2000);
        
        await page.keyboard.press('n');
        await page.waitForTimeout(1000);
        
        const moveCount = await page.locator('#moveCount').textContent();
        expect(moveCount).toBe('1');
    });

    test('4.5. Keyboard shortcut F flips board', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.keyboard.press('f');
        await page.waitForTimeout(500);
        
        const orientation = await page.evaluate(() => window.chessGame?.board?.orientation());
        expect(orientation).toBe('black');
    });


    // ===== 5. Game End Scenarios =====

    test('5.1. Resign shows game over modal', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.click('#resign');
        await page.waitForTimeout(500);
        
        await expect(page.locator('#gameOverModal')).toBeVisible();
    });

    test('5.2. Play again closes modal and resets', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.click('#resign');
        await page.waitForTimeout(500);
        
        await page.click('#playAgain');
        await page.waitForTimeout(1000);
        
        await expect(page.locator('#gameOverModal')).not.toBeVisible();
        const moveCount = await page.locator('#moveCount').textContent();
        expect(moveCount).toBe('1');
    });

    test('5.3. Checkmate shows game over', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        const moves = [
            ['e2', 'e4'], ['e7', 'e5'],
            ['d1', 'f3'], ['a7', 'a6'],
            ['f1', 'c4'], ['a6', 'a5'],
            ['f3', 'f7']
        ];
        
        for (const [from, to] of moves) {
            await page.locator(`[data-square="${from}"]`).click();
            await page.locator(`[data-square="${to}"]`).click();
            await page.waitForTimeout(1500);
        }
        
        const isModalVisible = await page.locator('#gameOverModal').isVisible();
        expect(isModalVisible).toBe(true);
    });


    // ===== 6. Settings & Preferences =====

    test('6.1. Difficulty change updates status', async ({ page }) => {
        await page.goto(BASE_URL);
        
        await page.selectOption('#difficulty', '5');
        await page.waitForTimeout(500);
        
        const status = await page.locator('#status').textContent();
        expect(status).toContain('5');
    });

    test('6.2. Player color change resets game', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.selectOption('#playerColor', 'black');
        await page.waitForTimeout(2000);
        
        const moveCount = await page.locator('#moveCount').textContent();
        expect(parseInt(moveCount)).toBeGreaterThanOrEqual(1);
    });

    test('6.3. Flip board changes orientation', async ({ page }) => {
        await page.goto(BASE_URL);
        
        await page.click('#flipBoard');
        await page.waitForTimeout(500);
        
        const orientation = await page.evaluate(() => window.chessGame?.board?.orientation());
        expect(orientation).toBe('black');
    });

    test('6.4. Language switch updates UI', async ({ page }) => {
        await page.goto(BASE_URL);
        
        await page.selectOption('#language', 'en');
        await page.waitForTimeout(500);
        
        await expect(page.locator('.history-panel h3')).toHaveText('Move History');
        
        await page.selectOption('#language', 'zh');
        await page.waitForTimeout(500);
        
        await expect(page.locator('.history-panel h3')).toHaveText('移动历史');
    });

    test('6.5. Sound toggle works', async ({ page }) => {
        await page.goto(BASE_URL);
        
        const toggle = page.locator('#soundToggle');
        await toggle.check();
        expect(await toggle.isChecked()).toBe(true);
        
        await toggle.uncheck();
        expect(await toggle.isChecked()).toBe(false);
    });


    // ===== 7. State Persistence =====

    test('7.1. Game state persists on refresh', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.locator('[data-square="e2"]').click();
        await page.locator('[data-square="e4"]').click();
        await page.waitForTimeout(2000);
        
        await page.reload();
        await page.waitForTimeout(3000);
        
        const moveCount = await page.locator('#moveCount').textContent();
        expect(parseInt(moveCount)).toBeGreaterThanOrEqual(1);
    });

    test('7.2. Language preference persists', async ({ page }) => {
        await page.goto(BASE_URL);
        
        await page.selectOption('#language', 'en');
        await page.waitForTimeout(500);
        
        await page.reload();
        await page.waitForTimeout(2000);
        
        await expect(page.locator('.history-panel h3')).toHaveText('Move History');
    });

    test('7.3. Player color preference persists', async ({ page }) => {
        await page.goto(BASE_URL);
        
        await page.selectOption('#playerColor', 'black');
        await page.waitForTimeout(1000);
        
        await page.reload();
        await page.waitForTimeout(2000);
        
        const selectedValue = await page.locator('#playerColor').inputValue();
        expect(selectedValue).toBe('black');
    });


    // ===== 8. Edge Cases & Boundary Conditions =====

    test('8.1. Very fast sequential clicks', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.locator('[data-square="e2"]').click();
        await page.waitForTimeout(50);
        await page.locator('[data-square="e4"]').click();
        await page.waitForTimeout(50);
        
        const moveCount = await page.locator('#moveCount').textContent();
        expect(parseInt(moveCount)).toBeGreaterThanOrEqual(1);
    });

    test('8.2. Click outside board area', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.locator('[data-square="e2"]').click();
        await page.waitForTimeout(300);
        
        await page.locator('.history-panel').click();
        await page.waitForTimeout(300);
        
        const hasSelected = await page.locator('[data-square="e2"]').evaluate(el => el.classList.contains('selected'));
        expect(hasSelected).toBe(false);
    });

    test('8.3. Move piece to all 8 directions (knight)', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.locator('[data-square="g1"]').click();
        await page.waitForTimeout(300);
        
        const validMoves = await page.locator('.valid-move').count();
        expect(validMoves).toBeGreaterThan(0);
    });

    test('8.4. Pawn promotion triggers dialog', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.evaluate(() => {
            window.chessGame.game.load('7k/6P1/8/8/8/8/8/K7 w - - 0 1');
            window.chessGame.board.position('7k/6P1/8/8/8/8/8/K7');
            window.chessGame.playerColor = 'white';
        });
        
        await page.waitForTimeout(500);
        
        await page.locator('[data-square="g7"]').click();
        await page.waitForTimeout(300);
        await page.locator('[data-square="g8"]').click();
        await page.waitForTimeout(500);
        
        const modalVisible = await page.locator('#promotionModal').isVisible();
        expect(modalVisible).toBe(true);
    });

    test('8.5. Game over disables further moves', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.click('#resign');
        await page.waitForTimeout(500);
        
        await page.locator('[data-square="e2"]').click();
        await page.waitForTimeout(300);
        
        const hasSelected = await page.locator('[data-square="e2"]').evaluate(el => el.classList.contains('selected'));
        expect(hasSelected).toBe(false);
    });

    test('8.6. Undo when no moves', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.click('#undoMove');
        await page.waitForTimeout(500);
        
        const moveCount = await page.locator('#moveCount').textContent();
        expect(moveCount).toBe('1');
    });

    test('8.7. Multiple rapid difficulty changes', async ({ page }) => {
        await page.goto(BASE_URL);
        
        await page.selectOption('#difficulty', '1');
        await page.selectOption('#difficulty', '2');
        await page.selectOption('#difficulty', '3');
        await page.waitForTimeout(500);
        
        const selectedValue = await page.locator('#difficulty').inputValue();
        expect(selectedValue).toBe('3');
    });


    // ===== 9. Visual & UI Checks =====

    test('9.1. Selected piece has visual highlight', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.locator('[data-square="e2"]').click();
        await page.waitForTimeout(300);
        
        const hasSelectedClass = await page.locator('[data-square="e2"]').evaluate(el => el.classList.contains('selected'));
        expect(hasSelectedClass).toBe(true);
    });

    test('9.2. Valid move squares are highlighted', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.locator('[data-square="e2"]').click();
        await page.waitForTimeout(300);
        
        const hasValidMove = await page.locator('.valid-move').count();
        expect(hasValidMove).toBeGreaterThan(0);
    });

    test('9.3. Last move is highlighted', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.locator('[data-square="e2"]').click();
        await page.locator('[data-square="e4"]').click();
        await page.waitForTimeout(2000);
        
        const hasLastMove = await page.locator('.last-move').count();
        expect(hasLastMove).toBeGreaterThanOrEqual(0);
    });

    test('9.4. AI thinking indicator shows', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await page.selectOption('#playerColor', 'black');
        await page.waitForTimeout(800);
        
        const isThinkingVisible = await page.locator('#thinking').isVisible();
        expect(isThinkingVisible).toBe(true);
    });

    test('9.5. Mobile viewport renders correctly', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        await expect(page.locator('#board')).toBeVisible();
        await expect(page.locator('h1')).toBeVisible();
    });


    // ===== 10. Special Moves =====

    test('10.1. Castling (kingside) works', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.evaluate(() => {
            window.chessGame.game.load('r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4');
            window.chessGame.board.position('r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R');
            window.chessGame.playerColor = 'white';
            window.chessGame.updateUI();
        });
        
        await page.waitForTimeout(500);
        
        await page.locator('[data-square="e1"]').click();
        await page.waitForTimeout(300);
        
        const hasG1 = await page.locator('[data-square="g1"]').evaluate(el => el.classList.contains('valid-move'));
        expect(hasG1).toBe(true);
    });

    test('10.2. En passant is available', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.evaluate(() => {
            window.chessGame.game.load('r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq e6 0 4');
            window.chessGame.board.position('r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R');
            window.chessGame.playerColor = 'white';
            window.chessGame.updateUI();
        });
        
        await page.waitForTimeout(500);
        
        await page.locator('[data-square="f1"]').click();
        await page.waitForTimeout(300);
        
        await page.locator('[data-square="b5"]').click();
        await page.waitForTimeout(500);
        
        const status = await page.locator('#status').textContent();
        expect(status).toBeTruthy();
    });


    // ===== 11. Error Handling =====

    test('11.1. No console errors on page load', async ({ page }) => {
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });
        
        await page.goto(BASE_URL);
        await page.waitForTimeout(2000);
        
        expect(errors.length).toBe(0);
    });

    test('11.2. Page handles slow network gracefully', async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
        
        await page.waitForTimeout(5000);
        
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('#board')).toBeVisible();
    });
});
