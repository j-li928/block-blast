const TILE_SIZE = 42;
const board = Array(8).fill(0).map(() => Array(8).fill(0));

const shapes = [
    [[1, 1, 1, 1, 1]],
    [[1, 1, 1, 1]],
    [[1, 1, 1]],
    [[1, 1]],
    [[1]],
    [
        [1, 1, 1],
        [1, 1, 0]
    ]
];

let currentPieces = [];
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
            placePiece(board, piece, startRow, startCol);
            let clearedRows = clearRow();
            let clearedCols = clearCol();
            let totalCleared = clearedRows + clearedCols;
            score = calculateScore(piece, totalCleared);
            scoreEl.textContent = score;

            currentPieces = currentPieces.filter(p => p !== piece);

            
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
        } else {
            
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
    return [piece1, piece2, piece3]
}



function canPlace(board, shape, startRow, startCol) {
    for (let r =0; r < shape.length; r++) {
        for (let c=0; c < shape.length; c++) {
            if (shape[r][c] === 1) {
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
        }
    })
    return numCleared
}



function checkGameOver(board, currentPieces) {
    for (let piece of currentPieces) {
        const pieceRows = piece.length;
        const pieceCols = piece[0].length;

        for (let r = 0; r <= 8 - pieceRows; r++) {
            for (let c = 0; c <= 8 - pieceCols; c++) {
                if (canPlace(board, piece, r, c)) {
                    return false;
                }
            }
        }
    }
    return true; 
}



function placePiece(board, shape, startRow, startCol) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            if (shape[r][c] === 1) {
                board[startRow + r][startCol + c] = 1;
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
      if (board[r][c] === 1) cell.classList.add('filled');
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

        piece.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.style.display = 'flex';
            row.forEach(cell => {
                const block = document.createElement('div');
                block.classList.add('block');
                if (cell === 1) block.classList.add('filled');
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
        });

        piecesEl.appendChild(pieceDiv);
    });
}

function showGameOver() {
    alert("Game Over!");
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
    score += pieceSize + bonus;
    return score
}
