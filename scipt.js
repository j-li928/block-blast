const TILE_SIZE = 42;
const board = Array(8).fill(0).map(() => Array(8).fill(0));
const boardColors = Array(8).fill(0).map(() => Array(8).fill(null));

const shapes = [
    [[1, 1, 1, 1, 1]],
    [[1, 1, 1, 1]],
    [[1, 1, 1]],
    [[1, 1]],
    [[1]],
    [
        [1, 1, 1],
        [1, 1, 0]
    ],
    [
        [1, 1, 1, 1],
        [1, 0, 0, 0],
        [1, 0, 0, 0],
        [1, 0, 0, 0],
    ]
];
const pieceColors = ['#FF6B6B', '#6BCB77', '#4D96FF', '#FFD93D', '#A66DD4', '#FF8E00'];


let currentPieces = [];
let currentPieceColors = [];
let gameRunning = true;
const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
let score = 0;

function runGame() {
    if (currentPieces.length < 1) {
        currentPieces = new3(); 
        renderPieces(currentPieces); 
    }
 
    renderBoard();

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
            
            setTimeout(() => {
                let clearedRows = clearRow();
                let clearedCols = clearCol();
                let totalCleared = clearedRows + clearedCols;
                let startScore = score;
                let scoreIncrement = calculateScore(piece, totalCleared);
                score += scoreIncrement;
                

                animateScore(startScore, score, 800);

                const pieceIndex = currentPieces.indexOf(piece);
                currentPieces = currentPieces.filter(p => p !== piece);
                currentPieceColors.splice(pieceIndex, 1);

                renderBoard();
                renderPieces(currentPieces);
                
                if (currentPieces.length === 0) {
                    currentPieces = new3();
                    renderPieces(currentPieces);
                }

                if (checkGameOver(board, currentPieces)) {
                    gameRunning = false;
                    showGameOver();
                    return;
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

function new3() {
    let piece1 = shapes[Math.floor(Math.random() * shapes.length)];
    let piece2 = shapes[Math.floor(Math.random() * shapes.length)];
    let piece3 = shapes[Math.floor(Math.random() * shapes.length)];
    
    currentPieceColors = [
        pieceColors[Math.floor(Math.random() * pieceColors.length)],
        pieceColors[Math.floor(Math.random() * pieceColors.length)],
        pieceColors[Math.floor(Math.random() * pieceColors.length)]
    ];
    
    return [piece1, piece2, piece3]
}



function canPlace(board, shape, startRow, startCol) {
    if (!shape || !Array.isArray(shape) || shape.length === 0 || !Array.isArray(shape[0])) {
        console.log("Invalid shape provided to canPlace");
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
                    console.log("You can't place shape here.")
                    return false;
                }

                if (board[boardRow][boardCol] !== 0) {
                    console.log("You can't place shape here.")
                    return false;
                }
            }
        }
    }

    console.log("You can place shape here.")
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
        for (let r=0; r < board[col].length; r++) {
            board[r][col] = 0
            boardColors[r][col] = null
        }
    })
    return numCleared
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
          cell.style.backgroundColor = '#666'; // fallback color
        }
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
        const pieceDiv = document.createElement('div');
        pieceDiv.classList.add('piece');
        pieceDiv.draggable = true;
        pieceDiv.dataset.pieceIndex = i;

        const pieceColor = currentPieceColors[i] || pieceColors[Math.floor(Math.random() * pieceColors.length)];
        pieceDiv.dataset.color = pieceColor;

        piece.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.style.display = 'flex';
            row.forEach(cell => {
                const block = document.createElement('div');
                block.classList.add('block');
                if (cell === 1) {
                    block.style.backgroundColor = pieceColor;
                }
                rowDiv.appendChild(block);
            });
            pieceDiv.appendChild(rowDiv);
        });

        pieceDiv.addEventListener('click', () => {
            selectedPiece = piece;
            document.querySelectorAll('.piece').forEach(p => p.classList.remove('selected'));
            pieceDiv.classList.add('selected');
        });

        pieceDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', i.toString());
            selectedPiece = piece;
            
            const rect = pieceDiv.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            
            window.selectedPieceColor = pieceColor;
            
            
            const dragImage = pieceDiv.cloneNode(true);
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            dragImage.style.left = '-1000px';
            dragImage.style.opacity = '0.8';
            dragImage.style.pointerEvents = 'none';
            document.body.appendChild(dragImage);
            
            e.dataTransfer.setDragImage(dragImage, dragOffsetX, dragOffsetY);
            
            
            setTimeout(() => {
                document.body.removeChild(dragImage);
            }, 0);
        });

        pieceDiv.addEventListener('dragend', () => {
            selectedPiece = null;
            window.selectedPieceColor = null;
        });

        piecesEl.appendChild(pieceDiv);
    });
}

function showGameOver() {
    console.log("game over!")
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
    runGame();
});

function handleClick(e) {
    if (!selectedPiece) {
        alert("Select a piece first!");
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
        cell.addEventListener('dragover', e => {
            e.preventDefault();
        });

        cell.addEventListener('drop', (e) => {
            e.preventDefault();
            const pieceIndex = parseInt(e.dataTransfer.getData('text/plain'));
            
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
    
    const gameOverScreen = document.getElementById('game-over-screen');
    if (gameOverScreen) {
        gameOverScreen.style.display = 'none';
    }
    
    renderBoard();
    currentPieces = new3();
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