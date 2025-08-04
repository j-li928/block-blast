const TILE_SIZE = 42;
const board = Array(8).fill(0).map(() => Array(8).fill(0));
const boardColors = Array(8).fill(0).map(() => Array(8).fill(null));

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
        [1, 1, 1, 1],
        [1, 0, 0, 0],
        [1, 0, 0, 0],
        [1, 0, 0, 0],
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

        const { piece, mouseX, mouseY, offsetX, offsetY } = move;

        
        const boardRect = boardEl.getBoundingClientRect();
        const relativeX = mouseX - boardRect.left;
        const relativeY = mouseY - boardRect.top;
        
        const startCol = Math.floor(relativeX / TILE_SIZE) - Math.floor(offsetX / TILE_SIZE);
        const startRow = Math.floor(relativeY / TILE_SIZE) - Math.floor(offsetY / TILE_SIZE);

        if (canPlace(board, piece, startRow, startCol)) {
            const pieceColor = window.selectedPieceColor || null;
            placePiece(board, piece, startRow, startCol, pieceColor);
            
            selectedPiece = null;
            window.selectedPieceColor = null;
            clearPlacementPreview();
            
            setTimeout(() => {
                let totalCleared = clearFullLines();
                let startScore = score;
                let scoreIncrement = calculateScore(piece, totalCleared);
                score += scoreIncrement;
                

                animateScore(startScore, score, 800);
                checkAndSaveHighScore(score)

                
                renderBoard();
                
                
                currentPieces = currentPieces.filter(p => p !== piece);
                
                
                const pieceElements = document.querySelectorAll('.piece');
                for (let i = 0; i < pieceElements.length; i++) {
                    const element = pieceElements[i];
                    if (element.dataset.piece === JSON.stringify(piece)) {
                        element.remove();
                        break;
                    }
                }
                
                
                if (currentPieces.length === 0) {
                    
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
        }
            if (checkGameOver(board, currentPieces)) {
                gameRunning = false;
                showGameOver();
                return;
            }
            runGame(); 
    });
}


function waitForPlayerMove() {
    return new Promise(resolve => {
        window.resolvePlayerMove = resolve;
    });
}

function new3() {
    let piece1 = shapes[Math.floor(Math.random() * shapes.length)];
    let piece2 = shapes[Math.floor(Math.random() * shapes.length)];
    let piece3 = shapes[Math.floor(Math.random() * shapes.length)];
    
    return [piece1, piece2, piece3]
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

function clearRow() {
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


    clearedRows.forEach(row => {
        for (let c=0; c < board[row].length; c++) {
            board[row][c] = 0
            boardColors[row][c] = null
        }
    })
    return numCleared

}

function clearCol() {
    let numCleared = 0;
    const clearedCols = []
    for (let c=0; c < board.length; c++) {
        let isFull = 0;

        for (let r=0; r < board[0].length; r++) {
            if (board[r][c] === 1) {
                isFull++
            }
        }

        if( isFull === board[0].length) {
            clearedCols.push(c)
            numCleared++
        }
    }

    clearedCols.forEach(col => {
        for (let r=0; r < board.length; r++) {
            board[r][col] = 0
            boardColors[r][col] = null
        }
    })
    return numCleared
}

function clearFullLines() {
    let numRows = clearRow()
    let numCols = clearCol()
    const total = numRows + numCols

    return total
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

function placePieceAtMouse(board, shape, mouseX, mouseY, grabbedTileOffsetY, grabbedTileOffsetX) {
    const mouseBoardX = Math.floor(mouseX / TILE_SIZE);
    const mouseBoardY = Math.floor(mouseY / TILE_SIZE);

    const startCol = mouseBoardX - Math.floor(grabbedTileOffsetX / TILE_SIZE);
    const startRow = mouseBoardY - Math.floor(grabbedTileOffsetY / TILE_SIZE);

    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            if (shape[r][c] === 1) {
                board[startRow + r][startCol + c] = 1;
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
      cell.addEventListener('click', handleClick);
      boardEl.appendChild(cell);
    }
  }
  addDragDropListeners();
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

        pieceElement.addEventListener('click', () => {
            selectedPiece = piece;
            document.querySelectorAll('.piece').forEach(p => p.classList.remove('selected'));
            pieceElement.classList.add('selected');
        });

        pieceElement.addEventListener('mousedown', (e) => {
            selectedPiece = piece;
            window.selectedPieceColor = pieceColor;
            
            const rect = pieceElement.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            

            pieceElement.style.position = 'fixed';
            pieceElement.style.left = rect.left + 'px';
            pieceElement.style.top = rect.top + 'px';
            pieceElement.style.zIndex = '1000';
            pieceElement.style.pointerEvents = 'none';
            
            const moveHandler = (e) => {
                pieceElement.style.left = (e.clientX - dragOffsetX) + 'px';
                pieceElement.style.top = (e.clientY - dragOffsetY) + 'px';
            };
            
            const upHandler = () => {
                pieceElement.style.position = '';
                pieceElement.style.zIndex = '';
                pieceElement.style.pointerEvents = '';
                pieceElement.style.left = '';
                pieceElement.style.top = '';
                
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
            };
            
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        });

        pieceElement.addEventListener('dragend', () => {
            selectedPiece = null;
            window.selectedPieceColor = null;
        });

        piecesEl.appendChild(pieceElement);
    });
}

