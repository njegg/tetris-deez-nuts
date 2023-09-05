const H = 20;
const W = 10

const Tetramino = {
    "0": [0, 1, W, W + 1], // O
    "I": [-1, 0, 1, 2],    // I

    random() {
        return Object.values(Tetramino)
            .filter(x => typeof x === "object")
    }
}

const gravity = (level) => Math.pow((0.8 - (level-1) * 0.007), level-1) * 60

let frame = 0;
let frameSinceTetraminoMove = 999;
let level = 1;

let state = new Array(H * W).fill(false);
let table = document.getElementById('table');

let currentTetramino = Tetramino.random();
let currentTPos = 5;
let lastTPos = 0;

let inputQueue = [];

function main() {
    window.addEventListener(
        "keydown",
        (event) => {
            switch(event.key) {
                          case "w":
                case "a": case "s": case "d":
                
                          case " ":

                    inputQueue.push(event.key);
                    break;
            }
        }
    )

    // 60 FPS
    setInterval(gameLoop, 1 / 60 * 1000);
}

function gameLoop() {
    frame++;

    input();
    drawTable();

    if (frame % gravity(level) | 0 != 0) return; 

//     if (canMove(currentTPos + W)) {
//         // Clear state
//         currentTetramino
//             .forEach(x => state[x + lastTPos] = false);

//         lastTPos = currentTPos;
//         currentTPos += W;

//         // Move
//         currentTetramino
//             .forEach(x => state[x + currentTPos] = true);
//     } else {
//         currentTPos = 4;
//         currentTetramino = Tetramino.random();
//     }


    if (!tryMove(currentTPos + W)) {
        currentTPos = 4;
        currentTetramino = Tetramino.I;
    }

    drawTable()
}

function tryMove(pos) {
    // Clear state
    currentTetramino
        .forEach(x => state[x + currentTPos] = false);
    
    let canMoveToPos = currentTetramino
        .map(x => x + pos)
        .every(dx => dx >= 0 && dx < H * W && !state[dx]);

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
            case "a": currentTPos = currentTPos - 1;
        }
    }
}


function drawTable() {
    table.innerText = state.map((x, i) => {
        if ((i+1) % W == 0) return x ? '#\n' : '.\n'
        else                return x ? '#'  : '.'
    }).join(' ');

    // for (let y = 0; y < H; y++) {
    //     for (let x = 0; x < W; x++) {
    //        table.innerText += state[y * W + x] ? '# ' : '. ';
    //     }
    //     table.innerText += '\n';
    // }
}

main();

