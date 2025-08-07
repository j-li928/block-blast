const TILE_SIZE = 42;
const board = Array(8).fill(0).map(() => Array(8).fill(0));
const boardColors = Array(8).fill(0).map(() => Array(8).fill(null));

const clickSounds = [
    new Audio("click.wav"),
    new Audio("click1.mp3"),
    new Audio("click2.mp3"),
    new Audio("click3.mp3")
]


clickSounds.forEach(sound => {
    sound.volume = 0.5;
});

const gameOverSound = new Audio("gameOver.mp3");
gameOverSound.volume = 0.4;


let isMuted = false;
let userHasInteracted = false;

const soundToggle = document.getElementById("sound-toggle");
soundToggle.addEventListener("click", () => {
  isMuted = !isMuted;
  soundToggle.textContent = isMuted ? " Sound: Off" : " Sound: On";
});

const clearLineSound = new Audio("clearLine.mp3");
clearLineSound.volume = 0.3;


const shapes = [
    [[1, 1, 1, 1, 1]],
    [[1, 1, 1, 1]],
    [[1, 1, 1]],
    [[1, 1]],
    [
        [1, 1, 1],
        [1, 1, 0]
    ],
    [
        [1, 1, 1],
        [1, 0, 0],
        [1, 0, 0],
        [1, 0, 0],
    ],
    [
        [1, 1],
        [1, 1],
        [1, 1]
    ],
    [
        [1, 0, 0],
        [1, 0, 0],
        [1, 1, 1]
    ],
    [
        [1, 1, 1],
        [1, 0, 0],
        [1, 0, 0]
    ],
    [
        [1, 1, 1],
        [0, 0, 1],
        [0, 0, 1],
        [0, 0, 1]
    ],
    [
        [1],
        [1],
        [1],
        [1]
    ],
    [
        [1],
        [1],
        [1],
        [1],
        [1],
        [1]
    ],
    [
        [0, 1, 0],
        [1, 1, 1]
    ],
    [
        [1, 1],
        [1, 1]
    ],
    [
        [0, 1, 1],
        [1, 1, 0]
    ],
    [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1]
    ]
];
const pieceColors = ['#FF6B6B', '#6BCB77', '#4D96FF', '#FFD93D', '#A66DD4', '#FF8E00'];


let currentPieces = [];
let gameRunning = true;
const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;

function runGame() {
    if (currentPieces.length < 1) {
        currentPieces = generatePlaceablePieces(); 
        renderPieces(currentPieces); 
        

        if (checkGameOver(board, currentPieces)) {
            gameRunning = false;
            showGameOver();
            return;
        }
    }
 
    renderBoard();

    if (checkGameOver(board, currentPieces)) {
        gameRunning = false;
        showGameOver();
        return;
    }

    waitForPlayerMove().then(move => {
        if (!move) return;

        const { piece, startRow, startCol, color } = move;

        if (canPlace(board, piece, startRow, startCol)) {
            placePiece(board, piece, startRow, startCol, color);
            playRandomClick();
            
            selectedPiece = null;
            window.selectedPieceColor = null;
            clearGhostPreview();
            
            setTimeout(async () => {
                let totalCleared = await clearFullLines();
                let startScore = score;
                let scoreIncrement = calculateScore(piece, totalCleared);
                score += scoreIncrement;
                

                animateScore(startScore, score, 800);
                checkAndSaveHighScore(score)

                
                renderBoard();
                
                

                const pieceIndex = currentPieces.indexOf(piece);
                if (pieceIndex !== -1) {
                    currentPieces.splice(pieceIndex, 1);
                }
                

                const pieceElements = document.querySelectorAll('.piece');
                if (pieceElements[pieceIndex]) {
                    pieceElements[pieceIndex].remove();
                }
                
                
                if (currentPieces.length < 1) {
                    
                    currentPieces = generatePlaceablePieces();
                    renderPieces(currentPieces);
                    
                    if (checkGameOver(board, currentPieces)) {
                        gameRunning = false;
                        showGameOver();
                        return;
                    }
                }

                runGame(); 
            }, 300);
        } else {
            if (checkGameOver(board, currentPieces)) {
                gameRunning = false;
                showGameOver();
                return;
            }
            runGame(); 
        }
    });
}


function waitForPlayerMove() {
    return new Promise(resolve => {
        window.resolvePlayerMove = resolve;
    });
}

