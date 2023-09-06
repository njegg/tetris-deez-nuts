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
let lastTPos = 0;

let state = new Array(H * W).fill(false);
const NEXT_W = 5;
let nextTetraminoState = new Array(NEXT_W * NEXT_W).fill(false);
let nextTetraminoHTML = document.getElementById('next-tetramino');
let table = document.getElementById('table');

let inputQueue = [];


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
    )

    setInterval(gameLoop, 1 / 60 * 1000); // 60 FPS if pc fast // TODO: fix that
}

function gameLoop() {
    frame++;

    input();
    drawTable();

    if (frame % framesToDropTetramino[level] | 0 != 0) return; 

    if (!tryMove(currentTPos + W)) {
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

function tryMove(pos) {
    // Clear state
    currentTetramino
        .forEach(x => state[x + currentTPos] = false);
    
    let canMoveToPos = currentTetramino
        .map(x => x + pos)
        .every(dx => dx < H * W && !state[dx]);

    if (canMoveToPos) {
        currentTetramino
            .forEach(x => state[x + pos] = true);

        lastTPos = currentTPos;
        currentTPos = pos;
    } else {
        // Restore
        currentTetramino
            .forEach(x => state[x + currentTPos] = true);
    }

    return canMoveToPos;
}


function input() {
    while (inputQueue.length) {
        let key = inputQueue.pop();

        switch (key) {
            case "a": tryMove(currentTPos - 1); break;
            case "d": tryMove(currentTPos + 1); break;
            case "s": tryMove(currentTPos + W); break;
            case " ": drop(); break;
            case "r": rotate(); break;
        }
    }
}


// Cursed
function drop() {
    let bottom = (W * H) - (W - currentTPos % W)

    while (!tryMove(bottom)) bottom -= W;
}

// Cursed
function rotate() {
    currentTetramino.forEach(x => state[currentTPos + x] = false);

    currentTetramino = currentTetramino.map(x => {
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

    currentTetramino.forEach(x => state[currentTPos + x] = true);
}

function randomTetramino() {
    return tetraminos[Math.random() * tetraminos.length | 0];
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

    // for (let y = 0; y < H; y++) {
    //     for (let x = 0; x < W; x++) {
    //        table.innerText += state[y * W + x] ? '# ' : '. ';
    //     }
    //     table.innerText += '\n';
    // }
}

main();

