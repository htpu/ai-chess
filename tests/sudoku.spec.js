const { test, expect } = require('@playwright/test');

test.describe('Sudoku Game Tests', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080/sudoku.html');
        await page.waitForTimeout(1000);
    });

    test('1. Page loads correctly', async ({ page }) => {
        const title = await page.title();
        expect(title).toBe('AI Sudoku');
        
        const cells = await page.locator('.cell').count();
        expect(cells).toBe(81);
        
        const numpad = await page.locator('.num-btn').count();
        expect(numpad).toBe(10);
    });

    test('2. New game generates puzzle', async ({ page }) => {
        const filledCells = await page.locator('.cell:not(:empty)').count();
        expect(filledCells).toBeGreaterThan(20);
        expect(filledCells).toBeLessThan(50);
    });

    test('3. Difficulty changes puzzle density', async ({ page }) => {
        await page.selectOption('#difficulty', 'easy');
        await page.click('#newGame');
        await page.waitForTimeout(500);
        const easyFilled = await page.locator('.cell:not(:empty)').count();
        
        await page.selectOption('#difficulty', 'expert');
        await page.click('#newGame');
        await page.waitForTimeout(500);
        const expertFilled = await page.locator('.cell:not(:empty)').count();
        
        expect(easyFilled).toBeGreaterThan(expertFilled);
    });

    test('4. Cell selection works', async ({ page }) => {
        await page.locator('.cell').nth(10).click();
        
        const selected = await page.locator('.cell.selected').count();
        expect(selected).toBe(1);
        
        const selectedIndex = await page.locator('.cell.selected').getAttribute('data-index');
        expect(selectedIndex).toBe('10');
    });

    test('5. Number input via keyboard', async ({ page }) => {
        const emptyCell = await page.locator('.cell:not(.fixed)').first();
        const emptyIndex = await emptyCell.getAttribute('data-index');
        
        await emptyCell.click();
        await page.keyboard.press('5');
        
        const cellValue = await page.locator(`.cell[data-index="${emptyIndex}"]`).textContent();
        expect(cellValue).toBe('5');
    });

    test('6. Number input via numpad', async ({ page }) => {
        const emptyCell = await page.locator('.cell:not(.fixed)').first();
        const emptyIndex = await emptyCell.getAttribute('data-index');
        
        await emptyCell.click();
        await page.click('.num-btn[data-num="7"]');
        
        const cellValue = await page.locator(`.cell[data-index="${emptyIndex}"]`).textContent();
        expect(cellValue).toBe('7');
    });

    test('7. Clear cell with backspace', async ({ page }) => {
        const emptyCell = await page.locator('.cell:not(.fixed)').first();
        
        await emptyCell.click();
        await page.keyboard.press('5');
        
        const hasValue = await emptyCell.textContent();
        expect(hasValue).toBe('5');
        
        await page.keyboard.press('Backspace');
        
        const isEmpty = await emptyCell.textContent();
        expect(isEmpty).toBe('');
    });

    test('8. Cannot modify fixed cells', async ({ page }) => {
        const fixedCell = await page.locator('.cell.fixed').first();
        const fixedIndex = await fixedCell.getAttribute('data-index');
        const originalValue = await fixedCell.textContent();
        
        await fixedCell.click();
        await page.keyboard.press('9');
        
        const newValue = await page.locator(`.cell[data-index="${fixedIndex}"]`).textContent();
        expect(newValue).toBe(originalValue);
    });

    test('9. Highlighting - same number', async ({ page }) => {
        await page.locator('.cell').nth(0).click();
        
        const sameNumbers = await page.locator('.cell.same-number').count();
        expect(sameNumbers).toBeGreaterThan(0);
    });

    test('10. Highlighting - row/col/box', async ({ page }) => {
        await page.locator('.cell').nth(10).click();
        
        const rowHighlight = await page.locator('.cell.highlight-row').count();
        const colHighlight = await page.locator('.cell.highlight-col').count();
        const boxHighlight = await page.locator('.cell.highlight-box').count();
        
        expect(rowHighlight).toBe(9);
        expect(colHighlight).toBe(9);
        expect(boxHighlight).toBe(9);
    });

    test('11. Undo function', async ({ page }) => {
        const emptyCell = await page.locator('.cell:not(.fixed)').first();
        const emptyIndex = await emptyCell.getAttribute('data-index');
        
        await emptyCell.click();
        await page.keyboard.press('5');
        
        let value = await page.locator(`.cell[data-index="${emptyIndex}"]`).textContent();
        expect(value).toBe('5');
        
        await page.click('#undo');
        
        value = await page.locator(`.cell[data-index="${emptyIndex}"]`).textContent();
        expect(value).toBe('');
    });

    test('12. Solve function', async ({ page }) => {
        await page.click('#solve');
        await page.waitForTimeout(500);
        
        const allFilled = await page.locator('.cell:not(:empty)').count();
        expect(allFilled).toBe(81);
        
        const hasMessage = await page.locator('#message').textContent();
        expect(hasMessage).toBe('已解题');
    });

    test('13. New game resets board', async ({ page }) => {
        await page.click('#solve');
        await page.waitForTimeout(500);
        
        const firstBoard = await page.locator('.cell').first().textContent();
        
        await page.click('#newGame');
        await page.waitForTimeout(500);
        
        const secondBoard = await page.locator('.cell').first().textContent();
        expect(secondBoard).not.toBe(firstBoard);
    });

    test('14. Completion detection - wrong answer', async ({ page }) => {
        const cells = await page.locator('.cell:not(.fixed)').all();
        
        for (const cell of cells) {
            const index = await cell.getAttribute('data-index');
            const fixedCell = await page.locator(`.cell[data-index="${index}"].fixed`).count();
            
            if (fixedCell === 0) {
                await cell.click();
                await page.keyboard.press('1');
            }
        }
        
        const message = await page.locator('#message').textContent();
        expect(message).toBe('答案错误');
    });

    test('15. Clear button works', async ({ page }) => {
        const emptyCell = await page.locator('.cell:not(.fixed)').first();
        
        await emptyCell.click();
        await page.keyboard.press('5');
        
        let value = await emptyCell.textContent();
        expect(value).toBe('5');
        
        await page.click('#erase');
        
        value = await emptyCell.textContent();
        expect(value).toBe('');
    });

    test('16. Back to home button', async ({ page }) => {
        await page.click('#backToHome');
        await page.waitForTimeout(1000);
        
        const url = page.url();
        expect(url).toContain('index.html');
    });

    test('17. Language switch', async ({ page }) => {
        await page.selectOption('#language', 'en');
        
        const newGameText = await page.locator('#newGame').textContent();
        expect(newGameText).toBe('New Game');
        
        const diffLabel = await page.locator('#difficultyLabel').textContent();
        expect(diffLabel).toBe('Difficulty:');
    });
});