function canPlaceAnywhere(board, piece) {
    for (let r = 0; r <= board.length - piece.length; r++) {
        for (let c = 0; c <= board[0].length - piece[0].length; c++) {
            if (canPlace(board, piece, r, c)) {
                return true;
            }
        }
    }
    return false;
}

function generatePlaceablePieces() {
    let attempts = 0;
    const maxAttempts = 100; 
    
    while (attempts < maxAttempts) {
        let piece1 = shapes[Math.floor(Math.random() * shapes.length)];
        let piece2 = shapes[Math.floor(Math.random() * shapes.length)];
        let piece3 = shapes[Math.floor(Math.random() * shapes.length)];
        

        if (canPlaceAnywhere(board, piece1) && 
            canPlaceAnywhere(board, piece2) && 
            canPlaceAnywhere(board, piece3)) {
            return [piece1, piece2, piece3];
        }
        
        attempts++;
    }
    

    return [
        shapes[Math.floor(Math.random() * shapes.length)],
        shapes[Math.floor(Math.random() * shapes.length)],
        shapes[Math.floor(Math.random() * shapes.length)]
    ];
}

function canPlace(board, shape, startRow, startCol) {
    if (!shape || !Array.isArray(shape) || shape.length === 0 || !Array.isArray(shape[0])) {
        return false;
    }
    
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            if (shape[r] && shape[r][c] === 1) {
                const boardRow = startRow + r;
                const boardCol = startCol + c;

                if (
                    boardRow < 0 || boardRow >= board.length ||
                    boardCol < 0 || boardCol >= board[0].length
                ) {
                    return false;
                }

                if (board[boardRow][boardCol] !== 0) {
                    return false;
                }
            }
        }
    }

    return true;
}

function findFullRows() {
    let numCleared = 0;
    const clearedRows = []
    for (let r=0; r < board.length; r++) {
        let isFull = 0;

        for (let c=0; c < board[0].length; c++) {
            if (board[r][c] === 1) {
                isFull++
            }
        }

        if( isFull === board[0].length) {
            clearedRows.push(r)
            numCleared++
        }
    }

    return { rows: clearedRows, count: numCleared }
}

function findFullCols() {
    let numCleared = 0;
    const clearedCols = []
    for (let c=0; c < board[0].length; c++) {
        let isFull = 0;

        for (let r=0; r < board.length; r++) {
            if (board[r][c] === 1) {
                isFull++
            }
        }

        if( isFull === board.length) {
            clearedCols.push(c)
            numCleared++
        }
    }

    return { cols: clearedCols, count: numCleared }
}

function clearFullLines() {
    const fullRows = findFullRows();
    const fullCols = findFullCols();
    

    if (fullRows.count > 0 || fullCols.count > 0) {
        safePlayAudio(clearLineSound);
    }
    
    const cellsToAnimate = [];


    
    fullRows.rows.forEach(row => {
        for (let c = 0; c < board[0].length; c++) {
            cellsToAnimate.push({row, col: c, type: 'row'});
        }
    });
    
    fullCols.cols.forEach(col => {
        for (let r = 0; r < board.length; r++) {
            cellsToAnimate.push({row: r, col, type: 'col'});
        }
    });
    
    const total = fullRows.count + fullCols.count;
    
    if (cellsToAnimate.length > 0) {
        return new Promise((resolve) => {
            animateLineClear(cellsToAnimate, () => {

                fullRows.rows.forEach(row => {
                    for (let c = 0; c < board[0].length; c++) {
                        board[row][c] = 0;
                        boardColors[row][c] = null;
                    }
                });
                
                fullCols.cols.forEach(col => {
                    for (let r = 0; r < board.length; r++) {
                        board[r][col] = 0;
                        boardColors[r][col] = null;
                    }
                });
                
                renderBoard();
                resolve(total);
            });
        });
    } else {
        return Promise.resolve(total);
    }
}

function animateLineClear(cellsToAnimate, callback) {

    cellsToAnimate.forEach((cell, index) => {
        setTimeout(() => {
            const cellElement = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
            if (cellElement) {
                cellElement.classList.add('line-clear-flash');
            }
        }, index * 20); 
    });
    

    setTimeout(() => {
        cellsToAnimate.forEach((cell, index) => {
            setTimeout(() => {
                const cellElement = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
                if (cellElement) {
                    cellElement.classList.add('line-clear-scale');
                }
            }, index * 10);
        });
    }, 200);
    

    setTimeout(() => {
        cellsToAnimate.forEach((cell, index) => {
            setTimeout(() => {
                const cellElement = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
                if (cellElement) {
                    cellElement.classList.add('line-clear-disappear');
                }
            }, index * 15);
        });
        

        setTimeout(callback, cellsToAnimate.length * 15 + 300);
    }, 400);
}


