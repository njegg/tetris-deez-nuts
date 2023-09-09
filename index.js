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
let frameSinceTetraminoMove = 0;
let level = 1;

let score = 0;
const scoreLines = [0, 1, 3, 5, 8];

const SPAWN = (W - 1) / 2 | 0;

let currentTetramino = randomTetramino();
let nextTetramino = randomTetramino();
let currentPos = 5;

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

let drop = dropNormal;
let getBlockPosition = getBlockPositionNormal;

class Glitch {
    isUnlocked = false;
    isActive = false;
    
    /**
     * @param {string} name
     * @param {number} price
     * @param {boolean} toggleable
     * @param {(alreadyActive: boolean) => void} onActivate
     **/
    constructor(name, price, toggleable, onActivate) {
        this.name = name;
        this.price = price;
        this.toggleable = toggleable;

        this.onActivate = onActivate;

        /** @param {HTMLInputElement} checkbox */
        this.activate = (checkbox) => {
            if (!this.isUnlocked && score < this.price) { // you broke
                checkbox.checked = false;
                return;
            }

            if (!this.isUnlocked) { // has mone
                this.isUnlocked = true;
                this.isActive = true;

                updateScoreAndLevel(score - this.price);

                this.onActivate(false);

                return;
            }

            
            if (!toggleable) { // Already unlocked, cant deactivate
                checkbox.checked = true;
                return;
            }

            this.onActivate(this.isActive);
            this.isActive = !this.isActive;
        }
    }
}

const glitches = [
    new Glitch("wall_hack", 5, true, (alreadyActive) => {
        drop = alreadyActive ? dropNormal : dropGlitched;
    }),

    new Glitch("overflow", 5, false, (_) => {
        getBlockPosition = getBlockPositionOverflow;
    }),
];

const glitchShopElement = document.getElementById("glitch-shop");

/* <span class="checkbox">
        <input
            type="checkbox"
            id="name"
            onchange="f(this)"
        />
        <label for="name">name</label>
    </span>
    <span>$price</span> */
glitches.forEach(g => {
    let checkboxContainer = document.createElement("span");
    checkboxContainer.classList.add("checkbox");

    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = g.name;
    checkbox.addEventListener("change", () => { g.activate(checkbox) }  , false)

    let label = document.createElement("label");
    label.htmlFor = g.name;
    label.innerText = g.name;

    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(label);

    let price = document.createElement("span");
    price.innerHTML = `$${g.price}`;

    glitchShopElement.appendChild(checkboxContainer);
    glitchShopElement.appendChild(price);
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

    if (window.isMobile()) {
        showMobileControls();
    }

    resetGame();

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

    currentPos = SPAWN;

    currentTetramino = nextTetramino;
    nextTetramino = randomTetramino();

    let canSpawn = currentTetramino
        .map(x => x + currentPos)
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
    checkHighScore();

    updateScoreAndLevel(0);

    state.fill(false);

    currentPos = SPAWN;
    nextTetramino = randomTetramino();
    currentTetramino = randomTetramino();

    drop = dropNormal;
    wallHackActive = false;
    wallHackUnlocked = false;

    getBlockPosition = getBlockPositionNormal;
    overflowUnlocked = false;

    resetCheckboxes();
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

    updateScoreAndLevel(score + scoreLines[clearedLines]);
}


function updateScoreAndLevel(newScore) {
    score = newScore;
    
    level = score / 5 + 1 | 0;

    document.getElementById("score").innerText = score;
    document.getElementById("level").innerText = level;
}


function checkHighScore() {
    let highScore = +localStorage.getItem("highScore");

    if (score >= highScore) {
        localStorage.setItem("highScore", score);
        highScore = score;
    }

    document.getElementById("high-score").innerText = highScore;
}


function currentCanMove(move, position = currentPos, tetramino = currentTetramino) {
    return tetramino
        .map(x => getBlockPosition(x, move, position))
        .every(x => x < H * W && !state[x]);
}


/**
  * @param {Move} move
  */
function tryMove(move) {
    setState(false);
    
    let canMove = currentCanMove(move);

    if (canMove) {
        // Move the center of the tetramino (0)
        // Doing += move doesnt consider x overflow
        currentPos = getBlockPosition(0, move);
    }

    setState(true);

    return canMove;
}

/**
 *  @param {boolean} draw - 'draws' tetramino to state table with false or true
 *  @param {Move} move - offset
 **/
function setState(draw, move = Move.NONE) {
    currentTetramino.forEach(x => state[getBlockPosition(x, move)] = draw);
}

/**
 * 
 * Moves a single block of tetramino by some amount
 * Also moves overflows to correct row and returns the final position
 * 
 * @param {number} point
 * @param {Move} move
 * 
 **/
function getBlockPositionOverflow(point, move = Move.NONE, tetraminoPos = currentPos) {
    // Center position x, y
    let cx = mod(tetraminoPos, W);
    let cy = tetraminoPos / W | 0;

    let dx = move % W;
    let dy = move / W | 0;

    let px = mod(point, W);
    let py = point / W | 0;

    // Hardcoded edge cases i dont know how to fix
    if (point == -W+1) {
        px = 1;
        py = -1;
    } else if (point == W-1) {
        px = -1;
        py = 1;
    }

    // Adding point offset to move
    dx += px;
    dy += py;

    // Adding offsets to center position
    let x = mod((dx + cx), W);
    let y = cy + dy;

    return y * W + x;
}

/**
 *
 * No overflow, walls on the sides
 * 
 * @param {number} point
 * @param {Move} move
 * @param {number} tetraminoPos
 *
 * @returns position in state table if legal, otherwise something illegal >W*H
 *
 **/
function getBlockPositionNormal(point, move = Move.NONE, tetraminoPos = currentPos) {
    let dx = point % W;
    let cx = tetraminoPos % W;

    switch (point) {
        case W-1: dx = -1; break;
        case W+1: dx = +1; break;
        case -W-1: dx = -1; break;
        case -W+1: dx = +1; break;
    }

    dx += move % W;

    if (cx + dx < 0 || cx + dx >= W) return 69420;

    return point + move + tetraminoPos;
}



/**
 * 
 * Modulo that works better with negative numbers 
 * 
 * @param {number} n
 * @param {number} m
 * 
 **/
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
            case " ": drop(); break;
            case "r": rotate(); break;
        }
    }
}


function dropNormal() {
    setState(false);

    while (currentCanMove(Move.DOWN)) {
        currentPos += W;
    }

    setState(true);

    drawTable();
}


/**
 *
 * Finds a drop position bottom up
 *
 **/
function dropGlitched() {
    let bottom = (W * H) - mod(W - currentPos, W)

    setState(false, Move.NONE);

    while (!currentCanMove(Move.NONE, bottom)) bottom -= W;

    currentPos = bottom;
    setState(true, Move.NONE);

    drawTable();
}

function rotate() {
    setState(false);

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

    if (currentCanMove(Move.NONE, currentPos, rotated)) {
        currentTetramino = rotated
    }

    setState(true);
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
}

function resetCheckboxes() {
    for (let span of document.getElementsByClassName("checkbox")) {
        for (let checkbox of  span.getElementsByTagName("input")) {
            checkbox.checked = false;
        }
    }
}


function showMobileControls() {
    document.getElementById("mobile-controls").style = "display: grid";
    document.getElementById("pc-controls").style = "display: none";
}


function mobileInput(button) {
    inputQueue.push(button.name);
}


main();

