function generateCrossword(maxWords = 15) {
    let list = [...wordList];
    
    let bestCrossword = null;
    let bestDensity = 0.0;

    for (let attempt = 0; attempt < 100; attempt++) {
        // shuffle array
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
        }

        const maxGrid = 40;
        let grid = Array(maxGrid).fill(null).map(() => Array(maxGrid).fill(null));
        let placedWords = [];

        let minR = Math.floor(maxGrid / 2);
        let maxR = Math.floor(maxGrid / 2);
        let minC = Math.floor(maxGrid / 2);
        let maxC = Math.floor(maxGrid / 2);

        function canPlace(word, r, c, isHorizontal) {
            if (isHorizontal) {
                if (c + word.length > maxGrid) return false;
                for (let i = 0; i < word.length; i++) {
                    if (grid[r][c + i] !== null && grid[r][c + i] !== word[i]) return false;
                    let isIntersection = grid[r][c + i] === word[i];
                    if (!isIntersection) {
                        if (r > 0 && grid[r - 1][c + i] !== null) return false;
                        if (r < maxGrid - 1 && grid[r + 1][c + i] !== null) return false;
                    }
                    if (i === 0 && c > 0 && grid[r][c - 1] !== null) return false;
                    if (i === word.length - 1 && c + i < maxGrid - 1 && grid[r][c + i + 1] !== null) return false;
                }
            } else {
                if (r + word.length > maxGrid) return false;
                for (let i = 0; i < word.length; i++) {
                    if (grid[r + i][c] !== null && grid[r + i][c] !== word[i]) return false;
                    let isIntersection = grid[r + i][c] === word[i];
                    if (!isIntersection) {
                        if (c > 0 && grid[r + i][c - 1] !== null) return false;
                        if (c < maxGrid - 1 && grid[r + i][c + 1] !== null) return false;
                    }
                    if (i === 0 && r > 0 && grid[r - 1][c] !== null) return false;
                    if (i === word.length - 1 && r + i < maxGrid - 1 && grid[r + i + 1][c] !== null) return false;
                }
            }
            return true;
        }

        function place(word, r, c, isHorizontal) {
            for (let i = 0; i < word.length; i++) {
                if (isHorizontal) {
                    grid[r][c + i] = word[i];
                    minC = Math.min(minC, c + i);
                    maxC = Math.max(maxC, c + i);
                } else {
                    grid[r + i][c] = word[i];
                    minR = Math.min(minR, r + i);
                    maxR = Math.max(maxR, r + i);
                }
            }
            if (placedWords.length === 0) {
                if (isHorizontal) {
                    minR = maxR = r;
                } else {
                    minC = maxC = c;
                }
            }
        }

        for (let wData of list) {
            let word = wData.word.toUpperCase();
            let clue = wData.clue;

            if (placedWords.length === 0) {
                let r = Math.floor(maxGrid / 2);
                let c = Math.floor((maxGrid - word.length) / 2);
                place(word, r, c, true);
                placedWords.push({ word, clue, x: c, y: r, isHorizontal: true });
                continue;
            }

            let placements = [];
            for (let pw of placedWords) {
                for (let i = 0; i < word.length; i++) {
                    for (let j = 0; j < pw.word.length; j++) {
                        if (word[i] === pw.word[j]) {
                            let newR = pw.isHorizontal ? pw.y - i : pw.y + j;
                            let newC = pw.isHorizontal ? pw.x + j : pw.x - i;
                            if (newR < 0 || newC < 0) continue;
                            
                            if (canPlace(word, newR, newC, !pw.isHorizontal)) {
                                let intersections = 0;
                                for (let k = 0; k < word.length; k++) {
                                    let cr = !pw.isHorizontal ? newR + k : newR;
                                    let cc = !pw.isHorizontal ? newC : newC + k;
                                    if (cr < maxGrid && cc < maxGrid && grid[cr][cc] !== null) {
                                        intersections++;
                                    }
                                }
                                placements.push({ r: newR, c: newC, isHorizontal: !pw.isHorizontal, intersections, length: word.length });
                            }
                        }
                    }
                }
            }

            if (placements.length > 0) {
                placements.sort((a, b) => {
                    let aMinR = Math.min(minR, a.r);
                    let aMaxR = Math.max(maxR, a.isHorizontal ? a.r : a.r + a.length - 1);
                    let aMinC = Math.min(minC, a.c);
                    let aMaxC = Math.max(maxC, a.isHorizontal ? a.c + a.length - 1 : a.c);
                    let areaA = (aMaxR - aMinR + 1) * (aMaxC - aMinC + 1);

                    let bMinR = Math.min(minR, b.r);
                    let bMaxR = Math.max(maxR, b.isHorizontal ? b.r : b.r + b.length - 1);
                    let bMinC = Math.min(minC, b.c);
                    let bMaxC = Math.max(maxC, b.isHorizontal ? b.c + b.length - 1 : b.c);
                    let areaB = (bMaxR - bMinR + 1) * (bMaxC - bMinC + 1);

                    if (areaA !== areaB) {
                        return areaA - areaB;
                    }
                    return b.intersections - a.intersections;
                });

                let best = placements[0];
                place(word, best.r, best.c, best.isHorizontal);
                placedWords.push({ word, clue, x: best.c, y: best.r, isHorizontal: best.isHorizontal });
            }

            if (placedWords.length >= maxWords) break;
        }

        if (placedWords.length === 0) continue;

        let w = maxC - minC + 1;
        let h = maxR - minR + 1;
        let totalCells = w * h;
        let filledCells = 0;

        let croppedGrid = Array(h).fill(null).map(() => Array(w).fill(null));
        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                croppedGrid[r - minR][c - minC] = grid[r][c];
                if (grid[r][c] !== null) filledCells++;
            }
        }

        let density = filledCells / totalCells;

        let adjustedWords = placedWords.map(pw => ({
            word: pw.word,
            clue: pw.clue,
            x: pw.x - minC,
            y: pw.y - minR,
            isHorizontal: pw.isHorizontal
        }));

        adjustedWords.sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y;
            return a.x - b.x;
        });

        let num = 1;
        for (let i = 0; i < adjustedWords.length; i++) {
            let wObj = adjustedWords[i];
            let existing = adjustedWords.slice(0, i).find(pw => pw.x === wObj.x && pw.y === wObj.y);
            if (existing && existing.number) {
                wObj.number = existing.number;
            } else {
                wObj.number = num++;
            }
        }

        if (!bestCrossword || density > bestDensity) {
            bestDensity = density;
            bestCrossword = { width: w, height: h, grid: croppedGrid, words: adjustedWords };
        }
        
        if (bestDensity >= 0.8) break;
    }

    return bestCrossword || { width: 0, height: 0, grid: [], words: [] };
}