function showGameOver() {
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreEl = document.getElementById('final-score');
    
    if (finalScoreEl) {
        finalScoreEl.textContent = score;
    }
    
    if (gameOverScreen) {
        gameOverScreen.style.display = 'flex';
    }
}

let selectedPiece = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('high-score').textContent = highScore;
    runGame();
});

function handleClick(e) {
    if (!selectedPiece) {
        return;
    }

    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);

    window.resolvePlayerMove({
        piece: selectedPiece,
        row,
        col
    });

    selectedPiece = null;
}


function addDragDropListeners() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.addEventListener('mouseup', (e) => {
            if (selectedPiece) {
                const mouseX = e.clientX;
                const mouseY = e.clientY;
                
                window.resolvePlayerMove({
                    piece: selectedPiece,
                    mouseX: mouseX,
                    mouseY: mouseY,
                    offsetX: dragOffsetX,
                    offsetY: dragOffsetY
                });
            }
        });
        
        cell.addEventListener('mouseenter', (e) => {
            if (selectedPiece) {
                showPlacementPreview(e);
            }
        });
        

        cell.addEventListener('mouseleave', () => {
            clearPlacementPreview();
        });
    });
}

function showPlacementPreview(e) {

    clearPlacementPreview();
    
    const boardRect = boardEl.getBoundingClientRect();
    const relativeX = e.clientX - boardRect.left;
    const relativeY = e.clientY - boardRect.top;
    
    const startCol = Math.floor(relativeX / TILE_SIZE) - Math.floor(dragOffsetX / TILE_SIZE);
    const startRow = Math.floor(relativeY / TILE_SIZE) - Math.floor(dragOffsetY / TILE_SIZE);
    

    if (!canPlace(board, selectedPiece, startRow, startCol)) {
        return;
    }
    
    for (let r = 0; r < selectedPiece.length; r++) {
        for (let c = 0; c < selectedPiece[0].length; c++) {
            if (selectedPiece[r][c] === 1) {
                const boardRow = startRow + r;
                const boardCol = startCol + c;
                
                if (boardRow >= 0 && boardRow < board.length && 
                    boardCol >= 0 && boardCol < board[0].length) {
                    const cell = document.querySelector(`[data-row="${boardRow}"][data-col="${boardCol}"]`);
                    if (cell && board[boardRow][boardCol] === 0) {
                        cell.classList.add('placement-preview');
                    }
                }
            }
        }
    }
}

function clearPlacementPreview() {
    document.querySelectorAll('.placement-preview').forEach(cell => {
        cell.classList.remove('placement-preview');
    });
}

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

function animateScore(startScore, endScore, duration = 150) {
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