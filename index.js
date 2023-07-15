const H = 20;
const W = 10

const Tetraminos = {
    "O": [0, 1, W, W + 1]
}


let frame = 0;
let state = new Array(H * W).fill(false);
let table = document.getElementById('table');


let currentTetramino = Tetraminos.O;
let currentTPos = 3;
let lastTPos = 3;

function main() {
    setInterval(gameLoop, 100);
}

function gameLoop() {
    frame++;
    
    lastTPos = currentTPos;
    currentTPos += W;

    currentTetramino
        .forEach(x => state[x + lastTPos] = false)

    let canDraw = currentTetramino
        .map(x => x + currentTPos)
        .every(x => x >= 0 && x < H * W && !state[x]);

    if (canDraw) {

        currentTetramino
            .forEach(x => state[x + currentTPos] = true)
    }


    table.innerText = '';
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
           table.innerText += state[y * W + x] ? '# ' : '. ';
        }
        table.innerText += '\n';
    }
}

main();

