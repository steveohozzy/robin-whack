const gameContainer = document.getElementById("game");
const robin = document.getElementById("robin");
const holesContainer = document.getElementById("holes");
const timerDisplay = document.getElementById("timer");

const holes = [];
const cols = 4;

let score = 0;
let timeLeft = 60;
let gameRunning = false;
let gameStarted = false;

let x = window.innerWidth / 2;
let facing = 1;
let pecking = false;

const timerLoop = setInterval(() => {
    if(!gameRunning || !gameStarted) return;
    timeLeft--;
    timerDisplay.textContent = "⏱ " + timeLeft;

    if(timeLeft <= 0){
        endGame();
    }
}, 1000);

function startGame(){
    gameStarted = true;
    gameRunning = true;
    document.getElementById("startScreen").style.display = "none";
}

function addScore(points = 1){
    score += points;
    document.getElementById("scoreValue").textContent = score;
}

function applyPowerUp(type){
    if(type === "golden"){
        timeLeft += 5;
        timerDisplay.textContent = "⏱ " + timeLeft;
        showBonusText("+5s ⏱️", "#72ff72");
    }
}

function showBonusText(text, color){
    const popup = document.createElement("div");
    popup.textContent = text;
    popup.style.position = "absolute";
    popup.style.left = x + "px";
    popup.style.bottom = "200px";
    popup.style.fontSize = "22px";
    popup.style.fontWeight = "bold";
    popup.style.zIndex = "10";
    popup.style.color = color;
    popup.style.animation = "floatScore 1s forwards";
    document.getElementById("game").appendChild(popup);
    setTimeout(()=> popup.remove(), 1000);
}

function endGame(){
    gameRunning = false;
    document.getElementById("finalScore").textContent = score;
    document.getElementById("gameOver").style.display = "block";
}

function targetHole(hole) {
    if(!gameRunning || pecking) return;

    facing = hole.x > x ? 1 : -1;
    x = hole.x;
    
    robin.style.setProperty("--dir", facing);
    robin.style.left = x + "px";

    pecking = true;
    robin.classList.add("peck");

    setTimeout(() => {
        if(hole.occupied) {
            hole.worm.classList.remove("up");
            hole.worm.classList.add("caught");
            hole.occupied = false;

            addScore(hole.points);
            applyPowerUp(hole.type);

            setTimeout(() => { hole.worm.classList.remove("caught"); }, 400);
            showPoints(hole.x, hole.bottom, hole.points);
        }
    }, 90);

    setTimeout(() => {
        robin.classList.remove("peck");
        pecking = false;
    }, 180);
}

function showPoints(x, y, points = 1){
    const popup = document.createElement("div");
    popup.textContent = `+${points} ⭐`;
    popup.style.position = "absolute";
    popup.style.left = x + "px";
    popup.style.bottom = (y + 40) + "px";
    popup.style.fontSize = "22px";
    popup.style.fontWeight = "bold";
    popup.style.zIndex = "10";
    popup.style.color = points > 1 ? "gold" : "#fff";
    popup.style.animation = "floatScore .8s forwards";

    document.getElementById("game").appendChild(popup);
    setTimeout(() => { popup.remove(); }, 800);
}

// SNOW GENERATOR
for(let i = 0; i < 70; i++){
    const snow = document.createElement("div");
    snow.className = "flake";
    snow.style.left = Math.random() * 100 + "vw";
    const size = 2 + Math.random() * 5;
    snow.style.width = size + "px";
    snow.style.height = size + "px";
    snow.style.animationDuration = 6 + Math.random() * 10 + "s";
    snow.style.animationDelay = -Math.random() * 15 + "s";
    document.getElementById("snow").appendChild(snow);
}

// PURE CSS WORM HTML GENERATOR
function createWormHTML() {
    return `
    <div class="worm-container-inner">
        <div class="head-band"></div>
        <div class="head"></div>
        <div class="eye eye1"></div>
        <div class="eye eye2"></div>
        <div class="mouth"></div>
        <div class="worm-body">
            <div class="segment s1"></div>
            <div class="segment s2"></div>
            <div class="segment s3"></div>
            <div class="segment s4"></div>
            <div class="segment s5"></div>
            <div class="segment s6"></div>
        </div>
    </div>`;
}