function checkGameOver(board, currentPieces) {
    for (let piece of currentPieces) {
        const pieceRows = piece.length;
        const pieceCols = piece[0].length;

        for (let r = 0; r <= board.length - pieceRows; r++) {
            for (let c = 0; c <= board[0].length - pieceCols; c++) {
                if (canPlace(board, piece, r, c)) {
                    return false;
                }
            }
        }
    }
    return true;
}



function placePiece(board, shape, startRow, startCol, color) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            if (shape[r][c] === 1) {
                board[startRow + r][startCol + c] = 1;
                boardColors[startRow + r][startCol + c] = color;
            }
        }
    }
    
    renderBoard();
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            if (shape[r][c] === 1) {
                const cell = document.querySelector(`[data-row="${startRow + r}"][data-col="${startCol + c}"]`);
                if (cell) {
                    cell.classList.add('new-piece');
                    setTimeout(() => {
                        cell.classList.remove('new-piece');
                    }, 300);
                }
            }
        }
    }


}


function renderBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      if (board[r][c] === 1) {
        if (boardColors[r][c]) {
          cell.style.backgroundColor = boardColors[r][c];
        } else {
          cell.style.backgroundColor = '#666'; 
        }
        cell.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.4), inset 0 -1px 1px rgba(255,255,255,0.2)';
      }
      cell.dataset.row = r;
      cell.dataset.col = c;
      boardEl.appendChild(cell);
    }
  }
}

const piecesEl = document.getElementById('pieces');

function renderPieces(pieces) {
    piecesEl.innerHTML = ''; 

    pieces.forEach((piece, i) => {
        const pieceElement = document.createElement('div');
        pieceElement.id = `piece-${i}`;
        pieceElement.classList.add('piece');
        pieceElement.classList.add(`piece${i + 1}`);
        pieceElement.dataset.pieceIndex = i;
        pieceElement.dataset.piece = JSON.stringify(piece);

        const pieceColor = pieceColors[Math.floor(Math.random() * pieceColors.length)];
        pieceElement.dataset.color = pieceColor;

        piece.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.style.display = 'flex';
            row.forEach(cell => {
                const block = document.createElement('div');
                block.classList.add('block');
                if (cell === 1) {
                    block.style.backgroundColor = pieceColor;
                    block.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.6), inset 0 -1px 1px rgba(255,255,255,0.6)';
                }
                rowDiv.appendChild(block);
            });
            pieceElement.appendChild(rowDiv);
        });

        pieceElement.style.transform = 'scale(0.5)';
        pieceElement.style.transition = 'transform 0.3s ease';

        pieceElement.addEventListener('mousedown', (e) => {
            e.preventDefault();
            userHasInteracted = true;
            selectedPiece = piece;
            window.selectedPieceColor = pieceColor;

            const boardRect = boardEl.getBoundingClientRect();
            const boardCenterX = boardRect.left + (boardRect.width / 2);
            const boardBottomY = boardRect.bottom - 50;
            

            pieceElement.style.position = 'fixed';
            pieceElement.style.left = boardCenterX + 'px';
            pieceElement.style.top = boardBottomY + 'px';
            pieceElement.style.transform = 'translate(-50%, -50%) scale(1.0)';
            pieceElement.style.zIndex = '1000';
            pieceElement.style.transition = 'none';
            

            const startMouseX = e.clientX;
            const startMouseY = e.clientY;
            
            pieceElement.classList.add('dragging');
            
            const moveHandler = (e) => {
                e.preventDefault();
                
                const deltaX = e.clientX - startMouseX;
                const deltaY = e.clientY - startMouseY;
                
                pieceElement.style.left = (boardCenterX + deltaX) + 'px';
                pieceElement.style.top = (boardBottomY + deltaY) + 'px';
                pieceElement.style.transform = 'translate(-50%, -50%) scale(1.0)';
                
                showGhostPreviewFromPiecePosition(pieceElement);
            };
            
            const upHandler = (e) => {
                pieceElement.classList.remove('dragging');
                pieceElement.style.position = '';
                pieceElement.style.zIndex = '';
                pieceElement.style.left = '';
                pieceElement.style.top = '';
                pieceElement.style.transform = 'scale(0.5)';
                pieceElement.style.transition = 'transform 0.3s ease';
                
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
                

                const boardRect = boardEl.getBoundingClientRect();
                const pieceRect = pieceElement.getBoundingClientRect();


                const pieceLeft = pieceRect.left;
                const pieceTop = pieceRect.top;
                

                const boardX = pieceLeft - boardRect.left;
                const boardY = pieceTop - boardRect.top;
                
                const col = Math.floor(boardX / TILE_SIZE);
                const row = Math.floor(boardY / TILE_SIZE);
                

                

                const ghostCells = document.querySelectorAll('.ghost-preview');
                if (ghostCells.length > 0) {

                    let minRow = 8, minCol = 8;
                    ghostCells.forEach(cell => {
                        const row = parseInt(cell.dataset.row);
                        const col = parseInt(cell.dataset.col);
                        if (row < minRow) minRow = row;
                        if (col < minCol) minCol = col;
                    });
                    

                    
                    if (canPlace(board, selectedPiece, minRow, minCol)) {
                        window.resolvePlayerMove({
                            piece: selectedPiece,
                            startRow: minRow,
                            startCol: minCol,
                            color: window.selectedPieceColor
                        });
                    } 
                } 
                clearGhostPreview();
                selectedPiece = null;
                window.selectedPieceColor = null;
            };
            
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        });

        piecesEl.appendChild(pieceElement);
    });
}

