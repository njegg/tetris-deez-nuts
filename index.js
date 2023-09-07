const H = 20;
const W = 10

const tetraminos = [
    [
        0,  1,
        W, W+1,         // 0: 'O'
    ],

    [-1, 0, 1, 2],      // 1: 'I'

    [
        -1, 0, 1,       // 2: 'T'
            W,
    ],

    [
            -W,
             0,         // 3: 'J'
        W-1, W,
    ],

    [
        -W,
         0,             // 4: 'L'
         W, W+1
    ],

    [
             0, 1,      // 5: 'S'
        W-1, W
    ],

    [
        -1, 0,          // 6: 'Z'
            W, W+1
    ]
];

const gravity = (level) => Math.pow((0.8 - (level-1) * 0.007), level-1) * 60;
const MAX_LEVEL = 32;
const framesToDropTetramino = Array(MAX_LEVEL + 1).fill(0).map((_, i) => gravity(i));

let frame = 0;
let frameSinceTetraminoMove = 999;
let level = 3;

let score = 0;
let scoreLines = [0, 1, 3, 5, 8];

let currentTetramino = randomTetramino();
let nextTetramino = randomTetramino();
let currentTPos = 5;

let state = new Array(H * W).fill(false);
const NEXT_W = 5;
let nextTetraminoState = new Array(NEXT_W * NEXT_W).fill(false);
let nextTetraminoHTML = document.getElementById('next-tetramino');
let table = document.getElementById('table');

let inputQueue = [];

const Move = Object.freeze({
    DOWN: W,
    LEFT: -1,
    RIGHT: 1,
    NONE: 0,
});

function main() {
    window.addEventListener(
        "keydown",
        (event) => {
            switch(event.key) {
                          case "w":           case "r":
                case "a": case "s": case "d":
                
                          case " ":

                    inputQueue.push(event.key);
                    break;
            }
        }
    );

    spawnNext();
    setInterval(gameLoop, 1 / 60 * 1000); // 60 FPS if pc fast // TODO: fix that
}

function gameLoop() {
    frame++;

    input();
    drawTable();

    if (frame % framesToDropTetramino[level] | 0 != 0) return; 

    if (!tryMove(Move.DOWN)) {
        spawnNext();
    }

    drawTable()
    drawNextTetramino();
}

function spawnNext() {
    clearLines();

    currentTPos = (W - 1) / 2 | 0;

    currentTetramino = nextTetramino;
    nextTetramino = randomTetramino();

    let canSpawn = currentTetramino
        .map(x => x + currentTPos)
        .every(dx => !state[dx]);

    if (!canSpawn) {
        alert("zuLa Luz LLLLLLLLLLLLL777");
        resetGame();
    }

    setState(true, Move.NONE);

    drawTable();
    drawNextTetramino();
}

function resetGame() {
    level = 1;
    score = 0;
    state.fill(false);
    spawnNext();
}

function clearLines() {
    let clearedLines = 0;

    for (let y = H-1; y >= 0; y--) {
        let clear = true;

        for (let x = 0; x < W; x++) {
            if (!state[y * W + x]) {
                clear = false;
                break;
            }
        }

        if (clear) {
            state.fill(false, y * W, y * W + W);

            // Push down
            for (let i = y * W + W - 1; i >= 0; i--) {
                state[i] = state[i - W];
            }

            clearedLines++;

            // Pushed down, repeat on the same line
            y++;
        }
    }

    updateScore(score + scoreLines[clearedLines]);
}

function updateScore(newScore) {
    score = newScore;
    
    level = score / 5 + 1 | 0;

    document.getElementById("score").innerText = score;
    document.getElementById("level").innerText = level;
}

function canBePlaced(tetramino, onPos) {
    return tetramino
        .map(x => x + onPos)
        .every(x => x < H * W && !state[x]);
}

/**
  * @param {Move} move - how much
  */
function tryMove(move) {
    setState(false, Move.NONE);
    
    let canMove = canBePlaced(currentTetramino, currentTPos + move);

    if (canMove) {
        // Move the center of the tetramino (0)
        currentTPos = getPositionInTableWithMove(0, move);
    }

    setState(true, Move.NONE);

    return canMove;
}

/**
  *  @param {boolean} draw - 'draws' tetramino to state table with false or true
  *  @param {Move} move - offset
  */
function setState(draw, move = Move.NONE) {
    currentTetramino
        .forEach(x => state[getPositionInTableWithMove(x, move)] = draw);
}

/**
* @description moves a single block of tetramino by some amount
* and moves overflows to correct row
* 
* @param {number} point
* @param {Move} move
*/
function getPositionInTableWithMove(point, move = Move.NONE) {
    let x = mod(currentTPos, W);
    let y = currentTPos / W | 0;

    let dx = move % W;
    let dy = move / W | 0;

    x = mod((x + dx), W);
    y = y + dy;


    let px = mod(point, W);
    let py = point / W | 0;

    if (point == -W+1) {
        px = 1;
        py = -1;
    } else if (point == W-1) {
        px = -1, py = 1;
    }

    x = mod((x + px), W);
    y = y + py;

    return y * W + x;
}

function mod(n, m) {
  return ((n % m) + m) % m;
}


function input() {
    while (inputQueue.length) {
        let key = inputQueue.pop();

        switch (key) {
            case "a": tryMove(Move.LEFT); break;
            case "d": tryMove(Move.RIGHT); break;
            case "s": tryMove(Move.DOWN); break;
            case " ": dropGliched(); break;
            case "r": rotate(); break;
        }
    }
}


/**
 * Calculates position bottom up
 */
function dropGliched() {
    let bottom = (W * H) - mod(W - currentTPos, W)

    setState(false, Move.NONE);

    while (!canBePlaced(currentTetramino, bottom)) bottom -= W;

    currentTPos = bottom;
    setState(true, Move.NONE);

    drawTable();
}

function rotate() {
    setState(false, Move.NONE);

    let rotated = currentTetramino.map(x => {
        switch (x) {
            case 0:    return 0;

            case 1:    return W;
            case W:    return -1;
            case -1:   return -W;
            case -W:   return 1;

            case W+1:  return W-1;
            case W-1:  return -W-1;
            case -W-1: return -W+1;
            case -W+1: return W+1;

            case 2:    return 2*W;
            case 2*W:  return -2;
            case -2:   return -2*W;
            case -2*W: return 2; 
            default: throw new Error(`you forgot the ${x}`);
        }
    });

    if (canBePlaced(rotated, currentTPos)) {
        currentTetramino = rotated;
    }

    setState(true, Move.NONE);
}

function randomTetramino() {
    return tetraminos[4];
    // return tetraminos[Math.random() * tetraminos.length | 0];
}

function drawNextTetramino() {
    let shiftToCenter = NEXT_W * NEXT_W / 2 | 0

    nextTetraminoState.fill(false);

    nextTetramino.forEach(x => {
        switch (x) {
            case W: x = NEXT_W; break;
            case -W: x = -NEXT_W; break;
            case W+1: x = NEXT_W+1; break;
            case W-1: x = NEXT_W-1; break;
        }

        nextTetraminoState[x + shiftToCenter] = true;
    })

    nextTetraminoHTML.innerText = nextTetraminoState.map((x, i) => {
        if ((i+1) % NEXT_W == 0) return x ? '#\n' : '.\n'
        else                     return x ? '# ' : '. '
    }).join('');
}

function drawTable() {
    table.innerText = state.map((x, i) => {
        if ((i+1) % W == 0) return x ? '#\n' : '.\n'
        else                return x ? '# ' : '. '
    }).join('');
}

main();