// CREATE 4 HOLES & HITAREAS
for(let col = 0; col < cols; col++){
    const hitArea = document.createElement("div");
    hitArea.className = "hole-hitarea";

    const hole = document.createElement("div");
    hole.className = "hole";
    hitArea.appendChild(hole);

    const wormWrapper = document.createElement("div");
    wormWrapper.className = "worm-wrapper normal";
    wormWrapper.innerHTML = createWormHTML();
    hole.appendChild(wormWrapper);

    holesContainer.appendChild(hitArea);

    const holeData = {
        hitArea: hitArea,
        worm: wormWrapper,
        x: 0,
        bottom: 0,
        occupied: false,
        type: "normal",
        points: 1
    };

    hitArea.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        targetHole(holeData);
    });

    holes.push(holeData);
}

function resizeGame(){
    const isLandscape = window.innerWidth > window.innerHeight;
    
    let scale = Math.min(window.innerWidth / (isLandscape ? 900 : 650), 1);
    if (isLandscape && window.innerHeight < 450) {
        scale *= 0.75;
    }
    document.documentElement.style.setProperty("--scale", scale);

    const margin = window.innerWidth * 0.16;
    const spacingX = (window.innerWidth - margin * 2) / (cols - 1);
    
    const groundBottom = isLandscape ? 5 : 10;
    const groundHeight = isLandscape ? 150 : 240;
    const totalGroundOffset = (groundBottom + groundHeight) * scale;

    // Matched precisely to the deeper wavy snow layer peaks
    const hillOffsets = [32, 22, 28, 20];
    const holeDrop = isLandscape ? 45 : 85;
    const robinDrop = isLandscape ? 75 : 115;

    holes.forEach((hole, i) => {
        hole.x = margin + i * spacingX;
        hole.hitArea.style.left = hole.x + "px";
        
        const hillOffset = (hillOffsets[i] || 25) * scale;
        
        hole.bottom = totalGroundOffset - hillOffset - (holeDrop * scale);
        hole.hitArea.style.bottom = hole.bottom + "px";
    });

    robin.style.left = x + "px";
    robin.style.bottom = (totalGroundOffset - (robinDrop * scale)) + "px";
}

resizeGame();
window.addEventListener("resize", resizeGame);

function getCurrentUpTime(){
    const clampedTime = Math.max(0, Math.min(60, timeLeft));
    const progress = clampedTime / 60;
    return 550 + (950 * progress);
}

function spawnWorm(){
    if(!gameRunning || !gameStarted) return;

    const available = holes.filter(h => !h.occupied);
    if(!available.length) return;

    const hole = available[Math.floor(Math.random() * available.length)];
    let chance = Math.random();

    if(chance < 0.05){          // Golden
        hole.type = "golden";
        hole.points = 3;
    } else if(chance < 0.15){   // Fast
        hole.type = "fast";
        hole.points = 2;
    } else {                    // Normal Pink
        hole.type = "normal";
        hole.points = 1;
    }

    hole.worm.className = "worm-wrapper " + hole.type + " up";
    hole.occupied = true;

    let disappearTime = getCurrentUpTime();
    if(hole.type === "fast") disappearTime *= 0.55;

    setTimeout(() => {
        hole.worm.classList.remove("up");
        hole.occupied = false;
    }, disappearTime);
}

function restartGame(){
    score = 0;
    timeLeft = 60;
    gameRunning = true;

    document.getElementById("scoreValue").textContent = score;
    timerDisplay.textContent = "⏱ " + timeLeft;
    document.getElementById("gameOver").style.display = "none";

    holes.forEach(hole => {
        hole.occupied = false;
        hole.worm.classList.remove("up", "caught");
    });
}

setInterval(spawnWorm, 650);