function showGameOver() {
    renderBoard();
    
    fadeOutBoard();
    

    setTimeout(() => {
        const gameOverScreen = document.getElementById('game-over-screen');
        const finalScoreEl = document.getElementById('final-score');
        
        if (finalScoreEl) {
            finalScoreEl.textContent = score;
        }
        
        if (gameOverScreen) {
            gameOverScreen.style.display = 'flex';
        }
    }, 2700); 
}

let selectedPiece = null;

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('high-score').textContent = highScore;
    runGame();
});

function calculateScore(piece, linesCleared) {
    let pieceSize = 0;
    for (let r = 0; r < piece.length; r++){
        for (let c = 0; c < piece[0].length; c++){
            if (piece[r][c] === 1){
                pieceSize++
            }
        }
    }
    let bonus = 10 * linesCleared;
    return pieceSize + bonus;
}

function restartGame() {
    for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[0].length; c++) {
            board[r][c] = 0;
            boardColors[r][c] = null;
        }
    }
    
    score = 0;
    currentPieces = [];
    gameRunning = true;
    
    scoreEl.textContent = score;
    
    document.getElementById('high-score').textContent = highScore;
    
    const gameOverScreen = document.getElementById('game-over-screen');
    if (gameOverScreen) {
        gameOverScreen.style.display = 'none';
    }
    
    renderBoard();
    currentPieces = generatePlaceablePieces();
    renderPieces(currentPieces);
    runGame();
}

function animateScore(startScore, endScore, duration = 200) {
    const scoreEl = document.getElementById('score');
    
    if (duration <= 16) {
        scoreEl.textContent = endScore;
        return;
    }
    
    const stepDelay = Math.max(1, Math.floor(duration / 20));
    let currentScore = startScore;
    
    function updateScore() {
        if (currentScore < endScore) {
            currentScore = Math.min(currentScore + 1, endScore);
            scoreEl.textContent = currentScore;
            
            if (currentScore < endScore) {
                setTimeout(updateScore, stepDelay);
            }
        }
    }
    
    updateScore();
}

function checkAndSaveHighScore(currentScoreInt) {
    let currentScore = parseInt(currentScoreInt);
    if (currentScore > highScore) {
        highScore = currentScore;
        localStorage.setItem('highScore', highScore)
    }
    document.getElementById('high-score').textContent = highScore;
}

function checkPotentialLineCompletions(piece, startRow, startCol) {
    const potentialCompletions = {
        rows: [],
        cols: []
    };
    

    const tempBoard = board.map(row => [...row]);
    

    for (let r = 0; r < piece.length; r++) {
        for (let c = 0; c < piece[0].length; c++) {
            if (piece[r][c] === 1) {
                const boardRow = startRow + r;
                const boardCol = startCol + c;
                if (boardRow >= 0 && boardRow < board.length && 
                    boardCol >= 0 && boardCol < board[0].length) {
                    tempBoard[boardRow][boardCol] = 1;
                }
            }
        }
    }
    
    for (let r = 0; r < board.length; r++) {
        let isFull = true;
        for (let c = 0; c < board[0].length; c++) {
            if (tempBoard[r][c] !== 1) {
                isFull = false;
                break;
            }
        }
        if (isFull) {
            potentialCompletions.rows.push(r);
        }
    }
    
    for (let c = 0; c < board[0].length; c++) {
        let isFull = true;
        for (let r = 0; r < board.length; r++) {
            if (tempBoard[r][c] !== 1) {
                isFull = false;
                break;
            }
        }
        if (isFull) {
            potentialCompletions.cols.push(c);
        }
    }
    
    return potentialCompletions;
}

function showGhostPreviewFromPiecePosition(pieceElement) {
    clearGhostPreview();
    
    const boardRect = boardEl.getBoundingClientRect();
    const pieceRect = pieceElement.getBoundingClientRect();
    
    const pieceLeft = pieceRect.left;
    const pieceTop = pieceRect.top;
    
    const boardX = pieceLeft - boardRect.left;
    const boardY = pieceTop - boardRect.top;
    
    const col = Math.floor(boardX / TILE_SIZE);
    const row = Math.floor(boardY / TILE_SIZE);
    
    if (col >= 0 && col < 8 && row >= 0 && row < 8) {

        if (canPlace(board, selectedPiece, row, col)) {

            const completions = checkPotentialLineCompletions(selectedPiece, row, col);
            

            for (let r = 0; r < selectedPiece.length; r++) {
                for (let c = 0; c < selectedPiece[0].length; c++) {
                    if (selectedPiece[r][c] === 1) {
                        const boardRow = row + r;
                        const boardCol = col + c;
                        
                        if (boardRow >= 0 && boardRow < board.length && 
                            boardCol >= 0 && boardCol < board[0].length) {
                            const cell = document.querySelector(`[data-row="${boardRow}"][data-col="${boardCol}"]`);
                            if (cell && board[boardRow][boardCol] === 0) {
                                cell.classList.add('ghost-preview');
                                cell.style.backgroundColor = window.selectedPieceColor + '80';
                                cell.style.border = '2px dashed ' + window.selectedPieceColor;
                            }
                        }
                    }
                }
            }
            

            highlightPotentialCompletions(completions);
        }
    }
}

function highlightPotentialCompletions(completions) {

    completions.rows.forEach(row => {
        for (let c = 0; c < board[0].length; c++) {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${c}"]`);
            if (cell) {
                cell.classList.add('potential-completion');
                cell.style.boxShadow = '0 0 10px #FFD700, inset 0 0 5px #FFD700';
            }
        }
    });
    

    completions.cols.forEach(col => {
        for (let r = 0; r < board.length; r++) {
            const cell = document.querySelector(`[data-row="${r}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('potential-completion');
                cell.style.boxShadow = '0 0 10px #FFD700, inset 0 0 5px #FFD700';
            }
        }
    });
}

function clearGhostPreview() {
    document.querySelectorAll('.ghost-preview').forEach(cell => {
        cell.classList.remove('ghost-preview');
        cell.style.backgroundColor = '';
        cell.style.border = '';
    });
    

    document.querySelectorAll('.potential-completion').forEach(cell => {
        cell.classList.remove('potential-completion');
        cell.style.boxShadow = '';
    });
}

function fadeOutBoard() {
    
    safePlayAudio(gameOverSound);


    document.querySelectorAll('.line-clear-flash, .line-clear-scale, .line-clear-disappear, .potential-completion, .ghost-preview').forEach(cell => {
        cell.classList.remove('line-clear-flash', 'line-clear-scale', 'line-clear-disappear', 'potential-completion', 'ghost-preview');
        cell.style.boxShadow = '';
        cell.style.backgroundColor = '';
        cell.style.border = '';
    });


    const filledCells = [];
    for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[0].length; c++) {
            if (board[r][c] === 1) {
                const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (cell) {
                    filledCells.push(cell);
                }
            }
        }
    }
    

    filledCells.forEach((cell, index) => {
        setTimeout(() => {
            cell.classList.add('dissolve');
        }, index * 50); 
    });
}

function playRandomClick() {
    if(isMuted) return;
    
    const sound = clickSounds[Math.floor(Math.random() * clickSounds.length)];
    sound.currentTime = 0;
    sound.play().catch(error => {
        console.log('Audio play prevented by browser autoplay policy');
    });
}

function safePlayAudio(audio) {
    if (isMuted || !userHasInteracted) return;
    
    console.log('Attempting to play audio:', audio.src);
    audio.currentTime = 0;
    audio.play().catch(error => {
        console.log('Audio play failed:', error);
        console.log('Audio src:', audio.src);
        console.log('Audio readyState:', audio.readyState);
    });
}
